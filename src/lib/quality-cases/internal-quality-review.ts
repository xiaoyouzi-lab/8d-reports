import { createHash, randomUUID } from "node:crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  qualityCaseActivities,
  qualityCaseGuidanceAiRuns,
  qualityCaseGuidanceAnswers,
  qualityCaseGuidanceConfirmations,
  qualityCaseGuidanceFieldMappings,
  qualityCaseGuidanceQuestions,
  qualityCaseParticipants,
  qualityCases,
} from "@/lib/db/schema";
import { getQualityCaseAccess } from "@/lib/quality-cases/access";
import { createQualityCaseTask } from "@/lib/quality-cases/external-tasks";
import {
  getGuidedMappings,
  type GuidedAnswerCategory,
  type GuidedOutputSemanticKey,
} from "@/lib/quality-cases/guided-contract";
import type { SupplierResponsePackage } from "@/lib/quality-cases/supplier-response-package";
import { transitionQualityCase } from "@/lib/quality-cases/service";

export const QUALITY_REVIEW_PROMPT_ID = "supplier-response-quality-review";
export const QUALITY_REVIEW_PROMPT_VERSION = "v1";
export const QUALITY_REVIEW_SCHEMA_VERSION = "quality-review-v1";

const SEMANTIC_KEYS: readonly GuidedOutputSemanticKey[] = [
  "complaint_summary",
  "containment",
  "occurrence_analysis",
  "escape_analysis",
  "corrective_action",
  "implementation_plan",
  "effectiveness_verification",
  "preventive_action",
  "lessons_learned",
];
const DIRECT_CAUSE_PATTERN =
  /(?:员工|操作员|人为|检验员).{0,10}(?:错误|失误|疏忽|装错|漏检)|(?:operator|human)\s+error/i;
const TRAINING_PATTERN = /培训|提醒|加强管理|training|retrain|remind/i;
const DURABLE_CONTROL_PATTERN =
  /流程|工装|夹具|防错|互锁|自动|程序|标准|参数|扫码|process|fixture|poka|interlock|automation|standard/i;

function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function safeText(value: unknown, maximum = 4000) {
  return typeof value === "string"
    ? value.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, maximum)
    : "";
}

function stringList(value: unknown, maximum = 30) {
  return Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === "string")
        .map((item) => safeText(item, 500))
        .filter(Boolean)
        .slice(0, maximum)
    : [];
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

export class InternalQualityReviewError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
  ) {
    super(message);
    this.name = "InternalQualityReviewError";
  }
}

export type QualityReviewFindingStatus =
  | "complete"
  | "attention"
  | "needs_confirmation"
  | "missing_evidence";

export interface QualityReviewFinding {
  id: string;
  area:
    | "problem_definition"
    | "containment"
    | "root_cause"
    | "corrective_action"
    | "verification";
  status: QualityReviewFindingStatus;
  title: string;
  reason: string;
  sourceAnswerIds: string[];
  evidenceIds: string[];
}

export interface QualityReviewResult {
  schemaVersion: typeof QUALITY_REVIEW_SCHEMA_VERSION;
  packageId: string;
  advisoryOnly: true;
  mayTransitionCase: false;
  findings: QualityReviewFinding[];
  risks: string[];
  missingEvidence: Array<{
    requirementId: string;
    requirement: string;
    reason: string;
    stage: string | null;
  }>;
  suggestedQuestions: string[];
  recommendedNextAction:
    | "request_supplier_update"
    | "accept_for_customer_preparation"
    | "review_manually";
  generatedBy: "deterministic_quality_rules" | "ai_quality_reviewer" | "deterministic_fallback";
  confidence: "low" | "medium" | "high";
  generatedAt: string;
}

function stageAnswers(packageValue: SupplierResponsePackage, stage: string) {
  return packageValue.investigation.currentAnswers.filter(
    (answer) => answer.stage === stage,
  );
}

/**
 * Conservative baseline review. It identifies common weaknesses but never
 * decides that a root cause, action, or customer outcome is approved.
 */
