# Development Log

## Latest Task

Fix production export and AI user-facing issues found during manual testing.

## Changed Files

- `docs/CURRENT_TASK.md`
- `docs/DEV_LOG.md`
- `src/app/api/reports/[id]/export/docx/route.ts`
- `src/app/api/profile/logo/file/route.ts`
- `src/app/api/quality-agent/chat/route.ts`
- `src/components/quality-agent/ChatDialog.tsx`
- `src/components/quality-agent/QualityAgentFab.tsx`
- `src/components/report/AiReportTools.tsx`
- `src/components/report/ExportMenu.tsx`
- `src/lib/r2.ts`
- `src/lib/word-export.ts`

## Root Causes

- Logo missing in PDF: PDF generation runs in the browser and tried to fetch the stored R2 public logo URL directly. If the R2 URL is private or lacks browser CORS access, the image fetch fails silently and the PDF still exports without the logo.
- Logo missing in Word: Word export tried to fetch `logoUrl` as a public URL from the server. If the URL is not publicly fetchable, the document generator cannot read the image bytes.
- Word export logo trust boundary: the Word export API accepted `logoUrl` from the browser request body. After server-side R2 logo byte loading was added, this meant the server could be influenced by an arbitrary client-provided logo URL instead of only the authenticated user's stored logo.
- Word 5-Why formatting issue: the Word exporter rendered 5-Why data in a very plain two-column table with unclear labels and weak empty-value handling.
- AI result displayed as raw output: `AiReportTools` rendered AI Quality Check output in a raw `<pre>` JSON block and rendered draft fields mechanically, which looked like code/debug data to normal users.
- Unclear/broken AI entry point: the global Quality Expert chat button was visible even when `DEEPSEEK_API_KEY` was not configured, making a visible feature fail at first use. Its “Ask Anything Quality” label was also broader than the actual purpose.

## Fixes Implemented

- Added a protected same-origin logo file route at `GET /api/profile/logo/file`.
- Added R2 helpers to derive an R2 key from the stored public URL and read object bytes through the existing R2 client.
- PDF export now uses `/api/profile/logo/file` for the logo, avoiding browser-side R2 CORS/public-access failures.
- Word export now reads logo image bytes through the R2 helper first, then falls back to URL fetch.
- Word export now ignores client-provided `logoUrl`, queries the authenticated user's stored `users.logoUrl` server-side by `user.id`, and passes only that stored URL to the document generator. The request body still controls only `locale`.
- Word 5-Why output now uses clearer `Why` and `Answer / Evidence` labels and uses `No relevant data` for empty answers.
- AI Quality Check output now renders as readable cards/lists for readiness, score, critical issues, missing information, section concerns, improvements, customer rejection risks, and wording suggestions.
- AI Draft output now renders as a readable draft preview with an explicit “Apply to empty fields” action.
- Raw AI output is only available inside a development-mode details block.
- Added `GET /api/quality-agent/chat` availability check and hide the global Quality Expert Chat when the backend AI key is not configured.
- Renamed the global AI entry to `Quality Expert Chat (Beta)` / `质量专家顾问（Beta）` with a clearer prompt placeholder.

## AI Entry Point Audit

- Feature/button: `AI` in report editor.
- Page/location: `/reports/[id]`, editor top bar.
- API routes: `/api/ai/report-review`, `/api/ai/draft-report`.
- Required permission: authenticated beta user, report access, unlocked report, `canEdit`.
- Required environment variables: `AI_BETA_EMAILS`, `DEEPSEEK_API_KEY`.
- Expected purpose: quality readiness review and draft generation from user-provided materials.
- Current status: works when configured; UI now renders visual results instead of raw JSON.

- Feature/button: `Quality Expert Chat (Beta)`.
- Page/location: authenticated app layout, floating button.
- API route: `/api/quality-agent/chat`.
- Required permission: visible only inside authenticated app layout; backend route requires `DEEPSEEK_API_KEY`.
- Required environment variables: `DEEPSEEK_API_KEY`.
- Expected purpose: general quality-methodology guidance, not report approval.
- Current status: hidden when backend AI is not configured; label and placeholder clarified.

- Feature/API: AI template evaluation.
- Page/location: no visible UI entry found in current app routes/components.
- API route: `/api/ai/template-evaluation`.
- Required permission: authenticated beta user.
- Required environment variables: `AI_BETA_EMAILS`, `DEEPSEEK_API_KEY`.
- Expected purpose: evaluate uploaded customer template completeness for future setup workflow.
- Current status: API exists, no visible confusing button found.

- Feature/component: Social Account Agent.
- Page/location: component files exist, but no visible app import/use found.
- API route: `/api/social-account-agent`.
- Required permission: not audited as visible product surface.
- Required environment variables: not part of this P0 product fix.
- Expected purpose: unclear/non-core to 8D Reports production flow.
- Current status: not visible in current app navigation or layout.

## Excel Status

- PR #3 (`feat: add standard xlsx report export`) is still open and not merged at the time of this task.
- Excel absence in production should not be treated as a production regression until PR #3 is merged and deployed.

## Tests / Verification

- `git diff --check` passed.
- `npx tsc --noEmit` passed.
- `npm run lint` passed with 11 existing warnings and 0 errors.
- `npm run build` passed.
- `npm run test:governance` passed.
- Security hardening follow-up reran `git diff --check`, `npx tsc --noEmit`, `npm run lint`, `npm run build`, and `npm run test:governance`; all passed, with the same 11 existing lint warnings.

## Manual Verification Checklist

- Upload a PNG/JPG company logo as a Pro or Team user.
- Export PDF and confirm the logo appears on the cover page.
- Export Word and confirm the logo appears on the cover page.
- Fill Why 1 through Why 5, export Word, and confirm the 5-Why section is readable and clearly separated.
- Run AI Quality Check and confirm the result is visual, not raw JSON/code.
- Run AI Draft and confirm the draft preview is readable and applies only through the explicit action.
- Confirm the global Quality Expert Chat is hidden when AI is not configured and clearly labeled when configured.
- Confirm Free user Word export still shows the existing $4.99 gate.
- Confirm Pro/Team PDF and Word export still work.

## Risks

- Existing WebP logos may still be risky for Word export because the current `docx` image API supports PNG/JPG/GIF/BMP, not WebP conversion. PNG/JPG should be used for manual verification.
- The protected PDF logo route returns the current user logo, matching current editor behavior. Team-wide owner logo behavior remains a future product decision.
- AI response formats may still vary by provider; the UI now handles JSON objects and markdown/text fallback without exposing raw output to normal users.
- This task does not merge or deploy PR #3.

## Unfinished / Needs Human Review

- Manual production verification is still required for PDF/Word logo rendering and AI visual output.
- Confirm whether WebP logo upload should be blocked or converted in a future task.
- Confirm whether the global Quality Expert Chat should remain visible to all authenticated users when configured, or be beta-gated like report AI tools.

## Suggested Next Task

Manually verify the production export and AI flows after this PR is reviewed and deployed.
