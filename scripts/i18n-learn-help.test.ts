import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import sitemap from "../src/app/sitemap";
import {
  getHelpArticle,
  getHelpArticles,
  getLearnArticle,
  getLearnArticles,
} from "../src/lib/content-library";
import {
  ZH_HELP_SLUGS,
  ZH_LEARN_SLUGS,
  enPathFor,
  hasZhVersion,
  localizedHref,
  zhPathFor,
} from "../src/lib/i18n-routes";

// i18n learn/help guard (Batch 2b). It keeps the 8 /learn and 20 /help
// Simplified Chinese translations in sync with the English source of truth,
// verifies the dynamic route / hreflang / sitemap wiring, and blocks the
// removed manual-service positioning from leaking into the Chinese copy.

const root = process.cwd();
const SITE = "https://www.8d-reports.com";

const read = (relative: string) => readFileSync(path.join(root, relative), "utf8");

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^$(){}|[\]\\]/g, "\\$&");
}

const enLearn = getLearnArticles();
const zhLearn = getLearnArticles("zh");
const enHelp = getHelpArticles();
const zhHelp = getHelpArticles("zh");

const enLearnSlugs = enLearn.map((article) => article.slug).sort();
const zhLearnSlugs = zhLearn.map((article) => article.slug).sort();
const enHelpSlugs = enHelp.map((article) => article.slug).sort();
const zhHelpSlugs = zhHelp.map((article) => article.slug).sort();

// 1. Every English slug must have exactly one Chinese translation.
assert.equal(enLearn.length, 8, "the English learn library is 8 articles");
assert.equal(enHelp.length, 20, "the English help library is 20 articles");
assert.deepEqual(zhLearnSlugs, enLearnSlugs, "every English learn slug must have a zh translation");
assert.deepEqual(zhHelpSlugs, enHelpSlugs, "every English help slug must have a zh translation");
assert.deepEqual([...ZH_LEARN_SLUGS].sort(), enLearnSlugs, "ZH_LEARN_SLUGS must match the translated learn slugs");
assert.deepEqual([...ZH_HELP_SLUGS].sort(), enHelpSlugs, "ZH_HELP_SLUGS must match the translated help slugs");
assert.equal(zhLearn.length, 8, "the zh learn library should expose 8 articles");
assert.equal(zhHelp.length, 20, "the zh help library should expose 20 articles");

// 2. Every zh article needs non-empty required frontmatter and a zh canonical.
const requiredStringFields = ["slug", "title", "description", "type", "status", "canonicalUrl", "lastReviewed"] as const;

for (const en of [...enLearn, ...enHelp]) {
  const isLearn = en.type === "learn";
  const zh = isLearn ? getLearnArticle(en.slug, "zh") : getHelpArticle(en.slug, "zh");
  assert.ok(zh, `${en.slug} must have a zh translation`);

  const record = zh as unknown as Record<string, unknown>;
  for (const key of requiredStringFields) {
    const value = record[key];
    assert.equal(typeof value, "string", `${en.slug}.zh.${key} must be a string`);
    assert.equal((value as string).trim().length > 0, true, `${en.slug}.zh.${key} must not be empty`);
  }
  assert.equal(zh.slug, en.slug, `${en.slug} should keep the same slug`);
  assert.equal(zh.type, en.type, `${en.slug} should keep the same content type`);
  assert.ok(zh.targetKeywords.length > 0, `${en.slug} zh target keywords must not be empty`);
  assert.ok(zh.description.length >= 20, `${en.slug} zh description should be useful`);
  assert.ok(typeof zh.category === "string" && zh.category.trim().length > 0, `${en.slug} zh category must not be empty`);
  assert.equal(zh.canonicalUrl, `${SITE}/zh/${isLearn ? "learn" : "help"}/${en.slug}`, `${en.slug} zh canonical must point at the zh route`);
  assert.ok(zh.body.trim().length > 0, `${en.slug} zh body must not be empty`);

  // Structural parity so a translation never drops a section or step.
  assert.equal(zh.sections.length, en.sections.length, `${en.slug} zh section count should match English`);

  const ids = zh.sections.map((section) => section.id);
  for (const id of ids) {
    assert.ok(id.trim().length > 0, `${en.slug} zh section ids must not be empty`);
  }
  assert.equal(new Set(ids).size, ids.length, `${en.slug} zh section ids must be unique`);
}

