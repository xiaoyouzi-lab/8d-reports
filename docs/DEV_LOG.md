# Development Log

## Latest Task

Marketing Data Pipeline v1 for 8d-reports.com.

## Changed Files

- `data/marketing/serp_competitor_sample.template.csv`
- `docs/CURRENT_TASK.md`
- `docs/DEV_LOG.md`
- `docs/MARKETING_DATA_DICTIONARY.md`
- `docs/MARKETING_WORKFLOW.md`
- `package.json`
- `scripts/marketing/build-weekly-report.ts`
- `scripts/marketing/ga4-export.ts`
- `scripts/marketing/google-auth.ts`
- `scripts/marketing/gsc-export.ts`
- `scripts/marketing/marketing-utils.ts`

## Root Cause / Operating Need

- PR #6 handles Google Search Console index hygiene: crawlability, canonical URLs, sitemap quality, legacy SEO redirects, and expected robots-blocked private routes.
- SEO / GEO / social optimization should not proceed as a copywriting exercise without real demand, engagement, funnel, and SERP evidence.
- The first pipeline needs conservative data grading so A-grade first-party data, B-grade live manual evidence, C-grade estimates, and D-grade hypotheses are not mixed together as if they were equally reliable.

## Implementation Summary

- Added a lightweight Google service-account auth helper that uses the existing Node runtime instead of adding a Google SDK dependency.
- Added `scripts/marketing/gsc-export.ts` to export GSC query, page, and query-page performance for 28-day and 90-day windows.
- Added `scripts/marketing/ga4-export.ts` to export landing pages, traffic source / medium, events, and key funnel events for a 28-day window.
- Added `scripts/marketing/build-weekly-report.ts` to generate `data/marketing/weekly_report.md` from existing CSV inputs and stay conservative with "No relevant data" when inputs are missing.
- Added `data/marketing/serp_competitor_sample.template.csv` for manual SERP / competitor sampling.
- Added `docs/MARKETING_DATA_DICTIONARY.md` with reliability grades, source definitions, fields, and operating rules.
- Added `docs/MARKETING_WORKFLOW.md` with the weekly operating loop, UTM standards, platform notes, environment setup, and report-generation instructions.
- Added `marketing:gsc`, `marketing:ga4`, and `marketing:report` package scripts.
- This PR does not change SEO page body copy, homepage copy, auth, signup, login, forgot password, Resend, pricing, subscriptions, payment, checkout, database schema, exports, attachment ZIP, AI beta gating, sitemap, robots, or production configuration.

## Tests / Verification

- `git diff --check` passed.
- `npx tsc --noEmit` passed.
- `npm run lint` passed with the existing 11 warnings and 0 errors.
- `npm run build` passed.
- `npm run test:governance` passed.
- `npm run marketing:report` passed and generated `data/marketing/weekly_report.md`.
- `npm run marketing:gsc -- --dry-run` passed and listed planned GSC outputs.
- `npm run marketing:ga4 -- --dry-run` passed and listed planned GA4 outputs.
- Missing-credential checks for `npm run marketing:gsc` and `npm run marketing:ga4` returned clear setup messages for `GOOGLE_APPLICATION_CREDENTIALS`.

## Risks

- Live GSC and GA4 exports require Google service-account access configured outside this PR.
- GA4 key event names must match the deployed GA4 property configuration.
- The first weekly report will intentionally show "No relevant data" until real CSV exports and manual SERP samples are available.

## Unfinished / Needs Human Review

- Add the service account email to Google Search Console and GA4 property access management.
- Decide whether the canonical GSC property should be a domain property or `https://www.8d-reports.com/` URL-prefix property.
- Fill the first SERP / competitor sample for the top three keyword families.

## Suggested Next Task

Configure GSC / GA4 permissions, run the exports, add the first SERP sample, regenerate the weekly report, then open a separate evidence-backed SEO / GEO optimization PR.

## Previous Task

Google Search Console index hygiene fix for 404, robots blocked, redirect, and duplicate canonical reports.

## Changed Files

