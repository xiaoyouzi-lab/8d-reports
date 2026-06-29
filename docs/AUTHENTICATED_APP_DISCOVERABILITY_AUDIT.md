# Authenticated App Feature Discoverability Audit

## Purpose

This audit reviews the logged-in 8D Reports app surface after PR #8 introduced Quality Knowledge Base v1.

PR #9 is a discoverability pass. It does not add new product capability. It makes the existing authenticated workflow easier to understand:

1. Create an 8D report.
2. Complete the report and workflow.
3. Reuse completed-report knowledge later.

## Stage Full Score Standard

Scores use a 1 to 5 scale.

- 1: Hidden or only reachable through indirect discovery.
- 2: Reachable, but only after prior product knowledge.
- 3: Discoverable in one relevant location.
- 4: Discoverable in primary or contextual locations with clear value copy.
- 5: Discoverable from primary navigation, relevant workflow context, and safe analytics.

This PR focuses on authenticated discoverability. It does not attempt to make every feature primary. Some features should remain contextual or advanced.

## Full Feature Audit

| Feature | User value | Target user | Current location before PR9 | Location after PR9 | Current discoverability score | Target discoverability score | Status | Should be primary / secondary / contextual / advanced | Current analytics | Problem | Recommendation | This PR action | Future action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Dashboard / My Reports | See report work, quotas, team status, search, and next actions. | All logged-in users. | `/dashboard`; avatar menu Dashboard item. | `/dashboard`; desktop and mobile primary app navigation; authenticated logo routes to `/dashboard`. | 5 | 5 | Meets target. | Primary. | `app_navigation_clicked`; existing report/search events. | Logo previously routed logged-in users to the public homepage. | Keep Dashboard as workspace home. | Changed authenticated logo to `/dashboard` and added safe logo navigation analytics. | Watch whether users still return to Dashboard after viewing Knowledge Base. |
| New Report | Start the 8D workflow quickly. | Quality engineers, supplier quality engineers, Team editors/owners. | Dashboard action and empty state. | Desktop and mobile primary app navigation; dashboard workflow prompt; report action row; empty state. | 5 | 5 | Meets target. | Primary. | `app_navigation_clicked`; `dashboard_feature_entry_clicked`; existing `report_created` after creation. | Creation was available, but not always visible as a primary app action. | Keep New Report visible in navigation and Dashboard actions. | Added New Report to authenticated app nav and Dashboard feature-entry analytics. | Consider a template chooser only after usage data shows confusion. |
| Knowledge Base | Reuse completed reports as root-cause, corrective-action, validation, and lessons-learned knowledge. | Returning users with completed 8D reports; Team owners/editors/viewers with access. | Avatar menu item and direct `/knowledge` route. | Desktop and mobile primary app navigation; dashboard workflow prompt; reuse card; report action row; report workflow panel. | 5 | 5 | Meets target. | Primary. | Existing `knowledge_*` events; new `app_navigation_clicked`; new `dashboard_feature_entry_clicked`. | Core value was too hidden when it lived mainly in the avatar menu. | Make Knowledge Base visible wherever users plan or finish report work. | Added primary nav, dashboard entries, workflow panel entry, and safe navigation analytics. | Later add usage reporting for repeat Knowledge Base users. |
| Report editor D0-D8 | Complete structured problem-solving fields. | Report owners/editors; viewers for read-only review. | Open a report from dashboard; report detail route. | Unchanged: report detail route and report list links. | 4 | 4 | Acceptable for PR9. | Contextual. | Existing `step_changed`, `report_saved`, AI/tool events where applicable. | Editor is discoverable after a report exists, but not a primary nav item. | Keep editor contextual to reports to avoid crowding primary navigation. | No editor core-flow change. Dashboard now explains that reports move through D0-D8 toward reuse. | Consider editor progress education only if users abandon D-steps. |
| Attachments / Evidence | Add supporting evidence to report steps. | Editors/owners preparing evidence; viewers reviewing evidence. | Inside report editor step forms. | Unchanged: contextual inside report editor. | 3 | 3 | Acceptable for PR9. | Contextual. | Existing attachment upload/activity events. | Evidence belongs inside report work, not global navigation. | Keep attachment discovery inside step-level context. | No attachment behavior change. Audit records it as contextual. | Later improve step-level evidence prompts if support data shows confusion. |
| Share link | Give controlled report access to customers or collaborators. | Owners/editors; viewers cannot share. | Report editor share controls. | Unchanged: report editor controls. | 3 | 3 | Acceptable for PR9. | Contextual. | Existing `share_link_created`; activity log entries. | Share is important but should happen after report context is known. | Keep share contextual and permission-gated. | No share/export/auth change. Audit records it as contextual. | Later add share-readiness checklist if users share incomplete reports. |
| Export PDF / Word / Excel | Deliver customer-ready outputs and reusable report files. | Quality engineers and managers delivering reports. | Report editor export controls; pricing/upgrade surfaces for gated formats. | Unchanged: report editor export controls and existing upgrade gates. | 3 | 3 | Acceptable for PR9. | Contextual. | Existing `export_clicked`, `export_succeeded`, gated export events. | Export should not compete with create/reuse navigation. | Keep export inside report context and pricing gates. | No export logic or pricing change. Audit records it as contextual. | Later split export analytics by format where needed. |
| Activity Log / revision history | Review report changes, approval, unlocks, and audit trail. | Team owners, editors, reviewers, managers. | Report workflow panel. | Report workflow panel, now with Knowledge Base reuse context. | 4 | 4 | Acceptable for PR9. | Contextual. | Existing activity records; new `app_navigation_clicked` for workflow panel Knowledge Base entry. | Activity log is discoverable from workflow context, not global nav. | Keep activity contextual to report workflow. | Added Knowledge Base link near workflow/activity context without changing activity behavior. | Later expose a team-level audit dashboard if teams request it. |
| AI Quality Check | Conservative review assistance for gaps and weak evidence. | Beta users and users preparing customer-ready reports. | Floating app assistant and report AI tools where available/gated. | Unchanged. | 3 | 3 | Future/advanced for discoverability. | Advanced. | Existing AI interest/generation/review events. | AI is not part of PR9; over-promoting it could imply unsupported automation. | Keep AI conservative and secondary. | No AI change. Audit records it as advanced. | Later revisit after AI Quality Check usage and reliability data. |
| Team workspace / roles / approval | Coordinate owners, editors, viewers, approval, locking, and revisions. | Team plan owners/editors/viewers. | Dashboard Team workspace section; report workflow panel. | Unchanged, still visible for Team plan users. | 4 | 4 | Acceptable for PR9. | Secondary/contextual. | Existing team member activity events; workflow activity events. | Team features are valuable but plan/context dependent. | Keep Team workspace on Dashboard and workflow controls in reports. | No Team permission or workflow logic change. | Later improve Team onboarding if Team activation data shows friction. |
| Pricing / upgrade / single export | Understand plan limits, Pro/Team value, and paid export paths. | Free users and users hitting gates. | Dashboard upgrade card, pricing route, export gates. | Unchanged: Dashboard upgrade card, pricing links, gated controls. | 4 | 4 | Acceptable for PR9. | Secondary. | Existing `upgrade_clicked`, pricing/export gate events. | Pricing should remain visible when relevant, not dominate core work. | Keep pricing/gates unchanged. | No pricing, checkout, or subscription change. | Later measure upgrade source by dashboard/navigation context. |
| Search / historical reuse | Find reports and reuse historical quality knowledge. | Returning users with report history; Pro/Team deep-search users; Knowledge Base users. | Dashboard report search; Pro/Team deep search; Knowledge Base search route. | Dashboard search unchanged; Knowledge Base now primary navigation and dashboard workflow entry. | 5 for Knowledge Base reuse, 4 for Dashboard report search | 5 for Knowledge Base reuse, 4 for Dashboard report search | Meets PR9 target for reuse; dashboard search remains acceptable. | Primary for Knowledge Base; secondary for dashboard report search. | Existing `dashboard_search_used`, `search_result_clicked`, `knowledge_*`; new navigation/entry events. | Historical reuse was under-discovered because Knowledge Base was hidden. | Keep Knowledge Base prominent; keep report search focused on report list. | Added Knowledge Base nav and dashboard/workflow entry points. | Later add indexed search or richer filters only if usage requires it. |

