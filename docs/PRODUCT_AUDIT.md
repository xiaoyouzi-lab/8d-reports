# Product Audit

Audit date: 2026-06-13

This audit compares the current repository implementation against `docs/PRODUCT_CONTEXT.md`. It is based on local code inspection only; it does not claim production validation.

## Implemented Features

- Login, signup, reset password, and auth API routes are present.
- Authenticated dashboard lists accessible reports, supports basic filtering, shows quota/plan context, and exposes Team workspace controls for Team users.
- D0-D8 report editor is implemented with structured fields, report number/type/priority, completion checks, autosave on step navigation, manual save, and read-only states.
- Report creation, report retrieval, report update, sample report creation, and report search API routes are present.
- Attachments and signatures are implemented through upload, attachment listing, protected attachment file access, signature upload, and signature delete routes.
- AI Quality Check and AI Draft routes exist and use beta email gating, conservative prompt rules, friendly unavailable messages, and server-side report access/lock/edit checks.
- Review, approval, locking, unlocking with reason, revision increment, and Activity Log support are present for Team workflow.
- Share links/share codes are implemented with view/edit permission levels, share revocation/update, external shared report viewing, and external edit support for editable links.
- PDF and Word export flows are implemented for normal reports. Evidence packages are supported by ZIP download when attachments are present.
- Demo report pages and sample report APIs are present, including generated PDF, Word, and ZIP delivery packages with evidence files.
- SEO and marketing pages are present for homepage, pricing, docs, FAQ, contact, security, sample report, demo reports, Team Launch, custom template setup, templates, examples, supplier 8D, corrective action, preventive action, 5-Why, and fishbone content.
- Subscription/plan logic is implemented for Free, Pro, Team, single-report export purchase, report quota, Word/no-watermark export entitlement, logo entitlement, editable share, deep search, and Team seats.
- Team workspace/member APIs support creating a workspace for active Team owners, adding registered users, assigning Editor/Viewer roles, changing roles, removing members, and recording Team activity.
- Custom template/service request APIs and admin service request page are present.
- Analytics event logging is present for product usage, export, checkout, Team activity, and related events.

## Partially Implemented Features

- Excel export is described in product context as supported for standard report outputs, but local code inspection did not find a dedicated `.xlsx` export route or workbook generator. Current implemented export code is clearly PDF, Word, and ZIP/evidence-package focused.
- Historical search/deep search is present through report search and plan entitlements, but this audit did not verify ranking quality or full-text depth beyond code presence.
- Complaint management exists as product direction and related report/source fields, but there is no separate end-to-end complaint intake module.
- Supplier collaboration exists through share links and Team roles, but external supplier workflows appear share-link based rather than a dedicated supplier portal.
- Activity Log exists for report and Team events, but this audit did not verify every user-visible event path in browser.
- Customer-specific template setup exists as a request/admin workflow, not as a completed self-service template builder.

## Missing Features

- No dedicated customer-specific Excel template export implementation was found.
- No SSO implementation was found.
- No complex approval matrix beyond Owner-managed Team workflow was found.
- No customer complaint intake portal was found.
- No dedicated supplier account/portal workflow was found beyond Team membership and share links.
- No full QMS module was found.

## Risky Or Unclear Features

- The product context now says standard PDF / Word / Excel export is supported, but code inspection only confirmed PDF, Word, ZIP packages, and uploaded spreadsheet evidence support. This should be reconciled before strong public Excel export claims.
- Share-link editing is implemented for editable links and checks locked workflow status, but it is external-token based and should continue to be included in permission regression testing.
- AI routes log failed provider errors internally and return friendly user messages; this is appropriate, but AI availability depends on configured beta emails and provider keys.
- Team Owner creation depends on active Team entitlement and `/api/team` workspace creation behavior; production manual validation still requires known Team Owner/Editor/Viewer accounts.
- Marketing copy and SEO pages contain broad "Excel/spreadsheet replacement" positioning. This is strategy-aligned, but exact Excel export wording should stay conservative until workbook export is verified.

## Routes / Pages Found

- App pages: `/dashboard`, `/reports/new`, `/reports/[id]`, `/admin/service-requests`, `/login`, `/signup`, `/reset-password`, `/share/[token]`, `/contact`, `/privacy`, `/terms`.
- Marketing pages: `/`, `/pricing`, `/sample-report`, `/demo-reports`, `/demo-reports/[type]`, `/docs`, `/faq`, `/resources`, `/security`, `/team-launch`, `/custom-8d-template-setup`, `/8d-report-review-service`, `/supplier-8d-report`, `/8d-report-template`, `/8d-report-template/[slug]`, `/8d-report-example`, `/8d-report-example/[slug]`, `/corrective-action-report-template`, `/corrective-action-example/[slug]`, `/preventive-action-example/[slug]`, `/5-why-root-cause-template`, `/5-why-example/[slug]`, `/fishbone-diagram-example/[slug]`.
- SEO infrastructure: `src/app/sitemap.ts`, `src/app/robots.ts`, `src/lib/seo-pages.ts`, `src/content/seo-pages.ts`.

## API Routes Found

