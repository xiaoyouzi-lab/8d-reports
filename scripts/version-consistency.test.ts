import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
function read(rel: string) {
  return readFileSync(path.join(root, rel), "utf8");
}
function count(haystack: string, needle: string) {
  return haystack.split(needle).length - 1;
}

const editor = read("src/app/(app)/reports/[id]/page.tsx");
const exportMenu = read("src/components/report/ExportMenu.tsx");
const aiTools = read("src/components/report/AiReportTools.tsx");
const workflowPanel = read("src/components/report/ReportWorkflowPanel.tsx");

// One save barrier in the editor, reused by every outbound action.
assert.ok(editor.includes("const ensureSaved = useCallback"), "report editor must define a single ensureSaved barrier");
assert.ok(editor.includes("const isDirty = reportPermissions.canEdit"), "report editor must track dirty state");
assert.equal(editor.includes("/* silently fail"), false, "handleNext must not swallow save failures");
assert.ok(editor.includes("const saved = await ensureSaved()"), "handleNext must await ensureSaved");
assert.ok(editor.includes("if (saved === null) return"), "handleNext must abort when the save failed");
assert.ok(editor.includes("onBeforeExport={ensureSaved}"), "ExportMenu must receive ensureSaved");
assert.ok(editor.includes("onBeforeAction={ensureSaved}"), "AI tools and workflow panel must receive ensureSaved");

// Every export format waits for the saved version before rendering or fetching.
assert.ok(exportMenu.includes("onBeforeExport?: () => Promise<ReportData | null>"), "ExportMenu must accept onBeforeExport");
assert.ok(count(exportMenu, "onBeforeExport ? await onBeforeExport() : reportData") >= 3, "every export must await the save barrier");
assert.ok(count(exportMenu, "if (!fresh) return") >= 3, "every export must abort on save failure");
assert.ok(exportMenu.includes("reportData: fresh"), "PDF export must render from the saved version");
assert.equal(exportMenu.includes("warnIfReportNeedsWork()"), false, "warn helper must use the exported version");

// AI review and draft both wait for the saved version.
assert.ok(aiTools.includes("onBeforeAction?: () => Promise<ReportData | null>"), "AiReportTools must accept onBeforeAction");
assert.equal(aiTools.includes('className="hidden md:inline-flex"'), false, "AI entry must be reachable on mobile");
assert.ok(count(aiTools, "onBeforeAction ? await onBeforeAction() : reportData") >= 2, "AI review and draft must wait for a save");
assert.ok(count(aiTools, "if (!fresh) return") >= 2, "AI actions must abort on save failure");

// Workflow approval/locking waits for the saved version.
assert.ok(workflowPanel.includes("onBeforeAction?: () => Promise<unknown>"), "ReportWorkflowPanel must accept onBeforeAction");
assert.ok(workflowPanel.includes("const saved = await onBeforeAction()"), "workflow transitions must await the save barrier");
assert.ok(workflowPanel.includes("if (!saved) return"), "workflow transitions must abort on save failure");

console.log("Version-consistency wiring check passed.");
