# Development Log

## Completed: PR-G6 Customer Review Workspace

- Added a version-frozen `customer-review-v1` authorization snapshot. Customer
  links now receive only human-confirmed English sections, product/supplier
  context, supplier submission time, review version, and evidence IDs that an
  internal human explicitly approved on a confirmed Mapping. Current-session
  mappings override the legacy confirmed-translation compatibility source;
  AI suggestions, Reviewer findings, supplier raw answers, internal notes,
  commercial data, and other-organization content are not copied into the
  snapshot. Existing active customer links using the prior text snapshot remain
  readable through a strict legacy parser.
- Replaced the generic external customer form with an English Customer Review
  Workspace: Supplier Corrective Action Response header, product/issue/
  supplier/submission context, structured Problem/Containment/Root Cause/
  Corrective Action/Verification/Prevention sections, authorized evidence,
  field-local comments, explicit Request Changes, and a two-step acceptance
  confirmation. The completion message states that customer acceptance does
  not close the Case.
- Added field-level Customer Feedback. Every return stores the customer
  participant and organization, task ID, submitted time, affected field,
  field-specific comment, and Case version in both the Case response history
  and immutable activity metadata. Customer Accept and Request Changes now
  commit the Case update, task completion, version snapshot, and activity in a
  single Neon HTTP transactional batch. Accept transitions only to
  `customer_accepted`; Request Changes uses the existing
  `changes_requested_by_customer` → `internal_review` path.
- Added token-scoped evidence download at
  `/api/quality-case-tasks/[token]/evidence/[evidenceId]`. The route requires an
  active, unexpired, unrevoked customer task; verifies the Evidence ID is in
  that task's immutable authorization snapshot and belongs to the same Case;
  and serves it read-only with `private, no-store` and `nosniff`. Customer
  tokens still cannot use the supplier-only upload route.
- Added `customer-review.test.ts` for confirmed-only projection, AI/internal
  data exclusion, Customer Accepted without closure, feedback creation,
  field-comment persistence, token hashing/scope, expiration rejection,
  evidence allowlisting, legacy snapshot compatibility, and no customer upload.
  Extended output tests and disposable authenticated smoke through Supplier →
  Internal Review → Ready for Customer → Customer Token → Request Changes →
  Internal Review → revised Customer Token → Accept.
- Browser verification used the real Next.js page with a fully local
  intercepted authorization snapshot, so no database was contacted. Desktop
  and 390px mobile layouts had zero horizontal overflow; field comments,
  Request Changes, two-step Accept, completion states, and console output were
  verified. Screenshots are stored under `output/playwright/pr-g6/`.
- Checks completed: all Customer Review, Internal Review, Supplier Package,
  Quality Case contract/external/security/service/migration/output/document
  tests; TypeScript; `git diff --check`; governance; full ESLint (0 errors,
  11 pre-existing warnings outside PR-G6); and the production Next.js build.
  The disposable database smoke was expanded and type-checked but not run
  because every required `SMOKE_*` database variable was unset.
- No schema, payment, legacy Report workflow, export, email-send, production
  configuration, or production data was changed. A real disposable-database
  smoke remains a release gate when safe Neon smoke variables are available.
  Suggested next task: PR-G7 Effectiveness Verification Workspace, including
  verification-plan/result separation, evidence due dates, overdue handling,
  human completion, and explicit close/reopen controls.

## Completed: PR-G5 Internal Quality Coordinator Workspace

- Added `reviewSupplierResponsePackage()` and the auditable Quality Reviewer
  Run path. The deterministic baseline detects direct-cause language such as
  “operator error,” training-only actions, missing occurrence/escape logic,
  unlinked evidence, and unresolved information. Optional provider output is
  schema checked and can only add findings, risks, questions, and a suggested
  next action. Results are advisory, contain no score, cannot confirm root
  cause or effectiveness, and have no workflow authority.
- Added a three-column coordinator workspace to the existing Quality Case
  detail page for `supplier_submitted` and `internal_review`: immutable
  supplier answers and unconfirmed AI interpretations on the left, Quality
  Review findings and human mapping confirmation in the center, and explicit
  next actions/customer-draft preparation on the right. Existing 8D output,
  evidence, audit timeline, permissions, and all other Case states remain on
  their prior paths.
- Added `confirmMappingDecision()` with an atomic Neon HTTP batch for the
  human confirmation, semantic mapping decision, and audit activity. It
  validates Case/session/answer/evidence scope and records
  `reportWritePerformed: false`; no legacy Report or `quality_case_texts`
  content is changed. Customer drafts accept only confirmed English mappings
  backed by a human confirmation record and explicitly remain unsent drafts.
- Added owner-only supplier supplement/reinvestigation actions. The
  coordinator must provide a reason, one or more questions, scoped fields, and
  a future deadline. The existing state machine records the manual decision,
  creates a new supplier token task, and returns the questions to the default
  Guided supplier surface without exposing internal notes or commercial data.
- Added the authenticated `/api/quality-cases/[id]/internal-review` boundary
  for workspace reads, Reviewer Runs, mapping confirmation, customer draft
  preparation, explicit workflow decisions, and supplier follow-up. Internal
  Team access is reused; viewers cannot mutate, editors can review/confirm,
  and only the Case owner/coordinator can create an external supplier task.
- Added `internal-quality-review.test.ts` for the six requested review cases,
  AI/provider authority boundaries, confirmed-only draft filtering, state
  transitions, and Report non-pollution guards. Extended external-task tests
  for the allowlisted follow-up projection and expanded the disposable
  authenticated smoke through Package → Internal Review → Reviewer Run →
  Mapping Confirmation → Customer Draft → Guided Supplier Follow-up.
- Checks completed: PR-G5 tests, Supplier Response Package tests, every
  existing Quality Case contract/security/service/migration/output test,
  TypeScript, full ESLint (0 errors; 11 pre-existing warnings), governance,
  Quality Case document export, and production `next build`. Safe smoke
  database variables were not available, so the database/browser smoke was
  prepared and type-checked but not executed; no production database or live
  AI provider was used.
- Residual risk: the inherited external-task creator performs its participant,
  token, Case-version, and activity writes sequentially. The new follow-up
  service reports a recoverable `changes_requested_from_supplier` state if
  task creation fails, but hard transactionality for all external-task
  creation should be a focused infrastructure PR rather than folded into
  PR-G5. Suggested next task: PR-G6 Customer Review Workspace with the same
  confirmed-content allowlist and explicit human acceptance boundary.

## Completed: PR-G4.1 Supplier Response Package Service Layer

- Added `buildSupplierResponsePackage()` as a read-only, token/session-scoped
  domain projection. It aggregates Case/task context, every original answer
  revision, current answers, AI Run provenance and unconfirmed
  interpretations, advisory insights, missing information, evidence
  requirements and explicit answer/insight/stage associations, advisory
  readiness states, and semantic-to-legacy mapping suggestions. It selects
  only evidence uploaded by the current supplier participant and never reads
  or writes a legacy Report.
- Added `submitSupplierResponsePackage()` as the only public supplier-submit
  path for Guided and Expert modes. It requires an explicit supplier
  confirmation, stores the complete package snapshot, serializes concurrent
  retries with a transaction-scoped advisory lock inside the Neon HTTP
  driver's supported transactional batch, creates the existing workflow
  submission audit with package metadata, and invokes
  `submitExternalQualityCaseTask()` inside the same database transaction.
  Provider output cannot confirm root cause, approve, close, generate a final
  customer report, or independently transition the Case.
- Supplier submission is content-addressed and idempotent. Rebuilding an
  unchanged ledger returns the same package id; a completed-token retry returns
  the existing confirmation without creating another confirmation, activity,
  version, or transition. Transaction failure rolls back the confirmation and
  task mutation together. Readiness is explicitly advisory and never blocks a
  supplier from submitting incomplete information for human review.
- Updated the public external-task route so supplier submissions require
  `sessionId`, `guided|expert` mode, and confirmation text, then use the package
  service. The lower-level external task executor rejects direct supplier
  free-text submissions that do not carry package metadata. Customer review
  actions keep their existing path.
- Added `supplier-response-package.test.ts` for complete aggregation, answer
  revisions, AI provenance, evidence links, stable package identity, report
  non-pollution, Guided/Expert shared orchestration, supplier-submitted →
  internal-review contract, retry idempotency, and transaction failure. Added
  `test:supplier-response-package` for repeatable execution.
- Extended the existing disposable authenticated smoke to cover Token,
  Session, Answer, failed-or-accepted AI Run audit, linked Evidence, Package,
  advisory Readiness, Confirmation, Submission Audit, both Guided and Expert
  modes, retry idempotency, and the existing internal review workflow. The
  smoke remains fail-closed behind `SMOKE_DB=true`; no safe smoke database was
  available in this local run, so no database or browser smoke was executed.

## In Progress: PR-G4 Guided Supplier Experience

- Added a supplier-token-scoped Guided session service and
  `/api/quality-case-tasks/[token]/guidance` endpoint. It validates the hashed,
  active supplier task, creates the first Guided session/question only within
  that task's Case, preserves the supplier's original answer revision, and
  invokes the PR-G3 Investigator without granting any workflow authority.
- Supplier links now default to `SupplierGuidedTask`: a Chinese invitation
  summary, one-question-at-a-time AI investigation, plain-language explanation,
  progress, privacy boundary, and an explicit Expert Mode switch. Customer
  review remains on its existing isolated surface.
- AI/provider failure is a safe degradation: the original answer remains
  audited and the supplier is told to continue later or use Expert Mode; no
  AI conclusion is fabricated or submitted.
- Local static checks passed. Real supplier-token and browser flow validation
  remains pending a disposable database with the PR-G2 migration applied.

## Completed: PR-G3 AI Quality Investigator Engine

- Added `src/lib/quality-cases/guided-investigator.ts`, a server-side,
  schema-validated DeepSeek Investigator that is deliberately separate from
  report drafting and the generic Quality Agent chat. It accepts only an
  authorized Case/session/question/answer scope, creates an AI Run before the
  provider call, persists accepted or failed policy outcomes, and stores the
  resulting follow-up question, advisory insights, evidence requirements, and
  proposed semantic mappings in the PR-G2 audit ledger.
- The server computes the investigation state, mandatory direct-cause,
  training-only, inspection-only, and verification follow-ups from PR-G1.
  Model output cannot include root-cause confirmation, report patches,
  workflow actions, approvals, or closure; invalid output is rejected. No
  investigator path writes a Report field or transitions a Quality Case.
- Added authenticated `POST /api/quality-cases/[id]/guidance/investigator`.
  It requires normal internal Case edit access and bounded session/question/
  answer IDs; external token invocation and Guided UI remain later work.
- Added `src/lib/quality-cases/guided-investigator.test.ts` covering valid
  structured output, forbidden report/workflow fields, and the conservative
  investigator prompt. No live provider call or production Case data was used.

## Completed: PR-G2 Guided Investigation Ledger and Reversible Migration

- Added the additive PR-G2 Guided investigation ledger to
  `src/lib/db/schema.ts` and `drizzle/0011_guided_quality_investigation.sql`.
  A Quality Case can now own Guided sessions, question snapshots, append-only
  original-answer revisions, all three types of AI run, advisory insights,
  evidence requirements, human confirmations, and semantic mapping decisions.
- Every AI run persists agent/source type, prompt identifier/version/input
  hash, response JSON, confidence, model identifier when supplied, policy
  outcome, and generated time. The schema has no report/output write column:
  human confirmation and a mapping decision remain separate from any future
  authorized output action.
- Added `drizzle/0011_guided_quality_investigation.rollback.sql`. It drops only
  the eight PR-G2 ledger tables in dependency order and does not touch legacy
  reports, users, workspaces, pre-existing Quality Case tables, exports,
  sharing, permissions, payment, or production configuration.
- Extended the temporary-Neon migration rehearsal to apply 0008–0011 twice,
  validate the Guided audit columns, execute the dedicated rollback, prove
  `quality_cases` remains, then reapply 0011 for downstream smoke. The script
  remains hard-gated by `SMOKE_DB=true` and safe smoke-branch evidence.
