import { NextResponse } from "next/server";
import { VerificationError } from "@/lib/quality-cases/effectiveness-verification";
import { getSupplierVerificationTask, saveSupplierVerificationPlan, saveSupplierVerificationResult, startSupplierVerification, submitSupplierVerification } from "@/lib/quality-cases/verification-tasks";

export const dynamic = "force-dynamic";
const fail = (error: unknown) => error instanceof VerificationError ? NextResponse.json({ error: error.message }, { status: error.status }) : NextResponse.json({ error: "Verification task is temporarily unavailable." }, { status: 503 });
export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) { try { return NextResponse.json(await getSupplierVerificationTask((await params).token)); } catch (error) { return fail(error); } }
export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const token = (await params).token; const body = await request.json().catch(() => ({}));
  try {
    if (body.action === "save_plan") return NextResponse.json(await saveSupplierVerificationPlan(token, body.plan));
    if (body.action === "start") return NextResponse.json(await startSupplierVerification(token));
    if (body.action === "save_result") return NextResponse.json(await saveSupplierVerificationResult(token, body.execution));
    if (body.action === "submit") return NextResponse.json(await submitSupplierVerification(token));
    return NextResponse.json({ error: "Invalid verification task action." }, { status: 400 });
  } catch (error) { return fail(error); }
}
