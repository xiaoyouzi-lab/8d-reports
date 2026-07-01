# Development Log

## Latest Task

GEO / SEO Revenue Query Map v1.

## Changed Files

- `docs/CURRENT_TASK.md`
- `docs/DEV_LOG.md`
- `docs/GEO_REVENUE_QUERY_MAP.md`
- `scripts/team-governance.test.ts`

## Implementation Summary

- Added a 160-query revenue-centered GEO/SEO query map across core 8D report,
  SCAR / supplier corrective action, customer complaint response, industry
  examples, role-based, Excel replacement, AI / Knowledge reuse, and service /
  paid intent categories.
- Mapped every query to intent type, target page type, CTA, priority,
  commercial reason, content angle, internal link target, and safe metadata /
  tracking event.
- Kept all volume, ranking, AI citation, customer-demand, and revenue
  assumptions explicitly hypothesis-based until real GSC, GA4, or first-party
  analytics evidence is added.
- Documented sensitive analytics exclusions for full queries, customer names,
  product names, report text, root cause, corrective action, lessons learned,
  batch numbers, AI prompts, and uploaded file content.
- Added governance coverage for the query map row count, required categories,
  required fields, representative revenue queries, CTA coverage, safe tracking
  events, and privacy boundaries.
- No runtime pages, public marketing copy, payment, checkout, subscription,
  auth, password reset, Resend, export, AI backend, Knowledge Base search,
  production configuration, or database schema changes were made.

## Tests / Verification

- `git diff --check` passed.
- `npx tsc --noEmit` passed.
- `npm run lint` passed with 11 existing warnings and 0 errors.
- `npm run build` passed.
- `npm run test:governance` passed.
- Authenticated smoke is not required because this is a docs/governance-only
  query map with no runtime app changes.

## Risks

- The query map is an operating hypothesis, not search-volume proof. It should
  be enriched later with GSC/GA4 or first-party evidence before making ranking
  or demand claims.
- Publishing too many thin pages would weaken the acquisition strategy. P0
  revenue-near topics should be prioritized before broader supporting content.
- Future tracking must keep metadata bounded to safe enums, counts, page ids,
  categories, CTA names, and formats.

## Unfinished / Needs Human Review

- PR creation, remote checks, and final review are pending.

## Suggested Next Task

After this PR, use the query map to pick a small number of P0 content or service
pages backed by real revenue evidence rather than publishing a broad batch.

## Previous Task

Revenue Evidence Operating System v1.

## Changed Files

- `docs/CURRENT_TASK.md`
- `docs/DEV_LOG.md`
- `docs/REVENUE_EVIDENCE_OPERATING_SYSTEM.md`
- `scripts/team-governance.test.ts`

## Implementation Summary

- Added a docs-only operating system for reviewing revenue evidence after
  Revenue Evidence Sprint v1 reached production.
- Defined the daily checklist for visits, demo downloads, service CTA clicks,
  service lead submits, contact submissions, signup, first report creation,
  export attempts, Knowledge search, editor reuse, and AI Quality Check intent.
- Added weekly decision rules for common funnel patterns such as downloads with
  no leads, CTA clicks with no form submits, signup without first report
  creation, report creation without export, and AI check without export/share.
- Added manual follow-up playbooks for Template Setup, Team Launch, and Assisted
  First 8D / SCAR Delivery leads.
- Defined Week 1, Month 1, and Month 3 early revenue targets.
- Added explicit what-not-to-do guardrails against blind feature expansion,
  low-quality AI article batches, fake traffic, fabricated proof, guaranteed
  customer acceptance, and unlimited free consulting.
- No runtime app behavior, public marketing pages, payment, checkout,
  subscription, auth, export entitlement, AI backend, Knowledge Base permission
  or search logic, production configuration, or database schema was changed.

## Tests / Verification

- `git diff --check` passed.
- `npx tsc --noEmit` passed.
- `npm run lint` passed with 11 existing warnings and 0 errors.
- `npm run build` passed.
- `npm run test:governance` passed.
- Authenticated smoke is not required because this is a docs/governance-only
  operating-system PR with no login runtime changes.
- Production smoke is not required because this PR does not change public
  runtime pages.

## Risks

- The operating system only creates value if reviewed daily and weekly.
- Early revenue targets are directional operating targets, not forecasts.
- Lead follow-up remains manual until real lead patterns justify automation.

## Unfinished / Needs Human Review

- PR creation and remote checks are pending.

## Suggested Next Task

After this PR, create the GEO / SEO Revenue Query Map so content work is driven
by high-intent revenue queries rather than guesses.

## Previous Task

Revenue Evidence Sprint v1.

## Changed Files