- Added `docs/GUIDED_DATA_RETENTION.md` with case-lifetime audit retention,
  closed-Case retention, temporary browser-state boundaries, and the rule that
  no quality fact or AI response belongs in temporary session storage.
- Updated `docs/AUTHENTICATED_SMOKE_TESTING.md` with the up → rollback → reapply
  disposable-database procedure. No database was connected during this local
  implementation because safe smoke credentials were not provided.

## Completed: PR-G1 Guided Quality Experience Domain Contract

- Added `src/lib/quality-cases/guided-contract.ts`: a pure TypeScript contract
  for Guided stages/questions, original human answers, separately unconfirmed
  AI interpretation/suggestions, missing information, evidence requirements,
  advisory-only Quality Insights, semantic answer → quality-concept → output
  mappings, completion checks, and the three future Quality Coach data
  contracts.
- The mapping layer targets semantic output keys first and exposes legacy 8D
  fields only as human-confirmation-required compatibility references. This
  keeps Guided Mode usable for SCAR, CAR, CAPA, NCR Response, and customer
  templates without allowing a question or AI output to write a report field.
- Added `src/lib/quality-cases/guided-contract.test.ts` with deterministic
  coverage for stages, direct-cause/training/inspection/effectiveness
  follow-ups, conservative answer classifications, evidence requirements,
  completion gaps, future-output mappings, and the no-workflow-authority Coach
  boundary. No AI provider call is made.
- This PR-G1 slice makes no database, route, UI, report-data, export, share,
  permission, payment, environment, or production configuration change.

## Completed: Guided Experience Product Specification

- Added `docs/GUIDED_EXPERIENCE_PRODUCT_SPEC.md`, turning the Guided Experience
  audit into an implementation-ready product specification. It defines role
  boundaries, three complete journeys, ordinary-language Guided stages and
  report mappings, ten representative quality cases, separated Investigator /
  Quality Reviewer / Customer Simulator prompt responsibilities, mandatory AI
  safeguards, UI wireframes, Expert Mode coexistence, additive data design,
  twenty AI quality tests, acceptance criteria, sequencing, and release risks.
- This documentation-only task makes no code, schema, route, export, payment,
  permission, provider, environment, or production-data change.

## Planned: Guided Experience Redesign Audit

- Audited Quality Case persistence, legacy 8D field mapping, current AI draft
  and review routes, and internal/external authorization boundaries for the
  requested AI Quality Engineer experience.
- Added `docs/GUIDED_EXPERIENCE_AUDIT.md` with the Guided/Expert decision,
  additive migration approach, six independently revertible PR slices, field
  mapping, permission impact, and browser acceptance evidence. No product,
  schema, payment, export, share, AI-provider, or production configuration was
  changed in this audit step.

## Work In Progress: Quality Case Platform PR1–PR4 Core Collaboration

### Changed Files

- `src/lib/quality-cases/contract.ts`
- `src/lib/quality-cases/contract.test.ts`
- `src/lib/quality-cases/access.ts`
- `src/lib/quality-cases/task-tokens.ts`
- `src/lib/quality-cases/external-projection.ts`
- `src/lib/quality-cases/security.test.ts`
- `src/lib/quality-cases/service.ts`
- `src/lib/quality-cases/service.test.ts`
- `src/lib/quality-cases/external-tasks.ts`
- `src/lib/quality-cases/external-tasks.test.ts`
- `src/lib/db/schema.ts`
- `drizzle/0008_quality_case_foundation.sql`
- `drizzle/0009_p0_plus_quality_case_conversion.sql`
- `drizzle/0010_quality_case_task_authorized_response.sql`
- `src/lib/quality-cases/migration.test.ts`
- `src/lib/p0-plus/convert-case.ts`
- `src/app/api/p0-plus/preview/[token]/convert-case/route.ts`
- `src/components/p0-plus/P0PlusContinueActions.tsx`
- `src/components/marketing/P0PlusIntake.tsx`
- `src/lib/p0-plus/preview-ui.ts`
- `src/lib/p0-plus/preview-ui.test.tsx`
- `src/lib/p0-plus/preview-ui.ts`
- `src/lib/p0-plus/preview-ui.test.tsx`
- `src/components/LocaleProvider.tsx`
- `src/components/LangSwitcher.tsx`
- `src/app/(auth)/login/login-form.tsx`
- `src/app/(auth)/signup/signup-form.tsx`
- `src/app/(auth)/layout.tsx`
- `src/components/marketing/MarketingHeader.tsx`
- `src/components/marketing/MarketingFooter.tsx`
- `src/components/marketing/P0PlusIntake.tsx`
- `src/components/marketing/PlanCard.tsx`
- `src/components/LangSwitcher.tsx`
- `src/app/zh/layout.tsx`
- `src/app/zh/page.tsx`
- `src/app/zh/pricing/page.tsx`
- `src/app/(app)/layout.tsx`
- `src/messages/en.json`
- `src/messages/zh-CN.json`
- `src/app/api/quality-cases/route.ts`
- `src/app/api/quality-cases/[id]/route.ts`
- `src/app/api/quality-cases/[id]/workflow/route.ts`
- `src/app/api/quality-cases/[id]/tasks/route.ts`
- `src/app/api/quality-case-tasks/[token]/route.ts`
- `src/app/api/quality-case-tasks/[token]/evidence/route.ts`
- `src/app/api/quality-case-tasks/[token]/claim/route.ts`
- `src/app/api/quality-cases/[id]/tasks/[taskId]/route.ts`
- `src/app/api/quality-case-evidence/[id]/route.ts`
- `src/app/(app)/cases/page.tsx`
- `src/app/(app)/cases/[id]/page.tsx`
- `src/components/quality-cases/QualityCasesWorkspace.tsx`
- `src/components/quality-cases/DashboardQualityCaseSummary.tsx`
- `src/app/(app)/dashboard/page.tsx`
- `src/components/quality-cases/QualityCaseDetail.tsx`
- `src/components/quality-cases/AssigneeSelector.tsx`
- `src/components/quality-cases/ExternalTaskComposer.tsx`
- `src/components/quality-cases/ExternalTaskLinks.tsx`
- `src/components/quality-cases/WorkflowActionPanel.tsx`
- `src/components/quality-cases/OutputComposer.tsx`
- `src/lib/quality-cases/outputs.ts`
- `src/lib/quality-case-word-export.ts`
- `src/lib/quality-case-word-export.test.ts`
- `src/lib/quality-cases/output-content.ts`
- `src/lib/quality-cases/output-content.test.ts`
- `src/app/api/quality-cases/[id]/outputs/8d/route.ts`
- `src/app/api/quality-cases/[id]/texts/route.ts`
- `src/components/quality-cases/BilingualContentPanel.tsx`
- `src/components/quality-cases/ExternalTaskPage.tsx`
- `src/app/supplier/[token]/page.tsx`
- `src/app/customer-review/[token]/page.tsx`
- `src/app/(app)/layout.tsx`
- `src/proxy.ts`
- `docs/QUALITY_CASE_PLATFORM_FOUNDATION.md`
- `docs/QUALITY_CASE_RELEASE_AUDIT.md`
- `docs/AUTHENTICATED_SMOKE_TESTING.md`
- `scripts/smoke/rehearse-quality-case-migrations.ts`
- `scripts/smoke/authenticated-smoke.ts`
- `.github/workflows/authenticated-smoke.yml`
- `scripts/team-governance.test.ts`
- `docs/DEV_LOG.md`

### Implementation Summary

- Added a database-independent Quality Case state-machine contract for the
  customer complaint → supplier response → internal review → customer review
  → effectiveness verification → closure lifecycle.
- Enforced the product safety rule that `customer_accepted` cannot close a
  case; internal effectiveness verification must occur before a separately
  authorized close action.
- Defined the audit-event payload, external-task allowlist, internal-only
  data categories, bilingual source/AI/confirmed text model, and overdue
  semantics for the persistence and UI PRs that follow.
- Added additive Quality Case tables for case records, participants, report
  output links, immutable version snapshots, activities, task links, evidence,
  and bilingual field text. No legacy report table was altered.
- Added an explicit `pgcrypto` extension guard to the not-yet-applied Quality
  Case migration because the SQL uses `gen_random_uuid()`. Added a read-only
  migration safety gate which verifies additive-only Case tables, token and
  visibility safety, P0+ nullable conversion linkage, and absence of
  destructive SQL against legacy tables. It never opens a database connection.
- Added an internal access helper that reuses only existing Team-workspace
  boundaries, plus separate cryptographically random task-token hashing,
  expiry/revocation/completion checks, and allowlist-only external projections.
- Added authenticated Quality Case APIs for manual creation, queue listing,
  detail loading, and guarded workflow transitions. State updates use a
  compare-and-set status write and record a new version plus audit activity.
- Added Chinese-first `/cases` dashboard and `/cases/[id]` case workspace with
  all required states, queue counts, current waiting party, next action,
  deadline, overdue signal, participants, and immutable audit timeline.
- Case detail now also renders the deadline state inline as not overdue,
  due-today/due-soon, or overdue by a precise day count, rather than forcing
  the coordinator to infer status from the date alone.
- New Cases now explicitly assign the creating coordinator as the responsible
  internal owner. Case detail resolves and displays that person; older Cases
  safely fall back to the Case owner until reassignment is added in a later
  focused workflow slice.
- Added controlled internal reassignment for Case owners and editors. Only
  active Owner/Editor workspace members are selectable; Viewers are rejected
  server-side. Each reassignment writes a new immutable Case version and an
  `assignee_changed` audit activity. When an authorized Team editor acts on a
  Case for the first time, the service records them as an internal participant
  under the coordinator organization before proceeding, so the same Team
  boundary used for reading is valid for workflow participation as well.
- Reframed the existing authenticated Dashboard as a Quality workbench without
  removing the legacy report list. Its first actionable section now shows the
  Quality Case queues for internal review, supplier/customer waiting states,
  returns, approaching/overdue deadlines, effectiveness verification, and
  closure, with direct access to create or review Cases.
- Completed the authenticated Dashboard's visible Chinese mode without
  changing report, Team, quota, checkout, or search behavior. The workbench,
  report guidance, upgrade prompt, team controls, search/empty states, table
  labels, workflow states, and priorities now follow the independently chosen
  UI language. The app navigation, plan badge, account menu, and loading state
  use the same language choice, while English remains unchanged for English
  users.
- Added `/cases` to the server-side protected-path boundary. Anonymous access
  now redirects directly to login with a safe callback URL.
- Added revocable, expiring, hash-only external task links. Internal owners can
  create a Chinese supplier response link or English customer review link only
  in workflow-appropriate states; raw tokens are returned only once.
- Added public minimal-projection routes and no-registration task pages.
  Supplier submission moves the Case to internal review; customer acceptance
  moves it only to `customer_accepted`; customer change requests return it for
  internal processing. External roles cannot close or reopen a Case.
- Added supplier-scoped evidence upload with file allowlists and a 10MB limit.
  Each evidence object is bound to the current Case and task participant;
  submission can only attach evidence IDs owned by that participant. New
  evidence defaults to internal visibility and is not automatically shown to a
  customer.
- External supplier submissions and customer decisions now preserve content
  diffs in their immutable activity records, not merely a status change.
  Repeated customer change requests append to the prior request history rather
  than overwriting it. The internal audit timeline renders bounded before/after
  summaries so reviewers can see what was changed without exposing those
  details to external task links.
- Added a separate P0+ preview-to-Quality-Case conversion route. It requires a
  human-confirmed coordinator organization, preserves conservative preview
  facts/missing-information metadata as internal Case context, and keeps the
  existing preview-to-Report conversion unchanged for compatibility.
- Added safe local text-file intake to the P0+ complaint entry. `.txt`, `.md`,
  `.eml`, and `.csv` files are read into the existing bounded preview textbox
  and must pass the same concrete-detail/character validation as pasted text.
  PDF, Word, and image files are explicitly not claimed to be parsed; users
  receive a clear paste-an-excerpt fallback instead.
