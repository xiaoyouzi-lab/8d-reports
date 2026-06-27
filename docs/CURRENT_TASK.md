# Current Task

## Task Name

Quality Knowledge Base v1 for PR #8.

## Context

PR #7 has been merged into `main` as `f016e96ee442e7075f566f4167e6cab5dbb8c552`.

The product direction explicitly includes historical search and reuse of past reports. This PR turns completed 8D reports into a logged-in, permission-safe quality knowledge base.

## Product Principle

Every completed 8D report should become a reusable quality knowledge asset, not only a one-time customer document.

## Goal

Add a logged-in `/knowledge` page where users can search completed or locked 8D reports and reuse:

- Root cause
- Corrective action
- Lessons learned

## Scope

- Search completed reports and locked approval workflow records.
- Support safe status, report type, priority, and limit filters on the Knowledge API.
- Reuse existing Team workspace report-access scope.
- Provide copy actions for root cause, corrective action, and lessons learned.
- Add safe analytics for Knowledge Base search, copy, filters, result clicks, and no-results states.
- Document the Knowledge Base product/technical spec in `docs/QUALITY_KNOWLEDGE_BASE_SPEC.md`.
- Document Knowledge Base operating metrics in `docs/MARKETING_WORKFLOW.md`.
- Keep the implementation small and reviewable.

## Non-Goals

- No AI.
- No iOS.
- No External 8D Request.
- No public site redesign.
- No payment, checkout, subscription, or pricing changes.
- No database schema migration.
- No vector database.
- No attachment content parsing.
- No public share-token access to Knowledge Base content.

## Acceptance Criteria

- `/knowledge` is available after login.
- `/api/knowledge/search` is POST-only and accepts safe `query`, `status`, `reportType`, `priority`, and `limit` inputs.
- Knowledge search only returns reports the signed-in user can already access.
- `status = completed` is the primary Knowledge Base entry condition, including legacy completed reports whose workflow status is still `draft`, empty, or unset.
- `workflowStatus` values `approved`, `submitted`, and `closed` are higher-trust labels, but do not override `status = draft` or `status = in_progress`.
- Reports with `status = draft`, `status = in_progress`, or `workflowStatus = internal_review` are excluded.
- Results expose reusable report fields without exposing attachments or share tokens.
- Root cause, corrective action, and lessons learned can be copied.
- Analytics metadata avoids full report content and query text.
- Analytics event names are limited to `knowledge_search_used`, `knowledge_no_results`, `knowledge_result_opened`, `knowledge_filter_used`, `knowledge_root_cause_copied`, `knowledge_corrective_action_copied`, and `knowledge_lesson_copied`.
- `docs/QUALITY_KNOWLEDGE_BASE_SPEC.md` describes scope, data mapping, eligibility, permissions, plan boundary, analytics, AI dependency, non-MVP scope, and risks.
- `docs/MARKETING_WORKFLOW.md` includes Knowledge Base metrics for completed reports, searches, result opens, copied fields, and repeat users.
- Existing report creation, editing, sharing, workflow, and export behavior remains unchanged.
- Required checks pass: `git diff --check`, `npx tsc --noEmit`, `npm run lint`, and `npm run test:governance`.

## Risks

- Permission mistakes could expose team report content across workspaces.
- Treating unfinished reports as knowledge could amplify weak or unapproved corrective actions.
- JSONB scanning is acceptable for v1 but may need indexing or materialized fields later.
