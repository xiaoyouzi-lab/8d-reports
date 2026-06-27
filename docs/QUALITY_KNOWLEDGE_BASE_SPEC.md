# Quality Knowledge Base Spec

## 1. Why Knowledge Base Is Core Commercial Value

Every completed 8D report is more than a one-time customer document. It is a future quality knowledge asset that helps teams respond faster when a similar complaint, supplier issue, process escape, or corrective action pattern appears again.

The Knowledge Base turns the product from an export-only utility into a durable quality workspace:

- Users can reuse proven root cause language, corrective actions, and lessons learned instead of rebuilding them from memory or old spreadsheets.
- Teams can preserve institutional knowledge even when people change roles.
- Pro and Team value becomes easier to prove because the benefit grows with every completed report.
- Future AI Quality Check can ground feedback in the user's own completed quality history instead of generic advice.

## 2. Knowledge Base v1 Scope

V1 adds a logged-in `/knowledge` page and a dedicated POST-only search API for completed quality knowledge assets.

Included:

- Search eligible completed or locked 8D reports.
- Show reusable root cause, corrective action, and lessons learned content.
- Let users copy root cause, corrective action, and lessons learned text.
- Reuse existing report-access and Team workspace scope.
- Track safe Knowledge Base analytics events.
- Avoid database schema changes by searching recent eligible `reports.data` JSONB rows in application code.

Not included in v1:

- AI.
- Vector database.
- Attachment parsing.
- External supplier request.
- Public site redesign.
- Database schema migration.

## 3. Data Sources

Primary source:

- `reports` table.

Fields used:

- `reports.id`
- `reports.title`
- `reports.userId`
- `reports.status`
- `reports.workflowStatus`
- `reports.revision`
- `reports.lockedAt`
- `reports.reportType`
- `reports.priority`
- `reports.source`
- `reports.data`
- `reports.createdAt`
- `reports.updatedAt`

Access source:

- Existing `getAccessibleUserIds(user.id)` helper.

Explicitly excluded:

- `attachments`
- attachment file contents
- `report_shares`
- `reportShares.accessToken`
- public share-token pages
- AI-generated review or draft outputs

## 4. `report.data` Field Mapping

Knowledge Base v1 extracts only whitelisted report fields.

| Knowledge field | `report.data` source fields | Purpose |
| --- | --- | --- |
| Report number | `reportNumber` | Human-readable report identifier. |
| Problem | `problemDescription` | Search and context for similar issues. |
| Product | `productName` | Search and context. |
| Customer | `customerName` | Search and context. |
| Root cause | `confirmedRootCause`, `rootCauseOccurrence`, `rootCauseEscape`, `rootCauseSystem`, `why1`, `why2`, `why3`, `why4`, `why5` | Reusable D4 root cause knowledge. |
| Corrective action | `selectedCorrectiveAction`, `correctiveRationale`, `implementationPlan` | Reusable D5/D6 action knowledge. |
| Lessons learned | `lessonsLearned` | Reusable D8 learning. |
| Prevention | `systemChanges`, `processUpdates`, `horizontalDeployment`, `trainingNeeds` | Searchable D7 prevention context. |
| Validation | `testingResults`, `validationMethod`, `validationResults` | Searchable D4/D6 verification context. |

The UI emphasizes problem summary, root cause, corrective action, lessons learned, validation, and prevention so users can judge whether a historical report is reusable.

## 5. Eligibility Rules

A report can enter Knowledge Base v1 when `reports.workflowStatus` is not `internal_review`, `reports.status` is not `draft` or `in_progress`, and either condition is true:

- `reports.status = "completed"`
- `reports.workflowStatus` is one of `approved`, `submitted`, or `closed`

`reports.status = "completed"` is the primary entry condition. Legacy completed reports may still have `workflowStatus = "draft"`, an empty workflow value, or an unset workflow value; v1 treats them as eligible knowledge assets and displays the trust label as `Completed`.

Excluded:

- Draft reports, even if `workflowStatus` is `approved`, `submitted`, or `closed`.
- In-progress reports, even if `workflowStatus` is `approved`, `submitted`, or `closed`.
- Internal review reports.
- Any public-share-only access path.

Rationale:

- Completed reports represent finished quality work.
- Approved, submitted, and closed workflow states are higher-trust labels for completed reports.
- Legacy completed reports should not disappear from Knowledge Base just because they predate workflow adoption.
- Draft and internal review content may contain weak, unverified, or unfinished root cause and action statements.

## 6. Permission Matrix

Knowledge Base v1 reuses the same workspace access scope as report search and report opening.

