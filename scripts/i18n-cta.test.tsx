import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { PrimaryCTA } from "../src/components/marketing/MarketingActions";
import { SeoLandingPage } from "../src/components/marketing/SeoLandingPage";
import { getSeoPage } from "../src/lib/seo-pages";
import { localeFromPathname, localizedHref } from "../src/lib/i18n-routes";

// i18n public-CTA guard (Batch 5b). Batch 5a added the /zh auth pages, but the
// public conversion path still pointed at the English /signup. This test locks
// in the localizedHref query/hash handling, the source-level cleanup of every
// /zh page CTA, the zh SeoLandingPage copy, and English rendering.

const root = process.cwd();
const read = (relative: string) => readFileSync(path.join(root, relative), "utf8");

// 1. localizedHref unit behaviour.
// English (and any non-zh locale) is always a byte-for-byte no-op.
assert.equal(localizedHref("/signup", "en"), "/signup");
assert.equal(localizedHref("/signup?intent=create-report&source=seo&slug=x", "en"), "/signup?intent=create-report&source=seo&slug=x");
assert.equal(localizedHref("/signup#top", "en"), "/signup#top");

// zh-CN localizes only the path.
assert.equal(localizedHref("/signup", "zh-CN"), "/zh/signup");
assert.equal(localizedHref("/login", "zh-CN"), "/zh/login");
assert.equal(localizedHref("/pricing", "zh-CN"), "/zh/pricing");
assert.equal(
  localizedHref("/signup?intent=create-report&source=seo&slug=x", "zh-CN"),
  "/zh/signup?intent=create-report&source=seo&slug=x",
  "the query string must be preserved exactly and in order",
);

// Hash fragments stay in place, including the legacy /#workflow form.
assert.equal(localizedHref("/signup#top", "zh-CN"), "/zh/signup#top");
assert.equal(localizedHref("/#workflow", "zh-CN"), "/zh#workflow");

// Edge cases: hash-only, query-only, and both. A "?" inside a query value must
// not be mistaken for a second path separator.
assert.equal(localizedHref("#top", "zh-CN"), "#top");
assert.equal(localizedHref("?a=b", "zh-CN"), "?a=b");
assert.equal(localizedHref("/pricing?checkout=pro#plans", "zh-CN"), "/zh/pricing?checkout=pro#plans");
assert.equal(
  localizedHref("/signup?next=/pricing?plan=pro&slug=x#cta", "zh-CN"),
  "/zh/signup?next=/pricing?plan=pro&slug=x#cta",
);

// Unmapped, external, and mailto URLs are returned unchanged.
assert.equal(localizedHref("/api/sample-reports/automotive", "zh-CN"), "/api/sample-reports/automotive");
assert.equal(localizedHref("/reports/new?template=automotive", "zh-CN"), "/reports/new?template=automotive");
assert.equal(localizedHref("https://example.com/signup?x=1#y", "zh-CN"), "https://example.com/signup?x=1#y");
assert.equal(localizedHref("mailto:support@8d-reports.com?subject=8D", "zh-CN"), "mailto:support@8d-reports.com?subject=8D");

// The URL-derived locale mirrors LocaleProvider.
assert.equal(localeFromPathname("/zh"), "zh-CN");
assert.equal(localeFromPathname("/zh/signup"), "zh-CN");
assert.equal(localeFromPathname("/zh/demo-reports/automotive"), "zh-CN");
assert.equal(localeFromPathname("/signup"), "en");
assert.equal(localeFromPathname("/"), "en");
assert.equal(localeFromPathname(null), "en");

