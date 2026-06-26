# Current Task

## Task Name

Public SaaS Experience Redesign for PR #7.

## Context

PR #6 is the Google Search Console index hygiene fix. It keeps public SEO pages crawlable, adds canonical URLs, cleans sitemap entries, preserves private robots blocking, and adds legacy SEO redirects.

PR #7 started as Marketing Data Pipeline v1 plus data-driven entry-page SEO work. It is now upgraded into a broader public SaaS website redesign while preserving:

- Marketing Data Pipeline scripts and weekly report ranking logic.
- GA4 analytics taxonomy and event-name normalization.
- Data safety rules that exclude live GSC / GA4 CSV exports, real generated weekly reports, Google JSON keys, and `.secrets`.
- PR #6 index hygiene, redirect, canonical, sitemap, and robots behavior.

## Product Positioning

8D Reports is a lightweight 8D response and delivery workspace for quality engineers, SQEs, and small manufacturing quality teams.

Unified value proposition:

“Finish customer-ready 8D reports without rebuilding them in Excel.”

Core workflow:

Customer complaint / supplier issue -> collect evidence -> complete D0-D8 -> review and approve -> export PDF / Word / Excel + attachments -> reuse previous reports.

## Goal

Redesign the public SaaS experience across information architecture, navigation, homepage, sample report, resources, FAQ, docs, pricing, and the 8D template page so the site feels like a clear, professional B2B SaaS product rather than a collection of isolated SEO pages.

## Pre-Merge Hardening Addendum

Before merging PR #7, complete a content accuracy, analytics integrity, and metadata hardening pass without expanding the public site scope again.

Hardening requirements:

- Remove public copy that exposes implementation, indexing, or SEO process language to users.
- Keep CTA analytics reserved for true next-step actions and use separate events for FAQ or content-step expansion.
- Ensure page-level metadata does not duplicate the site brand when the root title template is applied.
- Add supported Open Graph and Twitter social images without fake customer data, logos, metrics, or testimonials.
- Keep export and attachment copy aligned with the actual selected-format ZIP behavior.
- Audit subscription cancellation, report deletion, account deletion, and Team workspace deletion claims against code evidence before stating public copy.
- Keep docs routes in place, but treat thin docs pages as future enrichment candidates rather than assuming indexing quality from URL checks alone.

## Scope

- Desktop navigation limited to Product, Examples, Resources, and Pricing.
- Footer navigation grouped into Product, Resources, Help, and Legal.
- Homepage capped to a concise product-led structure.
- Sample report page focused on proving what a completed 8D report looks like.
- Resources page with featured resources, search, category filters, initial 12-card display, and no visible raw slugs.
- FAQ page rebuilt as categorized accordions with FAQPage JSON-LD.
- Docs split into `/docs` plus individual topic routes.
- Pricing page simplified around Free / Pro / Team, single export, compact comparison, professional services, and billing FAQ.
- `/8d-report-template` rebuilt as action-first progressive disclosure with copyable blank template, accordion, format guidance, FAQ, canonical, and schema.
- Shared marketing components for header, footer, hero, section headings, CTA, FAQ accordion, breadcrumbs, resources, docs sidebar, and plan cards.
- Public-page SEO metadata, canonical URLs, Open Graph, BreadcrumbList, FAQPage when visible, and homepage SoftwareApplication JSON-LD.
- Marketing analytics events for CTA, sample download, resources, pricing, and docs.
- Documentation updates for the redesign spec and marketing workflow.

## Non-Goals

- Do not merge PR #7 yet.
- Do not create a duplicate PR.
- Do not commit live GSC / GA4 CSV exports, `data/marketing/weekly_report.md`, Google JSON keys, or `.secrets`.
- Do not change auth, signup, login, password reset, Resend, subscriptions, pricing amounts, checkout/payment logic, database schema, report editor, PDF / Word / Excel generators, ZIP packaging, report workflow, AI backend gating, Google credentials, Vercel environment variables, or production deployment settings.
- Do not claim QMS, ERP, MES, PLM, SSO, automatic AI approval, or unimplemented enterprise features.

## Acceptance Criteria

- Header has at most 4 primary navigation items.
- All Start free CTAs route to `/signup`.
- Homepage has no more than 7 major sections.
- Sample report does not repeat D0-D8 in multiple formats.
- Resources initially shows no more than 12 cards and does not show raw slugs.
- FAQ uses categorized accordions.
- Docs topic routes exist and contain no outdated product instructions.
- Pricing accurately states single export unlocks no-watermark PDF, Word, and Excel for one selected report.
- Public pages have desktop and mobile layouts without horizontal overflow.
- Public routes return 200 in local verification.
- Sitemap excludes 404, redirect source, and robots-blocked pages.
- Required checks pass: `git diff --check`, `npx tsc --noEmit`, `npm run lint`, `npm run build`, `npm run test:governance`, `npm run check:seo`, and `npm run marketing:report`.

## Risks

- Public copy and IA are broader than the original PR #7 entry-page scope, so review should focus on product accuracy and conversion clarity.
- GA4 DebugView still needs production verification after deployment.
- Historical generic export events cannot always be split by PDF / Word / Excel without event-parameter exports.
- Competitor and GEO strategy still require B-grade live SERP samples.
