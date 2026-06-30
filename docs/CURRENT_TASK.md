# Current Task

## Task Name

Product Operating Metrics v1.

## Context

Recent product work moved 8D Reports from a single report editor toward a reusable quality response workspace:

- Quality Knowledge Base turns completed reports into searchable knowledge assets.
- Authenticated app discoverability makes Dashboard, Knowledge Base, and New Report visible in the logged-in workspace.
- Authenticated smoke infrastructure safely verifies logged-in behavior on temporary Neon branches.
- Knowledge Reuse brings copy-only historical knowledge into the report editor.

The next step is to define the operating metrics that show whether users actually move through the product loop from visit, to report creation, to completed knowledge, to reuse, AI review, export/share, and paid value.

## Goal

Create a privacy-safe product operating metrics definition that can guide weekly product reviews without adding invasive tracking or collecting sensitive report content.

## Scope

- Add `docs/PRODUCT_OPERATING_METRICS.md`.
- Define the core funnel from Visitor -> Signup through Team upgrade / service request.
- For each funnel metric, document event name/source, source page or component, why it matters, safe metadata, forbidden data, and target interpretation.
- Reuse existing event names and database-derived metrics where possible.
- Update governance checks so future changes preserve the metrics document and privacy boundaries.
- Update task and development docs.

## Non-Goals

- No runtime product feature changes.
- No public marketing page changes.
- No payment, pricing, checkout, subscription, export, auth, Resend, production configuration, or database schema changes.
- No AI backend changes.
- No Knowledge Base search, eligibility, permission, or report access logic changes.
- No new analytics collection beyond documenting safe metrics.
- No production data access or production test data.

## Acceptance Criteria

- `docs/PRODUCT_OPERATING_METRICS.md` exists.
- The document defines these 10 funnel steps:
  1. Visitor -> Signup
  2. Signup -> First report created
  3. First report created -> D4/D5 filled
  4. Report completed -> Knowledge asset created
  5. Knowledge asset -> Knowledge search
  6. Knowledge search -> Copy root cause/action/lesson
  7. Editor reuse opened -> Copy
  8. AI Quality Check run
  9. Export / share
  10. Team upgrade / service request
- Each metric includes event name/source, source page or component, why it matters, safe metadata, forbidden data, and target interpretation.
- The document explicitly prohibits collecting full queries, report content, customer/supplier/product/batch identifiers, root cause, corrective action, lessons learned, attachment content, AI prompts/raw output, share tokens, payment details, and email addresses.
- The document distinguishes existing event coverage from database-derived or future coverage.
- Governance tests cover the new metrics document and privacy rules.
- Required checks pass: `git diff --check`, `npx tsc --noEmit`, `npm run lint`, `npm run build`, and `npm run test:governance`.

## Risks

- Product metrics can create pressure to over-track sensitive quality data; the document must keep privacy boundaries explicit.
- Some funnel steps are best measured from database state, not client events.
- Checkout completion and service-request reporting need separate privacy-safe operational reporting before broader dashboarding.
