import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import sitemap from "../src/app/sitemap";
import { revenueGeoResources } from "../src/content/revenue-geo-resources";
import {
  getRevenueGeoResourceZh,
  revenueGeoResourceZhSlugs,
  revenueGeoResourcesZh,
} from "../src/content/revenue-geo-resources-zh";
import {
  ZH_RESOURCE_SLUGS,
  enPathFor,
  hasZhVersion,
  localizedHref,
  zhPathFor,
} from "../src/lib/i18n-routes";

// i18n resources guard (Batch 2a). It keeps the 10 Simplified Chinese
// /resources/* translations in sync with the English source of truth, verifies
// the dynamic route / hreflang wiring, and blocks the removed Quality Case
// positioning from leaking into the Chinese copy.

const root = process.cwd();
const SITE = "https://www.8d-reports.com";

const read = (relative: string) => readFileSync(path.join(root, relative), "utf8");

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^$(){}|[\]\\]/g, "\\$&");
}

const enSlugs = revenueGeoResources.map((resource) => resource.slug).sort();
const zhSlugs = revenueGeoResourceZhSlugs.slice().sort();

// 1. Every English slug must have exactly one Chinese translation.
assert.equal(revenueGeoResources.length, 10, "the English revenue GEO batch is 10 pages");
assert.deepEqual(zhSlugs, enSlugs, "every English resource slug must have a zh translation");
assert.deepEqual(
  [...ZH_RESOURCE_SLUGS].sort(),
  enSlugs,
  "ZH_RESOURCE_SLUGS must match the translated resource slugs",
);
assert.equal(
  revenueGeoResourcesZh.length,
  10,
  "the zh revenue GEO batch should expose 10 resources",
);

const requiredStringFields = [
  "slug",
  "title",
  "metaTitle",
  "metaDescription",
  "h1",
  "targetQuery",
  "category",
  "answer",
] as const;

for (const en of revenueGeoResources) {
  const zh = getRevenueGeoResourceZh(en.slug);
  assert.ok(zh, `${en.slug} must have a zh translation`);

  const requiredStrings: Record<string, string> = zh as unknown as Record<string, string>;
  for (const key of requiredStringFields) {
    const value = requiredStrings[key];
    assert.equal(typeof value, "string", `${en.slug}.zh.${key} must be a string`);
    assert.equal(value.trim().length > 0, true, `${en.slug}.zh.${key} must not be empty`);
  }

  assert.equal(zh.slug, en.slug, `${en.slug} should keep the same slug`);
  assert.equal(zh.intent, en.intent, `${en.slug} should keep the same search intent`);
  assert.equal(zh.targetQuery, en.targetQuery, `${en.slug} should keep the English target query`);
  assert.ok(zh.metaTitle.length > 10, `${en.slug} zh metaTitle should be descriptive`);
  assert.ok(zh.metaDescription.length >= 30, `${en.slug} zh metaDescription should be useful`);
  assert.ok(zh.answer.length >= 40, `${en.slug} zh answer should be answer-first copy`);

  // Structural parity with the English page so the shared renderer never
  // drops a section, table row, or FAQ entry.
  assert.equal(zh.proofElements.length, en.proofElements.length, `${en.slug} proof elements`);
  assert.equal(zh.checklist.length, en.checklist.length, `${en.slug} checklist items`);
  assert.equal(zh.mistakes.length, en.mistakes.length, `${en.slug} mistakes`);
  assert.equal(zh.table.columns.length, 3, `${en.slug} table columns`);
  assert.equal(zh.table.rows.length, en.table.rows.length, `${en.slug} table rows`);
  assert.equal(zh.sections.length, en.sections.length, `${en.slug} sections`);
  assert.equal(zh.relatedLinks.length, en.relatedLinks.length, `${en.slug} related links`);
  assert.equal(zh.faq.length, en.faq.length, `${en.slug} faq items`);
  assert.ok(zh.checklist.length >= 5, `${en.slug} zh practical checklist`);
  assert.ok(zh.mistakes.length >= 4, `${en.slug} zh common mistakes`);
  assert.ok(zh.table.rows.length >= 5, `${en.slug} zh example table`);
  assert.ok(zh.relatedLinks.length >= 3, `${en.slug} zh internal links`);
  assert.ok(zh.faq.length >= 2, `${en.slug} zh visible FAQ`);
  assert.ok(zh.primaryCta.label.trim().length > 0 && zh.primaryCta.href.length > 0, `${en.slug} zh primary CTA`);
  assert.ok(zh.secondaryCta.label.trim().length > 0 && zh.secondaryCta.href.length > 0, `${en.slug} zh secondary CTA`);

  const copyItems = [
    ...zh.proofElements,
    ...zh.checklist,
    ...zh.mistakes,
    ...zh.sections.map((section) => section.title),
    ...zh.sections.map((section) => section.body),
    ...zh.relatedLinks.map((link) => link.label),
    ...zh.faq.flatMap((faq) => [faq.question, faq.answer]),
    ...zh.table.columns,
  ];
  for (const item of copyItems) {
    assert.ok(item.trim().length > 0, `${en.slug} zh copy must not contain empty strings`);
  }
  for (const row of zh.table.rows) {
    assert.equal(row.length, 3, `${en.slug} each zh table row needs 3 cells`);
    for (const cell of row) {
      assert.ok(cell.trim().length > 0, `${en.slug} zh table cells must not be empty`);
    }
  }

  // Every related link must be either an existing Chinese route or an English
  // product route (no invented zh-only URLs).
  for (const link of zh.relatedLinks) {
    if (link.href.startsWith("/zh/")) {
      const restored = enPathFor(link.href);
      assert.ok(restored, `${en.slug} zh related link ${link.href} must map back to English`);
    }
  }
}

