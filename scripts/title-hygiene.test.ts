import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const appDir = path.join(root, "src/app");

function walk(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (entry.name === "page.tsx" || entry.name === "layout.tsx") files.push(full);
  }
  return files;
}

// The root layout applies title.template = "%s | 8D Reports", so any page or
// layout that hardcodes that suffix produces a duplicated brand in <title>.
let checked = 0;
for (const file of walk(appDir)) {
  const source = readFileSync(file, "utf8");
  for (const match of source.matchAll(/title:\s*"([^"]*)"/g)) {
    const title = match[1];
    assert.equal(
      title.endsWith("| 8D Reports"),
      false,
      path.relative(root, file) + ' metadata title must not append the brand: "' + title + '"',
    );
    checked += 1;
  }
}
assert.ok(checked > 20, "expected to scan many metadata titles, scanned " + checked);

// Programmatic SEO pages build metaTitle in a template literal.
const seoPages = readFileSync(path.join(root, "src/content/seo-pages.ts"), "utf8");
assert.equal(seoPages.includes("| 8D Reports\`"), false, "programmatic SEO metaTitle must not append the brand");

console.log("Title hygiene checks passed:", checked, "metadata titles scanned");
