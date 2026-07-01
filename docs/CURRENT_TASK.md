# Current Task

## Task Name

Revenue GEO Content Batch 1.

## Context

Revenue Evidence Sprint v1 is deployed, and the operating/query/content planning
work defines the first high-intent content topics. The next step is a small,
reviewable runtime page batch that connects revenue-near searches to practical
8D guidance, demo assets, Template Setup, Assisted First 8D / SCAR, Signup, and
Knowledge reuse.

## Goal

Publish the first batch of high-intent `/resources/*` pages without creating a
thin SEO batch, changing product entitlements, or touching auth, payment, export,
database schema, AI backend, or Knowledge Base permissions/search logic.

## Scope

- Add 10 runtime pages under `/resources/[slug]` from a shared content source:
  - `/resources/how-to-write-8d-report-customer-complaint`
  - `/resources/supplier-corrective-action-request-template`
  - `/resources/8d-vs-scar`
  - `/resources/excel-8d-template-vs-8d-software`
  - `/resources/custom-8d-template-setup-guide`
  - `/resources/ai-8d-report-checker`
  - `/resources/8d-root-cause-d4-guide`
  - `/resources/8d-corrective-action-d5-guide`
  - `/resources/8d-validation-d6-guide`
  - `/resources/8d-lessons-learned-d8-guide`
- Give every page unique metadata, canonical URL, answer-first introduction,
  structured sections, practical checklist, common mistakes, comparison/example
  table, related internal links, CTAs, and visible FAQ with FAQPage JSON-LD.
- Add the pages to `/resources`, sitemap generation, SEO URL checks, and
  governance tests.
- Update `docs/DEV_LOG.md`.

## Non-Goals

- No broad public marketing redesign.
- No more than this first 10-page batch.
- No fake statistics, fake customer stories, fake logos, guaranteed customer
  acceptance, certification claims, or unsupported full-QMS claims.
- No payment, checkout, subscription, auth, password reset, Resend, real report
  export entitlement, ZIP behavior, AI backend, Knowledge Base search,
  Knowledge permissions, production configuration, or database schema changes.
- No production data writes or production test leads.

## Acceptance Criteria

- All 10 `/resources/*` pages render and are included in sitemap.
- `/resources` exposes the new pages and a Revenue Guides filter.
- Each page includes answer-first copy, practical checklist, common mistakes,
  table, relevant CTA, internal links, and visible FAQ.
- FAQPage JSON-LD only reflects visible FAQ content.
- CTAs use existing safe analytics events and bounded metadata.
- `npm run check:seo` passes.
- Required checks pass: `git diff --check`, `npx tsc --noEmit`, `npm run lint`,
  `npm run build`, `npm run test:governance`, and local public smoke for the new
  pages.

## Risks

- Adding too many pages at once can become thin content. This batch is capped at
  10 pages and uses a shared renderer for consistency.
- Public page CTAs must not imply guaranteed customer acceptance or certified
  approval.
- Analytics must stay limited to safe enum-like metadata and must not capture
  customer/product/report/root-cause/corrective-action details.
