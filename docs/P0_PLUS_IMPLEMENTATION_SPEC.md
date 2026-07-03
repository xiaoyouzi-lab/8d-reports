# P0+ Implementation Spec

Date: 2026-07-03

## Scope

This spec locks the implementation plan for the confirmed P0+ mainline:

Homepage guest natural-language intake -> AI quality expert draft -> AI readiness check -> next-step guidance -> login-gated edit/save/export.

This document is docs-only. It does not implement runtime behavior, modify database schema, change auth/payment/export/share/team permissions, alter AI backend code, or restore any stashed SEO work.

## A. Current Reusable Code Map

| Area | Current paths | Current behavior | Reuse for P0+ | Boundary / risk |
| --- | --- | --- | --- | --- |
| Homepage / marketing home | `src/app/(marketing)/page.tsx`, `src/components/marketing/*` | Public marketing landing page with static hero, sample preview, signup/template CTAs, and SEO metadata. No guest intake or AI preview exists. | Add a small isolated guest-intake entry component to the existing homepage when implementation begins. Reuse page shell, CTA styling, analytics patterns, and existing marketing layout constraints. | Keep public copy changes minimal. Do not expand SEO content pages. Do not turn the homepage into a broad QMS or review-service funnel. |
| Manual New Report flow | `src/app/(app)/reports/new/page.tsx`, `src/app/api/reports/route.ts`, `src/app/(app)/dashboard/page.tsx` | Authenticated users choose report type and priority. `POST /api/reports` creates an empty persisted report, checks quota/team role, sets `hasConsumedQuota: true`, and logs creation. | Reuse only after authenticated conversion from preview to real report. The creation logic and activity logging are the right durable boundary. | Do not call `POST /api/reports` for anonymous preview. It requires login and consumes quota; using it before login would pollute reports and billing semantics. |
| AI Draft API / service | `src/components/report/AiReportTools.tsx`, `src/app/api/ai/draft-report/route.ts`, `src/lib/ai/deepseek.ts`, `src/lib/ai/report-payload.ts` | Authenticated, beta-email gated, report-bound draft generation. Requires `reportId`, edit permission, unlocked report, and source materials. Calls `callDeepSeekJson("draft_generation", ...)`. | Reuse the DeepSeek JSON wrapper, senior quality engineer prompt style, conservative evidence rules, material summarization patterns, and draft result rendering concepts. | Do not open the existing endpoint to guests. It assumes a report id, user session, report access checks, and editor-side application of fields. |
| AI Quality Check API / service | `src/components/report/AiReportTools.tsx`, `src/app/api/ai/report-review/route.ts`, `src/lib/ai/deepseek.ts`, `src/lib/ai/report-payload.ts`, `src/lib/ai/knowledge-context.ts`, `src/components/report/KnowledgeReadinessPanel.tsx` | Authenticated, beta-email gated, report-bound review. Requires edit permission and may include permission-safe historical knowledge context. | Reuse the conservative review shape: readiness, missing information, customer rejection risks, improvement suggestions, and evidence warnings. | Anonymous preview must not call historical knowledge context. Guest AI must only use the submitted intake text and any explicitly submitted preview attachments/text. |
| Report data model | `src/lib/report-steps.ts` | Defines `ReportData`, `DEFAULT_REPORT_DATA`, D0-D8 field list, completion issues, completed step ids, and knowledge readiness helpers. | Use as the canonical mapping target for generated draft fields after login conversion. Reuse step and field names to avoid a parallel report model. | P0+ preview schema should include provenance/readiness metadata around the fields; persisted `ReportData` should remain the existing editable report shape. |
| Report save / edit | `src/app/(app)/reports/[id]/page.tsx`, `src/app/api/reports/[id]/route.ts`, `src/components/report/StepForm.tsx`, `src/lib/report-workflow.ts` | Authenticated editor loads report data, redirects anonymous users to login, saves through `PUT /api/reports/[id]`, enforces `canEdit`, locked workflow state, completion checks, and activity logging. | Reuse as the only editing and saving experience after conversion. P0+ should route signed-in users to `/reports/[id]`. | Guest preview must be read-only. Do not add anonymous save/edit paths to this editor. |
| Export PDF / Word / Excel / ZIP | `src/components/report/ExportMenu.tsx`, `src/lib/pdf-export.ts`, `src/lib/word-export.ts`, `src/lib/xlsx-export.ts`, `src/lib/export-zip.ts`, `src/app/api/reports/[id]/export/docx/route.ts`, `src/app/api/reports/[id]/export/xlsx/route.ts`, `src/app/api/reports/[id]/export/package/route.ts` | Existing export surface is tied to report access, entitlements, single-export gating, and authenticated report state. | Reuse unchanged after login conversion and save. Preview can show "export after login" guidance but must not produce files. | Do not modify export templates, server export checks, payment gates, watermark behavior, or ZIP attachment packaging for P0+. |
| Share / permissions | `src/components/report/ShareDialog.tsx`, `src/app/api/reports/[id]/share/route.ts`, `src/app/api/share/[token]/route.ts`, `src/app/share/[token]/page.tsx`, `src/lib/report-workflow.ts` | Owners/editors can create share links. Pro/Team editable share links allow anonymous recipients to edit and save the original report through share token routes. | Keep as the post-login collaboration model. P0+ preview should use separate preview tokens/state, not report share tokens. | Do not reuse editable share links for guest preview. They intentionally permit no-login edits to existing original reports, which conflicts with the P0+ auth boundary. |
| Login / signup redirect | `src/app/(auth)/login/login-form.tsx`, `src/app/(auth)/signup/signup-form.tsx`, `src/proxy.ts`, `src/app/(app)/layout.tsx`, `src/lib/api-helpers.ts` | `/dashboard` and `/reports` are protected. Login/signup accept a safe same-origin `callbackUrl` and return users after auth. APIs use `getSessionUser` and `unauthorizedResponse`. | Reuse `callbackUrl` for continuation from preview to authenticated conversion. The callback should point to a bounded preview continuation route, not embed large AI payloads in the URL. | Callback URLs must remain same-origin and cannot carry sensitive or large preview payloads. |
| Anonymous rate limit pattern | `src/lib/rate-limit.ts`, `src/app/api/auth/[...all]/route.ts`, `src/app/api/auth-email/signup-verification/route.ts`, `src/app/api/auth-email/password-reset/route.ts` | Simple in-memory per-IP limiter with a 10 requests/minute window, currently used around auth/email surfaces. | Reuse the concept and response pattern for first implementation, or wrap it behind a P0+ specific limiter interface. | In-memory rate limiting is not durable across serverless instances and is insufficient as the final abuse control for public AI usage. |
| Tests / smoke scripts | `package.json`, `scripts/team-governance.test.ts`, `scripts/production-smoke.test.ts`, `scripts/authenticated-production-smoke.test.ts`, `scripts/smoke/*` | `npm run lint`, `npm run build`, governance, production smoke, and authenticated smoke scripts exist. | Add P0+ schema/fixture tests and extend smoke coverage when runtime implementation starts. | Current tests do not prove anonymous AI preview safety, preview-to-login conversion, or no private knowledge access. |

