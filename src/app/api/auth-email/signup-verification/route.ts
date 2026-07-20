import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, verifications } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { getEmailDebugConfig, isEmailDebugAvailable } from "@/lib/email-debug";
import { checkRateLimit } from "@/lib/rate-limit";

function getClientIp(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

function getEmailDomain(email: string) {
  return email.split("@")[1]?.toLowerCase() || "unknown";
}

function createVerificationIdentifier(email: string) {
  // This is Better Auth emailOTP's documented storage convention. The route
  // does not generate or insert an OTP itself: auth.handler() delegates to
  // Better Auth's email-otp send endpoint, which remains the sole generator
  // and writer for this record.
  return `email-verification-otp-${email}`;
}

function createPreviewDebug(email: string) {
  if (!isEmailDebugAvailable()) return undefined;
  const config = getEmailDebugConfig(email);
  return {
    route: "better-auth-email-otp-wrapper",
    routeVersion: config.routeVersion,
    emailDomain: config.emailDomain,
    hasResendApiKey: config.hasResendApiKey,
    hasEmailFrom: config.hasEmailFrom,
    vercelEnv: config.vercelEnv,
  };
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { allowed } = checkRateLimit(ip);

  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const emailDomain = getEmailDomain(email);

  console.log("[AUTH EMAIL] signup verification wrapper start", {
    method: req.method,
    emailDomain,
    hasResendApiKey: Boolean(process.env.RESEND_API_KEY),
    hasEmailFrom: Boolean(process.env.EMAIL_FROM),
    vercelEnv: process.env.VERCEL_ENV || "local",
  });

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.log("[AUTH EMAIL] signup verification wrapper invalid email", { emailDomain });
    return NextResponse.json({ error: "Could not send verification code" }, { status: 400 });
  }

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    console.log("[AUTH EMAIL] signup verification wrapper user unavailable", { emailDomain });
    return NextResponse.json({ error: "Could not send verification code" }, { status: 400 });
  }

  try {
    const headers = new Headers(req.headers);
    headers.set("content-type", "application/json");
    headers.delete("content-length");
    const response = await auth.handler(new Request(
      new URL("/api/auth/email-otp/send-verification-otp", req.url),
      {
        method: "POST",
        headers,
        body: JSON.stringify({ email, type: "email-verification" }),
      },
    ));

    if (!response.ok) throw new Error("Better Auth could not send the verification OTP.");

    console.log("[AUTH EMAIL] signup verification wrapper success", {
      emailDomain,
      provider: "better-auth-email-otp",
    });
    const debug = createPreviewDebug(email);
    return NextResponse.json({
      success: true,
      ...(debug ? { debug } : {}),
    });
  } catch (error) {
    // Better Auth creates the verification record before it calls the mail
    // callback. If delivery fails, remove only this exact Better Auth record
    // so a code that was never delivered cannot later be used.
    await db.delete(verifications).where(eq(verifications.identifier, createVerificationIdentifier(email)));
    console.error("[AUTH EMAIL] signup verification wrapper failed", {
      emailDomain,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json({ error: "Could not send verification code" }, { status: 500 });
  }
}
