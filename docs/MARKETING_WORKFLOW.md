# Marketing Workflow

This workflow turns SEO, GEO, and social work into a data-backed operating loop:

Information gathering -> data reliability check -> Marketing Data Pipeline -> analysis -> professional operating judgment -> focused Codex optimization PR.

Marketing Data Pipeline v1 established the export workflow. PR #7 uses its A-grade GSC / GA4 evidence to upgrade the public SaaS experience, not to keep adding isolated SEO copy. The redesign keeps PR #6 index hygiene, sitemap, robots, redirect, and canonical rules intact and does not change auth, payment, export core logic, database schema, or production configuration.

## Public SaaS Experience Rule

Public pages should now be judged as a SaaS buying and onboarding experience first:

- Explain the product as a lightweight 8D response and delivery workspace.
- Keep the core value proposition consistent: “Finish customer-ready 8D reports without rebuilding them in Excel.”
- Route Start free CTAs to `/signup`.
- Use `/sample-report`, `/resources`, `/pricing`, `/faq`, and `/docs` as supporting decision paths.
- Avoid unverified testimonials, customer logos, customer counts, revenue claims, or enterprise features that are not implemented.

SEO / GEO work should still be evidence-backed, but the page structure should help a real quality engineer understand the product quickly before any keyword expansion happens.

## Weekly Operating Loop

1. Export GSC data.
   - Run `npm run marketing:gsc` after Google Search Console access is configured.
   - Use this to identify real queries, page performance, and query-page combinations.
2. Export GA4 data.
   - Run `npm run marketing:ga4` after GA4 Data API access is configured.
   - Use this to inspect landing page quality, source / medium performance, engagement, and funnel events.
3. Add SERP / competitor samples.
   - Copy or edit `data/marketing/serp_competitor_sample.template.csv`.
   - Manually sample target keywords before requesting page changes.
4. Build the weekly report.
   - Run `npm run marketing:report`.
   - Review `data/marketing/weekly_report.md`.
5. Create the next Codex PR from the report.
   - Choose one or two recommendations with A-grade or B-grade evidence.
   - Keep future SEO / GEO content expansion in separate PRs after the public SaaS experience stays clear and measurable.

## Search Opportunity Rules

- Average position 1-10 with low CTR: inspect the title, meta description, SERP snippet, rich-result eligibility, and FAQ snippet.
- Average position 11-30: treat the page as a near-ranking opportunity; improve content depth, internal links, FAQ, schema, and usable template assets.
- Average position above 30: treat the page as low-ranking early visibility; improve search-intent fit, industry examples, internal links, schema, and sample-report CTA before title/meta-only work.
- GSC impressions plus low GA4 engagement: improve the first-screen value proposition and CTA.

These rules use A-grade first-party evidence. A theory about why ranking is low remains D-grade until live SERP or other evidence verifies it.

## Measurement Integrity

The 2026-06-22 A-grade GA4 export contained these product events:

- `signup_success`
- `report_created`
- `export_clicked`
- `export_succeeded`
- `checkout_started`

The funnel taxonomy is:

- `sign_up`
- `create_report`
- `export_pdf`
- `export_word`
- `export_excel`
- `checkout_started`
- `checkout_completed`

The client analytics helper now translates `signup_success` to `sign_up`, `report_created` to `create_report`, and generic export clicks to a format-specific GA4 name. The existing internal product-event names are preserved for product analytics and governance history.

Public marketing pages should keep `marketing_cta_clicked` for real next-step actions only, such as signup, pricing, sample downloads, docs/contact navigation, and copying the blank template after the clipboard write succeeds. Informational expansion events use separate names:

- `faq_opened` with `page`, `group`, and `question`.
- `content_step_opened` with `page` and `step`.

`checkout_completed` is currently written by the payment webhook to product analytics only. Sending it to GA4 requires a separate, privacy-safe server-side measurement design; do not change payment success behavior merely to create a browser event.

Until the normalized names appear in GA4 DebugView and a new export, zero-valued funnel steps indicate Measurement risk, not proof that users did not complete those actions.

## Knowledge Base Metrics

After Knowledge Base v1 ships, weekly marketing and product reviews must track whether users treat 8D Reports as a reusable quality workspace rather than a one-time export tool.

Core metrics:

- Completed reports count: total eligible completed or locked reports that can become knowledge assets.
- Knowledge searches: `knowledge_search_used`.
- Result open rate: `knowledge_result_opened` divided by knowledge searches.
- Root cause copied: `knowledge_root_cause_copied`.
- Corrective action copied: `knowledge_corrective_action_copied`.
- Lessons learned copied: `knowledge_lesson_copied`.
- Repeat knowledge users: distinct users with Knowledge Base activity in more than one weekly period.

Commercial interpretation:

- Completed reports count shows whether the product is accumulating reusable quality knowledge.
- Knowledge searches show whether users expect historical reports to help with new problems.
- Result open rate shows whether the search experience returns useful assets.
- Root cause, corrective action, and lessons learned copy events show whether users are reusing quality knowledge rather than only exporting finished documents.
- Repeat knowledge users show whether 8D Reports is becoming part of an ongoing quality operating rhythm.
- These metrics help judge whether Team / Pro value is real, especially for teams that benefit from shared historical learning.
- They also provide the usage base for future AI Quality Check, because AI should be grounded in permission-safe completed-report knowledge rather than generic or invented advice.

## First Manual SERP Sample

Collect live B-grade samples for these keywords before making competitor or GEO positioning claims:

- `8d report template`
- `8d report example`
- `8d software`
- `supplier 8d report`
- `corrective action report template`
- `5 why root cause template`
- `scar report template`
- `customer complaint 8d report`

Record only URLs and page details observed in the live SERP. Do not invent ranking URLs or infer a competitor pattern from the empty template.

## UTM Standard

Use these parameters for social, community, email, and manual campaign links:

- `utm_source`: platform or source, such as `linkedin`, `x`, `zhihu`, `xiaohongshu`, `wechat`, `newsletter`, `community`.
- `utm_medium`: channel type, such as `social`, `discussion`, `email`, `partner`.
- `utm_campaign`: campaign family, such as `8d_template`, `supplier_8d`, `team_workflow`, `template_setup`.
- `utm_content`: specific post or creative, such as `d4_root_cause_post`, `excel_template_pain`, `supplier_sample_comment`.

Example:

`https://www.8d-reports.com/8d-report-template?utm_source=linkedin&utm_medium=social&utm_campaign=8d_template&utm_content=d4_root_cause_post`

Rules:

- Keep values lowercase.
- Use underscores instead of spaces.
- Do not put personal data in UTM values.
- Use one campaign family consistently for a sequence of posts.

## Social Content Breakdown

Turn one SEO page into several platform-native posts after the page has evidence:

- Problem post: describe a quality-team pain point shown by search demand or SERP patterns.
- Template post: show how an 8D section or template helps structure the work.
- Example post: summarize a realistic D0-D8 scenario without making unsupported claims.
- Checklist post: list review questions a quality engineer can use before sending a customer-facing report.
- Conversion post: link to the relevant template, example, sample report, or signup path with UTM parameters.

Keep social posts grounded in implemented product behavior. Do not claim QMS, SSO, automatic AI approval, complaint intake, or unimplemented features.

## Platform Notes

LinkedIn:

- Best for quality managers, supplier quality, manufacturing operations, and B2B validation.
- Use practical posts about customer-ready corrective action records, export quality, team review, and supplier collaboration.
- Link with `utm_source=linkedin&utm_medium=social`.

X:

- Best for short build-in-public updates, founder notes, and concise product learnings.
- Use sharp before / after observations from the weekly report.
- Link with `utm_source=x&utm_medium=social`.

Zhihu:

- Best for detailed Chinese-language explanations around 8D method, supplier quality, root cause analysis, and corrective action records.
- Prefer answer-style posts with practical structure.
- Link with `utm_source=zhihu&utm_medium=social` or `utm_medium=discussion`.

Xiaohongshu:

- Best for visual, concise workflow posts and checklist-style content.
- Use screenshots only when they do not expose private data.
- Link with `utm_source=xiaohongshu&utm_medium=social`.

WeChat:

- Best for longer operational notes, founder updates, and manufacturing quality education.
- Use campaign families consistently across article links.
- Link with `utm_source=wechat&utm_medium=social`.

This PR does not add LinkedIn, X, Zhihu, Xiaohongshu, or WeChat auto-publishing APIs.

## Required Local Environment Variables

These variables are for local marketing exports. They are not required for production runtime in this PR.

- `GOOGLE_APPLICATION_CREDENTIALS`: local filesystem path to a Google service account JSON file.
- `GSC_SITE_URL`: exact Search Console property identifier, for example `sc-domain:8d-reports.com` for the configured domain property or a verified URL-prefix property.
- `GA4_PROPERTY_ID`: numeric GA4 property id. The script also accepts `properties/123456789` and strips the prefix.

Access requirements:

- Enable Google Search Console API and Google Analytics Data API in the Google Cloud project.
- Add the service account email as a verified user with read access in Google Search Console.
- Add the service account email as a Viewer or Analyst in GA4 property access management.

Friendly checks:

- `npm run marketing:gsc -- --dry-run` shows expected GSC outputs without calling Google.
- `npm run marketing:ga4 -- --dry-run` shows expected GA4 outputs without calling Google.
- Missing environment variables produce a clear setup message instead of a raw stack trace.

## Weekly Report

Run:

`npm run marketing:report`

Output:

- `data/marketing/weekly_report.md`

The report sections are:

1. Executive Summary
2. Data Sources and Reliability
3. Index Health
4. Search Demand
5. Landing Page Performance
6. Funnel Analysis
7. Measurement Integrity
8. Competitor / SERP Gap
9. GEO Readiness
10. Social / UTM Performance
11. Recommended Codex Tasks
12. What Not To Do This Week
13. Open Questions

The report is intentionally conservative. If CSV inputs are missing or empty, it says "No relevant data" and recommends data setup before content optimization.
