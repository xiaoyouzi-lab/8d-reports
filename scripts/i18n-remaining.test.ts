import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import sitemap from "../src/app/sitemap";
import { demoReportZhSlugs, getDemoReportZh } from "../src/lib/demo-reports-zh";
import { DEMO_REPORTS } from "../src/lib/demo-reports";
import { getSeoPage, seoPages } from "../src/lib/seo-pages";
import { getSeoPageZh, seoPagesZh } from "../src/lib/seo-pages-zh";
import {
  ZH_DEMO_REPORT_SLUGS,
  ZH_DYNAMIC_COLLECTIONS,
  ZH_ROUTE_MAP,
  enPathFor,
  hasZhVersion,
  localizedHref,
  zhPathFor,
} from "../src/lib/i18n-routes";

// i18n remaining public-page guard (Batch 4). It verifies the 11 remaining
// English-only public routes now have Simplified Chinese versions, that the
// switcher route map resolves both directions, that canonical / hreflang are
// wired on both sides, that the sitemap carries the translated pair, and that
// no removed manual-service or Quality Case positioning leaks into zh copy.

const root = process.cwd();
const SITE = "https://www.8d-reports.com";

const read = (relative: string) => readFileSync(path.join(root, relative), "utf8");
const has = (relative: string) => existsSync(path.join(root, relative));

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^$(){}|[\]\\]/g, "\\$&");
}

// 1. The 11 static zh routes and their English counterparts.
const staticRoutes = [
  { en: "/privacy", zh: "/zh/privacy", file: "src/app/zh/privacy/page.tsx" },
  { en: "/terms", zh: "/zh/terms", file: "src/app/zh/terms/page.tsx" },
  { en: "/8d-report-template", zh: "/zh/8d-report-template", file: "src/app/zh/8d-report-template/page.tsx" },
  { en: "/8d-report-example", zh: "/zh/8d-report-example", file: "src/app/zh/8d-report-example/page.tsx" },
  { en: "/supplier-8d-report", zh: "/zh/supplier-8d-report", file: "src/app/zh/supplier-8d-report/page.tsx" },
  { en: "/corrective-action-report-template", zh: "/zh/corrective-action-report-template", file: "src/app/zh/corrective-action-report-template/page.tsx" },
  { en: "/5-why-root-cause-template", zh: "/zh/5-why-root-cause-template", file: "src/app/zh/5-why-root-cause-template/page.tsx" },
  { en: "/demo-reports", zh: "/zh/demo-reports", file: "src/app/zh/demo-reports/page.tsx" },
] as const;

const demoTypes = ["automotive", "molding", "electronics"] as const;
const dynamicRoutes = demoTypes.map((type) => ({
  en: `/demo-reports/${type}`,
  zh: `/zh/demo-reports/${type}`,
}));
const allRoutes = [...staticRoutes, ...dynamicRoutes];

assert.equal(staticRoutes.length + dynamicRoutes.length, 11, "Batch 4 covers 11 zh routes");

for (const route of staticRoutes) {
  assert.ok(has(route.file), `${route.file} must exist`);
  assert.equal(ZH_ROUTE_MAP[route.en], route.zh, `ZH_ROUTE_MAP must map ${route.en} -> ${route.zh}`);
}
assert.ok(has("src/app/zh/demo-reports/[type]/page.tsx"), "the zh demo detail route must exist");

// 2. Route map resolves in both directions, including the dynamic collection.
for (const route of allRoutes) {
  assert.equal(zhPathFor(route.en), route.zh, `${route.en} must map to ${route.zh}`);
  assert.equal(enPathFor(route.zh), route.en, `${route.zh} must map back to ${route.en}`);
  assert.equal(hasZhVersion(route.en), true, `${route.en} must report a zh version`);
  assert.equal(localizedHref(route.en, "zh-CN"), route.zh, `localizedHref must localize ${route.en}`);
  assert.equal(localizedHref(route.en, "en"), route.en, "English locale must keep English hrefs");
}
assert.equal(zhPathFor("/demo-reports/does-not-exist"), undefined, "unknown demo types must not localize");
assert.equal(enPathFor("/zh/demo-reports/does-not-exist"), undefined, "unknown zh demo types must not map back");

const demoCollection = ZH_DYNAMIC_COLLECTIONS.find(
  (collection) => collection.zhPrefix === "/zh/demo-reports",
);
assert.ok(demoCollection, "the demo-reports dynamic collection must be registered");
assert.equal(demoCollection?.param, "type", "the demo collection must use the [type] segment");
assert.deepEqual([...ZH_DEMO_REPORT_SLUGS].sort(), [...demoTypes].sort(), "demo slug registry must match");
assert.deepEqual([...demoReportZhSlugs].sort(), Object.keys(DEMO_REPORTS).sort(), "zh demo data must mirror English demos");

