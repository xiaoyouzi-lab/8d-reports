import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

// Public tool-only positioning guard. The product is a fully automated
// subscription tool, so public marketing, content, and component copy must not
// advertise the removed manual service offerings or link to their old routes.
const root = process.cwd();

const scanRoots = [
  "src/app/(marketing)",
  "src/components/marketing",
  "src/content",
  "content/help",
  "content/learn",
];

const forbiddenText = ["Template Setup", "Assisted First 8D", "Team Launch"];

const forbiddenRoutes = [
  "/custom-8d-template-setup",
  "/team-launch",
  "/8d-report-review-service",
];

function walk(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results.push(...walk(full));
    else if (/\.(tsx?|md|json)$/.test(entry.name)) results.push(full);
  }
  return results;
}

const files = scanRoots.flatMap((relative) => {
  const target = path.join(root, relative);
  try {
    statSync(target);
  } catch {
    return [];
  }
  return walk(target);
});

assert.ok(files.length > 0, "Tool-only positioning scan should find public-facing files");

const violations: string[] = [];
for (const file of files) {
  const relative = path.relative(root, file);
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, index) => {
    for (const term of forbiddenText) {
      if (line.toLowerCase().includes(term.toLowerCase())) {
        violations.push(`${relative}:${index + 1}: "${term}" -> ${line.trim()}`);
      }
    }
    for (const route of forbiddenRoutes) {
      // Match an exact route reference. The negative lookahead keeps the
      // legacy path /resources/custom-8d-template-setup-guide from matching.
      const exactRoute = new RegExp(route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?![\\w-])");
      if (exactRoute.test(line)) {
        violations.push(`${relative}:${index + 1}: "${route}" -> ${line.trim()}`);
      }
    }
  });
}

assert.deepEqual(
  violations,
  [],
  `Tool-only positioning regressions found:\n${violations.join("\n")}`,
);

console.log(`Tool-only positioning check passed: scanned ${files.length} public-facing files.`);
