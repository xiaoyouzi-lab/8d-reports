# Quality Case Platform Foundation

## Purpose

This is the compatibility-first foundation for evolving 8D Reports into a
bilingual customer-complaint and supplier corrective-action collaboration
platform. Existing `reports` remain unchanged. A later Quality Case can link
to one or more report outputs (8D, SCAR, CAR, CAPA, NCR Response, or
Corrective Action Report) without reinterpreting or migrating existing report
data.

## Non-negotiable workflow rules

- AI may extract, translate, flag conflicts, and draft; it cannot submit,
  approve, accept, close, or reopen a case.
- Customer acceptance moves a case to `customer_accepted`, never `closed`.
  An authorized internal user must begin effectiveness verification before a
  separate close action is possible.
- Returns require an explicit comment, affected fields, and a new due date
  when the supplier must act.
- Every state transition will create an immutable, versioned activity entry
  containing the actor, organization, timestamp, comment, requested fields,
  due date, evidence references, and before/after diff.
- External task links are separate from existing report shares. They are
  single-purpose, revocable, expiring, hashed tokens and use an allowlist
  projection. Internal notes, AI risk assessment, commercial information, and
  other supplier data are never part of an external projection.
- Text storage keeps source text, AI draft translation, and human-confirmed
  translation distinct. Only source text or a confirmed translation can be
  used in external final output.

## Delivery sequence

1. PR1 (this foundation): pure workflow, external-visibility, bilingual-text,
   and overdue contracts with deterministic tests. No persistence or routes.
2. PR2: additive Quality Case, participant, task-token, version, activity,
   evidence, output-link, and bilingual-text tables; server-side internal
   authorization plus hashed/revocable/expiring task-token helpers. Existing
   report tables and routes remain untouched.
3. PR3: authenticated Chinese-first Case dashboard and detail shell; retain
   the existing Reports dashboard as a compatible report-output workspace.
4. PR4: Chinese supplier response and English customer-review task surfaces.
5. PR5: controlled output adapter, confirmed-translation workflow, homepage
   intake handoff, pricing copy, and product-level acceptance tests.
6. PR6: preview validation, migration backup/rollback rehearsal, external-link
   revocation test, and staged production enablement.

## Migration safety gate

Before any disposable-database rehearsal, run
`npm run test:quality-case-migration`. It verifies that the Quality Case SQL
creates only additive Case tables, has the `pgcrypto` dependency required for
UUID generation, preserves legacy report/user/team tables, keeps external
tokens unique, defaults evidence visibility to `internal`, and includes an
additive customer-review authorization snapshot. This is a
static safety gate only; it does not connect to a database or prove a migration
has run. A real rehearsal must use the existing `SMOKE_DB=true` safeguards and
an explicitly named smoke/test/preview branch, never a local `.env` fallback.
The manual GitHub authenticated-smoke workflow runs
`npm run smoke:db:rehearse-quality-case` after baseline schema initialization.
That script removes only the newly added Quality Case objects from the already
empty disposable branch, applies both repository-owned Quality Case SQL files
once for initial creation and once for idempotence, then verifies required
tables, `pgcrypto`, the internal evidence default, the nullable P0+
conversion link, and the customer-review authorization snapshot. It is a
release gate for a disposable branch, not permission
to run the migration on production.

## Explicit exclusions from PR1

No database migration, production setting, auth change, payment/entitlement
change, report export change, report API change, existing share-link change, or
production data write is included.
