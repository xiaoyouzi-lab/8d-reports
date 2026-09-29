import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { localeFromPathname } from "../src/lib/i18n-routes";
import { STEPS, type ReportField } from "../src/lib/report-steps";

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

// 5. Batch 8: the remaining user-visible English in the report definition is now
//    resolved from the catalogs at render time. src/lib/report-steps.ts stays
//    locale-agnostic; its English strings remain only as the fallback for
//    renderers without a catalog entry (PDF/Word/XLSX export and the share-viewer
//    body), so no 8D terminology is duplicated or invented in the catalog.
const FISHBONE_FIELDS = [
  "fishboneMan",
  "fishboneMachine",
  "fishboneMaterial",
  "fishboneMethod",
  "fishboneMeasurement",
  "fishboneEnvironment",
] as const;

const d4 = STEPS.find((step) => step.id === "D4");
assert.ok(d4, "STEPS must contain D4 so the fishbone fields can be checked");

const enEditor = en.editor;
const zhEditor = zh.editor;
assert.ok(enEditor && typeof enEditor === "object", "en catalog must have an editor namespace");
assert.ok(zhEditor && typeof zhEditor === "object", "zh catalog must have an editor namespace");

for (const name of FISHBONE_FIELDS) {
  const field: ReportField | undefined = d4.fields.find((candidate) => candidate.name === name);
  assert.ok(field, "D4 must define the fishbone field " + name);

  const enLabel = enEditor[name];
  const zhLabel = zhEditor[name];
  assert.equal(
    enLabel,
    field.label,
    "en editor." + name + " must stay byte-identical to the report-steps label",
  );
  assert.ok(zhLabel && zhLabel.trim().length > 0, "zh editor." + name + " must not be empty");
  assert.notEqual(zhLabel, enLabel, "zh editor." + name + " must be translated");
  assert.match(zhLabel, /[\u4e00-\u9fff]/, "zh editor." + name + " must render Chinese");

  const enPlaceholder = enEditor[name + "Placeholder"];
  const zhPlaceholder = zhEditor[name + "Placeholder"];
  assert.equal(
    enPlaceholder,
    field.placeholder,
    "en editor." + name + "Placeholder must stay byte-identical to the report-steps placeholder",
  );
  assert.ok(
    zhPlaceholder && zhPlaceholder.trim().length > 0,
    "zh editor." + name + "Placeholder must not be empty",
  );
  assert.notEqual(
    zhPlaceholder,
    enPlaceholder,
    "zh editor." + name + "Placeholder must be translated",
  );
  assert.match(
    zhPlaceholder,
    /[\u4e00-\u9fff]/,
    "zh editor." + name + "Placeholder must render Chinese",
  );
}

// The nine D-step descriptions live next to the already-translated step names.
// The English values must stay byte-identical to the report definition and the
// Chinese values must reuse the established D-step terminology.
const enStepDocs = (en.docs as unknown as { step: Record<string, Record<string, string>> }).step;
const zhStepDocs = (zh.docs as unknown as { step: Record<string, Record<string, string>> }).step;
assert.deepEqual(
  Object.keys(enStepDocs).sort(),
  Object.keys(zhStepDocs).sort(),
  "en and zh docs.step must cover the same steps",
);
for (const step of STEPS) {
  const enStep = enStepDocs[step.id];
  const zhStep = zhStepDocs[step.id];
  assert.ok(enStep, "en docs.step." + step.id + " must exist");
  assert.ok(zhStep, "zh docs.step." + step.id + " must exist");
  assert.equal(
    enStep.name,
    step.label,
    "en docs.step." + step.id + ".name must stay byte-identical to the STEPS label",
  );
  assert.equal(
    enStep.description,
    step.description,
    "en docs.step." + step.id + ".description must stay byte-identical to the STEPS description",
  );
  assert.ok(
    zhStep.description && zhStep.description.trim().length > 0,
    "zh docs.step." + step.id + ".description must not be empty",
  );
  assert.notEqual(
    zhStep.description,
    enStep.description,
    "zh docs.step." + step.id + ".description must be translated",
  );
  assert.match(
    zhStep.description,
    /[\u4e00-\u9fff]/,
    "zh docs.step." + step.id + ".description must render Chinese",
  );
}

// The renderer must consume the catalog instead of the raw English literal.
const stepForm = read("src/components/report/StepForm.tsx");
assert.match(
  stepForm,
  /tStep\(`\$\{step\.id\}\.description`\)/,
  "StepForm must render the localized docs.step.<D>.description",
);
assert.doesNotMatch(
  stepForm,
  /\{step\.description\}/,
  "StepForm must not render the raw English step.description",
);
assert.match(
  stepForm,
  /fieldPlaceholder/,
  "StepForm must resolve fishbone placeholders through the editor catalog",
);
assert.match(
  stepForm,
  /t\.has\(field\.name\)/,
  "StepForm must keep preferring a catalog label for report fields",
);

// The desktop step sidebar must resolve titles from the same
// docs.step.<D>.name keys as the editor and the share viewer; rendering the raw
// report-steps label would leave the step titles English on zh pages.
const stepsNav = read("src/components/report/ReportStepsNav.tsx");
assert.equal(
  stepsNav.includes("{step.label}"),
  false,
  "ReportStepsNav must not render the raw English step label",
);
assert.match(
  stepsNav,
  /useTranslations\("docs\.step"\)/,
  "ReportStepsNav must resolve step titles from docs.step",
);

console.log(
  "i18n app checks passed: server (app) layout + client shell, " +
    APP_NAMESPACES.length +
    " app namespaces, " +
    checkedPairs +
    " translated zh values, " +
    NEUTRAL_APP_KEYS.size +
    " neutral allowlist keys, " +
    FISHBONE_FIELDS.length * 2 +
    " localized fishbone strings, " +
    STEPS.length +
    " localized step descriptions, proxy/admin guards unchanged, URL locale rule intact.",
);
