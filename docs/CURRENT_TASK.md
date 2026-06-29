# Current Task

## Task Name

Knowledge Reuse in Editor v1.

## Context

Quality Knowledge Base v1 made completed, approved, submitted, and closed reports searchable as quality knowledge assets. Authenticated app discoverability made Knowledge Base visible in the logged-in app. Authenticated smoke infrastructure now gives PRs a safe temporary Neon branch workflow for logged-in verification.

The next product step is to bring Knowledge Base into the report editor workflow, where users are filling D4 root cause, D5 corrective action, D7 prevention, and D8 lessons learned sections.

## Goal

Add a copy-only Knowledge Reuse panel to the report editor so authenticated users can search existing Knowledge Base assets while editing a report and manually copy root cause, corrective action, and lessons learned text as reference.

## Scope

- Add a `Reuse Knowledge` entry in the report editor top tool area.
- Add contextual hints for D4, D5, D7, and D8.
- Add `src/components/knowledge/KnowledgeReusePanel.tsx`.
- Reuse `POST /api/knowledge/search` and `src/lib/report-knowledge.ts`.
- Add safe editor reuse analytics events.
- Update authenticated smoke coverage for the editor reuse flow.
- Update governance tests and docs.

## Non-Goals

- No automatic report field writes.
- No report save from Knowledge Reuse.
- No AI generation or rewrite.
- No Knowledge Base eligibility, permission, or share-token changes.
- No public marketing changes.
- No payment, pricing, checkout, subscription, export, auth, Resend, production configuration, or database schema changes.
- No vector database, semantic search, attachment parsing, new tables, production test data, External 8D Request, Supplier Response Loop, iOS, or PWA work.

## Acceptance Criteria

- Report editor top tool area shows `Reuse Knowledge`.
- D4 hint says: `Search past root causes before finalizing this section.`
- D5 hint says: `Reuse proven corrective actions from completed reports.`
- D7 hint says: `Check prevention and system-change ideas from similar issues.`
- D8 hint says: `Check lessons learned from similar completed reports.`
- The panel searches through `POST /api/knowledge/search`.
- No new Knowledge API is added.
- The panel does not call `handleFieldChange`, save reports, or update report fields.
- Copy root cause, corrective action, and lessons learned succeeds with `Copied`.
- Copy failure shows `Could not copy. Select and copy manually.`
- Open report opens in a new tab and preserves the current editor tab.
- Reuse analytics use only safe metadata and do not include raw query or report content.
- Authenticated smoke verifies the editor reuse flow.
- Required checks pass: `git diff --check`, `npx tsc --noEmit`, `npm run lint`, `npm run build`, and `npm run test:governance`.
- Authenticated smoke workflow is triggered for the PR branch and inspected for status, artifact summary, and Neon cleanup.

## Risks

- The report editor toolbar is already crowded, so mobile layout must stay compact.
- Search remains v1 keyword/JSONB-backed application search through the existing Knowledge API.
- Future AI context should wait until the copy-only reuse behavior is validated.
