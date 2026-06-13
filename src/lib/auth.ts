import { betterAuth } from "better-auth";
import { emailOTP } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "./db";
import * as schema from "./db/schema";
import { sendAuthOtpEmail } from "./email";

export function validatePassword(password: string): string | null {
  if (!password || password.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter";
  if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter";
  if (!/[0-9]/.test(password)) return "Password must contain at least one digit";
  if (!/[^A-Za-z0-9]/.test(password)) return "Password must contain at least one special character";
  return null;
}

function getTrustedOrigins() {
  const origins = new Set([
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://0.0.0.0:3000",
    "https://8d-reports.com",
    "https://www.8d-reports.com",
    "https://*.xiaoyouzi-labs-projects.vercel.app",
  ]);

  if (process.env.BETTER_AUTH_URL) {
    try {
      origins.add(new URL(process.env.BETTER_AUTH_URL).origin);
    } catch {
      // Ignore invalid env values and let Better Auth surface its own config warning.
    }
  }

  return [...origins];
}

function getAllowedAuthHosts() {
  const hosts = new Set([
    "localhost:3000",
    "localhost:3001",
    "127.0.0.1:3000",
    "0.0.0.0:3000",
    "8d-reports.com",
    "www.8d-reports.com",
    "8d-reports.vercel.app",
    "*.xiaoyouzi-labs-projects.vercel.app",
  ]);

  if (process.env.BETTER_AUTH_URL) {
    try {
      hosts.add(new URL(process.env.BETTER_AUTH_URL).host);
    } catch {
      // Ignore invalid env values and keep the explicit production hosts.
    }
  }

  return [...hosts];
}

function getEnabledSocialProviders(): Parameters<typeof betterAuth>[0]["socialProviders"] {
  if (process.env.ENABLE_SOCIAL_LOGIN !== "true") {
    return {};
  }

  const providers: NonNullable<Parameters<typeof betterAuth>[0]["socialProviders"]> = {};

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.google = {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    };
  }

  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    providers.github = {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    };
  }

  return providers;
}

function createAuth() {
  const db = getDb();
  if (!db) {
    const dummyConfig = {
      database: {},
      emailAndPassword: { enabled: true },
      socialProviders: {},
    } as Parameters<typeof betterAuth>[0];
    const dummy = betterAuth(dummyConfig);
    return dummy;
  }

  return betterAuth({
    baseURL: {
      allowedHosts: getAllowedAuthHosts(),
      fallback: "https://www.8d-reports.com",
      protocol: process.env.NODE_ENV === "production" ? "https" : undefined,
    },
    trustedOrigins: getTrustedOrigins(),
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: {
        user: schema.users,
        session: schema.sessions,
        account: schema.accounts,
        verification: schema.verifications,
      },
    }),
    emailAndPassword: {
      enabled: true,
      passwordValidator: async (password: string) => {
        return validatePassword(password);
      },
    },
    plugins: [
      emailOTP({
        sendVerificationOnSignUp: true,
        expiresIn: 300,
        async sendVerificationOTP({ email, otp, type }) {
          try {
            await sendAuthOtpEmail({ email, otp, type, expiresInSeconds: 300 });
          } catch (error) {
            console.error(
              `[AUTH EMAIL] Failed to send ${type} OTP to ${email}: ${
                error instanceof Error ? error.message : "Unknown error"
              }`
            );
            throw error;
          }
        },
      }),
    ],
    socialProviders: getEnabledSocialProviders(),
    session: {
      cookieCache: {
        enabled: true,
        maxAge: 30 * 24 * 60 * 60,
      },
    },
    advanced: {
      cookiePrefix: "better-auth",
      useSecureCookies: process.env.NODE_ENV === "production",
    },
  });
}

export const auth = createAuth();
