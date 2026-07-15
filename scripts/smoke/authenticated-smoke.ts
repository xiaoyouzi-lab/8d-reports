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
const qualityCaseTitle = "QC Smoke Test - Supplier Corrective Action";
const qualityCaseInternalNote = "QC smoke internal note must never reach an external task.";
const qualityCaseCommercialInfo = "QC smoke commercial terms must remain internal.";
const resultPath = process.env.SMOKE_RESULT_PATH || "output/authenticated-smoke-result.json";
const completedReportId = process.env.SMOKE_COMPLETED_REPORT_ID || "";
const draftReportId = process.env.SMOKE_DRAFT_REPORT_ID || "";
const hasSmokeObjectStorage = Boolean(
  process.env.R2_ENDPOINT &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY,
);
const verifyInvitationEmail = process.env.SMOKE_VERIFY_INVITATION_EMAIL === "true";
const supplierInvitationEmail = process.env.SMOKE_SUPPLIER_INVITATION_EMAIL || "";
const customerInvitationEmail = process.env.SMOKE_CUSTOMER_INVITATION_EMAIL || "";
const aiQualityCheckExpectation = process.env.SMOKE_AI_EXPECTATION || "either";
if (!["either", "available", "unavailable"].includes(aiQualityCheckExpectation))
  throw new Error("SMOKE_AI_EXPECTATION must be either, available, or unavailable.");

type SmokeCheckStatus = "passed" | "failed" | "skipped";

const completedSteps: string[] = [];
const emailDeliveries: Array<{ taskType: string; providerMessageId: string }> = [];
let customerInvitationSequence = 0;
let currentStep = "not started";
let failedStep: string | null = null;
let activePage: Page | null = null;
let databaseSummary: SmokeDatabaseSummary | null = null;
const capturedEvents: CapturedEvent[] = [];
const checks: Record<string, SmokeCheckStatus> = {
  unauthenticatedSecurity: "skipped",
  login: "skipped",
  dashboardNavigation: "skipped",
  qualityCaseWorkflow: "skipped",
  emailInvitations: "skipped",
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
  qualityCaseTitle,
  qualityCaseInternalNote,
  qualityCaseCommercialInfo,
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
  "QC smoke supplier observed an assembly mismatch and isolated the affected lot.",
  "QC smoke revised supplier response verified the requested process control.",
  "qc-smoke-supplier-evidence.pdf",
  "QC smoke human-confirmed supplier response summary.",
  "Please explain which process control prevents recurrence.",
  "Please attach a verification record linked to the improvement.",
  "QC smoke customer revision requested for the problem summary.",
  "QC smoke confirmed corrective action for customer review.",
  "QC smoke customer authorization confirmation.",
].filter(Boolean);

function toUrl(path: string) {
  return `${baseUrl}${path}`;
}

function markCheckForStep(stepName: string, status: SmokeCheckStatus) {
  if (stepName === "unauthenticated security") checks.unauthenticatedSecurity = status;
  if (stepName === "login") checks.login = status;
  if (stepName === "dashboard navigation" || stepName === "mobile navigation") checks.dashboardNavigation = status;
  if (stepName === "quality case workflow") checks.qualityCaseWorkflow = status;
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
    emailDeliveries,
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
  // Next dev can finish React hydration after DOMContentLoaded. Filling before
  // hydration lets React replace the DOM values, producing an empty 400 login.
  await page.waitForLoadState("networkidle");
  const email = page.getByLabel("Email");
  const password = page.getByLabel("Password");
  await email.fill(ownerEmail);
  await password.fill(ownerPassword);
  assert.equal(await email.inputValue(), ownerEmail, "Hydrated login email must retain the smoke identity.");
  assert.equal(await password.inputValue(), ownerPassword, "Hydrated login password must retain the smoke credential.");
  const authResponse = page.waitForResponse(
    (response) => response.url().includes("/api/auth/sign-in/email"),
    { timeout: 15000 },
  );
  await Promise.all([
    page.waitForURL(/\/dashboard/, { timeout: 15000 }),
    page.getByRole("button", { name: "Sign in" }).click(),
  ]);
  const response = await authResponse;
  assert.equal(response.status(), 200, `Smoke login must return 200, received ${response.status()}.`);
  await waitForBodyText(page, "Quality workbench");
}

async function jsonRequest(
  page: Page,
  path: string,
  method: "GET" | "POST" | "PUT",
  body?: Record<string, unknown>,
) {
  return page.evaluate(async ({ path: requestPath, method: requestMethod, body: requestBody }) => {
    const response = await fetch(requestPath, {
      method: requestMethod,
      headers: requestBody ? { "Content-Type": "application/json" } : undefined,
      body: requestBody ? JSON.stringify(requestBody) : undefined,
    });
    return {
      status: response.status,
      body: await response.json().catch(() => ({})),
    };
  }, { path, method, body });
}

function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

