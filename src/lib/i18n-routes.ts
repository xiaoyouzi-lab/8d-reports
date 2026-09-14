// Central registry for routes that have a Simplified Chinese version.
//
// The language switcher, the marketing header/footer, and the sitemap all use
// this map so an English URL is only ever swapped for a /zh URL when that page
// actually exists. Everything else keeps its URL (and English content) and only
// records the NEXT_LOCALE preference.

// Private auth routes also have a Chinese URL so the language switcher can move
// between /login and /zh/login. Unlike the public routes below they are noindex
// utility pages: they must stay out of the sitemap and must never be treated as
// a canonical/hreflang pair.
export const ZH_PRIVATE_ROUTE_MAP: Record<string, string> = {
  "/login": "/zh/login",
  "/signup": "/zh/signup",
  "/reset-password": "/zh/reset-password",
};

export const ZH_PRIVATE_EN_PATHS: ReadonlySet<string> = new Set(
  Object.keys(ZH_PRIVATE_ROUTE_MAP),
);

export const ZH_PRIVATE_PATHS: ReadonlySet<string> = new Set(
  Object.values(ZH_PRIVATE_ROUTE_MAP),
);

export const ZH_ROUTE_MAP: Record<string, string> = {
  "/": "/zh",
  "/resources": "/zh/resources",
  "/learn": "/zh/learn",
  "/help": "/zh/help",
  "/docs": "/zh/docs",
  "/pricing": "/zh/pricing",
  "/sample-report": "/zh/sample-report",
  "/ai-8d-report-check": "/zh/ai-8d-report-check",
  "/faq": "/zh/faq",
  "/security": "/zh/security",
  "/contact": "/zh/contact",
  // Batch 4: remaining English-only public pages.
  "/privacy": "/zh/privacy",
  "/terms": "/zh/terms",
  "/8d-report-template": "/zh/8d-report-template",
  "/8d-report-example": "/zh/8d-report-example",
  "/supplier-8d-report": "/zh/supplier-8d-report",
  "/corrective-action-report-template": "/zh/corrective-action-report-template",
  "/5-why-root-cause-template": "/zh/5-why-root-cause-template",
  "/demo-reports": "/zh/demo-reports",
  ...ZH_PRIVATE_ROUTE_MAP,
};

const EN_BY_ZH: Record<string, string> = Object.fromEntries(
  Object.entries(ZH_ROUTE_MAP).map(([enPath, zhPath]) => [zhPath, enPath]),
);

export const ZH_PATHS: string[] = Object.values(ZH_ROUTE_MAP);

export const EN_CORE_PATHS: string[] = Object.keys(ZH_ROUTE_MAP);

// Dynamic zh routes cannot live in ZH_ROUTE_MAP (one entry maps one exact
// English URL to one exact zh URL). The /resources/*, /learn/*, /help/*, and
// /docs/* collections are registered here instead: an English path maps to its zh
// counterpart only when that slug has a translation, so the switcher never
// navigates to a missing page.
//
// These lists are kept dependency-free on purpose (i18n-routes is bundled into
// client components). scripts/i18n-resources.test.ts,
// scripts/i18n-learn-help.test.ts, and scripts/i18n-docs.test.ts assert they
// match the translated content and the English source of truth.
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

export const ZH_LEARN_SLUGS = [
  "what-is-8d-reports",
  "how-to-write-an-8d-report-customers-will-accept",
  "8d-report-vs-scar",
  "why-not-manage-8d-reports-in-excel",
  "how-ai-helps-draft-but-not-approve-8d-reports",
  "how-supplier-quality-teams-handle-customer-complaints-faster",
  "how-team-review-approval-locking-and-revision-history-work",
  "how-to-export-professional-8d-reports-in-pdf-word-and-excel",
] as const;

export const ZH_DOCS_SLUGS = [
  "getting-started",
  "create-report",
  "edit-d0-d8",
  "attachments",
  "export-and-zip",
  "sharing",
  "team-workflow",
  "plans-and-billing",
  "security-and-data",
  "ai-quality-check",
] as const;

export const ZH_HELP_SLUGS = [
  "5-why",
  "ai-draft",
  "ai-quality-check",
  "containment-action",
  "corrective-action",
  "create-new-report",
  "d0-d8-editor",
  "dashboard",
  "evidence-attachments",
  "export-pdf-word-excel-zip",
  "fishbone",
  "lock-unlock-revision",
  "permissions",
  "preventive-action",
  "pricing-usage-limits",
  "review-workflow",
  "root-cause",
  "share-link",
  "team-workspace",
  "troubleshooting",
] as const;

// Programmatic SEO collections (Batch 3). The English source of truth is
// src/content/seo-pages.ts and the Chinese mirror is src/content/seo-pages-zh.ts.
// scripts/i18n-seo.test.ts asserts these lists match the generated pages.
export const ZH_SEO_EXAMPLE_SLUGS = [
  "automotive",
  "semiconductor",
  "electronics",
  "medical-device",
  "supplier-quality",
  "customer-complaint",
  "led-failure",
  "packaging-defect",
  "plastic-injection-molding",
  "machining-defect",
  "battery-pack",
  "aerospace",
] as const;