## Remaining Non-Primary Items

The following are intentionally not primary navigation items in PR #9:

- Report editor D0-D8
- Attachments / Evidence
- Share link
- Export PDF / Word / Excel
- Activity Log / revision history
- AI Quality Check
- Team workspace / roles / approval
- Pricing / upgrade / single export

They are acceptable because they are contextual, plan-dependent, or advanced surfaces. Promoting all of them to primary navigation would make the logged-in app harder to scan.

## Future Items

These are outside the PR #9 scope:

- Personalized onboarding checklist.
- Product tour or coach marks.
- Usage-based feature recommendations.
- Dedicated analytics dashboard for discoverability metrics.
- Authenticated smoke infrastructure.
- AI-assisted recommendations that point users to relevant historical knowledge.
- Plan-gated Knowledge Base experiments.

## Analytics Events

Allowed v1 events added by this PR:

- `app_navigation_clicked`
- `dashboard_feature_entry_clicked`

Safe metadata fields:

- `navItem`
- `destination`
- `location`
- `entry`
- `plan`

Do not send:

- Full search query
- Problem description
- Root cause
- Corrective action
- Lessons learned
- Customer name
- Supplier name
- Product name
- Batch number
- Attachment content

## Ready To Merge Checklist

- Knowledge Base is visible outside the avatar menu.
- Desktop and mobile logged-in navigation expose Dashboard, Knowledge Base, and New Report.
- Authenticated app logo routes to Dashboard.
- Dashboard explains create -> complete -> reuse.
- Dashboard includes Knowledge Base entries near the workflow prompt and report action row.
- Report workflow panel links completed/closed reports to Knowledge Base reuse.
- Dashboard counts use labels and titles that match the underlying data.
- New analytics events are allowlisted and use safe metadata only.
- Governance tests cover the 12-feature audit table, required columns, Dashboard metric title semantics, docs, and analytics allowlist.
- No public marketing, payment, export, AI, auth, database schema, or Knowledge Base search logic changes are included.
