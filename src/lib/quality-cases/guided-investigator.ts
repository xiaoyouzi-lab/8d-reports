import { createHash } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  qualityCaseGuidanceAiRuns,
  qualityCaseGuidanceAnswers,
  qualityCaseGuidanceEvidenceRequirements,
  qualityCaseGuidanceFieldMappings,
  qualityCaseGuidanceInsights,
  qualityCaseGuidanceQuestions,
  qualityCaseGuidanceSessions,
} from "@/lib/db/schema";
import {
  getGuidedFollowUps,
  getGuidedMappings,
  getGuidedQualityInsights,
  type AiConfidence,
  type GuidedAnswerCategory,
  type GuidedStage,
  type QualityConcept,
} from "@/lib/quality-cases/guided-contract";

export const GUIDED_INVESTIGATOR_PROMPT_ID = "guided-investigator";
export const GUIDED_INVESTIGATOR_PROMPT_VERSION = "v1";
export const GUIDED_INVESTIGATOR_SCHEMA_VERSION = "guided-investigator-v1";

export type GuidedInvestigationState =
  | "collecting_problem"
  | "collecting_containment"
  | "investigating_occurrence"
  | "investigating_escape"
  | "planning_corrective_action"
  | "planning_verification_and_prevention";

const STAGE_STATE: Record<GuidedStage, GuidedInvestigationState> = {
  problem_description: "collecting_problem",
  containment: "collecting_containment",
  occurrence_cause: "investigating_occurrence",
  escape_cause: "investigating_escape",
  corrective_action: "planning_corrective_action",
  verification_and_prevention: "planning_verification_and_prevention",
};

type ModelResponse = {
  schemaVersion: typeof GUIDED_INVESTIGATOR_SCHEMA_VERSION;
  answerRestatement?: string;
  confidence: AiConfidence;
  missingConcepts: QualityConcept[];
  nextQuestion: string;
  whyAsked: string;
  insight?: { kind: "missing_information" | "logic_risk" | "verification_suggestion"; message: string };
};

export interface GuidedInvestigatorAiClient {
  investigate(input: { prompt: string }): Promise<unknown>;
}

export class GuidedInvestigatorError extends Error {
  constructor(message: string, public readonly status = 502) {
    super(message);
    this.name = "GuidedInvestigatorError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown, max = 1800) {
  return typeof value === "string" ? value.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max) : "";
}

function isConfidence(value: unknown): value is AiConfidence {
  return value === "low" || value === "medium" || value === "high";
}

function isConcept(value: unknown): value is QualityConcept {
  return typeof value === "string" && [
    "problem_symptom", "problem_scope", "problem_discovery", "containment_action", "containment_scope",
    "occurrence_root_cause", "escape_root_cause", "process_control", "detection_improvement",
    "permanent_corrective_action", "implementation_plan", "effectiveness_verification_plan",
    "effectiveness_verification_result", "recurrence_prevention", "horizontal_deployment", "lessons_learned",
  ].includes(value);
}

/** Reject report-writing and workflow-shaped output before it can be persisted/displayed. */
export function validateGuidedInvestigatorResponse(value: unknown): { success: true; data: ModelResponse } | { success: false; issues: string[] } {
  const issues: string[] = [];
  if (!isRecord(value)) return { success: false, issues: ["response must be an object"] };
  if (value.schemaVersion !== GUIDED_INVESTIGATOR_SCHEMA_VERSION) issues.push("schemaVersion is invalid");
  if (!isConfidence(value.confidence)) issues.push("confidence is invalid");
  if (!Array.isArray(value.missingConcepts) || !value.missingConcepts.every(isConcept)) issues.push("missingConcepts is invalid");
  if (!text(value.nextQuestion)) issues.push("nextQuestion is required");
  if (!text(value.whyAsked)) issues.push("whyAsked is required");
  for (const forbidden of ["rootCause", "confirmedRootCause", "reportPatch", "workflowAction", "approved", "closeCase"]) {
    if (forbidden in value) issues.push(`${forbidden} is not permitted`);
  }
  if (value.insight !== undefined && (!isRecord(value.insight) || !["missing_information", "logic_risk", "verification_suggestion"].includes(String(value.insight.kind)) || !text(value.insight.message))) {
    issues.push("insight is invalid");
  }
  const insight = isRecord(value.insight)
    ? { kind: value.insight.kind as "missing_information" | "logic_risk" | "verification_suggestion", message: text(value.insight.message) }
    : undefined;
  return issues.length ? { success: false, issues } : {
    success: true,
    data: {
      schemaVersion: GUIDED_INVESTIGATOR_SCHEMA_VERSION,
      answerRestatement: text(value.answerRestatement) || undefined,
      confidence: value.confidence as AiConfidence,
      missingConcepts: value.missingConcepts as QualityConcept[],
      nextQuestion: text(value.nextQuestion),
      whyAsked: text(value.whyAsked),
      insight,
    },
  };
}

