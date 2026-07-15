import { createHash, randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  qualityCaseEvidence,
  qualityCaseGuidanceAiRuns,
  qualityCaseGuidanceAnswers,
  qualityCaseGuidanceConfirmations,
  qualityCaseGuidanceEvidenceRequirements,
  qualityCaseGuidanceFieldMappings,
  qualityCaseGuidanceInsights,
  qualityCaseGuidanceQuestions,
  qualityCaseGuidanceSessions,
  qualityCaseParticipants,
  qualityCaseTaskLinks,
  qualityCases,
} from "@/lib/db/schema";
import { submitExternalQualityCaseTask } from "@/lib/quality-cases/external-tasks";
import { hashQualityCaseTaskToken, isActiveQualityCaseTaskLink } from "@/lib/quality-cases/task-tokens";

type PackageDatabase = Pick<typeof db, "select">;
export type SupplierResponseMode = "guided" | "expert";
export type ReadinessStatus = "complete" | "needs_review" | "missing_information" | "missing_evidence";

export interface SupplierResponsePackage {
  schemaVersion: "supplier-response-package-v1";
  packageId: string;
  caseContext: {
    caseId: string;
    caseVersion: number;
    taskId: string;
    sessionId: string;
    product: string | null;
    problemSummary: string;
    taskType: "supplier_response";
    taskStatus: "active";
    taskExpiresAt: string;
    dueAt: string;
  };
  investigation: {
    originalAnswers: Array<{
      id: string;
      answerGroupId: string;
      revision: number;
      supersedesAnswerId: string | null;
      questionId: string;
      stage: string;
      category: string;
      text: string;
      classification: string;
      actorId: string | null;
      participantId: string | null;
      actorOrganization: string | null;
      createdAt: string;
    }>;
    currentAnswers: Array<{ answerGroupId: string; answerId: string; revision: number; stage: string; text: string }>;
    aiRuns: Array<{
      id: string;
      agentType: string;
      promptIdentifier: string;
      promptVersion: string;
      response: unknown;
      confidence: string;
      sourceType: string;
      policyOutcome: string;
      generatedAt: string;
    }>;
    aiInterpretations: Array<{
      aiRunId: string;
      answerId: string;
      summary: string;
      confidence: string;
      status: "unconfirmed";
      generatedAt: string;
    }>;
    insights: Array<{
      id: string;
      kind: string;
      severity: string;
      message: string;
      aiRunId: string;
      confidence: string;
      sourceType: string;
      stage: string | null;
      requiresConfirmation: true;
      generatedAt: string;
    }>;
    missingInformation: Array<{ key: string; reason: string; stage: string | null; answerId: string | null }>;
  };
  evidence: {
    requirements: Array<{
      id: string;
      requirement: string;
      reason: string;
      status: string;
      stage: string | null;
      relatedAnswerId: string | null;
      relatedInsightId: string | null;
      sourceAiRunId: string | null;
      evidenceIds: string[];
    }>;
    files: Array<{
      id: string;
      requirementIds: string[];
      stage: string | null;
      relatedAnswerId: string | null;
      relatedInsightId: string | null;
      associations: Array<{
        requirementId: string;
        stage: string | null;
        relatedAnswerId: string | null;
        relatedInsightId: string | null;
      }>;
      uploaderParticipantId: string | null;
      filename: string;
      mimeType: string | null;
      fileSize: number | null;
      createdAt: string;
    }>;
    unlinkedEvidenceIds: string[];
  };
  readiness: {
    advisoryOnly: true;
    doesNotBlockSubmission: true;
    problemDefinition: ReadinessStatus;
    containment: ReadinessStatus;
    rootCause: ReadinessStatus;
    correctiveAction: ReadinessStatus;
    verification: ReadinessStatus;
    missingInformation: string[];
    risks: string[];
  };
  mappingSuggestions: Array<{
    answerId: string;
    semanticConcept: string;
    semanticKey: string;
    legacy8dFields: string[];
    decision: string;
    writesReport: false;
  }>;
  supplier: { participantId: string | null; name: string; organization: string | null };
  generatedAt: string;
}

