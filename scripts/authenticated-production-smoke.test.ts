import assert from "node:assert/strict";

const baseUrl = (process.env.AUTH_SMOKE_BASE_URL || process.env.PRODUCTION_BASE_URL || "https://www.8d-reports.com").replace(/\/$/, "");
const reportId = process.env.AUTH_SMOKE_REPORT_ID || "";
const mutate = process.env.AUTH_SMOKE_MUTATE === "true";

const roles = {
  owner: process.env.AUTH_SMOKE_OWNER_COOKIE || "",
  editor: process.env.AUTH_SMOKE_EDITOR_COOKIE || "",
  viewer: process.env.AUTH_SMOKE_VIEWER_COOKIE || "",
} as const;

type RoleName = keyof typeof roles;

function requireEnv(name: string, value: string) {
  assert.ok(value.trim(), `${name} is required`);
}

async function request(role: RoleName, path: string, init: RequestInit = {}) {
  const cookie = roles[role];
  const headers = new Headers(init.headers);
  headers.set("Cookie", cookie);
  if (init.body && !headers.has("Content-Type") && typeof init.body === "string") {
    headers.set("Content-Type", "application/json");
  }
  return fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
    redirect: "manual",
  });
}

async function json(role: RoleName, path: string, init: RequestInit = {}) {
  const response = await request(role, path, init);
  const data = await response.json().catch(() => null);
  return { response, data };
}

function expectStatus(response: Response, expected: number, label: string) {
  assert.equal(response.status, expected, `${label} expected ${expected}, got ${response.status}`);
}

async function expectReportPermissions() {
  const expected = {
    owner: { role: "owner", canEdit: true, canManageWorkflow: true, canShare: true, canExportDraft: true },
    editor: { role: "editor", canEdit: true, canManageWorkflow: false, canShare: true, canExportDraft: true },
    viewer: { role: "viewer", canEdit: false, canManageWorkflow: false, canShare: false, canExportDraft: false },
  } as const;

  for (const role of Object.keys(roles) as RoleName[]) {
    const { response, data } = await json(role, `/api/reports/${reportId}`);
    expectStatus(response, 200, `${role} report access`);
    for (const [key, value] of Object.entries(expected[role])) {
      assert.equal(data?.permissions?.[key], value, `${role} permission ${key}`);
    }
  }
}

async function expectTeamAccess() {
  for (const role of Object.keys(roles) as RoleName[]) {
    const { response, data } = await json(role, "/api/team");
    expectStatus(response, 200, `${role} team access`);
    assert.equal(data?.plan, "team", `${role} should be under active Team plan`);
    assert.ok(data?.team, `${role} should see a Team workspace`);
    assert.equal(data?.team?.role, role, `${role} should see its Team role`);
  }
}

async function expectViewerDeniedPaths() {
  const writeBody = JSON.stringify({
    title: "Viewer should not edit this report",
    data: { problemSource: "viewer-smoke-denied" },
  });

  const deniedChecks: Array<[string, Promise<Response>]> = [
    ["viewer report update", request("viewer", `/api/reports/${reportId}`, { method: "PUT", body: writeBody })],
    ["viewer workflow transition", request("viewer", `/api/reports/${reportId}/workflow`, { method: "POST", body: JSON.stringify({ workflowStatus: "internal_review" }) })],
    ["viewer share create", request("viewer", `/api/reports/${reportId}/share`, { method: "POST", body: JSON.stringify({ permissionLevel: "view" }) })],
    ["viewer attachment create", request("viewer", `/api/reports/${reportId}/attachments`, { method: "POST", body: JSON.stringify({ storagePath: "smoke/noop.txt", url: "https://example.com/noop.txt", filename: "noop.txt", fileType: "file", mimeType: "text/plain", fileSize: 4, stepId: "D2" }) })],
    ["viewer export activity", request("viewer", `/api/reports/${reportId}/activity`, { method: "POST", body: JSON.stringify({ format: "pdf" }) })],
    ["viewer docx export", request("viewer", `/api/reports/${reportId}/export/docx`, { method: "POST", body: JSON.stringify({ locale: "en" }) })],
  ];

  for (const [label, pending] of deniedChecks) {
    const response = await pending;
    assert.ok([403, 404].includes(response.status), `${label} should be denied with 403/404, got ${response.status}`);
  }
}

async function expectEditorBoundaries() {
  const workflow = await request("editor", `/api/reports/${reportId}/workflow`, {
    method: "POST",
    body: JSON.stringify({ workflowStatus: "approved" }),
  });
  expectStatus(workflow, 403, "editor workflow transition");
}

async function expectMutationFlow() {
  assert.equal(mutate, true, "Mutation flow requires AUTH_SMOKE_MUTATE=true");

  const before = await json("owner", `/api/reports/${reportId}`);
  expectStatus(before.response, 200, "owner report before mutation");
  const currentRevision = Number(before.data?.revision || 0);

  const toReview = await request("owner", `/api/reports/${reportId}/workflow`, {
    method: "POST",
    body: JSON.stringify({ workflowStatus: "internal_review" }),
  });
  expectStatus(toReview, 200, "owner can move report to Internal Review");

  const toApproved = await request("owner", `/api/reports/${reportId}/workflow`, {
    method: "POST",
    body: JSON.stringify({ workflowStatus: "approved" }),
  });
  expectStatus(toApproved, 200, "owner can approve and lock report");

  const lockedEdit = await request("editor", `/api/reports/${reportId}`, {
    method: "PUT",
    body: JSON.stringify({ title: "Editor should not edit locked report" }),
  });
  expectStatus(lockedEdit, 403, "editor cannot edit locked report");

  const unlock = await json("owner", `/api/reports/${reportId}/workflow`, {
    method: "POST",
    body: JSON.stringify({ action: "unlock", reason: "Authenticated smoke test verifies revision unlock flow." }),
  });
  expectStatus(unlock.response, 200, "owner can unlock with reason");
  assert.equal(Number(unlock.data?.revision || 0), currentRevision + 1, "unlock should increment revision");

  const activity = await json("owner", `/api/reports/${reportId}/activity`);
  expectStatus(activity.response, 200, "owner can read activity");
  const actions = Array.isArray(activity.data) ? activity.data.map((row) => row.actionType) : [];
  assert.ok(actions.includes("report_approved_or_locked"), "activity should include approval/lock");
  assert.ok(actions.includes("report_unlocked"), "activity should include unlock reason");
}

async function main() {
  requireEnv("AUTH_SMOKE_REPORT_ID", reportId);
  requireEnv("AUTH_SMOKE_OWNER_COOKIE", roles.owner);
  requireEnv("AUTH_SMOKE_EDITOR_COOKIE", roles.editor);
  requireEnv("AUTH_SMOKE_VIEWER_COOKIE", roles.viewer);

  await expectTeamAccess();
  await expectReportPermissions();
  await expectViewerDeniedPaths();
  await expectEditorBoundaries();
  if (mutate) await expectMutationFlow();

  console.log(`Authenticated production smoke verification passed for ${baseUrl}${mutate ? " with mutation checks" : " without mutation checks"}`);
}

void main();
