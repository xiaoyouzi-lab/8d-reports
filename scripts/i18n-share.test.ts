import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import sitemap from "../src/app/sitemap";
import {
  ZH_DYNAMIC_COLLECTIONS,
  enPathFor,
  zhPathFor,
} from "../src/lib/i18n-routes";
import { STEPS } from "../src/lib/report-steps";

// i18n share guard (Batch 5c). The tokenized report viewer now has a Chinese
// URL (/zh/share/<token>) that renders the same component as /share/<token>,
// the three zh auth pages carry Chinese metadata, and share URLs never leak into
// the sitemap.

const root = process.cwd();
const read = (rel: string) => readFileSync(path.join(root, rel), "utf8");
const has = (rel: string) => existsSync(path.join(root, rel));

// 1. The zh share route exists, is noindex, and both URLs reuse one viewer.
const EN_SHARE_PAGE = "src/app/share/[token]/page.tsx";
const ZH_SHARE_PAGE = "src/app/zh/share/[token]/page.tsx";
const ZH_SHARE_LAYOUT = "src/app/zh/share/[token]/layout.tsx";
const SHARE_VIEWER = "src/components/share/ShareViewer.tsx";
for (const file of [EN_SHARE_PAGE, ZH_SHARE_PAGE, ZH_SHARE_LAYOUT, SHARE_VIEWER]) {
  assert.ok(has(file), file + " must exist");
}
assert.match(read(EN_SHARE_PAGE), /@\/components\/share\/ShareViewer/, "the English share page must reuse ShareViewer");
assert.match(read(ZH_SHARE_PAGE), /@\/components\/share\/ShareViewer/, "the zh share page must reuse ShareViewer");
assert.match(read(ZH_SHARE_LAYOUT), /index:\s*false/, "the zh share layout must stay noindex");
assert.match(read(SHARE_VIEWER), /useTranslations\("share"\)/, "the viewer must render from the share catalog");

// 2. The arbitrary token resolves in both directions through the route map.
const token = "aBc-123_XyZ";
const enSharePath = "/share/" + token;
const zhSharePath = "/zh/share/" + token;
assert.equal(zhPathFor(enSharePath), zhSharePath, enSharePath + " must localize");
assert.equal(enPathFor(zhSharePath), enSharePath, zhSharePath + " must map back");
assert.equal(zhPathFor("/share"), undefined, "/share without a token must not localize");
assert.equal(zhPathFor(enSharePath + "/extra"), undefined, "multi-segment tokens must not localize");
assert.equal(enPathFor("/zh/share"), undefined, "/zh/share without a token must not map back");
const shareCollection = ZH_DYNAMIC_COLLECTIONS.find((collection) => collection.zhPrefix === "/zh/share");
assert.ok(shareCollection, "the /zh/share dynamic collection must be registered");
assert.equal(shareCollection?.param, "token", "the share collection must use the [token] segment");

// 3. Catalog parity and translation quality for the whole share namespace.
const enShare = (JSON.parse(read("src/messages/en.json")) as { share: Record<string, string> }).share;
const zhShare = (JSON.parse(read("src/messages/zh-CN.json")) as { share: Record<string, string> }).share;
assert.ok(enShare && typeof enShare === "object", "en catalog must have a share namespace");
assert.ok(zhShare && typeof zhShare === "object", "zh catalog must have a share namespace");
assert.deepEqual(Object.keys(zhShare).sort(), Object.keys(enShare).sort(), "en and zh share keys must match exactly");

// No share value is intentionally language neutral today: the two placeholder
// values ({views}, {name}) still carry translated surrounding text.
const NEUTRAL_SHARE_KEYS = new Set<string>();
for (const key of Object.keys(enShare)) {
  assert.equal(typeof zhShare[key], "string", "zh share." + key + " must be a string");
  assert.ok(zhShare[key].trim().length > 0, "zh share." + key + " must not be empty");
  if (!NEUTRAL_SHARE_KEYS.has(key)) {
    assert.notEqual(zhShare[key], enShare[key], "zh share." + key + " must be translated");
    assert.match(zhShare[key], /[\u4e00-\u9fff]/, "zh share." + key + " must render Chinese");
  }
}

