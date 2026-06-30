# Current Task

## Task Name

AI Quality Check Knowledge Context v1.

## Context

Quality Knowledge Base v1 made completed, approved, submitted, and closed reports searchable as quality knowledge assets. Knowledge Reuse in Editor v1 made those assets manually reusable while editing a report. Authenticated smoke infrastructure now gives PRs a safe temporary Neon branch workflow for logged-in verification.

The next product step is to let AI Quality Check use a small, permission-safe set of historical completed reports as reference context when reviewing the current report.

## Goal

Add reference-only Knowledge Context to AI Quality Check so the AI can identify missing checks, weak evidence, repeated failure patterns, and prevention opportunities using up to three similar completed reports.

## Scope

- Add a server helper that builds compact Knowledge Context from existing accessible Knowledge Base reports.
- Reuse `src/lib/report-knowledge.ts` eligibility/search mapping and `getAccessibleUserIds` permission scope.
- Inject Knowledge Context into the AI Quality Check prompt as reference-only context.
- Add a `Knowledge-based observations` output section.
- Show whether Knowledge Context was used or empty in the AI Quality Check UI.
- Add safe AI Knowledge Context analytics events.
- Update authenticated smoke coverage for the AI unavailable/no-real-key path.
- Update governance tests and docs.

## Non-Goals

- No automatic report field writes.
- No report save from AI Quality Check.
- No AI approval, certification, or customer-acceptance claim.
- No Knowledge Base eligibility, permission, search API, or share-token changes.
- No public marketing changes.
- No payment, pricing, checkout, subscription, export, auth, Resend, production configuration, or database schema changes.
- No vector database, semantic search, attachment parsing, new tables, production test data, External 8D Request, Supplier Response Loop, iOS, or PWA work.

## Acceptance Criteria

- AI Quality Check builds Knowledge Context with at most three accessible eligible reports.
- The current report is excluded from its own Knowledge Context.
- Prompt includes exact reference-only safety instructions.
- AI output schema includes `Knowledge-based observations`.
- UI shows `Knowledge context used: N similar reports` or `No reusable knowledge context found yet.`
- AI unavailable / missing key path remains safe and does not leak prompt or Knowledge Context content.
- Analytics use only `source`, `contextCount`, `hasContext`, and `plan`.
- Authenticated smoke verifies the no-real-AI-key context/fallback path.
- Required checks pass: `git diff --check`, `npx tsc --noEmit`, `npm run lint`, `npm run build`, and `npm run test:governance`.
- Authenticated smoke workflow is triggered for the PR branch and inspected for status, artifact summary, and Neon cleanup.

## Risks

- Context matching remains v1 keyword/application-level search and may need ranking improvements later.
- AI Quality Check remains advisory only; historical context can surface patterns but cannot prove current-report correctness.
- Authenticated smoke should not require a real AI vendor key.
