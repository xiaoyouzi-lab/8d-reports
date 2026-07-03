import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, "../..")
const keywordDir = path.join(rootDir, "ops/seo-keywords")
const inputDir = path.join(keywordDir, "input")
const outputDir = path.join(keywordDir, "output")

const seedPath = path.join(inputDir, "seed-keywords.csv")
const sourceFiles = {
  gsc: path.join(inputDir, "gsc-queries.csv"),
  keywordPlanner: path.join(inputDir, "keyword-planner.csv"),
  trends: path.join(inputDir, "google-trends.csv"),
  serp: path.join(inputDir, "serp-review.csv"),
}

const reportPath = path.join(outputDir, "keyword-opportunity-report.csv")
const summaryPath = path.join(outputDir, "keyword-opportunity-summary.md")

const synonymGroups = [
  [
    "online 8d report tool",
    "create 8d report online",
    "8d report generator online",
    "8d report software",
  ],
  ["customer asking for 8d report", "customer requested 8d report"],
  ["customer rejected my 8d report", "8d report rejected by customer"],
  ["how to respond to a scar", "supplier corrective action request example", "scar response template"],
  ["alternative to excel 8d template", "excel 8d template alternative"],
  ["ai 8d report generator", "ai tool for 8d report", "ai 8d report checker"],
  ["root cause analysis template", "8d root cause analysis template"],
  ["corrective action report template", "8d corrective action example"],
]

const existingPageCandidates = new Map([
  ["online 8d report tool", "/signup"],
  ["8d report template", "/8d-report-template"],
  ["8d report example", "/8d-report-example"],
  ["how to write an 8d report", "/resources/how-to-write-8d-report-customer-complaint"],
  ["how to fill out an 8d report", "/docs/edit-d0-d8"],
  ["how to respond to a scar", "/resources/supplier-corrective-action-request-template"],
  ["8d report excel template", "/resources/excel-8d-template-vs-8d-software"],
  ["alternative to excel 8d template", "/resources/excel-8d-template-vs-8d-software"],
  ["export 8d report to pdf", "/learn/how-to-export-professional-8d-reports-in-pdf-word-and-excel"],
  ["8d report word template", "/learn/how-to-export-professional-8d-reports-in-pdf-word-and-excel"],
  ["8d report excel export", "/help/export-pdf-word-excel-zip"],
  ["automotive 8d report example", "/8d-report-example/automotive"],
  ["supplier 8d report example", "/supplier-8d-report"],
  ["manufacturing 8d report example", "/8d-report-template/manufacturing"],
  ["ai 8d report generator", "/resources/ai-8d-report-checker"],
  ["root cause analysis template", "/resources/8d-root-cause-d4-guide"],
  ["corrective action report template", "/resources/8d-corrective-action-d5-guide"],
])

function normalizeKeyword(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
}

const aliasToCanonical = new Map()
for (const group of synonymGroups) {
  const canonical = normalizeKeyword(group[0])
  for (const alias of group) {
    aliasToCanonical.set(normalizeKeyword(alias), canonical)
  }
}

function canonicalKeyword(value) {
  const normalized = normalizeKeyword(value)
  return aliasToCanonical.get(normalized) || normalized
}

function parseCsv(text) {
  const rows = []
  let row = []
  let field = ""
  let inQuotes = false

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    const next = text[index + 1]

    if (char === "\"" && inQuotes && next === "\"") {
      field += "\""
      index += 1
      continue
    }

    if (char === "\"") {
      inQuotes = !inQuotes
      continue
    }

    if (char === "," && !inQuotes) {
      row.push(field)
      field = ""
      continue
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1
      row.push(field)
      if (row.some((value) => value.trim() !== "")) rows.push(row)
      row = []
      field = ""
      continue
    }

    field += char
  }

  row.push(field)
  if (row.some((value) => value.trim() !== "")) rows.push(row)

  if (rows.length === 0) return []
  const headers = rows[0].map((header) => header.trim())
  return rows.slice(1).map((values) => {
    const record = {}
    headers.forEach((header, index) => {
      record[header] = values[index] ? values[index].trim() : ""
    })
    return record
  })
}

function formatCsvValue(value) {
  const text = value == null ? "" : String(value)
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, "\"\"")}"`
  return text
}

function toCsv(rows, headers) {
  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => formatCsvValue(row[header])).join(",")),
  ].join("\n")
}