// The viewer actually consumes the catalog, and no hardcoded English chrome
// remains for the strings the batch promised to localize.
const viewer = read(SHARE_VIEWER);
const usedKeys = new Set<string>();
for (const match of viewer.matchAll(/\bt\("([^"]+)"/g)) usedKeys.add(match[1]);
assert.ok(usedKeys.size >= 20, "the share viewer should consume the catalog, found " + usedKeys.size);
for (const key of usedKeys) {
  assert.ok(key in enShare, "en share must define " + key);
  assert.ok(key in zhShare, "zh share must define " + key);
}
const hardcoded = ["Save Changes", "Saving...", "Signature line", "Prepared by", "Reviewed by", "Approved by"];
for (const phrase of hardcoded) {
  assert.equal(viewer.includes('"' + phrase + '"'), false, SHARE_VIEWER + ' must not hardcode "' + phrase + '"');
}

// D0-D8 step titles are reused from the existing docs.step.*.name keys so the zh
// viewer shows the established Chinese terminology.
assert.match(viewer, /useTranslations\("docs\.step"\)/, "the viewer must reuse the docs.step step titles");

// 4. The three zh auth pages now export Chinese metadata.
const AUTH_ZH_PAGES = [
  { file: "src/app/(auth)/zh/login/page.tsx", title: "登录" },
  { file: "src/app/(auth)/zh/signup/page.tsx", title: "创建账号" },
  { file: "src/app/(auth)/zh/reset-password/page.tsx", title: "重置密码" },
] as const;
for (const page of AUTH_ZH_PAGES) {
  const source = read(page.file);
  assert.match(source, /export const metadata/, page.file + " must export metadata");
  const title = source.match(/title:\s*"([^"]+)"/)?.[1];
  const description = source.match(/description:\s*"([^"]+)"/)?.[1];
  assert.ok(title, page.file + " metadata must set a title");
  assert.ok(description, page.file + " metadata must set a description");
  assert.equal(title, page.title, page.file + " must use the expected Chinese title");
  assert.match(title as string, /[\u4e00-\u9fff]/, page.file + " title must be Chinese");
  assert.match(description as string, /[\u4e00-\u9fff]/, page.file + " description must be Chinese");
}

// 5. Share URLs of both languages stay out of the generated sitemap, and the
//    sitemap URL count does not change.
const entries = sitemap();
const sitemapPaths = entries.map((entry) => new URL(entry.url).pathname);
for (const sharePath of ["/share", "/zh/share"]) {
  assert.equal(
    sitemapPaths.some((pathname) => pathname === sharePath || pathname.startsWith(sharePath + "/")),
    false,
    "sitemap must not list share routes: " + sharePath,
  );
}
assert.equal(entries.length, 240, "sitemap URL count must stay at 240, found " + entries.length);

// 6. The viewer renders step titles from docs.step.<D>.name. Pin that copy to
//    the canonical STEPS labels: otherwise an English label edit would silently
//    diverge and the viewer would keep showing the stale docs string.
const enCatalog = JSON.parse(read("src/messages/en.json")) as {
  docs: { step: Record<string, { name: string }> };
};
for (const step of STEPS) {
  assert.equal(
    enCatalog.docs.step[step.id]?.name,
    step.label,
    "docs.step." + step.id + ".name must match the STEPS label so the share viewer keeps rendering English unchanged",
  );
}
assert.equal(
  Object.keys(enCatalog.docs.step).length,
  STEPS.length,
  "docs.step must cover exactly the D0-D8 steps the share viewer renders",
);

console.log(
  "i18n share checks passed: zh share viewer route, " +
    Object.keys(enShare).length +
    " share keys x2 catalogs, 3 zh auth metadata exports, sitemap excludes share and still has " +
    entries.length +
    " URLs.",
);
