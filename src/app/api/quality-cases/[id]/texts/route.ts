import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { qualityCaseTexts } from "@/lib/db/schema";
import { getQualityCaseAccess } from "@/lib/quality-cases/access";

function language(value: unknown): "en" | "zh-CN" | null {
  return value === "en" || value === "zh-CN" ? value : null;
}
function text(value: unknown) {
  return typeof value === "string"
    ? value
        .replace(/[\u0000-\u001f\u007f]/g, " ")
        .trim()
        .slice(0, 12000)
    : "";
}

export const dynamic = "force-dynamic";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();
  const { id } = await params;
  const access = await getQualityCaseAccess(id, user.id);
  if (!access)
    return NextResponse.json(
      { error: "Quality Case not found." },
      { status: 404 },
    );
  return NextResponse.json(
    await db
      .select()
      .from(qualityCaseTexts)
      .where(eq(qualityCaseTexts.caseId, id)),
  );
}
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();
  const { id } = await params;
  const access = await getQualityCaseAccess(id, user.id);
  if (!access)
    return NextResponse.json(
      { error: "Quality Case not found." },
      { status: 404 },
    );
  if (!access.canEdit)
    return NextResponse.json(
      { error: "You do not have permission to edit bilingual content." },
      { status: 403 },
    );
  const body = await request.json().catch(() => ({}));
  const fieldPath = text(body.fieldPath).slice(0, 180);
  const originalLanguage = language(body.original?.language);
  const originalText = text(body.original?.text);
  if (!fieldPath || !originalLanguage || !originalText)
    return NextResponse.json(
      { error: "Field path and original text are required." },
      { status: 400 },
    );
  const aiLanguage = language(body.aiTranslation?.language);
  const aiText = text(body.aiTranslation?.text);
  const confirmedLanguage = language(body.confirmedTranslation?.language);
  const confirmedText = text(body.confirmedTranslation?.text);
  const original = { language: originalLanguage, text: originalText };
  const aiTranslation =
    aiLanguage && aiText
      ? {
          language: aiLanguage,
          text: aiText,
          generatedAt: new Date().toISOString(),
        }
      : null;
  const confirmedTranslation =
    confirmedLanguage && confirmedText
      ? {
          language: confirmedLanguage,
          text: confirmedText,
          confirmedAt: new Date().toISOString(),
          confirmedBy: user.id,
        }
      : null;
  const [existing] = await db
    .select({ id: qualityCaseTexts.id })
    .from(qualityCaseTexts)
    .where(
      and(
        eq(qualityCaseTexts.caseId, id),
        eq(qualityCaseTexts.fieldPath, fieldPath),
      ),
    )
    .limit(1);
  const [saved] = existing
    ? await db
        .update(qualityCaseTexts)
        .set({
          original,
          aiTranslation,
          confirmedTranslation,
          updatedAt: new Date(),
        })
        .where(eq(qualityCaseTexts.id, existing.id))
        .returning()
    : await db
        .insert(qualityCaseTexts)
        .values({
          caseId: id,
          fieldPath,
          original,
          aiTranslation,
          confirmedTranslation,
        })
        .returning();
  return NextResponse.json(saved);
}
