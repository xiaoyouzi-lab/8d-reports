# Concierge Competitor PoC — 2026-08-02

This audit used synthetic quality data only. No competitor purchase was made,
no CAPTCHA was bypassed, and no mailbox verification link was opened. A blocked
signup is recorded as **not verified**, never as a product-quality result.

## Shared flawed-case content

The combined test report states a measurable connector defect, then uses
`employee negligence` for both occurrence and escape cause, proposes operator
training and 100% inspection, adds an unrelated label-printer action, supplies
no implementation evidence, and says only that the action is expected to work.
A separate high-quality fixture distinguishes occurrence and escape causes,
links actions to those causes, supplies implementation evidence, and gives a
sample/time/criterion/result verification statement.

## Executed results

| Product | Actual attempt | Same-case output evidence | Honest result |
| --- | --- | --- | --- |
| Sigma Exacta 8D | Opened the live local-first tool and generated Report views for both the 28-field flawed case and a separate high-quality control. | The flawed report visibly repeated `100% inspection`, identical `employee negligence` causes, retraining, the unrelated printer action, `Action is expected to work`, `N/A` evidence, and blank prevention. The control included separated occurrence/escape causes, mapped actions, evidence IDs, 20,400-unit/17-lot/four-week verification, preset criteria, and horizontal deployment. Neither report showed alerts. | Two real runs. It added no facts and did not invent weaknesses for the high-quality control, but it also did not flag the flawed report, predict customer questions, or rewrite English. It is an authoring tool, not a rejection-risk evaluator. |
| 8DReport.com | Filled and submitted the real trial form to `POST https://accounts.8dreport.com/sign-up/new-user`. | The actual response said new trial requests were not being accepted. No account was created. | Input, output, hallucination, evidence checks, logic checks, rewrites, and questions are all not verified. Public screenshots are not counted as a live run. |
| 8D Pack | Switched the live login form to Create Account and filled it with the synthetic PoC identity. | Cloudflare Turnstile remained unresolved and the app displayed `Please complete the captcha.` No product registration request was sent. The homepage's 11/11 extraction is a canned animation with no extraction request. | No account and no custom-case run. Output quality is not verified. The CAPTCHA was not clicked or bypassed. |
| Vantage 8D | Submitted the live Supabase signup flow. | The real signup request returned HTTP 429 and the UI reported the 15-second security limit. The flow then requires mailbox verification before a session exists. | The advertised 8D Evaluator could not be entered, so its custom-case output is not verified. |

Local evidence captured during the audit:

- `/tmp/reject-check-competitor-poc/sigma-flawed-report.png`
- `/tmp/reject-check-competitor-poc/sigma-high-quality-report.png`
- `/tmp/reject-check-competitor-poc/8dreport-signup-result.png`
- `/tmp/reject-check-competitor-poc/8dpack-register-result.png`
- `/tmp/reject-check-competitor-poc/competitor-poc-note.md`

## Public capability, price, privacy, and integration evidence

| Product | Publicly stated capabilities | Current public price | Privacy / integration evidence |
| --- | --- | --- | --- |
| 8D Pack | Raw SCAR input, extraction/drafting, source quote/confidence, 30+ lint rules, DOCX/PDF/HTML/Markdown, REST API at Enterprise. | USD 2.99/report; USD 49/month Starter; USD 149/month Professional; Enterprise custom; 14-day trial advertised. | Homepage states TLS, encryption at rest, and per-user isolation. During the live check, footer Privacy/Terms were plain text and common policy paths returned 404; this does not prove no policy exists elsewhere. |
| Vantage 8D | Generator, 5-Why, customer response, and an advertised Evaluator accepting pasted text, PDF, or Word and returning critique and follow-up questions. | One-month no-card trial advertised; paid amount was not verified from an accessible checkout in this run. | Signup uses Supabase. No authenticated data-handling or API behavior was verified. |
| 8DReport.com | Structured collaborative D1-D8 authoring, files/images, templates, and 8DConnect for ERP/CRM/MES at higher tiers. | 21-day trial advertised; USD 10/user/month Professional; USD 25/user/month Small Business; Enterprise contact. | Official privacy text covers uploaded Client Data and third-party processors. The trial-advertising page and actual signup availability currently disagree. |
| Sigma Exacta | Local-first structured D0-D8 authoring, JSON save/load with history, and PDF export. | Free/open source. | The live tool ran without an account and states local-first/offline operation. No 8D review API was found. |

Official sources:

- https://8dpack.com/
- https://www.vantage8d.com/
- https://www.vantage8d.com/blog/8d-report-software
- https://www.8dreport.com/plans/
- https://www.8dreport.com/privacy/
- https://sigmaexacta.com/8d
- https://sigmaexacta.com/documentation

## Decision and remaining hypothesis

There is no evidence supporting a claim that our automatic scan is superior to
8D Pack or Vantage. The public USD 2.99 8D Pack offer makes a USD 39 automated
scan a weak first paid test. The narrow remaining hypothesis is that a buyer
with a 24–72 hour submission deadline will pay USD 99 for an internally
human-reviewed rejection-risk deliverable focused on an already-written report,
evidence-to-claim traceability, occurrence versus escape logic, likely customer
questions, and fact-safe edits. This remains a hypothesis until an unrelated
external buyer pays and receives the result.
