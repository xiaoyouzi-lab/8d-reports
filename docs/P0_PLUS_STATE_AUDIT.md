# P0+ State Audit

Date: 2026-07-03

## Scope

This audit covers the current 8D Reports state for the confirmed P0+ path:

Homepage guest natural-language intake -> AI quality expert draft -> AI readiness check -> next-step guidance -> login-gated edit/save/export.

No runtime feature, database schema, payment, export template, auth, production configuration, or public marketing copy was changed for this audit.

## Repository And PR State

- Current branch: `main`.
- Main sync: `git fetch origin main --prune` completed; `main...origin/main` is `0 0`, so local `main` is aligned with `origin/main`.
- Latest commit: `ac4e605 Add SEO keyword data research pipeline`.
- Existing uncommitted changes before this audit:
  - `ops/seo-keywords/output/keyword-opportunity-report.csv`
  - `ops/seo-keywords/output/keyword-opportunity-summary.md`
  - `ops/seo-keywords/input/serp-review.csv`
- GitHub open PRs: none. No open PR currently blocks or overlaps P0+.

## Audited Code Locations

| Area | Current locations | State for P0+ |
| --- | --- | --- |
| Homepage / marketing home | `src/app/(marketing)/page.tsx` | Implemented as a marketing landing page with signup, template setup, and sample report CTAs. It does not have guest natural-language intake or AI preview. |
| New Report creation | `src/app/(app)/reports/new/page.tsx`, `src/app/api/reports/route.ts`, `src/app/(app)/dashboard/page.tsx` | Login-gated creation exists. Users choose report type and priority; the API creates an empty report with report number, quota enforcement, and activity logging. No intake text is accepted here. |
| AI Draft API / service | `src/components/report/AiReportTools.tsx`, `src/app/api/ai/draft-report/route.ts`, `src/lib/ai/deepseek.ts`, `src/lib/ai/report-payload.ts` | Reusable core exists but is editor-only, beta-email gated, login-gated, report-bound, and requires edit permission. Prompt already frames AI as a senior quality engineer and forbids invented evidence. |
| AI Quality Check API / service | `src/components/report/AiReportTools.tsx`, `src/app/api/ai/report-review/route.ts`, `src/lib/ai/deepseek.ts`, `src/lib/ai/knowledge-context.ts`, `src/components/report/KnowledgeReadinessPanel.tsx` | Reusable conservative review exists but is editor-only, beta-email gated, login-gated, report-bound, and requires edit permission. It can include permission-safe historical knowledge context. |
| Report save / edit | `src/app/(app)/reports/[id]/page.tsx`, `src/app/api/reports/[id]/route.ts`, `src/components/report/StepForm.tsx`, `src/lib/report-workflow.ts`, `src/lib/report-steps.ts` | Mature login-gated editor exists. Save uses `PUT /api/reports/[id]`, enforces access/locked-state server-side, validates completion when closing, and logs changed fields. |
| Export PDF / Word / Excel / ZIP | `src/components/report/ExportMenu.tsx`, `src/lib/pdf-export.ts`, `src/lib/word-export.ts`, `src/lib/xlsx-export.ts`, `src/lib/export-zip.ts`, `src/app/api/reports/[id]/export/docx/route.ts`, `src/app/api/reports/[id]/export/xlsx/route.ts`, `src/app/api/reports/[id]/export/package/route.ts` | Existing export surface is login-gated through report permissions. PDF is client generated; Word/Excel/ZIP have server-side access checks and entitlement/single-export gates. Templates and export logic should not be touched for P0+. |
| Share / permissions | `src/components/report/ShareDialog.tsx`, `src/app/api/reports/[id]/share/route.ts`, `src/app/api/share/[token]/route.ts`, `src/app/share/[token]/page.tsx`, `src/lib/report-workflow.ts`, `src/lib/report-access.ts` | Share links support view-only and Pro/Team editable external access. This should remain separate from P0+ guest preview because share-token editing writes to an existing original report without login. |
| Login / signup redirect | `src/app/(auth)/login/login-form.tsx`, `src/app/(auth)/signup/signup-form.tsx`, `src/proxy.ts`, `src/app/(app)/layout.tsx` | Auth redirects already support `callbackUrl`. `src/proxy.ts` protects `/dashboard` and `/reports`, and app layout also redirects anonymous users to `/login`. P0+ can use this boundary for edit/save/export after preview. |

## Completed Capabilities

- Full authenticated D0-D8 report workspace exists.
- Report creation, editing, autosave-on-next, explicit save, completion validation, activity logging, workflow lock handling, and read-only viewer states exist.
- AI Draft exists as a report-bound assistant that uses user-provided source material and current report data.
- AI Quality Check exists as a conservative report review assistant with readiness, score, missing information, customer rejection risks, improvement suggestions, and knowledge-based observations.
- AI prompts already use a senior quality engineer role and explicitly forbid invented evidence, approvals, certifications, and customer acceptance claims.
- Missing AI provider or DeepSeek failure returns safe user-facing unavailable messages.
- Report export paths already cover PDF, Word, Excel, and ZIP packages with attachments.
- Authenticated routes and APIs enforce server-side authorization through `getSessionUser`, `getReportAccess`, entitlements, locked workflow state, and share permissions.
- Login and signup can return users to a `callbackUrl` after authentication.

## Not Completed / Risks

