# Current Task

## Task Name

Marketing Data Pipeline v1.

## Background

PR #6 is the Google Search Console index hygiene PR. It handles crawlability, canonical URLs, sitemap quality, legacy SEO redirects, and expected robots-blocked private routes.

This task starts the next operating layer: a first Marketing Data Pipeline for `8d-reports.com`. The goal is to make later SEO, GEO, and social work depend on evidence from Google Search Console, Google Analytics 4, product events, and manually verified SERP / competitor samples instead of intuition.

## Goal

Create a small, reviewable PR named `marketing-data-pipeline-v1` that adds data export scripts, reliability rules, a weekly marketing report generator, and a documented marketing workflow.

## Non-Goals

- Do not optimize SEO page body content.
- Do not change homepage copy.
- Do not change auth, signup, login, forgot password, Resend, pricing, subscriptions, payment, checkout, database schema, export logic, attachment ZIP, AI beta gating, sitemap, robots, or production configuration.
- Do not add LinkedIn, X, Xiaohongshu, Zhihu, or WeChat auto-publishing APIs.

## Scope

- Google Search Console export script.
- Google Analytics 4 export script.
- SERP / competitor sample CSV template.
- Marketing data dictionary with reliability grading.
- Marketing workflow documentation with UTM rules and social publishing preparation.
- Weekly report generator that reads available CSV data and stays conservative when data is missing.
- `package.json` scripts for marketing exports and report generation.
- `docs/DEV_LOG.md`.

## Requirements

- Export GSC query, page, and query-page performance data with clicks, impressions, CTR, and average position.
- Export GA4 landing pages, source / medium, events, and funnel data for key events.
- Missing Google credentials must produce clear setup errors, not confusing stack traces.
- Weekly report must include Executive Summary, Data Sources and Reliability, Index Health, Search Demand, Landing Page Performance, Funnel Analysis, Competitor / SERP Gap, GEO Readiness, Social / UTM Performance, Recommended Codex Tasks, What Not To Do This Week, and Open Questions.
- All future operational recommendations must cite data reliability grades.

## Acceptance Criteria

- `npm run marketing:report` generates `data/marketing/weekly_report.md` without Google credentials.
- `npm run marketing:gsc -- --dry-run` and `npm run marketing:ga4 -- --dry-run` document planned outputs without credentials.
- Full project checks pass.
- No SEO page body copy or product core behavior is changed.

## Risk Areas

- GSC and GA4 API exports require service account permissions configured outside this PR.
- GA4 key event names must match the property configuration.
- The first generated weekly report may contain mostly "No relevant data" until real CSV exports and manual SERP samples are added.

## Completion Report Required

Report new scripts, new documents, required Google credentials, data output locations, weekly report generation, what is runnable now, what requires GSC / GA4 access, checks run, remaining risks, unfinished items, and the suggested next task.
