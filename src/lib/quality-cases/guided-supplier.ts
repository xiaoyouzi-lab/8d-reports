import { and, eq, gt, isNull } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import {
  qualityCaseEvidence,
  qualityCaseGuidanceAnswers,
  qualityCaseGuidanceEvidenceRequirements,
  qualityCaseGuidanceQuestions,
  qualityCaseGuidanceSessions,
  qualityCaseParticipants,
  qualityCaseTaskLinks,
  qualityCases,
} from "@/lib/db/schema";
import { classifyGuidedAnswer, GUIDED_QUESTIONS } from "@/lib/quality-cases/guided-contract";
import { GuidedInvestigatorError, runGuidedInvestigator } from "@/lib/quality-cases/guided-investigator";
import { parseSupplierFollowUpInstructions } from "@/lib/quality-cases/external-tasks";
import { buildSupplierResponsePackage } from "@/lib/quality-cases/supplier-response-package";
import { hashQualityCaseTaskToken } from "@/lib/quality-cases/task-tokens";

function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function stringList(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export class SupplierGuidanceEvidenceError extends Error {
  constructor(message: string, public readonly status = 400) {
    super(message);
    this.name = "SupplierGuidanceEvidenceError";
  }
}

async function activeSupplierTask(token: string) {
  const [row] = await db.select({ task: qualityCaseTaskLinks, participant: qualityCaseParticipants, qualityCase: qualityCases })
    .from(qualityCaseTaskLinks)
    .innerJoin(qualityCases, eq(qualityCaseTaskLinks.caseId, qualityCases.id))
    .leftJoin(qualityCaseParticipants, eq(qualityCaseTaskLinks.participantId, qualityCaseParticipants.id))
    .where(and(eq(qualityCaseTaskLinks.tokenHash, hashQualityCaseTaskToken(token)), eq(qualityCaseTaskLinks.taskType, "supplier_response"), isNull(qualityCaseTaskLinks.revokedAt), isNull(qualityCaseTaskLinks.completedAt), gt(qualityCaseTaskLinks.expiresAt, new Date())))
    .limit(1);
  return row || null;
}

export async function getSupplierGuidance(token: string) {
  const row = await activeSupplierTask(token);
  if (!row) return null;
  let [session] = await db.select().from(qualityCaseGuidanceSessions).where(eq(qualityCaseGuidanceSessions.taskLinkId, row.task.id)).limit(1);
  if (!session) {
    const first = GUIDED_QUESTIONS[0];
    [session] = await db.insert(qualityCaseGuidanceSessions).values({ caseId: row.qualityCase.id, taskLinkId: row.task.id, participantId: row.participant?.id || null, promptPolicyVersion: "guided-investigator-v1" }).returning();
    await db.insert(qualityCaseGuidanceQuestions).values({ caseId: row.qualityCase.id, sessionId: session.id, questionKey: first.id, questionVersion: "v1", sourceType: "system_template", stage: first.stage, category: first.category, userFacingQuestion: first.userFacingQuestion, explanation: first.explanation, qualityConcepts: first.mappedQualityConcepts, followUpRuleIds: first.followUpRuleIds, evidenceRequirementIds: first.evidenceRequirementIds });
  }
  const questions = await db.select().from(qualityCaseGuidanceQuestions).where(eq(qualityCaseGuidanceQuestions.sessionId, session.id));
  const answers = await db.select().from(qualityCaseGuidanceAnswers).where(eq(qualityCaseGuidanceAnswers.sessionId, session.id));
  const answered = new Set(answers.map((answer) => answer.questionId));
  const currentQuestion =
    [...questions].reverse().find((question) => !answered.has(question.id)) ||
    null;
  const responsePackage = await buildSupplierResponsePackage({
    token,
    sessionId: session.id,
  });
  return {
    sessionId: session.id,
    question: currentQuestion,
    progress: { answered: answers.length, total: Math.max(6, questions.length) },
    followUp: parseSupplierFollowUpInstructions(row.task.authorizedResponse),
    caseSummary: {
      title: row.qualityCase.title,
      complaintSummary:
        typeof (row.qualityCase.caseData as Record<string, unknown>)
          ?.complaintSummary === "string"
          ? (row.qualityCase.caseData as Record<string, unknown>).complaintSummary
          : "待确认的问题摘要",
      dueAt:
        row.qualityCase.dueAt?.toISOString() ||
        row.task.expiresAt.toISOString(),
      participantName: row.participant?.displayName || "供应商",
    },
    submission: {
      canSubmit: responsePackage.investigation.originalAnswers.length > 0,
      answeredQuestions: answers.length,
      totalQuestions: Math.max(questions.length, 6),
      currentAnswers: responsePackage.investigation.currentAnswers.map((answer) => ({
        id: answer.answerId,
        stage: answer.stage,
        text: answer.text,
      })),
      evidence: responsePackage.evidence,
      readiness: responsePackage.readiness,
      missingInformation: responsePackage.investigation.missingInformation,
      risks: responsePackage.readiness.risks,
    },
  };
}

export async function getActiveSupplierGuidanceSession(input: {
  token: string;
  sessionId: string;
}) {
  const row = await activeSupplierTask(input.token);
  if (!row)
    throw new SupplierGuidanceEvidenceError("任务链接不可用、已过期或已完成。", 404);
  const [session] = await db
    .select()
    .from(qualityCaseGuidanceSessions)
    .where(
      and(
        eq(qualityCaseGuidanceSessions.id, input.sessionId),
        eq(qualityCaseGuidanceSessions.caseId, row.qualityCase.id),
        eq(qualityCaseGuidanceSessions.taskLinkId, row.task.id),
      ),
    )
    .limit(1);
  if (!session)
    throw new SupplierGuidanceEvidenceError("调查会话不可用，请刷新页面。", 404);
  return { row, session };
}

/**
 * Creates an Evidence record and its Guided requirement association in the
 * same Neon batch. R2 upload is deliberately handled by the route first; the
 * caller compensates by deleting the object if this database write fails.
 */
export async function createSupplierGuidanceEvidence(input: {
  token: string;
  sessionId: string;
  requirementId: string;
  storagePath: string;
  filename: string;
  mimeType: string;
  fileSize: number;
}) {
  const { row, session } = await getActiveSupplierGuidanceSession(input);
  const [requirement] = await db
    .select()
    .from(qualityCaseGuidanceEvidenceRequirements)
    .where(
      and(
        eq(qualityCaseGuidanceEvidenceRequirements.id, input.requirementId),
        eq(qualityCaseGuidanceEvidenceRequirements.caseId, row.qualityCase.id),
        eq(qualityCaseGuidanceEvidenceRequirements.sessionId, session.id),
      ),
    )
    .limit(1);
  if (!requirement)
    throw new SupplierGuidanceEvidenceError("请选择当前调查中需要补充的证据。", 404);

  const evidenceId = randomUUID();
  const snapshot = record(requirement.requirementSnapshot);
  const evidenceIds = [...new Set([...stringList(snapshot.evidenceIds), evidenceId])];
  await db.batch([
    db.insert(qualityCaseEvidence).values({
      id: evidenceId,
      caseId: row.qualityCase.id,
      uploadedByParticipantId: row.task.participantId,
      visibility: "internal",
      storagePath: input.storagePath,
      filename: input.filename,
      mimeType: input.mimeType,
      fileSize: input.fileSize,
    }),
    db
      .update(qualityCaseGuidanceEvidenceRequirements)
      .set({
        requirementSnapshot: { ...snapshot, evidenceIds },
        status: "satisfied",
        satisfiedAt: new Date(),
      })
      .where(eq(qualityCaseGuidanceEvidenceRequirements.id, requirement.id)),
  ]);
  return { id: evidenceId, filename: input.filename, fileSize: input.fileSize };
}

export async function getSupplierGuidanceEvidenceForRemoval(input: {
  token: string;
  sessionId: string;
  evidenceId: string;
}) {
  const { row, session } = await getActiveSupplierGuidanceSession(input);
  const [evidence] = await db
    .select()
    .from(qualityCaseEvidence)
    .where(
      and(
        eq(qualityCaseEvidence.id, input.evidenceId),
        eq(qualityCaseEvidence.caseId, row.qualityCase.id),
        eq(
          qualityCaseEvidence.uploadedByParticipantId,
          row.task.participantId || "00000000-0000-0000-0000-000000000000",
        ),
      ),
    )
    .limit(1);
  if (!evidence)
    throw new SupplierGuidanceEvidenceError("只能删除本次任务上传的证据。", 404);
  const requirements = await db
    .select()
    .from(qualityCaseGuidanceEvidenceRequirements)
    .where(
      and(
        eq(qualityCaseGuidanceEvidenceRequirements.caseId, row.qualityCase.id),
        eq(qualityCaseGuidanceEvidenceRequirements.sessionId, session.id),
      ),
    );
  return { row, session, evidence, requirements };
}

/** Supplier tokens may read only Evidence uploaded by their own participant. */
export async function getAuthorizedSupplierGuidanceEvidence(
  token: string,
  evidenceId: string,
) {
  const row = await activeSupplierTask(token);
  if (!row) return null;
  const [evidence] = await db
    .select()
    .from(qualityCaseEvidence)
    .where(
      and(
        eq(qualityCaseEvidence.id, evidenceId),
        eq(qualityCaseEvidence.caseId, row.qualityCase.id),
        eq(
          qualityCaseEvidence.uploadedByParticipantId,
          row.task.participantId || "00000000-0000-0000-0000-000000000000",
        ),
      ),
    )
    .limit(1);
  return evidence || null;
}

/**
 * Removes the database record and all associations to the current Guided
 * session only after the route has removed the object from R2. A retry is safe
 * because R2 DeleteObject is idempotent and the scoped lookup will then reject
 * a previously removed Evidence record.
 */
export async function removeSupplierGuidanceEvidence(input: {
  token: string;
  sessionId: string;
  evidenceId: string;
}) {
  const data = await getSupplierGuidanceEvidenceForRemoval(input);
  const updates = data.requirements
    .filter((requirement) =>
      stringList(record(requirement.requirementSnapshot).evidenceIds).includes(
        data.evidence.id,
      ),
    )
    .map((requirement) => {
      const snapshot = record(requirement.requirementSnapshot);
      const evidenceIds = stringList(snapshot.evidenceIds).filter(
        (id) => id !== data.evidence.id,
      );
      return db
        .update(qualityCaseGuidanceEvidenceRequirements)
        .set({
          requirementSnapshot: { ...snapshot, evidenceIds },
          status: evidenceIds.length ? "satisfied" : "open",
          satisfiedAt: evidenceIds.length ? requirement.satisfiedAt : null,
        })
        .where(eq(qualityCaseGuidanceEvidenceRequirements.id, requirement.id));
    });
  const removeEvidence = db
    .delete(qualityCaseEvidence)
    .where(eq(qualityCaseEvidence.id, data.evidence.id));
  if (updates.length) {
    await db.batch([updates[0], ...updates.slice(1), removeEvidence]);
  } else {
    await removeEvidence;
  }
  return { storagePath: data.evidence.storagePath };
}

export async function answerSupplierGuidance(input: { token: string; sessionId: string; questionId: string; answer: string }) {
  const row = await activeSupplierTask(input.token);
  if (!row) return { ok: false as const, status: 404, error: "任务链接不可用" };
  const value = input.answer.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, 6000);
  if (!value) return { ok: false as const, status: 400, error: "请先填写您的实际情况。" };
  const [question] = await db.select().from(qualityCaseGuidanceQuestions).where(and(eq(qualityCaseGuidanceQuestions.id, input.questionId), eq(qualityCaseGuidanceQuestions.sessionId, input.sessionId), eq(qualityCaseGuidanceQuestions.caseId, row.qualityCase.id))).limit(1);
  if (!question) return { ok: false as const, status: 404, error: "当前问题不可用，请刷新页面。" };
  const [answer] = await db.insert(qualityCaseGuidanceAnswers).values({ caseId: row.qualityCase.id, sessionId: input.sessionId, questionId: question.id, answerGroupId: randomUUID(), revision: 1, sourceType: "supplier_guest", actorParticipantId: row.participant?.id || null, actorOrganization: row.participant?.organizationName || null, originalText: value, language: "zh-CN", classification: classifyGuidedAnswer({ category: question.category as never, originalAnswer: value }), linkedQualityConcepts: question.qualityConcepts, missingInformation: [], followUpQuestionIds: [], evidenceRequirementIds: question.evidenceRequirementIds }).returning();
  try {
    const result = await runGuidedInvestigator({ caseId: row.qualityCase.id, sessionId: input.sessionId, questionId: question.id, answerId: answer.id, actorId: `external:${row.participant?.id || "supplier"}` });
    return { ok: true as const, value: result };
  } catch (error) {
    return { ok: true as const, value: { answerSaved: true, aiUnavailable: true, error: error instanceof GuidedInvestigatorError ? error.message : "AI助手暂时不可用，您的回答已保存。", mayTransitionCase: false } };
  }
}