// 3. The Chinese learn/help routes must exist and 404 untranslated slugs.
for (const relative of [
  "src/app/zh/learn/page.tsx",
  "src/app/zh/learn/[slug]/page.tsx",
  "src/app/zh/help/page.tsx",
  "src/app/zh/help/[slug]/page.tsx",
]) {
  assert.ok(existsSync(path.join(root, relative)), `${relative} must exist`);
}
const zhLearnIndexSource = read("src/app/zh/learn/page.tsx");
const zhLearnSlugSource = read("src/app/zh/learn/[slug]/page.tsx");
const zhHelpIndexSource = read("src/app/zh/help/page.tsx");
const zhHelpSlugSource = read("src/app/zh/help/[slug]/page.tsx");
for (const source of [zhLearnSlugSource, zhHelpSlugSource]) {
  assert.match(source, /dynamicParams = false/, "zh article routes should statically limit slugs");
  assert.match(source, /generateStaticParams/, "zh article routes should generate static params");
  assert.match(source, /notFound\(\)/, "zh article routes should 404 unknown slugs");
}

// 4. The dynamic route helpers must map both directions and localize hrefs.
for (const [collection, slugs] of [
  ["learn", enLearnSlugs],
  ["help", enHelpSlugs],
] as const) {
  for (const slug of slugs) {
    const enPath = `/${collection}/${slug}`;
    const zhPath = `/zh/${collection}/${slug}`;
    assert.equal(zhPathFor(enPath), zhPath, `${enPath} should map to ${zhPath}`);
    assert.equal(enPathFor(zhPath), enPath, `${zhPath} should map back to ${enPath}`);
    assert.equal(hasZhVersion(enPath), true, `${enPath} should report a zh version`);
    assert.equal(localizedHref(enPath, "zh-CN"), zhPath, `localizedHref should localize ${enPath}`);
    assert.equal(localizedHref(enPath, "en"), enPath, "English locale must keep English hrefs");
  }
  assert.equal(zhPathFor(`/${collection}`), `/zh/${collection}`, `the ${collection} index should localize`);
  assert.equal(enPathFor(`/zh/${collection}`), `/${collection}`, `the zh ${collection} index should map back`);
  assert.equal(localizedHref(`/${collection}`, "zh-CN"), `/zh/${collection}`, `the ${collection} index href should localize`);
  assert.equal(zhPathFor(`/${collection}/does-not-exist`), undefined, "unknown slugs must not localize");
  assert.equal(enPathFor(`/zh/${collection}/does-not-exist`), undefined, "unknown zh slugs must not map back");
  assert.equal(hasZhVersion(`/${collection}/does-not-exist`), false, "unknown slugs must not report a zh version");
}

// 5. Canonical + hreflang must be correct in both directions.
assert.match(zhLearnIndexSource, /canonical:/, "zh learn index needs a canonical URL");
assert.match(zhLearnIndexSource, /"zh-CN":/, "zh learn index needs a zh-CN hreflang");
assert.match(zhLearnIndexSource, /en:/, "zh learn index needs an en hreflang");
assert.match(zhHelpIndexSource, /canonical:/, "zh help index needs a canonical URL");
assert.match(zhHelpIndexSource, /"zh-CN":/, "zh help index needs a zh-CN hreflang");
assert.match(zhHelpIndexSource, /en:/, "zh help index needs an en hreflang");
assert.match(zhLearnSlugSource, /canonical: url/, "zh learn article needs a canonical URL");
assert.match(zhLearnSlugSource, /"zh-CN": url/, "zh learn article needs a zh-CN hreflang");
assert.match(zhLearnSlugSource, /en: enUrl/, "zh learn article needs an en hreflang");
assert.match(zhHelpSlugSource, /canonical: url/, "zh help article needs a canonical URL");
assert.match(zhHelpSlugSource, /"zh-CN": url/, "zh help article needs a zh-CN hreflang");
assert.match(zhHelpSlugSource, /en: enUrl/, "zh help article needs an en hreflang");

const enLearnIndexSource = read("src/app/(marketing)/learn/page.tsx");
const enLearnSlugSource = read("src/app/(marketing)/learn/[slug]/page.tsx");
const enHelpIndexSource = read("src/app/(marketing)/help/page.tsx");
const enHelpSlugSource = read("src/app/(marketing)/help/[slug]/page.tsx");
assert.match(enLearnIndexSource, /"zh-CN":/, "English learn index needs a zh-CN hreflang");
assert.match(enHelpIndexSource, /"zh-CN":/, "English help index needs a zh-CN hreflang");
assert.match(enLearnSlugSource, /"zh-CN": zhUrl/, "English learn article needs a zh-CN hreflang");
assert.match(enHelpSlugSource, /"zh-CN": zhUrl/, "English help article needs a zh-CN hreflang");

