# Public SaaS Redesign Spec

## Purpose

Upgrade PR #7 into a complete public SaaS experience redesign for 8D Reports.

The public site should explain the product as a lightweight 8D response and delivery workspace for quality engineers, SQEs, and small manufacturing quality teams.

## Positioning

Unified value proposition:

“Finish customer-ready 8D reports without rebuilding them in Excel.”

Core workflow:

Customer complaint / supplier issue -> collect evidence -> complete D0-D8 -> review and approve -> export PDF / Word / Excel + attachments -> reuse previous reports.

## Navigation

Desktop primary navigation:

- Product -> `/#workflow`
- Examples -> `/sample-report`
- Resources -> `/resources`
- Pricing -> `/pricing`

Right side:

- Log in -> `/login`
- Start free -> `/signup`

Footer groups:

- Product: How it works, Sample report, Pricing
- Resources: 8D template, 8D examples, 5 Why, Fishbone, Corrective action
- Help: Docs, FAQ, Security, Contact
- Legal: Privacy, Terms

## Page Requirements

### Home

Maximum 7 major sections:

1. Hero with product preview and four concise facts
2. From complaint to deliverable
3. One report, not five disconnected files
4. Built for real quality work
5. See a finished report
6. Plans summary
7. FAQ plus final CTA

Do not include unverified testimonials, customer logos, customer counts, or revenue numbers.

### Sample Report

Purpose: prove what a completed 8D report looks like.

Required structure:

1. Hero and report summary
2. One D0-D8 interactive viewer
3. Evidence and export package
4. Credibility checks
5. Related industry examples
6. CTA

Do not repeat D0-D8 as both a long list and a separate card grid.

### Resources

Required behavior:

- Featured resources limited to 6.
- Search and category filters.
- Initial display limited to 12 cards.
- Load more for remaining resources.
- No raw slug display.
- Existing SEO URLs remain live and crawlable.

### FAQ

Use categorized accordions:

- Getting Started
- Reports and Exports
- Sharing and Team
- Billing and Plans
- Security and AI

FAQPage JSON-LD must include only visible FAQ content.

### Docs

`/docs` is an index page.

Topic routes:

- `/docs/getting-started`
- `/docs/create-report`
- `/docs/edit-d0-d8`
- `/docs/attachments`
- `/docs/export-and-zip`
- `/docs/sharing`
- `/docs/team-workflow`
- `/docs/plans-and-billing`
- `/docs/security-and-data`
- `/docs/ai-quality-check`

Each topic needs:

- title
- 2-3 sentence summary
- numbered steps
- relevant callout
- previous / next
- “Still need help?” CTA to `/contact`

Docs must not include outdated instructions such as reading OTPs from server logs, treating AI as an approver, or describing shipped export features as coming soon.

### Pricing

H1:

“Start with 3 free reports. Pay when you need formal delivery or team control.”

Keep Free / Pro / Team concise, add a compact comparison table, and move Template Setup / Team Launch into Professional Services below the plan cards.

Single export must be described accurately:

`$4.99` unlocks one selected report for:

- no-watermark PDF
- Word
- Excel

### 8D Report Template

Action-first structure:

1. Hero + immediate actions
2. Copyable blank template box
3. D0-D8 accordion
4. Common mistakes
5. Word / Excel / PDF comparison
6. FAQ
7. Final CTA

Keep FAQ schema and canonical. Avoid keyword stuffing.

## Shared Components

Use or create shared components for:

- MarketingHeader
- MarketingFooter
- PageHero
- SectionHeader
- PrimaryCTA
- FaqAccordion
- Breadcrumbs
- ResourceCard
- DocsSidebar
- PlanCard

## SEO / GEO

For redesigned pages:

- unique title
- unique meta description
- canonical
- Open Graph
- correct H1
- BreadcrumbList on inner pages
- FAQPage only when matching visible FAQ exists
- SoftwareApplication JSON-LD on homepage

Keep important body copy server-rendered. Do not hide SEO text. Do not keyword-stuff.

## Analytics

Use the existing analytics helper.

Events:

- `marketing_cta_clicked`
- `sample_download`
- `resource_opened`
- `resource_filter_used`
- `pricing_plan_clicked`
- `docs_topic_opened`
- `faq_opened`
- `content_step_opened`

Do not change checkout, auth, export, or report workflow business logic to create analytics events.

## Safety Boundaries

Do not change:

- auth
- signup/login/password reset
- Resend
- subscriptions
- pricing amount
- checkout/payment
- database schema
- report editor
- PDF / Word / Excel generators
- ZIP packaging
- report workflow
- AI backend gating
- Google credentials
- Vercel environment variables

Do not commit:

- live GSC / GA4 CSV exports
- `data/marketing/weekly_report.md`
- Google JSON keys
- `.secrets`
