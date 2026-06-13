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

const AUTH_ORIGIN_ENV_KEYS = [
  "VERCEL_URL",
  "VERCEL_BRANCH_URL",
  "VERCEL_PROJECT_PRODUCTION_URL",
  "BETTER_AUTH_URL",
] as const;

function normalizeAuthUrl(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  const withProtocol = /^[a-z][a-z\d+\-.]*:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    return new URL(withProtocol);
  } catch {
    return null;
  }
}

function getConfiguredAuthUrls() {
  const values = AUTH_ORIGIN_ENV_KEYS.flatMap((key) => process.env[key] || []);
  const extraOrigins = process.env.BETTER_AUTH_TRUSTED_ORIGINS
    ?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean) || [];

  return [...values, ...extraOrigins]
    .map((value) => normalizeAuthUrl(value))
    .filter((url): url is URL => Boolean(url));
}

function getTrustedOrigins() {
  const origins = new Set([
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://0.0.0.0:3000",
    "https://8d-reports.com",
    "https://www.8d-reports.com",
  ]);

  for (const url of getConfiguredAuthUrls()) {
    origins.add(url.origin);
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
  ]);

  for (const url of getConfiguredAuthUrls()) {
    hosts.add(url.host);
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