- Expanded the client-side P0+ intake to extract the literal main-document text
  from a bounded `.docx` file in the browser. The original file is never sent
  to the preview API; the same character and fact-detail validation applies to
  the extracted text. PDF, images, and legacy `.doc` remain explicitly
  unsupported rather than being misrepresented as parsed/OCR content.
- Fixed persisted user language selection without making the static marketing
  surface dynamic. A client locale provider reads the existing locale cookie
  after hydration, while the server keeps SEO pages statically generated.
  Login and signup plus email-verification text now use the bilingual auth
  dictionary; language controls are present on marketing, auth, and app shells.
- Supplied an explicit UTC time zone to the shared `next-intl` provider. This
  removes the framework's server-rendered `ENVIRONMENT_FALLBACK` warning during
  static generation without changing Case deadline calculations, which use the
  browser's local clock in the Case UI.
- Added independent, statically generated Chinese acquisition routes at `/zh`
  and `/zh/pricing`, with Chinese navigation, footer, pricing copy, accurate
  plan limits, and a Chinese P0+ guest-intake surface when the existing feature
  flag is enabled. English `/` and `/pricing`, their canonical URLs, checkout,
  and existing SEO content remain unchanged. Marketing-language switching now
  maps these two English/Chinese page pairs rather than relying on a request
  locale that would make public SEO pages dynamic.
- Added the internal workflow action panel to Case detail. It exposes only
  state-valid actions, sends all writes through the server-side state machine,
  and requires return comments/field IDs/due dates plus close/reopen comments
  before the corresponding transition can be requested.
- Added account-claim and revocation service boundaries for external tasks.
  A completed external participant can carry the raw token through signup to
  claim the task in their own account; claiming never grants access to the
  originating Case. Coordinators can revoke an active task through a
  case-scoped, authenticated endpoint.
- Added coordinator-facing external-link status cards on Case detail. Raw
  tokens remain unavailable after their one-time creation response, while the
  coordinator can see the intended party, expiry, completion/revocation state,
  and revoke only a still-active link. The service now also rejects attempts to
  revoke completed or expired links.
- Added the internal evidence review surface and private evidence download
  route. The route rechecks authenticated Case access before reading R2, uses
  attachment-safe response headers, and does not automatically authorize any
  customer task link to see supplier evidence.
- Added a Quality Case → existing 8D output adapter. It creates a normal,
  quota-governed report with only safe Case fields and stores the output link
  separately, preserving all existing report editing/export/payment behavior.
- Added an output-type guard around that adapter. Cases configured as SCAR,
  CAR, CAPA, NCR Response, or Corrective Action Report cannot silently create
  an incompatible 8D artifact; the UI keeps collaboration available and states
  that the dedicated template is not yet enabled. This is intentional product
  safety, not a claim that non-8D exports are already implemented.
- Added a dedicated, authenticated DOCX output for non-8D Case types (SCAR,
  CAR, CAPA, NCR Response, and Corrective Action Report). It is Pro/Team
  gated, records an export audit event, uses only the confirmed English /
  bilingual field mappings, deliberately omits internal evidence by default,
  and does not reuse or mutate legacy report records or export routes.
- Hardened customer-review delivery so a task link cannot use raw supplier
  response, Chinese source text, or an AI draft as its customer-facing
  payload. Creating a customer task now requires a human-confirmed English
  complaint summary and snapshots the approved English sections into the task
  record. Existing customer links without that snapshot fail safely and must
  be reissued. Customer return now requires selecting at least one of the
  sections actually authorized to that customer, producing meaningful
  requested-field audit data rather than a generic placeholder.
- Hardened that output adapter with explicit English and bilingual modes. The
  D2 complaint summary uses only an internal user's confirmed English text for
  English output, or the original plus that confirmed English text for
  bilingual output. An AI draft is deliberately ignored, and output creation
  is blocked with an actionable error until the human confirmation exists.
- Expanded the compatibility adapter from D2 alone to controlled D2–D8
  mappings for complaint, containment, confirmed root cause, corrective
  action, implementation, effectiveness method, prevention, and lessons
  learned. The Case editor now stores each field's source, AI draft, and
  confirmed English independently; only the confirmed text enters an English
  output, while bilingual output preserves source plus confirmed English.
- Activated original, AI-draft, and human-confirmed translation persistence
  through authenticated Case text APIs and the Case detail editor. Confirmed
  translations include the acting user and timestamp; the UI explicitly keeps
  AI draft text out of final customer output until a human confirms it.
- Added deterministic coverage for all required statuses, returns, external
  visibility isolation, confirmed-translation selection, overdue state, and
  the customer-acceptance/closure separation.
- Completed the internal audit projection for the required actor identity.
  Case detail now joins internal activity actors to their user name/email and
  preserves an external participant's invited display name in activity metadata.
  The timeline shows actor, organization, timestamp, version, comment, field
  diff, and evidence references to authorized internal users only; public task
  links still use their separate allowlist projection and cannot read it.
- Expanded the internal timeline to surface the requested-change field list,
  operation-specific due date, and links to each evidence object recorded on an
  activity. It uses the existing authenticated evidence-download route and
  renders a neutral unavailable state if a referenced object no longer exists
  or is not returned to the authorized reviewer.
- Extended the manual, temporary-Neon-branch authenticated smoke workflow with
  a real Quality Case migration rehearsal. After baseline schema initialization,
  it removes only the new Case tables and P0+ Case-link column from the already
  empty disposable branch, applies both repository-owned Quality Case SQL files
  for first creation and then again for idempotence, and verifies required
  tables, `pgcrypto`, internal evidence visibility, and the nullable P0+
  conversion link. The scripts retain the existing explicit `SMOKE_DB=true`
  safety gate and never load a local `.env`.
- Extended the same browser smoke with an authenticated coordinator-created
  SCAR Case. It exercises two supplier links, supplier submission and return,
  two customer links, customer return and acceptance, effectiveness
  verification, closure, reopening, and activity-log presence. It also checks
  that an unauthenticated supplier task projection excludes internal notes, AI
  risk assessment, commercial information, and other supplier data.
- Did not alter existing report routes, report data, auth, payment, exports,
  P0+ behavior, production configuration, or public pages. The new database
  schema is additive and its migration has not been run in any environment.
- Added a requirement-by-requirement release-audit matrix that separates
  implementation evidence from disposable-environment and production evidence,
  records intentionally unsupported document formats/output layouts, and
  defines the no-production-data staged release sequence.

### Tests / Verification

- `npx tsx src/lib/quality-cases/contract.test.ts` passed.
- `npx tsx src/lib/quality-cases/security.test.ts` passed.
- `npx tsx src/lib/quality-cases/service.test.ts` passed.
- `npx tsx src/lib/quality-cases/external-tasks.test.ts` passed.
- `npx tsx src/lib/quality-cases/output-content.test.ts` passed; it proves an
  AI-only draft cannot enter an English output and that bilingual output uses
  the confirmed translation rather than the AI draft.
- The output-content test also covers D3–D8 field mapping in both English and
  bilingual modes and proves optional AI-only content is omitted.
- `npm run test:quality-case-migration` passed.
- `npm run test:quality-case-document` passed with a real generated DOCX
  package.
- Re-ran the Quality Case contract, isolation, service, and external-task
  suites after the task-link UI/service hardening; all passed.
- Re-ran the Quality Case contract, service, and external-task suites after
  responsible-owner display was added; all passed.
- Re-ran the Quality Case contract, service, visibility-isolation, and
  external-task suites after internal assignee/reassignment hardening; all
  passed. Service tests assert that only owner/editor roles are assignable.
- External-task tests now verify repeated customer-return history is preserved
  and supplier response changes carry a content diff.
- Re-ran TypeScript plus contract, security, service, external-task, and
  governance suites after the audit actor projection change; all passed.
- Re-ran TypeScript, contract, external-task, and governance checks after the
  timeline began rendering requested fields, due dates, and evidence links;
  all passed.
- Output-content tests now verify that customer review rejects AI-only content
  and that an authorized customer payload uses only human-confirmed English;
  source Chinese and AI drafts are excluded. The disposable browser smoke now
  also verifies that customer-task creation is blocked before confirmation and
  that its public projection contains neither draft nor supplier free-form text.
- `npx tsc --noEmit` passed.
- `npm run lint` passed with 11 existing warnings and 0 errors.
- `npm run build` passed; the Quality Case APIs and `/cases` routes are present
  in the production route manifest.
- `npm run test:p0-plus` and `npx tsx src/lib/p0-plus/convert.test.ts` passed;
  the P0+ Quality Case conversion route is included in the production manifest.
- `npm run test:p0-plus-ui` passed after text-file intake validation was added.
- Re-ran `npm run test:p0-plus-ui` and `npm run test:p0-plus` after local DOCX
  extraction was added; both passed. The UI test verifies local text-file
  extraction, DOCX XML text/paragraph handling, supported-file boundaries, and
  rejection of PDFs.
- `npm run test:governance` passed after the Quality Case smoke rehearsal and
  bilingual application navigation expectations were added.
- `npm run smoke:db:rehearse-quality-case` was run without smoke environment
  variables and failed closed before any database connection, with the expected
  `SMOKE_DB=true is required` message.
- Browser regression: unauthenticated `/cases` redirects server-side to
  `/login?callbackUrl=%2Fcases`; an invalid public supplier token renders only
  the generic unavailable state and exposes no Case fields.
- Browser regression: switching login from English to Chinese updates the
  login labels, actions, feedback control, and language toggle. Production
  build confirms public SEO routes remain static/SSG rather than becoming
  fully dynamic.
- Browser regression: `/zh` and `/zh/pricing` render Chinese headings,
  navigation, CTAs, pricing limits, and footer links; a 390px mobile viewport
  has no visible horizontal overflow in the Chinese hero. Switching `/zh/pricing`
  with the visible `EN` control lands on `/pricing`.
- Browser regression: with the existing P0+ flag explicitly enabled in a
  local-only development instance, `/zh` renders the Chinese file-import
  control, accepted text-format boundary, bounded-input copy, and the same
  conservative AI limitation statement. No complaint was submitted and no AI
  request was made during the check.
- `git diff --check` passed.
- After the Chinese routes were added, `npx tsc --noEmit`, `npm run lint`,
  `npm run build`, and `git diff --check` passed. The production manifest
  lists `/zh` and `/zh/pricing` as static routes.
- After Dashboard and app-shell localization, `npx tsc --noEmit`, `npm run
  lint`, `npm run build`, and `git diff --check` passed again. ESLint reports
  only the same 11 pre-existing warnings and no errors.

### Risks / Next Step

- The additive migration is not applied in a disposable database yet; no
  production or local production-like data was modified in this work.
- The bilingual 8D compatibility adapter covers the principal D2–D8 narrative
  fields but does not yet map every legacy field, attachment placement, or
  non-8D output template. Non-8D Cases now have a controlled generic DOCX
  response, but not customer-specific SCAR/CAR/CAPA layouts or evidence-package
  assembly. The evidence, account claim,
  and task-revocation boundaries also still need a disposable-environment
  integration test against real object storage and the additive schema.
- Assignment requires the existing active Team membership boundary; there is
  no separate Case-only invitation path. Real Team-member reassignment and
  workflow participation still need controlled-environment integration tests.
- The existing anonymous report-share flow remains unsuitable for this workflow
  because it is broader than a task-scoped external authorization boundary.
- The newly localized authenticated workbench has build/type coverage but has
  not been visually exercised with a real Chinese authenticated account in a
  controlled environment; no credentials or production data were used.
- DOCX intake deliberately extracts only `word/document.xml` text and does not
  promise layout preservation, PDF parsing, image OCR, or attachment storage.
  A customer needing those formats receives the explicit paste-excerpt path;
  adding server-side document/OCR processing would need separate privacy,
  malware-scanning, retention, and provider review.