assert.equal(getRevenueGeoResourceZh("does-not-exist"), undefined, "unknown zh slugs must resolve to undefined");

// 2. The Chinese resource pages must exist.
for (const relative of [
  "src/app/zh/resources/page.tsx",
  "src/app/zh/resources/[slug]/page.tsx",
]) {
  assert.ok(existsSync(path.join(root, relative)), `${relative} must exist`);
}
const zhIndexSource = read("src/app/zh/resources/page.tsx");
const zhSlugSource = read("src/app/zh/resources/[slug]/page.tsx");
const enSlugSource = read("src/app/(marketing)/resources/[slug]/page.tsx");
const enIndexSource = read("src/app/(marketing)/resources/page.tsx");
assert.match(zhSlugSource, /dynamicParams = false/, "zh resource route should statically limit slugs");
assert.match(zhSlugSource, /generateStaticParams/, "zh resource route should generate static params");
assert.match(zhSlugSource, /notFound\(\)/, "zh resource route should 404 unknown slugs");

// 3. The dynamic route helpers must map both directions and localize hrefs.
for (const slug of enSlugs) {
  const enPath = `/resources/${slug}`;
  const zhPath = `/zh/resources/${slug}`;
  assert.equal(zhPathFor(enPath), zhPath, `${enPath} should map to ${zhPath}`);
  assert.equal(enPathFor(zhPath), enPath, `${zhPath} should map back to ${enPath}`);
  assert.equal(hasZhVersion(enPath), true, `${enPath} should report a zh version`);
  assert.equal(localizedHref(enPath, "zh-CN"), zhPath, `localizedHref should localize ${enPath}`);
  assert.equal(localizedHref(enPath, "en"), enPath, "English locale must keep English hrefs");
}
assert.equal(zhPathFor("/resources"), "/zh/resources", "the resources index should localize");
assert.equal(enPathFor("/zh/resources"), "/resources", "the zh resources index should map back");
assert.equal(localizedHref("/resources", "zh-CN"), "/zh/resources", "the index href should localize");
assert.equal(zhPathFor("/resources/does-not-exist"), undefined, "unknown slugs must not localize");
assert.equal(enPathFor("/zh/resources/does-not-exist"), undefined, "unknown zh slugs must not map back");
assert.equal(hasZhVersion("/resources/does-not-exist"), false, "unknown slugs must not report a zh version");

