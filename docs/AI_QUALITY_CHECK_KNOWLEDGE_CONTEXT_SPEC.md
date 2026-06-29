# AI Quality Check Knowledge Context Spec

## 1. Product Principle

Every completed 8D report is not a one-time document. It is a future quality knowledge asset for similar problems.

AI Quality Check Knowledge Context v1 lets AI review the current report with a small set of permission-safe historical completed reports. The context is reference-only. It should help find missing checks, weak evidence, repeated failure patterns, and prevention opportunities.

## 2. V1 Scope

V1 adds Knowledge Context only to AI Quality Check:

- Build up to 3 similar historical Knowledge Base reports.
- Exclude the current report.
- Reuse existing Knowledge Base eligibility and Team workspace permission scope.
- Inject compact historical fields into the AI Quality Check input.
- Ask the AI to return `Knowledge-based observations`.
- Show whether context was used or empty in the AI Quality Check UI.
- Track safe context-used / context-empty analytics.
- Keep the missing-key / unavailable AI path safe and non-crashing.

## 3. Non-Goals

V1 does not add:

- AI approval, certification, or automatic customer acceptance.
- AI field writes or automatic report edits.
- New Knowledge Base API endpoints.
- Knowledge Base eligibility, permission, or share-token changes.
- Database schema changes or migrations.
- Vector database or semantic index.
- Attachment parsing.
- External supplier requests.
- Public marketing changes.
- Payment, checkout, subscription, export, auth, Resend, or production configuration changes.

## 4. Data Source And Permissions

The helper `buildKnowledgeContextForQualityCheck(report, user)` reads only reports that are already accessible to the signed-in user through `getAccessibleUserIds`.

It then reuses `src/lib/report-knowledge.ts` for:

- eligibility checks
- trust labels
- report.data field mapping
- keyword search behavior

The helper must not use public share tokens, report shares, or cross-workspace data. It must not bypass `getAccessibleUserIds`.

## 5. Query Seeds

The server extracts query seeds from the current saved report:

- report title
- `problemDescription`
- `productName`
- `customerName`
- `confirmedRootCause`
- `selectedCorrectiveAction`

These seeds are server-only. They are not sent to analytics, not shown in smoke artifacts, and not returned to the browser.

## 6. Context Shape

Each context item is compact and bounded:

- `title`
- `trustLabel`
- `problemSummary`
- `rootCause`
- `correctiveAction`
- `lessonsLearned`
- optional `validation`
- optional `prevention`

Customer name, product name, supplier name, batch number, full prompts, raw queries, attachments, and share tokens are not included in the client-visible context summary. The browser receives only `contextCount` and `hasContext`.

## 7. Prompt Safety

The AI Quality Check prompt must include:

```text
The following historical completed reports are provided only as reference context.
Do not treat them as proof that the current report is correct.
Do not copy them blindly.
Use them to identify missing checks, weak evidence, repeated failure patterns, and prevention opportunities.
```

The AI must not:

- approve the report
- certify the report
- claim customer acceptance
- claim facts were verified
- write report fields
- fabricate historical content
- copy historical content blindly

## 8. UI Behavior

When Knowledge Context exists, the AI Quality Check dialog shows:

```text
Knowledge context used: 3 similar reports
```

The count is dynamic, with a maximum of 3.

When no context is available, the dialog shows:

```text
No reusable knowledge context found yet.
```

If AI is unavailable or no provider key is configured, the UI keeps the existing safe unavailable message, does not crash, and does not expose prompts or historical report content.

## 9. Analytics Events

Allowed events:

- `ai_quality_check_knowledge_context_used`
- `ai_quality_check_knowledge_context_empty`

Allowed metadata only:

- `source: "ai_quality_check"`
- `contextCount`
- `hasContext`
- `plan`

Forbidden analytics metadata:

- full query
- problem description
- root cause
- corrective action
- lessons learned
- customer name
- supplier name
- product name
- batch number
- prompt
- raw AI output
- historical report content

## 10. Verification

Authenticated smoke should not require a real AI provider key. The workflow can mark the smoke owner as an AI beta user, trigger AI Quality Check, and verify that the missing-key fallback still shows a safe context status and safe analytics metadata.

Governance should protect:

- helper existence
- reuse of `getAccessibleUserIds`
- reuse of `searchKnowledgeEntries`
- context limit of 3
- current report exclusion
- reference-only prompt text
- no AI approval behavior
- UI count and empty states
- analytics allowlist and metadata safety
- no database schema, payment, export, auth, or public marketing changes

## 11. Risks And Follow-Ups

V1 uses keyword/application-level matching. Large workspaces may later need ranking improvements, indexes, or a dedicated knowledge retrieval layer.

Future improvements may include cited historical report links, stronger similarity scoring, or AI-assisted comparison, but only after the reference-only behavior proves safe.
