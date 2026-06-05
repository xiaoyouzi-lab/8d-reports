# Team Sales Validation Baseline — 2026-06-05

This is the starting baseline for validating whether the current Team workflow is worth `$99/month` and whether Team Launch can sell from `$999`.

## What Is Live

- Production: `https://www.8d-reports.com`
- Team demos: `https://www.8d-reports.com/demo-reports`
- Automotive workflow demo: `https://www.8d-reports.com/demo-reports/automotive`
- Injection molding workflow demo: `https://www.8d-reports.com/demo-reports/molding`
- Electronics workflow demo: `https://www.8d-reports.com/demo-reports/electronics`
- Team Launch: `https://www.8d-reports.com/team-launch`
- Template Setup: `https://www.8d-reports.com/custom-8d-template-setup`

Each workflow demo now includes a two-minute validation form that records:

- respondent role;
- current 8D process;
- most valuable Team capability;
- main adoption concern;
- optional work email.

Submissions are stored in the existing `feedback` table with the marker `[team-workflow-validation]`. The product event `team_demo_feedback_submitted` is also recorded.

Run the local market-validation dashboard from the desktop shortcut `8D Metrics Dashboard.command`. Its primary metrics exclude known owner and test accounts while retaining an all-activity comparison for troubleshooting.

## Current Seven-Day Product Baseline

Data window: the seven days ending 2026-06-05.

| Metric | Current 7 days | Previous 7 days | Interpretation |
| --- | ---: | ---: | --- |
| External market accounts | 0 | — | Every current account is an owner, QA, security, plan, or role-test account |
| External reports created | 0 | — | Existing reports were created during product development and production validation |
| External report creators | 0 | — | No market activation evidence yet |
| External successful exports | 0 | — | Existing exports were production validation activity |
| External checkout starts | 0 | — | Existing checkout starts were production validation activity |
| External Team demo feedback | 0 | — | The feedback loop is live; distribution is now the bottleneck |

The current event volume must not be treated as market validation because production testing generated most activity.

## Decision Question

> Do approval, locking, revision reasons, Activity Log, and role-based access make a small manufacturing quality team willing to pay `$99/month` or buy a `$999` Team Launch?

## Evidence Required Before More Feature Development

Collect at least one of:

- 3 teams actively testing the Team workflow;
- 1 paid Team subscription;
- 1 qualified Team Launch or Template Setup request;
- 10 interviews that consistently identify the same next blocking problem.

Do not begin Customer Complaint Intake or email reminders before this gate is met.

## First Publishing Action

Publish one honest discussion from the founder/owner account:

**Title**

> After an 8D is approved and sent to the customer, how do you stop uncontrolled edits?

**Post**

> I am testing a lightweight 8D workflow for small manufacturing quality teams. The part I am trying to validate is not the D0-D8 form itself, but what happens after the report is reviewed: approval, locking, revision reasons, Activity Log, and formal PDF/Word/ZIP delivery.
>
> Here is an automotive example showing the intended workflow:
> https://www.8d-reports.com/demo-reports/automotive?utm_source=community&utm_medium=discussion&utm_campaign=team_workflow_validation
>
> In your current process, once an 8D is approved and sent to the customer, how do you control later edits and prove who changed what?

Recommended first channel: Elsmar Cove’s `Quality Assurance and Compliance Software Tools and Solutions` forum:

`https://elsmar.com/elsmarqualityforum/forums/quality-assurance-and-compliance-software-tools-and-solutions.36/`

It is a better first fit than a general corrective-action discussion because the post openly evaluates a software workflow. Publish to one channel first and record the URL, date, views, comments, demo visits, and feedback form submissions.

## First Elsmar Execution Result

Date: 2026-06-05

Outcome:

- The original validation thread could not be posted because the new Elsmar account has 0 posts and the forum blocks links until the account has at least 10 posts.
- The strategy was changed from direct validation post to warm-up participation:
  - no product links;
  - no UTM links;
  - no product mention unless asked;
  - useful process replies only.
- First warm-up reply was submitted in this thread:
  `https://elsmar.com/elsmarqualityforum/threads/how-are-you-handling-vda-6-3-alongside-iatf-16949-still-on-spreadsheets.92271/`
- Reply status after submission:
  `This message is awaiting moderator approval, and is invisible to normal visitors.`

First reply topic:

