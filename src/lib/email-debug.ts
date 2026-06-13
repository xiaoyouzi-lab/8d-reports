export const EMAIL_DEBUG_ROUTE_VERSION = "auth-email-debug-v1";

export function isEmailDebugAvailable() {
  return (
    process.env.VERCEL_ENV === "preview" ||
    (process.env.NODE_ENV !== "production" && !process.env.VERCEL_ENV)
  );
}

export function getEmailDomain(email: string) {
  return email.split("@")[1]?.toLowerCase() || "unknown";
}

export function getEmailDebugConfig(email?: string) {
  return {
    routeVersion: EMAIL_DEBUG_ROUTE_VERSION,
    emailDomain: email ? getEmailDomain(email) : undefined,
    hasResendApiKey: Boolean(process.env.RESEND_API_KEY),
    hasEmailFrom: Boolean(process.env.EMAIL_FROM),
    hasBetterAuthUrl: Boolean(process.env.BETTER_AUTH_URL),
    vercelEnv: process.env.VERCEL_ENV || "local",
    commitSha: process.env.VERCEL_GIT_COMMIT_SHA || "unknown",
  };
}
