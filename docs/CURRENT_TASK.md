# Current Task

## Task Name

Report Completion Knowledge Capture v1.

## Context

Quality Knowledge Base v1 turns completed and locked reports into reusable quality knowledge. Knowledge Reuse in Editor v1 makes historical root causes, corrective actions, and lessons learned available while editing.

The next product step is to help users understand whether the current report will become a strong future knowledge asset before they complete, approve, submit, or close it.

## Goal

Add a lightweight, non-blocking `Knowledge readiness` panel that highlights whether the report has captured root cause, corrective action, validation, prevention/system change, and lessons learned.

## Scope

- Add reusable readiness calculation for key knowledge fields.
- Add a `Knowledge readiness` panel in the report editor.
- Show the same readiness panel in the workflow dialog.
- Show a non-blocking warning when a user attempts to move to approved, submitted, or closed while readiness is weak.
- Add safe analytics for readiness views and warnings.
- Update authenticated smoke coverage for readiness visibility and analytics safety.
- Update governance tests and docs.

## Non-Goals

- No save logic changes.
- No workflow eligibility changes.
- No forced required fields.
- No Knowledge Base permission or eligibility changes.
- No AI changes.
- No export changes.
- No payment, checkout, pricing, subscription, auth, Resend, production configuration, or database schema changes.
- No production test data.
- No External 8D Request, Supplier Response Loop, iOS, or PWA work.

## Acceptance Criteria

- Report editor shows `Knowledge readiness`.
- The panel includes:
  - `Root cause captured?`
  - `Corrective action captured?`
  - `Validation captured?`
  - `Prevention/system change captured?`
  - `Lessons learned captured?`
- Status labels are `Ready`, `Needs detail`, and `Missing`.
- Workflow dialog shows the same readiness summary.
- Weak readiness warning uses:
  `This report can still be completed, but missing root cause, corrective action, validation, or lessons learned will make future knowledge reuse weaker.`
- Warning does not block the workflow request.
- Analytics use only `missingCount`, `hasRootCause`, `hasCorrectiveAction`, `hasValidation`, `hasPrevention`, `hasLessonsLearned`, and `plan`.
- Authenticated smoke verifies readiness panel visibility, warning analytics, and sensitive metadata safety.
- Required checks pass: `git diff --check`, `npx tsc --noEmit`, `npm run lint`, `npm run build`, and `npm run test:governance`.
- Authenticated smoke workflow is triggered for the PR branch and inspected for status, artifact summary, and Neon cleanup.

## Risks

- Readiness labels are guidance, not formal customer acceptance criteria.
- Existing server-side completion checks still apply; this PR does not relax or tighten them.
- The editor page already has several guidance panels, so the readiness panel must stay compact.