type PackageRows = {
  qualityCase: typeof qualityCases.$inferSelect;
  task: typeof qualityCaseTaskLinks.$inferSelect;
  session: typeof qualityCaseGuidanceSessions.$inferSelect;
  participant: typeof qualityCaseParticipants.$inferSelect | null;
  questions: Array<typeof qualityCaseGuidanceQuestions.$inferSelect>;
  answers: Array<typeof qualityCaseGuidanceAnswers.$inferSelect>;
  aiRuns: Array<typeof qualityCaseGuidanceAiRuns.$inferSelect>;
  insights: Array<typeof qualityCaseGuidanceInsights.$inferSelect>;
  requirements: Array<typeof qualityCaseGuidanceEvidenceRequirements.$inferSelect>;
  evidence: Array<typeof qualityCaseEvidence.$inferSelect>;
  mappings: Array<typeof qualityCaseGuidanceFieldMappings.$inferSelect>;
  now: Date;
};

function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
function strings(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}
function firstString(data: Record<string, unknown>, keys: string[]) {
  for (const key of keys) if (typeof data[key] === "string" && String(data[key]).trim()) return String(data[key]).trim();
  return null;
}

export function assembleSupplierResponsePackage(rows: PackageRows): SupplierResponsePackage {
  const answers = [...rows.answers].sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime() || left.revision - right.revision || left.id.localeCompare(right.id));
  const aiRuns = [...rows.aiRuns].sort((left, right) => left.generatedAt.getTime() - right.generatedAt.getTime() || left.id.localeCompare(right.id));
  const insights = [...rows.insights].sort((left, right) => left.generatedAt.getTime() - right.generatedAt.getTime() || left.id.localeCompare(right.id));
  const requirements = [...rows.requirements].sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime() || left.id.localeCompare(right.id));
  const evidence = [...rows.evidence].sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime() || left.id.localeCompare(right.id));
  const mappings = [...rows.mappings].sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime() || left.id.localeCompare(right.id));
  const questionById = new Map(rows.questions.map((question) => [question.id, question]));
  const insightById = new Map(insights.map((insight) => [insight.id, insight]));
  const latestByGroup = new Map<string, typeof rows.answers[number]>();
  for (const answer of answers) {
    const prior = latestByGroup.get(answer.answerGroupId);
    if (!prior || answer.revision > prior.revision) latestByGroup.set(answer.answerGroupId, answer);
  }
  const stageForAnswer = (answerId: string | null) => {
    const answer = answers.find((item) => item.id === answerId);
    return answer ? questionById.get(answer.questionId)?.stage || null : null;
  };
  const requirementLinks = requirements.map((requirement) => {
    const snapshot = record(requirement.requirementSnapshot);
    const relatedInsightId = typeof snapshot.relatedInsightId === "string" ? snapshot.relatedInsightId : null;
    const relatedInsight = relatedInsightId ? insightById.get(relatedInsightId) : null;
    return {
      id: requirement.id,
      requirement: requirement.requirementKey,
      reason: requirement.reason,
      status: requirement.status,
      stage: typeof snapshot.stage === "string" ? snapshot.stage : requirement.questionId ? questionById.get(requirement.questionId)?.stage || stageForAnswer(requirement.answerId) : stageForAnswer(requirement.answerId) || stageForAnswer(relatedInsight?.answerId || null),
      relatedAnswerId: requirement.answerId || relatedInsight?.answerId || null,
      relatedInsightId,
      sourceAiRunId: requirement.aiRunId,
      evidenceIds: strings(snapshot.evidenceIds),
    };
  });
  const evidenceFiles = evidence.map((file) => {
    const linked = requirementLinks.filter((requirement) => requirement.evidenceIds.includes(file.id));
    return {
      id: file.id,
      requirementIds: linked.map((item) => item.id),
      stage: linked.find((item) => item.stage)?.stage || null,
      relatedAnswerId: linked.find((item) => item.relatedAnswerId)?.relatedAnswerId || null,
      relatedInsightId: linked.find((item) => item.relatedInsightId)?.relatedInsightId || null,
      associations: linked.map((item) => ({ requirementId: item.id, stage: item.stage, relatedAnswerId: item.relatedAnswerId, relatedInsightId: item.relatedInsightId })),
      uploaderParticipantId: file.uploadedByParticipantId,
      filename: file.filename,
      mimeType: file.mimeType,
      fileSize: file.fileSize,
      createdAt: file.createdAt.toISOString(),
    };
  });
  const current = [...latestByGroup.values()];
  const stages = new Set(current.map((answer) => questionById.get(answer.questionId)?.stage).filter(Boolean));
  const missingFromAnswers = answers.flatMap((answer) => strings(answer.missingInformation).map((key) => ({ key, reason: "Supplier answer identified missing information.", stage: stageForAnswer(answer.id), answerId: answer.id })));
  const missingFromInsights = insights.filter((insight) => insight.kind === "missing_information" && !insight.resolvedAt).map((insight) => ({ key: insight.insightKey, reason: insight.message, stage: stageForAnswer(insight.answerId), answerId: insight.answerId }));
  const missingRequirements = requirementLinks.filter((item) => item.status === "open" && item.evidenceIds.length === 0).map((item) => ({ key: item.requirement, reason: item.reason, stage: item.stage, answerId: item.relatedAnswerId }));
  const missingInformation = [...missingFromAnswers, ...missingFromInsights, ...missingRequirements];
  const riskMessages = insights.filter((insight) => insight.kind === "logic_risk" || insight.severity === "high").map((insight) => insight.message);
  const verificationRequirements = requirementLinks.filter((item) => item.stage === "verification_and_prevention");
  const readiness = {
    advisoryOnly: true as const,
    doesNotBlockSubmission: true as const,
    problemDefinition: stages.has("problem_description") ? "complete" as const : "missing_information" as const,
    containment: stages.has("containment") ? "complete" as const : "missing_information" as const,
    rootCause: stages.has("occurrence_cause") && stages.has("escape_cause") ? "needs_review" as const : "missing_information" as const,
    correctiveAction: stages.has("corrective_action") ? "needs_review" as const : "missing_information" as const,
    verification: !stages.has("verification_and_prevention") ? "missing_information" as const : verificationRequirements.some((item) => item.status === "open" && item.evidenceIds.length === 0) ? "missing_evidence" as const : "needs_review" as const,
    missingInformation: missingInformation.map((item) => item.key),
    risks: riskMessages,
  };
  const caseData = record(rows.qualityCase.caseData);
  const base = {
    schemaVersion: "supplier-response-package-v1" as const,
    caseContext: {
      caseId: rows.qualityCase.id,
      caseVersion: rows.qualityCase.currentVersion,
      taskId: rows.task.id,
      sessionId: rows.session.id,
      product: firstString(caseData, ["product", "productName", "partNumber"]),
      problemSummary: firstString(caseData, ["complaintSummary", "problemDescription"]) || rows.qualityCase.title,
      taskType: "supplier_response" as const,
      taskStatus: "active" as const,
      taskExpiresAt: rows.task.expiresAt.toISOString(),
      dueAt: (rows.qualityCase.dueAt || rows.task.expiresAt).toISOString(),
    },
    investigation: {
      originalAnswers: answers.map((answer) => ({ id: answer.id, answerGroupId: answer.answerGroupId, revision: answer.revision, supersedesAnswerId: answer.supersedesAnswerId, questionId: answer.questionId, stage: questionById.get(answer.questionId)?.stage || "unknown", category: questionById.get(answer.questionId)?.category || "unknown", text: answer.originalText, classification: answer.classification, actorId: answer.actorId, participantId: answer.actorParticipantId, actorOrganization: answer.actorOrganization, createdAt: answer.createdAt.toISOString() })),
      currentAnswers: current.map((answer) => ({ answerGroupId: answer.answerGroupId, answerId: answer.id, revision: answer.revision, stage: questionById.get(answer.questionId)?.stage || "unknown", text: answer.originalText })),
      aiRuns: aiRuns.map((run) => ({ id: run.id, agentType: run.agentType, promptIdentifier: run.promptIdentifier, promptVersion: run.promptVersion, response: run.response, confidence: run.confidence, sourceType: run.sourceType, policyOutcome: run.policyOutcome, generatedAt: run.generatedAt.toISOString() })),
      aiInterpretations: aiRuns.flatMap((run) => {
        const response = record(run.response);
        const requestMetadata = record(run.requestMetadata);
        const answerId = typeof requestMetadata.answerId === "string" ? requestMetadata.answerId : null;
        const summary = typeof response.answerRestatement === "string" ? response.answerRestatement.trim() : "";
        return answerId && summary ? [{ aiRunId: run.id, answerId, summary, confidence: run.confidence, status: "unconfirmed" as const, generatedAt: run.generatedAt.toISOString() }] : [];
      }),
      insights: insights.map((insight) => ({ id: insight.id, kind: insight.kind, severity: insight.severity, message: insight.message, aiRunId: insight.aiRunId, confidence: insight.confidence, sourceType: insight.sourceType, stage: stageForAnswer(insight.answerId), requiresConfirmation: true as const, generatedAt: insight.generatedAt.toISOString() })),
      missingInformation,
    },
    evidence: { requirements: requirementLinks, files: evidenceFiles, unlinkedEvidenceIds: evidenceFiles.filter((file) => file.requirementIds.length === 0).map((file) => file.id) },
    readiness,
    mappingSuggestions: mappings.map((mapping) => ({ answerId: mapping.answerId, semanticConcept: mapping.qualityConcept, semanticKey: mapping.semanticKey, legacy8dFields: strings(record(mapping.targetReference).legacy8dFields), decision: mapping.decision, writesReport: false as const })),
    supplier: { participantId: rows.participant?.id || null, name: rows.participant?.displayName || "Supplier", organization: rows.participant?.organizationName || null },
    generatedAt: rows.now.toISOString(),
  };
  // The identifier addresses investigation content, not the time a reader
  // happened to build the projection. Rebuilding an unchanged ledger must
  // therefore produce the same package id.
  const packageId = createHash("sha256").update(JSON.stringify({ ...base, generatedAt: undefined })).digest("hex");
  return { ...base, packageId };
}