- `docs/CURRENT_TASK.md`
- `docs/DEV_LOG.md`
- `next.config.ts`
- `package.json`
- `scripts/check-seo-urls.ts`
- `src/app/layout.tsx`
- `src/app/sitemap.ts`
- `src/app/(marketing)/page.tsx`
- `src/app/(marketing)/pricing/page.tsx`
- `src/app/(marketing)/faq/page.tsx`
- `src/app/(marketing)/docs/page.tsx`
- `src/app/(marketing)/sample-report/page.tsx`
- `src/app/(marketing)/demo-reports/page.tsx`
- `src/app/(marketing)/demo-reports/[type]/page.tsx`
- `src/app/(marketing)/8d-report-example/page.tsx`
- `src/app/(marketing)/8d-report-template/page.tsx`
- `src/app/(marketing)/5-why-root-cause-template/page.tsx`
- `src/app/(marketing)/corrective-action-report-template/page.tsx`
- `src/app/(marketing)/supplier-8d-report/page.tsx`
- `src/app/contact/page.tsx`
- `src/app/privacy/page.tsx`
- `src/app/terms/page.tsx`
- `src/lib/seo-index-hygiene.ts`

## Root Cause / Classification

- `robots.txt` blocking `/api/`, `/dashboard`, and `/reports/` is expected because those are system/private app paths. They should remain blocked even if GSC reports them.
- Sitemap included account entry pages (`/login`, `/signup`) that are public but not SEO landing pages. These can create low-value indexing and duplicate/canonical noise.
- Several static marketing pages had no explicit canonical, so www/non-www, HTTPS, and query-parameter variants could contribute to duplicate-page notices.
- Marketing pages linked directly to `/api/sample-reports/...` download endpoints. These API URLs are intentionally robots-blocked, so they should not be treated as SEO entrance links.
- The listed historical `/8d-report-example/...` URLs are currently implemented programmatic SEO pages, not 404s. Additional legacy alias paths such as `/8d-example/:slug` and `/8d-report-examples/:slug` are now redirected to the canonical URL family.

## Implementation Summary

- Added `src/lib/seo-index-hygiene.ts` as a shared source for canonical site URL, indexable static paths, and legacy SEO redirects.
- Updated sitemap generation to use only indexable canonical public paths and SEO content pages; removed `/login` and `/signup` from sitemap.
- Added permanent redirects for legacy SEO aliases:
  `/8d-example`, `/8d-example/:slug`, `/8d-examples/:slug`, `/8d-report-examples/:slug`, `/8d-template`, `/8d-template/:slug`, `/8d-templates/:slug`, `/demo-report`, `/demo-report/:type`, `/8d-report-sample`, and `/sample-8d-report`.
- Added explicit canonical metadata for homepage, pricing, FAQ, docs, sample report, core SEO hub pages, contact, privacy, and terms.
- Added `metadataBase` for the root layout using the final `https://www.8d-reports.com` host.
- Replaced general marketing links to API sample downloads with `/sample-report`, and marked intentional download links with `rel="nofollow"`.
- Added `scripts/check-seo-urls.ts` and `npm run check:seo` to verify sitemap URLs, robots blocking, redirect mappings, GSC example paths, and nofollow download links.
- This PR is index hygiene only; no SEO content expansion was done.

## Tests / Verification

- `git diff --check` passed.
- `npx tsc --noEmit` passed.
- `npm run lint` passed with the existing 11 warnings and 0 errors.
- `npm run build` passed.
- `npm run test:governance` passed.
- `npm run check:seo` passed: 72 sitemap URLs and 11 redirects checked.

## Risks

- GSC may continue to show expected robots-blocked private/system URLs until Google recrawls and groups examples differently.
- Domain-level HTTP to HTTPS and non-www to www redirects are expected platform behavior and are not changed in this code PR.
- Live GSC validation should happen only after this PR is merged and deployed.

## Unfinished / Needs Human Review

- After deployment, inspect Google Search Console examples to confirm any remaining 404s are not public SEO pages.
- If GSC reports specific unknown old URLs later, add targeted redirects only when a relevant canonical target exists.

## Suggested Next Task

After deployment, request validation in Google Search Console for affected indexing categories that relate to public SEO pages.

## Previous Task

Fix PR #3 second Preview blockers: forgot-password showed false success with no Resend record, and Word export metadata/field tables collapsed into unreadable one-character columns.

## Changed Files

- `docs/DEV_LOG.md`
- `src/app/api/auth-email/password-reset/route.ts`
- `src/app/reset-password/page.tsx`
- `src/lib/word-export.ts`

## Root Cause