- `docs/CURRENT_TASK.md`
- `docs/DEV_LOG.md`
- `scripts/production-smoke.test.ts`
- `scripts/smoke/authenticated-smoke.ts`
- `scripts/team-governance.test.ts`
- `src/app/(app)/admin/metrics/page.tsx`
- `src/app/(auth)/signup/signup-form.tsx`
- `src/app/(marketing)/custom-8d-template-setup/page.tsx`
- `src/app/(marketing)/demo-reports/[type]/page.tsx`
- `src/app/(marketing)/demo-reports/page.tsx`
- `src/app/(marketing)/page.tsx`
- `src/app/(marketing)/pricing/page.tsx`
- `src/app/api/custom-template-requests/route.ts`
- `src/app/api/events/route.ts`
- `src/app/api/sample-reports/[type]/route.ts`
- `src/app/contact/page.tsx`
- `src/components/admin/ServiceRequestsAdmin.tsx`
- `src/components/marketing/ContactLeadForm.tsx`
- `src/components/marketing/CustomTemplateRequestForm.tsx`
- `src/components/report/ExportMenu.tsx`
- `src/lib/analytics-taxonomy.ts`
- `src/lib/analytics.ts`
- `src/lib/service-requests.ts`

## Implementation Summary

- Upgraded homepage service conversion copy while keeping the primary Start free CTA.
- Made Pricing professional services more prominent with Template Setup, Team Launch, and Assisted First 8D / SCAR Delivery inquiry CTAs.
- Added company-format CTAs and Excel downloads to demo report pages.
- Added `format=xlsx` support to demo report downloads and included Excel in demo delivery ZIPs.
- Reworked Template Setup / service lead capture to save leads before non-critical notifications, tolerate file upload failures, and return a user-visible upload warning.
- Added admin and user lead emails with logged, non-blocking failure handling.
- Removed public bucket URL exposure from service request file metadata displays and public submit responses.
- Added safe revenue analytics events, anonymous session id, referrer, and UTM metadata.
- Added a contact lead form using the existing feedback endpoint and `contact_form_submitted` analytics.
- Added an admin-only revenue evidence metrics page for 7/30 day conversion counters.
- Extended production, governance, and authenticated smoke checks for demo downloads, Template Setup lead capture, analytics safety, and admin boundaries.
- No database schema, auth, payment, subscription, real report export entitlement, AI backend, Knowledge Base permission/search, or production configuration changes were made.

## Tests / Verification

- Pending in this branch: `git diff --check`, `npx tsc --noEmit`, `npm run lint`, `npm run build`, `npm run test:governance`, production smoke, and authenticated smoke.

## Risks

- Service notification emails depend on existing email configuration; failures are intentionally logged and non-blocking.
- R2 file upload may be unavailable in smoke or local environments; lead capture must still succeed with a re-upload warning.
- Admin metrics rely on application events and service lead rows; higher traffic may later require dedicated reporting indexes or exports.
- Event metadata now includes referrer, UTM, and anonymous session id; future events must still avoid raw report content, customer/product names, attachment content, full search queries, and payment details.

## Unfinished / Needs Human Review

- PR creation, remote checks, Vercel Preview, and final smoke evidence are pending.

## Suggested Next Task

After deployment, review the first week of revenue evidence metrics before adding more product surface area.

## Previous Task

Product Operating Metrics v1.

## Changed Files

- `docs/CURRENT_TASK.md`
- `docs/DEV_LOG.md`
- `docs/PRODUCT_OPERATING_METRICS.md`
- `scripts/team-governance.test.ts`

## Implementation Summary

- Added a privacy-safe product operating metrics definition for the core funnel from visitor signup through first report creation, D4/D5 completion, knowledge asset creation, Knowledge Base search/copy, editor reuse, AI Quality Check, export/share, and Team/service commercial intent.
- Defined event name/source, source page or component, product reason, safe metadata, forbidden data, and target interpretation for each funnel step.
- Kept metrics tied to existing first-party events and database-derived states where possible instead of adding new runtime tracking.
- Documented sensitive analytics exclusions for full queries, customer/supplier/product/batch identifiers, report content, root cause, corrective action, lessons learned, attachment content, AI prompts/raw output, share tokens, payment details, and email addresses.
- Added governance checks to protect the 10-step funnel, safe metadata dictionary, forbidden fields, existing/future event coverage, database-derived metrics, and the no-runtime-tracking boundary.
- No public marketing pages, payment, checkout, subscription, export, auth, Resend, AI backend, Knowledge Base search logic, production configuration, or database schema changes were made.

## Tests / Verification

- `git diff --check` passed.
- `npx tsc --noEmit` passed.
- `npm run lint` passed with 11 existing warnings and 0 errors.
- `npm run build` passed.
- `npm run test:governance` passed.
- Authenticated smoke is not required because this is a docs/governance-only metrics definition with no runtime app changes.

## Risks

- Some funnel steps, especially D4/D5 completion and knowledge asset creation, should remain database-derived to avoid collecting sensitive field text.
- Checkout completion and service-request reporting require future privacy-safe reporting design before broader dashboarding.
- Metrics should guide product judgment, not replace qualitative review of report-writing workflows.

## Unfinished / Needs Human Review

- PR creation and remote checks are pending.

## Suggested Next Task

After this PR, use the metrics document to decide whether the next runtime priority should be External 8D Request, AI Quality Check context improvements, or Team/service packaging.

## Previous Task

External 8D Request / Supplier Response Loop Spec.

## Changed Files

