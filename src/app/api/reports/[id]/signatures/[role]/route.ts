import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { attachments, reports } from "@/lib/db/schema";
import { getAccessibleReport } from "@/lib/report-access";
import { deleteR2Object } from "@/lib/r2";
import { DEFAULT_REPORT_DATA, type ReportData } from "@/lib/report-steps";

const SIGNATURE_ROLES = ["prepared", "reviewed", "approved"] as const;
type SignatureRole = (typeof SIGNATURE_ROLES)[number];

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

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; role: string }> },
) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();

  const { id: reportId, role } = await params;
  if (!isSignatureRole(role)) {
    return NextResponse.json({ error: "Invalid signature role" }, { status: 400 });
  }

  const report = await getAccessibleReport(reportId, user.id);
  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  const fields = signatureFields(role);
  const existingData = {
    ...DEFAULT_REPORT_DATA,
    ...(typeof report.data === "object" && report.data ? report.data : {}),
  } as ReportData;
  const attachmentId = existingData[fields.id];

  if (attachmentId) {
    const [attachment] = await db
      .select()
      .from(attachments)
      .where(eq(attachments.id, attachmentId))
      .limit(1);
    if (attachment && attachment.reportId === reportId) {
      await deleteR2Object(attachment.storagePath);
      await db.delete(attachments).where(eq(attachments.id, attachment.id));
    }
  }

  const nextData = {
    ...existingData,
    [fields.id]: "",
    [fields.url]: "",
  } as ReportData;

  await db
    .update(reports)
    .set({ data: nextData, updatedAt: new Date() })
    .where(eq(reports.id, reportId));

  return NextResponse.json({ success: true });
}
