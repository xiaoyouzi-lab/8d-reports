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