- VDA 6.3 audit scoring should remain recognizable to customers/auditors.
- Findings can still be linked into the same corrective-action system used for IATF issues.
- The useful trace is from VDA question / process step / score to nonconformity, owner, containment, corrective action, due date, evidence, and effectiveness check.
- Spreadsheets can work for one audit event, but become weak when multiple audits, suppliers, actions, and overdue follow-ups need to be trended.

Next Elsmar rule:

- Do not post repeatedly while the first reply is awaiting moderator approval.
- Wait for approval or a reasonable interval before submitting the next no-link reply.
- Continue reading threads and collecting recurring customer problems during the wait.

## 24-Hour Analytics Snapshot After First Validation Work

Date checked: 2026-06-05

Source: Vercel Analytics, production traffic, `Jun 4, 10:00 - Jun 5, 9:59`.

| Metric | Value | Note |
| --- | ---: | --- |
| Visitors | 8 | `+14%` versus previous period |
| Page views | 56 | `+167%` versus previous period |
| Bounce rate | 38% | `-19%` versus previous period |
| Online visitors at check time | 0 | No live visitor during check |

Top visible pages:

- `/`: 5 visitors
- `/dashboard`: 3 visitors
- `/login`: 3 visitors
- `/resources`: 3 visitors
- `/sample-report`: 3 visitors
- `/demo-reports`: 2 visitors
- `/demo-reports/automotive`: 2 visitors

Traffic context:

- Referrers: no data found for the selected period.
- Countries: Japan 38%, United States 38%, China 25%.
- Devices: Desktop 100%.
- Operating systems: Mac 63%, GNU/Linux 25%, Windows 13%.

Interpretation:

- The Resources, sample report, and demo report pages are receiving visits, which supports keeping these pages in the validation path.
- There is still no referrer or campaign evidence, so this is a weak traffic signal rather than proof of qualified demand.
- Do not count this as market validation until it produces at least one of: demo feedback, signup, report creation, checkout intent, Team inquiry, or Template Setup inquiry.
- Continue directing future validated traffic toward `/demo-reports`, `/demo-reports/automotive`, `/sample-report`, and `/resources`, then compare visits with feedback and account activity.

## Production Sales-Readiness Check

Date checked: 2026-06-05

Purpose:

- Confirm that the public site can support the next sales-validation step before building Customer Complaint Intake or email reminders.
- Verify that the buyer-facing proof assets exist in production, not only in local development.

Build and static checks:

- `npm run lint`: passed with 0 errors and 11 existing warnings.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed. Next generated 102 app routes, including `/demo-reports`, three demo workflow pages, and the programmatic SEO pages.

Production page checks:

| URL | Status | Content type |
| --- | ---: | --- |
| `https://www.8d-reports.com/` | 200 | `text/html` |
| `https://www.8d-reports.com/pricing` | 200 | `text/html` |
| `https://www.8d-reports.com/team-launch` | 200 | `text/html` |
| `https://www.8d-reports.com/demo-reports` | 200 | `text/html` |
| `https://www.8d-reports.com/demo-reports/automotive` | 200 | `text/html` |
| `https://www.8d-reports.com/security` | 200 | `text/html` |
| `https://www.8d-reports.com/resources` | 200 | `text/html` |

Production demo download checks:

| Asset | Status | Content type | Size |
| --- | ---: | --- | ---: |
| Automotive PDF | 200 | `application/pdf` | 259,548 bytes |
| Automotive Word | 200 | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | 262,825 bytes |
| Automotive ZIP | 200 | `application/zip` | 773,655 bytes |
| Molding ZIP | 200 | `application/zip` | 856,152 bytes |
| Electronics ZIP | 200 | `application/zip` | 667,983 bytes |

ZIP evidence package verification:

- Automotive ZIP includes the PDF, Word document, image evidence, `D2-customer-defect-photo-description.txt`, `D4-brush-wear-study.csv`, and `D6-validation-summary.txt`.
- Molding ZIP includes the PDF, Word document, image evidence, `D2-cosmetic-boundary-sample.txt`, `D4-cooling-flow-comparison.csv`, and `D6-validation-results.txt`.
- Electronics ZIP includes the PDF, Word document, image evidence, `D2-burn-in-failure-log.csv`, `D4-cross-section-findings.txt`, and `D6-reliability-validation.txt`.

Conclusion:

