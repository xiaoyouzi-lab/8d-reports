# Authenticated Smoke Testing

## Purpose

Authenticated smoke testing verifies logged-in app behavior without writing to production data. It exists so Codex and GitHub Actions can validate app-only features such as Dashboard navigation, Knowledge Base reuse, editor Knowledge Reuse, AI Quality Check Knowledge Context fallback, report Knowledge readiness, report access boundaries, copy actions, and safe analytics payloads after a PR changes authenticated UX.

## Architecture

- GitHub Actions manual workflow: `.github/workflows/authenticated-smoke.yml`.
- Trigger: `workflow_dispatch` only.
- Database: temporary Neon branch created from the configured parent branch.
- Cleanup: the temporary Neon branch is deleted in an `if: always()` workflow step.
- Schema: the temporary branch is reset by dropping and recreating `public`, then initialized with `drizzle-kit push`. The rehearsal removes only the newly added Quality Case tables, P0+ Case-link column, and customer-task authorization snapshot from that empty branch, then applies the repository-owned SQL files twice to prove both initial creation and additive/idempotent behavior. It then applies the dedicated PR-G2 Guided-ledger rollback (which drops only its eight new tables), verifies prior Quality Case tables remain, and reapplies PR-G2 before browser smoke.
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

The workflow may set local-only smoke runtime variables such as `AI_BETA_EMAILS=smoke-owner@example.test` so authenticated smoke can exercise beta-gated UI paths. It must not require or print a real AI provider key.

## Safety Rules

- `SMOKE_DB=true` is required before any seed, reset, or browser smoke script can run.
- `SMOKE_DATABASE_URL` or `DATABASE_URL` must point to an explicitly safe smoke/test/preview/local database or branch.
- A temporary Neon branch id must not match `NEON_PARENT_BRANCH_ID`.
- Scripts do not import `dotenv/config`, so local `.env` is not loaded implicitly.
- The workflow resets the cloned branch schema before initializing and seeding data.
- Full database URLs, passwords, tokens, and cookies must not be printed.
- Runtime-generated secrets must be masked with `::add-mask::` before they are written to `$GITHUB_ENV`.
- Production data must not be created, mutated, or deleted by smoke tests.

## Failure Diagnostics

The browser smoke writes `output/authenticated-smoke-result.json` on both pass and fail. Failed runs should still upload this artifact so the failure can be diagnosed without re-running against production data or reading secrets from logs.

The artifact records:

- `status`
- `failedStep`
- `completedSteps`
- a bounded, redacted `errorMessage`
- the current browser URL when available
- captured analytics event names and counts
- high-level check status
- a sanitized smoke database summary

The artifact must not include passwords, tokens, cookies, full database URLs, report text, customer/product names, root cause, corrective action, lessons learned, batch numbers, or raw search queries. If the browser is waiting for expected text, timeout errors include a short redacted body excerpt and the named smoke step so failures are actionable without exposing report content.

## Seeded Data

The authenticated seed creates:

- Smoke owner user.
- Smoke member user.
- Smoke outsider user.
- Active Team plan subscription for the owner.
- Team workspace with owner and editor member roles.
- Completed legacy-workflow report that should enter Knowledge Base.
- Closed report that should enter Knowledge Base.
- Draft report with weak Knowledge readiness fields that must be excluded from Knowledge Base.
- In-progress report that must be excluded.
- Internal-review report that must be excluded.
- Outsider completed report that must not leak.
- Team member approved internal 8D report that should be visible to the Team owner.

