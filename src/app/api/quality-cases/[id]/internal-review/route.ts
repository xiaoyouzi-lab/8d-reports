import { NextResponse } from "next/server";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-helpers";
import {
  buildCustomerDraftForCase,
  confirmMappingDecision,
  getInternalQualityReviewWorkspace,
  InternalQualityReviewError,
  requestSupplierUpdate,
  runInternalQualityReview,
} from "@/lib/quality-cases/internal-quality-review";
import { transitionQualityCase } from "@/lib/quality-cases/service";

export const dynamic = "force-dynamic";

function errorResponse(error: unknown) {
  if (error instanceof InternalQualityReviewError)
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  console.error("Internal Quality Review failed", error);
  return NextResponse.json(
    { error: "Internal Quality Review is temporarily unavailable." },
    { status: 503 },
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();
  const { id } = await params;
  try {
    const workspace = await getInternalQualityReviewWorkspace(id, user.id);
    return workspace
      ? NextResponse.json(workspace)
      : NextResponse.json(
          { error: "Quality Case not found." },
          { status: 404 },
        );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  try {
    if (body.action === "run_review") {
      return NextResponse.json(
        await runInternalQualityReview({ caseId: id, userId: user.id }),
      );
    }
    if (body.action === "confirm_mapping") {
      return NextResponse.json(
        await confirmMappingDecision({
          caseId: id,
          userId: user.id,
          mappingId: body.mappingId,
          semanticKey: body.semanticKey,
          confirmedText: body.confirmedText,
          language: body.language,
          approvedEvidenceIds: body.approvedEvidenceIds,
          comment: body.comment,
        }),
      );
    }
    if (body.action === "build_customer_draft") {
      return NextResponse.json(
        await buildCustomerDraftForCase({
          caseId: id,
          userId: user.id,
          format: body.format,
        }),
      );
    }
    if (
      body.action === "request_supplier_update" ||
      body.action === "reject_supplier_response"
    ) {
      return NextResponse.json(
        await requestSupplierUpdate({
          caseId: id,
          user,
          reason: body.reason,
          questions: body.questions,
          requestedFieldIds: body.requestedFieldIds,
          dueAt: body.dueAt,
          mode:
            body.action === "reject_supplier_response"
              ? "reinvestigate"
              : "supplement",
        }),
      );
    }
    if (
      body.action === "start_internal_review" ||
      body.action === "accept_for_customer_preparation"
    ) {
      const result = await transitionQualityCase({
        caseId: id,
        actor: user,
        action:
          body.action === "start_internal_review"
            ? "start_internal_review"
            : "mark_ready_for_customer",
        comment: body.comment,
      });
      if (!result.ok)
        return NextResponse.json(
          { error: result.error },
          { status: result.status },
        );
      return NextResponse.json(result.value);
    }
    return NextResponse.json(
      { error: "Invalid Internal Review action." },
      { status: 400 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
