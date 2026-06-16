# Current Task

## Task Name

Google Search Console index hygiene fix.

## Background

Google Search Console reported new indexing issue categories for `8d-reports.com`:

- Not found (404)
- Page with redirect
- Blocked by `robots.txt`
- Duplicate page without user-selected canonical

This task pauses SEO content expansion. The goal is not to force every GSC notice to disappear, but to classify expected behavior versus real indexing risk and make sure public SEO pages are crawlable, canonical, and present in the sitemap only when they should be indexed.

## Goal

Create a small index-hygiene PR that verifies public marketing/SEO pages are not blocked by robots, do not 404, are not submitted as redirect URLs, and have clear canonical URLs.

## Non-Goals

- Do not write new SEO content.
- Do not change auth, signup, login, forgot password, or Resend email behavior.
- Do not change PDF, Word, Excel, attachment ZIP, subscription, pricing, payment, database schema, AI beta gating, or checkout behavior.
- Do not open private app routes to search engines.

## Scope

- `src/app/robots.ts`
- `src/app/sitemap.ts`
- `next.config.ts` redirects for legacy SEO URL aliases
- SEO metadata/canonical declarations for public marketing pages
- Internal marketing links that point at blocked API download URLs
- Lightweight SEO URL validation script
- `docs/DEV_LOG.md`

## Requirements

- Keep private/system paths such as `/api/`, `/dashboard`, and `/reports/` blocked by robots.
- Keep public SEO pages such as `/`, `/resources`, `/pricing`, `/sample-report`, `/demo-reports`, `/8d-report-template`, `/8d-report-example`, `/supplier-8d-report`, `/corrective-action-report-template`, and `/5-why-root-cause-template` crawlable.
- Ensure sitemap URLs correspond to real public pages and are not redirect sources or robots-blocked paths.
- Add 301 redirects for relevant old/alias SEO paths where the new canonical target exists.
- Use canonical URLs on public SEO/marketing pages.
- Add `npm run check:seo` to check sitemap URLs, robots blocking, legacy redirect mappings, and obvious internal API download links.

## Acceptance Criteria

- `robots.txt` only blocks pages that should not be indexed.
- Sitemap contains final canonical URLs only.
- Old SEO alias URLs redirect to relevant canonical pages without loops.
- The listed `/8d-report-example/...` paths are present and valid.
- Marketing pages do not use robots-blocked API download URLs as SEO entrance links.
- `npm run check:seo` passes.
- Full project checks pass.

## Risk Areas

- Some GSC “blocked by robots.txt” notices are expected for private/system routes.
- Some “page with redirect” notices are expected for HTTP to HTTPS, non-www to www, trailing slash normalization, or legacy URL redirects.
- GSC validation still requires Google recrawl after deployment.

## Completion Report Required

Report normal versus real GSC issues, redirects added, sitemap/internal-link changes, canonical handling, checks run, remaining risks, and whether the user should request validation in Google Search Console after deployment.
