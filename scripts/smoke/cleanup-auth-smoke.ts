import { inArray } from "drizzle-orm";
import { db } from "../../src/lib/db";
import { plans, users, verifications } from "../../src/lib/db/schema";

const emails = [
  "smoke-owner@example.test",
  "smoke-member@example.test",
  "smoke-outsider@example.test",
];

async function main() {
  if (process.env.CONFIRM_SMOKE_FIXTURE_CLEANUP !== "true")
    throw new Error("Set CONFIRM_SMOKE_FIXTURE_CLEANUP=true for exact fixture cleanup.");
  const removedUsers = await db.delete(users).where(inArray(users.email, emails)).returning({ id: users.id });
  await db.delete(verifications).where(inArray(verifications.identifier, emails));
  const removedPlans = await db.delete(plans)
    .where(inArray(plans.creemProductId, ["smoke_free_plan", "smoke_team_plan"]))
    .returning({ id: plans.id });
  console.log({ removedUsers: removedUsers.length, removedPlans: removedPlans.length });
}

void main();