- Auth and account: `/api/auth/[...all]`, `/api/profile/logo`, `/api/notify/welcome`.
- Reports: `/api/reports`, `/api/reports/[id]`, `/api/reports/sample`, `/api/reports/search`, `/api/reports/[id]/activity`, `/api/reports/[id]/workflow`, `/api/reports/[id]/share`, `/api/reports/[id]/attachments`, `/api/reports/[id]/signatures`, `/api/reports/[id]/signatures/[role]`, `/api/reports/[id]/export/docx`.
- Sharing: `/api/share/[token]`, `/api/share/[token]/attachments/[id]`.
- AI: `/api/ai/report-review`, `/api/ai/draft-report`, `/api/ai/template-evaluation`.
- Demo/sample assets: `/api/sample-reports/[type]`.
- Business operations: `/api/team`, `/api/subscription`, `/api/checkout`, `/api/webhooks/creem`, `/api/custom-template-requests`, `/api/feedback`, `/api/events`, `/api/quota`, `/api/upload`.
- Agent/chat helpers: `/api/quality-agent`, `/api/quality-agent/chat`, `/api/social-account-agent`.

## Database-Related Files Found

- Schema: `src/lib/db/schema.ts`.
- Database client/seed: `src/lib/db/index.ts`, `src/lib/db/seed.ts`.
- Migrations: `drizzle/0001_analytics_events.sql`, `drizzle/0002_pricing_entitlements.sql`, `drizzle/0003_ai_template_trust.sql`, `drizzle/0004_team_governance.sql`, `drizzle/0005_service_request_flow.sql`.
- Database-backed tables include users, sessions, accounts, verifications, plans, subscriptions, Team workspaces, Team members, templates, reports, report purchases, attachments, report shares, quotas, report edit history, report activities, registration rate limits, blocked domains, feedback, analytics events, AI tasks, and custom template requests.

## Export Capabilities Found

- PDF report export is implemented client-side in `src/lib/pdf-export.ts` and invoked by `src/components/report/ExportMenu.tsx`.
- Word export is implemented through `src/lib/word-export.ts` and `/api/reports/[id]/export/docx`.
- ZIP evidence packages are implemented through `src/lib/export-zip.ts` and used when report attachments are present.
- Demo/sample report downloads support PDF, Word, and ZIP packages through `/api/sample-reports/[type]`.
- Upload accepts spreadsheet file types as evidence attachments, including Excel MIME types and CSV.
- No dedicated `.xlsx` report export generator or API route was found during this audit.

## AI Quality Check Behavior Found

- AI Quality Check uses `/api/ai/report-review`.
- AI Draft uses `/api/ai/draft-report`.
- AI access is limited to configured beta emails through `AI_BETA_EMAILS`.
- AI prompts explicitly require valid JSON and prohibit inventing evidence, dates, names, test results, approvals, certifications, and legal conclusions.
- AI Quality Check reviews D0-D8 readiness, evidence, root cause logic, corrective action linkage, verification, prevention, approval readiness, and customer rejection risks.
- AI Draft creates editable draft fields from user-provided materials and current report data.
- Both AI routes require authenticated users, existing report access, unlocked report status, and edit permission.
- AI failures return friendly unavailable messages instead of raw provider details.

## Team / Subscription / Workspace Behavior Found

- Plans are modeled as Free, Pro, and Team with entitlements in `src/lib/plans.ts`.
- Subscription status is active when status is `active`, `trialing`, or `paid`.
- Team plan can be inherited from an active Team workspace owner subscription.
- Team workspace creation happens through `/api/team` for active Team owners.
- Owner, Editor, and Viewer roles are normalized by workflow helpers.
- Viewers cannot create reports, edit reports, upload/delete attachments, manage workflow, create share links, export drafts, or trigger edit-like AI routes.
- Editors can edit unlocked accessible reports and share/export drafts, but cannot approve/lock/unlock or manage members.
- Owners can manage Team members and Team workflow when the plan is Team.
- Locked reports are treated as read-only when `lockedAt` exists or workflow status is `approved`, `submitted`, or `closed`.

## SEO Pages Found

- Core marketing: homepage, pricing, docs, FAQ, resources, contact, security, privacy, terms.
- Conversion/service pages: sample report, demo reports, Team Launch, custom 8D template setup, 8D report review service.
- SEO topic pages: 8D report template, 8D report examples, supplier 8D report, corrective action report template, corrective action examples, preventive action examples, 5-Why root cause template, 5-Why examples, fishbone examples.
- Programmatic SEO content is generated from `src/content/seo-pages.ts` and included in `sitemap.ts`.

## Recommended Next 5 Engineering Tasks

1. Decide and reconcile the Excel export claim: either implement a standard `.xlsx` export route or narrow product/docs/SEO copy to PDF, Word, ZIP, and spreadsheet evidence support.
2. Add a small export regression test for normal report exports covering PDF, Word, ZIP evidence packages, and the chosen Excel behavior.
3. Run authenticated production Team validation with Owner, Editor, and Viewer accounts once safe production test accounts are available.
4. Add a focused share-link permission regression test for locked reports, view-only links, editable links, and external attachment access.
5. Document the supported Team Owner setup path for production validation so future manual smoke tests do not depend on ad hoc database inspection.
