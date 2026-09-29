import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  APP_ROUTE_PREFIXES,
  resolveServerLocale,
  type ServerLocale,
} from "../src/lib/server-locale";

// Batch 9 guard for the standard server-side next-intl locale rule. The rule was
// only previously established in the URL-driven public provider and the
// cookie-driven (app) interior; src/i18n/request.ts pinned the locale to English,
// so the next server component to call getTranslations()/getLocale() would have
// silently rendered English. These checks pin the one shared rule:
//   1. /zh or /zh/* always wins (public URL rule),
//   2. an authenticated app route follows a validated NEXT_LOCALE cookie,
//   3. everything else is English.

const root = process.cwd();
const read = (rel: string) => readFileSync(path.join(root, rel), "utf8");

let checks = 0;
function expectLocale(
  pathname: string | null | undefined,
  cookie: string | null | undefined,
  expected: ServerLocale,
) {
  checks += 1;
  assert.equal(
    resolveServerLocale(pathname, cookie),
    expected,
    `resolveServerLocale(${JSON.stringify(pathname)}, ${JSON.stringify(cookie)}) must be ${expected}`,
  );
}

// 1. The public URL rule (/zh or /zh/*) always beats the cookie, including a
//    cookie that explicitly asks for English or is absent.
for (const pathname of ["/zh", "/zh/", "/zh/pricing", "/zh/share/x", "/zh/help/y"]) {
  for (const cookie of ["en", "zh-CN", undefined, null, "", "fr"]) {
    expectLocale(pathname, cookie, "zh-CN");
  }
}

// 2. The app prefixes come from the single exported list, so a prefix added
//    there is automatically covered here.
for (const prefix of APP_ROUTE_PREFIXES) {
  for (const pathname of [prefix, prefix + "/anything", prefix + "/deep/nested"]) {
    expectLocale(pathname, "zh-CN", "zh-CN");
    expectLocale(pathname, "en", "en");
    expectLocale(pathname, undefined, "en");
    expectLocale(pathname, null, "en");
    expectLocale(pathname, "", "en");
    // Unsupported or near-miss cookie values never leak through.
    expectLocale(pathname, "fr", "en");
    expectLocale(pathname, "zh", "en");
    expectLocale(pathname, "zh-cn", "en");
    expectLocale(pathname, "ZH-CN", "en");
    expectLocale(pathname, " zh-CN ", "en");
  }
}

// The exact app-route examples from the task.
for (const pathname of [
  "/dashboard",
  "/dashboard/anything",
  "/reports/new",
  "/reports/abc",
  "/knowledge",
  "/admin/metrics",
]) {
  expectLocale(pathname, "zh-CN", "zh-CN");
  expectLocale(pathname, "en", "en");
  expectLocale(pathname, undefined, "en");
  expectLocale(pathname, "invalid", "en");
}

// The four required prefixes must stay in the exported list so the request
// config and the (app) cookie rule cannot drift apart.
for (const required of ["/dashboard", "/reports", "/knowledge", "/admin"]) {
  assert.ok(
    (APP_ROUTE_PREFIXES as readonly string[]).includes(required),
    `APP_ROUTE_PREFIXES must include ${required}`,
  );
}

// 3. Public English pages must ignore a zh-CN cookie.
for (const pathname of ["/pricing", "/signup", "/share/x", "/help/x", "/"]) {
  expectLocale(pathname, "zh-CN", "en");
  expectLocale(pathname, "en", "en");
  expectLocale(pathname, undefined, "en");
}

// Missing / empty pathname falls back to English even with a zh-CN cookie.
expectLocale(null, "zh-CN", "en");
expectLocale(undefined, "zh-CN", "en");
expectLocale("", "zh-CN", "en");

// App prefixes match whole path segments only.
for (const pathname of [
  "/dashboardx",
  "/reportsx",
  "/knowledgebase",
  "/adminx",
  "/zhx",
  "/pricing/zh",
  "/prefix/dashboard",
]) {
  expectLocale(pathname, "zh-CN", "en");
}

// 4. Source wiring: the request config must use the shared resolver and must no
//    longer hardcode English, and the proxy must forward the pathname.
const requestSource = read("src/i18n/request.ts");
assert.match(
  requestSource,
  /from "@\/lib\/server-locale"|from "\.\.\/lib\/server-locale"/,
  "src/i18n/request.ts must import the shared resolver",
);
assert.match(requestSource, /resolveServerLocale\(/, "src/i18n/request.ts must call the resolver");
assert.doesNotMatch(
  requestSource,
  /locale:\s*["']en["']/,
  'src/i18n/request.ts must not hardcode locale: "en"',
);
assert.match(requestSource, /x-pathname/, "src/i18n/request.ts must read the x-pathname header");
assert.match(requestSource, /NEXT_LOCALE/, "src/i18n/request.ts must read the NEXT_LOCALE cookie");
assert.match(requestSource, /\bheaders\(\)/, "src/i18n/request.ts must read request headers");
assert.match(requestSource, /\bcookies\(\)/, "src/i18n/request.ts must read request cookies");
assert.match(
  requestSource,
  /timeZone:\s*"Asia\/Shanghai"/,
  "src/i18n/request.ts must keep timeZone Asia/Shanghai",
);
assert.match(requestSource, /zh-CN\.json/, "src/i18n/request.ts must be able to load the zh catalog");

const proxySource = read("src/proxy.ts");
assert.match(
  proxySource,
  /headers\.set\("x-pathname", pathname\)/,
  "src/proxy.ts must forward the request pathname as x-pathname",
);
assert.match(proxySource, /headers\.set\("x-locale", locale\)/, "src/proxy.ts must keep x-locale");
assert.match(
  proxySource,
  /const protectedPaths = \["\/dashboard", "\/reports"\]/,
  "src/proxy.ts protectedPaths must be unchanged",
);

console.log(
  `server-locale checks passed: ${checks} resolver assertions across ${APP_ROUTE_PREFIXES.length} app prefixes, request config wired, proxy x-pathname forwarded.`,
);
