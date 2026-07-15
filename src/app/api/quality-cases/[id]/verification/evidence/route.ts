import { PutObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-helpers";
import { createVerificationEvidenceRecord, VerificationError } from "@/lib/quality-cases/effectiveness-verification";
import { cleanupOrphanedR2Object, getR2Client } from "@/lib/r2";

const ALLOWED = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]);
const MAX_SIZE = 10 * 1024 * 1024;
export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();
  const caseId = (await params).id;
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File) || !ALLOWED.has(file.type) || file.size > MAX_SIZE)
    return NextResponse.json({ error: "Use a PDF, image, Word, or Excel file no larger than 10MB." }, { status: 400 });
  const client = getR2Client();
  if (!client) return NextResponse.json({ error: "Evidence storage is temporarily unavailable." }, { status: 503 });
  const filename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 180) || "verification-evidence";
  const key = `quality-cases/${caseId}/verification/${crypto.randomUUID()}-${filename}`;
  let objectUploaded = false;
  try {
    await client.send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET_NAME || "8d-reports", Key: key, Body: Buffer.from(await file.arrayBuffer()), ContentType: file.type }));
    objectUploaded = true;
    return NextResponse.json(await createVerificationEvidenceRecord({ caseId, userId: user.id, storagePath: key, filename: file.name, mimeType: file.type, fileSize: file.size, evidenceType: String(form?.get("evidenceType") || "verification_record"), description: String(form?.get("description") || "Verification evidence") }), { status: 201 });
  } catch (error) {
    if (objectUploaded)
      await cleanupOrphanedR2Object(key, "verification_evidence_database_failure");
    if (error instanceof VerificationError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("Verification evidence upload failed", error);
    return NextResponse.json({ error: "Evidence upload is temporarily unavailable." }, { status: 503 });
  }
}