## B. P0+ Target Flow

1. Guest lands on `/`.
2. Guest enters messy natural-language quality material in one homepage input:
   - customer complaint text,
   - internal line feedback,
   - inspection summary,
   - supplier reply,
   - containment notes,
   - 5-Why notes,
   - text descriptions of photos or evidence.
3. Guest submits for preview.
4. The public preview API validates size, applies anonymous rate limits, and calls a preview-safe AI service.
5. AI acts as a senior quality expert and returns:
   - case summary,
   - D0-D8 draft fields,
   - missing information,
   - required evidence,
   - readiness check,
   - next-step guidance,
   - assumptions and confidence/evidence labels.
6. Guest sees a read-only preview. The preview may allow expanding sections, copying visible text, or starting login/signup, but it must not allow durable edit/save/upload/share/export.
7. If the guest chooses to continue, the app sends them to login/signup with a safe callback pointing to a preview continuation route.
8. After authentication, the continuation route converts the preview into a real report using existing authenticated creation semantics.
9. The user lands in `/reports/[id]` for editing, saving, attachment upload, share, and export through existing permission and entitlement systems.

Allowed before login:

- Natural-language intake on homepage.
- AI draft preview.
- AI readiness preview.
- Missing-evidence and next-step guidance.

Required after login:

- Persisted report creation.
- Editing D0-D8 fields.
- Saving report data.
- Uploading attachments or signatures.
- Sharing.
- Exporting PDF, Word, Excel, or ZIP.
- Accessing dashboard, knowledge, report history, teams, private knowledge context, or activity history.

## C. Page and Route Design

### Public Pages

