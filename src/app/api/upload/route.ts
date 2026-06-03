import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-helpers";
import { S3Client } from "@aws-sdk/client-s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getUserEntitlements } from "@/lib/subscription";
import { getAccessibleReport } from "@/lib/report-access";

function getR2Client(): S3Client | null {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) return null;

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/csv",
  "text/plain",
  "application/zip",
];

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const contentType = req.headers.get("content-type") || "";

  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const reportId = formData.get("reportId") as string | null;
    const stepId = formData.get("stepId") as string | null;

    if (!file || !reportId) {
      return NextResponse.json({ error: "Missing file or reportId" }, { status: 400 });
    }

    const report = await getAccessibleReport(reportId, user.id);

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const entitlements = await getUserEntitlements(user.id);
    const maxFileSize = entitlements.maxAttachmentSizeMb * 1024 * 1024;

    if (file.size > maxFileSize) {
      return NextResponse.json(
        { error: `File exceeds ${entitlements.maxAttachmentSizeMb}MB limit` },
        { status: 413 }
      );
    }

    const fileType = file.type || "application/octet-stream";
    const isImage = ALLOWED_IMAGE_TYPES.includes(fileType);
    const isFile = ALLOWED_FILE_TYPES.includes(fileType);

    if (!isImage && !isFile) {
      return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
    }

    const client = getR2Client();
    if (!client) {
      return NextResponse.json({ error: "Storage service not configured" }, { status: 503 });
    }

    const attachmentType = isImage ? "photo" : "document";
    const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const uniqueName = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${cleanName}`;
    const storagePath = `reports/${reportId}/${stepId || "general"}/${uniqueName}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    await client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME || "8d-reports",
        Key: storagePath,
        Body: buffer,
        ContentType: fileType,
      })
    );

    const accountId = process.env.R2_ACCOUNT_ID;
    const bucket = process.env.R2_BUCKET_NAME || "8d-reports";
    const publicUrl = `https://${bucket}.${accountId}.r2.cloudflarestorage.com/${storagePath}`;

    return NextResponse.json({
      storagePath,
      url: publicUrl, // 保持向后兼容
      publicUrl,
      filename: file.name,
      fileType: attachmentType,
      mimeType: fileType,
      fileSize: file.size,
      stepId: stepId || null,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    );
  }
}