for (const type of demoTypes) {
  const zh = getDemoReportZh(type);
  assert.ok(zh, `${type} must have zh demo content`);
  const en = DEMO_REPORTS[type];
  assert.equal(zh?.slug, en.slug, `${type} should keep its slug`);
  assert.ok(zh!.title.trim().length > 0, `${type} zh title must not be empty`);
  assert.ok(zh!.industry.trim().length > 0, `${type} zh industry must not be empty`);
  assert.ok(zh!.scenario.trim().length > 0, `${type} zh scenario must not be empty`);
  assert.ok(zh!.workflowSummary.trim().length > 0, `${type} zh workflow summary must not be empty`);
  assert.ok(zh!.workflow.length > 0, `${type} zh workflow must not be empty`);
  for (const value of Object.values(zh!.reportData)) {
    assert.equal(typeof value, "string", `${type} zh report field must be a string`);
    assert.ok(value.trim().length > 0, `${type} zh report field must not be empty`);
  }
}

// 3. The legacy SEO mirror keeps the same slugs and structure.
const legacySlugs = [
  "8d-report-example",
  "supplier-8d-report",
  "corrective-action-report-template",
  "5-why-root-cause-template",
] as const;
assert.equal(seoPagesZh.length, legacySlugs.length, "the zh legacy mirror should cover the 4 live legacy pages");
for (const slug of legacySlugs) {
  const en = getSeoPage(slug);
  const zh = getSeoPageZh(slug);
  assert.ok(en, `${slug} must exist in the English source of truth`);
  assert.ok(zh, `${slug} must have a zh mirror`);
  assert.equal(zh?.slug, en?.slug, `${slug} should keep its slug`);
  assert.ok(zh!.title.trim().length > 0 && zh!.h1.trim().length > 0, `${slug} zh title/h1`);
  assert.ok(zh!.intro.trim().length >= 40, `${slug} zh intro should be substantive`);
  assert.equal(zh!.sections.length, en!.sections.length, `${slug} zh section count`);
  assert.equal(zh!.checklist.length, en!.checklist.length, `${slug} zh checklist count`);
  assert.equal(zh!.faq.length, en!.faq.length, `${slug} zh FAQ count`);
  for (const section of zh!.sections) {
    assert.ok(section.title.trim().length > 0 && section.body.trim().length > 0, `${slug} zh section copy`);
  }
  for (const faq of zh!.faq) {
    assert.ok(faq.question.trim().length > 0 && faq.answer.trim().length > 0, `${slug} zh FAQ copy`);
  }
}
assert.equal(getSeoPageZh("does-not-exist"), undefined, "unknown zh legacy slugs must resolve to undefined");
assert.equal(seoPages.some((page) => page.slug === "8d-report-template"), true, "the legacy 8d-report-template entry may remain unused in English");