export function reviewSupplierResponsePackage(
  packageValue: SupplierResponsePackage,
  now = new Date(),
): QualityReviewResult {
  const findings: QualityReviewFinding[] = [];
  const risks: string[] = [];
  const suggestedQuestions: string[] = [];
  const problemAnswers = stageAnswers(packageValue, "problem_description");
  const containmentAnswers = stageAnswers(packageValue, "containment");
  const occurrenceAnswers = stageAnswers(packageValue, "occurrence_cause");
  const escapeAnswers = stageAnswers(packageValue, "escape_cause");
  const correctiveAnswers = stageAnswers(packageValue, "corrective_action");
  const verificationAnswers = stageAnswers(
    packageValue,
    "verification_and_prevention",
  );
  const directCauseAnswers = occurrenceAnswers.filter((answer) =>
    DIRECT_CAUSE_PATTERN.test(answer.text),
  );
  const trainingOnlyAnswers = correctiveAnswers.filter(
    (answer) =>
      TRAINING_PATTERN.test(answer.text) &&
      !DURABLE_CONTROL_PATTERN.test(answer.text),
  );
  const verificationEvidence = packageValue.evidence.files.filter((file) =>
    file.associations.some(
      (association) => association.stage === "verification_and_prevention",
    ),
  );

  findings.push({
    id: "problem-definition",
    area: "problem_definition",
    status: problemAnswers.length ? "complete" : "attention",
    title: problemAnswers.length ? "已提供问题事实" : "问题事实需要补充",
    reason: problemAnswers.length
      ? "已找到供应商原始问题描述；仍应由协调人员核对产品、批次、数量和发现位置。"
      : "没有找到可审核的问题事实。",
    sourceAnswerIds: problemAnswers.map((answer) => answer.answerId),
    evidenceIds: [],
  });
  findings.push({
    id: "containment",
    area: "containment",
    status: containmentAnswers.length ? "needs_confirmation" : "attention",
    title: containmentAnswers.length ? "已描述临时控制" : "缺少临时控制",
    reason: containmentAnswers.length
      ? "供应商已描述临时措施，建议确认覆盖范围和开始时间。"
      : "客户通常会关心当前如何避免更多不良继续流出。",
    sourceAnswerIds: containmentAnswers.map((answer) => answer.answerId),
    evidenceIds: [],
  });

  if (directCauseAnswers.length) {
    findings.push({
      id: "root-cause-direct-cause",
      area: "root_cause",
      status: "needs_confirmation",
      title: "当前描述更像直接原因",
      reason:
        "“员工/操作错误”不能单独说明系统为什么允许错误发生，也没有解释为什么检查未提前发现。",
      sourceAnswerIds: directCauseAnswers.map((answer) => answer.answerId),
      evidenceIds: [],
    });
    risks.push("客户可能继续追问流程、防错和检验控制为什么没有阻止该错误。");
    suggestedQuestions.push(
      "为什么员工有机会做错？当时应由什么流程、工装或标准防止？",
      "为什么现有检查没有提前发现？请说明检查方法、范围和记录。",
    );
  } else {
    findings.push({
      id: "root-cause-review",
      area: "root_cause",
      status:
        occurrenceAnswers.length && escapeAnswers.length
          ? "needs_confirmation"
          : "attention",
      title:
        occurrenceAnswers.length && escapeAnswers.length
          ? "发生原因与未发现原因均有描述"
          : "原因分析仍不完整",
      reason:
        occurrenceAnswers.length && escapeAnswers.length
          ? "当前信息可用于人工核对，但系统不会自动确认根因。"
          : "需要分别说明问题为什么发生，以及为什么没有提前发现。",
      sourceAnswerIds: [...occurrenceAnswers, ...escapeAnswers].map(
        (answer) => answer.answerId,
      ),
      evidenceIds: [],
    });
  }

  if (trainingOnlyAnswers.length) {
    findings.push({
      id: "corrective-action-training-only",
      area: "corrective_action",
      status: "attention",
      title: "培训可能不足以防止再次发生",
      reason:
        "培训可以作为支持措施，但当前没有说明流程、工具、防错或检测控制会怎样改变。",
      sourceAnswerIds: trainingOnlyAnswers.map((answer) => answer.answerId),
      evidenceIds: [],
    });
    risks.push("仅培训或提醒可能被客户认为是短期措施。");
    suggestedQuestions.push(
      "除了培训，能否改变流程、工具、工装、标准或检查方式，让错误更难发生？",
    );
  } else {
    findings.push({
      id: "corrective-action",
      area: "corrective_action",
      status: correctiveAnswers.length ? "needs_confirmation" : "attention",
      title: correctiveAnswers.length ? "已提供改善措施" : "缺少改善措施",
      reason: correctiveAnswers.length
        ? "建议人工确认措施负责人、时间和与原因之间的对应关系。"
        : "没有找到可供客户沟通的改善措施。",
      sourceAnswerIds: correctiveAnswers.map((answer) => answer.answerId),
      evidenceIds: [],
    });
  }

  findings.push({
    id: "verification",
    area: "verification",
    status: verificationEvidence.length
      ? "complete"
      : verificationAnswers.length
        ? "missing_evidence"
        : "attention",
    title: verificationEvidence.length
      ? "已找到验证阶段证据"
      : verificationAnswers.length
        ? "验证计划缺少证据"
        : "缺少验证计划和证据",
    reason: verificationEvidence.length
      ? "已关联验证文件；仍需人工确认样本、方法、判定标准和实际结果。"
      : "没有找到与验证阶段明确关联的记录，不能据此宣称措施有效。",
    sourceAnswerIds: verificationAnswers.map((answer) => answer.answerId),
    evidenceIds: verificationEvidence.map((file) => file.id),
  });

  const missingEvidence = packageValue.evidence.requirements
    .filter(
      (requirement) =>
        requirement.status === "open" && requirement.evidenceIds.length === 0,
    )
    .map((requirement) => ({
      requirementId: requirement.id,
      requirement: requirement.requirement,
      reason: requirement.reason,
      stage: requirement.stage,
    }));
  if (missingEvidence.length) {
    risks.push("部分供应商陈述缺少关联证据，客户可能要求补充记录。");
  }
  if (packageValue.investigation.missingInformation.length) {
    risks.push("调查中仍有未确认信息，发送客户前应明确保留为未知或向供应商追问。");
  }
  const shouldRequestUpdate =
    directCauseAnswers.length > 0 ||
    trainingOnlyAnswers.length > 0 ||
    !verificationEvidence.length ||
    missingEvidence.length > 0 ||
    packageValue.investigation.missingInformation.length > 0;

  return {
    schemaVersion: QUALITY_REVIEW_SCHEMA_VERSION,
    packageId: packageValue.packageId,
    advisoryOnly: true,
    mayTransitionCase: false,
    findings,
    risks: unique(risks),
    missingEvidence,
    suggestedQuestions: unique(suggestedQuestions),
    recommendedNextAction: shouldRequestUpdate
      ? "request_supplier_update"
      : "accept_for_customer_preparation",
    generatedBy: "deterministic_quality_rules",
    confidence: "medium",
    generatedAt: now.toISOString(),
  };
}

export interface QualityReviewerAiClient {
  review(input: { prompt: string }): Promise<unknown>;
}

export class DeepSeekQualityReviewerAiClient
  implements QualityReviewerAiClient
{
  async review(input: { prompt: string }): Promise<unknown> {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey)
      throw new InternalQualityReviewError(
        "AI Quality Reviewer is not configured.",
        503,
      );
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(25_000),
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: input.prompt }],
        temperature: 0.1,
        max_tokens: 1400,
        response_format: { type: "json_object" },
      }),
    }).catch(() => {
      throw new InternalQualityReviewError(
        "AI Quality Reviewer is temporarily unavailable.",
        503,
      );
    });
    if (!response.ok)
      throw new InternalQualityReviewError(
        "AI Quality Reviewer is temporarily unavailable.",
        503,
      );
    const content = (await response.json().catch(() => null))?.choices?.[0]
      ?.message?.content;
    if (typeof content !== "string")
      throw new InternalQualityReviewError(
        "AI Quality Reviewer returned no JSON.",
        502,
      );
    try {
      return JSON.parse(content);
    } catch {
      throw new InternalQualityReviewError(
        "AI Quality Reviewer returned invalid JSON.",
        502,
      );
    }
  }
}