async function createExternalTask(page: Page, caseId: string, taskType: "supplier_response" | "customer_review", participantName: string) {
  const recipientEmail = taskType === "supplier_response"
    ? supplierInvitationEmail
    : customerInvitationEmail.replace("@", `+${++customerInvitationSequence}@`);
  const response = await jsonRequest(page, `/api/quality-cases/${caseId}/tasks`, "POST", {
    taskType,
    participantName,
    participantOrganization: taskType === "supplier_response" ? "QC Smoke Supplier" : "QC Smoke Customer",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    ...(verifyInvitationEmail ? { recipientEmail } : {}),
  });
  assert.equal(response.status, 201, `Creating a ${taskType} task must succeed.`);
  const token = record(response.body).token;
  if (typeof token !== "string") {
    throw new Error("External task creation did not return a one-time task token.");
  }
  if (verifyInvitationEmail) {
    assert.ok(recipientEmail, `A ${taskType} test mailbox is required when invitation email verification is enabled.`);
    assert.equal(record(response.body).emailDelivery, "sent", `${taskType} invitation must be accepted by Resend.`);
    const providerMessageId = record(response.body).providerMessageId;
    assert.equal(typeof providerMessageId, "string", `${taskType} invitation must return a Resend message id.`);
    emailDeliveries.push({ taskType, providerMessageId: String(providerMessageId) });
    checks.emailInvitations = "passed";
  }
  return token;
}

async function submitExternalTask(
  token: string,
  body: Record<string, unknown>,
) {
  const api = await request.newContext({ baseURL: baseUrl });
  try {
    const response = await api.post(`/api/quality-case-tasks/${encodeURIComponent(token)}`, { data: body });
    assert.equal(response.status(), 200, "External task submission must succeed.");
    return await response.json();
  } finally {
    await api.dispose();
  }
}

