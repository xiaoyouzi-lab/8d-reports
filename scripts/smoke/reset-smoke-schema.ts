import { configureSmokeDatabase } from "./smoke-safety";

async function main() {
  const summary = configureSmokeDatabase();
  const { neon } = await import("@neondatabase/serverless");

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL was not configured after smoke safety checks.");
  }

  const sql = neon(databaseUrl);

  await sql`DROP SCHEMA IF EXISTS public CASCADE`;
  await sql`CREATE SCHEMA public`;
  await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;
  await sql`GRANT USAGE, CREATE ON SCHEMA public TO PUBLIC`;

  console.log("Temporary smoke schema reset", summary);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Smoke schema reset failed");
  process.exit(1);
});
