import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { localeFromPathname } from "../src/lib/i18n-routes";

// i18n app interior guard (Batch 6). The (app) subtree now renders in the
// language remembered in the NEXT_LOCALE cookie, resolved on the server, so the
// first paint is already Chinese. The public marketing/auth/share pages keep
// their URL-driven locale.

const root = process.cwd();
const read = (rel: string) => readFileSync(path.join(root, rel), "utf8");
const has = (rel: string) => existsSync(path.join(root, rel));

// 1. The (app) layout is a server component that reads and validates the cookie
//    and renders a nested provider around the client shell.
const APP_LAYOUT = "src/app/(app)/layout.tsx";
const APP_SHELL = "src/components/app/AppShell.tsx";
for (const file of [APP_LAYOUT, APP_SHELL]) {
  assert.ok(has(file), file + " must exist");
}
const layout = read(APP_LAYOUT);
assert.doesNotMatch(layout, /"use client"/, "the (app) layout must be a server component");
assert.match(layout, /from "next\/headers"/, "the (app) layout must read cookies from next/headers");
assert.match(layout, /cookies\(\)/, "the (app) layout must call cookies()");
assert.match(layout, /NEXT_LOCALE/, "the (app) layout must read the NEXT_LOCALE cookie");
assert.match(layout, /new Set\(\["en", "zh-CN"\]\)/, "the (app) layout must validate against the supported locales");
assert.match(layout, /NextIntlClientProvider/, "the (app) layout must wrap the subtree in NextIntlClientProvider");
assert.match(layout, /<AppShell locale=\{locale\}>/, "the (app) layout must pass the resolved locale to AppShell");
assert.doesNotMatch(layout, /useLocale/, "the server layout must not use the client useLocale hook");
assert.doesNotMatch(layout, /usePathname/, "the (app) locale must come from the cookie, not the URL");

const shell = read(APP_SHELL);
assert.match(shell, /"use client"/, "AppShell must stay a client component");
assert.match(shell, /useTranslations\(/, "AppShell must render from the catalog");
assert.match(shell, /authClient\.useSession/, "AppShell must keep the session check");
assert.match(shell, /router\.replace\("\/login"\)/, "AppShell must keep the redirect-when-unauthenticated behaviour");

// 2. Catalog parity and translation quality for the app namespaces.
type Catalog = Record<string, Record<string, string>>;
const en = JSON.parse(read("src/messages/en.json")) as Catalog;
const zh = JSON.parse(read("src/messages/zh-CN.json")) as Catalog;

const APP_NAMESPACES = ["nav", "dashboard", "editor", "export", "quota", "qualityAgent"] as const;

// Values that are legitimately identical in both languages. Kept tiny:
// - export.pdf / export.word / export.excel are document format / product names.
// - editor.logo is the loanword "Logo", consistent with editor.companyLogo and
//   editor.uploadLogo which already keep "Logo" in the Chinese catalog.
const NEUTRAL_APP_KEYS = new Set<string>([
  "export.pdf",
  "export.word",
  "export.excel",
  "editor.logo",
]);

function leafEntries(
  value: Record<string, unknown>,
  prefix = "",
): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  for (const [key, child] of Object.entries(value)) {
    const full = prefix ? prefix + "." + key : key;
    if (child && typeof child === "object" && !Array.isArray(child)) {
      out.push(...leafEntries(child as Record<string, unknown>, full));
    } else {
      out.push([full, String(child)]);
    }
  }
  return out;
}

let checkedPairs = 0;
for (const namespace of APP_NAMESPACES) {
  const enNs = en[namespace];
  const zhNs = zh[namespace];
  assert.ok(enNs && typeof enNs === "object", "en catalog must have a " + namespace + " namespace");
  assert.ok(zhNs && typeof zhNs === "object", "zh catalog must have a " + namespace + " namespace");
  const enLeaves = new Map(leafEntries(enNs));
  const zhLeaves = new Map(leafEntries(zhNs));
  assert.deepEqual(
    [...zhLeaves.keys()].sort(),
    [...enLeaves.keys()].sort(),
    "en and zh " + namespace + " keys must match exactly (including nested)",
  );
  for (const [relativeKey, enValue] of enLeaves) {
    const fullKey = namespace + "." + relativeKey;
    const zhValue = zhLeaves.get(relativeKey);
    assert.equal(typeof zhValue, "string", "zh " + fullKey + " must be a string");
    assert.ok((zhValue as string).trim().length > 0, "zh " + fullKey + " must not be empty");
    if (NEUTRAL_APP_KEYS.has(fullKey)) continue;
    assert.notEqual(zhValue, enValue, "zh " + fullKey + " must be translated");
    assert.match(zhValue as string, /[\u4e00-\u9fff]/, "zh " + fullKey + " must render Chinese");
    checkedPairs += 1;
  }
}

// 3. Security regression guard: the proxy protected paths and the admin server
//    guards must be byte-for-byte unchanged.
const proxy = read("src/proxy.ts");
assert.match(proxy, /const protectedPaths = \["\/dashboard", "\/reports"\]/, "proxy protectedPaths must be unchanged");
assert.match(proxy, /const SUPPORTED_LOCALES = new Set\(\["en", "zh-CN"\]\)/, "proxy supported locales must be unchanged");
for (const adminPage of [
  "src/app/(app)/admin/metrics/page.tsx",
  "src/app/(app)/admin/service-requests/page.tsx",
]) {
  const source = read(adminPage);
  assert.match(
    source,
    /if \(!user \|\| !isServiceAdmin\(user\.email\)\) notFound\(\);/,
    adminPage + " must keep the server-side service-admin guard before querying the DB",
  );
}

// 4. Marketing / auth / share locale resolution stays URL-driven and unchanged.
assert.equal(localeFromPathname("/zh/pricing"), "zh-CN", "/zh/pricing must resolve to Chinese from the URL");
assert.equal(localeFromPathname("/pricing"), "en", "/pricing must resolve to English from the URL");
assert.equal(localeFromPathname("/zh/share/token"), "zh-CN", "/zh/share must resolve to Chinese from the URL");
assert.ok(has("src/app/zh/pricing/page.tsx"), "the Chinese pricing page must still exist");
assert.ok(has("src/app/(marketing)/pricing/page.tsx"), "the English pricing page must still exist");
assert.ok(has("src/app/(marketing)/layout.tsx"), "the marketing layout must still exist");

const provider = read("src/components/LocaleProvider.tsx");
assert.match(provider, /usePathname/, "the public LocaleProvider must keep resolving from the URL");
assert.match(
  provider,
  /pathname === "\/zh" \|\| pathname\.startsWith\("\/zh\/"\)/,
  "the public LocaleProvider URL rule must be unchanged",
);
assert.match(read("src/proxy.ts"), /"\/dashboard", "\/reports"/, "the proxy protected paths must stay URL-based");

console.log(
  "i18n app checks passed: server (app) layout + client shell, " +
    APP_NAMESPACES.length +
    " app namespaces, " +
    checkedPairs +
    " translated zh values, " +
    NEUTRAL_APP_KEYS.size +
    " neutral allowlist keys, proxy/admin guards unchanged, URL locale rule intact.",
);