| Route | Access | Purpose | Notes |
| --- | --- | --- | --- |
| `/` | Guest and authenticated | Homepage with guest natural-language intake entry point. | Add the intake as a focused component. Preserve existing marketing routes and SEO pages. |
| `/p0-plus/preview/[token]` | Guest and authenticated | Read-only AI preview page. | Shows draft, readiness, evidence gaps, and next steps. No edit/save/export controls. |
| `/p0-plus/continue/[token]` | Authenticated required | Converts a valid preview into a real report, then redirects to `/reports/[id]`. | Anonymous users should be redirected to `/login?callbackUrl=/p0-plus/continue/[token]` or signup equivalent. |

### API Routes

| Route | Access | Purpose | Hard constraints |
| --- | --- | --- | --- |
| `POST /api/p0-plus/preview` | Guest allowed | Validate intake, apply abuse controls, call preview-safe AI, create temporary preview state, return token and preview payload. | Must not read private reports, create persisted reports, consume report quota, upload files, create share links, or export files. |
| `GET /api/p0-plus/preview/[token]` | Guest allowed | Return existing preview payload while valid. | Must return read-only preview data only. Must not include private user/report data. |
| `POST /api/p0-plus/preview/[token]/convert` | Authenticated only | Convert temporary preview into a real report. | Must use authenticated report creation rules, quota/entitlement checks, and existing report data shape. |

### Existing Routes To Preserve

- `/reports/new` remains the manual authenticated empty-report flow.
- `/reports/[id]` remains the only full editor and save surface.
- `/api/ai/draft-report` remains authenticated, report-bound, and beta-gated until a later explicit decision changes AI gating.
- `/api/ai/report-review` remains authenticated, report-bound, and private-knowledge-aware.
- `/api/share/[token]` remains external report sharing, not guest preview.
- Export routes remain authenticated and permission-gated.

### Recommended Component Shape

| Component / module | Responsibility |
| --- | --- |
| `src/components/marketing/P0PlusIntake.tsx` | Homepage textarea, submit button, validation, local preservation of draft input, and redirect to preview token. |
| `src/components/p0-plus/PreviewReport.tsx` | Read-only display of case summary, D0-D8 draft, readiness, missing info, required evidence, and next steps. |
| `src/lib/p0-plus/schema.ts` | Runtime validation and TypeScript types for preview input/output. |
| `src/lib/p0-plus/ai.ts` | Preview-safe prompt construction and AI call orchestration. |
| `src/lib/p0-plus/rate-limit.ts` | P0+ specific anonymous limits and abuse decisions. |
| `src/lib/p0-plus/convert.ts` | Authenticated conversion from preview payload to `ReportData` and real report creation. |

## D. AI Service Contract

P0+ AI must behave as two explicit quality roles, not as a generic writer.

### Role A: Quality Case Intake Analyst

Responsibilities:

- Extract facts, roles, defects, lots/batches, quantities, measurements, specifications, evidence, containment notes, and missing information from messy quality descriptions.
- Accept raw user material such as customer emails, production line feedback, inspection summaries, supplier replies, containment updates, and text descriptions of photos or evidence.
- Separate defect symptoms from confirmed facts, suspected facts, assumptions, missing data, and conflicting statements.
- Generate clarification questions when company/person roles are unclear, such as our company, customer, supplier, requester, owner, or approver.

Principles:

- Only extract what is present in the submitted text.
- Use `provided` when the user directly states a fact.
- Use `extracted` when the fact is pulled from pasted email/text/inspection summary/supplier reply.
- Use `needs_confirmation` when information may be present but the role, meaning, or ownership is unclear.
- Use `missing` when information is absent.
- Use `conflicting` when submitted content disagrees.
- Use `inferred` only for AI assumptions, and never treat inferred content as fact.
- Do not fill customer, supplier, batch, quantity, measurement, owner, date, or deadline fields when the input does not support them.

### Role B: Senior Quality Readiness Reviewer

Responsibilities:

- Review the draft like a senior manufacturing quality manager or SQE preparing a customer-facing 8D/SCAR response.
- Check report quality, missing evidence, customer submission risks, and practical next actions.
- Make next actions specific enough to show who should act, why they should act, and which D step the action supports.

Required checks:

- D2 problem clarity.
- D3 containment completeness.
- D4 occurrence cause.
- D4 escape cause.
- 5Why logic.
- D5 corrective action traceability to root cause.
- D6 verification evidence.
- D7 prevention quality.
- Owner/date/evidence completeness.
- Customer submission risk.

Shared quality knowledge range:

