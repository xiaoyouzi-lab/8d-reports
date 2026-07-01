# End-of-run Product Review Backlog

## Review Scope

This review audits the current product surface after the Revenue Evidence Sprint v1 baseline. It is not a feature spec and does not change runtime behavior.

Reviewed surfaces:

- Homepage
- Pricing
- Custom Template Setup
- Demo Reports
- Contact
- Signup
- Dashboard
- Report Editor
- Knowledge Base
- Revenue Admin Metrics

## Summary

No P0 blockers were found. The product now has a credible path from public discovery to service intent, signup, first report creation, export, Knowledge Base reuse, and revenue evidence measurement.

The main gaps are P1/P2 issues around conversion clarity, first-run guidance, reuse friction, and operator diagnostics. These should be handled as small follow-up PRs instead of broad refactors.

## Backlog

| ID | Surface | Severity | Evidence | User Impact | Suggested PR | Not-to-do | Expected metric impact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| REV-P1-01 | Homepage | P1 | The hero leads with `Start free with 3 reports`, `Upload your 8D template`, and sample report review. Assisted First 8D / SCAR Delivery is explained lower on the page, but not a direct first-viewport decision. | Urgent buyers who need help delivering a customer-ready 8D this week may choose the free app path instead of the higher-intent service path. | Add a compact service chooser or secondary CTA near the hero for Template Setup, Team Launch, and Assisted First 8D / SCAR Delivery. | Do not change public route intent, pricing amounts, checkout, or make fake urgency claims. | Increase `pricing_service_cta_clicked`, `template_setup_form_started`, and assisted-service lead starts. |
| REV-P1-02 | Pricing | P1 | Professional service cards exist with `8D Template Setup`, `Team Launch`, and `Assisted First 8D / SCAR Delivery`, but Team Launch uses the CTA `Upload template`. | Team Launch intent can look like a template-only task instead of workspace configuration, roles, first report, and training. | Rename service CTAs and event labels so each service has an unambiguous action: request setup, request Team Launch, request assisted 8D. | Do not change prices, payment, subscription schema, or checkout behavior. | Improve service-card click-to-form-start rate and reduce wrong-form submissions. |
| REV-P1-03 | Custom Template Setup | P1 | `service=team_launch` and `service=assisted_8d` preselect the request type, but the page headline and success copy still lean heavily toward generic template setup except for assisted 8D. | Team Launch prospects may not see enough role/workspace/training specificity before submitting. | Add service-specific hero, proof, success copy, and required-input checklist for Team Launch and Assisted First 8D while reusing the same route and form. | Do not add CRM, payment collection, production data writes, or database schema changes. | Increase `template_setup_form_submitted` quality and reduce follow-up clarification emails. |
| REV-P2-04 | Demo Reports | P2 | Demo reports expose PDF, Word, Excel, and ZIP downloads and a company-format CTA, but download completion does not present a contextual next step. | Users may download proof assets and leave without creating a report or requesting template setup. | Add a lightweight post-download prompt or inline next-step block tied to the selected demo type. | Do not gate demo downloads behind signup or collect customer report content. | Improve demo download to service CTA and signup conversion. |
| REV-P2-05 | Contact | P2 | Contact uses a generic feedback-backed form with topics for Template Setup, Team Launch, Assisted 8D, product questions, and support. | Service leads submitted through Contact may bypass the richer required fields and files collected by the service request form. | Route service topics toward the Template Setup request form or show a short "what to include" checklist before submit. | Do not build a CRM, expose private email routing rules, or change auth/support infrastructure. | Increase qualified service request rate and reduce incomplete contact submissions. |
| REV-P1-06 | Signup | P1 | Signup verifies email and redirects to the callback URL. It does not capture the user's first intent after account creation. | New users may land in the app without a clear choice between creating a report, reviewing a sample, uploading a template, or requesting assisted delivery. | Add a post-signup intent step or dashboard first-run module that routes to first report, sample report, Knowledge Base education, or service request. | Do not change Better Auth, password reset, social auth, Resend configuration, or email verification mechanics. | Improve signup-to-first-report, signup-to-template-request, and first-session activation. |
| REV-P1-07 | Dashboard | P1 | Dashboard now shows create -> complete -> reuse, Knowledge Base entry, and report metrics. It does not yet distinguish "first report activation" from general report management for new teams. | First-time teams may understand the app concept but still not know the shortest path to a customer-ready report. | Add a first-run activation checklist that focuses on one report: create, fill D0-D8, add evidence, close, export, then reuse. | Do not change report editor core flow, quotas, payment, or Knowledge Base eligibility. | Increase first report created, D4/D5 completion, completed reports, and export attempts. |
| REV-P1-08 | Report Editor | P1 | The editor includes Reuse Knowledge, AI tools, workflow, Knowledge Readiness, share, export, and save actions in the top area. | High-value controls exist, but the top toolbar can feel dense and users may miss the next best action for the current report state. | Add state-based next-action guidance in the editor header or side panel, based on missing D-step data and workflow status. | Do not alter save semantics, locking rules, export entitlement, AI backend, or report schema. | Improve D-step completion, knowledge readiness, workflow close rate, and export attempts. |
| REV-P2-09 | Report Editor | P2 | Knowledge Reuse lets users search and copy root cause, corrective action, and lessons learned from historical reports. It does not apply snippets directly into D4/D5/D8 fields. | Reuse still requires manual copy/paste, which is safe but slower during report writing. | Add optional "insert into empty field" actions for allowed fields, with explicit user confirmation and normal save flow. | Do not auto-fill sensitive content, bypass permissions, or use AI/vector search. | Increase `knowledge_reuse_*_copied` to actual field completion conversion. |
| REV-P1-10 | Knowledge Base | P1 | Knowledge Base has empty/no-result states, filters, open report, and copy actions. It does not yet recommend searches from recent report context or common quality terms. | Users may not discover valuable prior reports unless they know which terms to search. | Add safe suggested queries from non-sensitive enums or local UI context, such as report type, priority, or generic quality terms. | Do not store full queries, customer/product names, root cause text, or introduce vector search. | Increase knowledge searches, result open rate, and copy actions. |
| REV-P2-11 | Knowledge Base | P2 | Search is application-level JSONB-backed v1 and intentionally safe. Large workspaces may eventually need performance and ranking improvements. | Team users with many completed reports may see weaker relevance or slower searches over time. | After usage evidence, add indexes or a dedicated knowledge table if real volume requires it. | Do not add a vector database, attachment parsing, or schema migration before evidence shows the need. | Protect search success rate and result open rate as knowledge assets grow. |
| REV-P1-12 | Revenue Admin Metrics | P1 | Admin metrics show 7/30-day counts for page views, demo downloads, service submissions, contact submissions, signup count, export attempts, and pricing CTA clicks. | Operators can see activity, but not conversion ratios, source breakdown, or service lead status movement. | Add derived funnel ratios and service status summary: CTA -> form start -> submit, demo download -> service CTA, signup -> first report -> export. | Do not add new analytics payloads with report content, customer/product names, payment details, or full URLs. | Improve weekly decisions on which acquisition path deserves implementation time. |
| REV-P2-13 | Revenue Admin Metrics | P2 | Service request admin shows rows and file metadata, while metrics are a separate compact table. | Follow-up work can become manual because lead status and metric movement are not visible together. | Add a small operator dashboard section that joins safe aggregate metrics with request status counts. | Do not expose private bucket URLs, raw uploaded files, or customer report data in analytics. | Improve lead response speed and paid-service close rate. |
| REV-P2-14 | Signup / Preview Diagnostics | P2 | The signup form can display `Signup email debug` only when the API returns preview/local debug metadata. | This helps preview testing, but the visual treatment can look confusing if a tester shares screenshots externally. | Keep production disabled, and make preview-only diagnostics visually explicit as a non-production panel. | Do not remove preview diagnostics needed for smoke tests or print secrets. | Reduce support confusion while preserving preview deployability checks. |

## Priority Order

1. Service CTA semantics: fix Team Launch and Assisted First 8D intent before adding more acquisition pages.
2. First-run activation: turn signup and dashboard traffic into one completed, export-ready report.
3. Editor next-action guidance: make existing Knowledge Reuse, workflow, and readiness controls easier to use.
4. Revenue diagnostics: add ratios and status summaries only after the current counters collect enough data.
5. Knowledge Base scaling: wait for real workspace volume before schema or indexing work.

## Future Only

These are explicitly future items and should not be bundled into the next small PR:

- Full CRM or sales pipeline.
- Automated offsite posting.
- Public marketing rewrite.
- Payment, checkout, subscription, or pricing-amount changes.
- Auth provider, password reset, or Resend infrastructure changes.
- Export entitlement or report editor save-flow changes.
- AI backend expansion or automatic AI approval.
- Database schema migration, dedicated revenue warehouse, vector database, or attachment content parsing.
- Knowledge Base permission, eligibility, or share-token logic changes.

## Review Conclusion

The current product is strong enough to keep measuring revenue evidence. The next best work is not another broad product expansion; it is a small sequence of conversion-clarity and activation PRs that make the current feature set easier to discover, complete, and evaluate.
