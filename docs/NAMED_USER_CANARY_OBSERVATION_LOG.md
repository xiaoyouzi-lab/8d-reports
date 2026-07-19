# Named User Canary Observation Log

## Data-handling rule

Use participant IDs only. Do not record a person’s full name, employer, email,
password, task token, Vercel share link, raw answer, customer data, or file
contents. Store the working log in the approved internal location; this file is
the redacted template and may remain in the repository.

## Run metadata

| Field | Record |
| --- | --- |
| Run ID | `NUC-YYYYMMDD-01` |
| RC branch / commit | `codex/rc2-preview-hardening` / __________ |
| Preview alias | `8d-reports-git-codex-rc2-preview-95baed-xiaoyouzi-labs-projects.vercel.app` |
| Deployment ID | __________ |
| Facilitator / observer ID | __________ |
| Start / end (local time) | __________ / __________ |
| Case ID | __________ |
| Environment check | Dedicated Neon / `8d-reports-preview` / Preview Resend / Preview AI: pass or fail |
| Consent confirmed | `CU-01` / `SU-01` / `CR-01`: __________ |

## Role timeline

| Participant | Time | Screen or stage | Observed action / exact short quote | Outcome | Help given? |
| --- | --- | --- | --- | --- | --- |
| CU-01 | 00:00 | `/cases` | Opened workspace |  | No |
| SU-01 | 00:00 | Supplier landing | Opened invitation |  | No |
| SU-01 | 00:30 | Supplier landing / first question | Understood next action? `yes / no / asked for help` |  | No |
| CR-01 | 00:00 | Customer Review | Opened invitation |  | No |

## Guided investigation checkpoints

| Checkpoint | Expected observation | Actual observation | Result |
| --- | --- | --- | --- |
| Plain-language first question | Supplier can answer without 8D terminology |  | pass / issue |
| `员工未发现` | AI asks why the process allowed it and why detection missed it |  | pass / issue |
| `加强培训` | AI asks about a durable prevention/control change |  | pass / issue |
| Missing facts | AI asks for batch/scope/discovery/containment information without inventing it |  | pass / issue |
| Evidence | Supplier understands why a synthetic record is requested and can upload it |  | pass / issue |
| Readiness | Advisory risks do not block submission |  | pass / issue |
| Submit | Supplier understands what happens after submit |  | pass / issue |

## Coordinator checkpoints

| Checkpoint | Expected observation | Actual observation | Result |
| --- | --- | --- | --- |
| Status / waiting / next action | Coordinator can identify them without quality training |  | pass / issue |
| AI review | Risks are framed as questions/attention, never approval |  | pass / issue |
| Supplier return | Coordinator can request a focused update |  | pass / issue |
| Mapping | Only human-confirmed text is selected for customer content |  | pass / issue |
| Customer draft | Draft excludes AI-only and unconfirmed text |  | pass / issue |
| Verification | Coordinator knows Customer Accepted is not Closed |  | pass / issue |

## Customer and safety checkpoints

| Checkpoint | Expected observation | Actual observation | Result |
| --- | --- | --- | --- |
| English review | Customer understands product, issue, supplier response, and action choices |  | pass / issue |
| Field-level change | Customer can add a Root Cause or Verification comment |  | pass / issue |
| Projection privacy | No AI insight, internal risk, supplier original answer, or internal note is visible |  | pass / issue |
| Accept | Status becomes Customer Accepted, not Closed |  | pass / issue |
| Verification approval | Only internal authorised user can approve / close / reopen |  | pass / issue |

## Completion and interruption measures

| Metric | Value | Evidence source |
| --- | --- | --- |
| Coordinator first-open to first action | __________ | Observer timestamp |
| Supplier first-open to first action | __________ | Observer timestamp |
| Supplier Guided questions answered / total | __________ / __________ | UI and Session/Answer audit |
| Supplier interruption stage(s) | __________ | Observer / Answer timestamps |
| Supplier submissions | __________ | Supplier Confirmation / Submission Audit |
| Internal returns | __________ | Case Activity / follow-up task |
| Customer Request Changes | __________ | Customer comments / Case Activity |
| Customer Accept | __________ | Case Activity |
| Verification result / approval | __________ | Verification Audit |
| Case closed then reopened | __________ | Case / Verification Audit |

## Issue register

| ID | Severity | Role | Screen / stage | Reproducible observation | User impact | Evidence reference | Owner / decision |
| --- | --- | --- | --- | --- | --- | --- | --- |
| NUC-01 | P0 / P1 / P2 |  |  |  |  | Redacted timestamp only |  |

Severity:

- **P0** — access, token, privacy, cross-Case, or workflow-security failure;
  stop the affected test and revoke access.
- **P1** — role cannot finish, AI guidance is unavailable/unsafe, or the result
  cannot answer the usability question; fix before the next participant of the
  affected role.
- **P2** — confusing but recoverable; capture before changing the UI.

## End-of-run sign-off

| Check | Result | Evidence |
| --- | --- | --- |
| All invitations revoked or expired |  |  |
| Exact Case evidence removed from R2 |  |  |
| Test Case / account removed or dedicated Neon project deleted |  |  |
| Branch-specific database variable removed |  |  |
| Temporary Vercel share links removed |  |  |
| No secret/token/PII in retained artifacts |  |  |
| Decision | Ready for next named run / fix P0 or P1 / stop Canary |  |
