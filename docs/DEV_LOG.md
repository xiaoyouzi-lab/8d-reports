# Development Log

## Latest Task

PR #7 content accuracy, analytics integrity, metadata, and functionality-claim hardening.

## Changed Files

Primary areas:

- Public marketing information architecture and shared components.
- Homepage, sample report, resources, FAQ, docs, pricing, and 8D template page.
- Docs topic routes.
- Public SaaS redesign spec and marketing workflow documentation.
- Open Graph and Twitter shared image metadata.
- Public copy evidence audit for export packaging, subscription cancellation, data deletion, and Team deletion claims.

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
