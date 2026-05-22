import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "./db";
import * as schema from "./db/schema";
import { sendEmail } from "./email";

function validatePassword(password: string): string | null {
  if (!password || password.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter";
  if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter";
  if (!/[0-9]/.test(password)) return "Password must contain at least one digit";
  if (!/[^A-Za-z0-9]/.test(password)) return "Password must contain at least one special character";
  return null;
}

function createAuth() {
  const db = getDb();
  if (!db) {
    const dummy = betterAuth({
      database: {},
      emailAndPassword: { enabled: true },
      socialProviders: {},
    } as any);
    return dummy;
  }

  return betterAuth({
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
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
            <div style="background: #4F46E5; border-radius: 12px 12px 0 0; padding: 24px; text-align: center;">
              <span style="color: white; font-size: 24px; font-weight: bold;">8D Reports</span>
            </div>
            <div style="border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; padding: 24px;">
              <h2 style="color: #1f2937; font-size: 18px; margin-top: 0;">Verify your email</h2>
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                Thank you for signing up for 8D Reports. Please verify your email by clicking the button below.
              </p>
              <a href="${url}" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
                Verify email
              </a>
              <p style="color: #9ca3af; font-size: 12px;">
                If you didn't create an account, you can safely ignore this email.
              </p>
            </div>
          </div>
        `;
        await sendEmail({ to: user.email, subject: "Verify your email — 8D Reports", html });
      },
    },
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