- 8D / D0-D8 structure.
- Problem definition discipline: what, where, when, who, quantity, scope, customer impact.
- Containment quality: immediate action, scope, owner, due date, effectiveness check.
- Root cause quality: occurrence cause, escape cause, system cause, 5-Why logic, fishbone categories.
- Corrective action linkage: action must address confirmed root cause.
- Validation: objective evidence, before/after data, sample size, dates, acceptance criteria.
- Prevention: system update, process control, horizontal deployment, training, documentation.
- Customer-facing risk: vague statements, unsupported claims, missing evidence, overclaiming closure.

Strict bans:

- Do not invent evidence, measurements, dates, names, approvals, signatures, test results, sample sizes, standards compliance, customer responses, or historical facts.
- Do not say a report is approved, certified, submitted, accepted, or guaranteed to pass customer review.
- Do not use private report history, knowledge context, team data, attachments, or account data for anonymous preview.
- Do not treat draft text as verified fact.
- Do not create legal, regulatory, or certification assurances.

Recommended preview AI tasks:

| Task | Input | Output | Notes |
| --- | --- | --- | --- |
| `p0_plus_case_intake` | Raw guest text and optional client metadata such as locale. | Extracted facts, role map, clarification questions, uncertainties, potential D0-D8 mapping, and missing evidence. | Implements Quality Case Intake Analyst. No private context. Should normalize messy text before drafting. |
| `p0_plus_draft_and_readiness` | Intake extraction plus raw text. | Full preview schema: summary, D0-D8 draft, readiness check, missing info, required evidence, and next actions. | Implements Senior Quality Readiness Reviewer. May be one call for PR1 or split into two calls later if cost/latency requires it. |

Operational expectations:

- Input length cap: start with 10,000 characters to match the current AI draft material cap unless product explicitly changes it.
- Output must be JSON only and validated before rendering.
- Fallback response must be safe and useful: explain that preview generation is unavailable and preserve the user's input locally, without creating a report.
- Any field without evidence should use `No relevant data` or an equivalent explicit missing-data marker.
- Assumptions must be separate from draft facts.

## E. Structured Schema Draft

The preview schema wraps existing report fields with provenance and readiness metadata. It should not replace `ReportData`; it should map into `ReportData` only after authenticated conversion.

