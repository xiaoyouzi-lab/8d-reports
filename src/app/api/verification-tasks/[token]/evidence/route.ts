import { PutObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { VerificationError } from "@/lib/quality-cases/effectiveness-verification";
import { createSupplierVerificationEvidence, getSupplierVerificationTask } from "@/lib/quality-cases/verification-tasks";
import { cleanupOrphanedR2Object, getR2Client } from "@/lib/r2";

const ALLOWED = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]);
export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const token = (await params).token; const form = await request.formData().catch(() => null); const file = form?.get("file");
  if (!(file instanceof File) || !ALLOWED.has(file.type) || file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "请上传不超过10MB的PDF、图片、Word或Excel文件。" }, { status: 400 });
  const client = getR2Client(); if (!client) return NextResponse.json({ error: "证据存储暂不可用。" }, { status: 503 });
  let key = ""; let objectUploaded = false;
  try {
    const task = await getSupplierVerificationTask(token); const filename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 180) || "verification-evidence"; key = `quality-cases/${task.qualityCase.id}/verification/${crypto.randomUUID()}-${filename}`;
    await client.send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET_NAME || "8d-reports", Key: key, Body: Buffer.from(await file.arrayBuffer()), ContentType: file.type }));
    objectUploaded = true;
    return NextResponse.json(await createSupplierVerificationEvidence({ token, storagePath: key, filename: file.name, mimeType: file.type, fileSize: file.size, description: String(form?.get("description") || "验证证据") }), { status: 201 });
  } catch (error) {
    if (objectUploaded)
      await cleanupOrphanedR2Object(key, "supplier_verification_evidence_database_failure");
    return error instanceof VerificationError ? NextResponse.json({ error: error.message }, { status: error.status }) : NextResponse.json({ error: "上传失败，请稍后重试。" }, { status: 503 });
  }
}
