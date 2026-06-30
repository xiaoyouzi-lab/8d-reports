# Product Operating Metrics

## Purpose

Product operating metrics keep 8D Reports focused on evidence instead of intuition. The goal is to understand whether users are moving from first visit to report creation, report completion, reusable knowledge, editor reuse, AI review, export/share, and paid Team or service value.

This document does not add runtime tracking. It defines the metrics, safe metadata, and interpretation rules for future weekly product reviews.

## Measurement Principles

- Prefer existing first-party product events and database state before adding new tracking.
- Do not record report content, customer names, supplier names, product names, batch numbers, root cause text, corrective action text, lessons learned, attachment content, AI prompts, or AI raw output in analytics metadata.
- Treat missing event coverage as Measurement risk, not proof that users did not perform the behavior.
- Use database-derived metrics for field completeness and knowledge asset creation when event-level tracking would risk leaking sensitive content.
- Segment by plan, route/source, and coarse device type only when useful and safe.

## Core Funnel

| Step | Event name / source | Source page or component | Why it matters | Safe metadata | Do not collect | Target interpretation |
| --- | --- | --- | --- | --- | --- | --- |
| Visitor -> Signup | `marketing_cta_clicked`, `seo_signup_click`, then `signup_success` | Public pages, marketing CTAs, signup form | Shows whether positioning and public CTAs create account intent. | `source`, `page`, `cta`, `destination`, `method`, `plan` when available | Search query, personal notes, email address, company name, raw UTM containing personal data | High CTA clicks with low signup means public promise or signup flow needs review. |
| Signup -> First report created | `report_created` | `/reports/new`, Dashboard `New Report` | Confirms a new user reaches the core product action. | `source`, `template`, `reportType`, `plan` | Report title, problem description, customer, supplier, product, batch | Signup without report creation points to onboarding or first-run clarity issues. |
| First report created -> D4/D5 filled | Derived from `report_saved` plus field completeness for D4/D5 | Report editor D4 Root Cause and D5 Corrective Action | Shows whether users get beyond shell reports into actual corrective-action thinking. | `stepId`, `filledFieldCount`, `hasRootCause`, `hasCorrectiveAction`, `plan` if implemented as future aggregate event | Root cause text, corrective action text, why-chain text, test evidence, customer/product/batch | Drop-off here means templates or guidance around root cause/corrective action may need improvement. |
| Report completed -> Knowledge asset created | Derived from `reports.status`, `workflowStatus`, and Knowledge Base eligibility | Report save/workflow routes and Knowledge Base helper | Measures whether the product is accumulating reusable quality assets, not just drafts. | `status`, `workflowStatus`, `reportType`, `priority`, `plan` | Full report data, report title if customer-specific, root cause/action/lessons text | Few eligible assets means Knowledge Base and AI context will not have enough local value yet. |
| Knowledge asset -> Knowledge search | `knowledge_search_used`, `knowledge_no_results`, `knowledge_filter_used` | `/knowledge` | Shows whether users expect historical reports to help solve new issues. | `queryLength`, `hasQuery`, `resultCount`, `statusFilter`, `reportTypeFilter`, `priorityFilter`, `plan`, `source` | Full query, customer, supplier, product, batch, report content | Search usage after completed reports indicates shift from one-time export to reusable workspace. |
| Knowledge search -> Copy root cause/action/lesson | `knowledge_root_cause_copied`, `knowledge_corrective_action_copied`, `knowledge_lesson_copied`, `knowledge_result_opened` | `/knowledge` result cards | Measures concrete reuse of historical quality knowledge. | `copiedField`, `resultCount`, `plan`, `source` | Copied text, root cause/action/lesson content, customer/product/supplier/batch | Copy and open rates show whether Knowledge Base results are useful enough to reuse. |
| Editor reuse opened -> Copy | `knowledge_reuse_panel_opened`, `knowledge_reuse_search_used`, `knowledge_reuse_root_cause_copied`, `knowledge_reuse_corrective_action_copied`, `knowledge_reuse_lesson_copied`, `knowledge_reuse_result_opened` | Report editor Knowledge Reuse panel | Shows whether Knowledge Base is useful inside active report writing, not only as a separate page. | `source: "editor"`, `location`, `queryLength`, `resultCount`, `copiedField`, `plan` | Current report data, full query, copied text, source report content | Panel opens without copy may mean search relevance, placement, or copy-only messaging needs improvement. |
| AI Quality Check run | `ai_report_review_clicked`; future context events: `ai_quality_check_knowledge_context_used`, `ai_quality_check_knowledge_context_empty` | Report editor AI Quality Check | Shows whether users want review assistance and whether historical knowledge can support review quality. | `source`, `taskType`, `hasContext`, `contextCount`, `plan` | Prompt, AI raw response, report content, knowledge context text, customer/product/batch | AI use after D4/D5 completion suggests review value; high empty-context rate means Knowledge Base depth is still thin. |
| Export / share | `export_clicked`, `export_succeeded`, `watermark_exported`, `word_export_gate_clicked`, `excel_export_gate_clicked`, `share_link_created` | Export menu, share dialog | Measures whether reports become customer-ready deliverables and collaboration records. | `format`, `withWatermark`, `permissionLevel`, `plan`, `source` | Exported document content, recipient email, share token, customer/supplier/product/batch | Export/share are delivery signals; gates without upgrade can reveal plan packaging friction. |
| Team upgrade / service request | `upgrade_clicked`, `pricing_plan_clicked`, `checkout_started`, `checkout_completed`, service request database rows | Pricing, upgrade prompts, checkout, service request forms | Shows whether workflow, knowledge reuse, and service setup create commercial intent. | `plan`, `billingInterval`, `source`, `requestType`, `hasUploadedFiles`, `fileCount` | Payment details, full email, template files, customer requirements text, uploaded file content | Team/service demand indicates whether paid value is in governance, historical reuse, or setup help. |

