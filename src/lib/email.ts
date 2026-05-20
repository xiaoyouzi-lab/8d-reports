import { Resend } from "resend";

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === "re_placeholder") return null;
  return new Resend(apiKey);
}

const FROM = "8D Reports <noreply@8dreports.com>";

export async function sendWelcomeEmail(to: string, name: string) {
  const resend = getResend();
  if (!resend) return;
  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: "Welcome to 8D Reports — Your 5 free reports are ready",
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#4F46E5">Welcome to 8D Reports, ${name}!</h2>
          <p>Your account is ready. You have <strong>5 free 8D reports</strong> to get started.</p>
          <p><a href="https://8d-reports.vercel.app/dashboard" style="display:inline-block;padding:12px 24px;background:#4F46E5;color:white;text-decoration:none;border-radius:6px">Create Your First Report</a></p>
          <p style="margin-top:24px;color:#6b7280;font-size:14px">8D Reports — Professional 8D reports. No spreadsheets.</p>
        </div>
      `,
    });
  } catch { /* ignore email failures */ }
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const resend = getResend();
  if (!resend) return;
  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: "Reset your 8D Reports password",
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#4F46E5">Password Reset</h2>
          <p>Click the button below to reset your password:</p>
          <p><a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#4F46E5;color:white;text-decoration:none;border-radius:6px">Reset Password</a></p>
          <p style="margin-top:24px;color:#6b7280;font-size:14px">If you did not request this, please ignore this email.</p>
        </div>
      `,
    });
  } catch { /* ignore email failures */ }
}

export async function sendPurchaseConfirmation(to: string, planName: string) {
  const resend = getResend();
  if (!resend) return;
  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: `Your 8D Reports ${planName} subscription is active`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#4F46E5">Thank you for upgrading!</h2>
          <p>Your <strong>${planName}</strong> subscription is now active. You have unlimited 8D reports and premium features.</p>
          <p><a href="https://8d-reports.vercel.app/dashboard" style="display:inline-block;padding:12px 24px;background:#4F46E5;color:white;text-decoration:none;border-radius:6px">Go to Dashboard</a></p>
        </div>
      `,
    });
  } catch { /* ignore email failures */ }
}
