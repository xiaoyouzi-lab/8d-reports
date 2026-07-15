import { PutObjectCommand } from "@aws-sdk/client-s3";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { qualityCaseEvidence, qualityCaseTaskLinks } from "@/lib/db/schema";
import { getExternalQualityCaseTask } from "@/lib/quality-cases/external-tasks";
import { hashQualityCaseTaskToken } from "@/lib/quality-cases/task-tokens";
import { cleanupOrphanedR2Object, getR2Client } from "@/lib/r2";

const ALLOWED_TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]);
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const task = await getExternalQualityCaseTask(token);
  if (!task || task.taskType !== "supplier_response") return NextResponse.json({ error: "Task not found." }, { status: 404 });
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "A file is required." }, { status: 400 });
  if (!ALLOWED_TYPES.has(file.type) || file.size > MAX_FILE_SIZE) return NextResponse.json({ error: "Use a PDF, image, Word, or Excel file no larger than 10MB." }, { status: 400 });
  const [link] = await db.select().from(qualityCaseTaskLinks).where(eq(qualityCaseTaskLinks.tokenHash, hashQualityCaseTaskToken(token))).limit(1);
  if (!link) return NextResponse.json({ error: "Task not found." }, { status: 404 });
  const client = getR2Client();
  if (!client) return NextResponse.json({ error: "Evidence storage is temporarily unavailable." }, { status: 503 });
  const filename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 180) || "evidence";
  const key = `quality-cases/${link.caseId}/supplier/${crypto.randomUUID()}-${filename}`;
  let objectUploaded = false;
  try {
    await client.send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET_NAME || "8d-reports", Key: key, Body: Buffer.from(await file.arrayBuffer()), ContentType: file.type }));
    objectUploaded = true;
    const [evidence] = await db.insert(qualityCaseEvidence).values({ caseId: link.caseId, uploadedByParticipantId: link.participantId, visibility: "internal", storagePath: key, filename: file.name, mimeType: file.type, fileSize: file.size }).returning();
    return NextResponse.json({ id: evidence.id, filename: evidence.filename, fileSize: evidence.fileSize }, { status: 201 });
  } catch (error) {
    if (objectUploaded)
      await cleanupOrphanedR2Object(key, "supplier_evidence_database_failure");
    console.error("External evidence upload failed", error);
    return NextResponse.json({ error: "Evidence upload is temporarily unavailable. Please try again later." }, { status: 503 });
  }
}