| User relationship | Can search own completed reports | Can search Team reports | Can open result | Can copy reusable fields |
| --- | --- | --- | --- | --- |
| Individual report owner | Yes | Not applicable | Yes | Yes |
| Active Team owner | Yes | Yes, for active Team members' accessible reports | Yes | Yes |
| Active Team editor/member | Yes | Yes, for active Team scope | Yes | Yes |
| Active Team viewer | Yes | Yes, for active Team scope | Yes | Yes |
| Expired or inactive Team relationship | Own reports only | No | Own reports only | Own reports only |
| Unauthenticated visitor | No | No | No | No |
| Public share-token viewer | No | No | No | No |

The Knowledge Base API must require a signed-in user, and the search endpoint must be POST-only. It must never use public share tokens to discover or return knowledge assets.

## 7. Search Scope

V1 search is plain text matching over recent eligible report rows selected from the database.

Searchable fields:

- report title
- report number
- problem description
- product
- customer
- root cause fields
- corrective action fields
- lessons learned
- prevention fields
- validation fields

Search behavior:

- Query text shorter than two characters returns recent eligible assets without match filtering.
- Query text of two or more characters filters against the whitelisted fields.
- `status` accepts only `all`, `completed`, `approved`, `submitted`, or `closed`.
- `reportType` accepts only `all`, `customer_8d`, or `internal_8d`.
- `priority` accepts only `all`, `critical`, `high`, `medium`, or `low`.
- `limit` is clamped between 1 and the v1 maximum result limit.
- Results are ordered by recent report update before application-side filtering.
- Results are capped to keep the v1 implementation predictable.

Security boundary:

- Search never includes attachments, file contents, share tokens, billing data, account data, or raw analytics metadata.

## 8. Plan Boundary

Knowledge Base v1 is available to logged-in users who can access eligible reports through the existing report access model.

This PR does not change:

- pricing
- subscription plans
- checkout
- payment entitlements
- export gates
- report quotas

Product note:

- Free users can reuse their own completed reports.
- Pro and Team commercial value should be measured through repeat use, result opens, and copied reusable knowledge.
- A future PR may decide whether advanced filters, saved knowledge, AI checks, or indexed search become Pro/Team-only. That decision should be based on usage data, not added in v1.

## 9. Analytics Events

Knowledge Base v1 uses only these events:

- `knowledge_search_used`
- `knowledge_no_results`
- `knowledge_result_opened`
- `knowledge_filter_used`
- `knowledge_root_cause_copied`
- `knowledge_corrective_action_copied`
- `knowledge_lesson_copied`

Safe metadata principles:

- Do record query length, result count, selected filter, plan, path, and report id when relevant.
- Do not record raw query text.
- Do not record root cause, corrective action, lessons learned, problem description, customer content, product content, attachment names, or file contents.

Metric intent:

- Search and no-result events show whether users expect historical knowledge to exist.
- Result opens show whether search results are useful enough to inspect.
- Field-level copy events show whether root cause, corrective action, or lessons learned are being reused.
- Repeat users show whether the product is becoming a durable quality system rather than a one-time export tool.

## 10. Future AI Quality Check Dependency

V1 does not add AI.

However, future AI Quality Check can depend on Knowledge Base in these ways:

- Retrieve similar completed reports that the user already has permission to access.
- Compare a draft root cause against past approved root cause patterns.
- Suggest gaps when a corrective action lacks validation or prevention evidence seen in prior successful reports.
- Prefer organization-specific language and standards over generic 8D advice.
- Use completed-report outcomes as grounding context while still respecting permission boundaries.

Future AI work must keep these constraints:

- No AI access to reports outside the user's existing access scope.
- No attachment parsing unless a separate PR explicitly designs and reviews it.
- No vector database unless a separate architecture and privacy review approves it.
- Conservative output: when evidence is missing, say "No relevant data" rather than inventing findings.

## 11. Non-MVP Scope

Not part of Knowledge Base v1:

- AI generation or AI review.
- Vector search or embeddings.
- Database schema migration.
- Attachment OCR, attachment text extraction, or attachment semantic search.
- External supplier request workflows.
- Public marketing redesign.
- Public Knowledge Base pages.
- Saved searches.
- Knowledge collections.
- Report-to-report citation graph.
- Automated duplicate issue detection.
- Cross-company benchmarking.
- New billing or entitlement gates.

## 12. Risks and Future Expansion

Risks:

- Permission mistakes could expose Team report content across workspace boundaries.
- Weak eligibility rules could surface unfinished or unapproved corrective actions.
- JSONB application-side search is simple but may become slow for large workspaces.
- Copy actions could encourage blind reuse if users do not adapt the language to the current issue.
- Analytics must remain privacy-safe and avoid storing report content.

Future expansion candidates:

- Indexed search fields or a dedicated knowledge table if usage and row counts justify it.
- More filters, such as customer, product, priority, report type, date range, and workflow state.
- Saved snippets or controlled reuse into a new report.
- Knowledge citations that link reused language back to the source report.
- AI Quality Check grounded in permission-safe similar-report retrieval.
- Team-level reporting for knowledge reuse and repeated problem patterns.