- The new Quality Case migration and three-party browser smoke are wired into
  the manual disposable-Neon workflow but have not run here because no explicit
  smoke branch credentials/configuration are present. Production migration and
  feature enablement remain prohibited until that run succeeds and its artifact
  is reviewed.

## Latest Task

P0+ PR5 E2E smoke, hardening, and Preview environment validation checklist.

## Changed Files

- `docs/P0_PLUS_PREVIEW_VALIDATION.md`
- `scripts/p0-plus-smoke.test.ts`
- `package.json`
- `docs/DEV_LOG.md`

## Implementation Summary

- Added a P0+ validation checklist for local and Vercel Preview environments.
- Documented PR1-PR4 preconditions, required local/Preview env, manual validation steps, rollback, privacy notes, and expired preview cleanup status.
- Added a coverage matrix mapping the P0+ minimum loop to existing tests and manual validation.
- Added `npm run test:p0-plus-smoke`, a lightweight `tsx` runner that executes the existing P0+ schema, preview API, UI, and conversion tests without calling a real AI provider.
- The smoke runner deletes `P0_PLUS_PREVIEW_ENABLED` from child-process env so the default-disabled baseline is preserved while individual tests still exercise enabled cases with mocks.
- Did not modify runtime routes, components, AI backend, database schema, export templates, payment, share links, team permissions, report editor UI, production env, Vercel env, SEO/content pages, or stash.

## Tests / Verification

- `npm run test:p0-plus` passed.
- `npm run test:p0-plus-preview` passed.
- `npm run test:p0-plus-ui` passed.
- `npx tsx src/lib/p0-plus/convert.test.ts` passed.
- `npm run test:p0-plus-smoke` passed.
- `npm run lint` passed with 11 existing warnings and 0 errors.
- `npm run build` passed.
- `git diff --check` passed.

## Risks

- PR5 documents Preview validation but does not itself prove a live Vercel Preview environment has the feature flag, migrations, AI provider, database, and auth configured correctly.
- Expired preview rows fail safely at lookup time, but automatic deletion is still a future cleanup task.

## Unfinished / Needs Human Review

- Run the documented manual validation path in a local or Vercel Preview environment before enabling the feature anywhere beyond test environments.
- Confirm production launch timing separately; PR5 does not enable production.

## Suggested Next Task

After PR5 is reviewed, run the documented Preview validation checklist in a controlled non-production environment. Do not start P1 file parsing, supplier links, one-click AI fixes, or production feature-flag rollout until explicitly approved.

## Previous Task

P0+ PR3 homepage guest intake UI and read-only preview page.

## Changed Files

- `src/lib/p0-plus/limits.ts`
- `src/lib/p0-plus/config.ts`
- `src/lib/p0-plus/preview-ui.ts`
- `src/lib/p0-plus/preview-ui.test.tsx`
- `src/components/marketing/P0PlusIntake.tsx`
- `src/components/p0-plus/P0PlusPreviewContent.tsx`
- `src/app/(marketing)/page.tsx`
- `src/app/p0-plus/preview/[token]/page.tsx`
- `package.json`
- `docs/DEV_LOG.md`

## Implementation Summary

- Added a server-gated homepage P0+ intake module that only renders when
  `P0_PLUS_PREVIEW_ENABLED` is enabled. The default disabled state keeps the
  existing homepage experience and does not expose a public preview entry.
- Added client-side intake validation and submit handling for empty/short input,
  oversized input, loading state, disabled/rate-limit/generation errors, output
  language selection, and success navigation to `/p0-plus/preview/[token]`.
- Added a read-only preview page that uses the PR2 preview service, returns
  `notFound()` when the feature flag is disabled or the token is invalid, and
  renders case summary, D0-D8 draft fields, source status labels, readiness
  checks, missing information, required evidence, clarification questions, and
  next actions.
- Added a client-safe P0+ limits module so UI helpers do not import server env
  feature-flag code.
- Added lightweight `tsx` + `node:assert` UI/helper coverage for homepage flag
  rendering, input validation before API calls, success token handling,
  disabled/rate-limit/error prompts, and read-only preview payload rendering.
- Did not add login handoff conversion, convert-to-report, formal report
  creation, quota consumption, report editor changes, existing AI endpoint
  changes, auth/signup/login mechanism changes, payment, export, share links,
  team permission changes, production feature flag changes, Vercel env changes,
  stash restore, or SEO/content page changes beyond the homepage flag-gated
  mount.

## Tests / Verification

- `npm run test:p0-plus-ui` passed.
- `npm run test:p0-plus-preview` passed.
- `npm run test:p0-plus` passed.
- `git diff --check` passed.
- `npm run lint` passed with 11 existing warnings and 0 errors.
- `npm run build` passed.

## Risks

- The homepage intake and preview page remain hidden until the feature flag is
  enabled in an environment with the PR2 migration and AI provider configured.
- This PR intentionally stops at read-only preview. Authenticated conversion to
  a saved report still needs a later PR.

## Unfinished / Needs Human Review

- Review copy and layout before enabling `P0_PLUS_PREVIEW_ENABLED` outside local
  testing.
- Define the PR4 conversion/login handoff contract before connecting this
  preview to saved reports.

## Suggested Next Task

After this PR is reviewed and merged, start the next P0+ PR from updated `main`
and keep it scoped to login handoff / convert-to-report only if approved.

## Previous Task

P0+ PR2 guest preview API, temporary preview storage, and anonymous rate limiting.

## Changed Files

- `drizzle/0006_p0_plus_previews.sql`
- `src/lib/db/schema.ts`
- `src/lib/p0-plus/config.ts`
- `src/lib/p0-plus/tokens.ts`
- `src/lib/p0-plus/storage.ts`
- `src/lib/p0-plus/rate-limit.ts`
- `src/lib/p0-plus/ai.ts`
- `src/lib/p0-plus/preview-service.ts`
- `src/lib/p0-plus/preview-service.test.ts`
- `src/app/api/p0-plus/preview/route.ts`
- `src/app/api/p0-plus/preview/[token]/route.ts`
- `package.json`
- `docs/DEV_LOG.md`

## Implementation Summary

- Added a dedicated `p0_plus_previews` temporary preview table and Drizzle
  schema definition. The table stores only token hashes, bounded raw input,
  preview JSON, hashed limiter keys, expiry, and optional future conversion
  reference.
- Added hidden API routes for `POST /api/p0-plus/preview` and
  `GET /api/p0-plus/preview/[token]`.
- Added `P0_PLUS_PREVIEW_ENABLED`, which defaults disabled. When disabled,
  the public preview API returns a disabled response before parsing input,
  calling AI, or creating preview rows.
- Added an isolated P0+ anonymous limiter for body size, visible text length,
  IP key, and browser token key.
- Added preview-safe AI service using the PR1 P0+ AI contract and schema
  validation. It uses only submitted text plus output language and does not
  query private reports, team data, history, or knowledge context.
- Added preview-service tests with mock AI/storage/limiter coverage for disabled
  flag, valid preview creation, short/oversized input, rate limiting, invalid AI
  output, unknown/expired token lookup, and privacy fields.
- Added PR review hardening for route-level oversized body rejection before
  parsing JSON, bilingual output language normalization, and sanitized
  `conversion.reportDataPatch` storage/response payloads.
- Did not add homepage UI, preview page UI, login handoff, report conversion,
  report creation changes, existing AI endpoint changes, auth/signup/login
  changes, payment, export, share, team permission changes, SEO/content pages,
  or stash restore.

## Tests / Verification

- `npm run test:p0-plus-preview` passed.
- `npm run test:p0-plus` passed.
- `git diff --check` passed.
- `npm run lint` passed with 11 existing warnings and 0 errors.
- `npm run build` passed.

## Risks

- Preview storage is hidden behind the disabled-by-default feature flag, but
  enabling it in an environment requires running the new database migration and
  ensuring AI provider configuration is present.
- The anonymous limiter is isolated and intentionally small. It can be moved to
  durable storage later without changing route shape.

## Unfinished / Needs Human Review

- Confirm migration rollout plan before enabling `P0_PLUS_PREVIEW_ENABLED`.
- Review whether PR3 should add the preview page or homepage intake first.

## Suggested Next Task

After this PR is reviewed and merged, start the next P0+ PR from updated `main`
and keep it scoped to either hidden preview UI or login handoff per the approved
breakdown.

## Previous Task

P0+ PR1 AI expert brain, schema, mapper, and deterministic fixtures.

## Changed Files

- `src/lib/p0-plus/schema.ts`
- `src/lib/p0-plus/prompts.ts`
- `src/lib/p0-plus/mapper.ts`
- `src/lib/p0-plus/__fixtures__/helpers.ts`
- `src/lib/p0-plus/__fixtures__/injection-molding-flash.ts`
- `src/lib/p0-plus/__fixtures__/smt-pcba-solder-defect.ts`
- `src/lib/p0-plus/__fixtures__/scar-unclear-roles.ts`
- `src/lib/p0-plus/p0-plus.test.ts`
- `package.json`
- `docs/DEV_LOG.md`

## Implementation Summary

- Added an isolated P0+ preview response schema and runtime validator covering
  source status, readiness status, risk level, D0-D8 draft fields,
  `readiness_check`, required section checks, `next_actions`, and conversion
  patch structure.
- Added the P0+ AI prompt contract with two roles: Quality Case Intake Analyst
  and Senior Quality Readiness Reviewer.
- Added a preview-to-`ReportData` mapper that only carries verified
  `provided` / `extracted` safe fields and rejects unknown, unsafe, or
  unverified fields.
- Added deterministic fixtures for injection molding flash/excess material,
  SMT/PCBA solder defect, and unclear SCAR customer/supplier roles.
- Added `npm run test:p0-plus` using the existing lightweight `tsx` +
  `node:assert/strict` pattern.
- Did not add homepage UI, public API routes, temporary draft storage, database
  migrations, auth/signup/login changes, payment, export, share, team
  permission changes, SEO/content pages, or existing AI endpoint changes.

## Tests / Verification

- `npm run test:p0-plus` passed.
- `git diff --check` passed.
- `npm run lint` passed with 11 existing warnings and 0 errors.
- `npm run build` passed.

## Risks

- This establishes contracts only. Later PRs still need to decide the public
  preview API boundary, temporary preview storage, and anonymous rate limiting.

## Unfinished / Needs Human Review

- Confirm the PR1 schema names and fixture expectations before starting public
  preview API or homepage work.

## Suggested Next Task

After this PR is reviewed and merged, start the next P0+ PR only from updated
`main` and keep it scoped to the approved PR breakdown.

## Previous Task

Keyword Data Research Pipeline for 8D Reports SEO/GEO.

## Changed Files

- `ops/seo-keywords/README.md`
- `ops/seo-keywords/input/seed-keywords.csv`
- `ops/seo-keywords/input/gsc-queries-template.csv`
- `ops/seo-keywords/input/keyword-planner-template.csv`
- `ops/seo-keywords/input/google-trends-template.csv`
- `ops/seo-keywords/input/serp-review-template.csv`
- `ops/seo-keywords/output/keyword-opportunity-report.csv`
- `ops/seo-keywords/output/keyword-opportunity-summary.md`
- `scripts/seo/analyze-keyword-data.mjs`
- `package.json`
- `docs/DEV_LOG.md`

## Implementation Summary

- Added an ops-only SEO keyword research workspace for candidate keywords,
  manual export templates, generated reports, and operating instructions.
- Added a seed keyword pool across online-tool, how-to, customer pressure,
  rejection, SCAR, Excel alternative, export/format, industry example, AI
  assistance, root-cause, and corrective-action clusters.
- Added empty CSV import templates for GSC queries, Keyword Planner, Google
  Trends, and SERP manual review. No fake search volume, CTR, CPC, competition,
  difficulty, or trend data was added.
- Added `scripts/seo/analyze-keyword-data.mjs` to merge synonym groups, aggregate
  imported keyword data when present, keep seed-level heuristic fit separate,
  and write missing-data markers when real CSVs are unavailable.