// 2. No file under src/app/zh/** links to the English /signup or /login.
function listSourceFiles(dir: string, pattern = /\.(ts|tsx)$/): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listSourceFiles(fullPath, pattern));
    } else if (pattern.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

const zhFiles = listSourceFiles(path.join(root, "src/app/zh"));
assert.ok(zhFiles.length > 0, "src/app/zh must contain sources to scan");
let zhSignupLinks = 0;
for (const file of zhFiles) {
  const source = readFileSync(file, "utf8");
  const relative = path.relative(root, file);
  assert.doesNotMatch(source, /href="\/signup"/, relative + " must not link to the English /signup");
  assert.doesNotMatch(source, /href="\/login"/, relative + " must not link to the English /login");
  zhSignupLinks += (source.match(/href="\/zh\/signup"/g) ?? []).length;
}
assert.ok(zhSignupLinks > 0, "the zh pages must link to /zh/signup");

// The zh learn articles keep their CTA list in markdown, outside src/app/zh.
const zhLearnFiles = listSourceFiles(path.join(root, "content/learn-zh"), /\.md$/);
assert.ok(zhLearnFiles.length > 0, "content/learn-zh must contain articles to scan");
let zhLearnSignupLinks = 0;
for (const file of zhLearnFiles) {
  const source = readFileSync(file, "utf8");
  const relative = path.relative(root, file);
  assert.doesNotMatch(source, /\(\/signup\)/, relative + " must not link to the English /signup");
  assert.doesNotMatch(source, /\(\/login\)/, relative + " must not link to the English /login");
  zhLearnSignupLinks += (source.match(/\(\/zh\/signup\)/g) ?? []).length;
}
assert.ok(zhLearnSignupLinks > 0, "the zh learn articles must link to /zh/signup");

// English learn articles keep their /signup links.
const enLearnFiles = listSourceFiles(path.join(root, "content/learn"), /\.md$/);
assert.ok(
  enLearnFiles.some((file) => readFileSync(file, "utf8").includes("](/signup)")),
  "the English learn articles must keep their /signup links",
);

// 3. The shared SeoLandingPage renders /zh/signup for its zh locale (and the
//    zh sample link stays zh).
const samplePage = getSeoPage("8d-report-example");
assert.ok(samplePage, "the 8d-report-example legacy SEO page must exist");
const zhHtml = renderToStaticMarkup(<SeoLandingPage page={samplePage} locale="zh" />);
assert.ok(zhHtml.includes('href="/zh/signup"'), "zh SeoLandingPage must link to /zh/signup");
assert.ok(!zhHtml.includes('href="/signup"'), "zh SeoLandingPage must not link to /signup");
assert.ok(zhHtml.includes('href="/zh/sample-report"'), "zh SeoLandingPage must keep the zh sample-report link");

// 4. English rendering is untouched: the shared component and the default CTA
//    keep the English href, and the English marketing pages still declare them.
const enHtml = renderToStaticMarkup(<SeoLandingPage page={samplePage} />);
assert.ok(enHtml.includes('href="/signup"'), "en SeoLandingPage must keep /signup");
assert.ok(!enHtml.includes('href="/zh/signup"'), "en SeoLandingPage must not localize");

const enCta = renderToStaticMarkup(
  <PrimaryCTA href="/signup" page="test" location="test">
    Start free
  </PrimaryCTA>,
);
assert.ok(enCta.includes('href="/signup"'), "the default PrimaryCTA must keep /signup in English");
assert.ok(!enCta.includes('href="/zh/signup"'), "the default PrimaryCTA must not localize in English");

const optedOutCta = renderToStaticMarkup(
  <PrimaryCTA href="/signup" page="test" location="test" localize={false}>
    Start free
  </PrimaryCTA>,
);
assert.ok(optedOutCta.includes('href="/signup"'), "localize={false} must render the raw href");

for (const file of [
  "src/app/(marketing)/page.tsx",
  "src/app/(marketing)/pricing/page.tsx",
  "src/app/(marketing)/sample-report/page.tsx",
]) {
  assert.match(read(file), /href="\/signup"/, file + " must keep the English signup href");
}

// 5. Source guards for the localized CTA plumbing.
const actions = read("src/components/marketing/MarketingActions.tsx");
assert.match(actions, /localize = true/, "TrackedLink/PrimaryCTA must default to localizing");
assert.match(actions, /localeFromPathname/, "MarketingActions must derive the URL locale");

const header = read("src/components/marketing/MarketingHeader.tsx");
assert.match(header, /localizedHref\("\/login", locale\)/, "the header login CTA must localize");
assert.match(header, /localizedHref\("\/signup", locale\)/, "the header signup CTA must localize");

const seoTracking = read("src/components/seo/SeoTracking.tsx");
assert.match(seoTracking, /localizedHref\(/, "SEO CTAs must localize");
assert.ok(
  seoTracking.includes("intent=create-report&source=seo&slug=") &&
    seoTracking.includes("intent=use-template&source=seo&slug="),
  "SEO CTAs must preserve their query strings exactly",
);

for (const file of ["src/components/CheckoutButton.tsx", "src/components/AutoCheckout.tsx"]) {
  const source = read(file);
  assert.match(source, /localizedHref\("\/login",/, file + " must localize the purchase-path login redirect");
  assert.match(source, /callbackUrl=/, file + " must preserve callbackUrl");
}

console.log(
  "i18n CTA checks passed: localizedHref query/hash handling, " +
    zhFiles.length +
    " zh sources scanned with " +
    zhSignupLinks +
    " /zh/signup links, " +
    zhLearnSignupLinks +
    " zh learn article links, zh/en SeoLandingPage anchors.",
);
