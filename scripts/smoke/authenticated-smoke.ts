import assert from "node:assert/strict";
import { chromium, request, type Browser, type Page } from "playwright";
import { configureSmokeDatabase, writeJsonFile, type SmokeDatabaseSummary } from "./smoke-safety";

interface CapturedEvent {
  eventName: string;
  metadata: Record<string, unknown>;
  path: string | null;
  plan: string | null;
  reportId: string | null;
}

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
const resultPath = process.env.SMOKE_RESULT_PATH || "output/authenticated-smoke-result.json";
const completedReportId = process.env.SMOKE_COMPLETED_REPORT_ID || "";
const draftReportId = process.env.SMOKE_DRAFT_REPORT_ID || "";

type SmokeCheckStatus = "passed" | "failed" | "skipped";

const completedSteps: string[] = [];
let currentStep = "not started";
let failedStep: string | null = null;
let activePage: Page | null = null;
let databaseSummary: SmokeDatabaseSummary | null = null;
const capturedEvents: CapturedEvent[] = [];
const checks: Record<string, SmokeCheckStatus> = {
  unauthenticatedSecurity: "skipped",
  login: "skipped",
  dashboardNavigation: "skipped",
  knowledgeEligibility: "skipped",
  editorKnowledgeReuse: "skipped",
  knowledgeReadiness: "skipped",
  aiQualityCheck: "skipped",
  revenueEvidence: "skipped",
  analyticsPayloadSafety: "skipped",
};

const REDACTED_ARTIFACT_TERMS = [
  ownerEmail,
  ownerPassword,
  "smoke-owner@example.test",
  "smoke-member@example.test",
  "smoke-outsider@example.test",
  completedTitle,
  closedTitle,
  memberTitle,
  draftTitle,
  inProgressTitle,
  internalReviewTitle,
  outsiderTitle,
  "SmokeTest#2026!",
  "KB-SMOKE-001",
  "KB-SMOKE-002",
  "KB-SMOKE-DRAFT",
  "KB-SMOKE-INPROGRESS",
  "KB-SMOKE-REVIEW",
  "KB-SMOKE-OUTSIDER",
  "KB-SMOKE-MEMBER",
  "Customer found coating peel-off on brake bracket batch KB-001.",
  "Brake bracket",
  "KB Test Customer",
  "KB-001",
  "Fixture cleaning check was skipped before line change.",
  "Outgoing inspection did not check coating edge adhesion.",
  "Fixture cleaning control was not verified during line change.",
  "Add mandatory fixture cleaning sign-off before production restart.",
  "Update startup checklist and retrain shift operators.",
  "Three follow-up lots passed coating adhesion checks.",
  "Layered audit checklist updated.",
  "Line change work instruction updated.",
  "Line-change controls must include fixture cleaning verification.",
  "Bearing noise returned after final assembly run-in.",
  "Bearing module",
  "KB Closed Customer",
  "Grease fill target was not updated after supplier packaging changed.",
  "Add grease weight verification and supplier packaging change review.",
  "Closed validation lots passed run-in noise and torque checks.",
  "Packaging changes can affect grease distribution and need process-owner review.",
  "Internal audit found repeated fixture cleaning miss on second shift.",
  "Internal coating line",
  "Internal Team",
  "Shift handover did not include fixture cleaning status.",
  "Add shift-handover fixture status check and quality sign-off.",
  "Approved internal audit follow-up showed no repeated fixture cleaning misses.",
  "Team-owned process knowledge should be visible to the workspace owner.",
  "fixture cleaning",
  "coating",
  "adhesion",
  "zzzz-no-result",
  "Revenue Smoke Manufacturing",
  "revenue-smoke@example.test",
  "Need customer-ready SCAR format for a line complaint this week.",
  "revenue-smoke-template.pdf",
].filter(Boolean);

function toUrl(path: string) {
  return `${baseUrl}${path}`;
}