type ReviewerProposal = {
  schemaVersion: typeof QUALITY_REVIEW_SCHEMA_VERSION;
  confidence: "low" | "medium" | "high";
  findings: Array<{
    id: string;
    area: QualityReviewFinding["area"];
    status: Exclude<QualityReviewFindingStatus, "complete">;
    title: string;
    reason: string;
    sourceAnswerIds: string[];
    evidenceIds: string[];
  }>;
  risks: string[];
  suggestedQuestions: string[];
  recommendedNextAction: QualityReviewResult["recommendedNextAction"];
};

const REVIEW_AREAS = new Set<QualityReviewFinding["area"]>([
  "problem_definition",
  "containment",
  "root_cause",
  "corrective_action",
  "verification",
]);
const REVIEW_STATUSES = new Set<Exclude<QualityReviewFindingStatus, "complete">>([
  "attention",
  "needs_confirmation",
  "missing_evidence",
]);
const NEXT_ACTIONS = new Set<QualityReviewResult["recommendedNextAction"]>([
  "request_supplier_update",
  "accept_for_customer_preparation",
  "review_manually",
]);

export function validateQualityReviewerResponse(
  value: unknown,
): { success: true; data: ReviewerProposal } | { success: false; issues: string[] } {
  const issues: string[] = [];
  if (typeof value !== "object" || value === null || Array.isArray(value))
    return { success: false, issues: ["response must be an object"] };
  const response = value as Record<string, unknown>;
  for (const forbidden of [
    "confirmedRootCause",
    "approvedAction",
    "customerAcceptance",
    "workflowAction",
    "closeCase",
    "reportPatch",
  ]) {
    if (forbidden in response) issues.push(`${forbidden} is not permitted`);
  }
  if (response.schemaVersion !== QUALITY_REVIEW_SCHEMA_VERSION)
    issues.push("schemaVersion is invalid");
  if (!new Set(["low", "medium", "high"]).has(String(response.confidence)))
    issues.push("confidence is invalid");
  if (!NEXT_ACTIONS.has(response.recommendedNextAction as never))
    issues.push("recommendedNextAction is invalid");
  if (!Array.isArray(response.findings)) issues.push("findings must be an array");
  const findings = Array.isArray(response.findings)
    ? response.findings.flatMap((item, index) => {
        const finding = record(item);
        const area = finding.area as QualityReviewFinding["area"];
        const status = finding.status as Exclude<
          QualityReviewFindingStatus,
          "complete"
        >;
        if (
          !REVIEW_AREAS.has(area) ||
          !REVIEW_STATUSES.has(status) ||
          !safeText(finding.title, 180) ||
          !safeText(finding.reason, 800)
        ) {
          issues.push(`finding ${index} is invalid`);
          return [];
        }
        return [
          {
            id: safeText(finding.id, 120) || `provider-${index + 1}`,
            area,
            status,
            title: safeText(finding.title, 180),
            reason: safeText(finding.reason, 800),
            sourceAnswerIds: stringList(finding.sourceAnswerIds),
            evidenceIds: stringList(finding.evidenceIds),
          },
        ];
      })
    : [];
  return issues.length
    ? { success: false, issues }
    : {
        success: true,
        data: {
          schemaVersion: QUALITY_REVIEW_SCHEMA_VERSION,
          confidence: response.confidence as ReviewerProposal["confidence"],
          findings,
          risks: stringList(response.risks, 20),
          suggestedQuestions: stringList(response.suggestedQuestions, 20),
          recommendedNextAction:
            response.recommendedNextAction as ReviewerProposal["recommendedNextAction"],
        },
      };
}

export function buildQualityReviewerPrompt(
  packageValue: SupplierResponsePackage,
) {
  const answerLines = packageValue.investigation.currentAnswers.map(
    (answer) =>
      `- answerId=${answer.answerId}; stage=${answer.stage}; supplierText=${answer.text}`,
  );
  const evidenceLines = packageValue.evidence.files.map(
    (file) =>
      `- evidenceId=${file.id}; filename=${file.filename}; stages=${file.associations.map((association) => association.stage || "unknown").join(",")}`,
  );
  return `You are an internal AI Quality Reviewer assisting a non-specialist sourcing coordinator. Review only the supplied package. You may identify gaps, risks, missing evidence, and questions. Never confirm a root cause, approve an action, claim customer acceptance, write a final report, send a message, or transition/close a Case. A finding may only be attention, needs_confirmation, or missing_evidence; never "approved" or "correct". Treat operator error as a direct cause that needs a system and escape explanation. Treat training-only actions as potentially insufficient. Evidence presence does not prove effectiveness; ask the human to confirm scope, method, criteria, and result.\n\nReturn JSON only:\n{"schemaVersion":"quality-review-v1","confidence":"low|medium|high","findings":[{"id":"","area":"problem_definition|containment|root_cause|corrective_action|verification","status":"attention|needs_confirmation|missing_evidence","title":"","reason":"","sourceAnswerIds":[],"evidenceIds":[]}],"risks":[],"suggestedQuestions":[],"recommendedNextAction":"request_supplier_update|accept_for_customer_preparation|review_manually"}\n\nPackage id: ${packageValue.packageId}\nSupplier answers:\n${answerLines.join("\n") || "No relevant data"}\nEvidence metadata:\n${evidenceLines.join("\n") || "No relevant data"}\nMissing information:\n${packageValue.investigation.missingInformation.map((item) => `- ${item.key}: ${item.reason}`).join("\n") || "None recorded"}`;
}

function mergeReviewerProposal(
  baseline: QualityReviewResult,
  proposal: ReviewerProposal,
  packageValue: SupplierResponsePackage,
  now: Date,
): QualityReviewResult {
  const answerIds = new Set(
    packageValue.investigation.originalAnswers.map((answer) => answer.id),
  );
  const evidenceIds = new Set(packageValue.evidence.files.map((file) => file.id));
  return {
    ...baseline,
    findings: [
      ...baseline.findings,
      ...proposal.findings.map((finding) => ({
        ...finding,
        id: `provider:${finding.id}`,
        sourceAnswerIds: finding.sourceAnswerIds.filter((id) => answerIds.has(id)),
        evidenceIds: finding.evidenceIds.filter((id) => evidenceIds.has(id)),
      })),
    ],
    risks: unique([...baseline.risks, ...proposal.risks]),
    suggestedQuestions: unique([
      ...baseline.suggestedQuestions,
      ...proposal.suggestedQuestions,
    ]),
    recommendedNextAction:
      baseline.recommendedNextAction === "request_supplier_update"
        ? "request_supplier_update"
        : proposal.recommendedNextAction,
    generatedBy: "ai_quality_reviewer",
    confidence: proposal.confidence,
    generatedAt: now.toISOString(),
  };
}