- `docs/CURRENT_TASK.md`
- `docs/DEV_LOG.md`
- `docs/EXTERNAL_8D_REQUEST_WORKFLOW_SPEC.md`
- `scripts/team-governance.test.ts`

## Implementation Summary

- Completed a read-only audit of current share links, token routes, report permissions, Team roles, workflow locking, Activity Log, and email helpers.
- Confirmed existing report share links are useful reference material but are too broad for External 8D Request because they are report-level, not request-level.
- Documented that future implementation should use dedicated external request records and token tables instead of overloading `report_shares`.
- Added a docs-only MVP workflow for supplier invite, secure link access, assigned-section response, internal review, revision request, acceptance, export, and close.
- Documented permission matrix, token security model, login vs guest decision, ownership, audit logging, email notifications, data exposure rules, abuse/spam risks, future schema needs, smoke strategy, and phased implementation.
- No runtime product feature, public marketing, payment, checkout, subscription, export, auth, Resend configuration, AI, Knowledge Base permission/eligibility, production configuration, or database schema changes were made.

## Tests / Verification

- `git diff --check` passed.
- `npx tsc --noEmit` passed.
- `npm run lint` passed with 11 existing warnings and 0 errors.
- `npm run build` passed.
- `npm run test:governance` passed.

## Risks

- Future runtime implementation requires schema changes and must be reviewed separately.
- Supplier guest access must remain much narrower than current authenticated Team access.
- Email invites need rate limits and safe logging to avoid spam and token leakage.

## Unfinished / Needs Human Review

- None for PR #15.

## Suggested Next Task

After this spec is reviewed, decide whether to implement request records first or define product operating metrics before runtime supplier collaboration.

## Previous Task

Report Completion Knowledge Capture v1.

## Changed Files

- `docs/AUTHENTICATED_SMOKE_TESTING.md`
- `docs/CURRENT_TASK.md`
- `docs/DEV_LOG.md`
- `docs/REPORT_COMPLETION_KNOWLEDGE_CAPTURE_SPEC.md`
- `scripts/smoke/authenticated-smoke.ts`
- `scripts/smoke/seed-auth-smoke.ts`
- `scripts/team-governance.test.ts`
- `src/app/(app)/reports/[id]/page.tsx`
- `src/app/api/events/route.ts`
- `src/components/report/KnowledgeReadinessPanel.tsx`
- `src/components/report/ReportWorkflowPanel.tsx`
- `src/lib/report-steps.ts`

## Implementation Summary

- Read-only audit complete before implementation.
- The most valuable Knowledge Base fields are D4 root cause, D5 corrective action, D6 validation, D7 prevention/system change, and D8 lessons learned.
- Weak or missing values in those fields make future Knowledge Base search, editor reuse, and AI review less useful.
- The lowest-risk product surface is a compact, non-blocking `Knowledge readiness` panel in the report editor and workflow dialog.
- Workflow transitions already have server-side completion checks. This PR does not relax or tighten those checks, does not change workflow eligibility, and does not change save logic.
- Added a pure readiness summary helper for root cause, corrective action, validation, prevention, and lessons learned.
- Added a reusable `KnowledgeReadinessPanel` that shows `Ready`, `Needs detail`, or `Missing`.
- Added a non-blocking workflow warning before moving to approved, submitted, or closed when readiness is weak.
- Added safe analytics events for readiness views and warnings.
- No public marketing, payment, checkout, subscription, export, auth, Resend, AI, Knowledge Base permission/eligibility, production configuration, or database schema changes were made.

## Tests / Verification

- `git diff --check` passed.
- `npx tsc --noEmit` passed.
- `npm run lint` passed with 11 existing warnings and 0 errors.
- `npm run build` passed.
- `npm run test:governance` passed.
- Authenticated smoke workflow on `codex/report-completion-knowledge-capture-v1` passed.
- Authenticated smoke workflow on `main` after merge passed.

## Risks

- Readiness is guidance only, not a formal customer approval standard.
- Existing server-side completion checks remain separate from this panel and can still reject incomplete completion/locking attempts.
- The editor already contains several guidance surfaces, so the panel is intentionally compact.

## Unfinished / Needs Human Review

- None for PR #14.

## Suggested Next Task

After PR #14, decide whether External 8D Request should remain a docs-only spec or wait for more Team workflow validation.

## Previous Task

AI Quality Check Knowledge Context v1.

## Changed Files

- `.github/workflows/authenticated-smoke.yml`
- `docs/AI_QUALITY_CHECK_KNOWLEDGE_CONTEXT_SPEC.md`
- `docs/AUTHENTICATED_SMOKE_TESTING.md`
- `docs/CURRENT_TASK.md`
- `docs/DEV_LOG.md`
- `scripts/smoke/authenticated-smoke.ts`
- `scripts/team-governance.test.ts`
- `src/app/(app)/reports/[id]/page.tsx`
- `src/app/api/ai/report-review/route.ts`
- `src/app/api/events/route.ts`
- `src/components/report/AiReportTools.tsx`
- `src/lib/ai/deepseek.ts`
- `src/lib/ai/knowledge-context.ts`
- `src/lib/ai/report-payload.ts`

