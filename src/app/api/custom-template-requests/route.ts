import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { db } from "@/lib/db";
import { customTemplateRequests } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/api-helpers";
import { getPublicUrl, getR2Client } from "@/lib/r2";
import { desc, eq } from "drizzle-orm";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "application/zip",
  "image/png",
  "image/jpeg",
  "image/webp",
];
const MAX_FILE_SIZE = 15 * 1024 * 1024;
const REQUEST_TYPES = new Set(["template_setup", "team_launch"]);
const REQUEST_STATUSES = new Set([
  "submitted",
  "under_review",
  "quote_sent",
  "in_progress",
  "ready_for_review",
  "delivered",
  "cancelled",
]);

function isServiceAdmin(email?: string | null) {
  const admins = (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return Boolean(email && admins.includes(email.toLowerCase()));
}

function textValue(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function notifyTemplateRequest(payload: Record<string, unknown>) {
  const webhook = process.env.ADMIN_TEMPLATE_REQUEST_WEBHOOK_URL;
  if (!webhook) return;
  await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 });

  const requestTypeInput = textValue(form, "requestType");
  const requestType = REQUEST_TYPES.has(requestTypeInput) ? requestTypeInput : "template_setup";
  const companyName = textValue(form, "companyName");
  const contactEmail = textValue(form, "contactEmail");
  const templateUseCase = textValue(form, "templateUseCase");
  const customerRequirements = textValue(form, "customerRequirements");
  const languageRequirement = textValue(form, "languageRequirement");
  const expectedExportFormat = textValue(form, "expectedExportFormat");

  if (!companyName || !contactEmail || !templateUseCase) {
    return NextResponse.json({ error: "Company, email, and use case are required" }, { status: 400 });
  }

  const files = form.getAll("files").filter((item): item is File => item instanceof File && item.size > 0);
  if (files.length === 0) {
    return NextResponse.json({ error: "Upload at least one template file" }, { status: 400 });
  }
  if (files.length > 5) {
    return NextResponse.json({ error: "Upload up to 5 files" }, { status: 400 });
  }

  const client = getR2Client();
  if (!client) return NextResponse.json({ error: "Storage service not configured" }, { status: 503 });

  const uploadedFiles = [];
  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: `${file.name} exceeds 15MB` }, { status: 413 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: `${file.name} type is not supported` }, { status: 400 });
    }
    const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `custom-template-requests/${crypto.randomUUID()}-${cleanName}`;
    await client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME || "8d-reports",
        Key: storagePath,
        Body: Buffer.from(await file.arrayBuffer()),
        ContentType: file.type,
      }),
    );
    uploadedFiles.push({
      filename: file.name,
      mimeType: file.type,
      fileSize: file.size,
      storagePath,
      url: getPublicUrl(storagePath),
    });
  }

  const [requestRow] = await db
    .insert(customTemplateRequests)
    .values({
      userId: user?.id || null,
      requestType,
      companyName,
      contactEmail,
      templateUseCase,
      customerRequirements,
      languageRequirement,
      expectedExportFormat,
      uploadedFiles,
      status: "submitted",
    })
    .returning();

  await notifyTemplateRequest({
    id: requestRow.id,
    requestType,
    companyName,
    contactEmail,
    templateUseCase,
    languageRequirement,
    expectedExportFormat,
    fileCount: uploadedFiles.length,
  });

  return NextResponse.json({ request: requestRow }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !isServiceAdmin(user.email)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const status = req.nextUrl.searchParams.get("status") || "";
  const where = REQUEST_STATUSES.has(status) ? eq(customTemplateRequests.status, status) : undefined;
  const rows = await db
    .select()
    .from(customTemplateRequests)
    .where(where)
    .orderBy(desc(customTemplateRequests.createdAt))
    .limit(100);

  return NextResponse.json({
    statuses: Array.from(REQUEST_STATUSES),
    requests: rows,
  });
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !isServiceAdmin(user.email)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const id = typeof body.id === "string" ? body.id : "";
  const status = typeof body.status === "string" ? body.status : "";
  const adminNotes = typeof body.adminNotes === "string" ? body.adminNotes.trim() : undefined;
  const quotedAmount = typeof body.quotedAmount === "number"
    ? String(body.quotedAmount)
    : typeof body.quotedAmount === "string" && body.quotedAmount.trim()
      ? body.quotedAmount.trim()
      : undefined;

  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  if (status && !REQUEST_STATUSES.has(status)) {
    return NextResponse.json({ error: "Invalid service request status" }, { status: 400 });
  }

  const updates: Partial<typeof customTemplateRequests.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (status) updates.status = status;
  if (adminNotes !== undefined) updates.adminNotes = adminNotes;
  if (quotedAmount !== undefined) updates.quotedAmount = quotedAmount;

  const [updated] = await db
    .update(customTemplateRequests)
    .set(updates)
    .where(eq(customTemplateRequests.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: "Request not found" }, { status: 404 });
  return NextResponse.json({ request: updated });
}