export type ConfirmedMappingSource = {
  mappingId: string;
  decision: string;
  confirmationId: string | null;
  sourceType: "human_confirmation" | "ai_suggestion";
  semanticKey: string;
  confirmedText: string;
  language: string;
  approvedEvidenceIds: string[];
};

export type CustomerDraftFormat =
  | "english_email"
  | "8d_draft"
  | "corrective_action_summary";

const DRAFT_LABELS: Partial<Record<GuidedOutputSemanticKey, string>> = {
  complaint_summary: "Issue summary",
  containment: "Immediate containment",
  occurrence_analysis: "Occurrence analysis",
  escape_analysis: "Escape analysis",
  corrective_action: "Corrective action",
  implementation_plan: "Implementation plan",
  effectiveness_verification: "Verification",
  preventive_action: "Prevention",
  lessons_learned: "Lessons learned",
};

export function buildCustomerDraft(input: {
  format: CustomerDraftFormat;
  caseTitle: string;
  mappings: readonly ConfirmedMappingSource[];
  evidence: SupplierResponsePackage["evidence"]["files"];
}) {
  const confirmed = input.mappings.filter(
    (mapping) =>
      mapping.decision === "confirmed" &&
      mapping.sourceType === "human_confirmation" &&
      Boolean(mapping.confirmationId) &&
      mapping.language === "en" &&
      Boolean(mapping.confirmedText.trim()) &&
      SEMANTIC_KEYS.includes(mapping.semanticKey as GuidedOutputSemanticKey),
  );
  if (!confirmed.length) {
    return {
      ok: false as const,
      error:
        "Confirm at least one customer-ready English mapping before building a draft.",
    };
  }
  const approvedEvidenceIds = new Set(
    confirmed.flatMap((mapping) => mapping.approvedEvidenceIds),
  );
  const approvedEvidence = input.evidence.filter((file) =>
    approvedEvidenceIds.has(file.id),
  );
  const sections = confirmed.map((mapping) => ({
    label:
      DRAFT_LABELS[mapping.semanticKey as GuidedOutputSemanticKey] ||
      mapping.semanticKey,
    text: mapping.confirmedText.trim(),
  }));
  const sectionText = sections
    .map((section) => `${section.label}\n${section.text}`)
    .join("\n\n");
  let draft = sectionText;
  if (input.format === "english_email") {
    draft = `Subject: Corrective Action Update – ${input.caseTitle}\n\nDear Customer,\n\nPlease find below the confirmed information currently prepared for your review. This is a draft and has not been sent or accepted.\n\n${sectionText}\n\n${approvedEvidence.length ? `Supporting evidence selected for internal preparation:\n${approvedEvidence.map((file) => `- ${file.filename}`).join("\n")}\n\n` : ""}Best regards,\nQuality Coordination Team`;
  } else if (input.format === "8d_draft") {
    draft = `8D RESPONSE DRAFT – HUMAN REVIEW REQUIRED\n${input.caseTitle}\n\n${sectionText}`;
  } else {
    draft = `CORRECTIVE ACTION SUMMARY – DRAFT\n${input.caseTitle}\n\n${sectionText}`;
  }
  return {
    ok: true as const,
    value: {
      format: input.format,
      draft,
      isDraft: true as const,
      maySend: false as const,
      sourceConfirmationIds: confirmed
        .map((mapping) => mapping.confirmationId)
        .filter((id): id is string => Boolean(id)),
      evidenceIds: approvedEvidence.map((file) => file.id),
    },
  };
}

function packageFromSnapshot(value: unknown): SupplierResponsePackage | null {
  const snapshot = record(value);
  const packageValue = record(snapshot.responsePackage);
  if (
    packageValue.schemaVersion !== "supplier-response-package-v1" ||
    typeof packageValue.packageId !== "string" ||
    typeof packageValue.caseContext !== "object" ||
    typeof packageValue.investigation !== "object" ||
    typeof packageValue.evidence !== "object"
  )
    return null;
  return packageValue as unknown as SupplierResponsePackage;
}

async function latestSubmittedPackage(caseId: string) {
  const [row] = await db
    .select({ confirmation: qualityCaseGuidanceConfirmations })
    .from(qualityCaseGuidanceConfirmations)
    .where(
      and(
        eq(qualityCaseGuidanceConfirmations.caseId, caseId),
        eq(
          qualityCaseGuidanceConfirmations.confirmationType,
          "supplier_response_package",
        ),
        eq(qualityCaseGuidanceConfirmations.decision, "submitted"),
      ),
    )
    .orderBy(desc(qualityCaseGuidanceConfirmations.confirmedAt))
    .limit(1);
  const packageValue = row
    ? packageFromSnapshot(row.confirmation.confirmedSnapshot)
    : null;
  return packageValue && packageValue.caseContext.caseId === caseId
    ? { confirmation: row.confirmation, packageValue }
    : null;
}

function reviewerResultFromRun(value: unknown) {
  const response = record(value);
  const review = record(response.review);
  return review.schemaVersion === QUALITY_REVIEW_SCHEMA_VERSION
    ? (review as unknown as QualityReviewResult)
    : null;
}

