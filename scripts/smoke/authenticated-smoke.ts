import assert from "node:assert/strict";
import { chromium, request, type Browser, type Page } from "playwright";
import { configureSmokeDatabase, writeJsonFile } from "./smoke-safety";

interface CapturedEvent {
  eventName: string;
  metadata: Record<string, unknown>;
  path: string | null;
  plan: string | null;
  reportId: string | null;
}

const summary = configureSmokeDatabase();
const baseUrl = (process.env.SMOKE_BASE_URL || "http://127.0.0.1:3028").replace(/\/$/, "");
const ownerEmail = process.env.SMOKE_OWNER_EMAIL || "smoke-owner@example.test";
const ownerPassword = process.env.SMOKE_OWNER_PASSWORD || "SmokeTest#2026!";
const completedTitle = "KB Smoke Test - Coating Peel-off";
const closedTitle = "KB Smoke Test - Closed Bearing Noise";
const memberTitle = "KB Smoke Test - Member Approved Internal 8D";
const draftTitle = "KB Smoke Test - Draft Containment";
const inProgressTitle = "KB Smoke Test - In Progress Torque";
const internalReviewTitle = "KB Smoke Test - Internal Review Leak";
const outsiderTitle = "KB Smoke Test - Outsider Visible Risk";

function toUrl(path: string) {
  return `${baseUrl}${path}`;
}

async function waitForBodyText(page: Page, text: string, timeout = 12000) {
  await page.waitForFunction(
    (expected) => document.body.innerText.includes(expected),
    text,
    { timeout },
  );
}

async function assertBodyExcludes(page: Page, text: string) {
  const bodyText = await page.locator("body").innerText();
  assert.equal(bodyText.includes(text), false, `Page should not include "${text}"`);
}

async function assertNoHorizontalOverflow(page: Page, label: string) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(overflow <= 2, `${label} should not have horizontal overflow; overflow=${overflow}`);
}