## Weekly Review Questions

1. Are visitors signing up, and which pages or CTAs create that intent?
2. Are new signups creating a first report within the same session or week?
3. Are users filling D4/D5, or are they abandoning before root-cause and corrective-action work?
4. Are reports becoming eligible knowledge assets?
5. Are users searching Knowledge Base after completing reports?
6. Are users copying root cause, corrective action, or lessons learned from historical reports?
7. Is editor reuse used while writing new reports?
8. Is AI Quality Check used after enough report data exists?
9. Are users exporting or sharing reports after completion?
10. Are upgrade and service signals tied to Team workflow, Knowledge Base, export, or setup needs?

## Safe Metadata Dictionary

Allowed broad fields:

- `source`
- `page`
- `cta`
- `destination`
- `method`
- `plan`
- `reportType`
- `priority`
- `stepId`
- `filledFieldCount`
- `hasRootCause`
- `hasCorrectiveAction`
- `hasValidation`
- `hasPrevention`
- `hasLessonsLearned`
- `status`
- `workflowStatus`
- `queryLength`
- `hasQuery`
- `resultCount`
- `statusFilter`
- `reportTypeFilter`
- `priorityFilter`
- `copiedField`
- `location`
- `taskType`
- `hasContext`
- `contextCount`
- `format`
- `withWatermark`
- `permissionLevel`
- `billingInterval`
- `requestType`
- `hasUploadedFiles`
- `fileCount`

Forbidden fields and values:

- full search query
- report title when it may contain customer issue details
- problem description
- root cause text
- corrective action text
- validation text
- prevention/system-change text
- lessons learned text
- customer name
- supplier name
- product name
- batch or lot number
- attachment content
- share token or external request token
- email address
- payment details
- AI prompt
- AI raw response
- knowledge context content

## Existing Coverage And Gaps

Existing event coverage is enough for signup, report creation, Knowledge Base search, Knowledge copy, editor reuse, export/share, and upgrade intent.

Known gaps:

- D4/D5 field completion should be computed from database state or a safe aggregate event, not raw field analytics.
- Knowledge asset creation should be a derived metric from report status/workflow and eligibility.
- AI Quality Check with Knowledge Context events are future-facing unless that PR is merged.
- Checkout completion currently exists in product analytics/webhook flow but needs a separate safe design before GA4 server-side reporting.
- Service request metrics can be derived from `custom_template_requests` rows without recording file contents or free-text requirements in analytics.

## Interpretation Rules

- Do not optimize pricing from `upgrade_clicked` alone; require checkout or service-request evidence.
- Do not optimize Knowledge Base based on searches alone; look at result opens and copy actions.
- Do not judge AI Quality Check value without report completion context and, later, context availability.
- Do not treat no-result searches as search failure until query length, filters, and eligible asset count are reviewed.
- Do not add invasive tracking to explain a funnel gap until existing events and database-derived metrics are reconciled.

## Future Work

- Add a read-only product metrics export once production access and privacy boundaries are explicit.
- Add weekly operating dashboard cards for the core funnel.
- Add safe aggregate events for report knowledge readiness only if database-derived metrics are insufficient.
- Reconcile GA4 normalized funnel events with product database events.
- Use these metrics to decide whether to prioritize External 8D Request runtime, AI Quality Check context improvements, or Team/service packaging.
