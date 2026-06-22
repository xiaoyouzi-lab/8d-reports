import { explainGoogleCredentials, getGoogleAccessToken, requireEnv } from "./google-auth";
import { funnelEventNames } from "../../src/lib/analytics-taxonomy";
import {
  exitWithFriendlyError,
  hasFlag,
  marketingPath,
  printHelp,
  writeCsv,
  type CsvRow,
} from "./marketing-utils";

type Ga4DimensionValue = { value?: string };
type Ga4MetricValue = { value?: string };
type Ga4Row = {
  dimensionValues?: Ga4DimensionValue[];
  metricValues?: Ga4MetricValue[];
};
type Ga4RunReportResponse = {
  rows?: Ga4Row[];
};

const ga4Scope = "https://www.googleapis.com/auth/analytics.readonly";
const reportConfigs = [
  {
    name: "landing pages",
    output: "ga4_landing_pages_28d.csv",
    dimensions: ["landingPagePlusQueryString"],
    metrics: ["sessions", "totalUsers", "engagedSessions", "engagementRate", "averageSessionDuration", "keyEvents"],
    headers: ["landing_page", "sessions", "total_users", "engaged_sessions", "engagement_rate", "average_session_duration", "key_events"],
  },
  {
    name: "traffic sources",
    output: "ga4_sources_28d.csv",
    dimensions: ["sessionSourceMedium"],
    metrics: ["sessions", "totalUsers", "engagedSessions", "engagementRate", "keyEvents"],
    headers: ["source_medium", "sessions", "total_users", "engaged_sessions", "engagement_rate", "key_events"],
  },
  {
    name: "events",
    output: "ga4_events_28d.csv",
    dimensions: ["eventName"],
    metrics: ["eventCount", "totalUsers", "keyEvents"],
    headers: ["event_name", "event_count", "total_users", "key_events"],
  },
  {
    name: "funnel",
    output: "ga4_funnel_28d.csv",
    dimensions: ["eventName"],
    metrics: ["eventCount", "totalUsers", "keyEvents"],
    headers: ["event_name", "event_count", "total_users", "key_events"],
    onlyKeyEvents: true,
  },
];

function usage() {
  return [
    "Usage: npm run marketing:ga4 [-- --dry-run]",
    "",
    "Exports GA4 landing page, source, event, and funnel data to data/marketing/*.csv.",
    "",
    explainGoogleCredentials(),
  ].join("\n");
}

async function runReport(
  accessToken: string,
  propertyId: string,
  config: (typeof reportConfigs)[number],
): Promise<Ga4RunReportResponse> {
  const response = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      dateRanges: [{ startDate: "28daysAgo", endDate: "yesterday" }],
      dimensions: config.dimensions.map((name) => ({ name })),
      metrics: config.metrics.map((name) => ({ name })),
      dimensionFilter: config.onlyKeyEvents
        ? {
            filter: {
              fieldName: "eventName",
              inListFilter: { values: [...funnelEventNames] },
            },
          }
        : undefined,
      limit: "25000",
      orderBys: [{ metric: { metricName: config.metrics[0] }, desc: true }],
    }),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`GA4 Data API returned HTTP ${response.status}: ${text.slice(0, 500)}`);
  }

  return JSON.parse(text) as Ga4RunReportResponse;
}

function responseToRows(config: (typeof reportConfigs)[number], response: Ga4RunReportResponse) {
  return (response.rows || []).map((row) => {
    const values = [...(row.dimensionValues || []), ...(row.metricValues || [])].map((value) => value.value || "");
    return Object.fromEntries(config.headers.map((header, index) => [header, values[index] || ""])) as CsvRow;
  });
}

async function main() {
  if (hasFlag("--help") || hasFlag("-h")) {
    printHelp("GA4 marketing export", usage());
    return;
  }

  if (hasFlag("--dry-run")) {
    printHelp(
      "GA4 marketing export dry run",
      `${usage()}\n\nPlanned files:\n${reportConfigs.map((item) => `- data/marketing/${item.output}`).join("\n")}`,
    );
    return;
  }

  const credentialsPath = requireEnv("GOOGLE_APPLICATION_CREDENTIALS");
  const propertyId = requireEnv("GA4_PROPERTY_ID").replace(/^properties\//, "");
  const accessToken = await getGoogleAccessToken(credentialsPath, [ga4Scope]);

  for (const config of reportConfigs) {
    const response = await runReport(accessToken, propertyId, config);
    const rows = responseToRows(config, response);
    writeCsv(marketingPath(config.output), config.headers, rows);
    console.log(`Wrote ${config.output}: ${rows.length} rows from ${config.name}.`);
  }
}

main().catch((error: unknown) => exitWithFriendlyError("GA4 export failed", error));
