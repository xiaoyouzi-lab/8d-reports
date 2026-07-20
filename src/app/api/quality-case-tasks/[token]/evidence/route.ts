import { PutObjectCommand } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";
import {
  createSupplierGuidanceEvidence,
  getActiveSupplierGuidanceSession,
  getSupplierGuidanceEvidenceForRemoval,
  removeSupplierGuidanceEvidence,
  SupplierGuidanceEvidenceError,
} from "@/lib/quality-cases/guided-supplier";
import { cleanupOrphanedR2Object, deleteR2Object, getR2Client } from "@/lib/r2";

const ALLOWED_TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]);
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const sessionId = typeof form?.get("sessionId") === "string" ? String(form.get("sessionId")) : "";
  const requirementId = typeof form?.get("requirementId") === "string" ? String(form.get("requirementId")) : "";
  if (!(file instanceof File)) return NextResponse.json({ error: "A file is required." }, { status: 400 });
  if (!sessionId || !requirementId)
    return NextResponse.json({ error: "请选择需要支持的调查信息后再上传证据。" }, { status: 400 });
  if (!ALLOWED_TYPES.has(file.type) || file.size > MAX_FILE_SIZE) return NextResponse.json({ error: "Use a PDF, image, Word, or Excel file no larger than 10MB." }, { status: 400 });
  let scope;
  try {
    scope = await getActiveSupplierGuidanceSession({ token, sessionId });
  } catch (error) {
    if (error instanceof SupplierGuidanceEvidenceError)
      return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "任务链接不可用。" }, { status: 404 });
  }
  const client = getR2Client();
  if (!client) return NextResponse.json({ error: "Evidence storage is temporarily unavailable." }, { status: 503 });
  const filename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 180) || "evidence";
  // The case id is derived from the token-scoped session, never supplied by
  // the browser.
  const key = `quality-cases/${scope.row.qualityCase.id}/supplier/${crypto.randomUUID()}-${filename}`;
  let objectUploaded = false;
  try {
    await client.send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET_NAME || "8d-reports", Key: key, Body: Buffer.from(await file.arrayBuffer()), ContentType: file.type }));
    objectUploaded = true;
    const evidence = await createSupplierGuidanceEvidence({ token, sessionId, requirementId, storagePath: key, filename: file.name, mimeType: file.type, fileSize: file.size });
    return NextResponse.json(evidence, { status: 201 });
  } catch (error) {
    if (objectUploaded)
      await cleanupOrphanedR2Object(key, "supplier_evidence_database_failure");
    console.error("External evidence upload failed", error instanceof Error ? { name: error.name } : { name: "UnknownError" });
    if (error instanceof SupplierGuidanceEvidenceError)
      return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "Evidence upload is temporarily unavailable. Please try again later." }, { status: 503 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const body = await request.json().catch(() => ({}));
  if (typeof body.sessionId !== "string" || typeof body.evidenceId !== "string")
    return NextResponse.json({ error: "调查会话和证据标识不能为空。" }, { status: 400 });
  try {
    const scoped = await getSupplierGuidanceEvidenceForRemoval({
      token,
      sessionId: body.sessionId,
      evidenceId: body.evidenceId,
    });
    if (!(await deleteR2Object(scoped.evidence.storagePath)))
      return NextResponse.json({ error: "证据文件暂时无法删除，请稍后重试。" }, { status: 503 });
    await removeSupplierGuidanceEvidence({
      token,
      sessionId: body.sessionId,
      evidenceId: body.evidenceId,
    });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("External evidence delete failed", error instanceof Error ? { name: error.name } : { name: "UnknownError" });
    if (error instanceof SupplierGuidanceEvidenceError)
      return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "证据删除未完成，请重试。" }, { status: 503 });
  }
}