## Implementation Summary

- Read-only audit complete before implementation.
- Best injection point: `src/app/api/ai/report-review/route.ts` after report access is resolved and before `callDeepSeekJson`, because that route already owns AI Quality Check permissions, locked-report checks, report data assembly, and unavailable fallback behavior.
- Knowledge Context should reuse `src/lib/report-knowledge.ts` for eligibility, trust labels, field mapping, and search behavior, and reuse `getAccessibleUserIds` for Team workspace scope. No copied permission logic is needed.
- No new Knowledge API is needed. AI Quality Check can use a private server helper and keep `/api/knowledge/search` unchanged and POST-only.
- Safe verification without a real AI key should set the smoke owner as an AI beta user, build Knowledge Context server-side, let the missing-key path return the existing safe unavailable message, and verify the UI context status plus analytics payload safety without calling an external AI provider.
- No database schema migration is needed.
- Added `buildKnowledgeContextForQualityCheck` as a private server helper that reads only accessible reports, excludes the current report, reuses Knowledge Base search/eligibility mapping, and returns at most 3 compact context items.
- Injected bounded Knowledge Context into AI Quality Check input and updated the prompt with reference-only instructions plus a `Knowledge-based observations` output section.
- Updated the AI Quality Check UI to show `Knowledge context used: N similar reports` or `No reusable knowledge context found yet.`
- Preserved the no-real-AI-key fallback: the route returns the existing safe unavailable message plus only `contextCount`/`hasContext`, never prompt or historical report content.
- Added safe analytics events `ai_quality_check_knowledge_context_used` and `ai_quality_check_knowledge_context_empty`.
- Extended authenticated smoke to beta-gate the smoke owner locally, trigger AI Quality Check without a real provider key, verify context/fallback UI, and enforce analytics metadata safety.
- Added the AI Quality Check Knowledge Context spec and governance checks for helper scope, prompt safety, UI states, analytics allowlist, smoke coverage, and no schema/payment/export/auth changes.

## Tests / Verification

- `git diff --check` passed.
- `npx tsc --noEmit` passed.
- `npm run lint` passed with 11 existing warnings and 0 errors.
- `npm run build` passed.
- `npm run test:governance` passed.
- Authenticated smoke workflow on `codex/ai-quality-check-with-knowledge-context-v1` passed.

## Risks

- Historical reports are reference context only; the prompt and UI must not imply AI approval or correctness proof.
- Keyword matching may miss similar reports until future semantic/AI search work exists.
- AI unavailable and no-key paths must not leak prompts, historical report text, or raw query seeds.

## Unfinished / Needs Human Review

- None for PR #13.

## Suggested Next Task

After PR #13, use completion readiness to improve future Knowledge Base and AI context quality.
## Previous Task

Knowledge Reuse in Editor v1.

## Changed Files

- `docs/AUTHENTICATED_SMOKE_TESTING.md`
- `docs/CURRENT_TASK.md`
- `docs/DEV_LOG.md`
- `docs/KNOWLEDGE_REUSE_IN_EDITOR_SPEC.md`
- `scripts/smoke/authenticated-smoke.ts`
- `scripts/team-governance.test.ts`
- `src/app/(app)/reports/[id]/page.tsx`
- `src/app/api/events/route.ts`
- `src/components/knowledge/KnowledgeReusePanel.tsx`
- `src/components/report/StepForm.tsx`

## Implementation Summary

- Added a report editor `Reuse Knowledge` action in the top tool area.
- Added a Knowledge Reuse drawer that reuses the existing POST-only Knowledge Base API.
- Added copy-only reuse for root cause, corrective action, and lessons learned.
- Kept reuse strictly read-only: no report field writes, no report save, no AI generation, and no automatic apply behavior.
- Added contextual hints for D4 root cause, D5 corrective action, D7 prevention, and D8 lessons learned. The D8 hint is the only lessons-learned step hint.
- Open report links from the reuse panel open in a new tab to preserve the current editor context.
- Added safe editor reuse analytics events and allowlist entries.
- Extended authenticated smoke coverage for editor reuse search, eligibility boundaries, copy success/failure, new-tab open behavior, mobile overflow, and analytics payload safety.
- Added governance checks and a dedicated editor reuse spec.
- No public marketing, payment, checkout, subscription, export, auth, Resend, AI backend, Knowledge Base search permission/eligibility logic, production configuration, or database schema changes were made.

## Tests / Verification

- `git diff --check` passed.
- `npx tsc --noEmit` passed.
- `npm run lint` passed with 11 existing warnings and 0 errors.
- `npm run build` passed.
- `npm run test:governance` passed.
- Authenticated smoke workflow on `codex/knowledge-reuse-in-editor-v1` passed.

## Risks

- The editor toolbar is crowded, so the desktop label is compact and mobile uses the button accessible name.
- Search remains v1 keyword search through the existing Knowledge Base API.
- Future AI Quality Check with Knowledge Context should wait until copy-only reuse behavior is validated.

## Unfinished / Needs Human Review

- None for PR #12.

