import { readFileSync, writeFileSync } from "node:fs";
import {
  ensureMarketingDataDir,
  formatPercent,
  marketingPath,
  numberValue,
  readCsv,
} from "./marketing-utils";
import {
  funnelEventNames,
  observedEventAliases,
  type FunnelEventName,
} from "../../src/lib/analytics-taxonomy";

type Reliability = "A" | "B" | "B pending" | "C" | "D";

type Finding = {
  title: string;
  evidence: string;
  reliability: Reliability;
  recommendedTask: string;
};

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

function searchOpportunity(position: number) {
  if (position <= 10) {
    return {
      label: "SERP snippet opportunity",
      task: "Improve the title, meta description, rich-result eligibility, and FAQ snippet for the relevant page.",
    };
  }

  if (position <= 30) {
    return {
      label: "Near-ranking opportunity",
      task: "Strengthen page depth, internal links, FAQ, schema, and usable template assets before focusing on snippet changes.",
    };
  }

  return {
    label: "Low-ranking early visibility",
    task: "Strengthen search-intent fit, content depth, industry examples, internal links, schema, and the sample-report CTA; do not treat this as a title/meta-only problem.",
  };
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
    const position = numberValue(row.average_position);
    const opportunity = searchOpportunity(position);
    findings.push({
      title: `${opportunity.label}: ${row.query}`,
      evidence: `${row.impressions} impressions, ${row.clicks} clicks, ${formatPercent(numberValue(row.ctr))} CTR, position ${position.toFixed(1)}`,
      reliability: "A",
      recommendedTask: opportunity.task,
    });
  }

  for (const row of lowCtrPages) {
    const position = numberValue(row.average_position);
    const opportunity = searchOpportunity(position);
    findings.push({
      title: `${opportunity.label}: ${row.page}`,
      evidence: `${row.impressions} impressions, ${formatPercent(numberValue(row.ctr))} CTR, position ${position.toFixed(1)}`,
      reliability: "A",
      recommendedTask: opportunity.task,
    });
  }

  return findings;
}

function landingPath(pageUrl: string) {
  try {
    return new URL(pageUrl).pathname || "/";
  } catch {
    return pageUrl;
  }
}

function buildLandingFindings(
  gscPages: Record<string, string>[],
  ga4LandingPages: Record<string, string>[],
) {
  const findings: Finding[] = [];

  for (const page of gscPages) {
    const path = landingPath(page.page || "");
    const landing = ga4LandingPages.find((row) => row.landing_page === path);
    const impressions = numberValue(page.impressions);
    const sessions = numberValue(landing?.sessions);
    const engagementRate = numberValue(landing?.engagement_rate);

    if (landing && impressions >= 50 && sessions >= 10 && engagementRate < 0.3) {
      findings.push({
        title: `Search-visible landing page has low engagement: ${path}`,
        evidence: `${impressions} GSC impressions, ${sessions} GA4 sessions, ${formatPercent(engagementRate)} engagement rate`,
        reliability: "A",
        recommendedTask: "Improve the first-screen value proposition and CTA so the page immediately matches the search intent that earned its visibility.",
      });
    }
  }

  return findings;
}

function eventCountMap(eventRows: Record<string, string>[]) {
  return new Map(eventRows.map((row) => [row.event_name, numberValue(row.event_count)]));
}

function observedAliases(eventName: FunnelEventName, counts: Map<string, number>) {
  return observedEventAliases[eventName].filter((alias) => (counts.get(alias) || 0) > 0);
}

function buildFunnelFindings(
  funnelRows: Record<string, string>[],
  ga4EventRows: Record<string, string>[],
) {
  const byEvent = new Map(funnelRows.map((row) => [row.event_name, numberValue(row.event_count)]));
  const allEventCounts = eventCountMap(ga4EventRows);
  const missingExpected = funnelEventNames.filter((eventName) => (allEventCounts.get(eventName) || 0) === 0);
  const aliases = missingExpected.flatMap((eventName) => observedAliases(eventName, allEventCounts));
  const allExpectedZero = funnelEventNames.every((eventName) => (allEventCounts.get(eventName) || 0) === 0);
  const signup = byEvent.get("sign_up") || 0;
  const createReport = byEvent.get("create_report") || 0;
  const exports = (byEvent.get("export_pdf") || 0) + (byEvent.get("export_word") || 0) + (byEvent.get("export_excel") || 0);
  const checkoutStarted = byEvent.get("checkout_started") || 0;
  const checkoutCompleted = byEvent.get("checkout_completed") || 0;
  const findings: Finding[] = [];

  if ((allExpectedZero && ga4EventRows.length > 0) || aliases.length > 0) {
    findings.push({
      title: "Measurement risk: GA4 funnel taxonomy does not match observed event names",
      evidence: `Missing expected names: ${missingExpected.join(", ") || "none"}; observed aliases: ${[...new Set(aliases)].join(", ") || "none"}`,
      reliability: "A",
      recommendedTask: "Align GA4 event names with the funnel taxonomy and verify DebugView before treating zero-valued funnel steps as conversion failures.",
    });
    return findings;
  }

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

function measurementRows(ga4EventRows: Record<string, string>[]) {
  const counts = eventCountMap(ga4EventRows);

  return funnelEventNames.map((eventName) => {
    const exactCount = counts.get(eventName) || 0;
    const aliases = observedAliases(eventName, counts);
    const aliasEvidence = aliases.map((alias) => `${alias} (${counts.get(alias) || 0})`).join(", ");
    const status = exactCount > 0
      ? "Exact match"
      : aliases.length > 0
        ? "Potential naming mismatch"
        : "No GA4 match";

    return [eventName, exactCount, aliasEvidence || "-", status];
  });
}

function buildCompetitorFindings(serpRows: Record<string, string>[]) {
  if (serpRows.length > 0) return [];

  return [{
    title: "Competitor evidence missing",
    evidence: "SERP competitor template has no manually verified sample rows",
    reliability: "B pending" as const,
    recommendedTask: "Collect manual SERP samples for the priority keyword set before making competitor or GEO positioning claims.",
  }];
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
  const ga4Events = sources[7].rows;
  const ga4Funnel = sources[8].rows;
  const serpRows = sources[9].rows.filter(isMeaningfulSerpRow);
  sources[9].status = serpRows.length > 0 ? `${serpRows.length} sampled rows` : "Template ready; no sampled rows";
  const findings = [
    ...buildFunnelFindings(ga4Funnel, ga4Events),
    ...buildLandingFindings(gscPages, ga4LandingPages),
    ...buildSearchFindings(gscQueries, gscPages),
    ...buildCompetitorFindings(serpRows),
  ];
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

Reliability rule: A = first-party actual data, B = manually verified live evidence, B pending = a planned sample with no verified rows, C = third-party estimate, D = assumption. Recommendations must show the evidence grade and must not present D-grade assumptions as conclusions.

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
  funnelEventNames.map((eventName) => {
    const row = ga4Funnel.find((item) => item.event_name === eventName);
    return [eventName, row?.event_count || 0, row?.total_users || 0, row?.key_events || 0];
  }),
)}

