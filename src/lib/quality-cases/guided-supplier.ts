import { and, eq, gt, isNull } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { qualityCaseGuidanceAnswers, qualityCaseGuidanceQuestions, qualityCaseGuidanceSessions, qualityCaseParticipants, qualityCaseTaskLinks, qualityCases } from "@/lib/db/schema";
import { classifyGuidedAnswer, GUIDED_QUESTIONS } from "@/lib/quality-cases/guided-contract";
import { GuidedInvestigatorError, runGuidedInvestigator } from "@/lib/quality-cases/guided-investigator";
import { parseSupplierFollowUpInstructions } from "@/lib/quality-cases/external-tasks";
import { hashQualityCaseTaskToken } from "@/lib/quality-cases/task-tokens";

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
  };
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
