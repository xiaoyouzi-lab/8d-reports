import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";

const baseUrl = (process.env.SMOKE_BASE_URL || "").replace(/\/$/, "");
const shareUrl = process.env.SMOKE_VERCEL_SHARE_URL || baseUrl;
const resultPath = process.env.SMOKE_EMAIL_RESULT_PATH || "output/rc2/email-smoke.json";
const ownerEmail = process.env.SMOKE_OWNER_EMAIL || "smoke-owner@example.test";
const ownerPassword = process.env.SMOKE_OWNER_PASSWORD || "SmokeTest#2026!";
const supplierEmail = process.env.SMOKE_SUPPLIER_INVITATION_EMAIL || "delivered+rc2-supplier@resend.dev";
const customerEmail = process.env.SMOKE_CUSTOMER_INVITATION_EMAIL || "delivered+rc2-customer@resend.dev";
const previewBypassSecret = process.env.SMOKE_VERCEL_BYPASS_SECRET || "";

assert.ok(baseUrl.startsWith("https://"), "SMOKE_BASE_URL must be an HTTPS Preview URL.");

type Json = Record<string, unknown>;
function record(value: unknown): Json {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Json : {};
}

async function api(page: import("playwright").Page, path: string, method: "GET" | "POST" | "PUT" | "DELETE", body?: Json) {
  return page.evaluate(async ({ path, method, body }) => {
    const response = await fetch(path, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: response.status, body: await response.json().catch(() => ({})) };
  }, { path, method, body });
}

