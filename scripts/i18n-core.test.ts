import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  ZH_DYNAMIC_COLLECTIONS,
  ZH_PATHS,
  ZH_ROUTE_MAP,
} from "../src/lib/i18n-routes";

// i18n core guard for the zh/en marketing switcher (Batch 1).
// It verifies the message catalogs, the redirect-free switcher route map, and
// that no marketing page resurrects the removed Quality Case positioning.

const root = process.cwd();

const requiredNavKeys = [
  "product",
  "examples",
  "resources",
  "learn",
  "help",
  "pricing",
  "dashboard",
  "login",
  "startFree",
  "signOut",
  "user",
  "legal",
  "howItWorks",
  "sampleReport",
  "8dTemplate",
  "8dExamples",
  "fiveWhy",
  "fishbone",
  "correctiveAction",
  "helpCenter",
  "docs",
  "faq",
  "security",
  "contact",
  "privacy",
  "terms",
  "tagline",
  "copyright",
];

function readJson(relative: string) {
  return JSON.parse(readFileSync(path.join(root, relative), "utf8")) as Record<string, unknown>;
}

const en = readJson("src/messages/en.json");
const zh = readJson("src/messages/zh-CN.json");

for (const catalog of [
  { name: "en", messages: en },
  { name: "zh-CN", messages: zh },
]) {
  const nav = catalog.messages.nav as Record<string, unknown> | undefined;
  assert.ok(nav, `${catalog.name} messages must include the nav namespace`);
  for (const key of requiredNavKeys) {
    assert.equal(
      typeof nav[key],
      "string",
      `${catalog.name} messages must translate nav.${key}`,
    );
  }
}

// The pricing / examples / resources labels specifically must be Chinese.
const zhNav = zh.nav as Record<string, string>;
assert.equal(zhNav.pricing, "定价", "zh nav.pricing should be 定价");
assert.equal(zhNav.examples, "示例", "zh nav.examples should be 示例");
assert.equal(zhNav.resources, "资源", "zh nav.resources should be 资源");

function walk(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...walk(full));
    else if (/\.(tsx?|md|json)$/.test(entry.name)) results.push(full);
  }
  return results;
}

// 1. No marketing copy may advertise the removed Quality Case / complaint
//    workbench / supplier-collaboration platform positioning.
const forbiddenPhrases = [
  "Quality Case",
  "客户投诉工作台",
  "供应商协作平台",
  "供应商质量协作平台",
  "专家人工评审",
];

const copyRoots = [
  "src/app/(marketing)",
  "src/app/zh",
  "src/components/marketing",
];

const copyFiles = copyRoots.flatMap((relative) => {
  const target = path.join(root, relative);
  return existsSync(target) ? walk(target) : [];
});
assert.ok(copyFiles.length > 0, "i18n copy scan should find marketing files");

const copyViolations: string[] = [];
for (const file of copyFiles) {
  const relative = path.relative(root, file);
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, index) => {
    for (const phrase of forbiddenPhrases) {
      if (line.includes(phrase)) {
        copyViolations.push(`${relative}:${index + 1}: "${phrase}" -> ${line.trim()}`);
      }
    }
  });
}
assert.deepEqual(
  copyViolations,
  [],
  `Removed Quality Case positioning found in marketing copy:\n${copyViolations.join("\n")}`,
);

// 2. Every zh page that exists must be reachable through the switcher route map
//    (and every mapped zh route must have a real page, so the switcher can
//    never navigate to a 404).
const zhAppDir = path.join(root, "src/app/zh");

function collectZhPageRoutes(dir: string, prefix = "/zh"): string[] {
  const routes: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      routes.push(...collectZhPageRoutes(full, `${prefix}/${entry.name}`));
    } else if (entry.name === "page.tsx") {
      routes.push(prefix === "/zh" ? "/zh" : prefix);
    }
  }
  return routes;
}

const allZhRoutes = collectZhPageRoutes(zhAppDir);
const dynamicZhRoutes = allZhRoutes.filter((route) => route.includes("[")).sort();
const existingZhRoutes = allZhRoutes.filter((route) => !route.includes("[")).sort();
const mappedZhRoutes = [...ZH_PATHS].sort();

assert.deepEqual(
  mappedZhRoutes,
  existingZhRoutes,
  "The switcher route map must match the static zh pages that exist",
);

// Dynamic collections such as /zh/resources/[slug] cannot live in the static
// map. Every dynamic zh page must be registered as a dynamic collection, and
// every registered collection must have a real page behind it.
assert.ok(dynamicZhRoutes.length > 0, "expected at least one dynamic zh collection");
for (const route of dynamicZhRoutes) {
  const collection = ZH_DYNAMIC_COLLECTIONS.find(
    (candidate) => route === `${candidate.zhPrefix}/[slug]`,
  );
  assert.ok(collection, `${route} must be registered in ZH_DYNAMIC_COLLECTIONS`);
  const pageFile = path.join(root, "src/app", `${route.replace(/^\//, "")}/page.tsx`);
  assert.ok(existsSync(pageFile), `${route} is registered but its page is missing`);
}
for (const collection of ZH_DYNAMIC_COLLECTIONS) {
  assert.ok(
    dynamicZhRoutes.includes(`${collection.zhPrefix}/[slug]`),
    `${collection.zhPrefix} is registered but has no dynamic zh page`,
  );
}

for (const enPath of Object.keys(ZH_ROUTE_MAP)) {
  const zhPath = ZH_ROUTE_MAP[enPath];
  assert.notEqual(zhPath, enPath, `zh route for ${enPath} must differ from the English route`);
  const pageFile = path.join(root, "src/app", `${zhPath.replace(/^\//, "")}/page.tsx`);
  assert.ok(existsSync(pageFile), `switcher maps ${enPath} -> ${zhPath} but ${pageFile} is missing`);
  const source = readFileSync(pageFile, "utf8");
  assert.match(source, /canonical:/, `${zhPath} page must set a canonical URL`);
  assert.match(source, /"zh-CN":/, `${zhPath} page must set a zh-CN hreflang alternate`);
}

// 3. English core pages must expose the zh alternate so the pair is discoverable.
function resolveEnglishPage(enPath: string) {
  const slug = enPath.replace(/^\//, "");
  const candidates = enPath === "/"
    ? [path.join(root, "src/app/(marketing)/page.tsx"), path.join(root, "src/app/page.tsx")]
    : [
        path.join(root, "src/app/(marketing)", slug, "page.tsx"),
        path.join(root, "src/app", slug, "page.tsx"),
      ];
  return candidates.find((candidate) => existsSync(candidate));
}

for (const enPath of Object.keys(ZH_ROUTE_MAP)) {
  const pageFile = resolveEnglishPage(enPath);
  assert.ok(pageFile, `English core page for ${enPath} is missing`);
  const source = readFileSync(pageFile, "utf8");
  assert.match(source, /"zh-CN":/, `English page ${enPath} must link to its zh-CN alternate`);
}

// 4. The switcher must consult the shared route map rather than hardcoding URLs.
const switcher = readFileSync(path.join(root, "src/components/LangSwitcher.tsx"), "utf8");
assert.match(switcher, /from "@\/lib\/i18n-routes"/, "LangSwitcher should use the shared route map");
assert.match(switcher, /zhPathFor|enPathFor/, "LangSwitcher should resolve routes through the map");

console.log(
  `i18n core checks passed: ${requiredNavKeys.length} nav keys x2 catalogs, ${existingZhRoutes.length} zh routes, ${copyFiles.length} marketing files scanned.`,
);
