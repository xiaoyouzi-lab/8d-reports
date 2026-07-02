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

## Top Keyword Clusters

- customer pressure intent: average opportunity score 78 across 1 keyword groups
- customer rejection intent: average opportunity score 78 across 1 keyword groups
- online tool intent: average opportunity score 70 across 1 keyword groups
- AI assistance intent: average opportunity score 67 across 1 keyword groups
- Excel alternative intent: average opportunity score 65 across 2 keyword groups
- export / format intent: average opportunity score 62 across 3 keyword groups
- SCAR intent: average opportunity score 62 across 1 keyword groups
- root cause / corrective action intent: average opportunity score 55 across 2 keyword groups
- industry example intent: average opportunity score 52 across 3 keyword groups
- how-to writing intent: average opportunity score 47 across 4 keyword groups

## Top Page Opportunities

- No data-backed page opportunities yet. Import GSC, Keyword Planner, Trends, and SERP review CSVs first.

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
