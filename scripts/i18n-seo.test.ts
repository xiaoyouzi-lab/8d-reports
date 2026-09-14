import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import sitemap from "../src/app/sitemap";
import {
  getSeoPagesByType,
  getSeoPathPrefix,
  seoPages,
  type SeoPageType,
} from "../src/content/seo-pages";
import {
  getRelatedSeoPagesZh,
  getSeoPageZh,
  getSeoPagesByTypeZh,
  seoPagesZh,
} from "../src/content/seo-pages-zh";
import {
  ZH_SEO_CORRECTIVE_SLUGS,
  ZH_SEO_EXAMPLE_SLUGS,
  ZH_SEO_FISHBONE_SLUGS,
  ZH_SEO_FIVE_WHY_SLUGS,
  ZH_SEO_PREVENTIVE_SLUGS,
  ZH_SEO_TEMPLATE_SLUGS,
  enPathFor,
  hasZhVersion,
  localizedHref,
  zhPathFor,
} from "../src/lib/i18n-routes";

// i18n programmatic SEO guard (Batch 3). It keeps the Simplified Chinese
// mirror of src/content/seo-pages.ts in sync with the English source of truth,
// verifies the 6 dynamic zh route groups, hreflang, sitemap wiring, and blocks
// removed manual-service or Quality Case positioning from the Chinese copy.

const root = process.cwd();
const SITE = "https://www.8d-reports.com";
const read = (relative: string) => readFileSync(path.join(root, relative), "utf8");

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const groups: { type: SeoPageType; dir: string; array: readonly string[] }[] = [
  { type: "8d-example", dir: "8d-report-example", array: ZH_SEO_EXAMPLE_SLUGS },
  { type: "8d-template", dir: "8d-report-template", array: ZH_SEO_TEMPLATE_SLUGS },
  { type: "5why-example", dir: "5-why-example", array: ZH_SEO_FIVE_WHY_SLUGS },
  { type: "fishbone-example", dir: "fishbone-diagram-example", array: ZH_SEO_FISHBONE_SLUGS },
  { type: "corrective-action", dir: "corrective-action-example", array: ZH_SEO_CORRECTIVE_SLUGS },
  { type: "preventive-action", dir: "preventive-action-example", array: ZH_SEO_PREVENTIVE_SLUGS },
];

// 1. The zh page set must have the same count, slugs, and types as English.
assert.equal(seoPages.length, 50, "the English programmatic set is 50 pages");
assert.equal(seoPagesZh.length, seoPages.length, "the zh programmatic set must have the same page count");
assert.deepEqual(
  seoPagesZh.map((page) => page.slug).sort(),
  seoPages.map((page) => page.slug).sort(),
  "every English programmatic slug must have a zh page",
);

for (const group of groups) {
  const enPages = getSeoPagesByType(group.type);
  const zhPages = getSeoPagesByTypeZh(group.type);
  assert.equal(zhPages.length, enPages.length, `${group.type} zh page count must match English`);
  assert.deepEqual(
    zhPages.map((page) => page.slug).sort(),
    enPages.map((page) => page.slug).sort(),
    `${group.type} zh slugs must match English`,
  );
  for (const page of zhPages) {
    assert.equal(page.type, group.type, `${page.slug} should keep its page type`);
  }
  assert.deepEqual(
    [...group.array].sort(),
    zhPages.map((page) => page.slug.replace(`${getSeoPathPrefix(group.type)}/`, "")).sort(),
    `the ${group.type} route registry must match the generated zh slugs`,
  );
}

// 2. Every zh page needs non-empty required fields and full structural parity.
const requiredStringFields = [
  "slug",
  "title",
  "metaTitle",
  "metaDescription",
  "h1",
  "intro",
] as const;