- Added `npm run analyze:seo-keywords`.
- Generated the first output report and summary in missing-data mode so content
  decisions remain blocked until real exports are supplied. In missing-data
  mode, `opportunity_score` is `pending_data` and no data-backed opportunity
  ranking is shown.
- Did not add public SEO pages, modify Help/Learn body copy, modify sitemap,
  touch auth/payment/AI/database schema, publish external content, or write
  production data.

## Tests / Verification

- `git diff --check` passed.
- `npx tsc --noEmit` passed.
- `npm run lint` passed with 11 existing warnings and 0 errors.
- `npm run test:governance` passed.
- `npm run build` passed.
- `npm run analyze:seo-keywords` passed and generated missing-data output for
  absent GSC, Keyword Planner, Trends, and SERP CSVs.

## Risks / Unfinished

- `seed_fit_score` is only a seed-level heuristic. Real `opportunity_score`
  values require GSC or Keyword Planner data plus SERP review data; Google
  Trends is supporting context only.
- No content optimization or new-page decision should be made from the seed pool
  alone.

## Suggested Next Task

Export GSC queries, Keyword Planner ideas, Google Trends comparisons, and SERP
review notes into the documented CSV files, then rerun
`npm run analyze:seo-keywords` before choosing page optimizations or new pages.

## Previous Task

Content Operations Hub v1 for Help, Learn, draft distribution, assets, publishing governance, and public Help/Learn copy polish.

## Changed Files

- `content/help/*.md`
- `content/learn/*.md`
- `content/platform-drafts/{linkedin,wechat,zhihu,medium}/*.md`
- `public/help-assets/*/*.png`
- `ops/accounts/platforms.yaml`
- `ops/accounts/checklists/*.md`
- `ops/publishing/publish-checklist.md`
- `ops/publishing/help-asset-refresh.md`
- `ops/publishing/content-style-guide.md`
- `scripts/content/generate-content-ops-v1.mjs`
- `scripts/capture-help-assets/capture-help-assets.ts`
- `src/lib/content-library.ts`
- `src/components/marketing/ContentArticle.tsx`
- `src/app/(marketing)/help/page.tsx`
- `src/app/(marketing)/help/[slug]/page.tsx`
- `src/app/(marketing)/learn/page.tsx`
- `src/app/(marketing)/learn/[slug]/page.tsx`
- `src/app/sitemap.ts`
- `src/lib/seo-index-hygiene.ts`
- `scripts/check-seo-urls.ts`
- `src/components/marketing/MarketingHeader.tsx`
- `src/components/marketing/MarketingFooter.tsx`
- `package.json`
- `docs/DEV_LOG.md`

## Implementation Summary

- Added a Markdown-backed Help Center at `/help` and `/help/[slug]` with 22 module documents covering Dashboard, report creation, D0-D8, AI Draft, AI Quality Check, 5-Why, Fishbone, root cause, containment, corrective/preventive action, evidence, workflow, locking/revisions, Team, permissions, share links, export, pricing, Template Setup, Team Launch, and troubleshooting.
- Added a Learn content library at `/learn` and `/learn/[slug]` with 8 first-batch education articles and required frontmatter: title, slug, description, type, status, canonical URL, target keywords, screenshots, videos, and last reviewed date.
- Generated LinkedIn, WeChat, Zhihu, and Medium draft packages for each Learn article, all linking back to the official canonical URL and marked ready-for-review rather than published.
- Added account management and application checklist files for LinkedIn, WeChat, Zhihu, Medium, CSDN/Juejin, and Xiaohongshu with no passwords, tokens, cookies, AppSecrets, API keys, verification codes, or QR login state.
- Added manual publishing governance files that require human review and final manual publish/submit/send clicks.
- Seeded `/public/help-assets/*` from existing audit screenshots and added a Playwright capture script for refreshing stable product screenshots with an authenticated storage state and optional report id.
- Replaced public Help Center screenshot maintenance notes with user-facing guidance about matching the screenshot to the product screen.
- Moved internal screenshot refresh instructions into `ops/publishing/help-asset-refresh.md` so public Help and Learn pages do not expose capture tooling, local paths, storage state, or report ids.
- Added Help and Learn links to the marketing header/footer and included all new content routes in sitemap and SEO URL checks.
- Kept AI copy conservative: AI Draft and AI Quality Check are assistance only and do not approve, certify, guarantee acceptance, or create evidence.

## Tests / Verification

- `git diff --check` passed.
- `npx tsc --noEmit` passed.
- `npm run check:seo` passed with 124 sitemap URLs and 11 redirects.
- `npm run lint` passed with 11 existing warnings and 0 errors.
- `npm run test:governance` passed.
- `npm run build` passed and generated `/help`, 22 `/help/*` pages, `/learn`, and 8 `/learn/*` pages.
- Public Help/Learn Markdown body scan passed for internal capture/tooling terms.
- Rendered local production spot-check passed for `/help/ai-draft`, `/help/ai-quality-check`, `/help/5-why`, and `/learn/what-is-8d-reports`; visible page text no longer exposes `/help-assets/` paths or internal refresh instructions.
- Local production server started at `http://localhost:3029`.
- `curl -I` returned 200 for `/help`, `/help/ai-quality-check`, `/learn`, and `/learn/how-ai-helps-draft-but-not-approve-8d-reports`.
- Playwright CLI snapshots verified `/help`, `/help/ai-quality-check`, and `/learn/how-ai-helps-draft-but-not-approve-8d-reports`; local-only Vercel Analytics script 404 appeared as expected and did not block rendering.

## Risks / Unfinished

- Help screenshots are seeded from existing audit screenshots. The capture script is ready for refreshed authenticated screenshots, but exact dashboard/editor/AI/workflow captures need a valid local authenticated storage state and report id.
- Some seeded AI screenshots show the editor context rather than a fully opened AI result state until the authenticated capture pass is run.
- External platform files are draft packages only. Final formatting, images, platform compliance review, and publish/submit/send actions remain manual.
- Content should get human product/positioning review before public publishing, especially Chinese platform drafts.

## Suggested Next Task

Use `ops/publishing/help-asset-refresh.md` when a safe local authenticated test report is available, then manually review screenshot fit inside each Help article before publishing.

## Previous Task

Article Material Screenshot QA.

## Changed Files

- `output/capture_article_screenshots.mjs`
- `docs/DEV_LOG.md`
- `/Users/xiaoyouzi/Downloads/8d_article_materials_2026-07-01/SCREENSHOT_QA_REPORT.md`
- `/Users/xiaoyouzi/Downloads/8d_article_materials_2026-07-01/SCREENSHOT_BLOCKERS.md`
- `/Users/xiaoyouzi/Downloads/8d_article_materials_2026-07-01/P0_BEFORE_PUBLISH.md`
- `/Users/xiaoyouzi/Downloads/8d_article_materials_2026-07-01/screenshot_capture_result.json`
- `/Users/xiaoyouzi/Downloads/8d_article_materials_2026-07-01/_verified_downloads/*`
- 26 PNG files under `/Users/xiaoyouzi/Downloads/8d_article_materials_2026-07-01/*/screenshots/`

## Implementation Summary

- Read the article screenshot goal from `/Users/xiaoyouzi/Downloads/8d_article_materials_2026-07-01/CODEX_GOAL_SHORT.md`.
- Started the local app at `http://127.0.0.1:3028` and captured real public product UI screenshots at `1440x900`.
- Overwrote 26 article PNGs with real screenshots from the homepage, sample report, demo report, pricing page, and verified demo ZIP contents.
- Did not overwrite 20 authenticated-only placeholders because no safe smoke database URL, temporary Neon branch credentials, or authenticated test cookies were available. Mocking was avoided.
- Verified the live local demo download route for PDF, Word, Excel, and ZIP before export-related screenshot reporting.
- Generated screenshot QA reports in `/Users/xiaoyouzi/Downloads/8d_article_materials_2026-07-01/`.
- Found a Free quantity wording conflict in `docs/DEPLOYMENT_GUIDE.md`: public/runtime copy uses 3 lifetime reports, but the deployment seed example still shows `reports_per_month = 5`.

## Tests / Verification

- `command -v npx`
- Local app smoke via `curl -sI http://127.0.0.1:3028`
- Live demo downloads via `/api/sample-reports/automotive` for PDF, DOCX, XLSX, and ZIP
- `unzip -l` on the verified ZIP package
- `file` on article screenshot PNGs to confirm `1440 x 900`
- Sensitive text scan across generated material metadata/report files for secrets, cookies, DB URLs, and private tokens
- Free quantity wording search across homepage, pricing, docs, and article materials

## Risks / Unfinished

- Authenticated app screenshots remain blocked: Dashboard, New Report, editor D0/D1, attachment upload, Free watermarked PDF export, sharing dialog/options/revoke, Pro search, Team workspace/activity log, and AI Quality Check result panels.
- Several D2-D7 article screenshots use real public demo report UI rather than the authenticated editor. This is honest but should be replaced with editor screenshots once safe authenticated access is available.
- `docs/DEPLOYMENT_GUIDE.md` should be corrected or annotated before publishing pricing/free-plan material because it contains a stale 5-report seed example.

## Suggested Next Task

Create or provide a temporary authenticated smoke environment, then rerun screenshot capture for the 20 blocked authenticated-only images and resolve the Free quantity P0 documentation conflict before publishing the article pack.

## Previous Task

Revenue Evidence Day 2 Operating Execution.

## Changed Files

- `docs/REVENUE_EVIDENCE_DAY_2_DISTRIBUTION.md`
- `docs/REVENUE_EVIDENCE_DAY_2_CHECKLIST.md`
- `docs/DEV_LOG.md`

## Implementation Summary

- Merged docs-only PR #25, `docs: add revenue evidence day 1 operating log`.
- Confirmed main now includes PR #25 merge commit
  `8c29cc785de44c6902b3954525c1cfe117b015cf`.
- Attempted read-only GA4/GSC UI access through the available browser surface;
  Google UI hosts timed out from the current environment, matching the existing
  Google API timeout constraint.
- Added Day 2 manual distribution drafts for LinkedIn, Quora, Reddit-safe
  discussion prompts, Template Setup outreach, and Team Launch outreach.
- Added a Day 2 tracking checklist with safe fields only and an explicit posting
  gate.
- No product runtime, analytics implementation, auth, payment, export, AI,
  database schema, production configuration, production users, production
  reports, or production leads were changed.

## Tests / Verification

- PR #25 was open, non-draft, mergeable, Vercel passed, and docs-only before
  squash merge.
- GSC UI entry `https://search.google.com/search-console` timed out from the
  current environment.
- GA4 UI entry `https://analytics.google.com/analytics/web` timed out from the
  current environment.
- No external posting or outreach was performed.

## Risks

- GA4/GSC measurement remains blocked in the current execution environment
  because Google UI and API hosts time out.
- Day 2 distribution drafts still require manual review against platform rules
  before posting or sending.

## Unfinished / Needs Human Review

- Confirm GSC sitemap status in the Google Search Console UI from a browser or
  network environment that can reach Google.
- Review and approve any specific LinkedIn, Quora, Reddit, or outreach item
  before posting/sending.
- Record observed clicks, replies, and safe next actions in the Day 2 checklist.

## Suggested Next Task

Manually execute the approved Day 2 distribution items, then record observed
activity and admin metrics without creating production test data.

## Previous Task

Revenue Evidence Measurement Recovery + 7-Day Operating Launch.

## Changed Files

- `docs/REVENUE_EVIDENCE_7_DAY_LOG.md`
- `docs/DEV_LOG.md`

## Implementation Summary

- Added the 7-day revenue evidence measurement log with Day 1 baseline values,
  production URL check status, sitemap status, and the Day 2 minimum operating
  plan.
- Confirmed local GA4/GSC marketing configuration exists in private secrets,
  without reading or recording credential contents.
- Attempted fresh GSC and GA4 exports through the existing marketing scripts;
  both failed with Google API `fetch failed`, including after a network retry.
- Generated the weekly marketing report from existing historical CSV exports
  only; live GA4/GSC data remains blocked until API access succeeds from the
  execution environment.