// 4. Canonical + hreflang must be correct in both directions.
assert.match(zhIndexSource, /canonical:/, "zh resources index needs a canonical URL");
assert.match(zhIndexSource, /"zh-CN":/, "zh resources index needs a zh-CN hreflang");
assert.match(zhIndexSource, /en:/, "zh resources index needs an en hreflang");
assert.match(zhSlugSource, /canonical: url/, "zh resource page needs a canonical URL");
assert.match(zhSlugSource, /"zh-CN": url/, "zh resource page needs a zh-CN hreflang");
assert.match(zhSlugSource, /en: enUrl/, "zh resource page needs an en hreflang");
assert.match(enSlugSource, /canonical: url/, "English resource page needs a canonical URL");
assert.match(enSlugSource, /"zh-CN": zhUrl/, "English resource page needs a zh-CN hreflang");
assert.match(enIndexSource, /"zh-CN":/, "English resources index needs a zh-CN hreflang");

const sitemapEntries = sitemap();
function entryFor(url: string) {
  return sitemapEntries.find((item) => item.url === url);
}
const indexEntry = entryFor(`${SITE}/zh/resources`);
assert.ok(indexEntry, "sitemap should include the zh resources index");
assert.equal(indexEntry?.alternates?.languages?.en, `${SITE}/resources`, "zh index should link to the English index");
assert.equal(indexEntry?.alternates?.languages?.["zh-CN"], `${SITE}/zh/resources`, "zh index should self-reference");

for (const slug of enSlugs) {
  const enUrl = `${SITE}/resources/${slug}`;
  const zhUrl = `${SITE}/zh/resources/${slug}`;
  const enEntry = entryFor(enUrl);
  const zhEntry = entryFor(zhUrl);
  assert.ok(enEntry, `sitemap should include ${enUrl}`);
  assert.ok(zhEntry, `sitemap should include ${zhUrl}`);
  assert.equal(enEntry?.alternates?.languages?.en, enUrl, `${enUrl} should self-reference as en`);
  assert.equal(enEntry?.alternates?.languages?.["zh-CN"], zhUrl, `${enUrl} should link to ${zhUrl}`);
  assert.equal(zhEntry?.alternates?.languages?.en, enUrl, `${zhUrl} should link back to ${enUrl}`);
  assert.equal(zhEntry?.alternates?.languages?.["zh-CN"], zhUrl, `${zhUrl} should self-reference as zh-CN`);
}

// 5. No removed Quality Case / manual-service positioning in the Chinese copy.
const zhSource = read("src/content/revenue-geo-resources-zh.ts");
const zhPageSources = [zhIndexSource, zhSlugSource];
for (const phrase of [
  "Quality Case",
  "客户投诉工作台",
  "供应商协作平台",
  "供应商质量协作平台",
  "人工评审",
  "专家人工评审",
  "Template Setup",
  "Assisted First 8D",
  "Team Launch",
]) {
  assert.doesNotMatch(zhSource, new RegExp(escapeRegExp(phrase)), `zh resources must not reference "${phrase}"`);
  for (const source of zhPageSources) {
    assert.doesNotMatch(source, new RegExp(escapeRegExp(phrase)), `zh resource pages must not reference "${phrase}"`);
  }
}
assert.doesNotMatch(
  zhSource,
  /guaranteed customer acceptance|certified approval|best in the world/i,
  "zh resources must not invent certainty claims",
);

console.log(
  `i18n resources checks passed: ${enSlugs.length} zh slug translations, ${sitemapEntries.filter((item) => item.url.includes("/resources")).length} sitemap resource URLs.`,
);
