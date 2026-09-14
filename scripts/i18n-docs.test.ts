import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import sitemap from "../src/app/sitemap";
import { docsTopics } from "../src/lib/marketing-content";
import {
  docsTopicUrl,
  docsTopicsZh,
  getDocsTopic,
  getDocsTopics,
  getDocsTopicZh,
} from "../src/lib/marketing-content-zh";
import {
  ZH_DOCS_SLUGS,
  enPathFor,
  hasZhVersion,
  localizedHref,
  zhPathFor,
} from "../src/lib/i18n-routes";

// i18n docs guard (Batch 2c). It keeps the 10 Simplified Chinese /docs topics
// in sync with the English source of truth, verifies the dynamic route /
// hreflang / sitemap wiring, and blocks removed manual-service or Quality Case
// positioning from leaking into the Chinese copy.

const root = process.cwd();
const SITE = "https://www.8d-reports.com";

const read = (relative: string) => readFileSync(path.join(root, relative), "utf8");

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const enSlugs = docsTopics.map((topic) => topic.slug).sort();
const zhSlugs = docsTopicsZh.map((topic) => topic.slug).sort();

// 1. Every English doc slug must have exactly one Chinese translation.
assert.equal(docsTopics.length, 10, "the English docs set is 10 topics");
assert.equal(docsTopicsZh.length, 10, "the zh docs set should expose 10 topics");
assert.deepEqual(zhSlugs, enSlugs, "every English doc slug must have a zh translation");
assert.deepEqual(
  [...ZH_DOCS_SLUGS].sort(),
  enSlugs,
  "ZH_DOCS_SLUGS must match the translated docs slugs",
);

// 2. Every zh topic needs non-empty copy and structural parity with English.
for (const en of docsTopics) {
  const zh = getDocsTopicZh(en.slug);
  assert.ok(zh, `${en.slug} must have a zh translation`);

  const requiredStrings = zh as unknown as Record<string, string>;
  for (const key of ["slug", "title", "summary", "callout"] as const) {
    const value = requiredStrings[key];
    assert.equal(typeof value, "string", `${en.slug}.zh.${key} must be a string`);
    assert.equal(value.trim().length > 0, true, `${en.slug}.zh.${key} must not be empty`);
  }
  assert.equal(zh.slug, en.slug, `${en.slug} should keep the same slug`);
  assert.ok(zh.title.length >= 2, `${en.slug} zh title should be descriptive`);
  assert.ok(zh.summary.length >= 40, `${en.slug} zh summary should be useful`);
  assert.ok(zh.steps.length > 0, `${en.slug} zh steps must not be empty`);
  assert.equal(zh.steps.length, en.steps.length, `${en.slug} zh step count should match English`);
  for (const step of zh.steps) {
    assert.ok(step.trim().length > 0, `${en.slug} zh steps must not contain empty strings`);
  }

  // Locale-aware accessors must default to English and resolve zh explicitly.
  assert.equal(getDocsTopic(en.slug), en, `getDocsTopic(${en.slug}) should default to English`);
  assert.equal(getDocsTopic(en.slug, "en"), en, `getDocsTopic(${en.slug}, "en") should be English`);
  assert.equal(getDocsTopic(en.slug, "zh"), zh, `getDocsTopic(${en.slug}, "zh") should be Chinese`);
  assert.equal(docsTopicUrl(en.slug), `${SITE}/docs/${en.slug}`, "docsTopicUrl should default to English");
  assert.equal(docsTopicUrl(en.slug, "zh"), `${SITE}/zh/docs/${en.slug}`, "docsTopicUrl zh should point at the zh route");
}

assert.equal(getDocsTopicZh("does-not-exist"), undefined, "unknown zh slugs must resolve to undefined");
assert.deepEqual(getDocsTopics(), docsTopics, "getDocsTopics() should default to English");
assert.deepEqual(getDocsTopics("en"), docsTopics, "getDocsTopics(\"en\") should be English");
assert.deepEqual(getDocsTopics("zh"), docsTopicsZh, "getDocsTopics(\"zh\") should be Chinese");

// 3. The Chinese docs routes must exist and 404 untranslated slugs.
for (const relative of [
  "src/app/zh/docs/page.tsx",
  "src/app/zh/docs/[slug]/page.tsx",
]) {
  assert.ok(existsSync(path.join(root, relative)), `${relative} must exist`);
}
const zhIndexSource = read("src/app/zh/docs/page.tsx");
const zhSlugSource = read("src/app/zh/docs/[slug]/page.tsx");
const enIndexSource = read("src/app/(marketing)/docs/page.tsx");
const enSlugSource = read("src/app/(marketing)/docs/[slug]/page.tsx");
assert.match(zhSlugSource, /dynamicParams = false/, "zh docs topic route should statically limit slugs");
assert.match(zhSlugSource, /generateStaticParams/, "zh docs topic route should generate static params");
assert.match(zhSlugSource, /notFound\(\)/, "zh docs topic route should 404 unknown slugs");