- The forgot-password UI called Better Auth's `/api/auth/email-otp/request-password-reset` endpoint directly. The installed Better Auth email OTP route intentionally returns `{ success: true }` when no matching user is found and deletes the generated verification record without calling `sendVerificationOTP`. That anti-enumeration behavior can make the UI advance even though no `sendAuthOtpEmail` / `sendEmail` / Resend path was reached.
- The Word template used tables for cover metadata, D0-D8 field rows, attachments, 5-Why, and Fishbone sections. Some Word/preview viewers collapsed those table columns to a one-character width, causing labels like `Report Number` to display vertically.

## Implementation Summary

- Added `/api/auth-email/password-reset`, a first-party password reset OTP wrapper matching the signup verification wrapper pattern.
- The wrapper rate-limits requests, validates email format, confirms a registered user exists, writes a Better Auth-compatible `forget-password-otp-EMAIL` verification row, and directly awaits `sendAuthOtpEmail({ type: "forget-password" })`.
- The reset-password UI now calls the wrapper and only advances to the OTP screen when the wrapper returns real success after email sending succeeds.
- Preview/local reset email debug now displays route, email domain, config booleans, `providerMessageId`, and Vercel env without exposing OTPs, full emails, or secrets.
- Added safe server logs for password-reset request received, action called, provider callback reached, `sendEmail` start/success/failure through the existing email utility, and provider message id.
- Signup verification behavior was not changed.
- Replaced Word export tables with stable label/value paragraphs for cover metadata, D0-D8 field rows, attachment list, 5-Why, and Fishbone sections. This avoids table auto-layout collapse in Word/preview viewers.
- Preserved PDF logo/title fix, Word PNG/JPG logo support, server-side export package route, attachment ZIP behavior, watermark branding, pricing, subscriptions, database schema, report access checks, and export entitlement checks.

## Tests / Verification

- `git diff --check` passed.
- `npx tsc --noEmit` passed.
- `npm run lint` passed with the existing 11 warnings and 0 errors.
- `npm run build` passed.
- `npm run test:governance` passed.
- Generated `/tmp/8d-report-word-layout-test.docx`.
- `unzip -t /tmp/8d-report-word-layout-test.docx` passed with no compressed data errors.
- Verified generated `word/document.xml` contains `Report Metadata` and `Report Number`, has `tableCount: 0`, and includes PNG logo media under `word/media/`.
- Generated `/tmp/8d-report-zip-regression-test.zip`.
- `unzip -t /tmp/8d-report-zip-regression-test.zip` passed and listed a real attachment file under `attachments/`.
- Preview password-reset Resend record verification cannot be completed locally; it requires the redeployed PR #3 Preview environment and a real registered test email.

## Risks

- The password reset wrapper intentionally returns a friendly failure instead of false success when the email cannot be sent. This is necessary for Preview validation but differs from Better Auth's anti-enumeration success response for unknown emails.
- Preview manual validation is still required to confirm Resend shows a password reset send record and the inbox receives the OTP.
- Word WebP logos remain unsupported for embedding; PNG/JPG logos are still supported.

## Unfinished / Needs Human Review

- Re-test PR #3 Preview forgot-password with a known registered account and confirm Resend shows a new message id.
- Open the generated Word export in Microsoft Word or a compatible viewer and confirm metadata, D0-D8 fields, 5-Why, Fishbone, and attachments are readable horizontally.
- Re-check PDF/Word/Excel ZIP packages with real uploaded attachments.

## Suggested Next Task

Redeploy PR #3 Preview and run manual verification for forgot-password email delivery plus Word export layout before considering merge.

## Previous Task

Fix PR #3 Preview export blockers: attachment ZIP files were packaged as `.download-error.txt`, PDF logo overlapped the title, Word logo was missing, and Excel needed safer branding.

## Changed Files

- `docs/DEV_LOG.md`
- `src/app/api/reports/[id]/export/package/route.ts`
- `src/components/report/ExportMenu.tsx`
- `src/lib/export-zip.ts`
- `src/lib/pdf-export.ts`
- `src/lib/word-export.ts`
- `src/lib/xlsx-export.ts`

## Root Cause

- Attachment ZIP packaging was browser-side and fetched each attachment through `/api/attachments/[id]/file` or a fallback stored URL. When attachment bytes could not be fetched in Preview, the ZIP helper silently wrote `*.download-error.txt` files, so the export looked successful even though the real evidence files were missing.
- PDF cover layout placed the logo and the main `8D...` title in the same left-side header area.
- Word export read the authenticated user's stored logo URL, but image embedding did not preserve the actual content type from R2 and could attempt to embed unsupported formats such as WebP as if they were PNG.
- Excel export uses a lightweight manual XLSX generator. Embedding images would require more OpenXML drawing/media relationship handling, so a branded Summary header is safer for this PR.

