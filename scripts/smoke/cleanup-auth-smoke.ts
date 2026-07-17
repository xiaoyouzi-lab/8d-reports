import { eq, inArray } from "drizzle-orm";
import { db } from "../../src/lib/db";
import { deleteR2Object } from "../../src/lib/r2";
import { plans, qualityCaseEvidence, qualityCases, users, verifications } from "../../src/lib/db/schema";

const emails = [
  "smoke-owner@example.test",
  "smoke-member@example.test",
  "smoke-outsider@example.test",
];

async function main() {
  if (process.env.CONFIRM_SMOKE_FIXTURE_CLEANUP !== "true")
    throw new Error("Set CONFIRM_SMOKE_FIXTURE_CLEANUP=true for exact fixture cleanup.");

  // Database cascades cannot delete R2 objects. Resolve only evidence owned by
  // the fixed smoke users before their cases are removed, so Preview smoke
  // cleanup never enumerates or touches unrelated Preview artifacts.
  const smokeEvidence = await db
    .select({ storagePath: qualityCaseEvidence.storagePath })
    .from(qualityCaseEvidence)
    .innerJoin(qualityCases, eq(qualityCaseEvidence.caseId, qualityCases.id))
    .innerJoin(users, eq(qualityCases.ownerId, users.id))
    .where(inArray(users.email, emails));
  const storagePaths = [...new Set(smokeEvidence.map(({ storagePath }) => storagePath))];
  const removedR2Objects = await Promise.all(storagePaths.map(async (storagePath) => {
    const removed = await deleteR2Object(storagePath);
    if (!removed) throw new Error("Smoke R2 cleanup did not confirm object deletion.");
    return removed;
  }));

  const removedUsers = await db.delete(users).where(inArray(users.email, emails)).returning({ id: users.id });
  await db.delete(verifications).where(inArray(verifications.identifier, emails));
  const removedPlans = await db.delete(plans)
    .where(inArray(plans.creemProductId, ["smoke_free_plan", "smoke_team_plan"]))
    .returning({ id: plans.id });
  console.log({ removedUsers: removedUsers.length, removedPlans: removedPlans.length, removedR2Objects: removedR2Objects.length });
}

void main();
