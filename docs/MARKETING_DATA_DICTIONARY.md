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

1. Impressions without clicks: prioritize title, meta description, H1, and first-screen search intent.
2. Clicks without engagement: prioritize page content, templates, examples, and FAQ.
3. Engagement without signup: prioritize CTA, registration entry points, and value proposition.
4. Signup without create_report: prioritize onboarding and first report creation.
5. Create_report without export: prioritize editor completion cues and export CTA.
6. Export without payment: prioritize paywall, single export, and Pro / Team value explanation.

## API References

- Google Search Console Search Analytics API: https://developers.google.com/webmaster-tools/v1/searchanalytics/query
- Google Analytics Data API runReport: https://developers.google.com/analytics/devguides/reporting/data/v1/rest/v1beta/properties/runReport