function markCheckForStep(stepName: string, status: SmokeCheckStatus) {
  if (stepName === "unauthenticated security") checks.unauthenticatedSecurity = status;
  if (stepName === "login") checks.login = status;
  if (stepName === "dashboard navigation" || stepName === "mobile navigation") checks.dashboardNavigation = status;
  if (
    stepName.startsWith("knowledge ") ||
    stepName === "open report" ||
    stepName === "workflow panel knowledge link"
  ) {
    checks.knowledgeEligibility = status;
  }
  if (stepName.startsWith("editor knowledge reuse")) checks.editorKnowledgeReuse = status;
  if (stepName.startsWith("knowledge readiness")) checks.knowledgeReadiness = status;
  if (stepName.startsWith("ai quality check")) checks.aiQualityCheck = status;
  if (stepName.startsWith("template setup")) checks.revenueEvidence = status;
  if (stepName === "analytics payload safety") checks.analyticsPayloadSafety = status;
}

async function smokeStep(name: string, fn: () => Promise<void>) {
  currentStep = name;
  console.log(`[smoke] start: ${name}`);
  try {
    await fn();
    completedSteps.push(name);
    markCheckForStep(name, "passed");
    console.log(`[smoke] pass: ${name}`);
  } catch (error) {
    failedStep = name;
    markCheckForStep(name, "failed");
    console.error(`[smoke] fail: ${name}`);
    throw error;
  }
}

function redactSensitiveText(value: string) {
  let redacted = value;
  for (const term of REDACTED_ARTIFACT_TERMS) {
    if (!term) continue;
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    redacted = redacted.replace(new RegExp(escaped, "gi"), "[redacted]");
  }
  redacted = redacted.replace(/postgres(?:ql)?:\/\/\S+/gi, "[redacted-database-url]");
  redacted = redacted.replace(/better-auth[^;\s]*/gi, "[redacted-cookie-name]");
  redacted = redacted.replace(/[a-f0-9]{48,}/gi, "[redacted-hex]");
  return redacted;
}

async function safeBodyExcerpt(page: Page, maxLength = 1000) {
  try {
    const bodyText = await page.locator("body").innerText({ timeout: 1500 });
    return redactSensitiveText(bodyText.replace(/\s+/g, " ").trim()).slice(0, maxLength);
  } catch {
    return "";
  }
}

function getCurrentUrl() {
  try {
    return activePage?.url() || null;
  } catch {
    return null;
  }
}

function normalizeErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return redactSensitiveText(message).slice(0, 2000);
}

function writeSmokeResult(status: "passed" | "failed", details: {
  error?: unknown;
  authenticated?: { events: string[]; eventCount: number };
} = {}) {
  const result = {
    status,
    failedStep: status === "failed" ? failedStep || currentStep : null,
    completedSteps,
    errorMessage: status === "failed" ? normalizeErrorMessage(details.error) : null,
    currentUrl: getCurrentUrl(),
    capturedEventNames: capturedEvents.map((event) => event.eventName),
    analyticsEventCount: capturedEvents.length,
    checks,
    createdAt: new Date().toISOString(),
    authenticated: details.authenticated,
    database: databaseSummary,
  };

  writeJsonFile(resultPath, result);
}

async function waitForBodyText(
  page: Page,
  text: string,
  options: { step?: string; timeout?: number; caseInsensitive?: boolean } = {},
) {
  activePage = page;
  const timeout = options.timeout ?? 12000;
  const step = options.step || currentStep;
  const caseInsensitive = options.caseInsensitive ?? false;
  try {
    await page.waitForFunction(
      ({ expected, ignoreCase }) => {
        const bodyText = document.body.innerText;
        return ignoreCase
          ? bodyText.toLowerCase().includes(expected.toLowerCase())
          : bodyText.includes(expected);
      },
      { expected: text, ignoreCase: caseInsensitive },
      { timeout },
    );
  } catch (error) {
    const excerpt = await safeBodyExcerpt(page);
    throw new Error(
      `Timed out waiting for ${caseInsensitive ? "case-insensitive " : ""}body text "${redactSensitiveText(text)}" during step "${step}", url="${page.url()}", timeout=${timeout}ms, bodyExcerpt="${excerpt}"`,
      { cause: error },
    );
  }
}

async function assertBodyExcludes(page: Page, text: string) {
  activePage = page;
  const bodyText = await page.locator("body").innerText();
  assert.equal(bodyText.includes(text), false, `Page should not include "${text}"`);
}

