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