Operational rules:
- Position 1-10 with low CTR: inspect the SERP snippet, title, meta description, rich-result eligibility, and FAQ snippet.
- Position 11-30: treat as a near-ranking opportunity and strengthen content, internal links, FAQ, schema, and template assets.
- Position above 30: treat as low-ranking early visibility and strengthen intent fit, depth, examples, internal links, schema, and sample-report CTA before snippet-only work.
- Search impressions plus low landing engagement: improve the first-screen value proposition and CTA.
- Clicks without engagement: optimize page content, templates, examples, and FAQ.
- Engagement without signup: optimize CTA, signup entry points, and value proposition.
- Signup without create_report: optimize onboarding and first report creation.
- Create_report without export: optimize editor completion cues and export CTA.
- Export without payment: optimize paywall, single export, and Pro/Team value explanation.
- Expected funnel names missing while other events exist: mark Measurement risk and validate taxonomy before making conversion conclusions.

## 7. Measurement Integrity

Actual GA4 eventName values [A]: ${ga4Events.length > 0 ? topRows(ga4Events, "event_count", ga4Events.length).map((row) => `${row.event_name} (${row.event_count})`).join(", ") : "No relevant data."}

Expected funnel taxonomy: ${funnelEventNames.join(", ")}

${markdownTable(
  ["Expected event", "Exact count", "Observed alias evidence", "Status"],
  measurementRows(ga4Events),
)}

- [A] Exact names and counts come from the GA4 events export.
- [A] Observed alias names show that product behavior may be recorded under a different taxonomy.
- [D] Historical generic export counts cannot be assigned to PDF, Word, or Excel from this file alone because the export contains eventName, not the format parameter.
- [D] A missing expected name is not proof that the user action did not occur. Treat it as an instrumentation hypothesis until DebugView or product events verify it.

## 8. Competitor / SERP Gap

Template header: ${readTemplateHeader("serp_competitor_sample.template.csv") || "No relevant data."}

${serpRows.length === 0 ? "- [B pending] Competitor evidence missing. The template exists, but no live SERP rows have been verified. Do not publish competitor conclusions yet." : markdownTable(
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

## 9. GEO Readiness

- Use A/B evidence before changing claims for generative search visibility.
- Prefer pages with real GSC impressions, engaged GA4 sessions, and clear template/report usefulness.
- Do not invent feature claims for AI answers; unsupported product claims remain out of scope.

## 10. Social / UTM Performance

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

## 11. Recommended Codex Tasks

${findings.length > 0 ? findings.map((finding) => `- [${finding.reliability}] ${finding.recommendedTask} Evidence: ${finding.evidence}`).join("\n") : "- [A/B pending] Configure GSC, GA4, and SERP sample inputs, then regenerate this report before requesting content optimization PRs."}

## 12. What Not To Do This Week

- Do not rewrite SEO page body copy without A-grade GSC / GA4 evidence or B-grade SERP evidence.
- Do not treat third-party keyword estimates as first-party demand.
- Do not treat missing expected GA4 event names as proof of missing user behavior while measurement integrity is unresolved.
- Do not claim competitor patterns while the B-grade SERP sample is empty.
- Do not change auth, payment, exports, database schema, sitemap, robots, or production configuration from this workflow.

## 13. Open Questions

- Which GA4 events are marked as key events in the property?
- How should server-side checkout_completed be sent to GA4 without coupling payment success to browser state?
- Which three keyword families should receive the first manual SERP samples?
`;

  writeFileSync(marketingPath("weekly_report.md"), report, "utf8");
  console.log("Wrote data/marketing/weekly_report.md.");
}

main();