// 4. The dynamic route helpers must map both directions and localize hrefs.
for (const slug of enSlugs) {
  const enPath = `/docs/${slug}`;
  const zhPath = `/zh/docs/${slug}`;
  assert.equal(zhPathFor(enPath), zhPath, `${enPath} should map to ${zhPath}`);
  assert.equal(enPathFor(zhPath), enPath, `${zhPath} should map back to ${enPath}`);
  assert.equal(hasZhVersion(enPath), true, `${enPath} should report a zh version`);
  assert.equal(localizedHref(enPath, "zh-CN"), zhPath, `localizedHref should localize ${enPath}`);
  assert.equal(localizedHref(enPath, "en"), enPath, "English locale must keep English hrefs");
}
assert.equal(zhPathFor("/docs"), "/zh/docs", "the docs index should localize");
assert.equal(enPathFor("/zh/docs"), "/docs", "the zh docs index should map back");
assert.equal(localizedHref("/docs", "zh-CN"), "/zh/docs", "the docs index href should localize");
assert.equal(zhPathFor("/docs/does-not-exist"), undefined, "unknown slugs must not localize");
assert.equal(enPathFor("/zh/docs/does-not-exist"), undefined, "unknown zh slugs must not map back");
assert.equal(hasZhVersion("/docs/does-not-exist"), false, "unknown slugs must not report a zh version");

// 5. Canonical + hreflang must be correct in both directions.
assert.match(zhIndexSource, /canonical:/, "zh docs index needs a canonical URL");
assert.match(zhIndexSource, /"zh-CN":/, "zh docs index needs a zh-CN hreflang");
assert.match(zhIndexSource, /en:/, "zh docs index needs an en hreflang");
assert.match(zhSlugSource, /canonical: url/, "zh docs topic needs a canonical URL");
assert.match(zhSlugSource, /"zh-CN": url/, "zh docs topic needs a zh-CN hreflang");
assert.match(zhSlugSource, /en: enUrl/, "zh docs topic needs an en hreflang");
assert.match(enIndexSource, /"zh-CN":/, "English docs index needs a zh-CN hreflang");
assert.match(enSlugSource, /"zh-CN": zhUrl/, "English docs topic needs a zh-CN hreflang");

// 6. Sitemap alternates for the index and every slug, both directions.
const sitemapEntries = sitemap();
function entryFor(url: string) {
  return sitemapEntries.find((item) => item.url === url);
}
const indexEntry = entryFor(`${SITE}/zh/docs`);
assert.ok(indexEntry, "sitemap should include the zh docs index");
assert.equal(indexEntry?.alternates?.languages?.en, `${SITE}/docs`, "zh docs index should link to English");
assert.equal(indexEntry?.alternates?.languages?.["zh-CN"], `${SITE}/zh/docs`, "zh docs index should self-reference");

for (const slug of enSlugs) {
  const enUrl = `${SITE}/docs/${slug}`;
  const zhUrl = `${SITE}/zh/docs/${slug}`;
  const enEntry = entryFor(enUrl);
  const zhEntry = entryFor(zhUrl);
  assert.ok(enEntry, `sitemap should include ${enUrl}`);
  assert.ok(zhEntry, `sitemap should include ${zhUrl}`);
  assert.equal(enEntry?.alternates?.languages?.en, enUrl, `${enUrl} should self-reference as en`);
  assert.equal(enEntry?.alternates?.languages?.["zh-CN"], zhUrl, `${enUrl} should link to ${zhUrl}`);
  assert.equal(zhEntry?.alternates?.languages?.en, enUrl, `${zhUrl} should link back to ${enUrl}`);
  assert.equal(zhEntry?.alternates?.languages?.["zh-CN"], zhUrl, `${zhUrl} should self-reference as zh-CN`);
}

// 7. No removed manual-service or Quality Case positioning in the zh copy, and
//    the zh pages must only link to routes that exist.
const zhModuleSource = read("src/lib/marketing-content-zh.ts");
const zhPageSources = [zhIndexSource, zhSlugSource];
const forbiddenPhrases = [
  "Quality Case",
  "客户投诉工作台",
  "供应商协作平台",
  "供应商质量协作平台",
  "人工评审",
  "专家评审",
  "专家人工评审",
  "人工服务",
  "定制服务",
  "Template Setup",
  "Assisted First 8D",
  "Team Launch",
];
const forbiddenRoutes = ["/custom-8d-template-setup", "/team-launch", "/8d-report-review-service"];

for (const phrase of forbiddenPhrases) {
  assert.doesNotMatch(zhModuleSource, new RegExp(escapeRegExp(phrase)), `zh docs content must not reference "${phrase}"`);
  for (const source of zhPageSources) {
    assert.doesNotMatch(source, new RegExp(escapeRegExp(phrase)), `zh docs pages must not reference "${phrase}"`);
  }
}
for (const route of forbiddenRoutes) {
  assert.doesNotMatch(zhModuleSource, new RegExp(escapeRegExp(route)), `zh docs content must not link to ${route}`);
  for (const source of zhPageSources) {
    assert.doesNotMatch(source, new RegExp(escapeRegExp(route)), `zh docs pages must not link to ${route}`);
  }
}
for (const source of [zhModuleSource, ...zhPageSources]) {
  assert.doesNotMatch(
    source,
    /guaranteed customer acceptance|certified approval|best in the world/i,
    "zh docs must not invent certainty claims",
  );
}

// Every /zh path referenced in the zh pages must map back to a real English
// route. Dynamic template segments (the slug) are stripped to their base route
// before the lookup.
for (const source of zhPageSources) {
  for (const match of source.matchAll(/\/zh\/[A-Za-z0-9\-/]*/g)) {
    const href = match[0].replace(/\/$/, "");
    if (href === "/zh") continue;
    assert.ok(enPathFor(href), `zh docs link ${href} must map back to an English route`);
  }
  assert.doesNotMatch(source, /href="\/(docs|signup|login)/, "zh pages must not hardcode unlocalized English routes");
}

console.log(
  `i18n docs checks passed: ${enSlugs.length} zh topics, ${sitemapEntries.filter((item) => item.url.includes("/docs")).length} sitemap docs URLs.`,
);
