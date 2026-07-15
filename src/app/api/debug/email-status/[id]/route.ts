import { NextResponse } from "next/server";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-helpers";
import { getEmailDeliveryEvent } from "@/lib/email";
import { isEmailDebugAvailable } from "@/lib/email-debug";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isEmailDebugAvailable())
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();
  const { id } = await params;
  if (!/^[a-zA-Z0-9_-]{8,128}$/.test(id))
    return NextResponse.json({ error: "Invalid message id." }, { status: 400 });
  try {
    return NextResponse.json({ providerMessageId: id, lastEvent: await getEmailDeliveryEvent(id) });
  } catch {
    return NextResponse.json({ error: "Email delivery status is unavailable." }, { status: 404 });
  }
}