async function submitGuidedSupplierResponsePackage(
  token: string,
  mode: "guided" | "expert",
  answerText: string,
) {
  const api = await request.newContext({ baseURL: baseUrl });
  try {
    const guidanceResponse = await api.get(`/api/quality-case-tasks/${encodeURIComponent(token)}/guidance`);
    assert.equal(guidanceResponse.status(), 200, "A supplier token must create or resume its Guided Session.");
    const guidance = record(await guidanceResponse.json());
    const sessionId = guidance.sessionId;
    const question = record(guidance.question);
    if (typeof sessionId !== "string" || typeof question.id !== "string") {
      throw new Error("Supplier guidance did not return a scoped session and question.");
    }

    const answerResponse = await api.post(`/api/quality-case-tasks/${encodeURIComponent(token)}/guidance`, {
      data: { sessionId, questionId: question.id, answer: answerText },
    });
    assert.equal(answerResponse.status(), 200, "The supplier answer must be added to the Guided ledger.");

    const [{ db }, schema, drizzle, taskTokens, packageService] = await Promise.all([
      import("@/lib/db"),
      import("@/lib/db/schema"),
      import("drizzle-orm"),
      import("@/lib/quality-cases/task-tokens"),
      import("@/lib/quality-cases/supplier-response-package"),
    ]);
    const [task] = await db.select().from(schema.qualityCaseTaskLinks).where(drizzle.eq(schema.qualityCaseTaskLinks.tokenHash, taskTokens.hashQualityCaseTaskToken(token))).limit(1);
    assert.ok(task, "The token must resolve to a supplier task in the smoke database.");
    const [answer] = await db.select().from(schema.qualityCaseGuidanceAnswers).where(drizzle.eq(schema.qualityCaseGuidanceAnswers.sessionId, sessionId)).limit(1);
    assert.ok(answer, "The supplier answer must be persisted before packaging.");
    const aiRuns = await db.select().from(schema.qualityCaseGuidanceAiRuns).where(drizzle.eq(schema.qualityCaseGuidanceAiRuns.sessionId, sessionId));
    assert.ok(aiRuns.length > 0, "An Investigator Run audit must exist even when the provider is unavailable.");
    const [evidence] = await db.insert(schema.qualityCaseEvidence).values({
      caseId: task.caseId,
      uploadedByParticipantId: task.participantId,
      visibility: "internal",
      storagePath: `smoke/quality-cases/${task.caseId}/${crypto.randomUUID()}-evidence.pdf`,
      filename: "qc-smoke-supplier-evidence.pdf",
      mimeType: "application/pdf",
      fileSize: 128,
    }).returning();
    await db.insert(schema.qualityCaseGuidanceEvidenceRequirements).values({
      caseId: task.caseId,
      sessionId,
      questionId: answer.questionId,
      answerId: answer.id,
      aiRunId: aiRuns.at(-1)?.id || null,
      requirementKey: "supplier_smoke_record",
      sourceType: "smoke_fixture",
      reason: "Temporary smoke evidence must remain linked to the answer and investigation stage.",
      requirementSnapshot: { evidenceIds: [evidence.id] },
      status: "satisfied",
      satisfiedAt: new Date(),
    });

    const responsePackage = await packageService.buildSupplierResponsePackage({ token, sessionId });
    assert.equal(responsePackage.caseContext.taskId, task.id, "The package must remain scoped to the token task.");
    assert.ok(responsePackage.investigation.originalAnswers.some((item) => item.id === answer.id), "The package must include the original supplier answer.");
    assert.ok(responsePackage.investigation.aiRuns.length > 0, "The package must include Investigator Run provenance.");
    assert.ok(responsePackage.evidence.files.some((item) => item.id === evidence.id && item.requirementIds.length > 0), "The package must link evidence to a requirement and investigation stage.");
    assert.equal(responsePackage.readiness.advisoryOnly, true, "Readiness must remain advisory.");
    assert.equal(responsePackage.readiness.doesNotBlockSubmission, true, "Missing readiness data must not block supplier submission.");

    const submissionPayload = {
      action: "supplier_submit",
      sessionId,
      mode,
      confirmationText: "I confirm that these answers and evidence reflect the supplier investigation.",
    };
    const concurrentResponses = await Promise.all([
      api.post(`/api/quality-case-tasks/${encodeURIComponent(token)}`, { data: submissionPayload }),
      api.post(`/api/quality-case-tasks/${encodeURIComponent(token)}`, { data: submissionPayload }),
    ]);
    for (const response of concurrentResponses)
      assert.equal(response.status(), 200, "Concurrent Supplier Response Package submission must resolve idempotently.");
    const concurrentSubmissions = await Promise.all(
      concurrentResponses.map(async (response) => record(await response.json())),
    );
    assert.equal(
      concurrentSubmissions.filter((item) => item.alreadySubmitted === false).length,
      1,
      "Exactly one concurrent supplier submission may create the package audit.",
    );
    assert.equal(
      concurrentSubmissions.filter((item) => item.alreadySubmitted === true).length,
      1,
      "The racing supplier submission must return the committed package idempotently.",
    );
    const submission = concurrentSubmissions.find((item) => item.alreadySubmitted === false) || {};
    assert.equal(submission.status, "supplier_submitted", "Supplier submission must wait for internal review.");
    assert.equal(submission.alreadySubmitted, false, "The first package submission must create its audit records.");

    const confirmationsBeforeRetry = await db.select().from(schema.qualityCaseGuidanceConfirmations).where(drizzle.and(drizzle.eq(schema.qualityCaseGuidanceConfirmations.sessionId, sessionId), drizzle.eq(schema.qualityCaseGuidanceConfirmations.confirmationType, "supplier_response_package")));
    const auditsBeforeRetry = (await db.select().from(schema.qualityCaseActivities).where(drizzle.and(drizzle.eq(schema.qualityCaseActivities.caseId, task.caseId), drizzle.eq(schema.qualityCaseActivities.actionType, "supplier_submit")))).filter((activity) => record(activity.metadata).sessionId === sessionId);
    assert.equal(confirmationsBeforeRetry.length, 1, "Submission must create one Supplier Confirmation.");
    assert.equal(auditsBeforeRetry.length, 1, "Submission must create one supplier submission audit.");
    const confirmedSnapshot = record(confirmationsBeforeRetry[0].confirmedSnapshot);
    assert.equal(record(confirmedSnapshot.responsePackage).packageId, responsePackage.packageId, "The confirmation must retain the exact auditable package snapshot.");
    assert.equal(record(auditsBeforeRetry[0].metadata).packageId, responsePackage.packageId, "The workflow audit must reference the package id.");

    const retryResponse = await api.post(`/api/quality-case-tasks/${encodeURIComponent(token)}`, {
      data: {
        action: "supplier_submit",
        sessionId,
        mode,
        confirmationText: "Idempotent retry of the same supplier package.",
      },
    });
    assert.equal(retryResponse.status(), 200, "A supplier submission retry must be idempotent.");
    assert.equal(record(await retryResponse.json()).alreadySubmitted, true, "The retry must return the prior submission.");
    const confirmationsAfterRetry = await db.select().from(schema.qualityCaseGuidanceConfirmations).where(drizzle.and(drizzle.eq(schema.qualityCaseGuidanceConfirmations.sessionId, sessionId), drizzle.eq(schema.qualityCaseGuidanceConfirmations.confirmationType, "supplier_response_package")));
    const auditsAfterRetry = (await db.select().from(schema.qualityCaseActivities).where(drizzle.and(drizzle.eq(schema.qualityCaseActivities.caseId, task.caseId), drizzle.eq(schema.qualityCaseActivities.actionType, "supplier_submit")))).filter((activity) => record(activity.metadata).sessionId === sessionId);
    assert.equal(confirmationsAfterRetry.length, confirmationsBeforeRetry.length, "A retry must not duplicate Supplier Confirmation.");
    assert.equal(auditsAfterRetry.length, auditsBeforeRetry.length, "A retry must not duplicate Submission Audit.");
    return { sessionId, packageId: responsePackage.packageId };
  } finally {
    await api.dispose();
  }
}