async function waitForCapturedEvent(events: CapturedEvent[], eventName: string, startIndex = 0, timeout = 8000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeout) {
    const event = events.slice(startIndex).find((candidate) => candidate.eventName === eventName);
    if (event) return event;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for analytics event ${eventName}`);
}

async function runAndWaitForEvent(
  events: CapturedEvent[],
  eventName: string,
  action: () => Promise<void>,
) {
  const startIndex = events.length;
  await action();
  return waitForCapturedEvent(events, eventName, startIndex);
}

function parseEventPayload(raw: string | null): CapturedEvent | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as {
      eventName?: unknown;
      metadata?: unknown;
      path?: unknown;
      plan?: unknown;
      reportId?: unknown;
    };
    if (typeof parsed.eventName !== "string") return null;
    const metadata = typeof parsed.metadata === "object" && parsed.metadata !== null && !Array.isArray(parsed.metadata)
      ? parsed.metadata as Record<string, unknown>
      : {};
    return {
      eventName: parsed.eventName,
      metadata,
      path: typeof parsed.path === "string" ? parsed.path : null,
      plan: typeof parsed.plan === "string" ? parsed.plan : null,
      reportId: typeof parsed.reportId === "string" ? parsed.reportId : null,
    };
  } catch {
    return null;
  }
}

async function createAuthenticatedContext(browser: Browser, events: CapturedEvent[]) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "sendBeacon", {
      value: undefined,
      configurable: true,
    });
  });
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: new URL(baseUrl).origin });
  await context.route("**/api/events", async (route) => {
    const event = parseEventPayload(route.request().postData());
    if (event) events.push(event);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true }),
    });
  });
  return context;
}

async function verifyUnauthenticatedSecurity() {
  const api = await request.newContext({ baseURL: baseUrl });
  const getResponse = await api.get("/api/knowledge/search?q=coating");
  assert.equal(getResponse.status(), 405, "GET /api/knowledge/search should be 405");

  const postResponse = await api.post("/api/knowledge/search", {
    data: { query: "coating" },
  });
  assert.equal(postResponse.status(), 401, "Unauthenticated POST /api/knowledge/search should be 401");
  await api.dispose();

  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(toUrl("/dashboard"), { waitUntil: "domcontentloaded" });
    await page.waitForURL(/\/login/, { timeout: 10000 });
    await assertBodyExcludes(page, "My Reports");
    await assertBodyExcludes(page, "Quality Knowledge Base");
    await assertBodyExcludes(page, "Root Cause");
    await assertBodyExcludes(page, "Corrective Action");
    await assertBodyExcludes(page, "Lessons Learned");

    await page.goto(toUrl("/knowledge"), { waitUntil: "domcontentloaded" });
    await page.waitForURL(/\/login/, { timeout: 10000 });
    await assertBodyExcludes(page, "Quality Knowledge Base");
    await assertBodyExcludes(page, "Root Cause");
    await assertBodyExcludes(page, "Corrective Action");
    await assertBodyExcludes(page, "Lessons Learned");

    await context.close();
  } finally {
    await browser.close();
  }
}

async function login(page: Page) {
  await page.goto(toUrl("/login"), { waitUntil: "domcontentloaded" });
  await page.getByLabel("Email").fill(ownerEmail);
  await page.getByLabel("Password").fill(ownerPassword);
  await Promise.all([
    page.waitForURL(/\/dashboard/, { timeout: 15000 }),
    page.getByRole("button", { name: "Sign in" }).click(),
  ]);
  await waitForBodyText(page, "My Reports");
}

async function verifyDashboardAndNavigation(page: Page, events: CapturedEvent[]) {
  await waitForBodyText(page, "Dashboard");
  await waitForBodyText(page, "Knowledge Base");
  await waitForBodyText(page, "New Report");
  await waitForBodyText(page, "What to do next");
  await waitForBodyText(page, "Turn each completed 8D into reusable quality knowledge.");
  await waitForBodyText(page, "Open Knowledge Base");
  await assertNoHorizontalOverflow(page, "Desktop dashboard");

  const logo = page.locator('header a[href="/dashboard"]').first();
  assert.equal(await logo.getAttribute("href"), "/dashboard", "Authenticated app logo should route to /dashboard");

  await runAndWaitForEvent(events, "dashboard_feature_entry_clicked", async () => {
    await page.getByRole("link", { name: /Open Knowledge Base/i }).click();
    await page.waitForURL(/\/knowledge/, { timeout: 10000 });
  });
  await waitForBodyText(page, "Quality Knowledge Base");

  await runAndWaitForEvent(events, "app_navigation_clicked", async () => {
    await page.locator('header a[href="/dashboard"]').first().click();
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(toUrl("/dashboard"), { waitUntil: "domcontentloaded" });
  await waitForBodyText(page, "Dashboard");
  await waitForBodyText(page, "Knowledge Base");
  await waitForBodyText(page, "New Report");
  await assertNoHorizontalOverflow(page, "Mobile dashboard");

  await page.setViewportSize({ width: 1440, height: 900 });
}

async function verifyKnowledge(page: Page, events: CapturedEvent[]) {
  await page.goto(toUrl("/knowledge"), { waitUntil: "domcontentloaded" });
  await waitForBodyText(page, "Quality Knowledge Base");
  await waitForBodyText(page, completedTitle);
  await waitForBodyText(page, closedTitle);
  await waitForBodyText(page, memberTitle);
  await assertBodyExcludes(page, draftTitle);
  await assertBodyExcludes(page, inProgressTitle);
  await assertBodyExcludes(page, internalReviewTitle);
  await assertBodyExcludes(page, outsiderTitle);
  await assertNoHorizontalOverflow(page, "Knowledge Base desktop");

  await page.setViewportSize({ width: 390, height: 844 });
  await waitForBodyText(page, "Quality Knowledge Base");
  await waitForBodyText(page, "All priorities");
  await assertNoHorizontalOverflow(page, "Knowledge Base mobile");
  await page.setViewportSize({ width: 1440, height: 900 });

  const search = page.getByPlaceholder("Search problem, root cause, corrective action, lessons learned...");

  await runAndWaitForEvent(events, "knowledge_search_used", async () => {
    await search.fill("coating");
    await waitForBodyText(page, completedTitle);
  });

  await runAndWaitForEvent(events, "knowledge_search_used", async () => {
    await search.fill("fixture cleaning");
    await waitForBodyText(page, completedTitle);
  });

  await runAndWaitForEvent(events, "knowledge_search_used", async () => {
    await search.fill("adhesion");
    await waitForBodyText(page, completedTitle);
  });

  await runAndWaitForEvent(events, "knowledge_search_used", async () => {
    await search.fill("Brake bracket");
    await waitForBodyText(page, completedTitle);
  });

  await runAndWaitForEvent(events, "knowledge_no_results", async () => {
    await search.fill("zzzz-no-result");
    await waitForBodyText(page, "No matching knowledge found.");
  });

  await search.fill("");
  await waitForBodyText(page, completedTitle);

  await runAndWaitForEvent(events, "knowledge_filter_used", async () => {
    await page.getByRole("button", { name: "Closed" }).click();
    await waitForBodyText(page, closedTitle);
  });

  await page.getByRole("button", { name: "All", exact: true }).first().click();
  await waitForBodyText(page, completedTitle);

  await runAndWaitForEvent(events, "knowledge_filter_used", async () => {
    await page.getByRole("button", { name: "Internal 8D" }).click();
    await waitForBodyText(page, memberTitle);
  });

  await runAndWaitForEvent(events, "knowledge_filter_used", async () => {
    await page.getByRole("button", { name: "High" }).click();
    await waitForBodyText(page, memberTitle);
  });

  await page.getByRole("button", { name: "All types" }).click();
  await page.getByRole("button", { name: "All priorities" }).click();
  await search.fill("coating");
  await waitForBodyText(page, completedTitle);

  await runAndWaitForEvent(events, "knowledge_root_cause_copied", async () => {
    await page.getByRole("button", { name: "Root cause" }).first().click();
    await waitForBodyText(page, "Copied");
  });

  await runAndWaitForEvent(events, "knowledge_corrective_action_copied", async () => {
    await page.getByRole("button", { name: "Corrective action" }).first().click();
    await waitForBodyText(page, "Copied");
  });

  await runAndWaitForEvent(events, "knowledge_lesson_copied", async () => {
    await page.getByRole("button", { name: "Lessons learned" }).first().click();
    await waitForBodyText(page, "Copied");
  });

  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: () => Promise.reject(new Error("blocked by authenticated smoke")) },
      configurable: true,
    });
  });
  await page.getByRole("button", { name: "Root cause" }).first().click();
  await waitForBodyText(page, "Could not copy. Select and copy manually.");

  await runAndWaitForEvent(events, "knowledge_result_opened", async () => {
    await page.getByRole("link", { name: /Open report/i }).first().click();
    await page.waitForURL(/\/reports\//, { timeout: 10000 });
  });
}

async function verifyWorkflowPanel(page: Page, events: CapturedEvent[]) {
  await waitForBodyText(page, "Workflow");
  await page.getByRole("button", { name: /Workflow/i }).click();
  await waitForBodyText(page, "Workflow and activity");
  await waitForBodyText(page, "Completed and closed reports become reusable knowledge");

  const event = await runAndWaitForEvent(events, "app_navigation_clicked", async () => {
    await page.getByRole("dialog", { name: /Workflow and activity/i })
      .getByRole("link", { name: "Knowledge Base" })
      .click();
    await page.waitForURL(/\/knowledge/, { timeout: 10000 });
  });
  assert.equal(event.metadata.location, "workflow_panel", "Workflow panel Knowledge Base click should emit workflow_panel metadata");
}

function assertNoSensitiveAnalyticsMetadata(events: CapturedEvent[]) {
  const allowedKeys = new Set([
    "destination",
    "entry",
    "filter",
    "hasQuery",
    "location",
    "method",
    "navItem",
    "plan",
    "priority",
    "queryLength",
    "reportType",
    "resultCount",
    "source",
    "copiedField",
  ]);
  const forbiddenKeys = new Set([
    "query",
    "fullQuery",
    "problem",
    "problemDescription",
    "rootCause",
    "rootCauseOccurrence",
    "rootCauseEscape",
    "confirmedRootCause",
    "correctiveAction",
    "selectedCorrectiveAction",
    "lessonsLearned",
    "customer",
    "customerName",
    "supplier",
    "supplierName",
    "product",
    "productName",
    "batch",
    "batchNumber",
    "attachment",
    "attachments",
  ]);
  const forbiddenTerms = [
    "coating peel-off",
    "brake bracket",
    "kb test customer",
    "kb-001",
    "fixture cleaning",
    "outgoing inspection",
    "coating edge adhesion",
    "mandatory fixture cleaning sign-off",
    "layered audit checklist",
    "line change work instruction",
    "line-change controls",
    "zzzz-no-result",
  ];

  for (const event of events) {
    for (const key of Object.keys(event.metadata)) {
      assert.equal(forbiddenKeys.has(key), false, `${event.eventName} metadata must not include sensitive key ${key}`);
      assert.ok(allowedKeys.has(key), `${event.eventName} metadata should use an allowed safe key: ${key}`);
    }

    const metadataText = JSON.stringify(event.metadata).toLowerCase();
    for (const term of forbiddenTerms) {
      assert.equal(metadataText.includes(term), false, `${event.eventName} metadata leaked sensitive term: ${term}`);
    }
  }
}

async function verifyAuthenticatedFlow() {
  const browser = await chromium.launch({ headless: true });
  const events: CapturedEvent[] = [];

  try {
    const context = await createAuthenticatedContext(browser, events);
    const page = await context.newPage();

    await login(page);
    await verifyDashboardAndNavigation(page, events);
    await verifyKnowledge(page, events);
    await verifyWorkflowPanel(page, events);

    for (const requiredEvent of [
      "app_navigation_clicked",
      "dashboard_feature_entry_clicked",
      "knowledge_search_used",
      "knowledge_no_results",
      "knowledge_result_opened",
      "knowledge_filter_used",
      "knowledge_root_cause_copied",
      "knowledge_corrective_action_copied",
      "knowledge_lesson_copied",
    ]) {
      assert.ok(events.some((event) => event.eventName === requiredEvent), `Missing analytics event: ${requiredEvent}`);
    }

    assertNoSensitiveAnalyticsMetadata(events);
    await context.close();

    return {
      events: events.map((event) => event.eventName),
      eventCount: events.length,
    };
  } finally {
    await browser.close();
  }
}

await verifyUnauthenticatedSecurity();
const authenticated = await verifyAuthenticatedFlow();

const result = {
  status: "passed",
  checkedAt: new Date().toISOString(),
  baseUrl,
  database: summary,
  authenticated,
  assertions: [
    "unauthenticated dashboard redirects to login",
    "unauthenticated knowledge redirects to login",
    "GET knowledge search is 405",
    "unauthenticated POST knowledge search is 401",
    "authenticated nav exposes Dashboard, Knowledge Base, New Report",
    "dashboard create-complete-reuse guidance is visible",
    "Knowledge Base includes completed, closed, and accessible Team member approved assets",
    "draft, in_progress, internal_review, and outsider reports are excluded",
    "Knowledge search for coating, fixture cleaning, adhesion, product/customer terms, filters, open report, copy success, copy failure, mobile, and workflow panel passed",
    "analytics metadata excludes sensitive query and report content",
  ],
};

if (process.env.SMOKE_RESULT_PATH) {
  writeJsonFile(process.env.SMOKE_RESULT_PATH, result);
}

console.log("Authenticated smoke passed", {
  baseUrl,
  database: summary,
  eventCount: authenticated.eventCount,
});
