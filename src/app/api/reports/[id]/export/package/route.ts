import { NextResponse } from "next/server";
import JSZip from "jszip";
import { eq } from "drizzle-orm";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { attachments } from "@/lib/db/schema";
import { getR2ObjectBuffer } from "@/lib/r2";
import { getReportAccess, logReportActivity } from "@/lib/report-workflow";

const MAX_REPORT_FILE_SIZE = 25 * 1024 * 1024;
const SAFE_REPORT_EXTENSIONS = new Set(["pdf", "docx", "xlsx"]);

function safeZipName(filename: string) {
  const cleaned = filename
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[\\/]/g, "_")
    .replace(/^\.+$/, "file")
    .trim();
  return cleaned || "file";
}

function uniqueZipName(filename: string, usedNames: Set<string>) {
  const safe = safeZipName(filename);
  if (!usedNames.has(safe)) {
    usedNames.add(safe);
    return safe;
  }

  const dot = safe.lastIndexOf(".");
  const base = dot > 0 ? safe.slice(0, dot) : safe;
  const ext = dot > 0 ? safe.slice(dot) : "";
  let counter = 2;
  let candidate = `${base}-${counter}${ext}`;
  while (usedNames.has(candidate)) {
    counter += 1;
    candidate = `${base}-${counter}${ext}`;
  }
  usedNames.add(candidate);
  return candidate;
}

function isNormalAttachment(attachment: { fileType: string; stepId?: string | null }) {
  if (attachment.fileType === "signature") return false;
  if (attachment.stepId?.startsWith("signature_")) return false;
  return true;
}

function reportExtension(filename: string) {
  return filename.split(".").pop()?.toLowerCase() || "";
}

function previewLog(message: string, details: Record<string, unknown>) {
  if (process.env.VERCEL_ENV === "preview" || process.env.NODE_ENV !== "production") {
    console.info(message, details);
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const { id: reportId } = await params;
  const access = await getReportAccess(reportId, user.id);
  if (!access?.report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }
  if (!access.canExportDraft) {
    return NextResponse.json({ error: "You do not have permission to export reports" }, { status: 403 });
  }

  const formData = await req.formData().catch(() => null);
  const reportFile = formData?.get("reportFile");
  const reportFilenameInput = String(formData?.get("reportFilename") || "");

  if (!(reportFile instanceof File)) {
    return NextResponse.json({ error: "Missing report export file" }, { status: 400 });
  }
  if (reportFile.size > MAX_REPORT_FILE_SIZE) {
    return NextResponse.json({ error: "Report export file is too large to package" }, { status: 413 });
  }

  const reportFilename = safeZipName(reportFilenameInput || reportFile.name || `${reportId}_8D_Report.pdf`);
  const extension = reportExtension(reportFilename);
  if (!SAFE_REPORT_EXTENSIONS.has(extension)) {
    return NextResponse.json({ error: "Unsupported report export file type" }, { status: 400 });
  }

  const attachmentRows = await db
    .select({
      id: attachments.id,
      filename: attachments.filename,
      fileType: attachments.fileType,
      stepId: attachments.stepId,
      storagePath: attachments.storagePath,
    })
    .from(attachments)
    .where(eq(attachments.reportId, reportId))
    .orderBy(attachments.sortOrder);

  const normalAttachments = attachmentRows.filter(isNormalAttachment);
  const zip = new JSZip();
  zip.file(reportFilename, Buffer.from(await reportFile.arrayBuffer()));

  const usedAttachmentNames = new Set<string>();
  const attachmentFolder = zip.folder("attachments");
  if (normalAttachments.length > 0 && !attachmentFolder) {
    return NextResponse.json({ error: "Could not create attachment package" }, { status: 500 });
  }

  for (const attachment of normalAttachments) {
    const object = await getR2ObjectBuffer(attachment.storagePath);
    if (!object?.buffer) {
      previewLog("Export package attachment fetch failed", {
        route: "report-export-package",
        reportId,
        attachmentId: attachment.id,
        filename: attachment.filename,
        vercelEnv: process.env.VERCEL_ENV || "local",
      });
      return NextResponse.json(
        { error: `Could not include attachment "${attachment.filename}". Please try again or remove and re-upload the attachment.` },
        { status: 502 },
      );
    }

    attachmentFolder?.file(uniqueZipName(attachment.filename, usedAttachmentNames), object.buffer);
  }

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  await logReportActivity({
    reportId,
    actorId: user.id,
    actorName: user.name,
    actionType: "report_exported",
    metadata: { format: "zip", packagedFormat: extension, attachmentCount: normalAttachments.length },
  });

  return new NextResponse(new Uint8Array(zipBuffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${reportId}_8D_Export.zip"`,
      "Cache-Control": "private, no-store",
    },
  });
}