## Suggested Next Task

After PR #12 merges, review Knowledge Reuse analytics to decide whether AI Quality Check should use historical Knowledge Context.

## Previous Task

Authenticated Smoke Workflow Diagnostics Hotfix.

## Changed Files

- `.github/workflows/authenticated-smoke.yml`
- `docs/AUTHENTICATED_SMOKE_TESTING.md`
- `docs/CURRENT_TASK.md`
- `docs/DEV_LOG.md`
- `scripts/smoke/authenticated-smoke.ts`
- `scripts/team-governance.test.ts`

## Implementation Summary

- Masked the runtime-generated `BETTER_AUTH_SECRET` before writing it to `$GITHUB_ENV`.
- Added named smoke-step tracking, completed-step tracking, failed-step tracking, and check status output to the authenticated browser smoke.
- Added a bounded smoke result artifact path for local and workflow runs.
- Added failure artifact writing in the top-level smoke catch path so opaque Playwright failures still upload diagnostics.
- Added redaction for passwords, database URLs, cookie names, long hex secrets, search terms, customer/product/batch values, root cause, corrective action, validation, prevention, and lessons-learned fixture text.
- Improved text-wait timeouts with current URL, named step, and a short redacted body excerpt.
- Made only the Dashboard `What to do next` smoke assertion case-insensitive so uppercase rendering does not fail the workflow while Knowledge Base fixture/content checks remain strict.
- Changed the clipboard-failure smoke stub to string-evaluated browser code so TS helper wrapping does not introduce `__name` into the Playwright page context.
- Documented masking and failure diagnostics in the authenticated smoke runbook.
- Updated governance checks to protect masking, failure artifacts, named diagnostics, redaction boundaries, and cleanup behavior.
- No product feature, public marketing, payment, checkout, subscription, export, AI, Knowledge Base search logic, auth production behavior, production configuration, fixture eligibility rule, or database schema changes were made.

## Tests / Verification

- Re-ran after the Dashboard assertion fix: `git diff --check` passed.
- Re-ran after the Dashboard assertion fix: `npx tsc --noEmit` passed.
- Re-ran after the Dashboard assertion fix: `npm run lint` passed with 11 existing warnings and 0 errors.
- Re-ran after the Dashboard assertion fix: `npm run build` passed.
- Re-ran after the Dashboard assertion fix: `npm run test:governance` passed.
- Re-ran after the Dashboard assertion fix: local fail-closed `npm run smoke:auth` without `SMOKE_DB=true` refused to run and wrote a safe failure artifact with `failedStep: smoke database safety`.
- Pending final rerun after the Dashboard assertion fix: GitHub Actions `authenticated-smoke.yml` on `codex/harden-authenticated-smoke-diagnostics`.

## Risks

- The workflow may still expose a real app-smoke failure after diagnostics are fixed; that should be reported as an app smoke issue rather than hidden by missing artifacts.
- GitHub Actions or Neon outages can still require manual cleanup, so the hotfix branch workflow run must be inspected for deletion.
- Prior failed workflow logs may retain previously exposed runtime secret output in GitHub history; this hotfix prevents new unmasked runtime secret emission.

## Unfinished / Needs Human Review

- Hotfix PR and branch workflow verification are pending.

## Suggested Next Task

After this hotfix merges, use the authenticated smoke workflow as the standard manual readiness check for authenticated app PRs that touch Dashboard, Knowledge Base, report access, or analytics.

## Previous Task

Authenticated Smoke Test Infrastructure v1.

## Previous Changed Files

- `.github/workflows/authenticated-smoke.yml`
- `docs/AUTHENTICATED_SMOKE_TESTING.md`
- `docs/CURRENT_TASK.md`
- `docs/DEV_LOG.md`
- `package.json`
- `scripts/smoke/authenticated-smoke.ts`
- `scripts/smoke/neon-branch.ts`
- `scripts/smoke/reset-smoke-schema.ts`
- `scripts/smoke/seed-auth-smoke.ts`
- `scripts/smoke/smoke-safety.ts`
- `scripts/team-governance.test.ts`

## Previous Implementation Summary

- Added a manual `workflow_dispatch` GitHub Actions workflow for authenticated smoke testing.
- Added Neon API automation to create and delete a temporary `auth-smoke-*` branch.
- Added a smoke database safety helper that requires `SMOKE_DB=true`, explicit smoke/test/preview/local database or branch evidence, and rejects parent-branch use.
- Added a schema reset step for cloned Neon branches before Drizzle initializes the temporary database.
- Added Better Auth smoke seeding for owner/member/outsider users, active Team subscription, Team workspace membership, and report fixtures covering eligible and excluded Knowledge Base cases.
- Added Playwright authenticated smoke coverage for unauthenticated redirects/API boundaries, logged-in navigation, Dashboard discovery, Knowledge Base behavior, workflow panel entry, mobile layout, and safe analytics metadata.
- Added authenticated smoke documentation and governance checks for workflow trigger scope, Neon cleanup, smoke safety guards, fixtures, browser coverage, docs, and secret hygiene.
- No product feature, public marketing, payment, checkout, subscription, export, AI, Knowledge Base search logic, production auth behavior, production configuration, or permanent database schema changes were made.

