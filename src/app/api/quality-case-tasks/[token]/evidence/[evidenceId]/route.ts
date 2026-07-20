import { NextResponse } from "next/server";
import { getR2ObjectBuffer } from "@/lib/r2";
import {
  getAuthorizedCustomerEvidence,
  getExternalQualityCaseTask,
} from "@/lib/quality-cases/external-tasks";
import { getAuthorizedSupplierGuidanceEvidence } from "@/lib/quality-cases/guided-supplier";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  {
    params,
  }: { params: Promise<{ token: string; evidenceId: string }> },
) {
  const { token, evidenceId } = await params;
  const task = await getExternalQualityCaseTask(token);
  const evidence =
    task?.taskType === "supplier_response"
      ? await getAuthorizedSupplierGuidanceEvidence(token, evidenceId)
      : task?.taskType === "customer_review"
        ? await getAuthorizedCustomerEvidence(token, evidenceId)
        : null;
  if (!evidence)
    return NextResponse.json(
      { error: "Authorized evidence not found." },
      { status: 404 },
    );
  const object = await getR2ObjectBuffer(evidence.storagePath);
  if (!object)
    return NextResponse.json(
      { error: "Evidence file is unavailable." },
      { status: 404 },
    );
  const filename = evidence.filename.replace(/["\r\n]/g, "_");
  return new NextResponse(new Uint8Array(object.buffer), {
    headers: {
      "Content-Type":
        evidence.mimeType || object.contentType || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
