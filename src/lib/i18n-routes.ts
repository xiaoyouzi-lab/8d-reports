// Central registry for routes that have a Simplified Chinese version.
//
// The language switcher, the marketing header/footer, and the sitemap all use
// this map so an English URL is only ever swapped for a /zh URL when that page
// actually exists. Everything else keeps its URL (and English content) and only
// records the NEXT_LOCALE preference.

export const ZH_ROUTE_MAP: Record<string, string> = {
  "/": "/zh",
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

export function isZhPath(pathname: string): boolean {
  return pathname === "/zh" || pathname.startsWith("/zh/");
}

export function zhPathFor(pathname: string): string | undefined {
  return ZH_ROUTE_MAP[pathname];
}

export function enPathFor(zhPath: string): string | undefined {
  return EN_BY_ZH[zhPath];
}

export function hasZhVersion(pathname: string): boolean {
  return Boolean(ZH_ROUTE_MAP[pathname]);
}

// Map a shared (English) href to its Chinese equivalent when one exists.
// Hash fragments such as "/#workflow" are preserved.
export function localizedHref(href: string, locale: string): string {
  if (locale !== "zh-CN") return href;
  const [path, hash] = href.split("#");
  const zhPath = ZH_ROUTE_MAP[path] ?? path;
  return hash ? `${zhPath}#${hash}` : zhPath;
}