## Previous Tests / Verification

- `git diff --check` passed.
- `npx tsc --noEmit` passed.
- `npm run lint` passed with 11 existing warnings and 0 errors.
- `npm run build` passed.
- `npm run test:governance` passed.
- Local fail-closed checks passed for smoke scripts without safe smoke inputs.

## Previous Task

Authenticated App Feature Discoverability v1.

## Previous Changed Files

- `docs/CURRENT_TASK.md`
- `docs/DEV_LOG.md`
- `docs/AUTHENTICATED_APP_DISCOVERABILITY_AUDIT.md`
- `scripts/team-governance.test.ts`
- `src/app/api/events/route.ts`
- `src/components/report/ReportWorkflowPanel.tsx`
- `src/app/(app)/dashboard/page.tsx`
- `src/app/(app)/layout.tsx`

## Previous Implementation Summary

- Added persistent authenticated app navigation for Reports, Knowledge Base, and New Report outside the avatar menu.
- Labeled the authenticated workspace home as `Dashboard` in desktop, mobile, and avatar-menu navigation.
- Added a mobile authenticated app navigation bar so Knowledge Base is visible without opening the user menu.
- Changed the authenticated app logo link to `/dashboard` so logged-in users stay in the workspace rather than returning to the public homepage.
- Added a dashboard first-screen workflow panel that explains the path from creating reports, to completing and closing them, to reusing completed reports as quality knowledge.
- Added visible Knowledge Base actions on the dashboard and inside the report workflow panel.
- Added an internal authenticated app feature discoverability audit with stage full-score standards, a 12-feature logged-in audit table, target judgments, acceptable non-primary items, future-only items, and a ready-to-merge checklist.
- Added safe analytics for authenticated app navigation and dashboard feature-entry clicks.
- Clarified Dashboard count labels and the workflow card title so the visible numbers match their data semantics.
- Updated empty-report onboarding to include Knowledge Base reuse as a normal part of the workflow after completion.
- Updated governance checks to protect the new discoverability requirements.
- Updated `docs/CURRENT_TASK.md` from the completed PR #8 task to the current authenticated app discoverability task.
- No auth, payment, checkout, subscription, export, AI, public marketing, Knowledge Base search logic, database schema, or production configuration changes were made.

## Previous Tests / Verification

- `git diff --check` passed.
- `npm run test:governance` passed.
- `npx tsc --noEmit` passed.
- `npm run lint` passed with 11 existing warnings and 0 errors.
- `npm run build` passed.
- Browser smoke passed against local `next dev` with mocked authenticated session and mocked API fixtures only. It verified desktop dashboard navigation, mobile Knowledge Base navigation, the authenticated logo returning to `/dashboard`, the dashboard create -> complete -> reuse prompt, dashboard metric semantics labels, the visible dashboard Knowledge Base link, the report workflow panel Knowledge Base link, no horizontal overflow on desktop or mobile, and safe analytics payloads for `app_navigation_clicked` and `dashboard_feature_entry_clicked`.

## Previous Risks

- Header navigation could become crowded on small screens, so mobile uses a compact secondary app nav row.
- Dashboard copy should remain operational and not become a public-site-style marketing hero.
- Discoverability is improved through navigation and guidance only; no new entitlement or feature behavior is introduced.

## Previous Unfinished / Needs Human Review

- None for PR #9 readiness. Optional product review can still tune copy after merge if usage data suggests it.

## Previous Suggested Next Task

After this PR, consider adding a lightweight onboarding checklist only if usage data shows users still miss the create -> complete -> reuse workflow.

## Previous Task

PR #8 Quality Knowledge Base v1.

## Previous Changed Files

- `docs/CURRENT_TASK.md`
- `docs/DEV_LOG.md`
- `docs/MARKETING_WORKFLOW.md`
- `docs/QUALITY_KNOWLEDGE_BASE_SPEC.md`
- `scripts/team-governance.test.ts`
- `src/app/(app)/knowledge/page.tsx`
- `src/app/(app)/layout.tsx`
- `src/app/api/events/route.ts`
- `src/app/api/knowledge/search/route.ts`
- `src/components/knowledge/KnowledgeBaseClient.tsx`
- `src/lib/report-knowledge.ts`

## Previous Implementation Summary

