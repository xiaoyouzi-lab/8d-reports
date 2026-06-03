import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { eq } from "drizzle-orm";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { attachments, reports } from "@/lib/db/schema";
import { getAccessibleReport } from "@/lib/report-access";
import { getPublicUrl, getR2Client } from "@/lib/r2";
import { DEFAULT_REPORT_DATA, type ReportData } from "@/lib/report-steps";

const SIGNATURE_ROLES = ["prepared", "reviewed", "approved"] as const;
type SignatureRole = (typeof SIGNATURE_ROLES)[number];

const SIGNATURE_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_SIGNATURE_SIZE = 2 * 1024 * 1024;

function isSignatureRole(value: unknown): value is SignatureRole {
  return typeof value === "string" && (SIGNATURE_ROLES as readonly string[]).includes(value);
}

function signatureFields(role: SignatureRole) {
  if (role === "prepared") {
    return { id: "preparedSignatureId", url: "preparedSignatureUrl" } as const;
  }
  if (role === "reviewed") {
    return { id: "reviewedSignatureId", url: "reviewedSignatureUrl" } as const;
  }
  return { id: "approvedSignatureId", url: "approvedSignatureUrl" } as const;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const { id: reportId } = await params;
  const report = await getAccessibleReport(reportId, user.id);
  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file") as File | null;
  const role = form?.get("role");

  if (!file || !isSignatureRole(role)) {
    return NextResponse.json({ error: "Missing signature file or role" }, { status: 400 });
  }
  if (!SIGNATURE_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Signature must be PNG, JPG, or WebP" }, { status: 400 });
  }
  if (file.size > MAX_SIGNATURE_SIZE) {
    return NextResponse.json({ error: "Signature image must be 2MB or less" }, { status: 413 });
  }

  const client = getR2Client();
  if (!client) {
    return NextResponse.json({ error: "Storage service not configured" }, { status: 503 });
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const storagePath = `reports/${reportId}/signatures/${role}-${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME || "8d-reports",
      Key: storagePath,
      Body: buffer,
      ContentType: file.type,
    }),
  );

  const url = getPublicUrl(storagePath) || storagePath;
  const [attachment] = await db
    .insert(attachments)
    .values({
      reportId,
      stepId: `signature_${role}`,
      storagePath,
      url,
      filename: `${role}-signature.${ext}`,
      fileType: "signature",
      mimeType: file.type,
      fileSize: file.size,
      sortOrder: 0,
    })
    .returning();

  const fields = signatureFields(role);
  const existingData = typeof report.data === "object" && report.data ? report.data : {};
  const nextData = {
    ...DEFAULT_REPORT_DATA,
    ...existingData,
    [fields.id]: attachment.id,
    [fields.url]: url,
  } as ReportData;

  await db
    .update(reports)
    .set({ data: nextData, updatedAt: new Date() })
    .where(eq(reports.id, reportId));

  return NextResponse.json({
    role,
    attachmentId: attachment.id,
    url: nextData[fields.url],
  });
}
