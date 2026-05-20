import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-helpers";
import { generatePresignedUploadUrl, getPublicUrl } from "@/lib/r2";

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

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const body = await req.json().catch(() => ({}));
  const { reportId, stepId, filename, contentType, fileSize } = body;

  if (!reportId || !filename || !contentType) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (typeof fileSize === "number" && fileSize > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File exceeds 5MB limit" }, { status: 413 });
  }

  const isImage = ALLOWED_IMAGE_TYPES.includes(contentType);
  const isFile = ALLOWED_FILE_TYPES.includes(contentType);

  if (!isImage && !isFile) {
    return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
  }

  const fileType = isImage ? "photo" : "document";
  const uniqueName = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const storagePath = `reports/${reportId}/${stepId || "general"}/${uniqueName}`;

  const presignedUrl = await generatePresignedUploadUrl(storagePath, contentType);
  if (!presignedUrl) {
    return NextResponse.json({ error: "Storage service unavailable" }, { status: 503 });
  }

  const publicUrl = getPublicUrl(storagePath);

  return NextResponse.json({
    presignedUrl,
    storagePath,
    publicUrl,
    filename,
    contentType,
    fileType,
  });
}
