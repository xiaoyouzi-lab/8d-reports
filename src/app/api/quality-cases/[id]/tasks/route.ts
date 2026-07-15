import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-helpers";
import { createQualityCaseTask } from "@/lib/quality-cases/external-tasks";
import {
  isValidInvitationEmail,
  sendQualityCaseInvitation,
} from "@/lib/quality-cases/task-invitation-email";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  if (body.recipientEmail && !isValidInvitationEmail(body.recipientEmail))
    return NextResponse.json({ error: "A valid recipient email is required." }, { status: 400 });
  const result = await createQualityCaseTask({ caseId: id, actor: user, taskType: body.taskType, participantName: body.participantName, participantOrganization: body.participantOrganization, expiresAt: body.expiresAt });
  if (!result.ok)
    return NextResponse.json({ error: result.error }, { status: result.status });
  if (!body.recipientEmail) {
    return NextResponse.json({ ...result.value, emailDelivery: "not_requested" }, { status: 201 });
  }
  const origin = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const path = result.value.taskType === "customer_review"
    ? `/customer-review/${result.value.token}`
    : `/supplier/${result.value.token}`;
  try {
    const delivery = await sendQualityCaseInvitation({
      taskId: result.value.taskId,
      type: result.value.taskType === "customer_review" ? "customer_review" : "supplier_response",
      to: body.recipientEmail,
      participantName: body.participantName,
      participantOrganization: body.participantOrganization,
      link: `${origin.replace(/\/$/, "")}${path}`,
      expiresAt: result.value.expiresAt,
    });
    return NextResponse.json({
      ...result.value,
      emailDelivery: "sent",
      providerMessageId: delivery.providerMessageId,
    }, { status: 201 });
  } catch (error) {
    console.error("Quality Case invitation email failed", {
      taskId: result.value.taskId,
      taskType: result.value.taskType,
      error: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({
      ...result.value,
      emailDelivery: "failed",
      emailError: "The secure link was created, but email delivery failed. Copy the link and send it through an approved channel.",
    }, { status: 201 });
  }
}