export function buildGuidedInvestigatorPrompt(input: {
  stage: GuidedStage;
  category: GuidedAnswerCategory;
  currentQuestion: string;
  answer: string;
  priorAnswers: readonly string[];
}) {
  return `You are an AI Quality Investigator guiding a non-specialist through a quality investigation in Chinese. You are not a report writer or approver. Use only supplied answers. Never state or confirm a root cause, evidence, date, test result, approval, customer acceptance, or closure. Treat “operator error” as a direct cause and ask about process controls and detection. Treat training-only or inspection-only actions as potentially insufficient and ask about durable prevention. Ask one focused plain-language next question.\n\nReturn JSON only:\n{"schemaVersion":"guided-investigator-v1","answerRestatement":"","confidence":"low|medium|high","missingConcepts":["quality concept ids only"],"nextQuestion":"","whyAsked":"","insight":{"kind":"missing_information|logic_risk|verification_suggestion","message":""}}\n\nCurrent stage: ${input.stage}\nAnswer category: ${input.category}\nCurrent question: ${input.currentQuestion}\nUser's exact current answer: ${input.answer}\nEarlier user answers (may be empty): ${input.priorAnswers.map((item, index) => `${index + 1}. ${item}`).join("\n") || "None"}`;
}

export class DeepSeekGuidedInvestigatorAiClient implements GuidedInvestigatorAiClient {
  async investigate(input: { prompt: string }): Promise<unknown> {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) throw new GuidedInvestigatorError("AI Quality Investigator is not configured", 503);
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(25_000),
      body: JSON.stringify({ model: "deepseek-chat", messages: [{ role: "user", content: input.prompt }], max_tokens: 900, temperature: 0.1, response_format: { type: "json_object" } }),
    }).catch(() => { throw new GuidedInvestigatorError("AI Quality Investigator is temporarily unavailable"); });
    if (!response.ok) throw new GuidedInvestigatorError("AI Quality Investigator is temporarily unavailable");
    const content = (await response.json().catch(() => null))?.choices?.[0]?.message?.content;
    if (typeof content !== "string") throw new GuidedInvestigatorError("AI Quality Investigator returned no JSON");
    try { return JSON.parse(content); } catch { throw new GuidedInvestigatorError("AI Quality Investigator returned invalid JSON"); }
  }
}

export const guidedInvestigatorAiClient = new DeepSeekGuidedInvestigatorAiClient();