- Added a logged-in `/knowledge` page for completed 8D report search and reuse.
- Added `src/lib/report-knowledge.ts` to centralize Knowledge Base eligibility, status/report type/priority filtering, safe limit handling, safe report-field extraction, and in-memory search over whitelisted report fields.
- Added POST-only `/api/knowledge/search`, which requires an authenticated user, reuses `getAccessibleUserIds`, accepts whitelisted `query`, `status`, `reportType`, `priority`, and `limit` inputs, and returns eligible completed reports or higher-trust workflow records after excluding draft, in-progress, and internal-review content.
- Adjusted Knowledge Base eligibility after authenticated smoke testing: `status=completed` is the primary entry condition, including legacy completed reports with `workflowStatus=draft`, empty, or unset; `approved`, `submitted`, and `closed` remain higher-trust labels.
- Added result cards showing problem summary, root cause, corrective action, lessons learned, validation, prevention, trust label, report type, revision, priority, and updated date.
- Updated the empty state to `Complete your first report to build your knowledge base.` and the no-result state to `No matching knowledge found.` with the required supporting copy and empty-state CTAs.
- Added copy actions for root cause, corrective action, and lessons learned.
- Added a Knowledge Base entry to the logged-in app menu.
- Added analytics allowlist entries for Knowledge Base search, no-results, result opens, filters, root cause copy, corrective action copy, and lessons learned copy.
- Analytics metadata intentionally records safe operational fields only, such as query length, result count, status/report type/priority filter values, event type, plan, and report id. It does not record full query text, problem, root cause, corrective action, lessons learned, customer, supplier, product, or batch content.
- Updated governance checks to verify Knowledge Base eligibility, access-scope reuse, status/report type/priority/limit filtering, required UI states, safe analytics metadata, required docs, and no share-token dependency.
- Added `docs/QUALITY_KNOWLEDGE_BASE_SPEC.md` and Knowledge Base operating metrics in `docs/MARKETING_WORKFLOW.md`.
- No AI, iOS, External 8D Request, public site redesign, payment, checkout, subscription, export, workflow, database schema, vector database, or attachment parsing changes were made.

## Previous Tests / Verification

- `git diff --check` passed.
- `npx tsc --noEmit` passed.
- `npm run test:governance` passed.
- `npm run lint` passed with existing warnings only.
- `npm run build` passed.
- API verification: `GET /api/knowledge/search` returns `405 Method Not Allowed`, confirming the endpoint is POST-only.
- API verification: unauthenticated `POST /api/knowledge/search` returns `401 Unauthorized`.
- Browser verification: unauthenticated `/knowledge` routes to `/login` with no captured console warnings or errors.
- Authenticated Knowledge Base smoke passed against a temporary isolated Neon branch, which was deleted after testing. The smoke covered empty state, completed legacy workflow eligibility, draft/in-progress/internal-review exclusion, Team access, outsider exclusion, search, filters, result cards, open report, copy success/failure, share-token rejection, analytics metadata safety, and mobile layout.
- Security preflight: changed-file scan found no database schema/migration, payment, export, AI, public marketing runtime, `.env`, `.secrets`, local database, GSC/GA4 CSV, weekly report, Google key, or obvious secret-pattern changes.

## Previous Risks

- Knowledge Base depends on existing Team report access scope. Any future change to `getAccessibleUserIds` affects visible knowledge assets.
- V1 scans recent eligible JSONB report rows in application code. This is conservative and avoids schema migration, but large workspaces may eventually need indexed/materialized search.
- Free users can access their own completed-report Knowledge Base assets; this adds a focused completed-report reuse surface without changing pricing configuration.

## Previous Unfinished / Needs Human Review

- Confirm whether Knowledge Base should remain available to all logged-in users or become a Pro/Team entitlement later.
- Validate copy/reuse language with real completed 8D reports.
- Vercel Preview remains unreachable from this execution environment, so authenticated smoke was completed locally against an isolated temporary database instead.

## Previous Suggested Next Task

After PR #8 deploys, review Knowledge Base usage analytics and decide whether v2 needs indexed search, more filters, or controlled template/action reuse.

## Previous Task

PR #7 content accuracy, analytics integrity, metadata, and functionality-claim hardening.

## Previous Changed Files

Primary areas:

- Public marketing information architecture and shared components.
- Homepage, sample report, resources, FAQ, docs, pricing, and 8D template page.
- Docs topic routes.
- Public SaaS redesign spec and marketing workflow documentation.
- Open Graph and Twitter shared image metadata.
- Public copy evidence audit for export packaging, subscription cancellation, data deletion, and Team workspace deletion claims.

Live GSC / GA4 CSV exports, `data/marketing/weekly_report.md`, Google JSON keys, and `.secrets` remain excluded from Git.

## Merge Notes

- `origin/main` contains PR #6 Google Search Console index hygiene work.
- Conflicts were expected in `docs/CURRENT_TASK.md`, `docs/DEV_LOG.md`, `package.json`, homepage, and `/8d-report-template`.
- Resolution keeps PR #6 sitemap, robots, canonical, redirect, and `npm run check:seo` behavior.
- Resolution keeps PR #7 Marketing Data Pipeline package scripts and analytics taxonomy work.

## Implementation Summary