async function verifyInternalQualityCoordinatorWorkspace(
  page: Page,
  caseId: string,
) {
  const initial = await jsonRequest(
    page,
    `/api/quality-cases/${caseId}/internal-review`,
    "GET",
  );
  assert.equal(initial.status, 200, "The coordinator must be able to open Internal Quality Review.");
  const initialBody = record(initial.body);
  const responsePackage = record(initialBody.package);
  assert.equal(
    responsePackage.schemaVersion,
    "supplier-response-package-v1",
    "Internal Review must read the submitted Supplier Response Package.",
  );
  assert.equal(
    record(initialBody.permissions).canReview,
    true,
    "The Case coordinator must have review permission.",
  );

  const started = await jsonRequest(
    page,
    `/api/quality-cases/${caseId}/internal-review`,
    "POST",
    { action: "start_internal_review" },
  );
  assert.equal(started.status, 200, "Starting Internal Review must be an explicit human action.");

  const reviewed = await jsonRequest(
    page,
    `/api/quality-cases/${caseId}/internal-review`,
    "POST",
    { action: "run_review" },
  );
  assert.equal(reviewed.status, 200, "AI Quality Review must persist an auditable Reviewer Run.");
  const review = record(record(reviewed.body).review);
  assert.equal(review.advisoryOnly, true, "AI Quality Review must remain advisory.");
  assert.equal(review.mayTransitionCase, false, "AI Quality Review must not transition the Case.");
  assert.ok(Array.isArray(review.findings), "AI Quality Review must return findings instead of a score.");

  const workspace = await jsonRequest(
    page,
    `/api/quality-cases/${caseId}/internal-review`,
    "GET",
  );
  assert.equal(workspace.status, 200, "The persisted quality review must be reloadable.");
  const workspaceBody = record(workspace.body);
  assert.equal(workspaceBody.reviewPersisted, true, "The Reviewer Run must be marked as persisted.");
  const mappings = Array.isArray(workspaceBody.mappings) ? workspaceBody.mappings : [];
  const mapping = mappings.map(record).find(
    (candidate) =>
      typeof candidate.id === "string" &&
      typeof candidate.semanticKey === "string",
  );
  assert.ok(mapping, "The coordinator must receive a semantic mapping suggestion.");
  const packageEvidence = record(record(workspaceBody.package).evidence);
  const evidenceIds = (Array.isArray(packageEvidence.files) ? packageEvidence.files : [])
    .map((file) => record(file).id)
    .filter((id): id is string => typeof id === "string");

  const confirmation = await jsonRequest(
    page,
    `/api/quality-cases/${caseId}/internal-review`,
    "POST",
    {
      action: "confirm_mapping",
      mappingId: mapping?.id,
      semanticKey: mapping?.semanticKey,
      confirmedText: "QC smoke human-confirmed supplier response summary.",
      language: "en",
      approvedEvidenceIds: evidenceIds,
      comment: "QC smoke coordinator confirmation.",
    },
  );
  assert.equal(confirmation.status, 200, "A coordinator must be able to confirm a mapping.");
  assert.equal(
    record(confirmation.body).reportWritePerformed,
    false,
    "Mapping confirmation must not write the legacy Report.",
  );

  const draftResponse = await jsonRequest(
    page,
    `/api/quality-cases/${caseId}/internal-review`,
    "POST",
    { action: "build_customer_draft", format: "english_email" },
  );
  assert.equal(draftResponse.status, 200, "Confirmed facts must be eligible for customer draft preparation.");
  const draft = record(draftResponse.body);
  assert.equal(draft.isDraft, true, "Customer preparation must be labeled as a draft.");
  assert.equal(draft.maySend, false, "The draft service must not send customer communication.");
  assert.match(
    String(draft.draft || ""),
    /human-confirmed supplier response summary/,
    "The draft must use the human-confirmed English mapping.",
  );

  const followUp = await jsonRequest(
    page,
    `/api/quality-cases/${caseId}/internal-review`,
    "POST",
    {
      action: "request_supplier_update",
      reason: "The response needs a system-control explanation and linked verification evidence.",
      questions: [
        "Please explain which process control prevents recurrence.",
        "Please attach a verification record linked to the improvement.",
      ],
      requestedFieldIds: ["occurrence_analysis", "effectiveness_verification"],
      dueAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    },
  );
  assert.equal(followUp.status, 200, "The coordinator must be able to request a supplier supplement.");
  const token = record(followUp.body).token;
  assert.equal(typeof token, "string", "The supplier follow-up must return a one-time task token.");

  const publicApi = await request.newContext({ baseURL: baseUrl });
  try {
    const guidanceResponse = await publicApi.get(
      `/api/quality-case-tasks/${encodeURIComponent(String(token))}/guidance`,
    );
    assert.equal(guidanceResponse.status(), 200, "The follow-up token must return to Guided supplier experience.");
    const guidance = record(await guidanceResponse.json());
    const supplierFollowUp = record(guidance.followUp);
    assert.ok(
      Array.isArray(supplierFollowUp.questions) && supplierFollowUp.questions.length === 2,
      "The supplier must see the coordinator's scoped follow-up questions.",
    );
    const publicText = JSON.stringify(guidance);
    assert.equal(publicText.includes(qualityCaseInternalNote), false, "Supplier follow-up must not leak internal notes.");
    assert.equal(publicText.includes(qualityCaseCommercialInfo), false, "Supplier follow-up must not leak commercial data.");
  } finally {
    await publicApi.dispose();
  }
  return String(token);
}

