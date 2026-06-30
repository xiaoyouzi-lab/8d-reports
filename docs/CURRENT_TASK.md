# Current Task

## Task Name

Revenue Lead Follow-Up Templates v1.

## Context

Revenue Evidence Sprint v1 can now capture Template Setup, Team Launch, Assisted
First 8D / SCAR, contact, demo, signup, and export intent. The next operational
need is consistent manual follow-up that asks for the right inputs, explains the
service scope, and avoids overpromising.

## Goal

Create docs-only follow-up templates for revenue leads so service inquiries can
be handled professionally and consistently without connecting to live email
sending or changing product behavior.

## Scope

- Add `docs/REVENUE_LEAD_FOLLOWUP_TEMPLATES.md`.
- Include templates for:
  - Template Setup lead - file received
  - Template Setup lead - file upload failed / ask reply with file
  - Template Setup lead - quote/scope proposal
  - Team Launch lead - discovery questions
  - Assisted First 8D lead - request required evidence
  - No-response follow-up 1
  - No-response follow-up 2
  - Paid service handoff / invoice note
  - After delivery feedback request
- Each template should be short, professional, and ask for a concrete next step.
- Document required inputs, deliverables, and manual tracking boundaries.
- Update `docs/DEV_LOG.md`.
- Add governance checks for template coverage, no-overpromise language, and
  sensitive tracking exclusions.

## Non-Goals

- No live email sending.
- No Resend changes.
- No CRM or automation integration.
- No payment, checkout, subscription, auth, password reset, export, Knowledge
  Base search, Knowledge permissions, AI backend, production configuration, or
  database schema changes.
- No production data writes.

## Acceptance Criteria

- Follow-up template doc exists.
- All 9 required templates are present.
- Templates ask for concrete next steps and required inputs.
- Templates explain deliverables without promising guaranteed customer
  acceptance, certified approval, instant turnaround, or unlimited free
  consulting.
- Manual tracking uses safe fields and forbids full messages, customer/supplier
  names, product names, batch numbers, root cause, corrective action, lessons
  learned, attachment content, credentials, and payment details.
- Required checks pass: `git diff --check`, `npx tsc --noEmit`, `npm run lint`,
  `npm run build`, and `npm run test:governance`.

## Risks

- Templates are useful only if manually adapted to the actual lead context.
- Quote/scope emails must remain human-reviewed before sending.
- Follow-up tracking must not become a place where private customer or quality
  report details are copied.
