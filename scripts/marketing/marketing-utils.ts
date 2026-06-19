import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export type CsvRow = Record<string, string | number | boolean | null | undefined>;

export const marketingDataDir = path.join(process.cwd(), "data", "marketing");

export function ensureMarketingDataDir() {
  mkdirSync(marketingDataDir, { recursive: true });
}

export function marketingPath(fileName: string) {
  return path.join(marketingDataDir, fileName);
}

function escapeCsvValue(value: string | number | boolean | null | undefined) {
  const text = value === null || value === undefined ? "" : String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

export function writeCsv(filePath: string, headers: string[], rows: CsvRow[]) {
  mkdirSync(path.dirname(filePath), { recursive: true });
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((header) => escapeCsvValue(row[header])).join(","));
  }
  writeFileSync(filePath, `${lines.join("\n")}\n`, "utf8");
}

export function readCsv(filePath: string) {
  if (!existsSync(filePath)) return [];
  const content = readFileSync(filePath, "utf8").trim();
  if (!content) return [];

  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    const next = content[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(current);
      current = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(current);
      rows.push(row);
      row = [];
      current = "";
    } else {
      current += char;
    }
  }

  row.push(current);
  rows.push(row);

  const [headers, ...dataRows] = rows;
  if (!headers) return [];

  return dataRows.map((dataRow) =>
    Object.fromEntries(headers.map((header, index) => [header, dataRow[index] || ""])),
  );
}

export function numberValue(value: string | number | undefined) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

export function formatPercent(value: number) {
  if (!Number.isFinite(value)) return "No relevant data";
  return `${(value * 100).toFixed(1)}%`;
}

export function isoDateDaysAgo(daysAgo: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

export function hasFlag(name: string) {
  return process.argv.includes(name);
}

export function printHelp(title: string, body: string) {
  console.log(`${title}\n\n${body}`);
}

export function exitWithFriendlyError(prefix: string, error: unknown): never {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`${prefix}: ${message}`);
  process.exit(1);
}
