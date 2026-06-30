import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { db } from "@/lib/db";
import { customTemplateRequests } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/api-helpers";
import { getR2Client } from "@/lib/r2";
import { sendEmail } from "@/lib/email";
import { desc, eq } from "drizzle-orm";
import {
  isServiceAdmin,
  isServiceRequestStatus,
  isServiceRequestType,
  isSupportedServiceRequestFile,
  isValidServiceContactEmail,
  MAX_SERVICE_REQUEST_FILES,
  MAX_SERVICE_REQUEST_FILE_SIZE,
  normalizeServiceQuoteAmount,
  SERVICE_REQUEST_STATUSES,
  serviceRequestTypeLabel,
} from "@/lib/service-requests";

function textValue(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === "string" ? value.trim().slice(0, 2000) : "";
}

function textValues(form: FormData, key: string) {
  return form
    .getAll(key)
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function extractEmailAddress(value: string) {
  const match = value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match?.[0] || "";
}

function adminEmails() {
  const raw = process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || process.env.EMAIL_REPLY_TO || process.env.EMAIL_FROM || "";
  return raw
    .split(",")
    .map((item) => extractEmailAddress(item.trim()))
    .filter(Boolean);
}

function formatFileSize(size?: number | null) {
  if (!size) return "-";
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function leadRequirements(input: {
  contactName: string;
  role: string;
  currentProcess: string;
  timeline: string;
  message: string;
  sourcePath: string;
  referrer: string;
}) {
  return [
    `Name: ${input.contactName || "Not provided"}`,
    `Role: ${input.role || "Not provided"}`,
    `Current process: ${input.currentProcess || "Not provided"}`,
    `Timeline: ${input.timeline || "Not provided"}`,
    `Source path: ${input.sourcePath || "Not provided"}`,
    `Referrer: ${input.referrer || "Not provided"}`,
    "",
    "Message:",
    input.message || "Not provided",
  ].join("\n").slice(0, 5000);
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

type UploadedFileRecord = {
  filename: string;
  mimeType: string;
  fileSize: number;
  storagePath?: string;
  status: "uploaded" | "failed";
  failureReason?: string;
  uploadedAt?: string;
};

async function uploadServiceFiles(files: File[]) {
  const uploadedFiles: UploadedFileRecord[] = [];
  let warning = "";

  if (files.length === 0) {
    return { uploadedFiles, warning };
  }

  const client = getR2Client();
  if (!client) {
    return {
      uploadedFiles: files.map((file) => ({
        filename: file.name,
        mimeType: file.type,
        fileSize: file.size,
        status: "failed" as const,
        failureReason: "storage_unavailable",
      })),
      warning: "We received your request, but the file upload could not be completed. Please reply to the confirmation email with the template file.",
    };
  }

  for (const file of files) {
    if (file.size > MAX_SERVICE_REQUEST_FILE_SIZE) {
      uploadedFiles.push({
        filename: file.name,
        mimeType: file.type,
        fileSize: file.size,
        status: "failed",
        failureReason: "file_too_large",
      });
      warning = "We received your request, but one or more files could not be uploaded. Please reply to the confirmation email with the template file.";
      continue;
    }
    if (!isSupportedServiceRequestFile(file)) {
      uploadedFiles.push({
        filename: file.name,
        mimeType: file.type,
        fileSize: file.size,
        status: "failed",
        failureReason: "unsupported_file_type",
      });
      warning = "We received your request, but one or more files could not be uploaded. Please reply to the confirmation email with the template file.";
      continue;
    }

    const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `custom-template-requests/${crypto.randomUUID()}-${cleanName}`;
    try {
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
        status: "uploaded",
        uploadedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.warn("Template setup file upload failed", {
        filename: file.name,
        mimeType: file.type,
        fileSize: file.size,
        error: error instanceof Error ? error.name : "unknown",
      });
      uploadedFiles.push({
        filename: file.name,
        mimeType: file.type,
        fileSize: file.size,
        status: "failed",
        failureReason: "upload_failed",
      });
      warning = "We received your request, but one or more files could not be uploaded. Please reply to the confirmation email with the template file.";
    }
  }

  return { uploadedFiles, warning };
}

async function sendLeadEmails(input: {
  id: string;
  requestType: string;
  companyName: string;
  contactEmail: string;
  templateUseCase: string;
  customerRequirements: string;
  expectedExportFormat: string;
  uploadedFiles: UploadedFileRecord[];
  fileUploadWarning: string;
}) {
  const serviceLabel = serviceRequestTypeLabel(input.requestType);
  const fileLines = input.uploadedFiles.length > 0
    ? input.uploadedFiles.map((file) =>
        `${file.filename} (${formatFileSize(file.fileSize)}, ${file.mimeType || "unknown type"}, ${file.status})`
      )
    : ["No file metadata recorded."];

  const adminText = [
    `New ${serviceLabel} request`,
    `Lead ID: ${input.id}`,
    `Company: ${input.companyName}`,
    `Work email: ${input.contactEmail}`,
    `Use case: ${input.templateUseCase}`,
    `Required export: ${input.expectedExportFormat || "Not provided"}`,
    "",
    input.customerRequirements,
    "",
    "Files:",
    ...fileLines,
    input.fileUploadWarning ? `Upload warning: ${input.fileUploadWarning}` : "",
  ].filter(Boolean).join("\n");

  const adminHtml = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
      <h1 style="font-size:20px;margin:0 0 12px">New ${escapeHtml(serviceLabel)} request</h1>
      <p><strong>Lead ID:</strong> ${escapeHtml(input.id)}</p>
      <p><strong>Company:</strong> ${escapeHtml(input.companyName)}</p>
      <p><strong>Work email:</strong> ${escapeHtml(input.contactEmail)}</p>
      <p><strong>Use case:</strong> ${escapeHtml(input.templateUseCase)}</p>
      <p><strong>Required export:</strong> ${escapeHtml(input.expectedExportFormat || "Not provided")}</p>
      <pre style="white-space:pre-wrap;background:#f8fafc;padding:12px;border-radius:8px">${escapeHtml(input.customerRequirements)}</pre>
      <h2 style="font-size:16px">Files</h2>
      <ul>${fileLines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>
      ${input.fileUploadWarning ? `<p style="color:#92400e">${escapeHtml(input.fileUploadWarning)}</p>` : ""}
    </div>
  `;

  for (const email of adminEmails()) {
    try {
      await sendEmail({
        to: email,
        subject: `New ${serviceLabel} request from ${input.companyName}`,
        html: adminHtml,
        text: adminText,
        purpose: "service-request-admin",
      });
    } catch (error) {
      console.warn("Service request admin email failed", {
        leadId: input.id,
        emailDomain: email.split("@")[1] || "unknown",
        error: error instanceof Error ? error.message : "unknown",
      });
    }
  }

  const userText = [
    "We received your template setup request.",
    "",
    "We will review your current format and follow up with setup options.",
    input.fileUploadWarning ? "" : null,
    input.fileUploadWarning || null,
    "",
    "8D Reports",
  ].filter(Boolean).join("\n");
  const userHtml = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
      <h1 style="font-size:20px;margin:0 0 12px">We received your request</h1>
      <p>We received your template setup request. We will review your current format and follow up with setup options.</p>
      ${input.fileUploadWarning ? `<p style="color:#92400e">${escapeHtml(input.fileUploadWarning)}</p>` : ""}
      <p style="margin-top:24px;color:#6b7280">8D Reports</p>
    </div>
  `;

  try {
    await sendEmail({
      to: input.contactEmail,
      subject: "We received your 8D template setup request",
      html: userHtml,
      text: userText,
      purpose: "service-request-autoreply",
    });
  } catch (error) {
    console.warn("Service request auto-reply email failed", {
      leadId: input.id,
      emailDomain: input.contactEmail.split("@")[1] || "unknown",
      error: error instanceof Error ? error.message : "unknown",
    });
  }
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 });

  const requestTypeInput = textValue(form, "requestType");
  const requestType = isServiceRequestType(requestTypeInput) ? requestTypeInput : "template_setup";
  const contactName = textValue(form, "contactName") || textValue(form, "name");
  const companyName = textValue(form, "companyName");
  const contactEmail = textValue(form, "contactEmail");
  const role = textValue(form, "role");
  const currentProcess = textValue(form, "currentProcess");
  const templateUseCase = textValue(form, "templateUseCase") || textValue(form, "useCase");
  const timeline = textValue(form, "timeline");
  const message = textValue(form, "message") || textValue(form, "customerRequirements");
  const sourcePath = textValue(form, "sourcePath") || req.nextUrl.pathname;
  const referrer = textValue(form, "referrer") || req.headers.get("referer")?.slice(0, 500) || "";
  const expectedExportFormat = textValues(form, "requiredExport").join(", ") || textValue(form, "expectedExportFormat");
  const languageRequirement = role ? `Role: ${role}` : textValue(form, "languageRequirement");
  const customerRequirements = leadRequirements({
    contactName,
    role,
    currentProcess,
    timeline,
    message,
    sourcePath,
    referrer,
  });

  if (!companyName || !contactEmail || !templateUseCase) {
    return NextResponse.json({ error: "Company, email, and use case are required" }, { status: 400 });
  }
  if (!isValidServiceContactEmail(contactEmail)) {
    return NextResponse.json({ error: "Enter a valid contact email" }, { status: 400 });
  }

  const files = form.getAll("files").filter((item): item is File => item instanceof File && item.size > 0);
  if (files.length > MAX_SERVICE_REQUEST_FILES) {
    return NextResponse.json({ error: `Upload up to ${MAX_SERVICE_REQUEST_FILES} files` }, { status: 400 });
  }

  const { uploadedFiles, warning: fileUploadWarning } = await uploadServiceFiles(files);

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
    uploadedFileCount: uploadedFiles.filter((file) => file.status === "uploaded").length,
    failedFileCount: uploadedFiles.filter((file) => file.status === "failed").length,
    sourcePath,
  });

  await sendLeadEmails({
    id: requestRow.id,
    requestType,
    companyName,
    contactEmail,
    templateUseCase,
    customerRequirements,
    expectedExportFormat,
    uploadedFiles,
    fileUploadWarning,
  });

  return NextResponse.json({
    request: {
      id: requestRow.id,
      status: requestRow.status,
      requestType: requestRow.requestType,
    },
    fileUploadWarning: fileUploadWarning || null,
    uploadedFileCount: uploadedFiles.filter((file) => file.status === "uploaded").length,
    failedFileCount: uploadedFiles.filter((file) => file.status === "failed").length,
  }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !isServiceAdmin(user.email)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const status = req.nextUrl.searchParams.get("status") || "";
  const where = isServiceRequestStatus(status) ? eq(customTemplateRequests.status, status) : undefined;
  const rows = await db
    .select()
    .from(customTemplateRequests)
    .where(where)
    .orderBy(desc(customTemplateRequests.createdAt))
    .limit(100);

  return NextResponse.json({
    statuses: SERVICE_REQUEST_STATUSES,
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
  const quotedAmount = normalizeServiceQuoteAmount(body.quotedAmount);

  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  if (status && !isServiceRequestStatus(status)) {
    return NextResponse.json({ error: "Invalid service request status" }, { status: 400 });
  }
  if (quotedAmount === null) {
    return NextResponse.json({ error: "Quote must be a valid amount with up to 2 decimals" }, { status: 400 });
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
