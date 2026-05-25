import { betterAuth } from "better-auth";
import { emailOTP } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "./db";
import * as schema from "./db/schema";

function validatePassword(password: string): string | null {
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
    "http://127.0.0.1:3000",
    "http://0.0.0.0:3000",
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
          const label = type === "email-verification"
            ? "EMAIL VERIFY"
            : type === "sign-in" ? "SIGN-IN" : "RESET PASSWORD";
          console.log(`\n===== ${label} OTP for ${email}: ${otp} =====\n`);
        },
      }),
    ],
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID || "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      },
      github: {
        clientId: process.env.GITHUB_CLIENT_ID || "",
        clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
      },
    },
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