- The production site now has the minimum public proof assets needed for sales validation: homepage, pricing, Team Launch, security page, demo overview, individual demo workflow page, and downloadable customer-delivery packages.
- The demo ZIP packages preserve non-image evidence files, which directly addresses the earlier export-quality concern that only photos were included.
- The next validation action should be showing these demo workflow pages to target users and measuring demo feedback, signups, report creation, checkout intent, Team inquiries, or Template Setup inquiries.

## Team Permission Hardening

Date updated: 2026-06-05

Why this was needed:

- The Team plan is only credible if Owner / Editor / Viewer permissions are enforced by the API, not just hidden in the UI.
- A review found that report access used the user's general workspace role instead of the role tied to the specific report owner's Team workspace.
- This could make role behavior confusing in edge cases, especially if a user belonged to more than one workspace or if a report was created by a team member rather than the workspace owner.

Changes made:

- Team report visibility now includes reports owned by peers in the same active Team workspace, not only reports owned by the Team owner.
- Report permissions now resolve the user's role relative to the report owner's Team context.
- If the report owner is the Team owner, the requester must be a member of that owner's Team to receive Editor or Viewer rights.
- If the report was created by a Team member, the requester is resolved through that member's Team so the workspace Owner still receives Owner rights and other members receive their own roles.
- Viewer remains view-only through the shared `getReportAccess` gate used by report editing, attachments, signatures, workflow, share links, and export activity endpoints.

Verification:

- `npx tsc --noEmit`: passed.
- `npm run lint`: passed with 0 errors and 11 existing warnings.
- `npm run build`: passed and generated the same 102 app routes.

Remaining production smoke test:

- Use real Team accounts to verify Owner / Editor / Viewer behavior through both UI buttons and direct API calls.
- Confirm Viewer cannot edit D-steps, upload/delete attachments, replace signatures, create share links, export drafts, or change workflow state.
- Confirm Editor can create/edit reports, upload/delete attachments, create share links, and export draft packages while still being unable to approve, lock, unlock, or manage members.
- Confirm Owner can approve, lock, unlock with reason, and manage members.

## AI Failure Handling Check

Date updated: 2026-06-05

Purpose:

- Ensure AI failures do not break the report workflow or show raw server failures to users.
- Keep AI positioned as beta assistance, not as an approval or certification mechanism.

Confirmed behavior:

- `POST /api/ai/report-review` is beta-gated, logs failed tasks, and returns a friendly 503 message when DeepSeek fails.
- `POST /api/ai/draft-report` is beta-gated, limits material length, reads only the current report plus user-provided materials, logs failed tasks, and returns a friendly 503 message when DeepSeek fails.
- AI Draft apply behavior only fills empty report fields and does not overwrite existing user-entered content.
- The editor UI states: `AI Quality Check — Beta`, `It does not approve or certify the report`, and `AI Draft uses only your current report fields and the material you provide in this session.`

Changes made:

- `POST /api/ai/template-evaluation` no longer returns a raw 502-style failure. It now logs the failure, records the failed AI task, and returns a friendly 503 message.
- `POST /api/quality-agent/chat` now has a 25-second timeout and returns a friendly 503 message when DeepSeek fails or times out.
- `POST /api/quality-agent` now returns the same friendly 503-style Quality Expert message on unexpected failure instead of a generic internal-server error.
- Search verification found no remaining `status: 502` or `Internal server error` strings in `src/app/api/ai` or `src/app/api/quality-agent`.

Verification:

- `npm run lint`: passed with 0 errors and 11 existing warnings.
- `npm run build`: passed and generated 102 app routes.

Remaining production smoke test:

- Use a beta account to run AI Quality Check successfully on a real report.
- Temporarily force DeepSeek failure or invalid credentials in a safe environment and confirm the UI shows the friendly failure message while report data remains saved.
- Create two unrelated reports and confirm AI Draft on report B does not use report A content.

## Sharing and Attachment Governance Check

Date updated: 2026-06-05

Purpose:

- Ensure Team governance covers shared report links and evidence upload failures, because these are part of customer-facing report delivery.

Changes made:

- Share link update and revocation are now controlled by report-level permissions instead of only the original link creator.
- This allows an authorized Team Owner or Editor to update or revoke the active report share link after it has been created, rather than leaving governance tied to the individual who first created it.
- The same API still blocks Viewers through the shared `getReportAccess` gate.
- Attachment upload failures now log server-side detail and return a friendly 503 message instead of exposing storage-layer errors to the user.

