import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (rel: string) => readFileSync(path.join(root, rel), "utf8");

const noIndexLayouts = [
  "src/app/(auth)/layout.tsx",
  "src/app/reset-password/layout.tsx",
  "src/app/share/[token]/layout.tsx",
];

for (const rel of noIndexLayouts) {
  assert.equal(existsSync(path.join(root, rel)), true, rel + " must exist");
  assert.ok(read(rel).includes("index: false"), rel + " must declare noindex");
}

const sitemap = read("src/app/sitemap.ts");
assert.equal(sitemap.includes("/share/"), false, "sitemap must not include share tokens");

console.log("Index hygiene checks passed.");
