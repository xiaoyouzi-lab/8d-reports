import { explainGoogleCredentials, getGoogleAccessToken, requireEnv } from "./google-auth";
import {
  exitWithFriendlyError,
  hasFlag,
  isoDateDaysAgo,
  marketingPath,
  printHelp,
  writeCsv,
  type CsvRow,
} from "./marketing-utils";

type SearchAnalyticsRow = {
  keys?: string[];
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
};

type SearchAnalyticsResponse = {
  rows?: SearchAnalyticsRow[];
};

const gscScope = "https://www.googleapis.com/auth/webmasters.readonly";
const rowLimit = 25000;

const exportsToRun = [
  { days: 28, dimensions: ["query"], output: "gsc_queries_28d.csv", headers: ["query"] },
  { days: 28, dimensions: ["page"], output: "gsc_pages_28d.csv", headers: ["page"] },
  { days: 28, dimensions: ["query", "page"], output: "gsc_query_page_28d.csv", headers: ["query", "page"] },
  { days: 90, dimensions: ["query"], output: "gsc_queries_90d.csv", headers: ["query"] },
  { days: 90, dimensions: ["page"], output: "gsc_pages_90d.csv", headers: ["page"] },
];

function usage() {
  return [
    "Usage: npm run marketing:gsc [-- --dry-run]",
    "",
    "Exports Google Search Console Search Analytics data to data/marketing/*.csv.",
    "",
    explainGoogleCredentials(),
  ].join("\n");
}

async function fetchSearchAnalytics(
  accessToken: string,
  siteUrl: string,
  dimensions: string[],
  startDate: string,
  endDate: string,
  startRow: number,
) {
  const response = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startDate,
        endDate,
        dimensions,
        rowLimit,
        startRow,
      }),
    },
  );

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`GSC API returned HTTP ${response.status}: ${text.slice(0, 500)}`);
  }

  return JSON.parse(text) as SearchAnalyticsResponse;
}

async function exportSearchAnalytics(accessToken: string, siteUrl: string, config: (typeof exportsToRun)[number]) {
  const endDate = isoDateDaysAgo(1);
  const startDate = isoDateDaysAgo(config.days);
  const rows: CsvRow[] = [];
  let startRow = 0;

  while (true) {
    const response = await fetchSearchAnalytics(accessToken, siteUrl, config.dimensions, startDate, endDate, startRow);
    const batch = response.rows || [];

    rows.push(
      ...batch.map((row) => {
        const dimensions = Object.fromEntries(config.headers.map((header, index) => [header, row.keys?.[index] || ""]));
        return {
          ...dimensions,
          clicks: row.clicks || 0,
          impressions: row.impressions || 0,
          ctr: row.ctr || 0,
          average_position: row.position || 0,
        };
      }),
    );

    if (batch.length < rowLimit) break;
    startRow += rowLimit;
  }

  const outputPath = marketingPath(config.output);
  writeCsv(outputPath, [...config.headers, "clicks", "impressions", "ctr", "average_position"], rows);
  console.log(`Wrote ${config.output}: ${rows.length} rows (${startDate} to ${endDate}).`);
}

async function main() {
  if (hasFlag("--help") || hasFlag("-h")) {
    printHelp("Google Search Console marketing export", usage());
    return;
  }

  if (hasFlag("--dry-run")) {
    printHelp(
      "Google Search Console marketing export dry run",
      `${usage()}\n\nPlanned files:\n${exportsToRun.map((item) => `- data/marketing/${item.output}`).join("\n")}`,
    );
    return;
  }

  const credentialsPath = requireEnv("GOOGLE_APPLICATION_CREDENTIALS");
  const siteUrl = requireEnv("GSC_SITE_URL");
  const accessToken = await getGoogleAccessToken(credentialsPath, [gscScope]);

  for (const exportConfig of exportsToRun) {
    await exportSearchAnalytics(accessToken, siteUrl, exportConfig);
  }
}

main().catch((error: unknown) => exitWithFriendlyError("GSC export failed", error));
