# Current Task

## Task Name

End-of-run Product Review Backlog v1.

## Context

Revenue Evidence Sprint v1 shipped a measurable acquisition and service-intent
baseline. Before adding another runtime feature, the product needs a concise
backlog that turns the end-of-run review into small, evidence-based follow-up
PRs.

## Goal

Audit the current product surface and document the highest-leverage P1/P2
follow-up work across public acquisition, signup, app activation, Knowledge
Base reuse, editor workflow, and revenue operations.

## Scope

- Review homepage, Pricing, Custom Template Setup, demo reports, Contact,
  Signup, Dashboard, Report Editor, Knowledge Base, and Revenue Admin Metrics.
- Add `docs/PRODUCT_REVIEW_BACKLOG.md` with severity, evidence, user impact,
  suggested PR, not-to-do, and expected metric impact for each issue.
- Keep the backlog grounded in current product behavior and current main branch.
- Add governance coverage for the backlog artifact.
- Update the development log.

## Non-Goals

- No runtime product feature changes.
- No public marketing rewrite.
- No payment, checkout, pricing amount, subscription, auth, password reset, or
  Resend changes.
- No report editor core-flow, export, AI backend, Knowledge Base search,
  Knowledge Base eligibility, permission, or share-token changes.
- No database schema migration.
- No production data writes.

## Acceptance Criteria

- Product review backlog exists and covers all required surfaces.
- Each issue includes severity, evidence, user impact, suggested PR, not-to-do,
  and expected metric impact.
- The backlog clearly states that no P0 blockers were found.
- The backlog separates P1/P2 follow-up work from future-only items.
- Governance checks protect the document structure and forbidden-scope boundary.
- Required checks pass: `git diff --check`, `npx tsc --noEmit`,
  `npm run lint`, `npm run build`, and `npm run test:governance`.

## Risks

- Backlog items can be mistaken for approved scope; each item must remain a
  suggested follow-up PR, not an implementation in this docs-only task.
- Revenue diagnostics should not create pressure to collect sensitive quality
  content in analytics.
- Knowledge Base scaling should wait for real workspace volume before database
  schema or indexing work.