- No product runtime, auth, payment, export, AI, database schema, production
  config, production users, production reports, or production leads were
  changed.

## Tests / Verification

- `npm run marketing:gsc` failed with `fetch failed`.
- `npm run marketing:ga4` failed with `fetch failed`.
- Direct HTTPS probes to Google OAuth, Analytics Data, and Search Console API
  hosts timed out from the current environment.
- `npm run marketing:report` passed and wrote the ignored local weekly report.
- Production URL checks from Day 1 showed `/resources`, the 10 resource pages,
  `/custom-8d-template-setup`, `/pricing`, `/demo-reports`, and `/contact`
  returning 200.
- `https://www.8d-reports.com/sitemap.xml` returned 200 and contains 10
  `/resources/` URLs.

## Risks

- Live GA4/GSC exports are still unavailable from the current execution
  environment, so Day 1 acquisition metrics must be verified manually or from a
  network environment that can reach the Google APIs.
- The current daily evidence volume is too small to diagnose CTA conversion,
  form friction, signup activation, or product completion with confidence.

## Unfinished / Needs Human Review

- Confirm GA4/GSC directly in the Google UIs or rerun exports from an
  environment where Google API requests do not fail.
- Submit or confirm `https://www.8d-reports.com/sitemap.xml` in Google Search
  Console.
- Manually distribute the Day 2 offsite content touchpoints; do not auto-post.

## Suggested Next Task

Restore live GA4/GSC measurement access, confirm sitemap submission, and run
the Day 2 operating plan against admin metrics.

## Previous Task

Revenue GEO Content Batch 1.

## Changed Files

- `docs/CURRENT_TASK.md`
- `docs/DEV_LOG.md`
- `scripts/check-seo-urls.ts`
- `scripts/team-governance.test.ts`
- `src/app/(marketing)/resources/[slug]/page.tsx`
- `src/app/(marketing)/resources/page.tsx`
- `src/app/sitemap.ts`
- `src/components/marketing/ResourcesExplorer.tsx`
- `src/content/revenue-geo-resources.ts`

## Implementation Summary

- Added a shared revenue GEO resource content source and a static
  `/resources/[slug]` renderer for 10 high-intent pages covering customer
  complaint 8D writing, SCAR templates, 8D vs SCAR, Excel vs software, custom
  template setup, AI 8D checking, D4 root cause, D5 corrective action, D6
  validation, and D8 lessons learned.
- Each page includes unique metadata/canonical, answer-first copy, proof
  elements, practical checklist, common mistakes, comparison/example table,
  related internal links, service/product CTA, and visible FAQ with matching
  FAQPage JSON-LD.
- Added the new resource pages to `/resources`, a Revenue Guides filter, sitemap
  generation, and SEO URL validation.
- Added governance coverage for page count, required slugs, content quality
  sections, FAQ/schema behavior, sitemap/SEO check integration, safe analytics
  event usage, and forbidden scope boundaries.
- No payment, checkout, subscription, auth, password reset, Resend, real report
  export entitlement, ZIP behavior, AI backend, Knowledge Base search,
  production configuration, or database schema changes were made.

## Tests / Verification

- `git diff --check` passed.
- `npx tsc --noEmit` passed.
- `npm run lint` passed with 11 existing warnings and 0 errors.
- `npm run build` passed.
- `npm run test:governance` passed.
- `npm run check:seo` passed with 92 sitemap URLs and 11 redirects checked.
- Local public smoke passed via `PRODUCTION_BASE_URL=http://127.0.0.1:3031 npm run test:production-smoke`.
- Playwright browser smoke passed for `/resources` plus all 10 new
  `/resources/*` pages at 390px and 1280px viewports: 22 route checks, 200 OK,
  no horizontal overflow, required content markers present, and no console
  warning/error messages.
- Authenticated smoke is not required because this PR only adds public marketing
  resource pages and does not change logged-in app behavior.

## Risks

- The 10-page batch must stay practical and specific; future batches should be
  driven by evidence rather than publishing many thin pages.
- CTA copy must remain service/product discovery, not a promise of customer
  acceptance or certified approval.
- Public analytics must stay bounded to safe event names and enum-like metadata.

## Unfinished / Needs Human Review

- PR creation, remote checks, and final review are pending.

## Suggested Next Task

After this PR deploys, watch demo downloads, service CTA clicks, signup, and
search traffic for these new resources before adding another content batch.

## Previous Task

End-of-run Product Review Backlog v1.

## Changed Files

- `docs/CURRENT_TASK.md`
- `docs/DEV_LOG.md`
- `docs/PRODUCT_REVIEW_BACKLOG.md`
- `scripts/team-governance.test.ts`

## Implementation Summary

- Audited homepage, Pricing, Custom Template Setup, demo reports, Contact,
  Signup, Dashboard, Report Editor, Knowledge Base, and Revenue Admin Metrics.
- Added a docs-only product review backlog with P1/P2 issues, evidence, user
  impact, suggested follow-up PR, not-to-do boundaries, and expected metric
  impact.
- Documented that no P0 blockers were found and that the product is ready to
  continue measuring revenue evidence instead of adding broad new surface area.
- Prioritized service CTA semantics, first-run activation, editor next-action
  guidance, revenue diagnostics, and Knowledge Base scaling in that order.
- Added governance coverage for the backlog structure, required surfaces,
  severity language, metric-impact language, and future-only forbidden scope.
- No runtime product feature, public marketing rewrite, payment, checkout,
  subscription, auth, Resend, report editor core-flow, export, AI backend,
  Knowledge Base search/eligibility/permission, production configuration, or
  database schema changes were made.

## Tests / Verification

- `git diff --check` passed.
- `npx tsc --noEmit` passed.
- `npm run lint` passed with 11 existing warnings and 0 errors.
- `npm run build` passed.
- `npm run test:governance` passed.

## Risks

- The backlog is intentionally not implementation scope; each item needs a
  separate small PR.
- Future revenue diagnostics must not collect raw report content, customer or
  product names, full search queries, payment details, or uploaded-file content.
- Knowledge Base performance work should wait for real workspace volume before
  schema/indexing changes.

## Unfinished / Needs Human Review

- PR creation and remote checks are pending.

## Suggested Next Task

After this docs PR, pick the smallest P1 follow-up: service CTA semantics or
first-run activation.

## Previous Task

Revenue Lead Follow-Up Templates v1.

## Changed Files

- `docs/CURRENT_TASK.md`
- `docs/DEV_LOG.md`
- `docs/REVENUE_LEAD_FOLLOWUP_TEMPLATES.md`
- `scripts/team-governance.test.ts`

## Implementation Summary

- Added manual follow-up templates for Template Setup, Team Launch, Assisted
  First 8D / SCAR Delivery, no-response follow-ups, paid service handoff, and
  after-delivery feedback.
- Each template asks for concrete next inputs, explains likely deliverables, and
  avoids guaranteed customer acceptance, certified approval, instant turnaround,
  unlimited free consulting, or invented evidence.
- Documented manual tracking fields and sensitive data exclusions for full
  messages, customer/supplier/product identifiers, batch numbers, root cause,
  corrective action, lessons learned, attachment content, credentials, and
  payment details.
- No live email sending, Resend, CRM, payment, checkout, subscription, auth,
  export, AI backend, Knowledge Base search, production configuration, or
  database schema changes were made.

## Tests / Verification

- `git diff --check` passed.
- `npx tsc --noEmit` passed.
- `npm run lint` passed with 11 existing warnings and 0 errors.
- `npm run build` passed.
- `npm run test:governance` passed.
- Authenticated smoke is not required because this is a docs/governance-only
  follow-up template pack with no runtime app changes.

## Risks

- Templates must still be manually adapted to the lead context before sending.
- Quote and handoff notes should remain human-reviewed.
- Manual lead notes must avoid private customer or quality-report details.

## Unfinished / Needs Human Review

- PR creation, remote checks, and final review are pending.

## Suggested Next Task

After this PR, run the end-of-run product review backlog across public and
authenticated surfaces.

## Previous Task

Offsite GEO Distribution Pack v1.

## Changed Files

- `docs/CURRENT_TASK.md`
- `docs/DEV_LOG.md`
- `docs/OFFSITE_GEO_DISTRIBUTION_PACK.md`
- `scripts/team-governance.test.ts`

## Implementation Summary

- Added an offsite GEO distribution pack for manually reviewed LinkedIn,
  Medium, Quora, and Reddit-safe distribution.
- Included 10 LinkedIn post drafts for SQE, quality manager, supplier quality,
  manufacturing quality, and customer quality roles with hook, problem,
  takeaway, soft CTA, and link suggestion.
- Included 5 Medium editorial outlines, 20 direct Quora answer drafts with
  honest product-context disclosure guidance, and 10 Reddit-safe practitioner
  discussion prompts.
- Documented manual tracking fields and privacy boundaries for offsite
  distribution evidence.
- Added anti-spam rules: no automated posting, bulk spam, fake stories, fake
  statistics, fake customer logos, "best in the world" claims, hidden product
  affiliation, repeated copy-paste answers, over-linking, or private quality
  data.
- No runtime pages, social posting integration, payment, checkout, subscription,
  auth, password reset, Resend, export, AI backend, Knowledge Base search,
  production configuration, or database schema changes were made.

## Tests / Verification

- `git diff --check` passed.
- `npx tsc --noEmit` passed after clearing stale local `.next` generated types
  from a previous runtime branch.
- `npm run lint` passed with 11 existing warnings and 0 errors.
- `npm run build` passed.
- `npm run test:governance` passed.
- Authenticated smoke is not required because this is a docs/governance-only
  distribution pack with no runtime app changes.

## Risks

- Offsite content should be manually adapted to each platform and not used as a
  bulk posting script.
- Quora and Reddit links should be sparse and only included when genuinely
  useful.
- Manual tracking must avoid collecting private respondent or quality-report
  details.

## Unfinished / Needs Human Review

- PR creation, remote checks, and final review are pending.

## Suggested Next Task

After this PR, add revenue lead follow-up templates so service inquiries can be
handled consistently without overpromising.

## Previous Task

GEO Content Production Plan v1.

## Changed Files

- `docs/CURRENT_TASK.md`
- `docs/DEV_LOG.md`
- `docs/GEO_CONTENT_PRODUCTION_PLAN.md`
- `scripts/team-governance.test.ts`

## Implementation Summary

- Added a 32-item, 30-day GEO content production calendar across revenue/service
  pages, core 8D instructional content, industry examples, and comparison / AI /
  Knowledge Base topics.
- Mapped every planned article to target query, title, search intent,
  answer-first outline, proof elements, internal links, CTA, offsite repurposing
  target, and measurement event.
- Defined GEO writing rules requiring answer-first copy, practical checklists,
  manufacturing/SQE vocabulary, example tables, common mistakes, service-use
  guidance, relevant demo/sample links, and conservative AI positioning.
- Defined platform-native repurposing rules for LinkedIn, Medium, Quora, and
  Reddit-safe discussion while prohibiting auto-posting, spam, fabricated
  experience, fake statistics, and over-linking.
- Added governance coverage for the plan count, week coverage, required fields,
  writing rules, repurposing sections, anti-spam rules, and privacy-safe
  analytics boundaries.
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
  content plan with no runtime app changes.

## Risks

- The plan should not be treated as a mandate to publish all topics at once.
  Week 1 revenue-near content should be prioritized and measured before broader
  supporting content.
- Offsite repurposing must stay manual and platform-native to avoid spam or
  low-trust distribution.
- Measurement events must keep metadata bounded to safe enums, page ids, CTA,
  service, format, source, priority, and plan.

## Unfinished / Needs Human Review

- PR creation, remote checks, and final review are pending.

## Suggested Next Task

After this PR, create a small batch of the highest-intent runtime pages only if
there is enough time and the PR can stay reviewable.

## Previous Task

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

# 2026-07-06 — P0+ Preview Conversion Concurrency Hardening

## Task