function readCsvIfPresent(filePath) {
  if (!fs.existsSync(filePath)) {
    return { exists: false, rows: [], status: "missing_file" }
  }

  const text = fs.readFileSync(filePath, "utf8")
  const rows = parseCsv(text)
  return {
    exists: true,
    rows,
    status: rows.length === 0 ? "empty_file" : "loaded",
  }
}

function numberOrNull(value) {
  if (value == null || value === "") return null
  const normalized = String(value).replace(/[%,$,\s]/g, "")
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

function average(values) {
  const numeric = values.filter((value) => typeof value === "number" && Number.isFinite(value))
  if (numeric.length === 0) return null
  return numeric.reduce((sum, value) => sum + value, 0) / numeric.length
}

function sum(values) {
  const numeric = values.filter((value) => typeof value === "number" && Number.isFinite(value))
  if (numeric.length === 0) return null
  return numeric.reduce((total, value) => total + value, 0)
}

function competitionScore(value) {
  const normalized = String(value || "").toLowerCase()
  if (normalized.includes("low")) return 25
  if (normalized.includes("medium")) return 55
  if (normalized.includes("high")) return 85
  const numeric = numberOrNull(value)
  return numeric == null ? null : Math.max(0, Math.min(100, numeric))
}

function competitorStrengthScore(value) {
  const normalized = String(value || "").toLowerCase()
  if (normalized.includes("weak") || normalized.includes("low")) return 25
  if (normalized.includes("medium") || normalized.includes("mixed")) return 55
  if (normalized.includes("strong") || normalized.includes("high")) return 85
  const numeric = numberOrNull(value)
  return numeric == null ? null : Math.max(0, Math.min(100, numeric))
}

function commercialIntentScore(cluster, intent) {
  const text = `${cluster} ${intent}`.toLowerCase()
  if (text.includes("online tool") || text.includes("commercial") || text.includes("transactional")) return 85
  if (text.includes("ai assistance") || text.includes("excel alternative") || text.includes("export")) return 75
  if (text.includes("customer pressure") || text.includes("customer rejection") || text.includes("scar")) return 70
  if (text.includes("example") || text.includes("root cause") || text.includes("corrective")) return 60
  return 45
}

function conversionFitScore(cluster) {
  const text = cluster.toLowerCase()
  if (text.includes("online tool") || text.includes("customer pressure") || text.includes("customer rejection")) return 90
  if (text.includes("excel alternative") || text.includes("scar") || text.includes("ai assistance")) return 80
  if (text.includes("export") || text.includes("root cause") || text.includes("corrective")) return 70
  if (text.includes("how-to") || text.includes("industry example")) return 60
  return 50
}

function contentGapScore(canonical) {
  return existingPageCandidates.has(canonical) ? 35 : 75
}

function seedFitScore(row) {
  const components = [
    row.commercial_intent_score,
    row.conversion_fit_score,
    row.content_gap_score,
  ]

  const raw = average(components)
  return raw == null ? "" : Math.round(raw)
}

function opportunityScore(row) {
  if (!row.has_decision_data) return "pending_data"

  const components = [row.seed_fit_score]

  if (row.gsc_impressions != null) components.push(Math.min(100, Math.log10(row.gsc_impressions + 1) * 25))
  if (row.avg_monthly_searches != null) components.push(Math.min(100, Math.log10(row.avg_monthly_searches + 1) * 25))
  if (row.trend_score != null) components.push(Math.max(0, Math.min(100, row.trend_score)))
  if (row.competitor_strength != null) components.push(100 - row.competitor_strength)
  if (row.competition_score != null) components.push(100 - row.competition_score)

  const raw = average(components)
  return raw == null ? "" : Math.round(raw)
}

function recommendedAction(row) {
  if (!row.has_decision_data) {
    return "collect_data_before_deciding"
  }

  if (row.existing_page_candidate && row.gsc_impressions > 0 && row.gsc_position != null && row.gsc_position > 8) {
    return "optimize_existing_page"
  }

  if (!row.existing_page_candidate && row.avg_monthly_searches >= 50 && row.competitor_strength !== null && row.competitor_strength <= 60) {
    return "consider_new_page_after_manual_review"
  }

  if (row.avg_monthly_searches !== null && row.avg_monthly_searches < 20 && row.gsc_impressions !== null && row.gsc_impressions < 20) {
    return "deprioritize_for_now"
  }

  return "review_manually"
}

function groupByCanonical(rows, fieldName) {
  const grouped = new Map()
  for (const row of rows) {
    const key = canonicalKeyword(row[fieldName])
    if (!key) continue
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key).push(row)
  }
  return grouped
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function formatNumber(value, decimals = 0) {
  if (value == null || value === "") return ""
  return Number(value).toFixed(decimals).replace(/\.0+$/, "")
}

function missingSources(dataStatus, matches) {
  const missing = []
  if (dataStatus.gsc.status !== "loaded" || matches.gsc.length === 0) missing.push("gsc")
  if (dataStatus.keywordPlanner.status !== "loaded" || matches.keywordPlanner.length === 0) missing.push("keyword_planner")
  if (dataStatus.trends.status !== "loaded" || matches.trends.length === 0) missing.push("google_trends")
  if (dataStatus.serp.status !== "loaded" || matches.serp.length === 0) missing.push("serp_review")
  return missing.join(";")
}

fs.mkdirSync(outputDir, { recursive: true })

const seedRows = readCsvIfPresent(seedPath)
if (seedRows.status !== "loaded") {
  throw new Error(`Seed keyword file is required and must contain rows: ${seedPath}`)
}

const gscData = readCsvIfPresent(sourceFiles.gsc)
const keywordPlannerData = readCsvIfPresent(sourceFiles.keywordPlanner)
const trendsData = readCsvIfPresent(sourceFiles.trends)
const serpData = readCsvIfPresent(sourceFiles.serp)

const dataStatus = {
  gsc: gscData,
  keywordPlanner: keywordPlannerData,
  trends: trendsData,
  serp: serpData,
}

const seedsByCanonical = groupByCanonical(seedRows.rows, "keyword")
const gscByCanonical = groupByCanonical(gscData.rows, "query")
const keywordPlannerByCanonical = groupByCanonical(keywordPlannerData.rows, "keyword")
const trendsByCanonical = groupByCanonical(trendsData.rows, "keyword")
const serpByCanonical = groupByCanonical(serpData.rows, "keyword")

const reportRows = []

for (const [canonical, seeds] of seedsByCanonical.entries()) {
  const gscMatches = gscByCanonical.get(canonical) || []
  const keywordPlannerMatches = keywordPlannerByCanonical.get(canonical) || []
  const trendsMatches = trendsByCanonical.get(canonical) || []
  const serpMatches = serpByCanonical.get(canonical) || []

  const clusters = unique(seeds.map((row) => row.cluster))
  const intents = unique(seeds.map((row) => row.intent))
  const targetMarkets = unique(seeds.map((row) => row.target_market))
  const seedAliases = unique(seeds.map((row) => row.keyword))

  const gscClicks = sum(gscMatches.map((row) => numberOrNull(row.clicks)))
  const gscImpressions = sum(gscMatches.map((row) => numberOrNull(row.impressions)))
  const gscCtr = average(gscMatches.map((row) => numberOrNull(row.ctr)))
  const gscPosition = average(gscMatches.map((row) => numberOrNull(row.position)))
  const avgMonthlySearches = sum(keywordPlannerMatches.map((row) => numberOrNull(row.avg_monthly_searches)))
  const topOfPageBidLow = average(keywordPlannerMatches.map((row) => numberOrNull(row.top_of_page_bid_low)))
  const topOfPageBidHigh = average(keywordPlannerMatches.map((row) => numberOrNull(row.top_of_page_bid_high)))
  const trendScore = average(trendsMatches.map((row) => numberOrNull(row.trend_score)))
  const competitionScores = keywordPlannerMatches.map((row) => competitionScore(row.competition))
  const competitorScores = serpMatches.map((row) => competitorStrengthScore(row.competitor_strength))

  const baseCluster = clusters[0] || ""
  const baseIntent = intents[0] || ""
  const commercialScore = commercialIntentScore(baseCluster, baseIntent)
  const conversionScore = conversionFitScore(baseCluster)
  const gapScore = contentGapScore(canonical)
  const seedScore = seedFitScore({
    commercial_intent_score: commercialScore,
    conversion_fit_score: conversionScore,
    content_gap_score: gapScore,
  })
  const hasSearchData = gscMatches.length > 0 || keywordPlannerMatches.length > 0
  const hasSerpData = serpMatches.length > 0
  const hasDecisionData = hasSearchData && hasSerpData
  const missingData = missingSources(dataStatus, {
    gsc: gscMatches,
    keywordPlanner: keywordPlannerMatches,
    trends: trendsMatches,
    serp: serpMatches,
  })

  const reportRow = {
    keyword: canonical,
    seed_aliases: seedAliases.join("; "),
    cluster: clusters.join("; "),
    intent: intents.join("; "),
    target_market: targetMarkets.join("; "),
    existing_page_candidate: existingPageCandidates.get(canonical) || "",
    gsc_clicks: gscClicks ?? "",
    gsc_impressions: gscImpressions ?? "",
    gsc_ctr: gscCtr == null ? "" : formatNumber(gscCtr, 4),
    gsc_position: gscPosition == null ? "" : formatNumber(gscPosition, 2),
    avg_monthly_searches: avgMonthlySearches ?? "",
    competition: unique(keywordPlannerMatches.map((row) => row.competition)).join("; "),
    competition_score: formatNumber(average(competitionScores), 0),
    top_of_page_bid_low: topOfPageBidLow == null ? "" : formatNumber(topOfPageBidLow, 2),
    top_of_page_bid_high: topOfPageBidHigh == null ? "" : formatNumber(topOfPageBidHigh, 2),
    trend_score: trendScore == null ? "" : formatNumber(trendScore, 0),
    competitor_strength: formatNumber(average(competitorScores), 0),
    commercial_intent_score: commercialScore,
    conversion_fit_score: conversionScore,
    content_gap_score: gapScore,
    seed_fit_score: seedScore,
    opportunity_score: "",
    recommended_action: "",
    missing_data: missingData || "none",
  }

  reportRow.opportunity_score = opportunityScore({
    ...reportRow,
    has_decision_data: hasDecisionData,
    seed_fit_score: seedScore,
    gsc_impressions: gscImpressions,
    avg_monthly_searches: avgMonthlySearches,
    trend_score: trendScore,
    competitor_strength: average(competitorScores),
    competition_score: average(competitionScores),
    commercial_intent_score: commercialScore,
    conversion_fit_score: conversionScore,
    content_gap_score: gapScore,
  })
  reportRow.recommended_action = recommendedAction({
    ...reportRow,
    has_decision_data: hasDecisionData,
    gsc_impressions: gscImpressions,
    gsc_position: gscPosition,
    avg_monthly_searches: avgMonthlySearches,
    competitor_strength: average(competitorScores),
  })

  reportRows.push(reportRow)
}

reportRows.sort((a, b) => {
  const aScore = Number(a.opportunity_score)
  const bScore = Number(b.opportunity_score)
  const aHasScore = Number.isFinite(aScore)
  const bHasScore = Number.isFinite(bScore)
  if (aHasScore && bHasScore) return bScore - aScore
  if (aHasScore) return -1
  if (bHasScore) return 1
  return 0
})

const headers = [
  "keyword",
  "seed_aliases",
  "cluster",
  "intent",
  "target_market",
  "existing_page_candidate",
  "gsc_clicks",
  "gsc_impressions",
  "gsc_ctr",
  "gsc_position",
  "avg_monthly_searches",
  "competition",
  "competition_score",
  "top_of_page_bid_low",
  "top_of_page_bid_high",
  "trend_score",
  "competitor_strength",
  "commercial_intent_score",
  "conversion_fit_score",
  "content_gap_score",
  "seed_fit_score",
  "opportunity_score",
  "recommended_action",
  "missing_data",
]

fs.writeFileSync(reportPath, `${toCsv(reportRows, headers)}\n`)

const sourceSummary = [
  ["Seed keywords", seedPath, `${seedRows.rows.length} rows`],
  ["GSC queries", sourceFiles.gsc, dataStatus.gsc.status],
  ["Keyword Planner", sourceFiles.keywordPlanner, dataStatus.keywordPlanner.status],
  ["Google Trends", sourceFiles.trends, dataStatus.trends.status],
  ["SERP review", sourceFiles.serp, dataStatus.serp.status],
]

const hasSearchSource = dataStatus.gsc.status === "loaded" || dataStatus.keywordPlanner.status === "loaded"
const hasSerpSource = dataStatus.serp.status === "loaded"
const hasDecisionData = hasSearchSource && hasSerpSource
const numericOpportunityRows = reportRows.filter((row) => Number.isFinite(Number(row.opportunity_score)))
const seedClusters = Object.entries(
  reportRows.reduce((accumulator, row) => {
    const cluster = row.cluster || "Unclustered"
    if (!accumulator[cluster]) {
      accumulator[cluster] = { count: 0 }
    }
    accumulator[cluster].count += 1
    return accumulator
  }, {}),
)
  .map(([cluster, value]) => ({
    cluster,
    count: value.count,
  }))

const topClusters = Object.entries(
  numericOpportunityRows.reduce((accumulator, row) => {
    const cluster = row.cluster || "Unclustered"
    if (!accumulator[cluster]) {
      accumulator[cluster] = { count: 0, scoreTotal: 0 }
    }
    accumulator[cluster].count += 1
    accumulator[cluster].scoreTotal += Number(row.opportunity_score)
    return accumulator
  }, {}),
)
  .map(([cluster, value]) => ({
    cluster,
    count: value.count,
    averageScore: Math.round(value.scoreTotal / value.count),
  }))
  .sort((a, b) => b.averageScore - a.averageScore)

function actionList(action) {
  return reportRows
    .filter((row) => row.recommended_action === action)
    .slice(0, 10)
    .map((row) => `- ${row.keyword}${row.existing_page_candidate ? ` -> ${row.existing_page_candidate}` : ""}`)
}

const missingSourceLines = Object.entries(dataStatus)
  .filter(([, value]) => value.status !== "loaded")
  .map(([name, value]) => `- ${name}: ${value.status}`)

const summary = `# Keyword Opportunity Summary

## Data Sources

${sourceSummary.map(([name, filePath, status]) => `- ${name}: \`${path.relative(rootDir, filePath)}\` (${status})`).join("\n")}

