# Current Task

## Task Name

Revenue Evidence Operating System v1.

## Context

Revenue Evidence Sprint v1 is deployed. The site can now collect early
conversion evidence from service CTAs, Template Setup / Team Launch / Assisted
First 8D leads, demo downloads, signup, export intent, Knowledge reuse, and AI
Quality Check intent.

The next priority is not another product feature. The priority is to make the
daily and weekly operating rhythm explicit so the product does not become an
unmeasured collection of features.

## Goal

Define a safe, repeatable operating system for reviewing revenue evidence,
following up with service leads, and deciding what to improve next.

## Scope

- Add `docs/REVENUE_EVIDENCE_OPERATING_SYSTEM.md`.
- Define the daily checklist for revenue and reuse signals.
- Define weekly decision rules for common funnel patterns.
- Define follow-up playbooks for Template Setup, Team Launch, and Assisted First
  8D / SCAR Delivery leads.
- Define Week 1, Month 1, and Month 3 early revenue targets.
- Define what not to do while collecting evidence.
- Add governance coverage so the operating system remains present and scoped.
- Update the development log.

## Non-Goals

- No runtime business logic changes.
- No public marketing page changes.
- No payment, checkout, subscription, pricing amount, auth, password reset,
  Resend, export entitlement, AI backend, Knowledge Base permission/search, or
  database schema changes.
- No production data writes.
- No production test leads, users, reports, or admin records.
- No low-quality SEO page batch.
- No fake traffic, fake search volume, fake AI citation rate, fake revenue, or
  fabricated customer stories.

## Acceptance Criteria

- Revenue Evidence operating document exists.
- Daily checklist covers visits, demo downloads, Template Setup CTA clicks,
  Template Setup lead submits, Team Launch CTA clicks, Assisted First 8D / SCAR
  CTA clicks, contact form submits, signup, first report created, export
  attempted, Knowledge search, editor reuse opened, and AI Quality Check intent.
- Weekly decision rules cover demo-download/no-lead, CTA-click/no-submit,
  lead/no-reply, signup/no-report, report/no-export, Knowledge-reuse/no-AI-check,
  and AI-check/no-export-share patterns.
- Lead follow-up playbook covers Template Setup, Team Launch, and Assisted First
  8D / SCAR Delivery.
- Early revenue targets are defined for Week 1, Month 1, and Month 3.
- What-not-to-do section forbids blind feature expansion, low-quality AI article
  batches, fake traffic, fabricated proof, guaranteed customer acceptance, and
  unlimited free consulting.
- Governance tests protect the document and docs-only scope.
- Required checks pass: `git diff --check`, `npx tsc --noEmit`,
  `npm run lint`, `npm run build`, and `npm run test:governance`.

## Risks

- Operating documents can become stale if weekly review is skipped.
- Early targets are directional, not forecasts; they should guide decisions
  without inventing revenue evidence.
- Follow-up templates remain manual for now; automation should wait until real
  lead patterns are clearer.