async function loadMappingRows(sessionId: string) {
  const rows = await db
    .select({
      id: qualityCaseGuidanceFieldMappings.id,
      caseId: qualityCaseGuidanceFieldMappings.caseId,
      sessionId: qualityCaseGuidanceFieldMappings.sessionId,
      answerId: qualityCaseGuidanceFieldMappings.answerId,
      qualityConcept: qualityCaseGuidanceFieldMappings.qualityConcept,
      semanticKey: qualityCaseGuidanceFieldMappings.semanticKey,
      targetReference: qualityCaseGuidanceFieldMappings.targetReference,
      decision: qualityCaseGuidanceFieldMappings.decision,
      confirmationId: qualityCaseGuidanceFieldMappings.confirmationId,
      decidedAt: qualityCaseGuidanceFieldMappings.decidedAt,
      answerText: qualityCaseGuidanceAnswers.originalText,
      answerRevision: qualityCaseGuidanceAnswers.revision,
      answerClassification: qualityCaseGuidanceAnswers.classification,
      category: qualityCaseGuidanceQuestions.category,
      stage: qualityCaseGuidanceQuestions.stage,
      confirmedSnapshot: qualityCaseGuidanceConfirmations.confirmedSnapshot,
    })
    .from(qualityCaseGuidanceFieldMappings)
    .innerJoin(
      qualityCaseGuidanceAnswers,
      eq(
        qualityCaseGuidanceFieldMappings.answerId,
        qualityCaseGuidanceAnswers.id,
      ),
    )
    .innerJoin(
      qualityCaseGuidanceQuestions,
      eq(qualityCaseGuidanceAnswers.questionId, qualityCaseGuidanceQuestions.id),
    )
    .leftJoin(
      qualityCaseGuidanceConfirmations,
      eq(
        qualityCaseGuidanceFieldMappings.confirmationId,
        qualityCaseGuidanceConfirmations.id,
      ),
    )
    .where(eq(qualityCaseGuidanceFieldMappings.sessionId, sessionId));
  const answers = await db
    .select({
      id: qualityCaseGuidanceAnswers.id,
      caseId: qualityCaseGuidanceAnswers.caseId,
      sessionId: qualityCaseGuidanceAnswers.sessionId,
      answerGroupId: qualityCaseGuidanceAnswers.answerGroupId,
      revision: qualityCaseGuidanceAnswers.revision,
      originalText: qualityCaseGuidanceAnswers.originalText,
      classification: qualityCaseGuidanceAnswers.classification,
      category: qualityCaseGuidanceQuestions.category,
      stage: qualityCaseGuidanceQuestions.stage,
    })
    .from(qualityCaseGuidanceAnswers)
    .innerJoin(
      qualityCaseGuidanceQuestions,
      eq(qualityCaseGuidanceAnswers.questionId, qualityCaseGuidanceQuestions.id),
    )
    .where(eq(qualityCaseGuidanceAnswers.sessionId, sessionId));
  const latestByGroup = new Map<string, (typeof answers)[number]>();
  for (const answer of answers) {
    const prior = latestByGroup.get(answer.answerGroupId);
    if (!prior || answer.revision > prior.revision)
      latestByGroup.set(answer.answerGroupId, answer);
  }
  const existingKeys = new Set(
    rows.map((row) => `${row.answerId}:${row.semanticKey}`),
  );
  const candidates = [...latestByGroup.values()].flatMap((answer) => {
    const mappings = getGuidedMappings({
      category: answer.category as GuidedAnswerCategory,
    });
    const seen = new Set<string>();
    return mappings.flatMap((mapping) => {
      const key = `${answer.id}:${mapping.target.semanticKey}`;
      if (seen.has(key) || existingKeys.has(key)) return [];
      seen.add(key);
      return [
        {
          id: `candidate:${answer.id}:${mapping.target.semanticKey}`,
          caseId: answer.caseId,
          sessionId: answer.sessionId,
          answerId: answer.id,
          qualityConcept: mapping.concept,
          semanticKey: mapping.target.semanticKey,
          targetReference: mapping.target,
          decision: "proposed",
          confirmationId: null,
          decidedAt: null,
          answerText: answer.originalText,
          answerRevision: answer.revision,
          answerClassification: answer.classification,
          category: answer.category,
          stage: answer.stage,
          confirmedSnapshot: null,
          persisted: false as const,
        },
      ];
    });
  });
  return [
    ...rows.map((row) => ({ ...row, persisted: true as const })),
    ...candidates,
  ];
}

function confirmedMappingSource(
  mapping: Awaited<ReturnType<typeof loadMappingRows>>[number],
): ConfirmedMappingSource {
  const snapshot = record(mapping.confirmedSnapshot);
  return {
    mappingId: mapping.id,
    decision: mapping.decision,
    confirmationId: mapping.confirmationId,
    sourceType: mapping.confirmationId
      ? "human_confirmation"
      : "ai_suggestion",
    semanticKey: mapping.semanticKey,
    confirmedText: safeText(snapshot.confirmedText, 12000),
    language: safeText(snapshot.language, 20),
    approvedEvidenceIds: stringList(snapshot.approvedEvidenceIds, 50),
  };
}

export async function getInternalQualityReviewWorkspace(
  caseId: string,
  userId: string,
) {
  const access = await getQualityCaseAccess(caseId, userId);
  if (!access) return null;
  const submitted = await latestSubmittedPackage(caseId);
  if (!submitted) {
    return {
      qualityCase: access.qualityCase,
      package: null,
      review: null,
      mappings: [],
      permissions: {
        canReview: access.canEdit,
        canConfirmMapping: access.canEdit,
        canRequestSupplierUpdate: access.canAssignExternalTasks,
        canBuildCustomerDraft: access.canEdit,
      },
    };
  }
  const [reviewRun, mappings] = await Promise.all([
    db
      .select()
      .from(qualityCaseGuidanceAiRuns)
      .where(
        and(
          eq(
            qualityCaseGuidanceAiRuns.sessionId,
            submitted.packageValue.caseContext.sessionId,
          ),
          eq(qualityCaseGuidanceAiRuns.agentType, "quality_reviewer"),
        ),
      )
      .orderBy(desc(qualityCaseGuidanceAiRuns.generatedAt))
      .limit(1),
    loadMappingRows(submitted.packageValue.caseContext.sessionId),
  ]);
  const caseData = record(access.qualityCase.caseData);
  return {
    qualityCase: access.qualityCase,
    context: {
      product:
        submitted.packageValue.caseContext.product ||
        safeText(caseData.productName || caseData.product, 300) ||
        "未记录产品",
      customer:
        safeText(caseData.customerName || caseData.customer, 300) ||
        "未记录客户",
      supplier: submitted.packageValue.supplier,
      problemSummary: submitted.packageValue.caseContext.problemSummary,
    },
    package: submitted.packageValue,
    review:
      reviewerResultFromRun(reviewRun[0]?.response) ||
      reviewSupplierResponsePackage(submitted.packageValue),
    reviewPersisted: Boolean(reviewerResultFromRun(reviewRun[0]?.response)),
    mappings: mappings.map((mapping) => ({
      ...mapping,
      confirmed: confirmedMappingSource(mapping),
    })),
    permissions: {
      canReview: access.canEdit,
      canConfirmMapping: access.canEdit,
      canRequestSupplierUpdate: access.canAssignExternalTasks,
      canBuildCustomerDraft: access.canEdit,
    },
  };
}

