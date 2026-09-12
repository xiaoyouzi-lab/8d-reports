-- Option A strict separation: accepted-only memberships and team-scoped reports.
-- Additive only: existing rows keep their data and backfill to status 'accepted'.
ALTER TABLE "team_members" ADD COLUMN IF NOT EXISTS "status" text NOT NULL DEFAULT 'accepted';
ALTER TABLE "team_members" ADD COLUMN IF NOT EXISTS "accepted_at" timestamp;
ALTER TABLE "team_members" ADD COLUMN IF NOT EXISTS "invited_email" text;
ALTER TABLE "team_members" ADD COLUMN IF NOT EXISTS "invite_token_hash" text;
ALTER TABLE "team_members" ADD COLUMN IF NOT EXISTS "invite_expires_at" timestamp;

-- Pending invitations for unregistered emails have no user row yet.
ALTER TABLE "team_members" ALTER COLUMN "user_id" DROP NOT NULL;

CREATE INDEX IF NOT EXISTS "idx_team_members_invite_token_hash" ON "team_members" ("invite_token_hash");

ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "team_id" uuid REFERENCES "team_workspaces"("id") ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS "idx_reports_team_id" ON "reports" ("team_id");
