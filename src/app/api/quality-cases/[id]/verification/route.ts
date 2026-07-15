import { NextResponse } from "next/server";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-helpers";
import {
  closeVerifiedCase,
  getVerificationWorkspace,
  reviewVerification,
  runVerificationCoach,
  saveVerificationExecution,
  saveVerificationPlan,
  startVerificationExecution,
  submitVerification,
  VerificationError,
} from "@/lib/quality-cases/effectiveness-verification";
import { createSupplierVerificationTask } from "@/lib/quality-cases/verification-tasks";

export const dynamic = "force-dynamic";

function failure(error: unknown) {
  if (error instanceof VerificationError) return NextResponse.json({ error: error.message }, { status: error.status });
  console.error("Effectiveness verification failed", error);
  return NextResponse.json({ error: "Effectiveness verification is temporarily unavailable." }, { status: 503 });
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();
  try { return NextResponse.json(await getVerificationWorkspace((await params).id, user.id)); }
  catch (error) { return failure(error); }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();
  const caseId = (await params).id;
  const body = await request.json().catch(() => ({}));
  try {
    if (body.action === "save_plan") return NextResponse.json(await saveVerificationPlan({ caseId, userId: user.id, plan: body.plan }));
    if (body.action === "start_execution") return NextResponse.json(await startVerificationExecution(caseId, user.id));
    if (body.action === "save_execution") return NextResponse.json(await saveVerificationExecution({ caseId, userId: user.id, execution: body.execution }));
    if (body.action === "submit") return NextResponse.json(await submitVerification(caseId, user.id));
    if (body.action === "review") return NextResponse.json(await reviewVerification({ caseId, userId: user.id, decision: body.decision, comment: body.comment }));
    if (body.action === "coach") return NextResponse.json(await runVerificationCoach(caseId, user.id));
    if (body.action === "close") return NextResponse.json(await closeVerifiedCase({ caseId, userId: user.id, comment: body.comment }));
    if (body.action === "create_supplier_task") return NextResponse.json(await createSupplierVerificationTask({ caseId, userId: user.id, participantName: body.participantName, organization: body.organization, expiresAt: body.expiresAt }), { status: 201 });
    return NextResponse.json({ error: "Invalid verification action." }, { status: 400 });
  } catch (error) { return failure(error); }
}