export async function runInternalQualityReview(input: {
  caseId: string;
  userId: string;
  client?: QualityReviewerAiClient;
  now?: Date;
}) {
  const access = await getQualityCaseAccess(input.caseId, input.userId);
  if (!access)
    throw new InternalQualityReviewError("Quality Case not found.", 404);
  if (!access.canEdit)
    throw new InternalQualityReviewError(
      "You do not have permission to review this Case.",
      403,
    );
  if (
    !["supplier_submitted", "internal_review"].includes(
      access.qualityCase.status,
    )
  )
    throw new InternalQualityReviewError(
      "Quality review is available after the supplier submits and during internal review.",
      409,
    );
  const submitted = await latestSubmittedPackage(input.caseId);
  if (!submitted)
    throw new InternalQualityReviewError(
      "No Supplier Response Package is available for review.",
      409,
    );
  const now = input.now || new Date();
  const baseline = reviewSupplierResponsePackage(submitted.packageValue, now);
  const prompt = buildQualityReviewerPrompt(submitted.packageValue);
  const promptInputHash = createHash("sha256").update(prompt).digest("hex");
  let result: QualityReviewResult = baseline;
  let providerResponse: unknown = null;
  let sourceType = "deterministic_fallback";
  let modelIdentifier: string | null = null;
  let policyOutcome = "accepted_fallback";
  const shouldCallProvider = Boolean(input.client || process.env.DEEPSEEK_API_KEY);
  if (shouldCallProvider) {
    sourceType = input.client ? "injected_quality_reviewer" : "deepseek";
    modelIdentifier = input.client ? "injected-reviewer" : "deepseek-chat";
    try {
      providerResponse = await (
        input.client || new DeepSeekQualityReviewerAiClient()
      ).review({ prompt });
      const validated = validateQualityReviewerResponse(providerResponse);
      if (!validated.success) {
        policyOutcome = "rejected_or_fallback";
        result = { ...baseline, generatedBy: "deterministic_fallback" };
      } else {
        policyOutcome = "accepted";
        result = mergeReviewerProposal(
          baseline,
          validated.data,
          submitted.packageValue,
          now,
        );
      }
    } catch {
      policyOutcome = "provider_failed_fallback";
      result = { ...baseline, generatedBy: "deterministic_fallback" };
    }
  }
  const [run] = await db
    .insert(qualityCaseGuidanceAiRuns)
    .values({
      caseId: input.caseId,
      sessionId: submitted.packageValue.caseContext.sessionId,
      agentType: "quality_reviewer",
      sourceType,
      promptIdentifier: QUALITY_REVIEW_PROMPT_ID,
      promptVersion: QUALITY_REVIEW_PROMPT_VERSION,
      promptInputHash,
      modelIdentifier,
      response: {
        review: result,
        providerResponse,
      },
      confidence: result.confidence,
      requestMetadata: {
        packageId: submitted.packageValue.packageId,
        caseVersion: submitted.packageValue.caseContext.caseVersion,
      },
      policyOutcome,
      generatedAt: now,
    })
    .returning();
  return { runId: run.id, review: result };
}

async function actorOrganization(caseId: string, userId: string) {
  const [actor] = await db
    .select({ organizationName: qualityCaseParticipants.organizationName })
    .from(qualityCaseParticipants)
    .where(
      and(
        eq(qualityCaseParticipants.caseId, caseId),
        eq(qualityCaseParticipants.userId, userId),
        eq(qualityCaseParticipants.isInternal, true),
      ),
    )
    .limit(1);
  if (actor?.organizationName) return actor.organizationName;
  const [coordinator] = await db
    .select({ organizationName: qualityCaseParticipants.organizationName })
    .from(qualityCaseParticipants)
    .where(
      and(
        eq(qualityCaseParticipants.caseId, caseId),
        eq(qualityCaseParticipants.role, "coordinator"),
        eq(qualityCaseParticipants.isInternal, true),
      ),
    )
    .limit(1);
  return coordinator?.organizationName || null;
}

function parseCandidateId(mappingId: string) {
  if (!mappingId.startsWith("candidate:")) return null;
  const [, answerId, semanticKey] = mappingId.split(":");
  return answerId && SEMANTIC_KEYS.includes(semanticKey as GuidedOutputSemanticKey)
    ? { answerId, semanticKey: semanticKey as GuidedOutputSemanticKey }
    : null;
}