async function verifyQualityCaseWorkflow(page: Page) {
  await smokeStep("quality case workflow", async () => {
    const created = await jsonRequest(page, "/api/quality-cases", "POST", {
      title: qualityCaseTitle,
      coordinatorOrganization: "QC Smoke Coordinator",
      outputType: "scar",
      priority: "high",
      dueAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      caseData: {
        complaintSummary: "QC smoke complaint summary.",
        internalNotes: qualityCaseInternalNote,
        commercialInformation: qualityCaseCommercialInfo,
        aiRiskAssessment: "QC smoke AI risk assessment must remain internal.",
        otherSupplierData: "QC smoke other supplier data must remain internal.",
      },
    });
    assert.equal(created.status, 201, "An authenticated coordinator must create a Quality Case.");
    const caseId = record(created.body).id;
    if (typeof caseId !== "string") {
      throw new Error("Created Quality Case did not return an id.");
    }
    const supplierTask = await createExternalTask(page, caseId, "supplier_response", "QC Smoke Supplier User");
    const publicApi = await request.newContext({ baseURL: baseUrl });
    try {
      const projection = await publicApi.get(`/api/quality-case-tasks/${encodeURIComponent(supplierTask)}`);
      assert.equal(projection.status(), 200, "Supplier task must be available without an account.");
      const publicText = JSON.stringify(await projection.json());
      for (const internalValue of [
        qualityCaseInternalNote,
        qualityCaseCommercialInfo,
        "QC smoke AI risk assessment must remain internal.",
        "QC smoke other supplier data must remain internal.",
      ]) {
        assert.equal(publicText.includes(internalValue), false, "External supplier projection must omit internal Case data.");
      }
    } finally {
      await publicApi.dispose();
    }

    await submitGuidedSupplierResponsePackage(
      supplierTask,
      "guided",
      "QC smoke supplier observed an assembly mismatch and isolated the affected lot.",
    );
    const revisedSupplierTask = await verifyInternalQualityCoordinatorWorkspace(page, caseId);
    await submitGuidedSupplierResponsePackage(
      revisedSupplierTask,
      "expert",
      "QC smoke revised supplier response verified the requested process control.",
    );
    const restartReview = await jsonRequest(
      page,
      `/api/quality-cases/${caseId}/internal-review`,
      "POST",
      { action: "start_internal_review" },
    );
    assert.equal(restartReview.status, 200, "The revised supplier package must return to Internal Review.");
    const acceptForCustomer = await jsonRequest(
      page,
      `/api/quality-cases/${caseId}/internal-review`,
      "POST",
      { action: "accept_for_customer_preparation" },
    );
    assert.equal(acceptForCustomer.status, 200, "Only the coordinator can accept the response for customer preparation.");

    const unconfirmedCustomerTask = await jsonRequest(page, `/api/quality-cases/${caseId}/tasks`, "POST", {
      taskType: "customer_review",
      participantName: "QC Smoke Customer User",
      participantOrganization: "QC Smoke Customer",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
    assert.equal(unconfirmedCustomerTask.status, 400, "Customer review must be blocked until an English response is human-confirmed.");
    const confirmedText = await jsonRequest(page, `/api/quality-cases/${caseId}/texts`, "PUT", {
      fieldPath: "complaint_summary",
      original: { language: "zh-CN", text: "QC smoke 客户投诉摘要。" },
      aiTranslation: { language: "en", text: "QC smoke draft that must not be shared." },
      confirmedTranslation: { language: "en", text: "QC smoke human-confirmed customer complaint summary." },
    });
    assert.equal(confirmedText.status, 200, "A coordinator must save a human-confirmed customer summary before customer review.");
    const customerTask = await createExternalTask(page, caseId, "customer_review", "QC Smoke Customer User");
    const customerApi = await request.newContext({ baseURL: baseUrl });
    try {
      const projection = await customerApi.get(`/api/quality-case-tasks/${encodeURIComponent(customerTask)}`);
      assert.equal(projection.status(), 200, "Customer task must be available after a human confirms the English response.");
      const publicText = JSON.stringify(await projection.json());
      assert.equal(publicText.includes("QC smoke human-confirmed customer complaint summary."), true, "Customer projection must include the confirmed English response.");
      for (const unapprovedValue of [
        "QC smoke draft that must not be shared.",
        "QC smoke revised supplier response verified the requested process control.",
        qualityCaseInternalNote,
        qualityCaseCommercialInfo,
      ]) {
        assert.equal(publicText.includes(unapprovedValue), false, "Customer projection must omit AI drafts, supplier free-form text, and internal Case data.");
      }
    } finally {
      await customerApi.dispose();
    }
    await submitExternalTask(customerTask, {
      action: "request_customer_changes",
      fieldComments: [
        {
          fieldPath: "complaint_summary",
          comment: "QC smoke customer revision requested for the problem summary.",
        },
      ],
    });
    const returnedDetail = await jsonRequest(page, `/api/quality-cases/${caseId}`, "GET");
    const returnedActivities = record(returnedDetail.body).activities;
    assert.ok(Array.isArray(returnedActivities), "Customer feedback must be visible in the internal audit timeline.");
    const customerFeedbackActivity = returnedActivities
      .map(record)
      .find((activity) => activity.actionType === "request_customer_changes");
    const feedbackComments = record(customerFeedbackActivity?.metadata).fieldComments;
    assert.ok(
      Array.isArray(feedbackComments) &&
        record(feedbackComments[0]).fieldPath === "complaint_summary",
      "Customer feedback must retain its field, comment, actor context, and Case version.",
    );

    const returnedToReview = await jsonRequest(
      page,
      `/api/quality-cases/${caseId}/workflow`,
      "POST",
      { action: "start_internal_review" },
    );
    assert.equal(returnedToReview.status, 200, "Customer feedback must return to Internal Review.");
    const reviewWorkspace = await jsonRequest(
      page,
      `/api/quality-cases/${caseId}/internal-review`,
      "GET",
    );
    assert.equal(reviewWorkspace.status, 200, "The coordinator must be able to review customer feedback.");
    const reviewBody = record(reviewWorkspace.body);
    const reviewMappings = Array.isArray(reviewBody.mappings)
      ? reviewBody.mappings.map(record)
      : [];
    const mappingForCustomer = reviewMappings.find(
      (mapping) =>
        typeof mapping.id === "string" &&
        typeof mapping.semanticKey === "string",
    );
    assert.ok(mappingForCustomer, "The revised supplier package must expose a mapping for confirmation.");
    const reviewEvidence = record(record(reviewBody.package).evidence);
    const approvedEvidenceIds = (Array.isArray(reviewEvidence.files)
      ? reviewEvidence.files
      : [])
      .map((file) => record(file).id)
      .filter((id): id is string => typeof id === "string");
    const confirmedMapping = await jsonRequest(
      page,
      `/api/quality-cases/${caseId}/internal-review`,
      "POST",
      {
        action: "confirm_mapping",
        mappingId: mappingForCustomer?.id,
        semanticKey: mappingForCustomer?.semanticKey,
        confirmedText: "QC smoke confirmed corrective action for customer review.",
        language: "en",
        approvedEvidenceIds,
        comment: "QC smoke customer authorization confirmation.",
      },
    );
    assert.equal(confirmedMapping.status, 200, "Only a human-confirmed mapping may enter the customer snapshot.");
    const readyAgain = await jsonRequest(
      page,
      `/api/quality-cases/${caseId}/workflow`,
      "POST",
      { action: "mark_ready_for_customer" },
    );
    assert.equal(readyAgain.status, 200, "The coordinator must explicitly return the Case to customer preparation.");

    const finalCustomerTask = await createExternalTask(page, caseId, "customer_review", "QC Smoke Customer User");
    const finalCustomerApi = await request.newContext({ baseURL: baseUrl });
    try {
      const projectionResponse = await finalCustomerApi.get(
        `/api/quality-case-tasks/${encodeURIComponent(finalCustomerTask)}`,
      );
      assert.equal(projectionResponse.status(), 200, "The revised customer snapshot must be available.");
      const projection = record(await projectionResponse.json());
      const projectedResponse = record(record(projection.projection).customer_response);
      const projectedEvidence = record(projection.projection).customer_evidence;
      assert.ok(Array.isArray(projectedResponse.sections), "Customer Review must expose structured confirmed sections.");
      assert.equal(
        JSON.stringify(projectedResponse).includes("QC smoke confirmed corrective action for customer review."),
        true,
        "The revised snapshot must include the human-confirmed mapping.",
      );
      assert.ok(
        Array.isArray(projectedEvidence) && projectedEvidence.length > 0,
        "Only coordinator-authorized evidence must appear in the customer snapshot.",
      );
    } finally {
      await finalCustomerApi.dispose();
    }
    await submitExternalTask(finalCustomerTask, { action: "customer_accept" });

    let detail = await jsonRequest(page, `/api/quality-cases/${caseId}`, "GET");
    assert.equal(detail.status, 200, "Coordinator must retain access to the Quality Case.");
    assert.equal(record(record(detail.body).qualityCase).status, "customer_accepted", "Customer acceptance must not close the Case.");

    const plan = await jsonRequest(page, `/api/quality-cases/${caseId}/verification`, "POST", { action: "save_plan", plan: { method: "Leak test and outgoing inspection review", description: "Validate three consecutive lots", ownerName: "QC Smoke Coordinator", organization: "QC Smoke Organization", plannedStartAt: "2026-07-12", plannedEndAt: "2026-07-20", dueAt: "2026-07-22", sampleSize: 1500, sampleScope: "Three consecutive lots, 500 parts per lot across two lines", acceptanceCriteria: "100% leak-test pass and no repeated defect" } });
    assert.equal(plan.status, 200, "Customer Accepted must enter verification planning, not Closed.");
    assert.equal((await jsonRequest(page, `/api/quality-cases/${caseId}/verification`, "POST", { action: "start_execution" })).status, 200);
    assert.equal((await jsonRequest(page, `/api/quality-cases/${caseId}/verification`, "POST", { action: "save_execution", execution: { executorName: "QC Smoke Supplier QE", executorOrganization: "QC Smoke Supplier", executionStartAt: "2026-07-12", executionEndAt: "2026-07-20", actualScope: "Three consecutive lots across two lines", executionNotes: "Executed per approved plan", resultSummary: "All 1500 parts passed", actualSampleSize: 1500, passFail: "pass", criteriaComparison: "Meets 100% pass criterion" } })).status, 200);
    const verificationEvidence = await page.evaluate(async (path) => {
      const form = new FormData();
      form.append("file", new File(["QC smoke verification evidence"], "verification-smoke.pdf", { type: "application/pdf" }));
      form.append("evidenceType", "test_report");
      form.append("description", "QC smoke linked verification report");
      const response = await fetch(path, { method: "POST", body: form });
      return { status: response.status, body: await response.json().catch(() => ({})) };
    }, `/api/quality-cases/${caseId}/verification/evidence`);
    assert.equal(verificationEvidence.status, 201, "Verification evidence must upload and link to the current result.");
    assert.equal((await jsonRequest(page, `/api/quality-cases/${caseId}/verification`, "POST", { action: "submit" })).status, 200);
    assert.equal((await jsonRequest(page, `/api/quality-cases/${caseId}/verification`, "POST", { action: "review", decision: "approved", comment: "QC smoke evidence meets the acceptance criteria." })).status, 200);
    assert.equal((await jsonRequest(page, `/api/quality-cases/${caseId}/verification`, "POST", { action: "close", comment: "QC smoke verification approved and traceable." })).status, 200);
    assert.equal((await jsonRequest(page, `/api/quality-cases/${caseId}/workflow`, "POST", { action: "reopen_case", comment: "QC smoke recurrence path." })).status, 200);

    detail = await jsonRequest(page, `/api/quality-cases/${caseId}`, "GET");
    const detailBody = record(detail.body);
    assert.equal(record(detailBody.qualityCase).status, "reopened", "An authorized coordinator must be able to reopen a closed Case.");
    const actions = record(detailBody).activities;
    assert.ok(Array.isArray(actions), "Case detail must return an auditable activity timeline.");
    for (const action of [
      "supplier_submit",
      "request_supplier_changes",
      "request_customer_changes",
      "customer_accept",
      "start_effectiveness_verification",
      "start_verification_execution",
      "submit_verification",
      "start_verification_review",
      "approve_verification",
      "close_case",
      "reopen_case",
    ]) {
      assert.ok(actions.some((activity) => record(activity).actionType === action), `Activity timeline must record ${action}.`);
    }

    // Failure recovery uses the already reopened Case. The direct status setup
    // represents completion of a new supplier/customer investigation cycle;
    // all verification transitions themselves still go through public APIs.
    const [{ db }, schema, drizzle] = await Promise.all([
      import("@/lib/db"),
      import("@/lib/db/schema"),
      import("drizzle-orm"),
    ]);
    await db.update(schema.qualityCases).set({
      status: "customer_accepted",
      waitingOn: "internal",
      nextAction: "RC fixture: new investigation cycle received customer acceptance.",
      updatedAt: new Date(),
    }).where(drizzle.eq(schema.qualityCases.id, caseId));
    const failurePlan = {
      action: "save_plan",
      plan: {
        method: "Repeat production validation after recurrence",
        description: "RC failure recovery cycle",
        ownerName: "QC Smoke Coordinator",
        organization: "QC Smoke Organization",
        plannedStartAt: "2026-07-23",
        plannedEndAt: "2026-07-25",
        dueAt: "2026-07-26",
        sampleSize: 300,
        sampleScope: "Three production shifts, 100 parts per shift",
        acceptanceCriteria: "No repeated defect in all 300 parts",
      },
    };
    assert.equal((await jsonRequest(page, `/api/quality-cases/${caseId}/verification`, "POST", failurePlan)).status, 200);
    assert.equal((await jsonRequest(page, `/api/quality-cases/${caseId}/verification`, "POST", { action: "start_execution" })).status, 200);
    assert.equal((await jsonRequest(page, `/api/quality-cases/${caseId}/verification`, "POST", { action: "save_execution", execution: { executorName: "QC Smoke Supplier QE", executorOrganization: "QC Smoke Supplier", executionStartAt: "2026-07-23", executionEndAt: "2026-07-25", actualScope: "Three production shifts", executionNotes: "A recurrence was observed during the third shift", resultSummary: "One repeated defect found", actualSampleSize: 300, passFail: "fail", criteriaComparison: "Failed the no-recurrence criterion" } })).status, 200);
    assert.equal((await jsonRequest(page, `/api/quality-cases/${caseId}/verification`, "POST", { action: "submit" })).status, 200);
    assert.equal((await jsonRequest(page, `/api/quality-cases/${caseId}/verification`, "POST", { action: "review", decision: "failed", comment: "Repeated defect proves the action was ineffective." })).status, 200);
    const failedWorkspace = await jsonRequest(page, `/api/quality-cases/${caseId}/verification`, "GET");
    assert.equal(record(record(record(failedWorkspace.body).access).qualityCase).status, "reopened", "Failed verification must reopen investigation.");
    const failedCycles = Array.isArray(record(failedWorkspace.body).cycles) ? record(failedWorkspace.body).cycles as unknown[] : [];
    assert.ok(failedCycles.map(record).some((cycle) => cycle.cycleNumber === 1 && cycle.status === "verified_effective"), "The prior effective cycle must remain immutable history.");
    assert.ok(failedCycles.map(record).some((cycle) => cycle.cycleNumber === 2 && cycle.status === "verification_failed"), "The failed cycle must remain in the ledger.");

    await db.update(schema.qualityCases).set({
      status: "customer_accepted",
      waitingOn: "internal",
      nextAction: "RC fixture: replacement investigation accepted.",
      updatedAt: new Date(),
    }).where(drizzle.eq(schema.qualityCases.id, caseId));
    assert.equal((await jsonRequest(page, `/api/quality-cases/${caseId}/verification`, "POST", failurePlan)).status, 200);
    const replacementWorkspace = await jsonRequest(page, `/api/quality-cases/${caseId}/verification`, "GET");
    const replacementCycles = Array.isArray(record(replacementWorkspace.body).cycles) ? record(replacementWorkspace.body).cycles as unknown[] : [];
    assert.ok(replacementCycles.map(record).some((cycle) => cycle.cycleNumber === 3 && cycle.status === "verification_planning"), "Recovery must create a new cycle without overwriting failed history.");
  });
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
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const nameInput = page.getByRole("textbox", { name: "Name", exact: true });
    await runAndWaitForEvent(events, "template_setup_form_started", async () => {
      await nameInput.click();
    });
    await nameInput.fill("Revenue Smoke");
    await page.getByRole("textbox", { name: "Company name", exact: true }).fill("Revenue Smoke Manufacturing");
    await page.getByRole("textbox", { name: "Work email", exact: true }).fill("revenue-smoke@example.test");
    await page.getByRole("textbox", { name: "Role", exact: true }).fill("Quality Manager");
    await page.getByLabel("Current process").selectOption("Word/Excel");
    await page.getByLabel("Use case").selectOption("SCAR");
    await page.getByLabel("Timeline").selectOption("This week");
    await page.getByRole("checkbox", { name: "PDF", exact: true }).check();
    await page.getByRole("checkbox", { name: "Word", exact: true }).check();
    await page.getByRole("checkbox", { name: "Excel", exact: true }).check();
    await page.getByRole("checkbox", { name: "ZIP", exact: true }).check();
    await page.getByLabel("Message").fill("Need customer-ready SCAR format for a line complaint this week.");
    await page.locator('input[name="files"]').setInputFiles({
      name: "revenue-smoke-template.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4\n% revenue smoke template\n"),
    });

    const event = await runAndWaitForEvent(events, "template_setup_form_submitted", async () => {
      await page.getByRole("button", { name: "Submit setup request" }).click();
      await waitForBodyText(page, "Request received.");
      if (!hasSmokeObjectStorage)
        await waitForBodyText(page, "file upload could not be completed", { caseInsensitive: true });
    });
    assert.equal(event.metadata.requestType, "template_setup", "Template setup smoke should submit the template_setup request type");
    assert.equal(event.metadata.hasFile, true, "Template setup smoke should include a file attempt");
    assert.equal(
      event.metadata.fileUploadWarning,
      !hasSmokeObjectStorage,
      "Template setup smoke upload metadata must reflect whether isolated object storage is available",
    );
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

  await smokeStep("ai quality check knowledge context environment-aware result", async () => {
    await page.goto(toUrl(`/reports/${completedReportId}`), { waitUntil: "domcontentloaded" });
    const aiTrigger = page.getByRole("button", { name: /^AI$/ });
    await aiTrigger.waitFor({ timeout: 12000 });

    const startIndex = events.length;
    await aiTrigger.click();
    await waitForBodyText(page, "AI Quality Check — Beta");
    const responsePromise = page.waitForResponse((response) =>
      response.url().includes("/api/ai/report-review") && response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Review report" }).click();
    const reviewResponse = await responsePromise;
    const providerAvailable = reviewResponse.ok();
    if (aiQualityCheckExpectation === "available")
      assert.equal(providerAvailable, true, "AI Quality Check must succeed when SMOKE_AI_EXPECTATION=available.");
    if (aiQualityCheckExpectation === "unavailable")
      assert.equal(providerAvailable, false, "AI Quality Check must use the safe fallback when SMOKE_AI_EXPECTATION=unavailable.");
    if (providerAvailable) {
      await waitForBodyText(page, "AI Quality Check result", { timeout: 20000 });
    } else {
      assert.equal(reviewResponse.status(), 503, "Unavailable AI Quality Check must return the safe 503 fallback.");
      await waitForBodyText(page, "AI Quality Check is temporarily unavailable. Your report is safely saved. Please try again later.", {
        timeout: 20000,
      });
    }
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
    await verifyQualityCaseWorkflow(page);
    if (process.env.SMOKE_SCOPE === "quality-case") {
      await context.close();
      return {
        events: capturedEvents.map((event) => event.eventName),
        eventCount: capturedEvents.length,
      };
    }
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