export const ZH_SEO_TEMPLATE_SLUGS = [
  "automotive",
  "supplier",
  "manufacturing",
  "pdf",
  "word",
  "excel",
  "medical-device",
  "semiconductor",
  "battery",
  "aerospace",
] as const;

export const ZH_SEO_FIVE_WHY_SLUGS = [
  "customer-complaint",
  "supplier-defect",
  "late-delivery",
  "assembly-defect",
  "led-failure",
  "semiconductor-defect",
  "injection-molding-short-shot",
  "machining-tolerance",
  "weld-strength",
  "packaging-seal",
] as const;

export const ZH_SEO_FISHBONE_SLUGS = [
  "manufacturing-defect",
  "customer-complaint",
  "supplier-quality",
  "process-failure",
  "electronics-assembly",
  "packaging-seal-failure",
] as const;

export const ZH_SEO_CORRECTIVE_SLUGS = [
  "supplier-defect",
  "customer-complaint",
  "assembly-defect",
  "machining-defect",
  "labeling-error",
  "battery-weld-failure",
] as const;

export const ZH_SEO_PREVENTIVE_SLUGS = [
  "manufacturing",
  "quality-system",
  "supplier-quality",
  "electronics-assembly",
  "medical-device",
  "aerospace-documentation",
] as const;

// Workflow demo reports (Batch 4). The English source of truth is
// src/lib/demo-reports.ts and the Chinese mirror is src/lib/demo-reports-zh.ts.
export const ZH_DEMO_REPORT_SLUGS = [
  "automotive",
  "molding",
  "electronics",
] as const;

type ZhDynamicCollection = {
  enPrefix: string;
  zhPrefix: string;
  slugs: readonly string[];
  // Dynamic segment name used by the route folder (defaults to "slug").
  param?: string;
};

export const ZH_DYNAMIC_COLLECTIONS: readonly ZhDynamicCollection[] = [
  {
    enPrefix: "/resources",
    zhPrefix: "/zh/resources",
    slugs: ZH_RESOURCE_SLUGS,
  },
  {
    enPrefix: "/learn",
    zhPrefix: "/zh/learn",
    slugs: ZH_LEARN_SLUGS,
  },
  {
    enPrefix: "/help",
    zhPrefix: "/zh/help",
    slugs: ZH_HELP_SLUGS,
  },
  {
    enPrefix: "/docs",
    zhPrefix: "/zh/docs",
    slugs: ZH_DOCS_SLUGS,
  },
  {
    enPrefix: "/8d-report-example",
    zhPrefix: "/zh/8d-report-example",
    slugs: ZH_SEO_EXAMPLE_SLUGS,
  },
  {
    enPrefix: "/8d-report-template",
    zhPrefix: "/zh/8d-report-template",
    slugs: ZH_SEO_TEMPLATE_SLUGS,
  },
  {
    enPrefix: "/5-why-example",
    zhPrefix: "/zh/5-why-example",
    slugs: ZH_SEO_FIVE_WHY_SLUGS,
  },
  {
    enPrefix: "/fishbone-diagram-example",
    zhPrefix: "/zh/fishbone-diagram-example",
    slugs: ZH_SEO_FISHBONE_SLUGS,
  },
  {
    enPrefix: "/corrective-action-example",
    zhPrefix: "/zh/corrective-action-example",
    slugs: ZH_SEO_CORRECTIVE_SLUGS,
  },
  {
    enPrefix: "/preventive-action-example",
    zhPrefix: "/zh/preventive-action-example",
    slugs: ZH_SEO_PREVENTIVE_SLUGS,
  },
  {
    enPrefix: "/demo-reports",
    zhPrefix: "/zh/demo-reports",
    slugs: ZH_DEMO_REPORT_SLUGS,
    param: "type",
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

export type AppLocale = "en" | "zh-CN";

// Resolve the active locale from the URL, mirroring components/LocaleProvider.tsx:
// /zh/* renders Chinese and every other route renders English until a Chinese
// version exists there. Client components use this instead of next-intl's
// useLocale so link localization keeps working when a component is rendered
// outside the intl provider (e.g. the unit-test harness) and never depends on
// cookie state.
export function localeFromPathname(
  pathname: string | null | undefined,
): AppLocale {
  return pathname && isZhPath(pathname) ? "zh-CN" : "en";
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
// Only the path is localized: an optional "?query" and "#hash" are split off
// first and re-appended intact, in that order, so signed query strings such as
// "/signup?intent=create-report&source=seo&slug=x" survive the swap. External
// URLs, "mailto:" links, and paths without a zh version are returned unchanged
// (byte for byte), and non-zh locales are always a no-op.
export function localizedHref(href: string, locale: string): string {
  if (locale !== "zh-CN") return href;

  const hashIndex = href.indexOf("#");
  const hash = hashIndex === -1 ? "" : href.slice(hashIndex);
  const withoutHash = hashIndex === -1 ? href : href.slice(0, hashIndex);

  const queryIndex = withoutHash.indexOf("?");
  const query = queryIndex === -1 ? "" : withoutHash.slice(queryIndex);
  const path = queryIndex === -1 ? withoutHash : withoutHash.slice(0, queryIndex);

  return `${zhPathFor(path) ?? path}${query}${hash}`;
}