export async function confirmMappingDecision(input: {
  caseId: string;
  userId: string;
  mappingId: unknown;
  semanticKey: unknown;
  confirmedText: unknown;
  language: unknown;
  approvedEvidenceIds?: unknown;
  comment?: unknown;
  now?: Date;
}) {
  const access = await getQualityCaseAccess(input.caseId, input.userId);
  if (!access)
    throw new InternalQualityReviewError("Quality Case not found.", 404);
  if (!access.canEdit)
    throw new InternalQualityReviewError(
      "You do not have permission to confirm mappings.",
      403,
    );
  if (access.qualityCase.status !== "internal_review")
    throw new InternalQualityReviewError(
      "Mappings can be confirmed only during Internal Review.",
      409,
    );
  const submitted = await latestSubmittedPackage(input.caseId);
  if (!submitted)
    throw new InternalQualityReviewError(
      "No Supplier Response Package is available.",
      409,
    );
  const mappingId = safeText(input.mappingId, 200);
  const semanticKey = safeText(input.semanticKey, 100) as GuidedOutputSemanticKey;
  const confirmedText = safeText(input.confirmedText, 12000);
  const language = input.language === "en" ? "en" : input.language === "zh-CN" ? "zh-CN" : null;
  if (
    !mappingId ||
    !SEMANTIC_KEYS.includes(semanticKey) ||
    !confirmedText ||
    !language
  )
    throw new InternalQualityReviewError(
      "Mapping target, confirmed text, and language are required.",
      400,
    );
  const candidate = parseCandidateId(mappingId);
  let mapping: {
    id: string;
    answerId: string;
    qualityConcept: string;
    targetReference: unknown;
    answerText: string;
    answerRevision: number;
    category: string;
  } | null = null;
  if (candidate) {
    const [answer] = await db
      .select({
        id: qualityCaseGuidanceAnswers.id,
        originalText: qualityCaseGuidanceAnswers.originalText,
        revision: qualityCaseGuidanceAnswers.revision,
        category: qualityCaseGuidanceQuestions.category,
      })
      .from(qualityCaseGuidanceAnswers)
      .innerJoin(
        qualityCaseGuidanceQuestions,
        eq(qualityCaseGuidanceAnswers.questionId, qualityCaseGuidanceQuestions.id),
      )
      .where(
        and(
          eq(qualityCaseGuidanceAnswers.id, candidate.answerId),
          eq(
            qualityCaseGuidanceAnswers.sessionId,
            submitted.packageValue.caseContext.sessionId,
          ),
          eq(qualityCaseGuidanceAnswers.caseId, input.caseId),
        ),
      )
      .limit(1);
    const suggestion = answer
      ? getGuidedMappings({ category: answer.category as GuidedAnswerCategory }).find(
          (item) => item.target.semanticKey === candidate.semanticKey,
        )
      : null;
    if (!answer || !suggestion)
      throw new InternalQualityReviewError("Mapping suggestion was not found.", 404);
    mapping = {
      id: randomUUID(),
      answerId: answer.id,
      qualityConcept: suggestion.concept,
      targetReference: suggestion.target,
      answerText: answer.originalText,
      answerRevision: answer.revision,
      category: answer.category,
    };
  } else {
    const [existing] = await db
      .select({
        id: qualityCaseGuidanceFieldMappings.id,
        answerId: qualityCaseGuidanceFieldMappings.answerId,
        qualityConcept: qualityCaseGuidanceFieldMappings.qualityConcept,
        targetReference: qualityCaseGuidanceFieldMappings.targetReference,
        answerText: qualityCaseGuidanceAnswers.originalText,
        answerRevision: qualityCaseGuidanceAnswers.revision,
        category: qualityCaseGuidanceQuestions.category,
      })
      .from(qualityCaseGuidanceFieldMappings)
      .innerJoin(
        qualityCaseGuidanceAnswers,
        eq(
          qualityCaseGuidanceFieldMappings.answerId,
          qualityCaseGuidanceAnswers.id,
        ),
      )
      .innerJoin(
        qualityCaseGuidanceQuestions,
        eq(qualityCaseGuidanceAnswers.questionId, qualityCaseGuidanceQuestions.id),
      )
      .where(
        and(
          eq(qualityCaseGuidanceFieldMappings.id, mappingId),
          eq(qualityCaseGuidanceFieldMappings.caseId, input.caseId),
          eq(
            qualityCaseGuidanceFieldMappings.sessionId,
            submitted.packageValue.caseContext.sessionId,
          ),
        ),
      )
      .limit(1);
    mapping = existing || null;
  }
  if (!mapping)
    throw new InternalQualityReviewError("Mapping was not found.", 404);
  const allowedEvidence = new Set(
    submitted.packageValue.evidence.files.map((file) => file.id),
  );
  const approvedEvidenceIds = stringList(input.approvedEvidenceIds, 50).filter(
    (id) => allowedEvidence.has(id),
  );
  const now = input.now || new Date();
  const confirmationId = randomUUID();
  const organization = await actorOrganization(input.caseId, input.userId);
  const currentTarget = record(mapping.targetReference);
  const nextTarget = {
    ...currentTarget,
    semanticKey,
    humanConfirmed: true,
  };
  const confirmation = {
    id: confirmationId,
    caseId: input.caseId,
    sessionId: submitted.packageValue.caseContext.sessionId,
    answerId: mapping.answerId,
    confirmationType: "field_mapping",
    decision: "confirmed",
    comment: safeText(input.comment, 2000) || null,
    actorId: input.userId,
    actorOrganization: organization,
    confirmedSnapshot: {
      mappingId: mapping.id,
      sourceAnswerId: mapping.answerId,
      sourceAnswerRevision: mapping.answerRevision,
      sourceAnswerText: mapping.answerText,
      qualityConcept: mapping.qualityConcept,
      semanticKey,
      targetReference: nextTarget,
      confirmedText,
      language,
      approvedEvidenceIds,
      reportWritePerformed: false,
    },
    confirmedAt: now,
  } satisfies typeof qualityCaseGuidanceConfirmations.$inferInsert;
  const singleRow = sql`(select 1) as mapping_confirmation_guard`;
  const lock = db
    .select({
      locked: sql<number>`pg_advisory_xact_lock(hashtextextended(${mapping.id}, 0))`,
    })
    .from(singleRow);
  const assertion = db
    .select({
      valid: candidate
        ? sql<number>`1 / case when exists (
            select 1 from ${qualityCaseGuidanceAnswers}
            where ${qualityCaseGuidanceAnswers.id} = ${mapping.answerId}
              and ${qualityCaseGuidanceAnswers.caseId} = ${input.caseId}
              and ${qualityCaseGuidanceAnswers.sessionId} = ${submitted.packageValue.caseContext.sessionId}
          ) and exists (
            select 1 from ${qualityCases}
            where ${qualityCases.id} = ${input.caseId}
              and ${qualityCases.status} = 'internal_review'
          ) and not exists (
            select 1 from ${qualityCaseGuidanceFieldMappings}
            where ${qualityCaseGuidanceFieldMappings.answerId} = ${mapping.answerId}
              and ${qualityCaseGuidanceFieldMappings.semanticKey} = ${semanticKey}
          ) then 1 else 0 end`
        : sql<number>`1 / case when exists (
            select 1 from ${qualityCaseGuidanceFieldMappings}
            inner join ${qualityCases} on ${qualityCases.id} = ${qualityCaseGuidanceFieldMappings.caseId}
            where ${qualityCaseGuidanceFieldMappings.id} = ${mapping.id}
              and ${qualityCaseGuidanceFieldMappings.caseId} = ${input.caseId}
              and ${qualityCaseGuidanceFieldMappings.sessionId} = ${submitted.packageValue.caseContext.sessionId}
              and ${qualityCases.status} = 'internal_review'
          ) then 1 else 0 end`,
    })
    .from(singleRow);
  const mappingWrite = candidate
    ? db.insert(qualityCaseGuidanceFieldMappings).values({
        id: mapping.id,
        caseId: input.caseId,
        sessionId: submitted.packageValue.caseContext.sessionId,
        answerId: mapping.answerId,
        confirmationId,
        qualityConcept: mapping.qualityConcept,
        semanticKey,
        targetReference: nextTarget,
        decision: "confirmed",
        decidedBy: input.userId,
        decidedAt: now,
        decisionComment: safeText(input.comment, 2000) || null,
      })
    : db
        .update(qualityCaseGuidanceFieldMappings)
        .set({
          confirmationId,
          semanticKey,
          targetReference: nextTarget,
          decision: "confirmed",
          decidedBy: input.userId,
          decidedAt: now,
          decisionComment: safeText(input.comment, 2000) || null,
        })
        .where(eq(qualityCaseGuidanceFieldMappings.id, mapping.id));
  try {
    await db.batch([
      lock,
      assertion,
      db.insert(qualityCaseGuidanceConfirmations).values(confirmation),
      mappingWrite,
      db.insert(qualityCaseActivities).values({
        caseId: input.caseId,
        version: access.qualityCase.currentVersion,
        actionType: "mapping_confirmed",
        actorId: input.userId,
        actorRole: access.role === "owner" ? "coordinator" : "internal_member",
        actorOrganization: organization,
        comment: safeText(input.comment, 2000) || null,
        evidenceIds: approvedEvidenceIds,
        metadata: {
          mappingId: mapping.id,
          confirmationId,
          semanticKey,
          sourceAnswerId: mapping.answerId,
          reportWritePerformed: false,
        },
      }),
    ]);
  } catch {
    throw new InternalQualityReviewError(
      "The mapping changed before confirmation was saved. Refresh and try again.",
      409,
    );
  }
  return {
    mappingId: mapping.id,
    confirmationId,
    semanticKey,
    decision: "confirmed" as const,
    reportWritePerformed: false as const,
  };
}

