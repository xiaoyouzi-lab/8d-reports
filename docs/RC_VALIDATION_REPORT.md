# Release Candidate Validation Report

Date: 2026-07-11
Result: **Quality Case RC lifecycle passed; conditional release recommended**

## 1. RC environment

### Database

- Provider: Neon Postgres 16.
- Temporary project: `sparkling-moon-02509928`.
- Temporary branch: `br-falling-shadow-atfh8bgf`.
- Database: `neondb`.
- The project was created empty instead of branching production, so no
  production customer, report, payment, or identity data entered the RC test.
- Every smoke command set `SMOKE_DB=true`, the temporary branch ID/name, and a
  dedicated connection string. Safety output retained only redacted hints.

### Object storage

- Temporary local S3-compatible `s3rver` instance on loopback only.
- Dedicated `8d-reports` bucket and disposable filesystem directory.
- Test credentials were non-production `S3RVER` credentials.
- `R2_ENDPOINT` and `R2_FORCE_PATH_STYLE` are opt-in; when absent, production
  Cloudflare R2 endpoint construction is unchanged.
- Final inspection found 7 readable objects, including 4 verification objects.

### Test identities

- Owner / Coordinator: `smoke-owner@example.test`.
- Internal member: `smoke-member@example.test`.
- Unauthorized outsider: `smoke-outsider@example.test`.
- Supplier and Customer used bounded external task tokens without accounts.
- `.example.test` identities are deliberately non-deliverable. No production
  mailbox or outbound email provider was used.

## 2. Migration rehearsal

The empty RC database completed:

1. schema reset;
2. current Drizzle schema initialization;
3. migrations `0008` through `0012` up;
4. idempotent second up pass;
5. PR-G2 eight-table scoped rollback;
6. PR-G2 reapply;
7. PR-G7 eight-table scoped rollback;
8. PR-G7 reapply;
9. required table and column inspection.

Result: 73 reviewed migration statements, 24 required Quality Case tables, both
scoped rollback sets, and final reapply passed.

## 3. Complete Quality Case smoke

Artifact: `output/rc-validation/quality-case-smoke-result.json`.

| Step | Result | Evidence |
| --- | --- | --- |
| Create Case | Pass | Owner-created SCAR Quality Case |
| Create Supplier Task | Pass | Case-bound, expiring task token |
| Supplier Guided Mode | Pass | Session/question/answer and AI run persisted |
| Supplier Evidence / Package | Pass | Evidence linked to requirement and answer |
| Supplier Submit | Pass | Supplier Submitted; one confirmation and audit |
| Expert resubmission | Pass | Same package submission service used |
| Internal Review | Pass | Reviewer run, mapping confirmation and follow-up |
| Customer Review | Pass | Confirmed English snapshot only |
| Customer Request Changes | Pass | Field-level feedback and Case version saved |
| Customer Accept | Pass | `customer_accepted`, not Closed |
| Verification Plan/Result | Pass | Plan, execution and criteria comparison saved |
| Verification Evidence | Pass | Actual object PUT plus Result/Evidence DB link |
| Internal Approval | Pass | Human approval produced `verified_effective` |
| Close and Reopen | Pass | Separate audited human actions |

The final scoped artifact reports `status: passed` for unauthenticated security,
login, desktop/mobile navigation, and Quality Case workflow.

## 4. Token, permission, and disclosure checks

- Four external tasks existed for the final Case; all four token values were
  represented only by 64-character SHA-256 hashes.
- All four completed task links were immutable for further submission.
- Supplier and Customer external projections omitted internal notes, commercial
  data, AI risk analysis, supplier scratch text, and unconfirmed translations.
- Customer task creation was rejected until an English response was confirmed.
- An unrelated authenticated user received `404` for Case read and Verification
  review attempts, preventing organization existence disclosure.
- Unauthenticated internal APIs were rejected.
- Supplier/Customer external actions could not approve, close, or reopen.

## 5. Audit and persistence evidence

Final database evidence for the latest RC Case:

- 30 Case activity rows and 13 Verification audit rows.
- Three verification cycles:
  - Cycle 1: `verified_effective`, completed and retained.
  - Cycle 2: `verification_failed`, completed and retained.
  - Cycle 3: `verification_planning`, newly created without overwrite.
- One Result-linked Verification Evidence record in the latest normal cycle.
- Each Guided and Expert supplier session had exactly one submitted
  confirmation and one supplier audit.
- The audit sequence included plan creation, execution, evidence, submission,
  human approval, close, failed review, reopen, and replacement planning.

## 6. Concurrency and failure recovery

Two Supplier Response Package requests were sent concurrently with the same
token and Session:

- both returned success;
- exactly one returned `alreadySubmitted: false`;
- exactly one returned `alreadySubmitted: true`;
- database inspection showed one confirmation and one workflow audit per
  Session.

Failure recovery was verified by submitting a failing Verification Result,
marking it failed as an authorized human, checking the Case returned to
`reopened`, and then creating a new numbered cycle. The earlier effective and
failed cycles remained unchanged.

## 7. RC findings fixed during validation

### P0 — Supplier atomic submit failed on real Postgres

The transaction guard emitted ambiguous unqualified `id` columns in a
multi-table join. Fixed by explicitly qualifying every joined table column.
A regression source-contract assertion was added.

### P0 — Customer decision had the same SQL ambiguity

The Customer Review atomic guard used the same raw SQL pattern. It was fixed and
covered by the Customer Review contract test.

### Test reliability fixes

- Wait for React hydration before login input to prevent an empty 400 request.
- Read `detail.qualityCase.status` using the actual API shape.
- Support explicit isolated S3-compatible endpoints without changing production
  defaults.
- Make file-upload smoke assertions environment-aware.
- Add a `quality-case` smoke scope and real concurrent/failure lifecycle checks.

## 8. Remaining blockers and risks

### Release blocker: outbound email delivery not validated

Test identities were safe `.example.test` accounts. Invitation URLs and tokens
were validated, but delivery through a staging mailbox/Resend domain was not.
If launch requires automated invitation delivery, this must pass before release.

### Release condition: preview Cloudflare R2 validation

S3 API behavior, DB association, upload, list, and read were validated against
isolated compatible storage. Run one preview check against a non-production
Cloudflare R2 bucket before production promotion to cover provider-specific
credentials, CORS, and lifecycle policy.

### Non-RC regression observation

The broader authenticated product smoke progressed through the complete Quality
Case flow, template upload, Knowledge Base, and editor reuse. Its AI Quality
Check fallback expectation did not match the current configured environment.
This is outside the scoped Quality Case RC result but should be reconciled before
using the broad smoke as a single release gate.

## 9. Release recommendation

**Conditional GO for a preview/canary release; NO-GO for unrestricted production
until email delivery and preview R2 checks pass.**

Recommended order:

1. configure a staging mailbox and send Supplier/Customer invitations;
2. repeat evidence PUT/GET against a temporary Cloudflare R2 bucket;
3. run the scoped Quality Case smoke once in the preview deployment;
4. reconcile the unrelated AI fallback smoke expectation;
5. canary with one internal Coordinator and one controlled supplier/customer;
6. monitor task submission conflicts, evidence failures, and verification audit
   completeness before wider release.
