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

function createVerificationIdentifier(email: string) {
  return `email-verification-otp-${email}`;
}

function createPreviewDebug(email: string, providerMessageId: string | null) {
  if (!isEmailDebugAvailable()) return undefined;
  const config = getEmailDebugConfig(email);
  return {
    route: "signup-verification-wrapper",
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

  const identifier = createVerificationIdentifier(email);
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

  try {
    const result = await sendAuthOtpEmail({
      email,
      otp,
      type: "email-verification",
      expiresInSeconds: 300,
    });
    console.log("[AUTH EMAIL] signup verification wrapper success", {
      emailDomain,
      providerMessageId: result.providerMessageId,
    });
    const debug = createPreviewDebug(email, result.providerMessageId);
    return NextResponse.json({
      success: true,
      ...(debug ? { debug } : {}),
    });
  } catch (error) {
    await db.delete(verifications).where(eq(verifications.identifier, identifier));
    console.error("[AUTH EMAIL] signup verification wrapper failed", {
      emailDomain,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json({ error: "Could not send verification code" }, { status: 500 });
  }
}