## Implementation Summary

- Added a server-side report package route at `/api/reports/[id]/export/package`.
- The package route checks the authenticated user's existing report access/export permission, accepts the already-generated PDF/DOCX/XLSX report file, reads non-signature attachments directly from R2 by `storagePath`, and returns a ZIP with the report at the root plus real files under `attachments/`.
- Packaging now fails with a clear friendly error if any attachment cannot be read; it no longer creates misleading `.download-error.txt` files.
- `ExportMenu` now calls the server-side package route when non-signature attachments exist and shows the route's friendly error message if packaging fails.
- PDF cover logo now renders in a reserved top-right area, while the title uses reduced width so the logo and title cannot overlap.
- Word image handling now carries R2/content-type information through to `ImageRun`; Word embeds PNG/JPEG logos and skips unsupported formats safely with a document note.
- Excel Summary now starts with a branded `8D Corrective Action Report` / `Generated by 8d-reports.com` header while preserving workbook validity.
- Watermark branding remains `Generated with 8d-reports.com`, `Generated by 8d-reports.com`, and `Free export generated with 8d-reports.com`.
- No pricing, subscription, database schema, auth/email, Resend, AI, entitlement, or report access rules were intentionally changed.

## Tests / Verification

- `git diff --check` passed.
- `npx tsc --noEmit` passed.
- `npm run lint` passed with the existing 11 warnings and 0 errors.
- `npm run build` passed.
- `npm run test:governance` passed.
- Generated `/tmp/8d-report-export-test.xlsx` with the branded Summary header.
- `unzip -t /tmp/8d-report-export-test.xlsx` passed with no compressed data errors.
- Generated `/tmp/8d-report-export-logo-test.docx` with a PNG logo.
- `unzip -t /tmp/8d-report-export-logo-test.docx` passed, and `word/media/*.png` was present.
- Generated `/tmp/8d-report-export-package-test.zip` containing the report file plus real attachment files under `attachments/`.
- `unzip -t /tmp/8d-report-export-package-test.zip` passed, and the ZIP listing contained no `.download-error.txt` files.

## Risks

- Preview manual validation is still required with real uploaded attachments because the failure depended on deployed browser/server/storage behavior.
- Word still cannot embed WebP logos without adding an image conversion dependency or more complex conversion pipeline; PNG/JPG logos are supported.
- Excel logo image embedding was intentionally not added to avoid risking workbook corruption in the manual XLSX generator.

## Unfinished / Needs Human Review

- Re-test PR #3 Preview export package downloads for PDF, Word, and Excel with at least one uploaded image and one normal file attachment.
- Open generated PDF, Word, and Excel files in target tools to confirm visual quality.

## Suggested Next Task

Run PR #3 Preview manual export verification again and do not merge until ZIP packages contain real attachment files.

## Previous Task

Expand PR #3 into an export package polish PR after Preview verification found export packaging and template quality issues.

## Changed Files

- `docs/DEV_LOG.md`
- `src/components/report/ExportMenu.tsx`
- `src/lib/pdf-export.ts`
- `src/lib/word-export.ts`
- `src/lib/xlsx-export.ts`

## Root Cause

- PDF and Word still had ZIP packaging logic, but each export path handled attachment filtering, report filenames, and download behavior separately. This made the packaging behavior fragile and left Excel without equivalent attachment packaging.
- Excel exported a valid workbook, but the minimal OpenXML styling made the sheets look cramped and plain.
- The Evidence sheet listed attachments but did not clearly tell users that actual files belong in the exported ZIP `attachments/` folder.
- PDF and Word templates still looked closer to generated field dumps than customer/supplier quality records.
- Free export watermark copy used generic sample-report wording instead of the product site brand.

## Implementation Summary