async function loadPackageRows(input: { token: string; sessionId: string; database: PackageDatabase; now?: Date }) {
  const database = input.database;
  const [root] = await database.select({ task: qualityCaseTaskLinks, qualityCase: qualityCases, participant: qualityCaseParticipants })
    .from(qualityCaseTaskLinks)
    .innerJoin(qualityCases, eq(qualityCaseTaskLinks.caseId, qualityCases.id))
    .leftJoin(qualityCaseParticipants, eq(qualityCaseTaskLinks.participantId, qualityCaseParticipants.id))
    .where(eq(qualityCaseTaskLinks.tokenHash, hashQualityCaseTaskToken(input.token))).limit(1);
  if (!root || root.task.taskType !== "supplier_response" || !isActiveQualityCaseTaskLink({ ...root.task, now: input.now })) throw new SupplierResponsePackageError("Supplier task is unavailable or expired.", 404);
  const [session] = await database.select().from(qualityCaseGuidanceSessions).where(and(eq(qualityCaseGuidanceSessions.id, input.sessionId), eq(qualityCaseGuidanceSessions.caseId, root.qualityCase.id), eq(qualityCaseGuidanceSessions.taskLinkId, root.task.id))).limit(1);
  if (!session) throw new SupplierResponsePackageError("Guided session does not belong to this supplier task.", 404);
  const [questions, answers, aiRuns, insights, requirements, evidence, mappings] = await Promise.all([
    database.select().from(qualityCaseGuidanceQuestions).where(eq(qualityCaseGuidanceQuestions.sessionId, session.id)),
    database.select().from(qualityCaseGuidanceAnswers).where(eq(qualityCaseGuidanceAnswers.sessionId, session.id)),
    database.select().from(qualityCaseGuidanceAiRuns).where(eq(qualityCaseGuidanceAiRuns.sessionId, session.id)),
    database.select().from(qualityCaseGuidanceInsights).where(eq(qualityCaseGuidanceInsights.sessionId, session.id)),
    database.select().from(qualityCaseGuidanceEvidenceRequirements).where(eq(qualityCaseGuidanceEvidenceRequirements.sessionId, session.id)),
    database.select().from(qualityCaseEvidence).where(and(eq(qualityCaseEvidence.caseId, root.qualityCase.id), eq(qualityCaseEvidence.uploadedByParticipantId, root.task.participantId || "00000000-0000-0000-0000-000000000000"))),
    database.select().from(qualityCaseGuidanceFieldMappings).where(eq(qualityCaseGuidanceFieldMappings.sessionId, session.id)),
  ]);
  return { qualityCase: root.qualityCase, task: root.task, participant: root.participant, session, questions, answers, aiRuns, insights, requirements, evidence, mappings, now: input.now || new Date() } satisfies PackageRows;
}

