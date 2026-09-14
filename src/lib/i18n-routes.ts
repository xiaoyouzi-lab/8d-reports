// Central registry for routes that have a Simplified Chinese version.
//
// The language switcher, the marketing header/footer, and the sitemap all use
// this map so an English URL is only ever swapped for a /zh URL when that page
// actually exists. Everything else keeps its URL (and English content) and only
// records the NEXT_LOCALE preference.

export const ZH_ROUTE_MAP: Record<string, string> = {
  "/": "/zh",
  "/resources": "/zh/resources",
  "/pricing": "/zh/pricing",
  "/sample-report": "/zh/sample-report",
  "/ai-8d-report-check": "/zh/ai-8d-report-check",
  "/faq": "/zh/faq",
  "/security": "/zh/security",
  "/contact": "/zh/contact",
};

const EN_BY_ZH: Record<string, string> = Object.fromEntries(
  Object.entries(ZH_ROUTE_MAP).map(([enPath, zhPath]) => [zhPath, enPath]),
);

export const ZH_PATHS: string[] = Object.values(ZH_ROUTE_MAP);

export const EN_CORE_PATHS: string[] = Object.keys(ZH_ROUTE_MAP);

// Dynamic zh routes cannot live in ZH_ROUTE_MAP (one entry maps one exact
// English URL to one exact zh URL). The /resources/* collection is registered
// here instead: an English path maps to /zh/resources/<slug> only when that
// slug has a translation, so the switcher never navigates to a missing page.
//
// This list is kept dependency-free on purpose (i18n-routes is bundled into
// client components). scripts/i18n-resources.test.ts asserts it matches the
// slugs exported by src/content/revenue-geo-resources-zh.ts and the English
// source of truth.
export const ZH_RESOURCE_SLUGS = [
  "how-to-write-8d-report-customer-complaint",
  "supplier-corrective-action-request-template",
  "8d-vs-scar",
  "excel-8d-template-vs-8d-software",
  "custom-8d-template-setup-guide",
  "ai-8d-report-checker",
  "8d-root-cause-d4-guide",
  "8d-corrective-action-d5-guide",
  "8d-validation-d6-guide",
  "8d-lessons-learned-d8-guide",
] as const;

type ZhDynamicCollection = {
  enPrefix: string;
  zhPrefix: string;
  slugs: readonly string[];
};

export const ZH_DYNAMIC_COLLECTIONS: readonly ZhDynamicCollection[] = [
  {
    enPrefix: "/resources",
    zhPrefix: "/zh/resources",
    slugs: ZH_RESOURCE_SLUGS,
  },
];

function matchDynamicZh(enPath: string): string | undefined {
  for (const collection of ZH_DYNAMIC_COLLECTIONS) {
    const prefix = `${collection.enPrefix}/`;
    if (!enPath.startsWith(prefix)) continue;
    const slug = enPath.slice(prefix.length);
    if (collection.slugs.includes(slug)) {
      return `${collection.zhPrefix}/${slug}`;
    }
  }
  return undefined;
}

function matchDynamicEn(zhPath: string): string | undefined {
  for (const collection of ZH_DYNAMIC_COLLECTIONS) {
    const prefix = `${collection.zhPrefix}/`;
    if (!zhPath.startsWith(prefix)) continue;
    const slug = zhPath.slice(prefix.length);
    if (collection.slugs.includes(slug)) {
      return `${collection.enPrefix}/${slug}`;
    }
  }
  return undefined;
}

export function isZhPath(pathname: string): boolean {
  return pathname === "/zh" || pathname.startsWith("/zh/");
}

export function zhPathFor(pathname: string): string | undefined {
  return ZH_ROUTE_MAP[pathname] ?? matchDynamicZh(pathname);
}

export function enPathFor(zhPath: string): string | undefined {
  return EN_BY_ZH[zhPath] ?? matchDynamicEn(zhPath);
}

export function hasZhVersion(pathname: string): boolean {
  return Boolean(zhPathFor(pathname));
}

// Map a shared (English) href to its Chinese equivalent when one exists.
// Hash fragments such as "/#workflow" are preserved.
export function localizedHref(href: string, locale: string): string {
  if (locale !== "zh-CN") return href;
  const [path, hash] = href.split("#");
  const zhPath = zhPathFor(path) ?? path;
  return hash ? `${zhPath}#${hash}` : zhPath;
}