// 4. The zh demo detail route statically limits slugs and 404s unknown types.
const zhDemoSource = read("src/app/zh/demo-reports/[type]/page.tsx");
assert.match(zhDemoSource, /dynamicParams = false/, "zh demo detail should statically limit types");
assert.match(zhDemoSource, /generateStaticParams/, "zh demo detail should generate static params");
assert.match(zhDemoSource, /notFound\(\)/, "zh demo detail should 404 unknown types");
assert.match(zhDemoSource, /canonical: zhUrl/, "zh demo detail needs a canonical URL");
assert.match(zhDemoSource, /"zh-CN": zhUrl/, "zh demo detail needs a zh-CN hreflang");
assert.match(zhDemoSource, /en: enUrl/, "zh demo detail needs an en hreflang");
assert.match(zhDemoSource, /\/api\/sample-reports\//, "zh demo detail should keep the download endpoints");
assert.match(zhDemoSource, /rel="nofollow"/, "zh demo download links should be nofollow");
assert.match(zhDemoSource, /\/api\/sample-reports\/\$\{type\}`/, "zh demo detail should keep the PDF download");
for (const format of ["docx", "xlsx", "zip"]) {
  assert.match(zhDemoSource, new RegExp(`format=${format}`), `zh demo detail should keep the ${format} download`);
}
assert.match(zhDemoSource, /下载|PDF|Word|Excel|ZIP/, "zh demo downloads should be labelled in Chinese");

// 5. Canonical + hreflang on both sides of every static pair.
for (const route of staticRoutes) {
  const zhSource = read(route.file);
  assert.match(zhSource, /canonical:/, `${route.zh} needs a canonical URL`);
  assert.match(zhSource, /"zh-CN":/, `${route.zh} needs a zh-CN hreflang`);
  assert.match(zhSource, /en:/, `${route.zh} needs an en hreflang`);

  const enFile = [
    `src/app/(marketing)${route.en}/page.tsx`,
    `src/app${route.en}/page.tsx`,
  ].find((candidate) => has(candidate));
  assert.ok(enFile, `English page for ${route.en} must exist`);
  const enSource = read(enFile);
  assert.match(enSource, /"zh-CN":/, `English ${route.en} needs a zh-CN hreflang`);
}
assert.match(read("src/app/(marketing)/demo-reports/[type]/page.tsx"), /"zh-CN":/, "English demo detail needs a zh-CN hreflang");

// 6. Sitemap carries both directions for all 11 pairs.
const sitemapEntries = sitemap();
const entryFor = (url: string) => sitemapEntries.find((item) => item.url === url);
for (const route of allRoutes) {
  const enUrl = `${SITE}${route.en}`;
  const zhUrl = `${SITE}${route.zh}`;
  const enEntry = entryFor(enUrl);
  const zhEntry = entryFor(zhUrl);
  assert.ok(enEntry, `sitemap should include ${enUrl}`);
  assert.ok(zhEntry, `sitemap should include ${zhUrl}`);
  assert.equal(enEntry?.alternates?.languages?.en, enUrl, `${enUrl} should self-reference as en`);
  assert.equal(enEntry?.alternates?.languages?.["zh-CN"], zhUrl, `${enUrl} should link to ${zhUrl}`);
  assert.equal(zhEntry?.alternates?.languages?.en, enUrl, `${zhUrl} should link back to ${enUrl}`);
  assert.equal(zhEntry?.alternates?.languages?.["zh-CN"], zhUrl, `${zhUrl} should self-reference as zh-CN`);
}

// 7. No removed manual-service / Quality Case positioning, and no invented
//    certainty claims, in the Batch 4 Chinese copy.
const zhCopySources = [
  "src/lib/seo-pages-zh.ts",
  "src/lib/demo-reports-zh.ts",
  "src/components/marketing/SeoLandingPage.tsx",
  "src/app/zh/privacy/page.tsx",
  "src/app/zh/terms/page.tsx",
  "src/app/zh/8d-report-template/page.tsx",
  "src/app/zh/8d-report-example/page.tsx",
  "src/app/zh/supplier-8d-report/page.tsx",
  "src/app/zh/corrective-action-report-template/page.tsx",
  "src/app/zh/5-why-root-cause-template/page.tsx",
  "src/app/zh/demo-reports/page.tsx",
  "src/app/zh/demo-reports/[type]/page.tsx",
].map(read);

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
for (const source of zhCopySources) {
  for (const phrase of forbiddenPhrases) {
    assert.doesNotMatch(source, new RegExp(escapeRegExp(phrase)), `zh Batch 4 copy must not reference "${phrase}"`);
  }
  for (const route of forbiddenRoutes) {
    assert.doesNotMatch(source, new RegExp(escapeRegExp(route)), `zh Batch 4 copy must not link to ${route}`);
  }
  assert.doesNotMatch(
    source,
    /guaranteed customer acceptance|certified approval|best in the world/i,
    "zh Batch 4 copy must not invent certainty claims",
  );
  assert.doesNotMatch(
    source,
    /保证客户接受|保证通过|百分之百通过|认证保证/,
    "zh Batch 4 copy must not invent certainty claims",
  );
}

// The Chinese copy sells live product features.
const allZhCopy = zhCopySources.join("\n");
for (const feature of ["D0-D8", "附件", "Word", "分享", "审批", "锁定", "知识库"]) {
  assert.ok(allZhCopy.includes(feature), `zh Batch 4 copy should mention live feature "${feature}"`);
}

// The legal pages stay factual: they keep the same contact email and the same
// last-updated dates as the English pages.
for (const slug of ["privacy", "terms"] as const) {
  const enSource = read(`src/app/(marketing)/${slug}/page.tsx`);
  const zhSource = read(`src/app/zh/${slug}/page.tsx`);
  assert.ok(enSource.includes("19857345237@163.com"), `English ${slug} should keep the support email`);
  assert.ok(zhSource.includes("19857345237@163.com"), `zh ${slug} should keep the support email`);
}

// The zh 8D template page mirrors the visible FAQ in JSON-LD.
const zhTemplateSource = read("src/app/zh/8d-report-template/page.tsx");
assert.match(zhTemplateSource, /"@type": "FAQPage"/, "zh template page should expose FAQ JSON-LD");
assert.match(zhTemplateSource, /canonical: `\$\{siteUrl\}\/zh\/8d-report-template`/, "zh template canonical");

console.log(
  `i18n remaining checks passed: ${allRoutes.length} zh routes, ${seoPagesZh.length} legacy mirrors, ${demoTypes.length} demo translations, ${sitemapEntries.filter((item) => allRoutes.some((route) => item.url.endsWith(route.zh))).length} sitemap zh URLs.`,
);
