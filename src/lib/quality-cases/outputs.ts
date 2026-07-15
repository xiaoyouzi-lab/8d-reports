import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  qualityCaseActivities,
  qualityCaseOutputs,
  qualityCaseParticipants,
  qualityCaseTexts,
} from "@/lib/db/schema";
import { getQualityCaseAccess } from "@/lib/quality-cases/access";
import {
  buildEightDOutputContent,
  type QualityCaseOutputLanguageMode,
  type QualityCaseTextForOutput,
} from "@/lib/quality-cases/output-content";
import {
  createReportFromData,
  type ReportCreationUser,
} from "@/lib/report-creation";
import { getUserEntitlements } from "@/lib/subscription";
import {
  generateQualityCaseWordDocument,
  qualityCaseDocumentFilename,
} from "@/lib/quality-case-word-export";

function data(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function canCreateEightDOutput(outputType: unknown) {
  return outputType === "8d";
}

export async function createEightDOutput(input: {
  caseId: string;
  user: ReportCreationUser;
  languageMode: unknown;
}) {
  const access = await getQualityCaseAccess(input.caseId, input.user.id);
  if (!access)
    return {
      ok: false as const,
      status: 404,
      error: "Quality Case not found.",
    };
  if (!access.canEdit)
    return {
      ok: false as const,
      status: 403,
      error: "You do not have permission to create this output.",
    };
  if (!canCreateEightDOutput(access.qualityCase.outputType))
    return {
      ok: false as const,
      status: 409,
      error:
        "This Case requires a dedicated output template. It cannot be converted into an 8D report.",
    };
  const languageMode: QualityCaseOutputLanguageMode =
    input.languageMode === "bilingual" ? "bilingual" : "en";
  const caseData = data(access.qualityCase.caseData);
  const translatedFields = await db
    .select({
      fieldPath: qualityCaseTexts.fieldPath,
      original: qualityCaseTexts.original,
      aiTranslation: qualityCaseTexts.aiTranslation,
      confirmedTranslation: qualityCaseTexts.confirmedTranslation,
    })
    .from(qualityCaseTexts)
    .where(eq(qualityCaseTexts.caseId, input.caseId))
    .orderBy(desc(qualityCaseTexts.updatedAt));
  const outputContent = buildEightDOutputContent({
    languageMode,
    caseComplaint: caseData.complaintSummary || caseData.problemDescription,
    // JSON columns are intentionally treated as untrusted; the selector only
    // accepts the exact human-confirmed English shape and ignores all else.
    translations: translatedFields as QualityCaseTextForOutput[],
  });
  if (!outputContent.ok)
    return { ok: false as const, status: 400, error: outputContent.error };
  const result = await createReportFromData({
    user: input.user,
    title: access.qualityCase.title,
    reportType: "customer_8d",
    priority: access.qualityCase.priority,
    source: "quality_case",
    data: {
      customerName: text(caseData.customerName),
      productName: text(caseData.productName),
      ...outputContent.value,
    },
  });
  if (!result.ok)
    return {
      ok: false as const,
      status: result.status,
      error: result.body.error,
    };
  const [output] = await db
    .insert(qualityCaseOutputs)
    .values({
      caseId: input.caseId,
      reportId: result.report.id,
      outputType: "8d",
      languageMode,
    })
    .returning();
  return { ok: true as const, value: { output, report: result.report } };
}

export async function createQualityCaseDocumentOutput(input: {
  caseId: string;
  user: ReportCreationUser;
  languageMode: unknown;
}) {
  const access = await getQualityCaseAccess(input.caseId, input.user.id);
  if (!access)
    return { ok: false as const, status: 404, error: "Quality Case not found." };
  if (!access.canEdit)
    return {
      ok: false as const,
      status: 403,
      error: "You do not have permission to create this output.",
    };
  if (canCreateEightDOutput(access.qualityCase.outputType))
    return {
      ok: false as const,
      status: 409,
      error: "Use the existing 8D output adapter for an 8D Quality Case.",
    };
  const entitlements = await getUserEntitlements(input.user.id);
  if (!entitlements.wordExport)
    return {
      ok: false as const,
      status: 403,
      error: "Dedicated Quality Case Word output requires Pro or Team.",
    };
  const languageMode: QualityCaseOutputLanguageMode =
    input.languageMode === "bilingual" ? "bilingual" : "en";
  const caseData = data(access.qualityCase.caseData);
  const translatedFields = await db
    .select({
      fieldPath: qualityCaseTexts.fieldPath,
      original: qualityCaseTexts.original,
      aiTranslation: qualityCaseTexts.aiTranslation,
      confirmedTranslation: qualityCaseTexts.confirmedTranslation,
    })
    .from(qualityCaseTexts)
    .where(eq(qualityCaseTexts.caseId, input.caseId))
    .orderBy(desc(qualityCaseTexts.updatedAt));
  const outputContent = buildEightDOutputContent({
    languageMode,
    caseComplaint: caseData.complaintSummary || caseData.problemDescription,
    translations: translatedFields as QualityCaseTextForOutput[],
  });
  if (!outputContent.ok)
    return { ok: false as const, status: 400, error: outputContent.error };

  const [assignee] = await db
    .select({ name: qualityCaseParticipants.displayName })
    .from(qualityCaseParticipants)
    .where(
      and(
        eq(qualityCaseParticipants.caseId, input.caseId),
        eq(
          qualityCaseParticipants.userId,
          access.qualityCase.assigneeUserId || access.qualityCase.ownerId,
        ),
      ),
    )
    .limit(1);
  const buffer = await generateQualityCaseWordDocument({
    title: access.qualityCase.title,
    caseId: access.qualityCase.id,
    outputType: access.qualityCase.outputType,
    status: access.qualityCase.status,
    waitingOn: access.qualityCase.waitingOn,
    assignee: assignee?.name || input.user.name || "",
    dueAt: access.qualityCase.dueAt?.toISOString() || null,
    languageMode,
    fields: outputContent.value,
  });
  const [coordinator] = await db
    .select({ organizationName: qualityCaseParticipants.organizationName })
    .from(qualityCaseParticipants)
    .where(
      and(
        eq(qualityCaseParticipants.caseId, input.caseId),
        eq(qualityCaseParticipants.role, "coordinator"),
      ),
    )
    .limit(1);
  await db.insert(qualityCaseOutputs).values({
    caseId: input.caseId,
    outputType: access.qualityCase.outputType,
    languageMode,
  });
  await db.insert(qualityCaseActivities).values({
    caseId: input.caseId,
    version: access.qualityCase.currentVersion,
    actionType: "document_exported",
    actorId: input.user.id,
    actorRole: access.role === "owner" ? "coordinator" : "internal_member",
    actorOrganization: coordinator?.organizationName || null,
    metadata: { outputType: access.qualityCase.outputType, languageMode, format: "docx" },
  });
  return {
    ok: true as const,
    value: {
      buffer,
      filename: qualityCaseDocumentFilename({
        caseId: input.caseId,
        outputType: access.qualityCase.outputType,
      }),
    },
  };
}

export async function listQualityCaseOutputs(caseId: string, userId: string) {
  const access = await getQualityCaseAccess(caseId, userId);
  if (!access) return null;
  return db
    .select()
    .from(qualityCaseOutputs)
    .where(eq(qualityCaseOutputs.caseId, caseId))
    .orderBy(desc(qualityCaseOutputs.createdAt));
}