// 6. Sitemap alternates for the indexes and every slug, both directions.
const sitemapEntries = sitemap();
function entryFor(url: string) {
  return sitemapEntries.find((item) => item.url === url);
}
for (const collection of ["learn", "help"]) {
  const indexEntry = entryFor(`${SITE}/zh/${collection}`);
  assert.ok(indexEntry, `sitemap should include the zh ${collection} index`);
  assert.equal(indexEntry?.alternates?.languages?.en, `${SITE}/${collection}`, `zh ${collection} index should link to English`);
  assert.equal(indexEntry?.alternates?.languages?.["zh-CN"], `${SITE}/zh/${collection}`, `zh ${collection} index should self-reference`);
}

for (const [collection, slugs] of [
  ["learn", enLearnSlugs],
  ["help", enHelpSlugs],
] as const) {
  for (const slug of slugs) {
    const enUrl = `${SITE}/${collection}/${slug}`;
    const zhUrl = `${SITE}/zh/${collection}/${slug}`;
    const enEntry = entryFor(enUrl);
    const zhEntry = entryFor(zhUrl);
    assert.ok(enEntry, `sitemap should include ${enUrl}`);
    assert.ok(zhEntry, `sitemap should include ${zhUrl}`);
    assert.equal(enEntry?.alternates?.languages?.en, enUrl, `${enUrl} should self-reference as en`);
    assert.equal(enEntry?.alternates?.languages?.["zh-CN"], zhUrl, `${enUrl} should link to ${zhUrl}`);
    assert.equal(zhEntry?.alternates?.languages?.en, enUrl, `${zhUrl} should link back to ${enUrl}`);
    assert.equal(zhEntry?.alternates?.languages?.["zh-CN"], zhUrl, `${zhUrl} should self-reference as zh-CN`);
  }
}

// 7. No removed manual-service or Quality Case positioning in the zh copy, and
//    internal links must point at real routes.
const zhArticleFiles = [
  ...enLearn.map((article) => `content/learn-zh/${article.slug}.md`),
  ...enHelp.map((article) => `content/help-zh/${article.slug}.md`),
];
const forbiddenPhrases = [
  "Quality Case",
  "客户投诉工作台",
  "供应商协作平台",
  "供应商质量协作平台",
  "人工评审",
  "专家评审",
  "Template Setup",
  "Assisted First 8D",
  "Team Launch",
];
const forbiddenRoutes = ["/custom-8d-template-setup", "/team-launch", "/8d-report-review-service"];
const allowedEnglishLinks = new Set(["/signup"]);

let linkCount = 0;
for (const relative of zhArticleFiles) {
  const source = read(relative);
  for (const phrase of forbiddenPhrases) {
    assert.doesNotMatch(source, new RegExp(escapeRegExp(phrase)), `${relative} must not reference "${phrase}"`);
  }
  for (const route of forbiddenRoutes) {
    assert.doesNotMatch(source, new RegExp(escapeRegExp(route)), `${relative} must not link to ${route}`);
  }
  assert.doesNotMatch(source, /guaranteed customer acceptance|certified approval/i, `${relative} must not invent certainty claims`);

  const assertInternalHref = (href: string) => {
    if (href.startsWith("/zh/")) {
      assert.ok(enPathFor(href), `${relative} zh link ${href} must map back to an English route`);
    } else {
      assert.ok(allowedEnglishLinks.has(href), `${relative} English link ${href} is not in the allowlist`);
    }
  };

  for (const match of source.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    const href = match[1];
    if (!href.startsWith("/")) continue;
    linkCount += 1;
    assertInternalHref(href);
  }

  const relatedMatch = source.match(/^related: (\[.*\])$/m);
  if (relatedMatch) {
    const related = JSON.parse(relatedMatch[1]) as string[];
    for (const href of related) {
      assertInternalHref(href);
    }
  }
}
assert.ok(linkCount > 40, "expected the zh articles to contain many internal links");

for (const source of [zhLearnIndexSource, zhLearnSlugSource, zhHelpIndexSource, zhHelpSlugSource]) {
  for (const phrase of forbiddenPhrases) {
    assert.doesNotMatch(source, new RegExp(escapeRegExp(phrase)), `zh learn/help pages must not reference "${phrase}"`);
  }
}

console.log(
  `i18n learn/help checks passed: ${enLearnSlugs.length} learn + ${enHelpSlugs.length} help zh translations, ${linkCount} internal links, ${sitemapEntries.filter((item) => /\/(zh\/)?(learn|help)\//.test(item.url)).length} sitemap article URLs.`,
);
