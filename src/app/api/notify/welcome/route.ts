import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorizedResponse } from "@/lib/api-helpers";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(_req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorizedResponse();
  try {
    await sendWelcomeEmail(user.email, user.name || "Quality Professional");
    return NextResponse.json({ sent: true });
  } catch (_err) {
    return NextResponse.json({ sent: false }, { status: 500 });
  }
}
