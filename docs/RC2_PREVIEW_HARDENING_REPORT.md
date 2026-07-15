# RC-2 Preview Hardening Report

Date: 2026-07-11
Branch: `codex/rc2-preview-hardening`
Decision: **NO-GO for Canary until an isolated Cloudflare R2 Preview bucket is provisioned and the full Evidence lifecycle passes.**

## 1. Preview Environment

An isolated, disposable validation environment was created and then destroyed after evidence collection:

- Vercel project: existing `8d-reports`, Preview target only.
- Vercel branch scope: `codex/rc2-preview-hardening`.
- Final validated deployment: `dpl_GvgbyrainYDnY2D8FYsszJcxcbsu` (`READY`).
- Database: new Neon project `dry-cloud-66438611`, branch `br-polished-sunset-a6w83s8q`, initialized from the current Drizzle schema with 228 generated statements.
- Test data: 3 fixed `example.test` users and 7 synthetic reports; no production data was copied.
- Email: existing Vercel Preview Resend credentials and Resend official `delivered+label@resend.dev` test recipients.
- Object storage: no isolated R2 bucket could be created because the available credential is object-level / bucket-scoped and returned `403 AccessDenied` for `CreateBucket`.

Cleanup completed:

- Removed the branch-scoped Vercel `DATABASE_URL`.
- Removed all three RC-2 Vercel Preview deployments.
- Deleted the temporary Neon project.
- Removed `/tmp/rc2-preview.env`.
- A CLI isolation mistake briefly seeded the generic Preview database. The exact three `smoke-*@example.test` identities and two `smoke_*_plan` rows were immediately removed; cleanup reported `removedUsers: 3`, `removedPlans: 2`. No real user selector was used.

The validated URL is intentionally no longer live after teardown.

## 2. Email Validation

Result: **PASS for Resend transport, link opening, scope, expiry, and revocation.**

Implemented hardening:

- Supplier and Customer task creation can send the existing secure link through Resend.
- Supplier copy is Chinese-first; Customer review copy is English.
- Resend sends use a task-derived idempotency key.
- If email delivery fails after task creation, the secure link remains available for approved manual delivery and the UI shows an explicit warning; the Case is not silently lost.
- A Preview-only, authenticated diagnostic returns only `providerMessageId` and `lastEvent`. It returns 404 in Production and never exposes recipient, subject, body, or API credentials.

Real Preview smoke:

| Check | Result |
| --- | --- |
| Supplier Invitation accepted by Resend | PASS |
| Customer Review Invitation accepted by Resend | PASS |
| Resend final event | PASS (`delivered`) |
| Supplier link opens Guided page | PASS |
| Customer link opens English Review page | PASS |
| Supplier projection excludes internal notes | PASS |
| Customer projection includes only human-confirmed text | PASS |
| Revoked token rejected | PASS (404) |
| Expired token rejected | PASS (404) |

Four messages were validated because the smoke included main Supplier, main Customer, revoked-token, and expired-token invitation paths. Artifact: `output/rc2/email-smoke.json`.

Limitation: `delivered@resend.dev` is Resend's official delivery-event test environment, not an interactive human inbox. It proves provider acceptance and the `delivered` event. A named team test mailbox should still perform a visual inbox/client rendering check before Canary.

## 3. Cloudflare R2 Validation

Result: **BLOCKED before bucket creation; no production bucket write occurred.**

Attempted isolated bucket:

- Requested name: `8d-reports-rc2-20260711-019f49c8`.
- Guard: the script refuses `R2_PREVIEW_BUCKET === R2_BUCKET_NAME`.
- Cloudflare response: `403 AccessDenied` on `CreateBucket`.
- Cause: current credentials permit object access to an existing bucket but do not have bucket-management permission. No Cloudflare admin API token or Wrangler login was available.

Code hardening completed and deterministically tested:

- Supplier Evidence, internal Verification Evidence, and supplier Verification Evidence now track whether object upload succeeded.
- If the following database write/relation fails, `cleanupOrphanedR2Object()` compensates with `DeleteObject`.
- Every compensation emits a structured, content-free `r2_orphan_cleanup` event with context, key, and `deleted` / `delete_failed` outcome.
- The compensation contract test proves the successful cleanup branch.

Still required on a real isolated bucket:

- PUT / HEAD / GET / DELETE.
- Private access denial.
- Product Evidence row/relation and authorized download.
- Real database-failure injection after PUT, followed by object absence and log verification.
- Delete failure/retry observation.

Artifact: `output/rc2/r2-preview-attempt.json`.

## 4. Smoke Results

### Passed

- Email/Token Preview browser smoke: 7/7 checks passed.
- Preview database audit at completion: 3 Cases, 4 task links, 10 activities, 1 revoked token, 1 expired token.
- Current deployment warning/error scan after the successful smoke: no warning or error logs.
- `npm run test:preview-hardening`: PASS.
- Supplier Response Package: PASS.
- Internal Quality Review: PASS.
- Customer Review: PASS.
- Effectiveness Verification: PASS.
- Team governance: PASS.
- TypeScript `--noEmit`: PASS.
- Next 16 production build locally and on Vercel: PASS.
- ESLint: PASS with 11 pre-existing warnings and 0 errors.

### Smoke expectation alignment

The legacy AI Quality Check smoke no longer assumes every environment lacks an AI provider. `SMOKE_AI_EXPECTATION` now supports:

- `unavailable`: require the safe 503 fallback;
- `available`: require a provider result;
- `either`: validate the intentional environment result while retaining Knowledge Context and data-leak checks.

GitHub CI explicitly uses `unavailable`; local/default validation uses `either`. Runtime AI production behavior was not changed.

### Not completed

The complete deployed Customer Complaint → Supplier → Coordinator → Customer → Verification → Close/Reopen smoke was **not** run against R2 because the only configured Vercel R2 bucket is shared with Production. Running it would have violated isolation. The same lifecycle passed previously against isolated temporary S3-compatible storage in RC validation, but that is not a substitute for this required Cloudflare Provider smoke.

## 5. Remaining Risks

| Risk | Severity | Release effect |
| --- | --- | --- |
| No isolated Cloudflare R2 Preview bucket / provider smoke | Blocker | Canary NO-GO |
| No interactive team inbox visual rendering test | Medium | Complete before inviting external Canary users |
| Preview env tooling silently falls back when Sensitive variables are unavailable locally | High | Do not use `vercel env run` as proof of branch-specific sensitive DB isolation; add host/project assertion before fixture writes |
| Orphan cleanup failure has structured logs but no durable retry queue | Medium | Monitor during Canary; add retry/outbox only if failure is observed |
| Task creation DB operations predate RC-2 and are not a single database transaction | Medium | Monitor task conflict rate; consider a separate consistency hardening PR |

## 6. Canary Recommendation

Current recommendation: **NO-GO**.

Change to GO only after all of the following are evidenced:

1. A Cloudflare admin creates an independent private Preview bucket and least-privilege object token.
2. Branch-scoped Vercel Preview variables point only to that bucket and a proven isolated database.
3. `npm run smoke:r2-preview -- provision|validate` passes real Cloudflare operations.
4. The full scoped Quality Case smoke passes on the deployed Preview, including linked Evidence and database-failure compensation.
5. One named team test mailbox visually checks Supplier and Customer messages in desktop and mobile clients.
6. Canary is limited to internal accounts / named suppliers, with logs watched for invitation failure, `r2_orphan_cleanup`, task conflicts, and verification transition errors.

Do not promote any recorded RC-2 deployment: all were temporary and have been deleted.