export async function runGuidedInvestigator(input: {
  caseId: string;
  sessionId: string;
  questionId: string;
  answerId: string;
  actorId: string;
  client?: GuidedInvestigatorAiClient;
}) {
  const [session] = await db.select().from(qualityCaseGuidanceSessions).where(and(eq(qualityCaseGuidanceSessions.id, input.sessionId), eq(qualityCaseGuidanceSessions.caseId, input.caseId))).limit(1);
  const [question] = await db.select().from(qualityCaseGuidanceQuestions).where(and(eq(qualityCaseGuidanceQuestions.id, input.questionId), eq(qualityCaseGuidanceQuestions.sessionId, input.sessionId), eq(qualityCaseGuidanceQuestions.caseId, input.caseId))).limit(1);
  const [answer] = await db.select().from(qualityCaseGuidanceAnswers).where(and(eq(qualityCaseGuidanceAnswers.id, input.answerId), eq(qualityCaseGuidanceAnswers.questionId, input.questionId), eq(qualityCaseGuidanceAnswers.sessionId, input.sessionId), eq(qualityCaseGuidanceAnswers.caseId, input.caseId))).limit(1);
  if (!session || !question || !answer) throw new GuidedInvestigatorError("Guided investigation input was not found", 404);
  const category = question.category as GuidedAnswerCategory;
  const stage = question.stage as GuidedStage;
  const priorAnswers = await db.select({ originalText: qualityCaseGuidanceAnswers.originalText }).from(qualityCaseGuidanceAnswers).where(and(eq(qualityCaseGuidanceAnswers.sessionId, input.sessionId), eq(qualityCaseGuidanceAnswers.caseId, input.caseId)));
  const prompt = buildGuidedInvestigatorPrompt({ stage, category, currentQuestion: text(question.userFacingQuestion, 1800), answer: text(answer.originalText, 6000), priorAnswers: priorAnswers.filter((item) => item.originalText !== answer.originalText).map((item) => text(item.originalText, 1600)).slice(-8) });
  const promptInputHash = createHash("sha256").update(prompt).digest("hex");
  const [run] = await db.insert(qualityCaseGuidanceAiRuns).values({ caseId: input.caseId, sessionId: input.sessionId, agentType: "investigator", sourceType: "deepseek", promptIdentifier: GUIDED_INVESTIGATOR_PROMPT_ID, promptVersion: GUIDED_INVESTIGATOR_PROMPT_VERSION, promptInputHash, modelIdentifier: "deepseek-chat", response: {}, confidence: "low", requestMetadata: { answerId: input.answerId }, policyOutcome: "pending" }).returning();
  try {
    const raw = await (input.client || guidedInvestigatorAiClient).investigate({ prompt });
    const validated = validateGuidedInvestigatorResponse(raw);
    if (!validated.success) throw new GuidedInvestigatorError("AI Quality Investigator returned an unsafe response");
    const requiredFollowUps = getGuidedFollowUps({ category, originalAnswer: answer.originalText });
    const allowedConcepts = new Set(question.qualityConcepts as QualityConcept[]);
    const missingConcepts = validated.data.missingConcepts.filter((concept) => allowedConcepts.has(concept));
    const nextQuestion = requiredFollowUps[0]?.question || validated.data.nextQuestion;
    const whyAsked = requiredFollowUps[0]?.explanation || validated.data.whyAsked;
    const [next] = await db.insert(qualityCaseGuidanceQuestions).values({ caseId: input.caseId, sessionId: input.sessionId, aiRunId: run.id, questionKey: `ai_follow_up:${run.id}`, questionVersion: GUIDED_INVESTIGATOR_PROMPT_VERSION, sourceType: "ai_investigator", stage, category, userFacingQuestion: nextQuestion, explanation: whyAsked, qualityConcepts: missingConcepts, followUpRuleIds: requiredFollowUps.map((rule) => rule.id), evidenceRequirementIds: requiredFollowUps.flatMap((rule) => rule.evidenceRequirementIds || []) }).returning();
    const insights = [...getGuidedQualityInsights({ category, originalAnswer: answer.originalText }), ...(validated.data.insight ? [{ id: "model", kind: validated.data.insight.kind, severity: "info" as const, affectedConcepts: missingConcepts, message: validated.data.insight.message, reportEligibility: "advisory_only" as const, mayTransitionCase: false as const, evidenceRequirementIds: [] }] : [])];
    await db.update(qualityCaseGuidanceAiRuns).set({ response: raw, confidence: validated.data.confidence, policyOutcome: "accepted" }).where(eq(qualityCaseGuidanceAiRuns.id, run.id));
    for (const insight of insights) await db.insert(qualityCaseGuidanceInsights).values({ caseId: input.caseId, sessionId: input.sessionId, aiRunId: run.id, answerId: input.answerId, insightKey: insight.id, kind: insight.kind, severity: insight.severity, sourceType: "ai_investigator", message: insight.message, suggestedQuestion: insight.suggestedQuestion || null, affectedConcepts: insight.affectedConcepts, evidenceRequirementIds: insight.evidenceRequirementIds, confidence: validated.data.confidence });
    for (const requirementId of new Set(requiredFollowUps.flatMap((rule) => rule.evidenceRequirementIds || []))) {
      await db.insert(qualityCaseGuidanceEvidenceRequirements).values({ caseId: input.caseId, sessionId: input.sessionId, questionId: next.id, answerId: input.answerId, aiRunId: run.id, requirementKey: requirementId, sourceType: "ai_investigator", reason: "AI Investigator requested supporting evidence for the follow-up question.", requirementSnapshot: { requirementId } });
    }
    for (const mapping of getGuidedMappings({ category, concepts: missingConcepts })) await db.insert(qualityCaseGuidanceFieldMappings).values({ caseId: input.caseId, sessionId: input.sessionId, answerId: input.answerId, qualityConcept: mapping.concept, semanticKey: mapping.target.semanticKey, targetReference: mapping.target, decision: "proposed" });
    return { runId: run.id, state: STAGE_STATE[stage], answerRestatement: validated.data.answerRestatement, nextQuestion: next, mandatoryFollowUpIds: requiredFollowUps.map((rule) => rule.id), mayTransitionCase: false as const };
  } catch (error) {
    await db.update(qualityCaseGuidanceAiRuns).set({ policyOutcome: error instanceof GuidedInvestigatorError ? "rejected_or_failed" : "provider_failed" }).where(eq(qualityCaseGuidanceAiRuns.id, run.id)).catch(() => {});
    throw error instanceof GuidedInvestigatorError ? error : new GuidedInvestigatorError("AI Quality Investigator is temporarily unavailable");
  }
}
