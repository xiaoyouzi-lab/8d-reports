# Report Completion Knowledge Capture Spec

## Product Goal

Completed 8D reports become valuable only when they capture reusable quality knowledge. Root cause, corrective action, validation, prevention, and lessons learned are the fields that make future Knowledge Base search, editor reuse, and AI review more useful.

Report Completion Knowledge Capture v1 helps users see that quality before they complete, approve, submit, or close a report. It is guidance only. It does not block saving, does not change workflow eligibility, and does not change database schema.

## Audit Summary

- Workflow status UI lives in `ReportWorkflowPanel`.
- Approved, submitted, and closed workflow statuses lock reports through existing workflow logic.
- Report completion already has server-side completeness checks through `getReportCompletionIssues`.
- Knowledge Base eligibility already includes completed reports and approved/submitted/closed workflow reports while excluding draft, in-progress, and internal-review reports.
- Knowledge Base value depends most on D4 root cause, D5 corrective action, D6 validation, D7 prevention/system change, and D8 lessons learned.
- Existing Activity Log records workflow changes and field updates; v1 does not add Activity Log actions.
- Existing AI Quality Check copy is conservative and non-approving; v1 does not change AI.
- Empty states exist for activity log and Knowledge Base; v1 adds an in-editor readiness state instead of changing those surfaces.

## V1 Scope

- Add a lightweight `Knowledge readiness` panel in the report editor.
- Reuse the same readiness panel inside the workflow dialog.
- Show five checks:
  - `Root cause captured?`
  - `Corrective action captured?`
  - `Validation captured?`
  - `Prevention/system change captured?`
  - `Lessons learned captured?`
- Use status labels:
  - `Ready`
  - `Needs detail`
  - `Missing`
- Show a non-blocking warning when a user attempts to move a report to approved, submitted, or closed while readiness is weak.
- Track safe readiness analytics.

## Non-Goals

- No forced field requirements.
- No save logic changes.
- No workflow eligibility changes.
- No Knowledge Base permission or eligibility changes.
- No AI changes.
- No export changes.
- No payment, checkout, pricing, subscription, auth, Resend, or production configuration changes.
- No database schema changes.
- No production data writes.

## Readiness Rules

Root cause is ready when the report has more than a single root-cause signal, such as confirmed root cause plus occurrence, escape, system, why-chain, or test evidence.

Corrective action is ready when a selected corrective action is supported by implementation/rationale detail.

Validation is ready when method/results/test evidence are present.

Prevention is ready when any prevention/system-change field is captured.

Lessons learned is ready when lessons learned has content.

These are product guidance rules, not formal completion gates.

## Warning Copy

When readiness is weak and the user attempts to move to approved, submitted, or closed, show:

```text
This report can still be completed, but missing root cause, corrective action, validation, or lessons learned will make future knowledge reuse weaker.
```

The warning must not stop the workflow request. Existing server-side workflow rules still apply.

## Analytics

Allowed events:

- `knowledge_readiness_viewed`
- `knowledge_readiness_warning_shown`

Allowed metadata only:

- `missingCount`
- `hasRootCause`
- `hasCorrectiveAction`
- `hasValidation`
- `hasPrevention`
- `hasLessonsLearned`
- `plan`

Forbidden metadata:

- root cause text
- corrective action text
- validation text
- prevention text
- lessons learned text
- customer name
- product name
- supplier name
- batch number
- query
- prompt
- raw AI output

## Smoke Strategy

Authenticated smoke should verify:

- the editor readiness panel is visible
- missing or weak readiness summary is visible on a seeded draft report
- the workflow dialog includes the readiness panel
- the warning event can fire without blocking the UI path
- analytics metadata does not include sensitive report content
- existing Knowledge Base and editor reuse smoke behavior remains unchanged

## Future Work

Future PRs may add richer readiness scoring, report-specific recommendations, AI-assisted checks, or citations back to reusable knowledge. Those should remain separate PRs and preserve the non-blocking behavior unless a later product decision explicitly approves stricter workflow gates.