```ts
type P0PlusSourceStatus =
  | "provided"
  | "extracted"
  | "inferred"
  | "missing"
  | "needs_confirmation"
  | "conflicting"
  | "not_applicable";

type P0PlusReadinessStatus =
  | "ready"
  | "weak"
  | "missing"
  | "needs_confirmation"
  | "not_applicable";

type P0PlusRiskLevel = "low" | "medium" | "high";

type P0PlusEvidencePriority = "required" | "recommended" | "optional";

type P0PlusStepId = "D0" | "D1" | "D2" | "D3" | "D4" | "D5" | "D6" | "D7" | "D8";

type P0PlusNextActionType =
  | "collect_inspection_data"
  | "confirm_lot_or_batch"
  | "confirm_part_or_supplier"
  | "quarantine_or_sort_stock"
  | "request_supplier_root_cause"
  | "add_measurement_vs_spec"
  | "add_defect_evidence"
  | "add_containment_record"
  | "add_verification_evidence"
  | "clarify_customer_supplier_roles"
  | "review_before_customer_submission"
  | "login_to_edit"
  | "export_after_review";

type P0PlusSuggestedOwner =
  | "quality"
  | "inspection"
  | "production"
  | "supplier"
  | "customer"
  | "unknown";

interface P0PlusPreviewResponse {
  schemaVersion: "p0-plus-preview-v1";
  generatedAt: string;
  modelTask: "p0_plus_draft_and_readiness";
  inputSummary: {
    sourceType: "customer_complaint" | "line_feedback" | "inspection_summary" | "supplier_reply" | "mixed" | "unknown";
    caseSummary: string;
    knownFacts: P0PlusEvidenceItem[];
    assumptions: P0PlusEvidenceItem[];
    conflicts: P0PlusEvidenceItem[];
    clarificationQuestions: P0PlusClarificationQuestion[];
  };
  draft: {
    reportType: P0PlusField<"customer_8d" | "internal_8d">;
    priority: P0PlusField<"low" | "medium" | "high">;
    D0: {
      problemSource: P0PlusField<string>;
      customerName: P0PlusField<string>;
    };
    D1: {
      teamLeader: P0PlusField<string>;
      teamMembers: P0PlusField<string>;
    };
    D2: {
      problemDescription: P0PlusField<string>;
      whereFound: P0PlusField<string>;
      whenFound: P0PlusField<string>;
      whoFound: P0PlusField<string>;
      productName: P0PlusField<string>;
      batchNumber: P0PlusField<string>;
      defectQuantity: P0PlusField<string>;
      totalQuantity: P0PlusField<string>;
    };
    D3: {
      containmentDescription: P0PlusField<string>;
      containmentScope: P0PlusField<string>;
      containmentResponsible: P0PlusField<string>;
      containmentDueDate: P0PlusField<string>;
      containmentValidUntil: P0PlusField<string>;
      containmentVerification: P0PlusField<string>;
    };
    D4: {
      rootCauseOccurrence: P0PlusField<string>;
      rootCauseEscape: P0PlusField<string>;
      rootCauseSystem: P0PlusField<string>;
      fishboneMan: P0PlusField<string>;
      fishboneMachine: P0PlusField<string>;
      fishboneMaterial: P0PlusField<string>;
      fishboneMethod: P0PlusField<string>;
      fishboneMeasurement: P0PlusField<string>;
      fishboneEnvironment: P0PlusField<string>;
      why1: P0PlusField<string>;
      why2: P0PlusField<string>;
      why3: P0PlusField<string>;
      why4: P0PlusField<string>;
      why5: P0PlusField<string>;
      confirmedRootCause: P0PlusField<string>;
    };
    D5: {
      testingPlan: P0PlusField<string>;
      testingResults: P0PlusField<string>;
      selectedCorrectiveAction: P0PlusField<string>;
      correctiveRationale: P0PlusField<string>;
      costEstimate: P0PlusField<string>;
      correctiveResponsible: P0PlusField<string>;
      correctiveTargetDate: P0PlusField<string>;
    };
    D6: {
      implementationPlan: P0PlusField<string>;
      completionDate: P0PlusField<string>;
      validationMethod: P0PlusField<string>;
      validationResults: P0PlusField<string>;
    };
    D7: {
      systemChanges: P0PlusField<string>;
      processUpdates: P0PlusField<string>;
      horizontalDeployment: P0PlusField<string>;
      trainingNeeds: P0PlusField<string>;
    };
    D8: {
      closureDate: P0PlusField<string>;
      lessonsLearned: P0PlusField<string>;
      teamAcknowledgment: P0PlusField<string>;
      preparedBy: P0PlusField<string>;
      reviewedBy: P0PlusField<string>;
      approverName: P0PlusField<string>;
    };
  };
  readiness_check: {
    overall_risk: P0PlusRiskLevel;
    score: number;
    canStartAuthenticatedEdit: boolean;
    section_checks: P0PlusSectionCheck[];
    customer_submission_risks: P0PlusEvidenceItem[];
    missing_evidence: P0PlusEvidenceItem[];
    recommended_fixes: P0PlusEvidenceItem[];
    next_actions: P0PlusNextAction[];
  };
  missingInformation: P0PlusEvidenceItem[];
  requiredEvidence: P0PlusRequiredEvidence[];
  next_actions: P0PlusNextAction[];
  conversion: {
    recommendedReportTitle: string;
    reportDataPatch: Partial<ReportData>;
    fieldsToLeaveBlank: Array<keyof ReportData>;
  };
}

interface P0PlusField<T> {
  value: T;
  sourceStatus: P0PlusSourceStatus;
  rationale: string;
  sourceQuote?: string;
  confidence: "low" | "medium" | "high";
}

interface P0PlusEvidenceItem {
  stepId?: P0PlusStepId;
  label: string;
  detail: string;
  sourceStatus: P0PlusSourceStatus;
  severity?: "info" | "warning" | "blocker";
}

interface P0PlusRequiredEvidence {
  stepId: P0PlusStepId;
  title: string;
  whyItMatters: string;
  examples: string[];
  priority: P0PlusEvidencePriority;
  relatedAttachmentRefs?: P0PlusAttachmentReference[];
}

interface P0PlusAttachmentReference {
  attachmentRef: string;
  relationshipStatus: "mentioned_by_user" | "needs_upload_after_login" | "not_available";
  note: string;
}

interface P0PlusClarificationQuestion {
  question: string;
  reason: string;
  linkedStepId: P0PlusStepId;
  sourceStatus: "needs_confirmation" | "missing" | "conflicting";
}

interface P0PlusSectionCheck {
  stepId: "D2" | "D3" | "D4" | "D5" | "D6" | "D7" | "D8";
  checkType:
    | "problem_clarity"
    | "containment_completeness"
    | "occurrence_cause"
    | "escape_cause"
    | "five_why_logic"
    | "corrective_action_traceability"
    | "verification_evidence"
    | "prevention_quality"
    | "owner_date_evidence_completeness";
  status: P0PlusReadinessStatus;
  finding: string;
  risk: P0PlusRiskLevel;
  recommended_fix: string;
  required_evidence: string[];
}

interface P0PlusNextAction {
  actionType: P0PlusNextActionType;
  title: string;
  detail: string;
  reason: string;
  suggestedOwner: P0PlusSuggestedOwner;
  priority: "high" | "medium" | "low";
  linkedStepId: P0PlusStepId;
  sourceStatus: P0PlusSourceStatus;
}
```

