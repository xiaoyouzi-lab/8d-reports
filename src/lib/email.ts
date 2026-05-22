export async function sendEmail({ to, subject }: { to: string; subject: string; html: string }) {
  console.log(`[EMAIL] To: ${to} | Subject: ${subject} — email sending not configured`)
  return { ok: true }
}

export async function sendWelcomeEmail(to: string, name: string) {
  console.log(`[WELCOME] Welcome email for ${name} (${to})`)
  return sendEmail({ to, subject: "Welcome to 8D Reports", html: "" })
}
