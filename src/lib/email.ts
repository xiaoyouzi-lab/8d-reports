export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn("RESEND_API_KEY not configured — skipping email send to", to)
    return { ok: false, error: "RESEND_API_KEY not configured" }
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "8D Reports <noreply@8dreports.com>",
        to,
        subject,
        html,
      }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      console.error("Resend send error:", data)
      return { ok: false, error: (data as any)?.message || "Failed to send" }
    }

    return { ok: true }
  } catch (err) {
    console.error("Send email error:", err)
    return { ok: false, error: "Network error" }
  }
}

export async function sendWelcomeEmail(to: string, name: string) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <div style="background: #4F46E5; border-radius: 12px 12px 0 0; padding: 24px; text-align: center;">
        <span style="color: white; font-size: 24px; font-weight: bold;">8D Reports</span>
      </div>
      <div style="border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; padding: 24px;">
        <h2 style="color: #1f2937; font-size: 18px; margin-top: 0;">Welcome, ${name}!</h2>
        <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
          You now have access to 5 free 8D reports. Start creating professional quality reports today.
        </p>
        <a href="https://8d-reports.vercel.app/dashboard" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
          Go to Dashboard
        </a>
      </div>
    </div>
  `;
  return sendEmail({ to, subject: "Welcome to 8D Reports", html });
}
