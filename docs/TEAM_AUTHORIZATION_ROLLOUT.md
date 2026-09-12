# Team Authorization Rollout Runbook

Applies to PR #44 (Option A strict separation + invite acceptance).

## Why order matters

The PR adds columns and one index through
`drizzle/0008_team_authorization.sql`:

- `team_members.status` (default `accepted`), `accepted_at`, `invited_email`,
  `invite_token_hash`, `invite_expires_at`; `team_members.user_id` becomes
  nullable.
- `reports.team_id` (nullable FK to `team_workspaces`, ON DELETE SET NULL).

The application code reads those columns. Repository `npm run build` only runs
`next build`; it does not apply migrations. **If the code is deployed before the
migration, report and Team access queries fail.** Always: migrate, then deploy.

## Migration was validated

`0008` was applied to a real disposable Postgres 17 instance with a
representative pre-#44 baseline. Results:

- Applies cleanly.
- Existing `team_members` rows backfill to `status = 'accepted'` with
  `accepted_at` / `invited_email` NULL.
- `user_id` becomes nullable, so a pending invite for an unregistered email can
  be stored.
- `reports.team_id` is added, nullable, and existing reports stay NULL (personal).
- Both indexes are created.
- Re-applying the file is idempotent (no error), so a retried migration is safe.

## Rollout steps

1. Create a disposable Neon branch from production (or use an existing smoke
   branch). Never run this smoke against production.

2. Apply the migration to the disposable branch, then run the isolation smoke:

   - Seed fixtures: `npm run smoke:seed-auth` (exports
     `SMOKE_PENDING_INVITE_TOKEN`, `SMOKE_MEMBER_REPORT_ID`,
     `SMOKE_MEMBER_PERSONAL_REPORT_ID`).
   - Run the authenticated smoke against the app connected to that branch.
   - Required assertions:
     - The owner's report list excludes the member's pre-join personal report and
       the outsider report.
     - The pending outsider sees no team reports in `/api/reports` or
       `/api/knowledge/search`.
     - After `POST /api/team/accept` with the invite token, the outsider sees the
       team-scoped reports but still not the personal one.
     - Revoking the member removes access.
     - Two teams are mutually isolated.

3. Apply `drizzle/0008_team_authorization.sql` to the production database.

4. Merge PR #44. Vercel deploys `main`.

5. Verify in production: Team settings shows accepted vs pending correctly; an
   invited user can accept; a member's pre-join personal reports are not visible
   to the team owner.

## Rollback

The migration is additive, so the safe rollback is to revert the code (the extra
nullable columns are harmless). Dropping them is optional and only if required:

```sql
DROP INDEX IF EXISTS idx_reports_team_id;
DROP INDEX IF EXISTS idx_team_members_invite_token_hash;
ALTER TABLE reports DROP COLUMN IF EXISTS team_id;
ALTER TABLE team_members
  DROP COLUMN IF EXISTS status,
  DROP COLUMN IF EXISTS accepted_at,
  DROP COLUMN IF EXISTS invited_email,
  DROP COLUMN IF EXISTS invite_token_hash,
  DROP COLUMN IF EXISTS invite_expires_at;
```
