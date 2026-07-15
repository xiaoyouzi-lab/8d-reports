import { NextRequest, NextResponse } from "next/server";
import {
  getExternalQualityCaseTask,
  submitExternalQualityCaseTask,
} from "@/lib/quality-cases/external-tasks";
import {
  submitSupplierResponsePackage,
  SupplierResponsePackageError,
} from "@/lib/quality-cases/supplier-response-package";

export const dynamic = "force-dynamic";
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const task = await getExternalQualityCaseTask(token);
  return task
    ? NextResponse.json(task)
    : NextResponse.json({ error: "Task not found." }, { status: 404 });
}
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const body = await request.json().catch(() => ({}));
  if (body.action === "supplier_submit") {
    if (
      typeof body.sessionId !== "string" ||
      (body.mode !== "guided" && body.mode !== "expert") ||
      typeof body.confirmationText !== "string"
    )
      return NextResponse.json(
        { error: "sessionId, mode, and supplier confirmation are required." },
        { status: 400 },
      );
    try {
      const value = await submitSupplierResponsePackage({
        token,
        sessionId: body.sessionId,
        mode: body.mode,
        confirmationText: body.confirmationText,
      });
      return NextResponse.json(value);
    } catch (error) {
      if (error instanceof SupplierResponsePackageError)
        return NextResponse.json({ error: error.message }, { status: error.status });
      return NextResponse.json(
        { error: "Unable to submit the supplier response package." },
        { status: 500 },
      );
    }
  }
  const result = await submitExternalQualityCaseTask({
    token,
    action: body.action,
    response: body.response,
    comment: body.comment,
    requestedFieldIds: body.requestedFieldIds,
    fieldComments: body.fieldComments,
    evidenceIds: body.evidenceIds,
  });
  return result.ok
    ? NextResponse.json(result.value)
    : NextResponse.json({ error: result.error }, { status: result.status });
}
