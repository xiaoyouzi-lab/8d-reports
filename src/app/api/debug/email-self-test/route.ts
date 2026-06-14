import { NextRequest, NextResponse } from "next/server";
import { getEmailDebugConfig, getEmailDomain, isEmailDebugAvailable } from "@/lib/email-debug";
import { sendEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";

function getClientIp(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

function createDebugResponse(email: string, success: boolean, providerMessageId: string | null = null) {
  const config = getEmailDebugConfig(email);
  return {
    success,
    debug: {
      route: "email-self-test",
      routeVersion: config.routeVersion,
      providerMessageId,
      emailDomain: config.emailDomain,
      hasResendApiKey: config.hasResendApiKey,
      hasEmailFrom: config.hasEmailFrom,
      vercelEnv: config.vercelEnv,
    },
  };
}

async function runSelfTest(req: NextRequest, email: string) {
  if (!isEmailDebugAvailable()) {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }

  const ip = getClientIp(req);
  const { allowed } = checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  const emailDomain = getEmailDomain(email);
  const config = getEmailDebugConfig(email);

  console.log("[EMAIL DEBUG] self-test start", {
    emailDomain,
    hasResendApiKey: config.hasResendApiKey,
    hasEmailFrom: config.hasEmailFrom,
    vercelEnv: config.vercelEnv,
  });

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.log("[EMAIL DEBUG] self-test invalid email", { emailDomain });
    return NextResponse.json({ error: "Enter a valid test email.", ...createDebugResponse(email, false) }, { status: 400 });
  }

  try {
    const result = await sendEmail({
      to: email,
      subject: "8D Reports email self-test",
      text: "This is a safe email self-test from 8D Reports Preview/local diagnostics.",
      html: "<p>This is a safe email self-test from 8D Reports Preview/local diagnostics.</p>",
      purpose: "debug-email-self-test",
      allowLocalFallback: false,
    });
    console.log("[EMAIL DEBUG] self-test success", {
      emailDomain,
      providerMessageId: result.providerMessageId,
      hasResendApiKey: config.hasResendApiKey,
      hasEmailFrom: config.hasEmailFrom,
      vercelEnv: config.vercelEnv,
    });
    return NextResponse.json(createDebugResponse(email, true, result.providerMessageId));
  } catch (error) {
    console.error("[EMAIL DEBUG] self-test failed", {
      emailDomain,
      errorName: error instanceof Error ? error.name : "UnknownError",
      hasResendApiKey: config.hasResendApiKey,
      hasEmailFrom: config.hasEmailFrom,
      vercelEnv: config.vercelEnv,
    });
    return NextResponse.json(
      { error: "Email self-test failed. Check Preview email configuration and Resend sending status.", ...createDebugResponse(email, false) },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("to")?.trim().toLowerCase() || "";
  return runSelfTest(req, email);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  return runSelfTest(req, email);
}
