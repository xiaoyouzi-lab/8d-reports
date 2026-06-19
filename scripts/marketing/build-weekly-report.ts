import { readFileSync, writeFileSync } from "node:fs";
import {
  ensureMarketingDataDir,
  formatPercent,
  marketingPath,
  numberValue,
  readCsv,
} from "./marketing-utils";

type Finding = {
  title: string;
  evidence: string;
  reliability: "A" | "B" | "C" | "D";
  recommendedTask: string;
};

const funnelEvents = [
  "sign_up",
  "create_report",
  "export_pdf",
  "export_word",
  "export_excel",
  "checkout_started",
  "checkout_completed",
];

function topRows(rows: Record<string, string>[], metric: string, limit = 5) {
  return [...rows].sort((a, b) => numberValue(b[metric]) - numberValue(a[metric])).slice(0, limit);
}

function markdownTable(headers: string[], rows: Array<Array<string | number>>) {
  if (rows.length === 0) return "No relevant data.";
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map((value) => String(value).replaceAll("|", "\\|")).join(" | ")} |`),
  ].join("\n");
}

function sourceStatus(fileName: string, reliability: string) {
  const rows = readCsv(marketingPath(fileName));
  return {
    fileName,
    reliability,
    rows,
    status: rows.length > 0 ? `${rows.length} rows` : "No relevant data",
  };
}

function isMeaningfulSerpRow(row: Record<string, string>) {
  return [
    "ranking_position",
    "ranking_url",
    "title",
    "meta_description",
    "page_type",
    "cta_type",
    "competitor_notes",
  ].some((field) => row[field]?.trim());
}

function buildSearchFindings(gscQueries: Record<string, string>[], gscPages: Record<string, string>[]) {
  const findings: Finding[] = [];
  const noClickQueries = topRows(
    gscQueries.filter((row) => numberValue(row.impressions) >= 20 && numberValue(row.clicks) === 0),
    "impressions",
    3,
  );
  const lowCtrPages = topRows(
    gscPages.filter((row) => numberValue(row.impressions) >= 50 && numberValue(row.ctr) < 0.01),
    "impressions",
    3,
  );

  for (const row of noClickQueries) {
    findings.push({
      title: `Query has impressions but no clicks: ${row.query}`,
      evidence: `${row.impressions} impressions, ${row.clicks} clicks, position ${Number(row.average_position || 0).toFixed(1)}`,
      reliability: "A",
      recommendedTask: "Improve title, meta description, H1, and above-the-fold search intent alignment for the relevant page.",
    });
  }

  for (const row of lowCtrPages) {
    findings.push({
      title: `Page has search visibility but weak CTR: ${row.page}`,
      evidence: `${row.impressions} impressions, ${formatPercent(numberValue(row.ctr))} CTR`,
      reliability: "A",
      recommendedTask: "Review SERP intent and tighten page title/meta before changing body content.",
    });
  }

  return findings;
}

function buildFunnelFindings(funnelRows: Record<string, string>[]) {
  const byEvent = new Map(funnelRows.map((row) => [row.event_name, numberValue(row.event_count)]));
  const signup = byEvent.get("sign_up") || 0;
  const createReport = byEvent.get("create_report") || 0;
  const exports = (byEvent.get("export_pdf") || 0) + (byEvent.get("export_word") || 0) + (byEvent.get("export_excel") || 0);
  const checkoutStarted = byEvent.get("checkout_started") || 0;
  const checkoutCompleted = byEvent.get("checkout_completed") || 0;
  const findings: Finding[] = [];

  if (signup > 0 && createReport === 0) {
    findings.push({
      title: "Signups are not turning into first report creation",
      evidence: `${signup} signups, ${createReport} create_report events`,
      reliability: "A",
      recommendedTask: "Improve onboarding and first report creation prompts.",
    });
  }

  if (createReport > 0 && exports === 0) {
    findings.push({
      title: "Created reports are not reaching export",
      evidence: `${createReport} create_report events, ${exports} export events`,
      reliability: "A",
      recommendedTask: "Improve editor completion cues and export CTA placement.",
    });
  }

  if (exports > 0 && checkoutStarted === 0) {
    findings.push({
      title: "Exports are not leading to checkout starts",
      evidence: `${exports} export events, ${checkoutStarted} checkout_started events`,
      reliability: "A",
      recommendedTask: "Improve paywall, single export, and Pro/Team value explanation.",
    });
  }

  if (checkoutStarted > 0 && checkoutCompleted === 0) {
    findings.push({
      title: "Checkout starts are not completing",
      evidence: `${checkoutStarted} checkout_started events, ${checkoutCompleted} checkout_completed events`,
      reliability: "A",
      recommendedTask: "Review checkout friction without changing payment logic in this pipeline PR.",
    });
  }

  return findings;
}

function readTemplateHeader(fileName: string) {
  try {
    return readFileSync(marketingPath(fileName), "utf8").split("\n")[0] || "";
  } catch {
    return "";
  }
}

function main() {
  ensureMarketingDataDir();

  const sources = [
    sourceStatus("gsc_queries_28d.csv", "A"),
    sourceStatus("gsc_pages_28d.csv", "A"),
    sourceStatus("gsc_query_page_28d.csv", "A"),
    sourceStatus("gsc_queries_90d.csv", "A"),
    sourceStatus("gsc_pages_90d.csv", "A"),
    sourceStatus("ga4_landing_pages_28d.csv", "A"),
    sourceStatus("ga4_sources_28d.csv", "A"),
    sourceStatus("ga4_events_28d.csv", "A"),
    sourceStatus("ga4_funnel_28d.csv", "A"),
    sourceStatus("serp_competitor_sample.template.csv", "B"),
  ];

  const gscQueries = sources[0].rows;
  const gscPages = sources[1].rows;
  const ga4LandingPages = sources[5].rows;
  const ga4Sources = sources[6].rows;
  const ga4Funnel = sources[8].rows;
  const serpRows = sources[9].rows.filter(isMeaningfulSerpRow);
  sources[9].status = serpRows.length > 0 ? `${serpRows.length} sampled rows` : "Template ready; no sampled rows";
  const findings = [...buildSearchFindings(gscQueries, gscPages), ...buildFunnelFindings(ga4Funnel)];
  const generatedAt = new Date().toISOString().slice(0, 10);

  const report = `# 8D Reports Weekly Marketing Report