Verification:

- `npm run lint`: passed with 0 errors and 11 existing warnings.
- `npm run build`: passed and generated 102 app routes.

Remaining production smoke test:

- Confirm Owner can revoke an Editor-created share link.
- Confirm Viewer cannot create, update, or revoke share links.
- Confirm upload failures show the friendly message and do not create partial attachment records.

## Service Request Flow Check

Date updated: 2026-06-05

Purpose:

- Make Template Setup and Team Launch usable as service offers, not just marketing pages.
- Keep the service backend intentionally lightweight while still allowing follow-up.

Changes made:

- Added a service request migration for `request_type`, `admin_notes`, and `quoted_amount`.
- Service request statuses are now explicitly modeled:
  - `submitted`
  - `under_review`
  - `quote_sent`
  - `in_progress`
  - `ready_for_review`
  - `delivered`
  - `cancelled`
- Template Setup requests are saved as `template_setup`.
- Team Launch requests are saved as `team_launch`.
- Team Launch CTAs now route to `/custom-8d-template-setup?service=team_launch#request`, and the form changes its heading, description, hidden request type, and submit button accordingly.
- Admin-only `GET /api/custom-template-requests` lists the latest service requests and can filter by status.
- Admin-only `PATCH /api/custom-template-requests` updates status, admin notes, and quoted amount.
- Admin access is controlled by `ADMIN_EMAILS` or `ADMIN_EMAIL`.
- Added `/admin/service-requests` for service follow-up. The page is admin-only and shows request type, company, email, use case, requirements, language/export needs, uploaded files, status, quote amount, admin notes, and created time.
- The admin page can update service request status, quote amount, and internal notes without building a full service backend.

Verification:

- `npx tsc --noEmit`: passed.
- `npm run lint`: passed with 0 errors and 11 existing warnings.
- `npm run build`: passed and generated 103 app routes, including `/admin/service-requests`.
- Migration `drizzle/0005_service_request_flow.sql` applied successfully to the configured database.
- Database verification confirmed `custom_template_requests` now has `request_type`, `admin_notes`, `quoted_amount`, and the existing `status` column.

Remaining production smoke test:

- Submit one Template Setup request and one Team Launch request.
- Confirm the database rows include the correct `request_type`.
- Confirm the admin account can list and update request status through `/admin/service-requests`.

## Service Request Production Smoke Test

Date checked: 2026-06-05

Production route checks:

- `GET https://www.8d-reports.com/admin/service-requests`: route exists and returns the protected app shell for unauthenticated visitors.
- The unauthenticated HTML does not expose `Service Requests` or request details.
- `GET https://www.8d-reports.com/api/custom-template-requests` without an admin session returns `404 {"error":"Not found"}`.

Production submission checks:

- Submitted a Template Setup smoke request through `POST /api/custom-template-requests`.
- Submitted a Team Launch smoke request through `POST /api/custom-template-requests`.
- Both requests returned `201 application/json`.
- Both requests uploaded a ZIP test file to R2 and persisted one uploaded file record.

Database verification:

- The Template Setup smoke request was saved with `request_type = template_setup`, `status = submitted`, and one uploaded file.
- The Team Launch smoke request was saved with `request_type = team_launch`, `status = submitted`, and one uploaded file.
- Status-flow fields were verified by updating the smoke records:
  - Template Setup: `status = under_review`, `quoted_amount = 499.00`, admin note recorded.
  - Team Launch: `status = quote_sent`, `quoted_amount = 999.00`, admin note recorded.

Environment setup:

- `ADMIN_EMAILS` is configured in Vercel Production.
- A production redeploy was completed after adding `ADMIN_EMAILS`, and `https://www.8d-reports.com` was aliased to the new deployment.
- Unauthenticated API access still returns `404 {"error":"Not found"}`, so service request data is not exposed publicly.
- Remaining manual check: log in with an admin-listed account and verify `/admin/service-requests` can list and update service requests through the UI.

## Current Attachment-Plan Completion Audit

Date checked: 2026-06-05

Purpose:

- Reconcile the expert plan against the current codebase and production deployment.
- Separate items with strong current evidence from items that still require an authenticated manual smoke test.