Schema rules:

- `reportDataPatch` may only include keys from existing `ReportData`.
- `reportDataPatch` must not include signatures, approval dates, uploaded attachment URLs, or export metadata.
- Every generated field must include `sourceStatus`.
- `provided` means the user explicitly supplied the fact.
- `extracted` means the fact was pulled from pasted email, text, inspection summary, or supplier reply.
- Fields marked `inferred` must be visible as assumptions in preview.
- Fields marked `needs_confirmation` must produce a clarification question or next action.
- Missing evidence must remain missing; AI must not fill it with invented details.
- `readiness_check.section_checks` must cover D2 problem clarity, D3 containment completeness, D4 occurrence cause, D4 escape cause, 5Why logic, D5 corrective action traceability, D6 verification evidence, D7 prevention quality, and owner/date/evidence completeness.
- `next_actions` must always explain who should act, why the action matters, and which D step it supports.
- P1-lite attachment handling is relationship-only. The user may mention "photo shows leak at connector" in text, but P0+ does not perform image/video recognition or deep file parsing.

## F. Guest Preview Data Model

The preview state must be separate from persisted reports and share links.

### Option 1: Temporary Preview Table

Store preview input, AI output, token hash, expiry, IP/browser limiter metadata, and optional authenticated owner after conversion in a dedicated temporary preview table.

Pros:

- Handles large AI payloads without huge URLs.
- Supports refresh and login/signup callback.
- Supports expiry, conversion audit, and abuse investigation.
- Avoids creating real reports before login.
- Avoids consuming report quota before the user chooses to continue.

Cons:

- Requires a future explicit database migration.
- Requires retention and cleanup policy.

Recommendation: best production shape for P0+ after schema changes are explicitly allowed.

### Option 2: Signed Encrypted Token Payload

Return all preview state inside a signed/encrypted token.

Pros:

- No database table required.
- Easy to keep preview separate from reports.

Cons:

- Payload can become too large for URLs/cookies.
- Harder to revoke or rate-limit repeated conversions.
- Harder to inspect abuse and failures.
- Rotation and encryption mistakes carry real risk.

Recommendation: acceptable only for a very small proof-of-concept, not preferred for the main P0+ implementation.

### Option 3: Session / Browser Storage Only

Keep the preview payload in local browser storage until login.

Pros:

- No database or server persistence.
- Simple initial UI iteration.

Cons:

- Fragile across devices, browsers, cookie clearing, and OAuth redirects.
- Cannot safely convert server-side without trusting client-supplied AI payload.
- Does not support a durable preview URL.

Recommendation: useful only as a UX backup to preserve raw input after errors. Do not use as the authoritative conversion state.

### Option 4: Reuse Report Drafts Or Share Tokens

Create a normal report draft or share token for guest preview.

Pros:

- Reuses existing editor/share paths.

Cons:

- Violates the auth boundary.
- Pollutes report data before login.
- Can consume quota incorrectly.
- Share tokens already support anonymous editing of original reports.

Recommendation: do not use.

### Retention And Conversion Rules

- Preview expires after a short window, for example 24 hours.
- Preview token should be random and stored hashed if backed by a database.
- Conversion requires login.
- Conversion creates a real report and routes to `/reports/[id]`.
- Quota consumption should happen at conversion, not at preview generation.
- Conversion should copy only `conversion.reportDataPatch` and a bounded source summary into the report.
- Raw guest input retention should be minimized. If stored, it needs expiry and should not appear in exports by default.

## G. Anonymous Rate Limiting

P0+ introduces a public AI cost and abuse surface. Anonymous use must be deliberately bounded.

Initial limits:

- Validate body size before AI call.
- Require non-empty input with enough signal, for example at least 40 visible characters.
- Cap raw input at 10,000 characters.
- Rate-limit by IP address.
- Rate-limit by a browser token stored in a first-party cookie or local storage.
- Return `429` with a neutral message when limited.
- Preserve the user's typed input client-side when limited or failed.