async function assertNoHorizontalOverflow(page: Page, label: string) {
  activePage = page;
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

async function waitForAnyCapturedEvent(events: CapturedEvent[], eventNames: string[], startIndex = 0, timeout = 8000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeout) {
    const event = events.slice(startIndex).find((candidate) => eventNames.includes(candidate.eventName));
    if (event) return event;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for analytics events ${eventNames.join(", ")}`);
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
    activePage = page;

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

    await page.goto(toUrl("/admin/service-requests"), { waitUntil: "domcontentloaded" });
    await page.waitForURL(/\/login/, { timeout: 10000 });
    await assertBodyExcludes(page, "Service Requests");

    await page.goto(toUrl("/admin/metrics"), { waitUntil: "domcontentloaded" });
    await page.waitForURL(/\/login/, { timeout: 10000 });
    await assertBodyExcludes(page, "Revenue evidence metrics");

    await context.close();
  } finally {
    await browser.close();
  }
}

async function login(page: Page) {
  activePage = page;
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
  await smokeStep("dashboard navigation", async () => {
    await waitForBodyText(page, "Dashboard");
    await waitForBodyText(page, "Knowledge Base");
    await waitForBodyText(page, "New Report");
    await waitForBodyText(page, "What to do next", { caseInsensitive: true });
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
  });

  await smokeStep("mobile navigation", async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(toUrl("/dashboard"), { waitUntil: "domcontentloaded" });
    await waitForBodyText(page, "Dashboard");
    await waitForBodyText(page, "Knowledge Base");
    await waitForBodyText(page, "New Report");
    await assertNoHorizontalOverflow(page, "Mobile dashboard");
  });

  await page.setViewportSize({ width: 1440, height: 900 });
}

async function verifyTemplateSetupLead(page: Page, events: CapturedEvent[]) {
  await smokeStep("template setup lead capture", async () => {
    await page.goto(toUrl("/custom-8d-template-setup"), { waitUntil: "domcontentloaded" });
    await waitForBodyText(page, "Submit your template for setup");

    await runAndWaitForEvent(events, "template_setup_form_started", async () => {
      await page.getByRole("textbox", { name: "Name", exact: true }).fill("Revenue Smoke");
    });
    await page.getByRole("textbox", { name: "Company name", exact: true }).fill("Revenue Smoke Manufacturing");
    await page.getByRole("textbox", { name: "Work email", exact: true }).fill("revenue-smoke@example.test");
    await page.getByRole("textbox", { name: "Role", exact: true }).fill("Quality Manager");
    await page.getByLabel("Current process").selectOption("Word/Excel");
    await page.getByLabel("Use case").selectOption("SCAR");
    await page.getByLabel("Timeline").selectOption("This week");
    await page.getByLabel("PDF").check();
    await page.getByLabel("Word").check();
    await page.getByLabel("Excel").check();
    await page.getByLabel("ZIP").check();
    await page.getByLabel("Message").fill("Need customer-ready SCAR format for a line complaint this week.");
    await page.locator('input[name="files"]').setInputFiles({
      name: "revenue-smoke-template.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4\n% revenue smoke template\n"),
    });

    const event = await runAndWaitForEvent(events, "template_setup_form_submitted", async () => {
      await page.getByRole("button", { name: "Submit setup request" }).click();
      await waitForBodyText(page, "Request received.");
      await waitForBodyText(page, "file upload could not be completed", { caseInsensitive: true });
    });
    assert.equal(event.metadata.requestType, "template_setup", "Template setup smoke should submit the template_setup request type");
    assert.equal(event.metadata.hasFile, true, "Template setup smoke should include a file attempt");
    assert.equal(event.metadata.fileUploadWarning, true, "Template setup smoke should surface upload warning metadata");
  });
}

async function verifyKnowledge(page: Page, events: CapturedEvent[]) {
  await smokeStep("knowledge eligibility", async () => {
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
  });

  const search = page.getByPlaceholder("Search problem, root cause, corrective action, lessons learned...");

  await smokeStep("knowledge search coating", () => runAndWaitForEvent(events, "knowledge_search_used", async () => {
    await search.fill("coating");
    await waitForBodyText(page, completedTitle);
  }).then(() => undefined));

  await smokeStep("knowledge search fixture cleaning", () => runAndWaitForEvent(events, "knowledge_search_used", async () => {
    await search.fill("fixture cleaning");
    await waitForBodyText(page, completedTitle);
  }).then(() => undefined));

  await smokeStep("knowledge search adhesion", () => runAndWaitForEvent(events, "knowledge_search_used", async () => {
    await search.fill("adhesion");
    await waitForBodyText(page, completedTitle);
  }).then(() => undefined));

  await smokeStep("knowledge search product term", () => runAndWaitForEvent(events, "knowledge_search_used", async () => {
    await search.fill("Brake bracket");
    await waitForBodyText(page, completedTitle);
  }).then(() => undefined));

  await smokeStep("knowledge no results", () => runAndWaitForEvent(events, "knowledge_no_results", async () => {
    await search.fill("zzzz-no-result");
    await waitForBodyText(page, "No matching knowledge found.");
  }).then(() => undefined));

  await search.fill("");
  await waitForBodyText(page, completedTitle);

  await smokeStep("knowledge filters", async () => {
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
  });

  await page.getByRole("button", { name: "All types" }).click();
  await page.getByRole("button", { name: "All priorities" }).click();
  await search.fill("coating");
  await waitForBodyText(page, completedTitle);

  await smokeStep("knowledge copy root cause", () => runAndWaitForEvent(events, "knowledge_root_cause_copied", async () => {
    await page.getByRole("button", { name: "Root cause" }).first().click();
    await waitForBodyText(page, "Copied");
  }).then(() => undefined));

  await smokeStep("knowledge copy corrective action", () => runAndWaitForEvent(events, "knowledge_corrective_action_copied", async () => {
    await page.getByRole("button", { name: "Corrective action" }).first().click();
    await waitForBodyText(page, "Copied");
  }).then(() => undefined));

  await smokeStep("knowledge copy lessons learned", () => runAndWaitForEvent(events, "knowledge_lesson_copied", async () => {
    await page.getByRole("button", { name: "Lessons learned" }).first().click();
    await waitForBodyText(page, "Copied");
  }).then(() => undefined));

  await smokeStep("knowledge copy failure", async () => {
    await page.evaluate(`
      Object.defineProperty(navigator, "clipboard", {
        value: {
          writeText: function () {
            return Promise.reject(new Error("blocked by authenticated smoke"));
          }
        },
        configurable: true,
      });
    `);
    await page.getByRole("button", { name: "Root cause" }).first().click();
    await waitForBodyText(page, "Could not copy. Select and copy manually.");
  });

  await smokeStep("open report", () => runAndWaitForEvent(events, "knowledge_result_opened", async () => {
    await page.getByRole("link", { name: /Open report/i }).first().click();
    await page.waitForURL(/\/reports\//, { timeout: 10000 });
  }).then(() => undefined));
}

async function verifyWorkflowPanel(page: Page, events: CapturedEvent[]) {
  await smokeStep("workflow panel knowledge link", async () => {
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
  });
}

async function verifyEditorKnowledgeReuse(page: Page, events: CapturedEvent[]) {
  assert.ok(completedReportId, "SMOKE_COMPLETED_REPORT_ID is required for editor reuse smoke");

  await smokeStep("editor knowledge reuse entry", async () => {
    await page.goto(toUrl(`/reports/${completedReportId}`), { waitUntil: "domcontentloaded" });
    await waitForBodyText(page, "Reuse Knowledge");
    await assertNoHorizontalOverflow(page, "Report editor desktop");
  });

  await smokeStep("editor knowledge reuse panel", async () => {
    const event = await runAndWaitForEvent(events, "knowledge_reuse_panel_opened", async () => {
      await page.getByRole("button", { name: "Reuse Knowledge" }).click();
      await waitForBodyText(page, "Search completed 8D reports and copy proven root causes, corrective actions, and lessons learned.");
    });
    assert.equal(event.metadata.source, "editor", "Editor reuse panel event should use editor source metadata");
    assert.equal(event.metadata.location, "editor_top", "Editor top entry should use editor_top location metadata");

    await waitForBodyText(page, completedTitle);
    await waitForBodyText(page, closedTitle);
    await waitForBodyText(page, memberTitle);
    await assertBodyExcludes(page, draftTitle);
    await assertBodyExcludes(page, inProgressTitle);
    await assertBodyExcludes(page, internalReviewTitle);
    await assertBodyExcludes(page, outsiderTitle);
  });

  const panel = page.locator('[data-slot="sheet-content"]').last();
  const search = panel.getByPlaceholder("Search problem, root cause, corrective action, lessons learned...");

  await smokeStep("editor knowledge reuse search coating", () => runAndWaitForEvent(events, "knowledge_reuse_search_used", async () => {
    await search.fill("coating");
    await waitForBodyText(page, completedTitle);
  }).then(() => undefined));

  await smokeStep("editor knowledge reuse copy root cause", () => runAndWaitForEvent(events, "knowledge_reuse_root_cause_copied", async () => {
    await panel.getByRole("button", { name: "Copy root cause" }).first().click();
    await waitForBodyText(page, "Copied");
  }).then(() => undefined));

  await smokeStep("editor knowledge reuse copy corrective action", () => runAndWaitForEvent(events, "knowledge_reuse_corrective_action_copied", async () => {
    await panel.getByRole("button", { name: "Copy corrective action" }).first().click();
    await waitForBodyText(page, "Copied");
  }).then(() => undefined));

  await smokeStep("editor knowledge reuse copy lessons learned", () => runAndWaitForEvent(events, "knowledge_reuse_lesson_copied", async () => {
    await panel.getByRole("button", { name: "Copy lessons learned" }).first().click();
    await waitForBodyText(page, "Copied");
  }).then(() => undefined));

  await smokeStep("editor knowledge reuse open report", () => runAndWaitForEvent(events, "knowledge_reuse_result_opened", async () => {
    const originalUrl = page.url();
    const [newPage] = await Promise.all([
      page.context().waitForEvent("page"),
      panel.getByRole("link", { name: /Open report/i }).first().click(),
    ]);
    await newPage.waitForLoadState("domcontentloaded");
    assert.match(newPage.url(), /\/reports\//, "Editor reuse Open report should open a report page");
    assert.equal(page.url(), originalUrl, "Editor reuse Open report should preserve the current editor tab");
    await newPage.close();
  }).then(() => undefined));

  await smokeStep("editor knowledge reuse mobile", async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await assertNoHorizontalOverflow(page, "Editor reuse panel mobile");
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  await smokeStep("editor knowledge reuse copy failure", async () => {
    await page.evaluate(`
      Object.defineProperty(navigator, "clipboard", {
        value: {
          writeText: function () {
            return Promise.reject(new Error("blocked by authenticated smoke"));
          }
        },
        configurable: true,
      });
    `);
    await panel.getByRole("button", { name: "Copy root cause" }).first().click();
    await waitForBodyText(page, "Could not copy. Select and copy manually.");
    await page.keyboard.press("Escape");
  });
}

async function verifyKnowledgeReadiness(page: Page, events: CapturedEvent[]) {
  assert.ok(draftReportId, "SMOKE_DRAFT_REPORT_ID is required for knowledge readiness smoke");

  await smokeStep("knowledge readiness panel", async () => {
    const event = await runAndWaitForEvent(events, "knowledge_readiness_viewed", async () => {
      await page.goto(toUrl(`/reports/${draftReportId}`), { waitUntil: "domcontentloaded" });
      await waitForBodyText(page, "Knowledge readiness");
    });

    assert.equal(event.metadata.plan, "team", "Knowledge readiness view should include safe plan metadata");
    assert.equal(typeof event.metadata.missingCount, "number", "Knowledge readiness view should include a missing count");
    assert.ok(Number(event.metadata.missingCount) > 0, "Draft report should have weak knowledge readiness");
    assert.equal(event.metadata.hasRootCause, false, "Draft fixture should not have root-cause knowledge");
    assert.equal(event.metadata.hasCorrectiveAction, false, "Draft fixture should not have corrective-action knowledge");
    assert.equal(event.metadata.hasValidation, false, "Draft fixture should not have validation knowledge");
    assert.equal(event.metadata.hasPrevention, false, "Draft fixture should not have prevention knowledge");
    assert.equal(event.metadata.hasLessonsLearned, false, "Draft fixture should not have lessons-learned knowledge");

    await waitForBodyText(page, "Root cause captured?");
    await waitForBodyText(page, "Corrective action captured?");
    await waitForBodyText(page, "Validation captured?");
    await waitForBodyText(page, "Prevention/system change captured?");
    await waitForBodyText(page, "Lessons learned captured?");
    await waitForBodyText(page, "Missing");
  });

  await smokeStep("knowledge readiness workflow warning", async () => {
    await waitForBodyText(page, "Workflow");
    await page.getByRole("button", { name: /Workflow/i }).click();
    await waitForBodyText(page, "Workflow and activity");
    await waitForBodyText(page, "Knowledge readiness");
    await waitForBodyText(page, "Root cause captured?");

    const event = await runAndWaitForEvent(events, "knowledge_readiness_warning_shown", async () => {
      await page.getByRole("dialog", { name: /Workflow and activity/i })
        .locator("select")
        .selectOption("approved");
      await waitForBodyText(
        page,
        "This report can still be completed, but missing root cause, corrective action, validation, or lessons learned will make future knowledge reuse weaker.",
      );
    });

    assert.equal(event.metadata.plan, "team", "Knowledge readiness warning should include safe plan metadata");
    assert.ok(Number(event.metadata.missingCount) > 0, "Warning event should include a missing count");
    assert.equal(event.metadata.hasRootCause, false, "Warning event should not include raw root-cause content");
    assert.equal(event.metadata.hasCorrectiveAction, false, "Warning event should not include raw corrective-action content");
    assert.equal(event.metadata.hasValidation, false, "Warning event should not include raw validation content");
    assert.equal(event.metadata.hasPrevention, false, "Warning event should not include raw prevention content");
    assert.equal(event.metadata.hasLessonsLearned, false, "Warning event should not include raw lessons-learned content");

    await page.keyboard.press("Escape");
  });
}

async function verifyAiQualityCheck(page: Page, events: CapturedEvent[]) {
  assert.ok(completedReportId, "SMOKE_COMPLETED_REPORT_ID is required for AI Quality Check smoke");

  await smokeStep("ai quality check knowledge context unavailable fallback", async () => {
    await page.goto(toUrl(`/reports/${completedReportId}`), { waitUntil: "domcontentloaded" });
    const aiTrigger = page.getByRole("button", { name: /^AI$/ });
    await aiTrigger.waitFor({ timeout: 12000 });

    const startIndex = events.length;
    await aiTrigger.click();
    await waitForBodyText(page, "AI Quality Check — Beta");
    await page.getByRole("button", { name: "Review report" }).click();
    await waitForBodyText(page, "AI Quality Check is temporarily unavailable. Your report is safely saved. Please try again later.", {
      timeout: 20000,
    });
    await page.waitForFunction(
      () => document.body.innerText.includes("Knowledge context used:") ||
        document.body.innerText.includes("No reusable knowledge context found yet."),
      undefined,
      { timeout: 12000 },
    );

    const event = await waitForAnyCapturedEvent(events, [
      "ai_quality_check_knowledge_context_used",
      "ai_quality_check_knowledge_context_empty",
    ], startIndex);
    assert.equal(event.metadata.source, "ai_quality_check", "AI Quality Check knowledge analytics should use source metadata");
    assert.equal(typeof event.metadata.contextCount, "number", "AI Quality Check knowledge analytics should include contextCount");
    assert.equal(typeof event.metadata.hasContext, "boolean", "AI Quality Check knowledge analytics should include hasContext");

    const bodyText = await page.locator("body").innerText();
    if (event.eventName === "ai_quality_check_knowledge_context_used") {
      assert.match(bodyText, /Knowledge context used: \d+ similar reports/, "AI Quality Check should show context count when context exists");
      assert.ok(Number(event.metadata.contextCount) > 0, "Used-context event should report a positive context count");
    } else {
      assert.match(bodyText, /No reusable knowledge context found yet\./, "AI Quality Check should show empty context state when no context exists");
      assert.equal(event.metadata.contextCount, 0, "Empty-context event should report zero context count");
    }

    assert.equal(
      bodyText.includes("The following historical completed reports are provided only as reference context."),
      false,
      "AI prompt instructions should not be exposed in the UI",
    );
    await page.keyboard.press("Escape");
  });
}

function assertNoSensitiveAnalyticsMetadata(events: CapturedEvent[]) {
  const allowedKeys = new Set([
    "contextCount",
    "destination",
    "entry",
    "filter",
    "hasCorrectiveAction",
    "hasLessonsLearned",
    "hasPrevention",
    "hasQuery",
    "hasRootCause",
    "hasValidation",
    "hasContext",
    "location",
    "method",
    "missingCount",
    "navItem",
    "plan",
    "priority",
    "queryLength",
    "reportType",
    "resultCount",
    "source",
    "copiedField",
    "anonymousSessionId",
    "referrer",
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "requestType",
    "hasFile",
    "fileCount",
    "fileUploadWarning",
    "reason",
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
    "validation",
    "validationResults",
    "prevention",
    "systemChanges",
    "processUpdates",
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
    "prompt",
    "rawAi",
    "aiOutput",
    "contactEmail",
    "companyName",
    "message",
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
    "three follow-up lots",
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

  try {
    const context = await createAuthenticatedContext(browser, capturedEvents);
    const page = await context.newPage();
    activePage = page;

    await smokeStep("login", () => login(page));
    await verifyDashboardAndNavigation(page, capturedEvents);
    await verifyTemplateSetupLead(page, capturedEvents);
    await verifyKnowledge(page, capturedEvents);
    await verifyEditorKnowledgeReuse(page, capturedEvents);
    await verifyKnowledgeReadiness(page, capturedEvents);
    await verifyAiQualityCheck(page, capturedEvents);
    await verifyWorkflowPanel(page, capturedEvents);

    await smokeStep("analytics payload safety", async () => {
      const aiKnowledgeContextEventExists = capturedEvents.some((event) =>
        event.eventName === "ai_quality_check_knowledge_context_used" ||
        event.eventName === "ai_quality_check_knowledge_context_empty"
      );
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
        "knowledge_reuse_panel_opened",
        "knowledge_reuse_search_used",
        "knowledge_reuse_result_opened",
        "knowledge_reuse_root_cause_copied",
        "knowledge_reuse_corrective_action_copied",
        "knowledge_reuse_lesson_copied",
        "knowledge_readiness_viewed",
        "knowledge_readiness_warning_shown",
        "template_setup_form_started",
        "template_setup_form_submitted",
      ]) {
        assert.ok(capturedEvents.some((event) => event.eventName === requiredEvent), `Missing analytics event: ${requiredEvent}`);
      }
      assert.ok(aiKnowledgeContextEventExists, "Missing AI Quality Check knowledge context analytics event");

      assertNoSensitiveAnalyticsMetadata(capturedEvents);
    });
    await context.close();

    return {
      events: capturedEvents.map((event) => event.eventName),
      eventCount: capturedEvents.length,
    };
  } finally {
    await browser.close();
  }
}

async function main() {
  currentStep = "smoke database safety";
  databaseSummary = configureSmokeDatabase();

  await smokeStep("unauthenticated security", verifyUnauthenticatedSecurity);
  const authenticated = await verifyAuthenticatedFlow();

  writeSmokeResult("passed", { authenticated });

  console.log("Authenticated smoke passed", {
    baseUrl,
    database: databaseSummary,
    eventCount: authenticated.eventCount,
  });
}

main().catch((error: unknown) => {
  try {
    if (!failedStep) failedStep = currentStep;
    writeSmokeResult("failed", { error });
  } catch (resultError) {
    console.error(`Failed to write smoke result artifact: ${normalizeErrorMessage(resultError)}`);
  }
  console.error(normalizeErrorMessage(error));
  process.exit(1);
});