export class SupplierResponsePackageError extends Error {
  constructor(message: string, public readonly status = 400) { super(message); this.name = "SupplierResponsePackageError"; }
}

export function isSupplierResponseTaskScopeValid(input: {
  expiresAt: Date;
  revokedAt: Date | null;
  now?: Date;
}) {
  return !input.revokedAt && input.expiresAt.getTime() > (input.now || new Date()).getTime();
}

export async function buildSupplierResponsePackage(input: { token: string; sessionId: string; database?: PackageDatabase; now?: Date }) {
  return assembleSupplierResponsePackage(await loadPackageRows({ ...input, database: input.database || db }));
}

function packageSubmissionText(packageValue: SupplierResponsePackage) {
  return packageValue.investigation.currentAnswers.map((answer) => `[${answer.stage}] ${answer.text}`).join("\n\n").slice(0, 12000) || "Supplier submitted an auditable response package for internal review.";
}

type SubmissionResult = { status: string; packageId: string; confirmationId: string; alreadySubmitted: boolean };
type ExistingSubmission = { id: string; packageId: string; status: string };
export interface SupplierResponseSubmissionDependencies {
  inspect(): Promise<{ completed: boolean; existing: ExistingSubmission | null }>;
  buildPackage(): Promise<SupplierResponsePackage>;
  commitAtomic(packageValue: SupplierResponsePackage, confirmationText: string): Promise<
    | { ok: true; status: string; confirmationId: string }
    | { ok: false; status: number; error: string }
  >;
}