Recommended starting policy:

- Burst: 2 preview generations per 5 minutes per browser token.
- Daily: 5 preview generations per day per browser token.
- IP safety: 20 preview generations per day per IP, with lower thresholds for obviously automated traffic.
- Repeated failure or suspicious use: require additional friction before another AI call.

Implementation notes:

- The existing `src/lib/rate-limit.ts` in-memory limiter is useful as a small pattern but not sufficient for production public AI usage.
- The P0+ limiter should be isolated behind a P0+ specific helper so storage can later move from memory to a durable store without rewriting route logic.
- Rate limiting should happen before AI provider calls.
- Guest preview must not disclose whether an email, account, team, report, or private resource exists.
- Do not add unlimited retry loops in the client.

## H. Compatibility Guarantees

P0+ implementation must preserve these guarantees:

- No changes to existing database schema unless a future PR is explicitly scoped for preview persistence.
- No changes to payment, checkout, subscription, entitlement, or webhook behavior.
- No changes to export templates or existing PDF/Word/Excel/ZIP export permission checks.
- No changes to share-token semantics.
- No changes to team roles or report workflow permissions.
- No changes to auth provider configuration or environment variables unless explicitly scoped later.
- `/reports/new` continues to create manual empty authenticated reports.
- `/reports/[id]` remains the only full edit/save surface.
- `/api/ai/draft-report` and `/api/ai/report-review` remain authenticated and report-bound until explicitly changed.
- Anonymous preview does not query `buildKnowledgeContextForQualityCheck` or any private historical reports.
- Guest preview cannot upload attachments, create signatures, share reports, export files, or save durable report changes.
- Existing SEO/resource/help/learn/sample/demo/pricing pages remain intact unless explicitly changed later.
- AI output must remain conservative: missing evidence is surfaced, not invented.

## I. Test Plan

### Schema And Prompt Tests

- Validate P0+ preview output schema with fixed AI fixture JSON.
- Reject unknown `ReportData` keys in `conversion.reportDataPatch`.
- Reject or sanitize signature/export/share/private fields in conversion payload.
- Ensure missing evidence returns `sourceStatus: "missing"` or equivalent explicit missing status.
- Ensure assumptions remain separate from known facts.

### AI Fixture Cases

Use deterministic mocked AI outputs for:

- Injection molding flash / excess material:
  - Input characteristics: production line found flash or excess material on an injection molded part; supplier is mentioned; photos are mentioned; batch/lot is missing or uncertain; defect quantity is missing.
  - Expected output: do not invent batch/lot or defect quantity; generate a useful D2 draft from the symptom and available context; mark D3, D4, and D5-D7 as `missing`, `weak`, or `needs_confirmation` as evidence requires; create `next_actions` to confirm lot/batch, count affected quantity, add defect photos/inspection data, and request supplier analysis when supplier responsibility is plausible but unconfirmed.
- SMT / PCBA solder defect:
  - Input characteristics: solder joint defect such as insufficient solder or bridging; preliminary inspection data exists; root cause is not yet known.
  - Expected output: do not invent root cause; distinguish defect symptom from pending D4 occurrence cause and escape cause; create `next_actions` to add 5Why, process parameters, reflow profile, solder paste/stencil evidence, inspection escape investigation, and measurement versus specification records.
- Customer email requests SCAR but roles are unclear:
  - Input characteristics: pasted email includes multiple companies or people; it is unclear which company is our company, customer, or supplier; customer requests SCAR/8D and a deadline may be present.
  - Expected output: generate clarification questions exactly covering "Which company is your company?", "Which company is the customer?", "Which company is the supplier?", "Who requested the 8D/SCAR?", and "What is the submission deadline?"; do not fill customer or supplier fields without evidence; mark affected fields as `needs_confirmation`.

Optional additional fixtures may include:

- Sparse complaint: only customer says "part failed in field"; expected result should produce a limited draft and many blockers.
- Strong inspection summary: defect counts, batch, containment, owner, and validation evidence present; expected result should mark more sections ready but still avoid approval language.
- Conflicting supplier reply: supplier denies defect but inspection notes show failures; expected result should flag conflict and customer rejection risk.

### Route Tests

- `POST /api/p0-plus/preview` accepts valid guest input and returns read-only preview data.
- `POST /api/p0-plus/preview` rejects oversized input before AI call.
- Rate-limited requests return `429` before AI call.
- `GET /api/p0-plus/preview/[token]` returns preview only while valid.
- `POST /api/p0-plus/preview/[token]/convert` requires login.
- Authenticated conversion creates a report and redirects to `/reports/[id]`.
- Conversion consumes quota only once and only after login.