Fix PR #34 P0+ conversion idempotency and concurrent double-submit behavior. Keep PR #34 draft/open, append a commit only, do not start PR5, and do not modify export, payment, share, team permissions, editor UI, production feature flags, Vercel env, SEO pages, or stash.

## Changed Files

- Added `drizzle/0007_p0_plus_preview_conversion_claim.sql`.
- Updated `src/lib/db/schema.ts` with P0+ preview conversion claim fields.
- Updated `src/lib/p0-plus/storage.ts` with atomic `claimConversion`, claim cleanup, and claim-token-gated `markConverted`.
- Updated `src/lib/p0-plus/convert.ts` so conversion claims before creating a formal report, clears claims on report creation failure, and returns safe 409 responses when conversion is already in progress or conversion status cannot be confirmed.
- Updated `src/lib/p0-plus/convert.test.ts` with concurrent double POST, creation failure cleanup, mark failure, and existing idempotency coverage.
- Updated `src/lib/p0-plus/paths.ts`, `src/components/p0-plus/P0PlusPreviewContent.tsx`, and UI tests to encode the login `callbackUrl`.
- Updated `src/lib/p0-plus/preview-service.test.ts` mocks for the new preview record fields.

## Implementation Summary

- Added nullable conversion claim fields to `p0_plus_previews`: `conversion_claim_token`, `conversion_claimed_at`, and `conversion_claim_expires_at`.
- `claimConversion` is a single database update guarded by active preview, `converted_report_id IS NULL`, and no unexpired existing claim.
- `convertP0PlusPreviewToReport` now creates a formal report only after the claim succeeds.
- A second concurrent POST that cannot claim re-reads the preview; if already converted and accessible it returns the existing redirect, otherwise it returns a safe 409 in-progress response without creating a report or consuming quota.
- If formal report creation fails because of quota, Team viewer role, or another creation error, the current claim is cleared so the user can retry after fixing the issue.
- `markConverted` now requires the same claim token and clears claim fields after setting `converted_report_id`.
- If `markConverted` fails, conversion no longer pretends success or leaks the newly created report id.
- Login callback paths are encoded while still resolving to local `/p0-plus/continue/[token]` paths after login parsing.

## Tests / Verification

- `npx tsx src/lib/p0-plus/convert.test.ts` passed.
- `npm run test:p0-plus-ui` passed.
- `npm run test:p0-plus-preview` passed.
- `npm run test:p0-plus` passed.
- `npm run lint` passed with 11 existing warnings and 0 errors.
- `npm run build` passed.
- `git diff --check main...HEAD` passed before staging; staged diff check will be run before commit.

## Risks

- The claim prevents duplicate report creation for concurrent POSTs while the claim is active. If a process creates a report and then fails before marking converted, the response is safe and the claim remains until expiry; an operator may need to inspect if that rare orphan case appears in logs.
- The migration is additive and nullable, but production migration ordering should still be reviewed before enabling the feature flag.

## Unfinished / Needs Human Review

- Review the 10-minute claim TTL against expected production latency before enabling P0+ preview conversion.

## Suggested Next Task

After PR #34 is reviewed and merged, start PR5 from fresh `main`; do not build on the local API-fallback commit unless it has been synchronized from merged `main`.

# 2026-07-06 — P0+ Preview Conversion PR4

## Task

Implement P0+ PR4: authenticated login handoff, confirmation page, and conversion from temporary preview to formal editable report. Do not start PR5 and do not modify export, payment, share, team permissions, production feature flags, Vercel env, SEO pages, or stash.

## Changed Files

- Added `src/app/p0-plus/continue/[token]/page.tsx` for authenticated confirmation before conversion.
- Added `src/app/api/p0-plus/preview/[token]/convert/route.ts` for authenticated POST-only conversion.
- Added `src/components/p0-plus/P0PlusContinueActions.tsx` for the explicit confirmation button.
- Added `src/lib/p0-plus/convert.ts` and `src/lib/p0-plus/paths.ts` for conversion state, safe login callback paths, idempotency, and mapper-based sanitization.
- Added `src/lib/report-creation.ts` and updated `src/app/api/reports/route.ts` so normal report creation and P0+ conversion share quota, Team viewer, report owner, report number, and activity logging boundaries.
- Updated `src/lib/p0-plus/storage.ts` with converted report marking using the existing `converted_report_id` column.
- Updated `src/components/p0-plus/P0PlusPreviewContent.tsx` and `src/app/p0-plus/preview/[token]/page.tsx` so the read-only preview CTA routes to the continuation page after login.
- Added `src/lib/p0-plus/convert.test.ts` and updated `src/lib/p0-plus/preview-ui.test.tsx`.

## Implementation Summary

- Feature flag remains default-disabled. When `P0_PLUS_PREVIEW_ENABLED` is not enabled, preview conversion routes are hidden or return safe disabled/not found responses.
- GET `/p0-plus/continue/[token]` never creates a report. It only checks auth, token state, expiry, and converted status, then renders a confirmation page or safe unavailable state.
- Unauthenticated continuation visits redirect to `/login?callbackUrl=/p0-plus/continue/[token]` through a local callback path.
- Authenticated POST `/api/p0-plus/preview/[token]/convert` creates the formal report only after the user clicks `Create editable report`.
- Conversion calls no AI, reads no private knowledge context, creates no share link, performs no export, uploads no attachments, and writes no signature/approval/private/export/share fields.
- Conversion uses `mapP0PlusPreviewToReportDataPatch`; only `provided` and `extracted` safe fields are written. Inferred, missing, needs-confirmation, conflicting, unknown, and unsafe fields are filtered.
- Report creation goes through shared formal creation logic, preserving Free quota checks, Pro/Team entitlement behavior, Team viewer blocking, owner assignment, report numbering, and `report_created` activity logging.
- Conversion is idempotent for repeated POSTs after `converted_report_id` is set: accessible users receive the existing report redirect and do not create another report or consume quota again.

## Tests / Verification

- `npx tsx src/lib/p0-plus/convert.test.ts` passed.
- `npm run test:p0-plus-ui` passed.
- `npm run test:p0-plus-preview` passed.
- `npm run test:p0-plus` passed.
- `npm run lint` passed with 11 existing warnings and 0 errors.
- `npm run build` passed.
- `git diff --check` passed.

## Risks

- Sequential idempotency is covered. Highly concurrent double-click/race behavior relies on the converted marker and existing database constraints; a stronger transactional claim could be considered later if preview conversion volume grows.
- The shared report creation helper intentionally preserves current report creation behavior; sample report creation remains separate and unchanged.

## Unfinished / Needs Human Review

- Review copy on the confirmation page before enabling the feature flag in any environment.
- Review whether PR5 should add a post-conversion onboarding hint inside the existing editor, without changing export/payment/share/team behavior.

## Suggested Next Task

After PR4 is reviewed and merged, start PR5 from fresh `main`: polish authenticated post-conversion guidance in the existing editor, still behind the P0+ feature flag and without touching export/payment/share/team permissions.

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
# 2026-07-11 — PR-G7 Effectiveness Verification Workspace

## Implementation Summary

- Added an additive, multi-cycle effectiveness-verification ledger: Cycle,
  Plan, Execution, Result, result-linked Evidence, human Review, Audit, and
  traceable Verification Coach runs.
- Expanded the Quality Case contract with explicit planning, execution,
  submission, internal review, and verified-effective states. Customer Accepted
  and the legacy effectiveness state can no longer close directly.
- Added internal services and APIs for plan/execution/result persistence,
  advisory readiness checks, evidence linkage, human review, failure/reopen,
  and close-after-human-approval.
- Added hash-token supplier verification tasks. Suppliers can plan, execute,
  attach evidence, and submit, but cannot approve, fail, reopen, or close.
- Added internal and supplier-facing responsive workspaces. Existing ReportData,
  D0-D8 editing, export, payment, and marketing behavior were not changed.
- Added `docs/EFFECTIVENESS_VERIFICATION.md` with the state machine, data
  lifecycle, permission matrix, AI boundary, API boundary, test status, and RC
  recommendation.

## Changed Files

- Domain/schema/migrations: `src/lib/db/schema.ts`,
  `drizzle/0012_effectiveness_verification.sql`, dedicated rollback,
  `src/lib/quality-cases/contract.ts`, `effectiveness-verification.ts`, and
  `verification-tasks.ts`.
- APIs/UI: internal verification routes, supplier verification-token routes,
  `/verification/[token]`, both Verification Workspace components, and Quality
  Case list/detail integration.
- Tests/smoke/docs: effectiveness tests, migration contract/rehearsal,
  authenticated smoke, package script, screenshots, and this log.

## Tests / Checks

- Quality Case migration contract passed.
- Supplier Response Package, Internal Quality Review, Customer Review,
  Effectiveness Verification, Quality Case contract/security/service tests
  passed.
- `npx tsc --noEmit` passed.
- Scoped PR-G7 ESLint passed with 0 warnings/errors.
- `npm run build` passed on Next.js 16.2.6.
- Real Chromium desktop/mobile rendering passed; 390px horizontal-overflow check
  returned true.
- Migration smoke safety gate passed by refusing execution without
  `SMOKE_DB=true`; no production database or object storage was contacted.

## Risks / Unfinished

- The disposable database and test object-storage variables are not available
  in this environment, so migration up/rollback and full authenticated normal +
  failure lifecycle smoke are prepared but not executed against a database.
- Customer visibility is intentionally limited to separately authorized content;
  a customer-facing verification-result projection is not added to the existing
  customer-review link in this PR.
- Before release, run concurrency tests around simultaneous submit/review actions
  on a disposable database and verify orphan-object cleanup for an object upload
  whose subsequent database batch fails.

## Suggested Next Task

Enter Release Candidate. Provision disposable DB/object storage, execute the
prepared migration/authenticated smoke for normal and failed cycles, run
Supplier/Coordinator/Customer usability sessions, fix only release blockers,
and prepare the demo and commercial launch checklist.
# 2026-07-11 — Release Candidate Quality Case validation

## Outcome

- Created an empty, temporary Neon project and disposable S3-compatible object
  store; no production data or credentials were used.
- Passed migration up, idempotent re-run, PR-G2/PR-G7 scoped rollback, and
  reapply against real Postgres.
- Passed the three-party Quality Case lifecycle from supplier Guided/Expert
  response through customer acceptance, effectiveness verification, close,
  reopen, failed verification, and a new preserved cycle.
- Passed concurrent supplier submission, token hashing, cross-workspace denial,
  evidence persistence, and audit inspections.

## RC defects fixed

- Qualified raw SQL columns in Supplier Response Package and Customer Review
  atomic guards after real Postgres exposed ambiguous `id` joins.
- Hardened authenticated smoke login hydration and API-shape assertions.
- Added explicit isolated S3 endpoint support without changing Cloudflare R2
  production defaults.
- Added scoped Quality Case smoke, concurrent submit, failure/recovery, and
  environment-aware object upload validation.

## Verification

- Scoped RC artifact: `output/rc-validation/quality-case-smoke-result.json` — passed.
- 24 required Quality Case tables and 73 migration statements verified.
- Latest RC Case: 30 activities, 13 Verification audits, three retained cycles.
- Quality Case migration, Supplier Package, Internal Review, Customer Review,
  Effectiveness Verification, contract, security, and service tests passed.
- TypeScript passed; ESLint passed with 11 existing warnings and no errors.
- Next.js 16.2.6 production build passed; `git diff --check` passed.

## Risks / unfinished

- Outbound staging email delivery was not tested; `.example.test` identities
  intentionally do not receive mail.
- Provider-specific Cloudflare R2 preview credentials/CORS/lifecycle remain a
  final release gate; compatible S3 upload/read passed locally.
- The broad non-RC authenticated smoke has an existing AI Quality Check fallback
  expectation mismatch in this environment.

## Suggested next task

Run preview/canary validation with a staging mailbox and temporary Cloudflare R2
bucket, then promote only after those two release gates pass.
# 2026-07-11 — RC-2 Preview Hardening

## Outcome