- Standardized export package behavior in `ExportMenu`: PDF, Word, and Excel now use the same attachment filtering and ZIP packaging helper.
- Non-signature attachments include uploaded photos and normal files. Signatures are excluded by `fileType === "signature"` or `stepId` beginning with `signature_`.
- If non-signature attachments exist, exports download a ZIP with the report at the root and files under `attachments/`. If no attachments exist, exports download the single report file.
- Added Excel ZIP packaging for attachment files while keeping attachment metadata in the Evidence sheet.
- Improved Excel readability with bold blue header rows, wrapped body cells, wider columns, frozen top rows, taller long-text rows, and a ZIP attachment note on the Evidence sheet.
- Improved PDF output with a cleaner cover page, branded metadata block, stronger D0-D8 section hierarchy, cleaner attachment list styling, and branded footer text.
- Improved Word output with a cleaner cover, report metadata table, structured field tables, and attachment table while preserving the improved 5-Why and Fishbone tables.
- Replaced free-export sample watermarks with `Generated with 8d-reports.com` and footer text `Generated by 8d-reports.com`.
- Preserved PR #4 logo behavior: PDF still uses `/api/profile/logo/file`, and Word still loads the authenticated user’s stored/R2 logo bytes before URL fallback.
- No pricing, subscription, database schema, auth/email, Resend, entitlement, or report access logic was intentionally changed.

## Tests / Verification

- `git diff --check` passed.
- `npx tsc --noEmit` passed.
- `npm run lint` passed with 11 existing warnings and 0 errors.
- `npm run build` passed.
- `npm run test:governance` passed.
- Generated `/tmp/8d-report-export-test.xlsx` with `generateExcelWorkbook`.
- `unzip -t /tmp/8d-report-export-test.xlsx` passed with no compressed data errors.
- Generated `/tmp/8d-report-export-package-test.zip` containing an `.xlsx` report plus two attachment files under `attachments/`.
- `unzip -t /tmp/8d-report-export-package-test.zip` passed with no compressed data errors.

## Risks

- Browser/manual validation is still needed to confirm attachment ZIP behavior with real uploaded files in Preview.
- PDF rendering is browser-based, so exact layout should be manually reviewed with representative long reports and images.
- Word image rendering still depends on the `docx` library-supported image formats; WebP remains a known risk.

## Unfinished / Needs Human Review

- Verify Preview exports for reports with no attachments and with mixed photo/file attachments.
- Open the generated `.xlsx`, `.docx`, and `.pdf` in target user tools to confirm visual quality.

## Suggested Next Task

Run Preview manual export verification for PDF, Word, and Excel with at least one image attachment and one normal file attachment.

## Previous Task

Update PR #3 (`codex/standard-xlsx-export`) with latest `main` after PR #4 and PR #5 merged.

## Changed Files During This Update

- `docs/CURRENT_TASK.md`
- `docs/DEV_LOG.md`
- `src/components/report/ExportMenu.tsx`

## Implementation Summary

- Merged latest `origin/main` into the PR #3 branch so the branch includes the production auth email fixes from PR #5 and export/AI fixes from PR #4.
- Resolved documentation conflicts by preserving latest main's current task documentation and adding this PR #3 merge-readiness note.
- Verified `ExportMenu` keeps PDF, Word, and Excel export options together.
- Preserved PR #4 PDF logo behavior by keeping `logoUrl: logoUrl ? "/api/profile/logo/file" : null` for browser PDF export.
- Preserved PR #3 Excel gating behavior by keeping the Excel single-report checkout gate for Free/watermarked users and the `/api/reports/[id]/export/xlsx` call for eligible users.
- No pricing, subscription, database schema, auth/email behavior, logo export behavior, or Excel export behavior was intentionally changed during conflict resolution.

## Tests / Verification

- `git diff --check` passed.
- `npx tsc --noEmit` passed.
- `npm run lint` passed with 11 existing warnings and 0 errors.
- `npm run build` passed.
- `npm run test:governance` passed.
- Generated `/tmp/8d-report-export-test.xlsx` with `generateExcelWorkbook`.
- `unzip -t /tmp/8d-report-export-test.xlsx` passed with no compressed data errors.

## Risks

- This update still requires the full requested local checks and GitHub mergeability recalculation after push.

## Unfinished / Needs Human Review

- Review PR #3 after push to confirm GitHub marks it mergeable.
- Manually verify the Excel export menu item and a downloaded workbook in Preview if needed.

## Suggested Next Task

Review the refreshed PR #3 preview/checks, then merge if GitHub reports it clean and checks pass.

## Previous Task

Update PR #4 (`codex/p0-export-ai-fixes`) with latest `main` after PR #5 merged.

## Changed Files During This Update

- `docs/CURRENT_TASK.md`
- `docs/DEV_LOG.md`

## Implementation Summary

