import { Resend } from "resend";

type AuthOtpType = "sign-in" | "email-verification" | "forget-password" | "change-email";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  purpose?: string;
  allowLocalFallback?: boolean;
};

type SendEmailResult = {
  ok: true;
  providerMessageId: string | null;
  mode?: "local-log";
};

let resendClient: Resend | null = null;

function isLocalDevelopment() {
  return process.env.NODE_ENV !== "production" && !process.env.VERCEL_ENV;
}

function getEmailConfig() {
  return {
    apiKey: process.env.RESEND_API_KEY,
    from: process.env.EMAIL_FROM,
    replyTo: process.env.EMAIL_REPLY_TO,
  };
}

function getEmailDomain(email: string) {
  return email.split("@")[1]?.toLowerCase() || "unknown";
}

function getEmailDiagnostics(to: string) {
  const { apiKey, from } = getEmailConfig();
  return {
    emailDomain: getEmailDomain(to),
    hasResendApiKey: Boolean(apiKey),
    hasEmailFrom: Boolean(from),
    vercelEnv: process.env.VERCEL_ENV || "local",
  };
}

function getResendClient(apiKey: string) {
  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getOtpCopy(type: AuthOtpType) {
  if (type === "email-verification") {
    return {
      subject: "Verify your 8D Reports email",
      heading: "Verify your email",
      explanation: "Use this code to finish creating your 8D Reports account.",
    };
  }
  if (type === "forget-password") {
    return {
      subject: "Reset your 8D Reports password",
      heading: "Reset your password",
      explanation: "Use this code to reset your 8D Reports password.",
    };
  }
  if (type === "sign-in") {
    return {
      subject: "Your 8D Reports sign-in code",
      heading: "Sign in to 8D Reports",
      explanation: "Use this code to sign in to your 8D Reports account.",
    };
  }
  return {
    subject: "Confirm your 8D Reports email change",
    heading: "Confirm your email change",
    explanation: "Use this code to confirm your new email address.",
  };
}

function createOtpEmail({
  otp,
  type,
  expiresInSeconds,
}: {
  otp: string;
  type: AuthOtpType;
  expiresInSeconds: number;
}) {
  const copy = getOtpCopy(type);
  const minutes = Math.max(1, Math.round(expiresInSeconds / 60));
  const safeOtp = escapeHtml(otp);
  const text = [
    copy.heading,
    "",
    copy.explanation,
    "",
    `Code: ${otp}`,
    `This code expires in ${minutes} minutes.`,
    "",
    "If you did not request this, you can safely ignore this email.",
    "",
    "8D Reports",
  ].join("\n");

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
      <h1 style="font-size:20px;margin:0 0 12px">${escapeHtml(copy.heading)}</h1>
      <p style="margin:0 0 16px">${escapeHtml(copy.explanation)}</p>
      <p style="font-size:28px;letter-spacing:6px;font-weight:700;margin:0 0 16px">${safeOtp}</p>
      <p style="margin:0 0 16px">This code expires in ${minutes} minutes.</p>
      <p style="margin:0;color:#6b7280">If you did not request this, you can safely ignore this email.</p>
      <p style="margin:24px 0 0;color:#6b7280">8D Reports</p>
    </div>
  `;

  return { subject: copy.subject, html, text };
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  purpose = "transactional",
  allowLocalFallback = true,
}: SendEmailInput): Promise<SendEmailResult> {
  const { apiKey, from, replyTo } = getEmailConfig();
  const diagnostics = getEmailDiagnostics(to);

  console.log("[EMAIL] send start", { purpose, ...diagnostics });

  if (!apiKey || !from) {
    if (isLocalDevelopment()) {
      if (allowLocalFallback) {
        console.log("[EMAIL] local fallback", { purpose, ...diagnostics });
        return { ok: true, providerMessageId: null, mode: "local-log" };
      }
      console.error("[EMAIL] missing config", { purpose, ...diagnostics });
      throw new Error("Email delivery is not configured.");
    }
    console.error("[EMAIL] missing config", { purpose, ...diagnostics });
    throw new Error("Email delivery is not configured. Set RESEND_API_KEY and EMAIL_FROM.");
  }

  const { data, error } = await getResendClient(apiKey).emails.send({
    from,
    to,
    subject,
    html,
    text,
    replyTo: replyTo || undefined,
  });

  if (error) {
    console.error("[EMAIL] send failed", { purpose, providerError: error.name, ...diagnostics });
    throw new Error("Email provider rejected the message.");
  }

  const providerMessageId = data?.id || null;
  console.log("[EMAIL] send success", { purpose, providerMessageId, ...diagnostics });
  return { ok: true, providerMessageId };
}

export async function sendAuthOtpEmail({
  email,
  otp,
  type,
  expiresInSeconds = 300,
}: {
  email: string;
  otp: string;
  type: AuthOtpType;
  expiresInSeconds?: number;
}) {
  const { apiKey, from } = getEmailConfig();
  const emailContent = createOtpEmail({ otp, type, expiresInSeconds });
  const diagnostics = getEmailDiagnostics(email);

  console.log("[AUTH EMAIL] OTP email start", { type, ...diagnostics });

  if ((!apiKey || !from) && isLocalDevelopment()) {
    const label = getOtpCopy(type).heading;
    console.log(`\n===== LOCAL ${label} OTP for ${email}: ${otp} =====\n`);
    console.log("[AUTH EMAIL] OTP local fallback", { type, ...diagnostics });
    return { ok: true, providerMessageId: null, mode: "local-log" as const };
  }

  const result = await sendEmail({
    to: email,
    subject: emailContent.subject,
    html: emailContent.html,
    text: emailContent.text,
    purpose: `auth-otp:${type}`,
  });
  console.log("[AUTH EMAIL] OTP email success", {
    type,
    providerMessageId: result.providerMessageId,
    ...diagnostics,
  });
  return result;
}

export async function sendWelcomeEmail(to: string, name: string) {
  const safeName = escapeHtml(name);
  return sendEmail({
    to,
    subject: "Welcome to 8D Reports",
    text: `Welcome to 8D Reports, ${name}.\n\nYou can now create, review, and export structured 8D reports.\n\n8D Reports`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
        <h1 style="font-size:20px;margin:0 0 12px">Welcome to 8D Reports</h1>
        <p style="margin:0 0 16px">Welcome, ${safeName}.</p>
        <p style="margin:0">You can now create, review, and export structured 8D reports.</p>
      </div>
    `,
    purpose: "welcome",
  });
}
