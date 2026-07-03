# P0+ Product Direction

Date: 2026-07-03

## Current Only Mainline

The current product mainline is P0+:

Homepage guest natural-language intake -> AI quality expert draft -> AI readiness check -> next-step guidance -> login-gated edit/save/export.

This is the only direction to optimize next. The goal is to remove the blank-page start for quality engineers while preserving the existing authenticated 8D editor, save, permission, and export system.

## P0+ Product Principle

The homepage may let an anonymous visitor paste or type the raw situation in natural language, such as a customer complaint, inspection note, containment update, 5-Why notes, or photo description text.

The anonymous visitor may receive a preview only:

- AI-generated draft fields.
- Conservative readiness feedback.
- Missing evidence / missing information.
- Assumptions and quality warnings.
- Suggested next steps.

Editing, saving, sharing, exporting, and durable report storage require login.

## AI Role

AI must act as a senior quality expert, not a generic writing assistant.

AI should behave like a conservative senior quality engineer preparing or reviewing a customer-facing 8D report:

- Identify weak problem definition, vague containment, unsupported root cause, poor corrective-action linkage, missing validation, weak prevention, and customer rejection risk.
- Draft practical editable wording from the user's supplied materials.
- Mark assumptions clearly.
- Use "No relevant data" or equivalent wording when evidence is missing.
- Give next-step guidance that helps the user collect missing evidence or continue in the authenticated editor.

AI must not:

- Approve, certify, submit, or guarantee customer acceptance.
- Invent evidence, measurements, dates, names, test results, standards compliance, approvals, or historical facts.
- Treat draft text as verified facts.
- Replace engineering review, customer review, or human approval.

## Auth Boundary

Allowed before login:

- Homepage natural-language intake.
- AI draft preview.
- AI readiness preview.
- Next-step guidance.

Required after login:

- Creating a persisted report.
- Editing D0-D8 fields in the authenticated editor.
- Saving report data.
- Uploading attachments or signatures.
- Sharing reports.
- Exporting PDF, Word, Excel, or ZIP.
- Accessing dashboard, knowledge base, report history, team workspace, private historical knowledge, or report-specific activity.

The existing `/dashboard` and `/reports` protection should remain the hard boundary for durable work.

## Explicit Non-Directions

Do not build these directions for the current P0+ push:

- Human review service.
- Full QMS.
- Complaint intake system beyond a lightweight homepage text intake for 8D draft preview.
- P1 deep file recognition.
- Image or video recognition.
- Customer-specific export template customization.
- Expanded SEO content batches.
- Broad public marketing redesign.
- Payment, checkout, subscription, or entitlement changes.
- Database schema changes.
- Auth provider changes.
- Export template changes.
- Share-link permission model changes.
- Team workflow expansion.

## Product Guardrails

- Keep P0+ narrow: guest preview first, authenticated continuation second.
- Preserve existing SEO pages and product routes unless a later task explicitly changes them.
- Preserve the current export system and templates.
- Preserve current auth, payment, database, share, workflow, and permission boundaries.
- Keep AI quality checks conservative. Missing evidence is a finding, not a gap for AI to fill.
- Avoid claims that AI produces a customer-approved or submission-ready report automatically.
- Do not query private historical reports or team knowledge during anonymous preview.

## Recommended Near-Term Next Task

Write a P0+ implementation spec that defines:

- Guest intake UX and payload limits.
- Preview API contract.
- AI prompt and response schema for anonymous draft/readiness.
- Anonymous abuse/rate-limit behavior.
- Login/signup handoff route and temporary preview state handling.
- Exact rules for creating the authenticated report after handoff.
- Tests required to prove no private data, export, payment, auth, or schema behavior changed.
