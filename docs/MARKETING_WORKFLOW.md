# Marketing Workflow

This workflow turns SEO, GEO, and social work into a data-backed operating loop:

Information gathering -> data reliability check -> Marketing Data Pipeline -> analysis -> professional operating judgment -> focused Codex optimization PR.

This PR establishes the workflow and data pipeline only. It does not optimize SEO page body copy, homepage copy, auth, payment, exports, database schema, sitemap, robots, or production configuration.

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
   - Keep SEO / GEO content optimization in a separate PR after this data pipeline exists.

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
- `GSC_SITE_URL`: exact Search Console property URL, for example `https://www.8d-reports.com/`.
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
7. Competitor / SERP Gap
8. GEO Readiness
9. Social / UTM Performance
10. Recommended Codex Tasks
11. What Not To Do This Week
12. Open Questions

The report is intentionally conservative. If CSV inputs are missing or empty, it says "No relevant data" and recommends data setup before content optimization.
