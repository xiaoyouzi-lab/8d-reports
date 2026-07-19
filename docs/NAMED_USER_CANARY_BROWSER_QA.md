# Named User Canary Browser QA

## Scope and verdict

This is a browser-based preflight of the controlled Preview, using only a
de-identified injection-molded-part scenario. It is not a substitute for a
real participant study. No Production deployment, data, account, object
storage, or credential was used.

| Item | Result |
| --- | --- |
| Tested branch / code | `codex/rc2-preview-hardening` / `3aff357f694c5861323f9f0f0da79b37c67afd35` |
| Tested Preview | `https://8d-reports-jrwas1hmg-xiaoyouzi-labs-projects.vercel.app` |
| Browser method | Real headed Playwright browser, separately named Coordinator and Supplier sessions; desktop plus 390 x 844 mobile Supplier viewport |
| Browser-plugin result | The in-app browser obtained protected Preview access, but its DOM snapshot repeatedly timed out/reset after navigation. The repository Playwright CLI was therefore used for the actual interaction checks. |
| Functional browser flow | **Failed** — the Supplier can complete Guided questions but cannot upload evidence, see Readiness, build/confirm a Response Package, or submit it. |
| Heuristic novice usability | **Failed for Canary readiness** — the early Guided experience is plain-language and informative, but the unfinishable supplier path invalidates the end-to-end novice task. |
| Real human usability | **Not verified** — no named participant has been invited. |

The Preview is **not ready for a real Named User Canary** until P0-3 is
resolved and the complete three-role browser flow is rerun.

## Test data and isolation

The synthetic scenario was: injection-molded part flash; 20 defects in 1,000
parts; customer assembly is affected; the initial supplier response was
"员工没有及时发现" and "后续加强培训". A dedicated, empty Neon Canary
environment and `8d-reports-preview` were used. Test Case rows, task links,
test users, sessions, and evidence records were removed after the run. No
browser token, cookie, task URL, email body, credential, or evidence content
is retained in this document.

## Coordinator browser results

| Check | Result | Evidence / observation |
| --- | --- | --- |
| Preview loads; no app error overlay | Pass | `/cases` and Case Detail loaded in a real browser. |
| Case list can open an existing Case | Fixed P0, pass | The prior disabled placeholder was replaced with an accessible Case Detail link and navigation was retested. |
| Status, waiting party, due date, owner, next action | Pass | Dashboard queue and Case Detail showed waiting supplier, due date, owner, and workflow progress after the Supplier task was created. |
| Supplier task creation and email request | Pass, delivery not independently read | The UI generated an opaque external task link and reported Preview invitation send success to the Resend test recipient. Inbox-body delivery was not asserted. |
| Complaint import / AI extraction review | P1 | Current Case creation is a compact metadata form; it did not present the requested complaint-import/extraction review in this flow. |
| Chinese coordinator wording | P1 | The main labels are Chinese, but the workflow next-action copy remains English (for example, the supplier response instruction). |
| Internal review onward | Blocked by P0-3 | The Supplier UI cannot create a submission, so no UI-legal route reaches Internal Review. |

## Supplier browser results

| Check | Result | Evidence / observation |
| --- | --- | --- |
| Token-scoped Chinese invitation; no product registration | Pass | Invitation identifies the quality request, issue summary, due date, estimated time, progress, and a single next action. |
| 30-second orientation heuristic | Pass for landing | The first visible action and the reason for the first question are clear without 8D vocabulary. This is a heuristic observation, not a human-study result. |
| Default Guided Mode | Pass | Guided Mode is the opening surface; Expert Mode is an explicit switch. |
| Direct-cause challenge | Pass | "员工操作错误，员工没有及时发现飞边" triggered a follow-up asking why process, tooling, work instruction, or settings allowed the mistake and why their control failed. It was not written as a confirmed root cause. |
| Detection challenge | Pass | A statement that visual sampling did not find flash triggered a question about what was checked, method, sampling scope/frequency, and whether the defect could be detected. |
| Training-only challenge | Pass | "后续加强培训" triggered a plain-language follow-up asking for process/tooling/fixture/standard/inspection changes that make recurrence harder or easier to detect. |
| AI/provider outage handling | Fixed P0, pass | Original answers remained saved and the UI advanced through deterministic safe questions instead of repeating an answered question or declaring an AI conclusion. |
| Expert Mode | P1 | It opens a free-text "专业答复模式" textarea, but exposes no save, mapping, evidence, confirmation, or shared submit action. |
| Evidence upload, evidence links, Readiness | **P0-3 fail** | After 9/9 Guided answers, neither the normal nor Expert surface displayed an upload control, evidence requirement, Readiness Check, confirmation, or Response Package. |
| Supplier submission | **P0-3 fail** | The completion state says "调查已完成，请等待内部审核", while the Case remains waiting for supplier and no submit control exists. This is an operation dead end, not merely a wording issue. |
| Mobile, 390 x 844 | Partial pass | The completed Supplier page had no horizontal overflow and controls remained visible. Mobile completion cannot be accepted because the missing evidence/submit controls also make this primary path incomplete. |