- Merged latest `origin/main` into the PR #4 branch so the branch includes the production auth email fixes from PR #5.
- Resolved documentation conflicts by preserving latest main's auth/email task documentation and adding this merge-readiness note.
- No pricing, subscription, database schema, Excel export, report export behavior, or AI behavior was intentionally changed during conflict resolution.

## Tests / Verification

- `git diff --check` passed.
- `npx tsc --noEmit` passed.
- `npm run lint` passed with 11 existing warnings and 0 errors.
- `npm run build` passed.
- `npm run test:governance` passed.

## Risks

- This update still requires the full requested local checks and GitHub mergeability recalculation after push.

## Unfinished / Needs Human Review

- Review PR #4 after push to confirm GitHub marks it mergeable.
- Manually verify the PR #4 export and AI UI flows after Preview deployment if needed.

## Suggested Next Task

Review the refreshed PR #4 preview/checks, then merge if GitHub reports it clean and checks pass.

## Previous Task

Implement production-ready email delivery for signup verification and password reset.

## Changed Files

- `docs/CURRENT_TASK.md`
- `docs/DEV_LOG.md`
- `docs/PRODUCTION_AUTH_EMAIL_SETUP.md`
- `src/app/debug/email/page.tsx`
- `src/app/debug/email/email-debug-form.tsx`
- `src/app/api/debug/email-self-test/route.ts`
- `src/app/api/auth-email/signup-verification/route.ts`
- `src/app/(auth)/signup/signup-form.tsx`
- `src/app/(auth)/signup/page.tsx`
- `src/app/api/auth/[...all]/route.ts`
- `src/app/reset-password/page.tsx`
- `src/lib/email-debug.ts`
- `src/lib/auth.ts`
- `src/lib/email.ts`

## Auth / Email Audit

- Signup flow: `/signup` calls `authClient.signUp.email`, Better Auth email OTP sends a signup verification code, and the signup page verifies it with `authClient.emailOtp.verifyEmail`.
- Email verification behavior: Better Auth `emailOTP` plugin has 5-minute OTP expiry. The implicit `sendVerificationOnSignUp` hook is disabled, and signup now explicitly requests the `email-verification` OTP after account creation succeeds.
- Forgot password flow before this task: `/reset-password` called `/api/auth/forget-password`, which expects a reset-link sender that was not configured.
- Forgot password flow after this task: `/reset-password` requests `/api/auth/email-otp/request-password-reset`, then completes reset through `/api/auth/email-otp/reset-password`.
- Better Auth plugin used: `emailOTP` from `better-auth/plugins` plus `emailOTPClient` on the client.
- Previous OTP delivery point: `src/lib/auth.ts` printed OTP codes with `console.log`.
- Current OTP delivery point: `src/lib/auth.ts` calls `sendAuthOtpEmail` in `src/lib/email.ts`.
- UI screens depending on email delivery: `/signup` email verification and `/reset-password` password reset.
- Local behavior: missing email env vars fall back to local-only OTP logging for developer use.
- Preview/Production behavior: OTP delivery requires Resend env vars and does not print OTP codes to logs.

## Root Cause

Better Auth email OTP was configured, but its `sendVerificationOTP` callback only printed OTP codes to server logs. The shared email utility was also a placeholder that returned success without sending email. As a result, signup verification and password reset messages were never delivered to users in Preview or Production.

Preview follow-up root cause: signup could reach the OTP screen without a corresponding Resend email record. Better Auth provides a `sendVerificationOnSignUp` hook, but the Preview result did not confirm that `authClient.signUp.email()` reliably completed `sendVerificationOTP` and the Resend send path before the UI advanced. The first explicit client attempt used `authClient.emailOtp.sendVerificationOtp`, which type-checked against the installed package, but Preview still showed no Resend record, so it was not a reliable proof of the real send path.

Preview diagnostic follow-up: commit `96b9b69` still reached the signup OTP screen with no Resend record. That should not happen if `POST /api/auth-email/signup-verification` is running and `sendEmail` is returning real Resend success. Because the product owner cannot inspect browser network requests or Vercel logs directly, a temporary Preview/local-only diagnostic page was added at `/debug/email`.

Installed Better Auth discovery:

