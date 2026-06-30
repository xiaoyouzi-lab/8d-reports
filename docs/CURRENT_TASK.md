# Current Task

## Task Name

External 8D Request / Supplier Response Loop Spec.

## Context

8D Reports has report editing, Team workflow, share links, Activity Log, Knowledge Base, editor knowledge reuse, AI review, and authenticated smoke infrastructure. The next product direction is controlled external supplier collaboration, but runtime implementation would require new access boundaries, schema, token handling, email flow, and smoke coverage.

## Goal

Create a docs-only MVP specification for External 8D Request / Supplier Response Loop so a future PR can implement it safely without overloading existing report share links or exposing customer workspace data.

## Scope

- Audit existing share links, report access, Team roles, workflow status, Activity Log, Resend/email capability, and guest token risks.
- Add `docs/EXTERNAL_8D_REQUEST_WORKFLOW_SPEC.md`.
- Document actors, MVP flow, permission matrix, token security model, login vs guest decision, ownership, audit log, email notifications, data exposure rules, abuse/spam risks, future schema needs, smoke strategy, and implementation phases.
- Add governance checks proving the spec exists and covers the required safety topics.

## Non-Goals

- No runtime external request feature.
- No supplier portal accounts.
- No public supplier dashboard.
- No database schema changes.
- No auth, payment, checkout, pricing, export, Resend configuration, AI, Knowledge Base permission/eligibility, or production configuration changes.
- No production data writes.

## Acceptance Criteria

- Spec includes:
  - Product goal
  - Actors
  - MVP flow
  - Permission matrix
  - Token security model
  - Login vs guest decision
  - Ownership model
  - Audit log requirements
  - Email notifications
  - Data exposure rules
  - Abuse / spam risk
  - Non-goals
  - Required schema changes for future PR
  - Smoke strategy
  - Recommended implementation phases
- Governance checks cover the spec and required sections.
- No runtime code changes except governance tests.
- Required checks pass for a docs-only PR: `git diff --check`, `npx tsc --noEmit`, `npm run lint`, `npm run build`, and `npm run test:governance`.

## Risks

- Existing editable share links are report-level and too broad for supplier requests.
- Future runtime work needs schema changes and careful token design.
- Email invites could create spam/abuse risk without rate limits.
- Supplier guest access must remain narrower than authenticated Team access.