## Missing Data

${missingSourceLines.length > 0 ? missingSourceLines.join("\n") : "- none"}

The report does not fabricate search volume, CTR, CPC, competition, difficulty,
or ranking data. Missing source files are reflected in the \`missing_data\`
column and should be filled before content decisions are made.

The \`commercial_intent_score\`, \`conversion_fit_score\`,
\`content_gap_score\`, and \`seed_fit_score\` columns are seed-level heuristics.
They are not data-backed keyword opportunity scores.

${
  hasDecisionData && topClusters.length > 0
    ? `## Data-Backed Keyword Clusters\n\n${topClusters.map((row) => `- ${row.cluster}: average opportunity score ${row.averageScore} across ${row.count} keyword groups`).join("\n")}`
    : `## Seed Intent Clusters Needing Data\n\nThese clusters are research candidates only. They do not prove search demand, commercial value, or content priority until GSC or Keyword Planner data plus SERP review data are imported.\n\n${seedClusters.map((row) => `- ${row.cluster}: ${row.count} keyword groups need data`).join("\n")}`
}

## Top Page Opportunities

${
  hasDecisionData && numericOpportunityRows.length > 0
    ? numericOpportunityRows.slice(0, 10).map((row) => `- ${row.keyword}: ${row.recommended_action}, score ${row.opportunity_score}`).join("\n")
    : "- No data-backed page opportunities yet. Import GSC or Keyword Planner data plus SERP review data first. Google Trends is optional supporting context."
}