- Added real Resend Supplier and Customer invitation delivery around existing
  external task links, with task-derived idempotency, bilingual content, and a
  manual-link fallback when provider delivery fails.
- Added Preview-only authenticated diagnostics for Resend `lastEvent` and
  controlled token-expiry testing; Production returns 404.
- Added R2 orphan-object compensation to all three Quality Case Evidence upload
  paths. Database persistence failures now attempt object deletion and emit a
  structured cleanup result without file content or credentials.
- Made the legacy AI Quality Check smoke expectation explicit and
  environment-aware without changing runtime AI behavior.
- Created and validated a disposable Vercel + Neon Preview. Four Resend test
  invitations reached `delivered`; Supplier/Customer links opened; authorized
  projections, revoked tokens, and expired tokens behaved correctly.
- Cloudflare rejected independent bucket creation with `403 AccessDenied`.
  The configured Production/shared bucket was not used. Canary remains NO-GO.
- Removed the branch database variable, all three temporary Preview
  deployments, the temporary Neon project, and the temporary env file.

## Checks

- `npx tsc --noEmit` — PASS.
- `npm run test:preview-hardening` — PASS.
- Supplier Response Package / Internal Review / Customer Review /
  Effectiveness Verification tests — PASS.
- `npm run test:governance` — PASS.
- `npm run build` locally and Vercel Preview — PASS.
- `npm run lint` — PASS, 0 errors and 11 pre-existing warnings.
- Preview Resend/Token browser smoke — PASS, 7/7 checks and 4 delivered
  messages.
- Cloudflare R2 Provider smoke — BLOCKED at isolated bucket creation (403).

## Risks and unfinished items

- An R2 administrator must provision a private Preview bucket and least-
  privilege token before the full deployed Evidence lifecycle can run.
- Perform one interactive team mailbox rendering check before Canary.
- Do not use `vercel env run` as proof that branch-scoped Sensitive variables
  were injected. The RC attempt briefly seeded the generic Preview database;
  exact cleanup removed 3 fixed smoke users and 2 smoke plans immediately.

## Suggested next task

Provision the isolated R2 Preview bucket, configure branch-scoped Preview
credentials, run the real R2 smoke and complete deployed Quality Case scoped
smoke. Promote to a named-user Canary only if both pass.

# 2026-07-15 — Final Preview Canary Gate Attempt

## Outcome

- Verified the Ready Preview deployment metadata for
  `codex/rc2-preview-hardening` at commit
  `03712028c2717857616ae568c268b1919015b73d`.
- Created a one-time empty Neon project, bound it only to the Preview branch,
  and redeployed the same commit. The temporary branch overrides and Neon
  project were removed during cleanup.
- Applied the repository migrations, verified the Quality Case, Guided, and
  Verification schema, rolled back the Guided/Verification additions while
  retaining the core Quality Case table, then reapplied them.
- Revalidated the dedicated `8d-reports-preview` R2 bucket: upload, download,
  private-access rejection, simulated orphan cleanup, deletion, and zero
  objects under the smoke prefix all passed.
- The deployed browser smoke could not reach the Preview host: ordinary HTTPS
  and Vercel protection-bypass requests both timed out before reaching the
  deployment. No deployed Case, email, or application Evidence action was
  therefore claimed as validated.

## Decision

- Canary is **NO-GO**. Restore a newly isolated Preview database and resolve
  runner-to-Preview HTTPS connectivity before repeating the deployed lifecycle,
  permission, email, idempotency, and application-level R2 compensation gates.

# 2026-07-17 — Preview Automation Bypass Connectivity Check

## Outcome

- Confirmed the Vercel CLI session, 8D Reports project, `xiaoyouzi-labs-projects`
  team, and Preview deployment target.
- Created a project-level Automation Protection Bypass named
  `codex-canary-smoke` without changing Deployment Protection or Production.
- Stored the bypass only outside the repository in a user configuration file
  with owner-only file permissions; no credential was written to source,
  Git, reports, or this log.
- Both Vercel CLI and ordinary HTTPS bypass requests timed out during network
  connection establishment. The read-only application GET did not reach
  runtime logs, so SSO, application routing, and database behavior were not
  exercised.

## Decision

- Do not create the isolated Neon environment yet. Resolve runner-to-Preview
  HTTPS reachability first, then repeat the read-only bypass check before the
  full Canary smoke.

# 2026-07-17 — GitHub Actions Canary Gate Preflight

## Outcome

- Restored GitHub CLI authentication and verified Actions availability for the
  current repository and RC Preview branch.
- Added a manual-only, concurrency-protected Preview Canary workflow using the
  `quality-case-preview-smoke` GitHub Environment.
- Stored only the Preview bypass and R2 credentials in Environment Secrets;
  non-sensitive Preview and R2 routing values use Environment Variables.
- The default workflow phase performs DNS, TLS, and bypass-only reads before
  any database operation. The full phase is gated on explicit isolated-smoke
  inputs and always uploads only a redacted summary.

## Current Blocker

- No Neon automation credential is available to GitHub Actions, so a full run
  cannot yet create and guarantee cleanup of its own temporary Neon project.
- Run the connectivity phase first. Provision and grant a disposable Neon
  automation credential only if it passes; do not use a Production database.

## Dispatch Result

- GitHub Actions only permits `workflow_dispatch` for workflows present on the
  repository default branch. The Canary workflow intentionally exists only on
  the RC branch, so GitHub rejected dispatch before it created a run.
- No Neon project, Preview deployment operation, database write, or Preview
  request occurred. The temporary GitHub Environment and its Secrets/Variables
  were removed immediately.

# 2026-07-17 — RC Branch Push Canary Trigger

## Outcome

- Added a push trigger restricted to `codex/rc2-preview-hardening` because
  GitHub does not dispatch branch-only `workflow_dispatch` workflows that are
  absent from the default branch.
- Push events are constrained to the read-only connectivity gate; every
  database, R2, migration, email, and lifecycle step remains restricted to an
  explicit manual `full` dispatch.
- Recreated only the temporary GitHub Environment values needed for the
  connectivity gate. No Neon configuration or production resource was added.

## Follow-up

- The first branch-push run bypassed Vercel protection and reached the Preview
  edge, but the root response was a redirect and did not yield a runtime log.
- Extended the same read-only gate with an authenticated no-write API request
  so the next push verifies application-runtime reachability separately.

# 2026-07-17 — Connectivity Gate Route Audit

## Outcome

- Audited failed Run `29547740741` without creating Neon infrastructure or
  running the lifecycle smoke.
- The failed probe targeted `GET /api/knowledge/search`, but that route only
  implements `POST`; Next.js correctly returns `405 Method Not Allowed` before
  its session guard or query logic. The workflow incorrectly treated that
  expected method response as a network or Preview reachability failure.
- Replaced the probe with the existing public `GET /api/quality-agent/chat`.
  It is non-mutating, does not require a session, does not query the
  application database, and returns a small boolean availability contract.
- Updated the connectivity report to always preserve only status codes, curl
  exit codes, and a classified failure layer. Raw response bodies and headers
  remain temporary and are removed before artifact upload.
- The diagnostic report classifies redirect destinations without preserving a
  URL, so a Vercel SSO redirect can be distinguished from an application or
  cross-origin redirect without exposing query parameters.
- The first bypass request may only establish Vercel's same-origin bypass
  cookie. The final application probe therefore reuses that cookie but never
  follows a redirect automatically or contacts a different host.

## Scope Boundary

- This change modifies only the RC Canary workflow and its operational log.
  It does not modify product behavior, Preview configuration, database data,
  R2 objects, email, or Production resources.

## Connectivity Result

- The final branch-push connectivity run (`29551257883`) passed after the
  bypass cookie was reused for the public application probe.
- DNS and TLS succeeded; the cookie-establishing root request returned an
  expected same-origin `307`, while the final read-only application request
  returned `200` with its expected boolean response contract.
- The redacted Artifact contains no credentials, tokens, cookies, URLs with
  query parameters, response bodies, or response headers.

# 2026-07-17 — Full Canary Gate Preparation

- Full Canary requires an explicit temporary Environment authorization and the
  `[full-canary]` marker on the RC branch because GitHub cannot dispatch a
  branch-only workflow absent from the default branch.
- Browser, API, and invitation Smoke requests carry Vercel's automation bypass
  header without persisting it in a report.
- Supplier Evidence in the deployed Smoke now uses the external upload API and
  links the returned R2-backed record to the Guided answer requirement.

# 2026-07-17 — Full Canary Runner Reliability

- Added Chromium installation to the Full Gate after the isolated migration and
  R2 checks passed but the GitHub-hosted runner had no Playwright browser
  binary. This changes only test-runner provisioning.
- Extended fixed-fixture cleanup to delete exactly the R2 evidence paths owned
  by the smoke users before database cascades remove their cases. It never
  lists or deletes unrelated Preview bucket objects.
- Corrected the deployed-smoke login assertion to use the stable Dashboard
  landing contract after Preview proved authentication succeeded but the old
  “Quality workbench” copy was absent.
- Improved a failing concurrent-submission assertion so the redacted Canary
  report distinguishes an idempotency result from an API 404 without exposing
  a task token or response payload.
- Fixed the confirmed supplier-submit race: if another request commits between
  the initial scope inspection and Package build, the later request rechecks
  the immutable confirmation and returns the committed result instead of a
  false task-unavailable response.
- Extended fixture cleanup to remove only the smoke-owned Verification Evidence
  links before user/case cascades; the domain link remains restrictive for
  normal audit data and this does not change production deletion semantics.

# 2026-07-17 — Canary Gate Finalization

- Final isolated Full Gate passed in GitHub Actions Run 29554792374, including
  migration rehearsal, deployed lifecycle, Preview R2 compensation, invitation
  delivery, and fixed-fixture cleanup.
- Removed the temporary RC branch `push` trigger and marker-based Full Gate
  path. The retained workflow accepts only explicit `workflow_dispatch` input,
  preventing ordinary branch pushes from creating Preview Smoke activity.

# 2026-07-19 — Canary Security Closeout

## Outcome

- The project owner explicitly revoked the project-level Vercel Automation
  Bypass `codex-canary-smoke`; its old secret was neither restored nor printed.
- Confirmed the local bypass file remains absent. The remote RC branch still
  contains only operational changes after the passed Full Gate: the manual-only
  Canary workflow cleanup and documentation, with no Quality Case product,
  schema, permission, or Preview-resource change.
- Vercel deployment inspection remains `Ready`. This runner cannot complete a
  direct unauthenticated HTTP protection probe because its TCP connection to
  the Preview host times out before any Vercel or application response.
- Vercel does not expose a readable Automation Bypass-name listing to the
  available CLI metadata call, so the owner’s Vercel Settings confirmation is
  retained as the authoritative revocation evidence.

## Decision

- The isolated Full Gate result in GitHub Actions Run `29554792374` remains
  valid. With the bypass revoked and all temporary Smoke infrastructure already
  cleaned, RC Preview is **CANARY GO**. Continue with a named, limited Canary
  and monitor operational signals; do not expand this decision to Production.

# 2026-07-19 — Named User Canary Preparation

## Outcome

- Provisioned a new empty, dedicated Neon project for the named-user Preview;
  it was migrated from the current repository schema without copying existing
  8D data and is scoped only to `codex/rc2-preview-hardening` Preview.
- Rebuilt the RC Preview with that branch-scoped database and confirmed the
  deployment is Ready. Existing Preview R2, Resend, and AI variable names are
  present; no Production deployment or resource was changed.
- Re-ran the isolated Cloudflare R2 Preview Smoke. Upload, download, private
  access rejection, database-failure compensation cleanup, and deletion passed
  against `8d-reports-preview`.
- Added the named-user Playbook and redacted observation template. No real
  participant identity, account, email, task token, share link, or Evidence
  file has been created or committed.

## Current Limitation

- The actual named-user session is intentionally not started until the operator
  obtains participant consent and provides access through an approved channel.
  The facilitator must issue a temporary Vercel protected-deployment share link
  before each participant opens their in-product Coordinator or external task
  link.
