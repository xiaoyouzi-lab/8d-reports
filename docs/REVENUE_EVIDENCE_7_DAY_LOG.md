# Revenue Evidence 7-Day Log

## Purpose

This log tracks the first seven days after the Revenue Evidence and GEO
Operating System launch. It is an operating record, not a product feature spec.
Do not add production test leads, production test users, fake search volume,
fake revenue, or sensitive customer/report content to this document.

## Measurement Access Status

Day 1 date: 2026-07-01.

- GA4/GSC local config exists in a private local secrets location, with
  `GOOGLE_APPLICATION_CREDENTIALS`, `GA4_PROPERTY_ID`, and `GSC_SITE_URL`
  present.
- `npm run marketing:gsc` failed with `fetch failed`.
- `npm run marketing:ga4` failed with `fetch failed`.
- Both Google API export attempts also failed after a network-permission retry.
- Direct HTTPS probes to `oauth2.googleapis.com`,
  `analyticsdata.googleapis.com`, and `searchconsole.googleapis.com` timed out
  from the current execution environment.
- `npm run marketing:report` passed, but it used existing historical CSV files
  rather than fresh GA4/GSC exports.
- No service account JSON, private key, full credential path, password, token,
  or full database URL is recorded here.

## Day 1 Baseline

Known Day 1 internal metrics:

- Internal page views: 24h 0, 7d 8, 30d 40.
- `marketing_cta_clicked`: 24h 0, 7d 17, 30d 17.
- Lead submits: 24h 0, 7d 0, 30d 2.
- Demo downloads: 24h 0, 7d 1, 30d 1.
- Demo report views: 24h 0, 7d 4, 30d 6.
- Signups: 24h 0, 7d 0, 30d 0.
- Reports created: 24h 1, 7d 1, 30d 6.
- Export attempts: 24h 0, 7d 0, 30d 0.
- `knowledge_reuse_panel_opened`: 24h 1, 7d 1, 30d 1.
- `ai_report_review_clicked`: 24h 1, 7d 1, 30d 6.

Production URL checks:

- `/resources` returned 200.
- The 10 high-intent `/resources/*` pages returned 200.
- `/custom-8d-template-setup` returned 200.
- `/pricing` returned 200.
- `/demo-reports` returned 200.
- `/contact` returned 200.
- `https://www.8d-reports.com/sitemap.xml` returned 200 and contains 10
  `/resources/` URLs.

Day 1 interpretation:

- Primary constraint: measurement access plus traffic/discovery.
- Evidence: live GA4/GSC exports cannot currently be refreshed, 24h public
  activity is near zero, and there are no 24h lead submits or demo downloads.
- Avoid over-interpreting CTA conversion, form friction, signup activation, or
  product completion until live acquisition data is available and daily volume
  increases.

## 7-Day Measurement Table

| Day | Date | Sessions | Page views | GSC impressions | GSC clicks | Top landing pages | Demo report views | Demo downloads | Template Setup CTA clicks | Team Launch CTA clicks | Assisted First 8D CTA clicks | Template Setup submits | Contact submits | Signups | First reports created | Export attempts | Knowledge reuse opened | AI Quality Check intent | Main source / medium | Observation | Next action |
| --- | --- | ---: | ---: | ---: | ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- | --- |
| Day 1 | 2026-07-01 | N/A | 0 | N/A | N/A | N/A | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 1 | 1 | N/A | GA4/GSC live export blocked by Google API `fetch failed`; internal 24h activity is too low for conversion diagnosis. | Restore live GA4/GSC access and confirm sitemap submission. |
| Day 2 | 2026-07-02 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Day 3 | 2026-07-03 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Day 4 | 2026-07-04 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Day 5 | 2026-07-05 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Day 6 | 2026-07-06 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Day 7 | 2026-07-07 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |

## Manual Measurement Paths

Use these paths until fresh API exports work again:

- GA4: Analytics -> Reports or Explore -> last 24 hours and last 7 days ->
  sessions, views, landing pages, source / medium, signups, report creation,
  exports, demo downloads, service CTA events, lead submits, Knowledge reuse,
  and AI Quality Check events.
- GSC: Search Console -> select the 8d-reports.com property -> Sitemaps ->
  submit or confirm `https://www.8d-reports.com/sitemap.xml`; then Performance
  -> Search results -> Pages and Queries -> record `/resources/` impressions and
  clicks.
- Admin metrics: authenticated admin -> `/admin/metrics` -> record service CTA,
  lead submit, contact submit, demo download, signup, first report, export,
  Knowledge reuse, and AI intent counts.

## Day 2 Minimum Operating Plan

1. Restore live GA4/GSC export access or use the manual GA4/GSC paths above.
2. Submit or confirm `https://www.8d-reports.com/sitemap.xml` in GSC.
3. Prepare three manual offsite content touchpoints without auto-posting.
4. Check admin revenue metrics once after any manual distribution activity.