export async function submitSupplierResponsePackageWithDependencies(
  input: { confirmationText: string },
  dependencies: SupplierResponseSubmissionDependencies,
): Promise<SubmissionResult> {
  const before = await dependencies.inspect();
  if (before.existing) return { status: before.existing.status, packageId: before.existing.packageId, confirmationId: before.existing.id, alreadySubmitted: true };
  if (before.completed) throw new SupplierResponsePackageError("Supplier task is already completed without a response package.", 409);
  const packageValue = await dependencies.buildPackage();
  const committed = await dependencies.commitAtomic(packageValue, input.confirmationText);
  if (!committed.ok) {
    const afterFailure = await dependencies.inspect();
    if (afterFailure.existing) return { status: afterFailure.existing.status, packageId: afterFailure.existing.packageId, confirmationId: afterFailure.existing.id, alreadySubmitted: true };
    throw new SupplierResponsePackageError(committed.error, committed.status);
  }
  return { status: committed.status, packageId: packageValue.packageId, confirmationId: committed.confirmationId, alreadySubmitted: false };
}

export async function submitSupplierResponsePackage(input: { token: string; sessionId: string; mode: SupplierResponseMode; confirmationText: string; now?: Date }) {
  if (input.mode !== "guided" && input.mode !== "expert") throw new SupplierResponsePackageError("Supplier response mode is invalid.");
  const confirmationText = input.confirmationText.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, 2000);
  if (!confirmationText) throw new SupplierResponsePackageError("Supplier confirmation is required.");
  const now = input.now || new Date();
  const inspectSubmission = async () => {
    const [scope] = await db.select({
      completedAt: qualityCaseTaskLinks.completedAt,
      expiresAt: qualityCaseTaskLinks.expiresAt,
      revokedAt: qualityCaseTaskLinks.revokedAt,
    }).from(qualityCaseGuidanceSessions)
      .innerJoin(qualityCaseTaskLinks, eq(qualityCaseGuidanceSessions.taskLinkId, qualityCaseTaskLinks.id))
      .where(and(
        eq(qualityCaseGuidanceSessions.id, input.sessionId),
        eq(qualityCaseTaskLinks.tokenHash, hashQualityCaseTaskToken(input.token)),
        eq(qualityCaseTaskLinks.taskType, "supplier_response"),
      )).limit(1);
    if (!scope || !isSupplierResponseTaskScopeValid({ ...scope, now })) throw new SupplierResponsePackageError("Supplier task is unavailable or expired.", 404);
    const [existing] = await db.select({
      confirmation: qualityCaseGuidanceConfirmations,
      status: qualityCases.status,
    }).from(qualityCaseGuidanceConfirmations)
      .innerJoin(qualityCases, eq(qualityCaseGuidanceConfirmations.caseId, qualityCases.id))
      .where(and(
        eq(qualityCaseGuidanceConfirmations.sessionId, input.sessionId),
        eq(qualityCaseGuidanceConfirmations.confirmationType, "supplier_response_package"),
        eq(qualityCaseGuidanceConfirmations.decision, "submitted"),
      )).limit(1);
    return {
      completed: Boolean(scope.completedAt),
      existing: existing && scope.completedAt ? {
        id: existing.confirmation.id,
        packageId: String(record(existing.confirmation.confirmedSnapshot).packageId || ""),
        status: existing.status,
      } : null,
    };
  };
  return submitSupplierResponsePackageWithDependencies({ confirmationText }, {
    inspect: inspectSubmission,
    buildPackage: () => buildSupplierResponsePackage({ token: input.token, sessionId: input.sessionId, now }),
    async commitAtomic(packageValue, sanitizedConfirmation) {
      const confirmationId = randomUUID();
      const submitted = await submitExternalQualityCaseTask({
        token: input.token,
        action: "supplier_submit",
        response: packageSubmissionText(packageValue),
        evidenceIds: packageValue.evidence.files.map((file) => file.id),
        submissionMetadata: {
          supplierResponsePackage: true,
          packageId: packageValue.packageId,
          confirmationId,
          sessionId: input.sessionId,
          mode: input.mode,
        },
        supplierPackageSubmission: {
          sessionId: input.sessionId,
          submittedAt: now,
          expectedLedgerCounts: {
            answers: packageValue.investigation.originalAnswers.length,
            aiRuns: packageValue.investigation.aiRuns.length,
            insights: packageValue.investigation.insights.length,
            evidenceRequirements: packageValue.evidence.requirements.length,
            evidence: packageValue.evidence.files.length,
            mappings: packageValue.mappingSuggestions.length,
          },
          confirmation: {
            id: confirmationId,
            caseId: packageValue.caseContext.caseId,
            sessionId: input.sessionId,
            confirmationType: "supplier_response_package",
            decision: "submitted",
            comment: sanitizedConfirmation,
            actorParticipantId: packageValue.supplier.participantId,
            actorOrganization: packageValue.supplier.organization,
            confirmedSnapshot: {
              packageId: packageValue.packageId,
              schemaVersion: packageValue.schemaVersion,
              mode: input.mode,
              caseVersion: packageValue.caseContext.caseVersion,
              confirmationText: sanitizedConfirmation,
              supplier: packageValue.supplier,
              responsePackage: packageValue,
            },
            confirmedAt: now,
          },
        },
      });
      return submitted.ok
        ? { ok: true, status: submitted.value.status, confirmationId }
        : submitted;
    },
  });
}
