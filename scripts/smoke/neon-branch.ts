import { requireEnv, maskGithubSecret, summarizeDatabaseUrl, writeGithubEnv } from "./smoke-safety";

const NEON_API_BASE = "https://console.neon.tech/api/v2";
const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 180000;

interface NeonOperation {
  id: string;
  status?: string;
}

interface NeonBranch {
  id: string;
  name: string;
}

interface NeonConnectionUri {
  connection_uri?: string;
  database?: string;
  database_name?: string;
}

interface NeonCreateBranchResponse {
  branch?: NeonBranch;
  operations?: NeonOperation[];
  connection_uris?: NeonConnectionUri[];
}

interface NeonOperationResponse {
  operation?: NeonOperation;
}

function headers(apiKey: string) {
  return {
    Accept: "application/json",
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

async function neonFetch<T>(path: string, init: RequestInit, apiKey: string) {
  const response = await fetch(`${NEON_API_BASE}${path}`, {
    ...init,
    headers: {
      ...headers(apiKey),
      ...(init.headers || {}),
    },
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) as T : {} as T;

  if (!response.ok) {
    const message = typeof data === "object" && data && "message" in data
      ? String((data as { message?: unknown }).message)
      : `Neon API request failed with ${response.status}`;
    throw new Error(message);
  }

  return data;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForOperation(projectId: string, operationId: string, apiKey: string) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < POLL_TIMEOUT_MS) {
    const data = await neonFetch<NeonOperationResponse>(
      `/projects/${projectId}/operations/${operationId}`,
      { method: "GET" },
      apiKey,
    );
    const status = data.operation?.status || "unknown";

    if (status === "finished" || status === "skipped") return;
    if (status === "failed" || status === "cancelled") {
      throw new Error(`Neon operation ${operationId} ended with status ${status}.`);
    }

    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error(`Timed out waiting for Neon operation ${operationId}.`);
}

function selectConnectionUri(response: NeonCreateBranchResponse, databaseName: string) {
  const uris = response.connection_uris || [];
  const selected = uris.find((uri) => uri.database === databaseName || uri.database_name === databaseName) || uris[0];
  if (!selected?.connection_uri) {
    throw new Error("Neon did not return a connection URI for the temporary branch.");
  }
  return selected.connection_uri;
}

async function createBranch() {
  const apiKey = requireEnv("NEON_API_KEY");
  const projectId = requireEnv("NEON_PROJECT_ID");
  const parentBranchId = requireEnv("NEON_PARENT_BRANCH_ID");
  const databaseName = requireEnv("NEON_DATABASE_NAME");
  const branchName = requireEnv("NEON_BRANCH_NAME");

  if (!/auth-smoke|smoke/i.test(branchName)) {
    throw new Error("NEON_BRANCH_NAME must clearly identify a smoke branch.");
  }

  const response = await neonFetch<NeonCreateBranchResponse>(
    `/projects/${projectId}/branches`,
    {
      method: "POST",
      body: JSON.stringify({
        endpoints: [{ type: "read_write" }],
        branch: {
          name: branchName,
          parent_id: parentBranchId,
        },
      }),
    },
    apiKey,
  );

  const branch = response.branch;
  if (!branch?.id || !branch.name) {
    throw new Error("Neon did not return temporary branch metadata.");
  }

  if (branch.id === parentBranchId) {
    throw new Error("Refusing to use parent branch as the authenticated smoke branch.");
  }

  for (const operation of response.operations || []) {
    await waitForOperation(projectId, operation.id, apiKey);
  }

  const connectionUri = selectConnectionUri(response, databaseName);
  maskGithubSecret(connectionUri);

  process.env.SMOKE_NEON_BRANCH_ID = branch.id;
  process.env.SMOKE_NEON_BRANCH_NAME = branch.name;
  process.env.SMOKE_DATABASE_URL = connectionUri;
  process.env.DATABASE_URL = connectionUri;

  writeGithubEnv({
    SMOKE_DB: "true",
    SMOKE_DATABASE_URL: connectionUri,
    DATABASE_URL: connectionUri,
    SMOKE_NEON_BRANCH_ID: branch.id,
    SMOKE_NEON_BRANCH_NAME: branch.name,
  });

  console.log("Temporary Neon branch created", {
    branchId: branch.id,
    branchName: branch.name,
    database: summarizeDatabaseUrl(connectionUri),
  });
}

async function deleteBranch() {
  const apiKey = requireEnv("NEON_API_KEY");
  const projectId = requireEnv("NEON_PROJECT_ID");
  const parentBranchId = process.env.NEON_PARENT_BRANCH_ID || "";
  const branchId = process.env.SMOKE_NEON_BRANCH_ID || process.env.NEON_BRANCH_ID || "";

  if (!branchId) {
    console.log("No temporary Neon branch id found; cleanup skipped.");
    return;
  }

  if (branchId === parentBranchId || !branchId.startsWith("br-")) {
    throw new Error("Refusing to delete a Neon branch that is missing a safe temporary branch id.");
  }

  await neonFetch(
    `/projects/${projectId}/branches/${branchId}`,
    { method: "DELETE" },
    apiKey,
  );

  console.log("Temporary Neon branch delete requested", { branchId });
}

const command = process.argv[2];

if (command === "create") {
  await createBranch();
} else if (command === "delete") {
  await deleteBranch();
} else {
  throw new Error("Usage: npm run smoke:neon -- create|delete");
}
