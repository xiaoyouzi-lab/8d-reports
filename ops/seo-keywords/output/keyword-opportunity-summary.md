# Keyword Opportunity Summary

## Data Sources

- Seed keywords: `ops/seo-keywords/input/seed-keywords.csv` (31 rows)
- GSC queries: `ops/seo-keywords/input/gsc-queries.csv` (missing_file)
- Keyword Planner: `ops/seo-keywords/input/keyword-planner.csv` (missing_file)
- Google Trends: `ops/seo-keywords/input/google-trends.csv` (missing_file)
- SERP review: `ops/seo-keywords/input/serp-review.csv` (missing_file)

## Missing Data

- gsc: missing_file
- keywordPlanner: missing_file
- trends: missing_file
- serp: missing_file

The report does not fabricate search volume, CTR, CPC, competition, difficulty,
or ranking data. Missing source files are reflected in the `missing_data`
column and should be filled before content decisions are made.

The `commercial_intent_score`, `conversion_fit_score`,
`content_gap_score`, and `seed_fit_score` columns are seed-level heuristics.
They are not data-backed keyword opportunity scores.

## Seed Intent Clusters Needing Data

These clusters are research candidates only. They do not prove search demand, commercial value, or content priority until GSC or Keyword Planner data plus SERP review data are imported.

- online tool intent: 1 keyword groups need data
- how-to writing intent: 4 keyword groups need data
- customer pressure intent: 1 keyword groups need data
- customer rejection intent: 1 keyword groups need data
- SCAR intent: 1 keyword groups need data
- Excel alternative intent: 2 keyword groups need data
- export / format intent: 3 keyword groups need data
- industry example intent: 3 keyword groups need data
- AI assistance intent: 1 keyword groups need data
- root cause / corrective action intent: 2 keyword groups need data

## Top Page Opportunities

- No data-backed page opportunities yet. Import GSC or Keyword Planner data plus SERP review data first. Google Trends is optional supporting context.

## Keywords Suggested For Existing Page Optimization

- Missing data. No optimization recommendation is data-backed yet.

## Keywords Suggested For New Page Consideration

- Missing data. Do not create new pages from seed keywords alone.

## Keywords To Deprioritize For Now

- Missing data. Deprioritization requires real search and SERP data.

## Next CSVs Needed

- `ops/seo-keywords/input/gsc-queries.csv`
- `ops/seo-keywords/input/keyword-planner.csv`
- `ops/seo-keywords/input/google-trends.csv`
- `ops/seo-keywords/input/serp-review.csv`

## Generated Files

- `ops/seo-keywords/output/keyword-opportunity-report.csv`
- `ops/seo-keywords/output/keyword-opportunity-summary.md`
