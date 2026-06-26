# Marketing Data Dictionary

This dictionary defines the first Marketing Data Pipeline for 8d-reports.com. Its purpose is to keep SEO, GEO, social, and Codex optimization work evidence-led instead of opinion-led.

## Reliability Grades

Every marketing recommendation must cite a data grade.

| Grade | Meaning | Sources | How to use |
| --- | --- | --- | --- |
| A | First-party actual data | Google Search Console, Google Analytics 4, product database events, payment data, email data | Can support direct operational decisions when sample size is meaningful. |
| B | Live manually verified data | Google SERP samples, competitor page teardown, sitemap / robots / canonical checks, PageSpeed, Rich Results Test | Can support tactical page and positioning decisions when the sample is documented. |
| C | Third-party estimate | Ahrefs, Semrush, Similarweb, DataForSEO, SerpApi | Useful for prioritization and discovery, but must not override A-grade evidence. |
| D | Experience or hypothesis | Industry experience, competitor positioning guesses, content direction assumptions | Use only as a hypothesis. Do not present as a conclusion. |

If evidence is missing, use "No relevant data" rather than filling the gap with assumptions.

## Google Search Console

Reliability: A.

Script: `npm run marketing:gsc`

Outputs:

- `data/marketing/gsc_queries_28d.csv`
- `data/marketing/gsc_pages_28d.csv`
- `data/marketing/gsc_query_page_28d.csv`
- `data/marketing/gsc_queries_90d.csv`
- `data/marketing/gsc_pages_90d.csv`

Fields:

| Field | Meaning |
| --- | --- |
| `query` | Search query reported by GSC. |
| `page` | Landing page URL reported by GSC. |
| `clicks` | Organic Google Search clicks. |
| `impressions` | Organic Google Search impressions. |
| `ctr` | Click-through rate as a decimal. |
| `average_position` | Average Google Search result position. |

Primary uses:

- Find real demand: queries with impressions.
- Find weak SERP packaging: impressions without clicks.
- Find page-query mismatch: query-page combinations with visibility but poor CTR.

## Google Analytics 4

Reliability: A.

Script: `npm run marketing:ga4`

Outputs:

- `data/marketing/ga4_landing_pages_28d.csv`
- `data/marketing/ga4_sources_28d.csv`
- `data/marketing/ga4_events_28d.csv`
- `data/marketing/ga4_funnel_28d.csv`

Tracked key event names for this pipeline:

- `sign_up`
- `create_report`
- `export_pdf`
- `export_word`
- `export_excel`
- `checkout_started`
- `checkout_completed`

Current event-name normalization:

| Internal product event | GA4 funnel event | Notes |
| --- | --- | --- |
| `signup_success` | `sign_up` | Existing internal history remains unchanged. |
| `report_created` | `create_report` | Sent after successful report creation. |
| `export_clicked` with `format=pdf` | `export_pdf` | GA4 records the format-specific click. |
| `export_clicked` with `format=docx` | `export_word` | GA4 records the format-specific click. |
| `export_clicked` with `format=xlsx` | `export_excel` | GA4 records the format-specific click. |
| `checkout_started` | `checkout_started` | Exact match. |
| webhook `checkout_completed` | Not yet sent to GA4 | Product analytics receives it server-side; GA4 needs a separate safe design. |

Public marketing interaction events:

| Event | Reliability use | Notes |
| --- | --- | --- |
| `marketing_cta_clicked` | A-grade first-party product event | Reserved for true next-step actions such as signup, pricing, sample, docs/contact navigation, and successful blank-template copy. |
| `faq_opened` | A-grade first-party product event | Records FAQ expansion with `page`, `group`, and `question`; not counted as CTA intent. |
| `content_step_opened` | A-grade first-party product event | Records D0-D8 or content-step expansion with `page` and `step`; not counted as CTA intent. |

Primary uses:

- Find traffic quality: sessions, engaged sessions, engagement rate.
- Find social / UTM contribution by source and medium.
- Find funnel drop-offs from signup to report creation, export, checkout, and payment.

## Product Database Events

Reliability: A.

The product already stores first-party events in `analytics_events`. This PR does not add a database export script because it intentionally avoids database schema, production configuration, and environment changes. Future work can add a read-only product event export after the exact event fields and access method are confirmed.

Primary uses:

- Validate GA4 event coverage.
- Inspect authenticated product behavior that GA4 may miss.
- Support funnel analysis where privacy-safe and operationally useful.

## Payment and Email Data

Reliability: A.

This pipeline treats payment and email data as future inputs only. This PR does not change payment, subscriptions, checkout, Resend, or email behavior.

Primary uses:

- Payment data: checkout_started to checkout_completed quality.
- Email data: signup verification and onboarding email delivery health.

## SERP / Competitor Sample

Reliability: B.

Template:

- `data/marketing/serp_competitor_sample.template.csv`

Fields:

| Field | Meaning |
| --- | --- |
| `keyword` | Keyword searched manually. |
| `ranking_position` | Observed organic ranking position. |
| `ranking_url` | Ranking page URL. |
| `title` | SERP title or page title. |
| `meta_description` | SERP description or page meta description. |
| `page_type` | Example: template page, guide, SaaS landing page, PDF, spreadsheet template. |
| `cta_type` | Example: download, signup, contact sales, free trial. |
| `has_template` | Whether the page includes a visible usable template. |
| `has_pdf_download` | Whether PDF download is offered. |
| `has_excel_download` | Whether Excel download is offered. |
| `has_word_download` | Whether Word download is offered. |
| `has_faq` | Whether FAQ content is present. |
| `has_schema` | Whether structured data is visible or detected. |
| `competitor_notes` | Concise manual notes. |

Primary uses:

- Understand SERP intent before changing SEO copy.
- Identify competitor content / CTA gaps.
- Check whether downloadable template expectations are common in the SERP.

## Operational Rules

1. Average position 1-10 with low CTR: prioritize SERP snippet, title, meta description, rich results, and FAQ snippet.
2. Average position 11-30: prioritize content depth, internal links, FAQ, schema, and template assets.
3. Average position above 30: treat as early visibility and prioritize search-intent fit, examples, internal links, schema, and sample-report CTA before snippet-only work.
4. Search impressions plus low landing engagement: prioritize the first-screen value proposition and CTA.
5. Clicks without engagement: prioritize page content, templates, examples, and FAQ.
6. Engagement without signup: prioritize CTA, registration entry points, and value proposition.
7. Expected funnel names missing while other events exist: mark Measurement risk and validate actual names before conversion conclusions.
8. Signup without create_report: prioritize onboarding only after measurement integrity is confirmed.
9. Create_report without export: prioritize editor completion and export CTA only after measurement integrity is confirmed.
10. Export without payment: prioritize paywall and plan value only after GA4 and product payment events reconcile.

An empty B-grade SERP template is not competitor evidence. Mark it `B pending` and collect live rows before making competitor claims.

## API References

- Google Search Console Search Analytics API: https://developers.google.com/webmaster-tools/v1/searchanalytics/query
- Google Analytics Data API runReport: https://developers.google.com/analytics/devguides/reporting/data/v1/rest/v1beta/properties/runReport