## Keywords Suggested For Existing Page Optimization

${hasDecisionData ? actionList("optimize_existing_page").join("\n") || "- none" : "- Missing data. No optimization recommendation is data-backed yet."}

## Keywords Suggested For New Page Consideration

${hasDecisionData ? actionList("consider_new_page_after_manual_review").join("\n") || "- none" : "- Missing data. Do not create new pages from seed keywords alone."}

## Keywords To Deprioritize For Now

${hasDecisionData ? actionList("deprioritize_for_now").join("\n") || "- none" : "- Missing data. Deprioritization requires real search and SERP data."}

## Next CSVs Needed

- \`ops/seo-keywords/input/gsc-queries.csv\`
- \`ops/seo-keywords/input/keyword-planner.csv\`
- \`ops/seo-keywords/input/google-trends.csv\`
- \`ops/seo-keywords/input/serp-review.csv\`

## Generated Files

- \`ops/seo-keywords/output/keyword-opportunity-report.csv\`
- \`ops/seo-keywords/output/keyword-opportunity-summary.md\`
`

fs.writeFileSync(summaryPath, summary)

console.log(`SEO keyword analysis complete.`)
console.log(`Report: ${path.relative(rootDir, reportPath)}`)
console.log(`Summary: ${path.relative(rootDir, summaryPath)}`)
if (missingSourceLines.length > 0) {
  console.log(`Missing data: ${missingSourceLines.map((line) => line.replace("- ", "")).join("; ")}`)
}
