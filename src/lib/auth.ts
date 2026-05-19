import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "./db";
import * as schema from "./db/schema";

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
    emailAndPassword: { enabled: true },
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
  });
}

export const auth = createAuth();