export async function buildCustomerDraftForCase(input: {
  caseId: string;
  userId: string;
  format: unknown;
}) {
  const workspace = await getInternalQualityReviewWorkspace(
    input.caseId,
    input.userId,
  );
  if (!workspace)
    throw new InternalQualityReviewError("Quality Case not found.", 404);
  if (!workspace.permissions.canBuildCustomerDraft)
    throw new InternalQualityReviewError(
      "You do not have permission to build customer drafts.",
      403,
    );
  if (!workspace.package)
    throw new InternalQualityReviewError(
      "No Supplier Response Package is available.",
      409,
    );
  const format: CustomerDraftFormat =
    input.format === "8d_draft"
      ? "8d_draft"
      : input.format === "corrective_action_summary"
        ? "corrective_action_summary"
        : "english_email";
  const result = buildCustomerDraft({
    format,
    caseTitle: workspace.qualityCase.title,
    mappings: workspace.mappings.map((mapping) => mapping.confirmed),
    evidence: workspace.package.evidence.files,
  });
  if (!result.ok) throw new InternalQualityReviewError(result.error, 409);
  return result.value;
}

export async function requestSupplierUpdate(input: {
  caseId: string;
  user: { id: string; name?: string | null };
  reason: unknown;
  questions: unknown;
  requestedFieldIds?: unknown;
  dueAt: unknown;
  mode?: unknown;
}) {
  const access = await getQualityCaseAccess(input.caseId, input.user.id);
  if (!access)
    throw new InternalQualityReviewError("Quality Case not found.", 404);
  if (!access.canAssignExternalTasks)
    throw new InternalQualityReviewError(
      "Only the Case coordinator can send a supplier follow-up task.",
      403,
    );
  if (access.qualityCase.status !== "internal_review")
    throw new InternalQualityReviewError(
      "Supplier updates can be requested only during Internal Review.",
      409,
    );
  const submitted = await latestSubmittedPackage(input.caseId);
  if (!submitted)
    throw new InternalQualityReviewError(
      "No Supplier Response Package is available.",
      409,
    );
  const reason = safeText(input.reason, 2000);
  const questions = stringList(input.questions, 10);
  const dueAtText = safeText(input.dueAt, 100);
  const dueAt = dueAtText ? new Date(dueAtText) : null;
  const requestedFieldIds = stringList(input.requestedFieldIds, 20);
  const reinvestigation = input.mode === "reinvestigate";
  if (
    !reason ||
    !questions.length ||
    !dueAt ||
    Number.isNaN(dueAt.getTime()) ||
    dueAt.getTime() <= Date.now()
  )
    throw new InternalQualityReviewError(
      "Reason, at least one follow-up question, and a future deadline are required.",
      400,
    );
  const fields = unique([
    ...requestedFieldIds,
    ...(reinvestigation ? ["full_investigation"] : []),
  ]);
  if (!fields.length) fields.push("supplier_response_package");
  const comment = `${reason}\n\n${reinvestigation ? "重新调查要求" : "需要补充的问题"}:\n${questions.map((question, index) => `${index + 1}. ${question}`).join("\n")}`;
  const transition = await transitionQualityCase({
    caseId: input.caseId,
    actor: input.user,
    action: "request_supplier_changes",
    comment,
    requestedFieldIds: fields,
    newDueAt: dueAt.toISOString(),
  });
  if (!transition.ok)
    throw new InternalQualityReviewError(transition.error, transition.status);
  const task = await createQualityCaseTask({
    caseId: input.caseId,
    actor: input.user,
    taskType: "supplier_response",
    participantName: submitted.packageValue.supplier.name,
    participantOrganization:
      submitted.packageValue.supplier.organization || "Supplier",
    expiresAt: dueAt.toISOString(),
    supplierInstructions: {
      source: "internal_review",
      reason,
      questions,
      requestedFieldIds: fields,
    },
  });
  if (!task.ok)
    throw new InternalQualityReviewError(
      `The review decision was saved, but the supplier task could not be created: ${task.error}`,
      task.status,
    );
  return {
    ...task.value,
    questions,
    requestedFieldIds: fields,
    mode: reinvestigation ? "reinvestigate" : "supplement",
  };
}