Strong evidence now available:

- Trust fixes:
  - AI Quality Check and AI Draft are beta-gated.
  - AI failure paths return friendly messages instead of raw 502-style failures.
  - AI Draft uses the current report plus user-provided materials and the UI states this boundary.
  - AI Draft API ignores client-sent report snapshots, loads only the requested accessible report, and does not read unrelated reports, search results, activity history, or historical report content.
  - DeepSeek failures now use task-specific friendly messages for AI Quality Check, AI Draft, and template evaluation.
  - AI Quality Check copy states that it does not approve or certify a report.
  - Google/GitHub shortcuts are hidden on login and signup until end-to-end social login is stable; production authentication is email-first.
- Team value foundation:
  - Workflow statuses are `draft`, `internal_review`, `approved`, `submitted`, and `closed`.
  - `approved`, `submitted`, and `closed` lock reports against D-step edits, attachment deletion, and signature replacement.
  - Owner / Editor / Viewer permissions are enforced through the shared report-access gate.
  - Team member creation, role updates, and member removal require an active Team owner, so expired or non-Team users cannot keep managing Team seats.
  - Owner can unlock for revision only with a reason, and unlock increments the revision number.
  - Activity Log records field updates, attachment upload/delete, share link create/revoke, workflow transitions, unlock, and export events.
  - Activity Log UI displays field before/after previews, attachment filenames, D-step metadata, export format, share permission, revision, and unlock reason.
  - Dashboard report rows now expose and display workflow status, revision number, and locked state, so Team governance is visible before opening a report.
- Commercial boundaries:
  - Free is 3 lifetime reports.
  - Pro is described as `$19/month` for unlimited personal reports and individual delivery features.
  - Team is described as `$99/month` with 5 seats, workspace roles, approval, locking, revisions, and Activity Log.
  - Single export is `$4.99/report`.
  - Template Setup is `From $499`.
  - Team Launch is `From $999`.
  - Public copy no longer claims full QMS, SSO, email reminders, Customer Complaint Intake, automatic AI approval, or password-protected share links.
- Service offer foundation:
  - Template Setup and Team Launch requests are persisted with `request_type`.
  - Service status flow exists: `submitted`, `under_review`, `quote_sent`, `in_progress`, `ready_for_review`, `delivered`, `cancelled`.
  - Admin-only service request page and API exist.
  - Production unauthenticated API access does not expose service request data.
- Production proof assets:
  - Homepage, Pricing, Team Launch, Template Setup, Demo Reports, Security, and Resources return `200 text/html` on production.
  - Demo report downloads and ZIP evidence packages were previously verified, including non-image evidence files.
- Regression coverage:
- `npm run test:governance` verifies workflow statuses, locked states, Owner / Editor / Viewer permissions, Team member management plan gates, Activity Log recording points and UI audit details, AI task-specific failure messages, AI Draft current-report isolation, dashboard workflow/revision visibility, pricing boundaries, homepage Team positioning, Pro-vs-Team copy boundaries, and hidden social-login buttons.
  - Latest local checks passed: `npm run test:governance`, `npm run lint`, `npx tsc --noEmit`, and `npm run build`.

Remaining manual/authenticated checks:

- Log in with an admin-listed account and verify `/admin/service-requests` can list and update service requests through the UI.
- Use real Team accounts to verify Owner / Editor / Viewer behavior through the UI and direct API calls:
  - Viewer cannot edit D-steps, upload/delete attachments, replace signatures, create share links, export drafts, or change workflow state.
  - Editor can create/edit reports, upload/delete attachments, create share links, and export draft packages, but cannot approve, lock, unlock, or manage members.
  - Owner can approve, lock, unlock with reason, revoke links, and manage members.
- Use a beta account to run AI Quality Check successfully on a real report.
- In a safe non-production setup, force DeepSeek failure or invalid credentials and confirm the UI shows the friendly failure message while report data remains saved.
- Create two unrelated reports and manually confirm AI Draft on report B does not use report A content. Static route coverage now verifies the API does not query unrelated reports or history, but a beta-account end-to-end check is still needed.

Current decision:

- The product is ready for Team workflow sales validation and service-offer validation.
- Do not start Customer Complaint Intake, email reminders, ERP/MES/PLM integrations, SSO, complex approval matrices, or full QMS scope until the evidence gate near the top of this document is met.
