import { randomInt, randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, verifications } from "@/lib/db/schema";
import { getEmailDebugConfig, isEmailDebugAvailable } from "@/lib/email-debug";
import { sendAuthOtpEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";

function getClientIp(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

function getEmailDomain(email: string) {
  return email.split("@")[1]?.toLowerCase() || "unknown";
}

function createOtp() {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

function createPasswordResetIdentifier(email: string) {
  return `forget-password-otp-${email}`;
}

function createPreviewDebug(email: string, providerMessageId: string | null) {
  if (!isEmailDebugAvailable()) return undefined;
  const config = getEmailDebugConfig(email);
  return {
    route: "password-reset-wrapper",
    routeVersion: config.routeVersion,
    providerMessageId,
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
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const emailDomain = getEmailDomain(email);
  const diagnostics = {
    emailDomain,
    hasResendApiKey: Boolean(process.env.RESEND_API_KEY),
    hasEmailFrom: Boolean(process.env.EMAIL_FROM),
    vercelEnv: process.env.VERCEL_ENV || "local",
  };

  console.log("[AUTH EMAIL] password reset wrapper request received", {
    method: req.method,
    endpoint: "/api/auth-email/password-reset",
    ...diagnostics,
  });

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.log("[AUTH EMAIL] password reset wrapper invalid email", diagnostics);
    return NextResponse.json({ error: "Could not send reset code" }, { status: 400 });
  }

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    console.log("[AUTH EMAIL] password reset wrapper user unavailable", diagnostics);
    return NextResponse.json({ error: "Could not send reset code" }, { status: 400 });
  }

  const identifier = createPasswordResetIdentifier(email);
  const otp = createOtp();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await db.delete(verifications).where(eq(verifications.identifier, identifier));
  await db.insert(verifications).values({
    id: randomUUID(),
    identifier,
    value: `${otp}:0`,
    expiresAt,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log("[AUTH EMAIL] password reset wrapper action called", {
    action: "sendAuthOtpEmail",
    type: "forget-password",
    ...diagnostics,
  });

  try {
    console.log("[AUTH EMAIL] password reset provider callback reached", {
      type: "forget-password",
      ...diagnostics,
    });
    const result = await sendAuthOtpEmail({
      email,
      otp,
      type: "forget-password",
      expiresInSeconds: 300,
    });
    console.log("[AUTH EMAIL] password reset wrapper success", {
      providerMessageId: result.providerMessageId,
      ...diagnostics,
    });
    const debug = createPreviewDebug(email, result.providerMessageId);
    return NextResponse.json({
      success: true,
      ...(debug ? { debug } : {}),
    });
  } catch (error) {
    await db.delete(verifications).where(eq(verifications.identifier, identifier));
    console.error("[AUTH EMAIL] password reset wrapper failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
      ...diagnostics,
    });
    return NextResponse.json({ error: "Could not send reset code" }, { status: 500 });
  }
}
