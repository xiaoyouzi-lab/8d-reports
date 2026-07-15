import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { qualityCaseEvidence } from "@/lib/db/schema";
import { getQualityCaseAccess } from "@/lib/quality-cases/access";
import { getR2ObjectBuffer } from "@/lib/r2";

export const dynamic = "force-dynamic";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();
  const { id } = await params;
  const [evidence] = await db
    .select()
    .from(qualityCaseEvidence)
    .where(eq(qualityCaseEvidence.id, id))
    .limit(1);
  if (!evidence || !(await getQualityCaseAccess(evidence.caseId, user.id)))
    return NextResponse.json({ error: "Evidence not found." }, { status: 404 });
  const object = await getR2ObjectBuffer(evidence.storagePath);
  if (!object)
    return NextResponse.json(
      { error: "Evidence file is unavailable." },
      { status: 404 },
    );
  const filename = evidence.filename.replace(/["\r\n]/g, "_");
  return new NextResponse(new Uint8Array(object.buffer), {
    headers: {
      "Content-Type":
        evidence.mimeType || object.contentType || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, max-age=300",
    },
  });
}
