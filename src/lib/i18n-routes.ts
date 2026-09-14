// Central registry for routes that have a Simplified Chinese version.
//
// The language switcher, the marketing header/footer, and the sitemap all use
// this map so an English URL is only ever swapped for a /zh URL when that page
// actually exists. Everything else keeps its URL (and English content) and only
// records the NEXT_LOCALE preference.

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
