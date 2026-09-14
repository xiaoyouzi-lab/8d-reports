import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import sitemap from "../src/app/sitemap";
import {
  ZH_PRIVATE_PATHS,
  ZH_PRIVATE_ROUTE_MAP,
  ZH_ROUTE_MAP,
  enPathFor,
  zhPathFor,
} from "../src/lib/i18n-routes";

// i18n auth guard (Batch 5a). The login, signup, and reset-password pages now
// render from the shared "auth" catalog and have /zh URLs. This test verifies
// that the routes exist, the switcher resolves both directions, the catalogs
// stay in sync, the zh copy is actually Chinese, and none of these private
// pages leak into the sitemap.

const root = process.cwd();
const read = (rel: string) => readFileSync(path.join(root, rel), "utf8");
const has = (rel: string) => existsSync(path.join(root, rel));

const AUTH_ROUTES = [
  { en: "/login", zh: "/zh/login", enFile: "src/app/(auth)/login/page.tsx", zhFile: "src/app/(auth)/zh/login/page.tsx" },
  { en: "/signup", zh: "/zh/signup", enFile: "src/app/(auth)/signup/page.tsx", zhFile: "src/app/(auth)/zh/signup/page.tsx" },
  { en: "/reset-password", zh: "/zh/reset-password", enFile: "src/app/reset-password/page.tsx", zhFile: "src/app/(auth)/zh/reset-password/page.tsx" },
] as const;

const FORM_FILES = [
  "src/app/(auth)/login/login-form.tsx",
  "src/app/(auth)/signup/signup-form.tsx",
  "src/app/reset-password/reset-password-form.tsx",
] as const;

// 1. The three zh routes exist alongside the English pages.
for (const route of AUTH_ROUTES) {
  assert.ok(has(route.zhFile), route.zhFile + " must exist");
  assert.ok(has(route.enFile), route.enFile + " must exist");
}

// 2. The route map resolves both directions.
for (const route of AUTH_ROUTES) {
  assert.equal(ZH_PRIVATE_ROUTE_MAP[route.en], route.zh, route.en + " must be a private zh route");
  assert.equal(ZH_ROUTE_MAP[route.en], route.zh, "ZH_ROUTE_MAP must map " + route.en + " -> " + route.zh);
  assert.equal(zhPathFor(route.en), route.zh, route.en + " must localize");
  assert.equal(enPathFor(route.zh), route.en, route.zh + " must map back");
}
assert.deepEqual(
  [...ZH_PRIVATE_PATHS].sort(),
  AUTH_ROUTES.map((route) => route.zh).sort(),
  "the private zh path set must match the three auth routes",
);

// 3. Private auth routes must never appear in the sitemap.
const sitemapPaths = sitemap().map((entry) => new URL(entry.url).pathname);
for (const route of AUTH_ROUTES) {
  for (const routePath of [route.en, route.zh]) {
    assert.equal(
      sitemapPaths.includes(routePath),
      false,
      "sitemap must not list private auth route " + routePath,
    );
  }
}

// 4. The (auth) layout keeps the zh pages noindex.
const authLayout = read("src/app/(auth)/layout.tsx");
assert.match(authLayout, /index:\s*false/, "the (auth) layout must be noindex");
for (const route of AUTH_ROUTES) {
  assert.ok(route.zhFile.startsWith("src/app/(auth)/"), route.zhFile + " must live under the (auth) route group");
}

// 5. Catalog parity: identical auth key sets in both catalogs.
const enAuth = (JSON.parse(read("src/messages/en.json")) as { auth: Record<string, string> }).auth;
const zhAuth = (JSON.parse(read("src/messages/zh-CN.json")) as { auth: Record<string, string> }).auth;
assert.ok(enAuth && typeof enAuth === "object", "en catalog must have an auth namespace");
assert.ok(zhAuth && typeof zhAuth === "object", "zh catalog must have an auth namespace");
assert.deepEqual(Object.keys(zhAuth).sort(), Object.keys(enAuth).sort(), "en and zh auth keys must match exactly");

// 6. The forms render their copy through the catalog, and the zh values are Chinese.
const usedKeys = new Set<string>();
for (const file of FORM_FILES) {
  const source = read(file);
  assert.match(source, /useTranslations\("auth"\)/, file + " must use the auth catalog");
  for (const match of source.matchAll(/\bt\("([^"]+)"/g)) {
    usedKeys.add(match[1]);
  }
}
assert.ok(usedKeys.size >= 30, "the auth forms should consume the shared catalog, found " + usedKeys.size);

// Values that are intentionally language neutral (masks, digits, and an email example).
const NEUTRAL_KEYS = new Set(["emailPlaceholder", "confirmPlaceholder", "passwordMask", "codePlaceholder"]);
for (const key of usedKeys) {
  assert.ok(key in enAuth, "en auth must define " + key);
  assert.ok(key in zhAuth, "zh auth must define " + key);
  assert.equal(typeof zhAuth[key], "string", "zh auth." + key + " must be a string");
  assert.ok(zhAuth[key].trim().length > 0, "zh auth." + key + " must not be empty");
  if (!NEUTRAL_KEYS.has(key)) {
    assert.notEqual(zhAuth[key], enAuth[key], "zh auth." + key + " must be translated");
    assert.match(zhAuth[key], /[\u4e00-\u9fff]/, "zh auth." + key + " must render Chinese");
  }
}

// 7. The visible English copy was moved into the catalog, not left hardcoded.
const hardcoded = ["Welcome back", "Sign in to your 8D Reports account", "Forgot password?", "Create an account", "Verify your email", "Reset Password"];
for (const file of FORM_FILES) {
  const source = read(file);
  for (const phrase of hardcoded) {
    assert.equal(source.includes('"' + phrase + '"'), false, file + ' must not hardcode "' + phrase + '"');
  }
}

// 8. The zh pages reuse the shared forms instead of forking them.
assert.match(read("src/app/(auth)/zh/login/page.tsx"), /login\/login-form/, "zh login must reuse the English login form");
assert.match(read("src/app/(auth)/zh/signup/page.tsx"), /signup\/signup-form/, "zh signup must reuse the English signup form");
assert.match(read("src/app/(auth)/zh/reset-password/page.tsx"), /reset-password-form/, "zh reset must reuse the shared reset form");

console.log(
  "i18n auth checks passed: " + AUTH_ROUTES.length + " zh auth routes, " + usedKeys.size + " auth keys x2 catalogs, sitemap excludes private auth routes.",
);