- Explicit send verification OTP route: `POST /email-otp/send-verification-otp`.
- Explicit send verification OTP client method: `authClient.emailOtp.sendVerificationOtp({ email, type })`.
- Password reset request route/client method: `POST /email-otp/request-password-reset` / `authClient.emailOtp.requestPasswordReset({ email })`.
- Password reset completion route/client method: `POST /email-otp/reset-password` / `authClient.emailOtp.resetPassword({ email, otp, password })`.
- Verify email route/client method: `POST /email-otp/verify-email` / `authClient.emailOtp.verifyEmail({ email, otp })`.
- Callback option name: `sendVerificationOTP`.
- Valid explicit send types include `email-verification`, `sign-in`, `forget-password`, and `change-email`; the explicit send route rejects `change-email` and points callers to the email-change route.
- Better Auth stores email verification OTPs with identifier `email-verification-otp-${email}` and verification value `${otp}:0` by default.

## Email Provider Implementation

- Resend is used because the dependency already exists in `package.json`.
- `src/lib/email.ts` now lazy-loads the Resend client and sends plain text plus simple HTML transactional emails.
- Auth OTP email content covers signup verification, password reset, sign-in OTP, and email-change OTP.
- Missing Resend config throws a server-side error in Preview/Production without logging OTP codes.
- Local development keeps a usable fallback by logging OTP codes only outside production/Vercel.
- The auth route wrapper also rate-limits password reset OTP endpoints and validates reset-password strength before Better Auth processes the reset.
- Preview auth origin follow-up: Better Auth no longer relies on wildcard preview origin strings. The auth config now derives trusted origins and allowed hosts from `VERCEL_URL`, `VERCEL_BRANCH_URL`, `VERCEL_PROJECT_PRODUCTION_URL`, `BETTER_AUTH_URL`, and optional comma-separated `BETTER_AUTH_TRUSTED_ORIGINS`.
- Signup email follow-up: `sendVerificationOnSignUp` is disabled so signup does not rely on the implicit post-signup hook. After successful signup, the client calls a server-side wrapper at `POST /api/auth-email/signup-verification`; the wrapper writes the Better Auth-compatible OTP verification row and directly awaits `sendAuthOtpEmail`. The OTP screen is shown only if that wrapper returns success. The OTP screen also has a resend-code action that uses the same wrapper.
- Safe diagnostics were added to the Better Auth OTP callback and email utility. Logs include OTP `type`, recipient email domain, `hasResendApiKey`, `hasEmailFrom`, `vercelEnv`, and success/failure only; they do not include OTP codes, full emails, API keys, or message bodies in Preview/Production.
- Route-level diagnostics were added around `/api/auth/email-otp/...` requests and log only method, pathname, and status.
- Temporary Preview/local email diagnostics were added at `/debug/email`. The page shows route version `auth-email-debug-v1`, current commit SHA when Vercel provides it, `VERCEL_ENV`, current host/origin, and boolean-only email config status.
- `/api/debug/email-self-test` sends a direct Resend self-test through `sendEmail` and returns success only after the real provider path succeeds. It is disabled in Production and rate-limited.
- Signup now displays Preview/local-only wrapper debug under the OTP screen. If this block appears, the browser called the wrapper. If self-test succeeds but this block does not appear during signup, the tested frontend is likely stale or not using the wrapper route.
- Email self-test and signup wrapper debug now include Resend `providerMessageId` when the provider accepts a message. If the API returns `success=true` with a provider id but the visible Resend UI has no record, the likely issue is checking the wrong Resend workspace/account or filter. If `success=false` or the provider id is missing, the server did not get a confirmed Resend acceptance for that request.
- Preview/local self-test also supports `GET /api/debug/email-self-test?to=TEST_EMAIL`. This lets the assistant trigger a safe direct Resend test from the Preview URL and inspect JSON without requiring browser DevTools or product-owner network inspection.
- The temporary diagnostic page should be removed after Preview signup and password reset delivery are verified consistently in Resend records.

## Required Env Vars

- `RESEND_API_KEY` sensitive, required in Vercel Preview and Production.
- `EMAIL_FROM` required in Vercel Preview and Production, must use a Resend-verified sender/domain.
- `EMAIL_REPLY_TO` optional.
- `BETTER_AUTH_SECRET` sensitive, existing required auth secret.
- `BETTER_AUTH_URL` required per environment; use `https://www.8d-reports.com` in Production.
- `BETTER_AUTH_TRUSTED_ORIGINS` optional comma-separated fallback for manually trusted Preview origins.

See `docs/PRODUCTION_AUTH_EMAIL_SETUP.md` for the deployment checklist.

## Tests / Verification