- Homepage guest natural-language intake is not implemented.
- There is no public guest API for AI draft preview. Current AI routes require login, beta email allowlist, an existing report id, and edit permission.
- There is no guest preview state model or secure handoff from anonymous preview to a newly created authenticated report.
- There is no P0+ next-step guidance layer that turns draft/readiness results into explicit actions such as sign in to edit, fill missing evidence, run quality check again, or export after saving.
- Current AI Draft UI applies fields only inside an existing authenticated report and only fills empty fields; this is safe but not yet a homepage preview workflow.
- Current AI Quality Check assumes persisted report data and optional historical knowledge context. A guest preview should not query private historical knowledge.
- `KnowledgeReadinessPanel` is useful but not the same as AI readiness. It checks reusable knowledge completeness, not customer-submission readiness.
- AI features are beta-email gated by `AI_BETA_EMAILS`. P0+ may require a deliberate gating decision, but that is out of scope for this audit because environment variables and production config are not to be changed.
- Current share-token editable workflow allows no-login edits to an existing report. Reusing that for P0+ would risk blurring guest preview with external collaboration permissions.
- Existing public SEO/marketing pages are broad and revenue-oriented. P0+ should not continue expanding SEO pages or rewrite public page copy until the runtime P0+ path is approved.
- Existing unrelated SEO worktree changes mean final `git diff` must be inspected carefully to distinguish this audit from pre-existing local edits.

## Reusable Code

- `src/lib/ai/deepseek.ts`: senior-quality-engineer prompts, JSON-only rules, DeepSeek call wrapper, safe unavailable messages.
- `src/lib/ai/report-payload.ts`: report/material summarization helpers. For P0+, a new guest-intake summarizer could reuse this shape while avoiding private report access.
- `src/components/report/AiReportTools.tsx`: output normalization, draft preview rendering pattern, quality check result rendering pattern, and conservative UI disclaimers.
- `src/lib/report-steps.ts`: `ReportData`, `DEFAULT_REPORT_DATA`, D0-D8 field model, completion issues, and knowledge-readiness helpers.
- `src/app/api/reports/route.ts`: authenticated report creation, quota enforcement, report number generation, activity logging.
- `src/app/api/reports/[id]/route.ts`: authenticated report load/save boundary, completion validation, permission enforcement, activity logging.
- `src/lib/report-workflow.ts`: report access rules, lock logic, owner/editor/viewer capability model, activity logging.
- `src/components/report/ExportMenu.tsx` plus export routes/libs: keep as the post-login export destination.
- `src/app/(auth)/login/login-form.tsx` and `src/app/(auth)/signup/signup-form.tsx`: `callbackUrl` support for returning to a P0+ continuation route after auth.

## Paths Not To Break

- Public acquisition and SEO routes:
  - `/`
  - `/resources`
  - `/resources/[slug]`
  - `/learn`
  - `/learn/[slug]`
  - `/help`
  - `/help/[slug]`
  - `/pricing`
  - `/sample-report`
  - `/demo-reports`
  - `/8d-report-template`
  - `/8d-report-review-service`
  - `/custom-8d-template-setup`
  - `/team-launch`
- Auth routes:
  - `/login`
  - `/signup`
  - `/reset-password`
  - `/api/auth/[...all]`
  - `/api/auth-email/signup-verification`
  - `/api/auth-email/password-reset`
- Authenticated app routes:
  - `/dashboard`
  - `/reports/new`
  - `/reports/[id]`
  - `/knowledge`
- Core APIs:
  - `/api/reports`
  - `/api/reports/[id]`
  - `/api/ai/draft-report`
  - `/api/ai/report-review`
  - `/api/reports/[id]/export/docx`
  - `/api/reports/[id]/export/xlsx`
  - `/api/reports/[id]/export/package`
  - `/api/reports/[id]/share`
  - `/api/share/[token]`
  - `/api/checkout`
  - `/api/webhooks/creem`

## Recommended P0+ Development Order

1. Add a scoped P0+ product spec before code: exact guest intake fields, maximum input length, preview retention policy, auth handoff behavior, AI fallback copy, analytics events, and abuse/rate-limit expectations.
2. Add a guest-only homepage intake UI behind a small isolated component on the existing homepage. Keep public copy changes minimal and do not expand SEO pages.
3. Add a new preview-only AI draft endpoint or service path that accepts natural-language materials without requiring a report id, does not read private reports or knowledge context, rate-limits anonymous use, and returns a bounded `draftFields + missingInformation + assumptions + qualityWarnings` shape.
4. Add guest preview rendering that clearly labels AI output as a senior quality expert draft, not approval, and only shows preview/readiness/next-step guidance.
5. Add a preview readiness check for the draft. Prefer reusing `report_review` prompt logic in a new preview-safe path, but do not query historical knowledge context for anonymous users.
6. Add next-step guidance: missing evidence -> collect details; draft acceptable -> sign up or log in to edit/save; export requires login and existing export permissions.
7. Add authenticated handoff: after login/signup, create a real report with the preview draft, preserve only bounded draft fields, then route to `/reports/[id]`.
8. Reuse existing editor save/export/share paths after handoff. Do not alter export templates, payment, share-token semantics, database schema, or production config unless a later task explicitly scopes it.
9. Add focused tests for anonymous preview safety, auth handoff, no private knowledge access, no invented evidence wording, and preservation of existing `/reports` and export behavior.