async function waitForDelivery(page: import("playwright").Page, id: string) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const response = await api(page, `/api/debug/email-status/${encodeURIComponent(id)}`, "GET");
    const event = String(record(response.body).lastEvent || "");
    if (event === "delivered") return event;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error("Resend did not report delivered within the Preview smoke window.");
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const checks: Record<string, boolean> = {};
  const providerMessageIds: string[] = [];
  try {
    const context = await browser.newContext({
      extraHTTPHeaders: previewBypassSecret
        ? { "x-vercel-protection-bypass": previewBypassSecret }
        : {},
    });
    const page = await context.newPage();
    await page.goto(shareUrl, { waitUntil: "domcontentloaded" });
    await page.goto(`${baseUrl}/login`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    const email = page.getByLabel("Email");
    const password = page.getByLabel("Password");
    await email.fill(ownerEmail);
    await password.fill(ownerPassword);
    assert.equal(await email.inputValue(), ownerEmail);
    assert.equal(await password.inputValue(), ownerPassword);
    const authResponse = page.waitForResponse(
      (response) => response.url().includes("/api/auth/sign-in/email"),
      { timeout: 20000 },
    );
    await page.getByRole("button", { name: "Sign in" }).click();
    assert.equal((await authResponse).status(), 200, "Preview smoke login must succeed.");
    await page.waitForURL(/\/dashboard/, { timeout: 20000 });

    const createCase = async (title: string) => api(page, "/api/quality-cases", "POST", {
      title,
      coordinatorOrganization: "RC-2 Preview Coordinator",
      outputType: "scar",
      priority: "high",
      dueAt: new Date(Date.now() + 10 * 86400000).toISOString(),
      caseData: { complaintSummary: "RC-2 Preview test complaint", internalNotes: "must remain internal" },
    });
    const createTask = async (caseId: string, taskType: "supplier_response" | "customer_review", recipientEmail: string) => {
      const response = await api(page, `/api/quality-cases/${caseId}/tasks`, "POST", {
        taskType,
        participantName: taskType === "supplier_response" ? "RC-2 Supplier" : "RC-2 Customer",
        participantOrganization: taskType === "supplier_response" ? "RC-2 Supplier Org" : "RC-2 Customer Org",
        recipientEmail,
        expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      });
      assert.equal(response.status, 201);
      assert.equal(record(response.body).emailDelivery, "sent");
      assert.equal(typeof record(response.body).providerMessageId, "string");
      providerMessageIds.push(String(record(response.body).providerMessageId));
      return record(response.body);
    };

    const mainCase = await createCase("RC-2 Preview Email Main Flow");
    assert.equal(mainCase.status, 201);
    const mainCaseId = String(record(mainCase.body).id);
    const supplierTask = await createTask(mainCaseId, "supplier_response", supplierEmail);
    const supplierToken = String(supplierTask.token);
    await page.goto(`${baseUrl}/supplier/${encodeURIComponent(supplierToken)}`, { waitUntil: "domcontentloaded" });
    await page.getByText("质量整改助手").waitFor({ timeout: 15000 });
    checks.supplierLinkOpened = true;

    const supplierProjection = await api(page, `/api/quality-case-tasks/${encodeURIComponent(supplierToken)}`, "GET");
    assert.equal(supplierProjection.status, 200);
    assert.equal(JSON.stringify(supplierProjection.body).includes("must remain internal"), false);
    checks.supplierTokenScope = true;

    const guidance = await api(page, `/api/quality-case-tasks/${encodeURIComponent(supplierToken)}/guidance`, "GET");
    assert.equal(guidance.status, 200);
    const sessionId = String(record(guidance.body).sessionId);
    const questionId = String(record(record(guidance.body).question).id);
    const answer = await api(page, `/api/quality-case-tasks/${encodeURIComponent(supplierToken)}/guidance`, "POST", {
      sessionId,
      questionId,
      answer: "RC-2 supplier isolated the affected lot and recorded the observed mismatch.",
    });
    assert.equal(answer.status, 200);
    const submitted = await api(page, `/api/quality-case-tasks/${encodeURIComponent(supplierToken)}`, "POST", {
      action: "supplier_submit",
      sessionId,
      mode: "guided",
      confirmationText: "I confirm this RC-2 Preview response is accurate to the best of my knowledge.",
    });
    assert.equal(submitted.status, 200);
    assert.equal((await api(page, `/api/quality-cases/${mainCaseId}/internal-review`, "POST", { action: "start_internal_review" })).status, 200);
    assert.equal((await api(page, `/api/quality-cases/${mainCaseId}/internal-review`, "POST", { action: "accept_for_customer_preparation" })).status, 200);
    assert.equal((await api(page, `/api/quality-cases/${mainCaseId}/texts`, "PUT", {
      fieldPath: "complaint_summary",
      original: { language: "zh-CN", text: "RC-2 Preview 客户投诉摘要" },
      aiTranslation: { language: "en", text: "Unconfirmed AI draft" },
      confirmedTranslation: { language: "en", text: "Human-confirmed RC-2 Preview complaint summary." },
    })).status, 200);
    const customerTask = await createTask(mainCaseId, "customer_review", customerEmail);
    const customerToken = String(customerTask.token);
    await page.goto(`${baseUrl}/customer-review/${encodeURIComponent(customerToken)}`, { waitUntil: "domcontentloaded" });
    await page.getByText("Supplier Corrective Action Response").first().waitFor({ timeout: 15000 });
    checks.customerLinkOpened = true;
    const customerProjection = await api(page, `/api/quality-case-tasks/${encodeURIComponent(customerToken)}`, "GET");
    assert.equal(customerProjection.status, 200);
    const customerText = JSON.stringify(customerProjection.body);
    assert.equal(customerText.includes("Human-confirmed RC-2 Preview complaint summary."), true);
    assert.equal(customerText.includes("Unconfirmed AI draft"), false);
    assert.equal(customerText.includes("must remain internal"), false);
    checks.customerTokenScope = true;

    const revokedCase = await createCase("RC-2 Preview Revoked Token");
    const revokedCaseId = String(record(revokedCase.body).id);
    const revokedTask = await createTask(revokedCaseId, "supplier_response", "delivered+rc2-revoked@resend.dev");
    assert.equal((await api(page, `/api/quality-cases/${revokedCaseId}/tasks/${String(revokedTask.taskId)}`, "DELETE")).status, 200);
    assert.equal((await api(page, `/api/quality-case-tasks/${encodeURIComponent(String(revokedTask.token))}`, "GET")).status, 404);
    checks.revokedTokenRejected = true;

    const expiredCase = await createCase("RC-2 Preview Expired Token");
    const expiredCaseId = String(record(expiredCase.body).id);
    const expiredTask = await createTask(expiredCaseId, "supplier_response", "delivered+rc2-expired@resend.dev");
    assert.equal(
      (await api(page, `/api/debug/quality-case-task-expire/${String(expiredTask.taskId)}`, "POST")).status,
      200,
    );
    assert.equal((await api(page, `/api/quality-case-tasks/${encodeURIComponent(String(expiredTask.token))}`, "GET")).status, 404);
    checks.expiredTokenRejected = true;

    for (const id of providerMessageIds) assert.equal(await waitForDelivery(page, id), "delivered");
    checks.resendDelivered = true;
    await context.close();
  } finally {
    await browser.close();
  }

  const result = {
    environment: "vercel-preview",
    deploymentHost: new URL(baseUrl).hostname,
    checks,
    emailCount: providerMessageIds.length,
    providerMessageIds,
    completedAt: new Date().toISOString(),
  };
  await mkdir(resultPath.split("/").slice(0, -1).join("/"), { recursive: true });
  await writeFile(resultPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(result, null, 2));
}

void main();
