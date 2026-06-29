# Authenticated Smoke Testing

## Purpose

Authenticated smoke testing verifies logged-in app behavior without writing to production data. It exists so Codex and GitHub Actions can validate app-only features such as Dashboard navigation, Knowledge Base reuse, report access boundaries, copy actions, and safe analytics payloads after a PR changes authenticated UX.

## Architecture

- GitHub Actions manual workflow: `.github/workflows/authenticated-smoke.yml`.
- Trigger: `workflow_dispatch` only.
- Database: temporary Neon branch created from the configured parent branch.
- Cleanup: the temporary Neon branch is deleted in an `if: always()` workflow step.
- Schema: the temporary branch is reset by dropping and recreating `public`, then initialized with `drizzle-kit push`.
- Fixtures: `scripts/smoke/seed-auth-smoke.ts` creates isolated smoke users, a Team workspace, and reports in eligible and excluded states.
- Browser test: `scripts/smoke/authenticated-smoke.ts` starts from a local Next app, logs in through Better Auth, and validates the logged-in app.

The workflow intentionally does not run on `pull_request` because it needs a privileged Neon API key. It is designed as a safe manual promotion/readiness check.

## Required GitHub Configuration

Required secret:

- `NEON_API_KEY`

Required repository variables:

- `NEON_PROJECT_ID`
- `NEON_PARENT_BRANCH_ID`
- `NEON_DATABASE_NAME`

The workflow must fail clearly if these values are missing. It must not guess a database, use `.env`, or fall back to the production `DATABASE_URL`.

## Safety Rules

- `SMOKE_DB=true` is required before any seed, reset, or browser smoke script can run.
- `SMOKE_DATABASE_URL` or `DATABASE_URL` must point to an explicitly safe smoke/test/preview/local database or branch.
- A temporary Neon branch id must not match `NEON_PARENT_BRANCH_ID`.
- Scripts do not import `dotenv/config`, so local `.env` is not loaded implicitly.
- The workflow resets the cloned branch schema before initializing and seeding data.
- Full database URLs, passwords, tokens, and cookies must not be printed.
- Production data must not be created, mutated, or deleted by smoke tests.

## Seeded Data

The authenticated seed creates:

- Smoke owner user.
- Smoke member user.
- Smoke outsider user.
- Active Team plan subscription for the owner.
- Team workspace with owner and editor member roles.
- Completed legacy-workflow report that should enter Knowledge Base.
- Closed report that should enter Knowledge Base.
- Draft report that must be excluded.
- In-progress report that must be excluded.
- Internal-review report that must be excluded.
- Outsider completed report that must not leak.
- Team member approved internal 8D report that should be visible to the Team owner.

The seeded report text is only test fixture data in the temporary database. The browser smoke also verifies that analytics metadata does not include the full query, customer/product names, root cause, corrective action, lessons learned, batch, or other sensitive report content.

## Browser Coverage

The authenticated smoke verifies:

- `/dashboard` and `/knowledge` redirect to `/login` when unauthenticated.
- `GET /api/knowledge/search` returns `405`.
- Unauthenticated `POST /api/knowledge/search` returns `401`.
- Logged-in header exposes Dashboard, Knowledge Base, and New Report.
- Logged-in app logo points to `/dashboard`.
- Mobile navigation exposes Dashboard, Knowledge Base, and New Report without horizontal overflow.
- Dashboard create -> complete -> reuse guidance is visible.
- Dashboard Knowledge Base entry works and emits safe analytics.
- Knowledge Base includes completed/closed/accessible Team member approved assets.
- Draft, in-progress, internal-review, and outsider reports are excluded.
- Search works for problem, product/customer, root cause, and corrective-action terms.
- Status, report type, and priority filters work.
- Open report works.
- Root cause, corrective action, and lessons learned copy actions work.
- Clipboard failure displays the expected manual-copy message.
- Report workflow panel includes a Knowledge Base entry.
- Analytics payloads use safe metadata only.

## Local Use

Local authenticated smoke is allowed only when a developer explicitly provides a safe database:

```bash
SMOKE_DB=true \
SMOKE_DATABASE_URL="postgres://..." \
SMOKE_NEON_BRANCH_NAME="auth-smoke-local" \
SMOKE_BASE_URL="http://127.0.0.1:3028" \
npm run smoke:auth
```

Do not use the local `.env` production or preview database as a fallback. If the database cannot be proven safe, stop instead of creating data.

## Non-Goals

- No production data writes.
- No production user creation.
- No product behavior changes.
- No payment, export, AI, public marketing, or database schema changes.
- No automatic PR-triggered privileged workflow.

## Operational Risk

The largest risk is cleanup failure after a partially failed run. The workflow mitigates this by writing the temporary branch id to `$GITHUB_ENV` and deleting it with `if: always()`. If GitHub or Neon has an outage, the branch may need manual cleanup in Neon using the branch name pattern `auth-smoke-<run_id>-<run_attempt>`.