Generated: ${generatedAt}

## 1. Executive Summary

${findings.length > 0 ? findings.slice(0, 5).map((finding) => `- [${finding.reliability}] ${finding.title}: ${finding.evidence}`).join("\n") : "- No relevant data yet. Configure GSC / GA4 exports or add SERP samples before making SEO or GEO content changes."}

## 2. Data Sources and Reliability

${markdownTable(
  ["Source file", "Reliability", "Status"],
  sources.map((source) => [source.fileName, source.reliability, source.status]),
)}

Reliability rule: A = first-party actual data, B = manually verified live evidence, C = third-party estimate, D = assumption. Recommendations must show the evidence grade and must not present D-grade assumptions as conclusions.

## 3. Index Health

- PR #6 established GSC index hygiene for crawlability, canonical URLs, sitemap quality, and expected robots-blocked private routes.
- This report does not modify sitemap, robots, canonical tags, or SEO page copy.
- Current index-health evidence: ${gscPages.length > 0 ? `${gscPages.length} GSC page rows available.` : "No relevant data."}

## 4. Search Demand

${markdownTable(
  ["Query", "Clicks", "Impressions", "CTR", "Avg position"],
  topRows(gscQueries, "impressions").map((row) => [
    row.query || "No relevant data",
    row.clicks || 0,
    row.impressions || 0,
    formatPercent(numberValue(row.ctr)),
    Number(row.average_position || 0).toFixed(1),
  ]),
)}

## 5. Landing Page Performance

${markdownTable(
  ["Landing page", "Sessions", "Engaged sessions", "Engagement rate", "Key events"],
  topRows(ga4LandingPages, "sessions").map((row) => [
    row.landing_page || "No relevant data",
    row.sessions || 0,
    row.engaged_sessions || 0,
    formatPercent(numberValue(row.engagement_rate)),
    row.key_events || 0,
  ]),
)}

## 6. Funnel Analysis

${markdownTable(
  ["Event", "Event count", "Users", "Key events"],
  funnelEvents.map((eventName) => {
    const row = ga4Funnel.find((item) => item.event_name === eventName);
    return [eventName, row?.event_count || 0, row?.total_users || 0, row?.key_events || 0];
  }),
)}

Operational rules:
- Impressions without clicks: optimize title, meta description, H1, and first-screen search intent.
- Clicks without engagement: optimize page content, templates, examples, and FAQ.
- Engagement without signup: optimize CTA, signup entry points, and value proposition.
- Signup without create_report: optimize onboarding and first report creation.
- Create_report without export: optimize editor completion cues and export CTA.
- Export without payment: optimize paywall, single export, and Pro/Team value explanation.

## 7. Competitor / SERP Gap

Template header: ${readTemplateHeader("serp_competitor_sample.template.csv") || "No relevant data."}

${markdownTable(
  ["Keyword", "Position", "URL", "Page type", "CTA", "Notes"],
  topRows(serpRows, "ranking_position").map((row) => [
    row.keyword || "No relevant data",
    row.ranking_position || "",
    row.ranking_url || "",
    row.page_type || "",
    row.cta_type || "",
    row.competitor_notes || "",
  ]),
)}

## 8. GEO Readiness

- Use A/B evidence before changing claims for generative search visibility.
- Prefer pages with real GSC impressions, engaged GA4 sessions, and clear template/report usefulness.
- Do not invent feature claims for AI answers; unsupported product claims remain out of scope.

## 9. Social / UTM Performance

${markdownTable(
  ["Source / medium", "Sessions", "Engaged sessions", "Engagement rate", "Key events"],
  topRows(ga4Sources, "sessions").map((row) => [
    row.source_medium || "No relevant data",
    row.sessions || 0,
    row.engaged_sessions || 0,
    formatPercent(numberValue(row.engagement_rate)),
    row.key_events || 0,
  ]),
)}

## 10. Recommended Codex Tasks

${findings.length > 0 ? findings.map((finding) => `- [${finding.reliability}] ${finding.recommendedTask} Evidence: ${finding.evidence}`).join("\n") : "- [A/B pending] Configure GSC, GA4, and SERP sample inputs, then regenerate this report before requesting content optimization PRs."}

## 11. What Not To Do This Week

- Do not rewrite SEO page body copy without A-grade GSC / GA4 evidence or B-grade SERP evidence.
- Do not treat third-party keyword estimates as first-party demand.
- Do not change auth, payment, exports, database schema, sitemap, robots, or production configuration from this workflow.

## 12. Open Questions

- Which GSC property should be treated as canonical: domain property or https://www.8d-reports.com/ URL-prefix property?
- Which GA4 events are marked as key events in the property?
- Which three keyword families should receive the first manual SERP samples?
`;

  writeFileSync(marketingPath("weekly_report.md"), report, "utf8");
  console.log("Wrote data/marketing/weekly_report.md.");
}

main();