for (const en of seoPages) {
  const zh = getSeoPageZh(en.slug);
  assert.ok(zh, `${en.slug} must have a zh translation`);
  assert.equal(zh.type, en.type, `${en.slug} should keep the same page type`);
  assert.equal(zh.slug, en.slug, `${en.slug} should keep the same slug`);

  const record = zh as unknown as Record<string, unknown>;
  for (const key of requiredStringFields) {
    const value = record[key];
    assert.equal(typeof value, "string", `${en.slug}.zh.${key} must be a string`);
    assert.equal((value as string).trim().length > 0, true, `${en.slug}.zh.${key} must not be empty`);
  }
  for (const key of ["industry", "problemType", "audience"] as const) {
    const value: string | undefined = zh[key];
    assert.equal(typeof value, "string", `${en.slug}.zh.${key} must be a string`);
    assert.equal((value as string).trim().length > 0, true, `${en.slug}.zh.${key} must not be empty`);
  }
  assert.ok(zh.metaTitle.length >= 4, `${en.slug} zh metaTitle should be descriptive`);
  assert.ok(zh.metaDescription.length >= 30, `${en.slug} zh metaDescription should be useful`);
  assert.ok(zh.intro.length >= 60, `${en.slug} zh intro should be substantive`);

  // Section parity.
  assert.equal(zh.sections.length, en.sections.length, `${en.slug} zh section count must match English`);
  for (const section of zh.sections) {
    assert.ok(section.heading.trim().length > 0, `${en.slug} zh section heading must not be empty`);
    assert.ok(section.body.trim().length > 0, `${en.slug} zh section body must not be empty`);
  }

  // Professional parity.
  const professionalKeys = ["affectedScope", "metric", "detection", "escapePoint", "customerImpact", "verification"] as const;
  for (const key of professionalKeys) {
    assert.equal(typeof zh.professional[key], "string", `${en.slug} zh professional.${key} must be a string`);
    assert.ok(zh.professional[key].trim().length > 0, `${en.slug} zh professional.${key} must not be empty`);
  }
  assert.equal(zh.professional.eightD.length, en.professional.eightD.length, `${en.slug} zh D-step count`);
  assert.equal(zh.professional.fiveWhy.length, en.professional.fiveWhy.length, `${en.slug} zh 5Why count`);
  assert.equal(zh.professional.fishbone.length, en.professional.fishbone.length, `${en.slug} zh fishbone count`);
  assert.equal(zh.professional.actionPlan.length, en.professional.actionPlan.length, `${en.slug} zh action plan count`);
  assert.equal(zh.professional.preventionPlan.length, en.professional.preventionPlan.length, `${en.slug} zh prevention count`);
  assert.equal(zh.professional.eightD.length, 9, `${en.slug} zh D-step count should be 9`);
  assert.deepEqual(
    zh.professional.eightD.map((item) => item.step),
    en.professional.eightD.map((item) => item.step),
    `${en.slug} zh D-step codes must match English`,
  );
  for (const item of zh.professional.eightD) {
    assert.ok(item.title.trim().length > 0 && item.content.trim().length > 0, `${en.slug} zh D-step copy`);
  }
  for (const item of zh.professional.fiveWhy) {
    assert.ok(item.why.trim().length > 0 && item.answer.trim().length > 0, `${en.slug} zh 5Why copy`);
  }
  for (const item of zh.professional.fishbone) {
    assert.ok(item.category.trim().length > 0 && item.possibleCause.trim().length > 0 && item.check.trim().length > 0, `${en.slug} zh fishbone copy`);
  }
  for (const item of zh.professional.actionPlan) {
    assert.ok(item.action.trim().length > 0 && item.owner.trim().length > 0 && item.due.trim().length > 0 && item.verification.trim().length > 0, `${en.slug} zh action plan copy`);
  }
  for (const item of zh.professional.preventionPlan) {
    assert.ok(item.control.trim().length > 0 && item.frequency.trim().length > 0 && item.owner.trim().length > 0 && item.evidence.trim().length > 0, `${en.slug} zh prevention copy`);
  }

  // Example and FAQ parity.
  assert.ok(zh.example, `${en.slug} zh example must exist`);
  for (const key of ["problemDescription", "containmentAction", "rootCause", "correctiveAction", "preventiveAction"] as const) {
    const value: string | undefined = zh.example?.[key];
    assert.equal(typeof value, "string", `${en.slug} zh example.${key} must be a string`);
    assert.ok((value as string).trim().length > 0, `${en.slug} zh example.${key} must not be empty`);
  }
  assert.equal(zh.faqs.length, en.faqs.length, `${en.slug} zh FAQ count must match English`);
  for (const faq of zh.faqs) {
    assert.ok(faq.question.trim().length > 0 && faq.answer.trim().length > 0, `${en.slug} zh FAQ copy`);
  }
  assert.deepEqual(zh.relatedSlugs, en.relatedSlugs, `${en.slug} zh related slugs must match English`);
  assert.ok(getRelatedSeoPagesZh(zh).length > 0, `${en.slug} zh related pages must resolve`);
}

assert.equal(getSeoPageZh("does-not-exist"), undefined, "unknown zh slugs must resolve to undefined");