- Completed a pre-merge hardening pass for PR #7 without changing auth, signup, checkout, subscription logic, database schema, report editor, export generators, ZIP implementation, AI backend gating, credentials, or production configuration.
- Removed public user-facing copy that exposed implementation, indexing, or SEO process language.
- Changed FAQ expansion analytics to `faq_opened` and D0-D8/content expansion analytics to `content_step_opened`; `marketing_cta_clicked` remains reserved for real next-step actions.
- Added Header Start free tracking with `page=global_header`, `location=header`, and `destination=/signup`.
- Removed the duplicate Resources `Industry Examples` filter, added search and filter accessibility attributes, and reset visible results when query or filter changes.
- Added `opengraph-image.tsx` and `twitter-image.tsx`, plus explicit page-level `og:image` metadata where page OpenGraph metadata overrides root metadata.
- Corrected export/ZIP copy to say that the selected report format and attachments download together as a ZIP when attachments exist.
- Updated cancellation and data deletion public copy to avoid claiming unavailable self-service cancellation, report deletion, account deletion, or Team workspace deletion.
- Added copy-template success/failure toast feedback and only records copy analytics after a successful clipboard write.
- Audited docs topic word counts: topics currently range from 73 to 114 visible words and each has unique operational content, but several should be enriched later with screenshots or more specific UI steps.
- Reworked public positioning around: “Finish customer-ready 8D reports without rebuilding them in Excel.”
- Reduced top-level navigation to Product, Examples, Resources, and Pricing.
- Moved FAQ, Docs, Security, Contact, Privacy, and Terms into footer navigation groups.
- Rebuilt the homepage as a concise product-led SaaS page with no testimonials, fake logos, or unverified metrics.
- Rebuilt the sample report page around one interactive D0-D8 viewer instead of repeated card grids.
- Rebuilt resources with featured resources, search, category filters, initial 12-card display, load more, and no raw slug display.
- Rebuilt FAQ as categorized accordions with FAQPage JSON-LD.
- Split docs into `/docs` plus independent topic routes for getting started, report creation, D0-D8 editing, attachments, export/ZIP, sharing, Team workflow, billing, security/data, and AI Quality Check.
- Rebuilt pricing with simplified Free / Pro / Team cards, accurate single export copy, compact comparison, professional services, and billing FAQ.
- Rebuilt `/8d-report-template` as action-first progressive disclosure with a copyable blank template, D0-D8 accordion, common mistakes, format guidance, FAQ, canonical, and schema.
- Added marketing analytics events for CTA clicks, sample downloads, resource opens/filters, pricing plan clicks, and docs topic opens.

## Tests / Verification

- `git diff --check` passed.
- `npx tsc --noEmit` passed.
- `npm run lint` passed with 11 existing warnings and 0 errors.
- `npm run build` passed.
- `npm run test:governance` passed.
- `npm run check:seo` passed with 82 sitemap URLs and 11 redirects checked.
- `npm run marketing:report` passed.
- Playwright desktop/mobile checks passed for `/`, `/sample-report`, `/resources`, `/pricing`, `/faq`, `/docs`, `/docs/getting-started`, `/docs/export-and-zip`, and `/8d-report-template`.
- Playwright verified final rendered document titles with no duplicated site brand, `og:image` and `twitter:image` PNG routes, no framework overlay, no horizontal overflow, FAQ expansion without CTA pollution, D0-D8 step expansion without CTA pollution, Header Start free CTA tracking, resource filters, copy-template success/failure feedback, internal-copy cleanup, and ZIP copy accuracy.

## Risks

- This expands PR #7 from focused entry-page SEO into a broader public SaaS experience redesign, so review should pay special attention to product accuracy.
- GA4 DebugView still needs production verification after deployment.
- Historical generic export events still cannot always be split by PDF / Word / Excel.
- Competitor and GEO strategy still need real B-grade SERP samples.

## Unfinished / Needs Human Review

- Confirm the redesigned public site matches the preferred sales narrative before merging PR #7.
- Verify production analytics events after deployment.
- Continue collecting SERP competitor samples before drawing competitor conclusions.

## Suggested Next Task

After PR #7 deploys, watch GSC / GA4 for a new observation window, verify GA4 event collection, and then prioritize the next SEO / GEO work from the weekly report rather than adding more page copy by instinct.

## Previous Task

Google Search Console index hygiene fix for 404, robots blocked, redirect, and duplicate canonical reports.

## Previous Task Summary

- Added `src/lib/seo-index-hygiene.ts` as the shared source for canonical site URL, indexable static paths, and legacy SEO redirects.
- Updated sitemap generation to use final canonical public paths and SEO content pages.
- Added permanent redirects for legacy SEO aliases.
- Added explicit canonical metadata for public marketing pages.
- Replaced general marketing links to API sample downloads with public sample pages and marked intentional download links with `rel="nofollow"`.
- Added `scripts/check-seo-urls.ts` and `npm run check:seo`.

## Previous Verification

- `git diff --check` passed.
- `npx tsc --noEmit` passed.
- `npm run lint` passed with existing warnings and 0 errors.
- `npm run build` passed.
- `npm run test:governance` passed.
- `npm run check:seo` passed.

## Earlier Task

Marketing Data Pipeline v1 for 8d-reports.com.

## Earlier Task Summary

- Added GSC export, GA4 export, SERP sample template, and weekly report generation scripts.
- Added marketing data dictionary and workflow documentation.
- Added `marketing:gsc`, `marketing:ga4`, and `marketing:report` package scripts.
- Established data reliability grades and conservative operating rules.
- This work intentionally excludes live CSV exports, real weekly reports, and Google credentials from Git.
