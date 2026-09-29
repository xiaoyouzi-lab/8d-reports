import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

// Regression guard for a defect class a build cannot catch: a refactor replaces
// a literal with t("key") where no catalog defines that key, so the build passes
// and the UI renders the raw key at runtime. Batch 6 hit exactly this
// (editor.revShort was referenced but undefined in both catalogs), so every
// literal translation key used anywhere in src/ must resolve in BOTH catalogs.

const root = process.cwd();
const read = (rel: string) => readFileSync(path.join(root, rel), "utf8");

function sourceFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const rel = dir + "/" + entry.name;
    if (entry.isDirectory()) files.push(...sourceFiles(rel));
    else if (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts")) files.push(rel);
  }
  return files;
}

function hasKey(catalog: unknown, dotted: string): boolean {
  let current: unknown = catalog;
  for (const part of dotted.split(".")) {
    if (typeof current !== "object" || current === null || !(part in (current as Record<string, unknown>))) return false;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string";
}

const en = JSON.parse(read("src/messages/en.json")) as unknown;
const zh = JSON.parse(read("src/messages/zh-CN.json")) as unknown;

const NAMESPACE_RE = /(?:useTranslations|getTranslations|getAppTranslator)\(\s*["\']([^"\']+)["\']/g;
const KEY_RE = /\b(?:t|te|tn)\(\s*["\']([A-Za-z][A-Za-z0-9_.]*)["\']/g;

let checked = 0;
const missing: string[] = [];

for (const file of sourceFiles("src")) {
  const source = read(file);
  const namespaces = new Set<string>();
  NAMESPACE_RE.lastIndex = 0;
  for (let m = NAMESPACE_RE.exec(source); m; m = NAMESPACE_RE.exec(source)) namespaces.add(m[1]);
  if (namespaces.size === 0) continue;

  KEY_RE.lastIndex = 0;
  for (let m = KEY_RE.exec(source); m; m = KEY_RE.exec(source)) {
    const key = m[1];
    checked += 1;
    const resolved = Array.from(namespaces).some(
      (namespace) => hasKey(en, namespace + "." + key) && hasKey(zh, namespace + "." + key),
    );
    if (!resolved) missing.push(file + " -> " + key + " (namespaces: " + Array.from(namespaces).join(", ") + ")");
  }
}

assert.deepEqual(
  missing,
  [],
  "every literal translation key in src/ must exist in both catalogs; unresolved: " + missing.slice(0, 12).join("; "),
);

console.log(
  "i18n key coverage passed: " + checked + " literal translation keys across src/ resolve in both catalogs.",
);