// 3. The zh routes must exist and 404 untranslated slugs.
for (const group of groups) {
  const relative = `src/app/zh/${group.dir}/[slug]/page.tsx`;
  assert.ok(existsSync(path.join(root, relative)), `${relative} must exist`);
  const source = read(relative);
  assert.match(source, /dynamicParams = false/, `${relative} should statically limit slugs`);
  assert.match(source, /generateStaticParams/, `${relative} should generate static params`);
  assert.match(source, /generateSeoZhMetadata/, `${relative} should generate zh metadata`);
}
const helperSource = read("src/lib/seo-route-zh.tsx");
const zhLandingSource = read("src/components/seo/SeoLandingPageZh.tsx");
assert.match(helperSource, /notFound\(\)/, "the zh seo route helper should 404 unknown slugs");
assert.match(helperSource, /canonical: zhUrl/, "the zh seo route helper needs a canonical URL");
assert.match(helperSource, /"zh-CN": zhUrl/, "the zh seo route helper needs a zh-CN hreflang");
assert.match(helperSource, /en: enUrl/, "the zh seo route helper needs an en hreflang");
assert.match(zhLandingSource, /inLanguage/, "the zh seo JSON-LD should declare its language");
assert.match(read("src/lib/seo-route.tsx"), /"zh-CN": zhUrl/, "English programmatic pages need a zh-CN hreflang");

// 4. The dynamic route helpers must map both directions for every slug.
for (const page of seoPagesZh) {
  const enPath = `/${page.slug}`;
  const zhPath = `/zh/${page.slug}`;
  assert.equal(zhPathFor(enPath), zhPath, `${enPath} should map to ${zhPath}`);
  assert.equal(enPathFor(zhPath), enPath, `${zhPath} should map back to ${enPath}`);
  assert.equal(hasZhVersion(enPath), true, `${enPath} should report a zh version`);
  assert.equal(localizedHref(enPath, "zh-CN"), zhPath, `localizedHref should localize ${enPath}`);
  assert.equal(localizedHref(enPath, "en"), enPath, "English locale must keep English hrefs");
}
assert.equal(zhPathFor("/8d-report-example/does-not-exist"), undefined, "unknown slugs must not localize");
assert.equal(enPathFor("/zh/8d-report-example/does-not-exist"), undefined, "unknown zh slugs must not map back");
assert.equal(hasZhVersion("/8d-report-example/does-not-exist"), false, "unknown slugs must not report a zh version");

// 5. Sitemap alternates for every programmatic slug, both directions.
const sitemapEntries = sitemap();
function entryFor(url: string) {
  return sitemapEntries.find((item) => item.url === url);
}
for (const page of seoPagesZh) {
  const enUrl = `${SITE}/${page.slug}`;
  const zhUrl = `${SITE}/zh/${page.slug}`;
  const enEntry = entryFor(enUrl);
  const zhEntry = entryFor(zhUrl);
  assert.ok(enEntry, `sitemap should include ${enUrl}`);
  assert.ok(zhEntry, `sitemap should include ${zhUrl}`);
  assert.equal(enEntry?.alternates?.languages?.en, enUrl, `${enUrl} should self-reference as en`);
  assert.equal(enEntry?.alternates?.languages?.["zh-CN"], zhUrl, `${enUrl} should link to ${zhUrl}`);
  assert.equal(zhEntry?.alternates?.languages?.en, enUrl, `${zhUrl} should link back to ${enUrl}`);
  assert.equal(zhEntry?.alternates?.languages?.["zh-CN"], zhUrl, `${zhUrl} should self-reference as zh-CN`);
}

// 6. No removed manual-service or Quality Case positioning, and no invented
//    certainty claims, in the Chinese programmatic copy.
const copySources = [
  read("src/content/seo-pages-zh.ts"),
  zhLandingSource,
  helperSource,
  ...groups.map((group) => read(`src/app/zh/${group.dir}/[slug]/page.tsx`)),
];
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
for (const source of copySources) {
  for (const phrase of forbiddenPhrases) {
    assert.doesNotMatch(source, new RegExp(escapeRegExp(phrase)), `zh programmatic copy must not reference "${phrase}"`);
  }
  for (const route of forbiddenRoutes) {
    assert.doesNotMatch(source, new RegExp(escapeRegExp(route)), `zh programmatic copy must not link to ${route}`);
  }
  assert.doesNotMatch(
    source,
    /guaranteed customer acceptance|certified approval|best in the world/i,
    "zh programmatic copy must not invent certainty claims",
  );
}

// The Chinese pages sell only live product features.
assert.match(zhLandingSource, /D0-D8/, "zh landing page should mention D0-D8 editing");
assert.match(zhLandingSource, /附件/, "zh landing page should mention evidence attachments");
assert.match(zhLandingSource, /Word导出/, "zh landing page should mention Word export");
assert.match(zhLandingSource, /分享/, "zh landing page should mention sharing");
assert.match(zhLandingSource, /知识库/, "zh landing page should mention knowledge reuse");

console.log(
  `i18n programmatic SEO checks passed: ${seoPagesZh.length} zh pages across ${groups.length} route groups, ${sitemapEntries.filter((item) => item.url.includes("/8d-report-example") || item.url.includes("/8d-report-template") || item.url.includes("/5-why-example") || item.url.includes("/fishbone-diagram-example") || item.url.includes("/corrective-action-example") || item.url.includes("/preventive-action-example")).length} sitemap programmatic URLs.`,
);
