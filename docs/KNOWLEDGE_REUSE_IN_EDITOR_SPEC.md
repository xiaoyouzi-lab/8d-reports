# Knowledge Reuse In Editor Spec

## Product Principle

Knowledge Base should not only be a standalone page. Every completed 8D report is a reusable quality knowledge asset, and that asset is most valuable when a quality engineer is actively filling a new or revised report.

Knowledge Reuse in Editor v1 brings historical quality knowledge into the D0-D8 editor without changing the report automatically. It helps users compare similar completed reports, then manually copy useful root cause, corrective action, and lessons learned text as reference.

## V1 Scope

- Add a `Reuse Knowledge` entry in the report editor top tool area.
- Add contextual hints near D4 Root Cause, D5 Corrective Action, D7 Prevention, and D8 Lessons Learned.
- Add an editor-side Knowledge Reuse panel.
- Search existing Knowledge Base assets through the existing Knowledge API.
- Show reusable result cards with problem summary, trust label, root cause, corrective action, lessons learned, and optional validation/prevention context.
- Support copy-only reuse for root cause, corrective action, and lessons learned.
- Open source reports in a new tab so the current editor context is preserved.
- Add safe analytics for panel open, search, result open, and copy actions.
- Extend authenticated smoke coverage for the editor reuse flow.

## Non-Goals

- No AI generation.
- No AI rewrite.
- No automatic field filling.
- No automatic report save.
- No Knowledge Base permission or eligibility changes.
- No share-token behavior changes.
- No payment, pricing, checkout, subscription, export, auth, Resend, public marketing, or production configuration changes.
- No database schema migration.
- No new tables.
- No vector or semantic search.
- No attachment parsing.
- No production test data.
- No External 8D Request, Supplier Response Loop, iOS, or PWA work.

## Data Source

The panel reuses:

- `POST /api/knowledge/search`
- `src/lib/report-knowledge.ts`

The editor does not introduce a new API. The existing Knowledge API already requires an authenticated user, uses `getAccessibleUserIds`, excludes inaccessible reports, excludes share-token-only access, and applies the current Knowledge Base eligibility rules.

## Permission And Eligibility Reuse

The editor panel inherits the same rules as `/knowledge`:

- Include `status = completed`.
- Include `workflowStatus in approved, submitted, closed` when the report is not draft or in-progress.
- Exclude `status = draft`.
- Exclude `status = in_progress`.
- Exclude `workflowStatus = internal_review`.
- Exclude outsider and cross-workspace reports.
- Do not use public share tokens.

This PR does not change `getAccessibleUserIds`, report ownership, Team member access, share links, or Knowledge Base eligibility.

## Editor Entry Points

Primary entry:

- Report editor top tool area: `Reuse Knowledge`.

Contextual hints:

- D4 Root Cause: `Search past root causes before finalizing this section.`
- D5 Corrective Action: `Reuse proven corrective actions from completed reports.`
- D7 Prevention: `Check prevention and system-change ideas from similar issues.`
- D8 Lessons Learned: `Check lessons learned from similar completed reports.`

`lessonsLearned` is a D8 field. D7 is prevention and system-change work.

## Copy-Only Interaction

The panel must remain read-only:

- It does not receive report field `onChange`.
- It does not call `handleFieldChange`.
- It does not call report save.
- It does not call report update APIs.
- It does not apply AI drafts.
- It only calls `navigator.clipboard.writeText`.

Copy success message:

```text
Copied
```

Copy failure message:

```text
Could not copy. Select and copy manually.
```

## Result Cards

Result cards should show:

- report title
- report number or fallback id
- trust label: Completed, Approved, Submitted, or Closed
- priority
- report type
- updated date
- problem summary
- root cause
- corrective action
- lessons learned
- validation and prevention when available
- Open report
- Copy root cause
- Copy corrective action
- Copy lessons learned

Open report uses a new tab with `target="_blank"` and `rel="noreferrer"` to protect the current editor context.

## Analytics

Allowed editor reuse events:

- `knowledge_reuse_panel_opened`
- `knowledge_reuse_search_used`
- `knowledge_reuse_result_opened`
- `knowledge_reuse_root_cause_copied`
- `knowledge_reuse_corrective_action_copied`
- `knowledge_reuse_lesson_copied`

Allowed metadata:

- `source: "editor"`
- `location: "editor_top" | "d4" | "d5" | "d7" | "d8"`
- `queryLength`
- `resultCount`
- `copiedField`
- `plan`

Metadata must not include:

- full query
- problem description
- root cause
- corrective action
- lessons learned
- customer
- supplier
- product
- batch
- attachment content
- report content

## Authenticated Smoke Coverage

Authenticated smoke must verify:

- login through the smoke user
- opening a seeded completed report in the editor
- editor top `Reuse Knowledge` entry is visible
- Knowledge Reuse panel opens
- search for `coating`
- completed, closed, and accessible Team member approved assets are visible
- draft, in-progress, internal-review, and outsider assets are excluded
- copy root cause succeeds
- copy corrective action succeeds
- copy lessons learned succeeds
- clipboard failure shows the manual-copy message
- Open report opens a new tab and preserves the current editor tab
- mobile/narrow viewport has no horizontal overflow
- analytics metadata does not include sensitive report content

## Future Path

AI Quality Check with Knowledge Context can later use this reuse surface as evidence that users value historical quality knowledge in the editor. That future work should remain conservative: AI may summarize or point to relevant historical context only after permission, analytics, and user behavior prove the copy-only workflow is safe and useful.

Future improvements may include indexed search, stronger filters, saved reuse references, or AI-assisted comparison, but those are not part of v1.