The browser smoke also creates an isolated Quality Case through the authenticated
API. It sends two supplier tasks and two customer tasks without registration.
The supplier tasks exercise the shared Guided/Expert Supplier Response Package
service with a token-scoped Session, original Answer, Investigator Run, linked
Evidence Requirement, advisory Readiness, Supplier Confirmation, submission
audit, and idempotent retry before internal review. The coordinator smoke then
opens the submitted Package, explicitly starts Internal Review, persists an
advisory Quality Reviewer Run, confirms a semantic mapping without writing the
legacy Report, builds an unsent customer draft from that human-confirmed text,
and creates a scoped supplier follow-up task. The supplier Guided response is
checked for those follow-up questions and for absence of internal notes and
commercial data. It then creates a version-frozen Customer Review snapshot,
verifies that only human-confirmed English sections and explicitly authorized
evidence are visible, submits a field-level Customer Feedback record, returns
the Case to Internal Review, authorizes a revised snapshot, and records a
separate customer acceptance. External projections are checked to omit
internal notes/AI risk/commercial/other-supplier data. The smoke also proves
customer acceptance is not closure, then completes effectiveness verification,
closure, and reopening. The temporary branch is deleted after the run.

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
- Report editor exposes a `Reuse Knowledge` entry.
- Report editor Knowledge Reuse panel opens from the top tool area.
- Editor Knowledge Reuse searches existing Knowledge Base assets through the same POST-only API.
- Editor Knowledge Reuse shows completed, closed, and accessible Team member approved assets while excluding draft, in-progress, internal-review, and outsider assets.
- Editor Knowledge Reuse copies root cause, corrective action, and lessons learned without writing report fields.
- Editor Knowledge Reuse clipboard failure displays the expected manual-copy message.
- Editor Knowledge Reuse opens source reports in a new tab and preserves the current editor tab.
- Editor Knowledge Reuse has no horizontal overflow on narrow/mobile viewport.
- Report editor shows the `Knowledge readiness` panel with root cause, corrective action, validation, prevention/system change, and lessons learned readiness rows.
- Workflow dialog shows the `Knowledge readiness` panel.
- Weak readiness workflow transitions show the expected non-blocking warning and emit safe readiness analytics.
- AI Quality Check can be opened by the smoke owner.
- AI Quality Check builds Knowledge Context before either a configured-provider
  result or the safe unavailable fallback.
- AI Quality Check shows either `Knowledge context used: N similar reports` or `No reusable knowledge context found yet.`
- `SMOKE_AI_EXPECTATION=unavailable` deterministically requires the safe 503
  fallback; `available` requires a provider result; `either` (the local
  default) validates whichever isolated environment is intentionally
  configured. This changes only Smoke expectations, not runtime AI behavior.
- AI Quality Check missing-key fallback does not expose prompt instructions or historical report content.
- AI Quality Check Knowledge Context analytics use only safe metadata.
- Report workflow panel includes a Knowledge Base entry.
- Analytics payloads use safe metadata only.
- The additive Quality Case SQL files apply twice after baseline schema setup;
  all Quality Case tables, `pgcrypto`, internal evidence visibility, the
  nullable P0+ `converted_case_id` link, and the customer-task authorization
  snapshot exist afterwards.
- Guided investigation sessions, immutable answer revisions, AI run audit
  fields, confirmation/mapping ledger fields, and retention metadata exist
  after the up migration. The temporary branch rehearsal then proves the
  dedicated PR-G2 rollback removes only those new tables and that the up
  migration can restore them without affecting the existing Case tables.
- An authenticated coordinator can create a Quality Case and use the complete
  supplier → internal → customer → effectiveness workflow, including return,
  closure, reopening, and immutable activity recording.
- Guided and Expert supplier submissions share the same package service. The
  smoke verifies Token → Session → Answer → AI Run → linked Evidence → Package
  → advisory Readiness → Confirmation → Submission Audit, then retries the
  same package and proves no duplicate confirmation or audit is created.
- Internal Quality Review reads the exact submitted Package and returns
  findings instead of a score. The smoke proves the review is advisory and
  cannot transition the Case, then verifies human mapping confirmation,
  no-Report-write metadata, confirmed-only customer draft preparation, and an
  explicit coordinator-owned transition back to a Guided supplier follow-up.
- Customer Review remains registration-free and token-scoped. The smoke
  verifies Ready for Customer → Customer Review → field-level Request Changes
  → Internal Review → revised Customer Review → Customer Accepted, including
  structured confirmed sections, authorized evidence metadata, feedback
  field/version audit data, and the rule that acceptance is not closure.
- Supplier/customer task links remain public only for their authorized task.
  The smoke asserts internal notes, AI risk assessment, commercial information,
  and other-supplier data are absent from an external supplier projection; it
  also proves a customer link is rejected until an English response is
  human-confirmed and then receives no AI draft or supplier free-form text.

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
- No payment, export, real AI provider calls, public marketing, or database schema changes.
- No automatic PR-triggered privileged workflow.

## Operational Risk

The largest risk is cleanup failure after a partially failed run. The workflow mitigates this by writing the temporary branch id to `$GITHUB_ENV` and deleting it with `if: always()`. If GitHub or Neon has an outage, the branch may need manual cleanup in Neon using the branch name pattern `auth-smoke-<run_id>-<run_attempt>`.

The next largest risk is an opaque UI assertion timeout. The smoke mitigates this by naming each browser step, writing the failure artifact before exiting, and redacting sensitive fixture text from logs and artifacts.