## Customer and Verification results

Customer Review, Request Changes, Customer Accept, Verification, Close, and
Reopen were **not executed through the browser**. Their only normal entry is
downstream of Supplier submission, and using an API or administrator shortcut
would violate this browser QA's role-boundary requirement. This is a blocked
test, not a pass or a claim about those permissions.

## Console, page-state, and interaction checks

- No Next.js error overlay or application blank page was observed on tested
  Coordinator or Supplier routes.
- All tested pages had one Preview-only console error: Vercel Live Feedback's
  script was blocked by the configured Content Security Policy. It did not
  block product interaction and is recorded as P2.
- The route title was the generic `8D Reports - Customer-Ready 8D Report
  Software`, including on Guided Supplier pages. This is P2 copy/product
  context debt.
- The external task link was shown once in the Coordinator UI and not retained
  in this report. No cross-role cookie or administrator session was reused for
  the Supplier checks.
- The tested Supplier mobile viewport had `scrollWidth <= innerWidth`.

## Issue register

| ID | Severity | Reproduction | User impact | Likely related surface | Decision |
| --- | --- | --- | --- | --- | --- |
| NUC-BQA-01 | Fixed P0 | Create a Case, then use the Case-list action. The action was a disabled placeholder. | Coordinator could not continue to tasks or workflow. | `src/components/quality-cases/QualityCasesWorkspace.tsx` | Fixed and browser-retested. |
| NUC-BQA-02 | Fixed P0 | Answer a Guided question while the provider is unavailable. Previously the same answered question remained. | Supplier could be trapped in a non-progressing investigation. | `src/lib/quality-cases/guided-investigator.ts`, `src/lib/quality-cases/guided-supplier.ts`, `src/components/quality-cases/SupplierGuidedTask.tsx` | Fixed and browser-retested with direct-cause, inspection, training, and verification stages. |
| NUC-BQA-03 | P0 open | Complete all Guided questions through the Supplier invitation. | No Evidence, Readiness, confirmation, Response Package, or submit entry exists; Internal Review and all downstream roles are unreachable. | `src/components/quality-cases/SupplierGuidedTask.tsx` and its integration with the existing package/evidence services | Must be fixed before any named Supplier session. |
| NUC-BQA-04 | P1 | Switch from Guided to Expert Mode. | Expert users get a textarea without a completion path. | `src/components/quality-cases/SupplierGuidedTask.tsx` | Resolve with the same shared submit path as Guided Mode. |
| NUC-BQA-05 | P1 | Create a Case as a Coordinator using only the visible UI. | The requested complaint import and AI extraction review are absent from this browser path. | `src/components/quality-cases/QualityCasesWorkspace.tsx` / Case intake | Product review before the named study. |
| NUC-BQA-06 | P1 | Read the Coordinator workflow queue/detail. | Next-action explanations mix Chinese UI with English workflow text. | Quality Case workflow copy | Product copy review. |
| NUC-BQA-07 | P2 | Load any tested Preview route. | One non-product Vercel Live Feedback script is blocked by CSP. | Preview CSP / Vercel feedback integration | Non-blocking; track separately. |
| NUC-BQA-08 | P2 | Inspect Supplier Guided page title. | Generic legacy product title reduces context. | route metadata | Non-blocking copy improvement. |

## Cleanup evidence

- Isolated Neon verification after cleanup: 0 test Cases, 0 task links, 0
  Evidence records, 0 test users, and 0 test sessions.
- No Supplier evidence object was uploaded because the browser UI had no upload
  entry. Therefore no R2 test object was created by this run.
- All named Playwright contexts had browser data cleared and were closed.
- Local Playwright snapshots, screenshots, console logs, and temporary output
  directories from this run were removed. No test token or cookie was placed
  in Git or this report.

## Required retest scope

After P0-3 is fixed, rerun with three separately authenticated browser
contexts and verify: Guided evidence association, advisory Readiness,
Supplier Response Package confirmation and idempotent submit, Internal
Review/follow-up, frozen Customer projection and field changes, Customer
Accept without closure, Verification approval, Close/Reopen, evidence
authorisation, and desktop plus 390px mobile layouts. Only then should real
named participants be invited.