### Privacy And Permission Tests

- Anonymous preview does not call `getSessionUser`, `getReportAccess`, report list queries, team queries, `buildKnowledgeContextForQualityCheck`, export routes, or share routes.
- Guest preview payload never includes user id, team id, report history, attachment download URLs, activity logs, or private knowledge context.
- Existing share-token editable flow still works unchanged for Pro/Team share links.
- Viewer/editor/owner permissions on `/reports/[id]` remain unchanged.

### UI Smoke Tests

- Homepage guest input renders and validates empty/short/oversized states.
- Successful preview page shows summary, D0-D8 draft, missing evidence, `readiness_check`, and `next_actions`.
- Preview page has no save, upload, share, or export controls.
- Login/signup callback returns to continuation route.
- After conversion, user lands in existing editor with mapped draft fields.

### Regression Checks

- `npm run lint`
- `npm run build`
- `git diff --check`
- Existing authenticated smoke scripts when runtime routes are implemented:
  - `npm run test:governance`
  - `npm run test:auth-smoke`
  - targeted production smoke only when environment is available.

## J. PR Breakdown

### PR1: AI Expert Brain And Schema

Scope:

- Add P0+ schema/types and validation.
- Add preview-safe AI prompt contract.
- Add deterministic fixture tests for injection molding flash/excess material, SMT/PCBA solder defect, and unclear SCAR customer/supplier roles.
- Add mapping helper from preview schema to `Partial<ReportData>`.

Non-goals:

- No homepage UI.
- No public AI route.
- No database migration.
- No auth/payment/export/share changes.

Acceptance:

- Fixture tests prove conservative missing-evidence handling.
- Fixture tests prove `provided`, `extracted`, `inferred`, `missing`, `needs_confirmation`, `conflicting`, and `not_applicable` statuses are used correctly.
- Fixture tests prove `readiness_check` and `next_actions` identify owner, reason, linked D step, and customer submission risk.
- Mapping rejects unknown or unsafe fields.
- No runtime public behavior changes unless explicitly hidden behind tests-only helpers.

Recommended first implementation task: start here. PR1 is AI expert brain + schema + deterministic fixtures only. It creates the contract before exposing anonymous AI.

### PR2: Guest Preview API And Rate Limit

Scope:

- Add `POST /api/p0-plus/preview` and `GET /api/p0-plus/preview/[token]`.
- Add isolated anonymous rate limiting.
- Add preview storage according to the approved data model.
- Wire the route to the P0+ AI service.

Non-goals:

- No authenticated conversion yet unless preview storage requires owner fields.
- No export/share changes.
- No private knowledge context.

Acceptance:

- Anonymous preview works within limits.
- Oversized and rate-limited requests do not call AI.
- Guest response contains no private data.

### PR3: Homepage Intake And Preview UI

Scope:

- Add homepage intake component.
- Add preview page display.
- Add `next_actions` guidance UI that shows owner, reason, linked D step, and priority.
- Preserve existing public page structure and routes.

Non-goals:

- No broad marketing rewrite.
- No SEO expansion.
- No editor changes.

Acceptance:

- Guest can generate a read-only preview from homepage.
- Preview page has no edit/save/upload/share/export controls.
- Empty, short, failed, and rate-limited states are handled.

### PR4: Authenticated Conversion To Report

Scope:

- Add continuation route and authenticated conversion endpoint.
- Convert preview payload into a real report.
- Redirect to `/reports/[id]`.
- Use existing report creation, quota, permissions, activity logging, and editor behavior.

Non-goals:

- No export template changes.
- No share-token changes.
- No payment changes except existing quota/entitlement enforcement.

Acceptance:

- Anonymous users are redirected to login/signup before conversion.
- Authenticated users can convert exactly once or receive a safe already-converted response.
- Converted reports open in the existing editor.
- Existing save/export/share behavior remains unchanged.

### PR5: Hardening And Smoke Coverage

Scope:

- Add smoke coverage for preview, auth handoff, conversion, and no guest export/share controls.
- Add observability/analytics events if existing analytics patterns support them.
- Tune rate limits and failure messages based on initial QA.

Non-goals:

- No P1 deep file recognition.
- No image/video recognition.
- No human review service.
- No full QMS.

Acceptance:

- Lint/build pass.
- Targeted route and UI smoke checks pass.
- Abuse and privacy guardrails are covered by tests.
