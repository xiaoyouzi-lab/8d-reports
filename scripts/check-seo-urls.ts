import fs from "node:fs";
import path from "node:path";
import sitemap from "../src/app/sitemap";
import robots from "../src/app/robots";
import { seoPages as legacySeoPages } from "../src/lib/seo-pages";
import { seoPages as programmaticSeoPages } from "../src/content/seo-pages";
import { INDEXABLE_STATIC_PATHS, LEGACY_SEO_REDIRECTS, SITE_URL } from "../src/lib/seo-index-hygiene";

const requiredGscExamplePaths = [
  "/8d-report-example/automotive",
  "/8d-report-example/semiconductor",
  "/8d-report-example/electronics",
  "/8d-report-example/medical-device",
  "/8d-report-example/supplier-quality",
  "/8d-report-example/customer-complaint",
  "/8d-report-example/led-failure",
  "/8d-report-example/packaging-defect",
  "/8d-report-example/plastic-injection-molding",
  "/8d-report-example/machining-defect",
  "/8d-report-example/battery-pack",
  "/8d-report-example/aerospace",
];

const demoReportPaths = ["/demo-reports/automotive", "/demo-reports/molding", "/demo-reports/electronics"];

function fail(message: string): never {
  console.error(`SEO check failed: ${message}`);
  process.exit(1);
}

function routePathFromPage(filePath: string) {
  const relative = path.relative(path.join(process.cwd(), "src/app"), filePath);
  const parts = relative.split(path.sep).slice(0, -1);
  const publicParts = parts.filter((part) => !part.startsWith("(") && !part.endsWith(")"));
  return `/${publicParts.join("/")}`.replace(/\/$/, "") || "/";
}

function collectStaticPagePaths() {
  const pagePaths: string[] = [];

  function walk(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.name === "page.tsx") {
        const routePath = routePathFromPage(fullPath);
        if (!routePath.includes("[")) pagePaths.push(routePath);
      }
    }
  }

  walk(path.join(process.cwd(), "src/app"));
  return new Set(pagePaths);
}

function normalizePath(url: string) {
  const parsed = new URL(url);
  return parsed.pathname === "" ? "/" : parsed.pathname;
}

function getRobotsDisallowPrefixes() {
  const config = robots();
  const rules = Array.isArray(config.rules) ? config.rules : [config.rules];
  return rules.flatMap((rule) => {
    const disallow = rule.disallow;
    if (!disallow) return [];
    return Array.isArray(disallow) ? disallow : [disallow];
  });
}

function isRobotsBlocked(pathname: string, disallowPrefixes: string[]) {
  return disallowPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(prefix));
}

function assertNoMarketingApiLinksWithoutNofollow() {
  const marketingRoot = path.join(process.cwd(), "src/app/(marketing)");
  const files: string[] = [];

  function walk(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(fullPath);
      else if (entry.name.endsWith(".tsx")) files.push(fullPath);
    }
  }

  walk(marketingRoot);
  for (const file of files) {
    const lines = fs.readFileSync(file, "utf8").split("\n");
    lines.forEach((line, index) => {
      if (!line.includes("/api/sample-reports")) return;
      const nearby = lines.slice(index, index + 4).join(" ");
      if (!nearby.includes("rel=\"nofollow\"")) {
        fail(`${path.relative(process.cwd(), file)} links to /api/sample-reports without rel=\"nofollow\"`);
      }
    });
  }
}

const staticPagePaths = collectStaticPagePaths();
const contentPaths = new Set([
  ...INDEXABLE_STATIC_PATHS,
  ...legacySeoPages.map((page) => `/${page.slug}`),
  ...programmaticSeoPages.map((page) => `/${page.slug}`),
  ...demoReportPaths,
]);

const existingPaths = new Set([...staticPagePaths, ...contentPaths]);
const redirectSources = new Set<string>(LEGACY_SEO_REDIRECTS.map((redirect) => redirect.source));
const disallowPrefixes = getRobotsDisallowPrefixes();

for (const pathName of requiredGscExamplePaths) {
  if (!existingPaths.has(pathName)) fail(`required GSC example path is missing: ${pathName}`);
}

for (const entry of sitemap()) {
  const pathName = normalizePath(entry.url);
  if (!entry.url.startsWith(SITE_URL)) fail(`sitemap URL is not canonical www HTTPS: ${entry.url}`);
  if (!existingPaths.has(pathName)) fail(`sitemap URL has no matching route/content: ${pathName}`);
  if (isRobotsBlocked(pathName, disallowPrefixes)) fail(`sitemap URL is blocked by robots.txt: ${pathName}`);
  if (redirectSources.has(pathName)) fail(`sitemap URL is a redirect source, not final canonical URL: ${pathName}`);
}

for (const redirect of LEGACY_SEO_REDIRECTS) {
  const source = redirect.source as string;
  const destination = redirect.destination as string;

  if (source === destination) fail(`redirect loop detected for ${source}`);
  if (redirectSources.has(destination)) fail(`redirect chain detected: ${source} -> ${destination}`);
  if (!destination.includes(":") && !existingPaths.has(destination)) {
    fail(`redirect destination does not exist: ${source} -> ${destination}`);
  }
  if (isRobotsBlocked(destination.split("/:")[0], disallowPrefixes)) {
    fail(`redirect destination is blocked by robots.txt: ${source} -> ${destination}`);
  }
}

assertNoMarketingApiLinksWithoutNofollow();

console.log(`SEO URL check passed: ${sitemap().length} sitemap URLs, ${LEGACY_SEO_REDIRECTS.length} redirects.`);