- `git diff --check` passed.
- `npx tsc --noEmit` passed.
- `npm run lint` passed with 11 existing warnings and 0 errors.
- `npm run build` passed.
- `npm run test:governance` passed.
- Preview origin follow-up reran `git diff --check`, `npx tsc --noEmit`, `npm run lint`, `npm run build`, and `npm run test:governance`; all passed, with the same 11 existing lint warnings.
- Explicit signup OTP follow-up reran `git diff --check`, `npx tsc --noEmit`, `npm run lint`, `npm run build`, and `npm run test:governance`; all passed, with the same 11 existing lint warnings.
- Email diagnostic follow-up reran `git diff --check`, `npx tsc --noEmit`, `npm run lint`, `npm run build`, and `npm run test:governance`; all passed, with the same 11 existing lint warnings.
- Provider id diagnostic follow-up reran `git diff --check`, `npx tsc --noEmit`, `npm run lint`, `npm run build`, and `npm run test:governance`; all passed, with the same 11 existing lint warnings.

## Manual Verification Checklist

- Production signup: create a disposable account, receive the verification email, and complete verification.
- Production password reset: request a reset code, receive the email, enter the code, and set a strong new password.
- Preview signup or reset: repeat on the PR preview URL after Vercel env vars are configured.
- Preview email debug: open `/debug/email`, confirm the latest commit SHA, confirm `hasResendApiKey=true` and `hasEmailFrom=true`, send a self-test email, then confirm Resend shows a record for that time window.
- Preview remote self-test: call `/api/debug/email-self-test?to=TEST_EMAIL` on the Preview URL and inspect `success`, `providerMessageId`, `hasResendApiKey`, `hasEmailFrom`, and `vercelEnv`.
- Preview signup debug: after signup reaches the OTP screen, confirm the OTP page shows the `signup-verification-wrapper` debug block. If it does, Resend should show a verification email record for that same time window.
- Resend records: after signup reaches the OTP screen, open Resend email logs and confirm a verification email record exists for the attempted recipient domain/time window.
- Vercel logs: confirm `signup verification wrapper success` and `[EMAIL] send success` appear before the OTP screen is shown.
- Security: confirm Production logs record email success/failure only and never print OTP codes.
- Config failure: temporarily test a safe non-production environment with missing email config and confirm no OTP code is exposed.

## Risks

- Resend domain verification and DNS records must be completed before production sending works reliably.
- Some messages may land in spam until domain reputation is established.
- Preview auth depends on Vercel system URL variables being present. If a Preview origin is still rejected, add the exact origin to `BETTER_AUTH_TRUSTED_ORIGINS`.
- Existing users with unverified email may need manual verification guidance if they were created while email delivery was unavailable.

## Unfinished / Needs Human Review

- Add the required Vercel Preview and Production env vars.
- Manually verify signup and password reset after Vercel deploys the PR.
- Confirm Resend sender domain verification status.

## Suggested Next Task

Configure Vercel Preview email env vars and run manual signup/password-reset validation on the PR preview.

## Previous Task

Update workflow documentation with export status and product implementation audit.

## Changed Files

- `AGENTS.md`
- `docs/PRODUCT_CONTEXT.md`
- `docs/CURRENT_TASK.md`
- `docs/DEV_LOG.md`
- `docs/DECISIONS.md`
- `docs/ACCEPTANCE_CHECKLIST.md`
- `docs/PRODUCT_AUDIT.md`

## Implementation Summary

- Clarified the product context export status for standard PDF / Word / Excel outputs and future customer-specific template customization.
- Audited the current local implementation against `docs/PRODUCT_CONTEXT.md`.
- Added `docs/PRODUCT_AUDIT.md` covering implemented, partial, missing, risky, route, API, database, export, AI, Team/subscription, SEO, and recommended next-task findings.

## Tests / Verification

- Documentation-only change.
- Application tests were not required.
- `git diff --check` passed with no whitespace or formatting errors after the export status and product audit documentation update.

## Risks

- The audit is based on local code inspection only and does not claim production validation.
- Product context now states standard Excel export support, while the local implementation audit did not find a dedicated `.xlsx` export route or workbook generator.

## Unfinished / Needs Human Review

- Reconcile the Excel export product claim with the actual export implementation before using stronger public copy.
- GitHub default branch is `main`, but no open GitHub PR was found for `codex/ai-dev-workflow-docs` at the time of inspection.

## Suggested Next Task

Create or update the workflow documentation PR against `main`, then reconcile Excel export implementation or copy before stronger public claims.
