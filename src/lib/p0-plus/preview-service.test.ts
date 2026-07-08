import assert from "node:assert/strict";
import { POST } from "@/app/api/p0-plus/preview/route";
import { P0PlusPreviewAiError, type P0PlusPreviewAiClient } from "@/lib/p0-plus/ai";
import type { P0PlusRateLimiter } from "@/lib/p0-plus/rate-limit";
import type {
  CreateP0PlusPreviewInput,
  P0PlusPreviewRecord,
  P0PlusPreviewStorage,
} from "@/lib/p0-plus/storage";
import type { P0PlusPreviewResponse } from "@/lib/p0-plus/schema";
import { createP0PlusPreview, getP0PlusPreview } from "@/lib/p0-plus/preview-service";
import { hashPreviewToken } from "@/lib/p0-plus/tokens";
import {
  isP0PlusPreviewEnabled,
  isP0PlusPreviewValidationFallbackEnabled,
  normalizeP0PlusOutputLanguage,
  P0_PLUS_PREVIEW_MAX_BODY_BYTES,
} from "@/lib/p0-plus/config";
import { injectionMoldingFlashFixture } from "@/lib/p0-plus/__fixtures__/injection-molding-flash";

function clonePreview(): P0PlusPreviewResponse {
  return structuredClone(injectionMoldingFlashFixture.response);
}

class MockAiClient implements P0PlusPreviewAiClient {
  calls = 0;
  constructor(private readonly output: P0PlusPreviewResponse | Error = clonePreview()) {}

  async generatePreview() {
    this.calls += 1;
    if (this.output instanceof Error) throw this.output;
    return this.output;
  }
}

class MockStorage implements P0PlusPreviewStorage {
  created: CreateP0PlusPreviewInput[] = [];
  records = new Map<string, P0PlusPreviewRecord>();

  async create(input: CreateP0PlusPreviewInput) {
    this.created.push(input);
    const record: P0PlusPreviewRecord = {
      id: `preview_${this.created.length}`,
      tokenHash: input.tokenHash,
      boundedRawInput: input.boundedRawInput,
      outputLanguage: input.outputLanguage,
      previewPayloadJson: input.previewPayloadJson,
      clientIpHash: input.clientIpHash,
      browserTokenHash: input.browserTokenHash || null,
      expiresAt: input.expiresAt,
      convertedReportId: null,
      conversionClaimToken: null,
      conversionClaimedAt: null,
      conversionClaimExpiresAt: null,
      createdAt: new Date("2026-07-03T00:00:00.000Z"),
      updatedAt: new Date("2026-07-03T00:00:00.000Z"),
    };
    this.records.set(input.tokenHash, record);
    return record;
  }

  async findActiveByTokenHash(tokenHash: string, now = new Date()) {
    const record = this.records.get(tokenHash);
    if (!record || record.expiresAt <= now) return null;
    return record;
  }
}

class MockRateLimiter implements P0PlusRateLimiter {
  calls = 0;
  constructor(private readonly allowed = true) {}

  check() {
    this.calls += 1;
    return this.allowed
      ? { allowed: true as const, remaining: 1 }
      : { allowed: false as const, remaining: 0 as const, reason: "rate_limited" as const };
  }
}

const validRawInput = [
  "Production line found flash and excess material on injection molded part A.",
  "Supplier is mentioned, photos are available, but lot and defect quantity are missing.",
].join(" ");

async function main() {
  const originalFeatureFlag = process.env.P0_PLUS_PREVIEW_ENABLED;
  const originalVercelEnv = process.env.VERCEL_ENV;
  const originalVercelGitCommitRef = process.env.VERCEL_GIT_COMMIT_REF;

  function restoreEnv() {
    if (originalFeatureFlag === undefined) {
      delete process.env.P0_PLUS_PREVIEW_ENABLED;
    } else {
      process.env.P0_PLUS_PREVIEW_ENABLED = originalFeatureFlag;
    }
    if (originalVercelEnv === undefined) {
      delete process.env.VERCEL_ENV;
    } else {
      process.env.VERCEL_ENV = originalVercelEnv;
    }
    if (originalVercelGitCommitRef === undefined) {
      delete process.env.VERCEL_GIT_COMMIT_REF;
    } else {
      process.env.VERCEL_GIT_COMMIT_REF = originalVercelGitCommitRef;
    }
  }

  delete process.env.P0_PLUS_PREVIEW_ENABLED;
  delete process.env.VERCEL_ENV;
  delete process.env.VERCEL_GIT_COMMIT_REF;
  assert.equal(isP0PlusPreviewEnabled(), false, "P0+ preview feature flag should be disabled by default");
  assert.equal(
    isP0PlusPreviewValidationFallbackEnabled(),
    false,
    "Validation fallback should be disabled by default",
  );

  process.env.VERCEL_ENV = "preview";
  process.env.VERCEL_GIT_COMMIT_REF = "validation/p0-plus-preview-smoke";
  assert.equal(
    isP0PlusPreviewValidationFallbackEnabled(),
    true,
    "Validation preview branch fallback should enable only on the validation Preview deployment",
  );
  assert.equal(
    isP0PlusPreviewEnabled(),
    true,
    "Validation preview branch fallback should enable P0+ for PR #36 Preview testing",
  );

  process.env.VERCEL_ENV = "production";
  process.env.VERCEL_GIT_COMMIT_REF = "validation/p0-plus-preview-smoke";
  delete process.env.P0_PLUS_PREVIEW_ENABLED;
  assert.equal(
    isP0PlusPreviewValidationFallbackEnabled(),
    false,
    "Production must not use the validation branch fallback",
  );
  assert.equal(
    isP0PlusPreviewEnabled(),
    false,
    "Production must stay disabled without an explicit P0_PLUS_PREVIEW_ENABLED flag",
  );
  process.env.P0_PLUS_PREVIEW_ENABLED = "true";
  assert.equal(
    isP0PlusPreviewEnabled(),
    true,
    "Explicit P0_PLUS_PREVIEW_ENABLED should still enable P0+",
  );

  process.env.VERCEL_ENV = "preview";
  process.env.VERCEL_GIT_COMMIT_REF = "main";
  delete process.env.P0_PLUS_PREVIEW_ENABLED;
  assert.equal(
    isP0PlusPreviewValidationFallbackEnabled(),
    false,
    "Main branch Preview deployments must not use the validation fallback",
  );
  assert.equal(isP0PlusPreviewEnabled(), false, "Main branch Preview deployments should remain disabled by default");

  delete process.env.P0_PLUS_PREVIEW_ENABLED;
  delete process.env.VERCEL_ENV;
  delete process.env.VERCEL_GIT_COMMIT_REF;

  const disabledRouteResponse = await POST({
    headers: new Headers({ "content-length": String(P0_PLUS_PREVIEW_MAX_BODY_BYTES + 1) }),
    json: () => {
      throw new Error("disabled route should not parse request body");
    },
  } as never);
  assert.equal(disabledRouteResponse.status, 404, "Feature flag disabled route should return before parsing body");

  process.env.P0_PLUS_PREVIEW_ENABLED = "true";
  const oversizedRouteResponse = await POST({
    headers: new Headers({ "content-length": String(P0_PLUS_PREVIEW_MAX_BODY_BYTES + 1) }),
    json: () => {
      throw new Error("oversized route should not parse request body");
    },
  } as never);
  assert.equal(oversizedRouteResponse.status, 413, "Oversized content-length should be rejected at route layer");
  assert.deepEqual(await oversizedRouteResponse.json(), {
    error: "Preview input is too large",
    code: "body_too_large",
  });
  if (originalFeatureFlag === undefined) {
    delete process.env.P0_PLUS_PREVIEW_ENABLED;
  } else {
    process.env.P0_PLUS_PREVIEW_ENABLED = originalFeatureFlag;
  }
  restoreEnv();

  assert.equal(normalizeP0PlusOutputLanguage("en"), "en");
  assert.equal(normalizeP0PlusOutputLanguage("english"), "en");
  assert.equal(normalizeP0PlusOutputLanguage("zh"), "zh-CN");
  assert.equal(normalizeP0PlusOutputLanguage("zh-CN"), "zh-CN");
  assert.equal(normalizeP0PlusOutputLanguage("chinese"), "zh-CN");
  assert.equal(normalizeP0PlusOutputLanguage("bilingual"), "bilingual");
  assert.equal(normalizeP0PlusOutputLanguage("both"), "bilingual");
  assert.equal(normalizeP0PlusOutputLanguage("en-zh"), "bilingual");
  assert.equal(normalizeP0PlusOutputLanguage("zh-en"), "bilingual");
  assert.equal(normalizeP0PlusOutputLanguage("unknown"), "en");

  const disabledAi = new MockAiClient();
  const disabledStorage = new MockStorage();
  const disabledResult = await createP0PlusPreview(
    {
      enabled: false,
      body: { rawInput: validRawInput },
      clientIp: "203.0.113.10",
    },
    { aiClient: disabledAi, storage: disabledStorage, rateLimiter: new MockRateLimiter() },
  );
  assert.equal(disabledResult.status, 404, "Feature flag disabled should return disabled response");
  assert.equal(disabledAi.calls, 0, "Feature flag disabled must not call AI");
  assert.equal(disabledStorage.created.length, 0, "Feature flag disabled must not create preview");

  const enabledAi = new MockAiClient();
  const enabledStorage = new MockStorage();
  const enabledResult = await createP0PlusPreview(
    {
      enabled: true,
      body: { rawInput: validRawInput, outputLanguage: "en", browserToken: "browser-a" },
      bodyBytes: 500,
      clientIp: "203.0.113.11",
      browserToken: "browser-a",
      now: new Date("2026-07-03T00:00:00.000Z"),
    },
    {
      aiClient: enabledAi,
      storage: enabledStorage,
      rateLimiter: new MockRateLimiter(),
      createToken: () => "test-preview-token-1234567890",
    },
  );
  assert.equal(enabledResult.status, 201, "Valid guest preview should create a temporary preview");
  assert.equal(enabledAi.calls, 1, "Valid guest preview should call AI once");
  assert.equal(enabledStorage.created.length, 1, "Valid guest preview should be stored once");
  assert.equal(enabledResult.body.token, "test-preview-token-1234567890");
  assert.equal(Boolean(enabledResult.body.preview), true, "Valid guest preview should return read-only preview payload");
  assert.equal(enabledStorage.created[0]?.tokenHash, hashPreviewToken("test-preview-token-1234567890"));
  assert.notEqual(enabledStorage.created[0]?.tokenHash, "test-preview-token-1234567890", "Token must not be stored in plaintext");
  assert.equal(enabledStorage.created[0]?.expiresAt.toISOString(), "2026-07-04T00:00:00.000Z", "Preview should expire after 24 hours");

  const bilingualAi = new MockAiClient();
  const bilingualStorage = new MockStorage();
  const bilingualResult = await createP0PlusPreview(
    {
      enabled: true,
      body: { rawInput: validRawInput, outputLanguage: "both" },
      clientIp: "203.0.113.17",
      now: new Date("2026-07-03T00:00:00.000Z"),
    },
    {
      aiClient: bilingualAi,
      storage: bilingualStorage,
      rateLimiter: new MockRateLimiter(),
      createToken: () => "bilingual-preview-token-1234567890",
    },
  );
  assert.equal(bilingualResult.status, 201, "Bilingual preview should be accepted");
  assert.equal(bilingualStorage.created[0]?.outputLanguage, "bilingual", "Bilingual output language should be stored");
  assert.equal(bilingualResult.body.outputLanguage, "bilingual", "Bilingual output language should be returned");

  for (const body of [{ rawInput: "" }, { rawInput: "too short" }]) {
    const ai = new MockAiClient();
    const storage = new MockStorage();
    const result = await createP0PlusPreview(
      { enabled: true, body, clientIp: "203.0.113.12" },
      { aiClient: ai, storage, rateLimiter: new MockRateLimiter() },
    );
    assert.equal(result.status, 400, "Short or empty input should be rejected");
    assert.equal(ai.calls, 0, "Short or empty input must be rejected before AI");
    assert.equal(storage.created.length, 0, "Short or empty input must not create preview");
  }

  const oversizedAi = new MockAiClient();
  const oversizedStorage = new MockStorage();
  const oversizedResult = await createP0PlusPreview(
    {
      enabled: true,
      body: { rawInput: `${validRawInput} ${"x".repeat(20_000)}` },
      bodyBytes: 25_000,
      clientIp: "203.0.113.13",
    },
    { aiClient: oversizedAi, storage: oversizedStorage, rateLimiter: new MockRateLimiter() },
  );
  assert.equal(oversizedResult.status, 413, "Oversized input should be rejected");
  assert.equal(oversizedAi.calls, 0, "Oversized input must be rejected before AI");
  assert.equal(oversizedStorage.created.length, 0, "Oversized input must not create preview");

  const limitedAi = new MockAiClient();
  const limitedStorage = new MockStorage();
  const limitedResult = await createP0PlusPreview(
    { enabled: true, body: { rawInput: validRawInput }, clientIp: "203.0.113.14" },
    { aiClient: limitedAi, storage: limitedStorage, rateLimiter: new MockRateLimiter(false) },
  );
  assert.equal(limitedResult.status, 429, "Rate-limited request should return 429");
  assert.equal(limitedAi.calls, 0, "Rate-limited request must not call AI");
  assert.equal(limitedStorage.created.length, 0, "Rate-limited request must not create preview");

  const invalidPreview = clonePreview() as P0PlusPreviewResponse;
  invalidPreview.readiness_check.section_checks = [];
  const invalidAi = new MockAiClient(invalidPreview);
  const invalidStorage = new MockStorage();
  const invalidResult = await createP0PlusPreview(
    { enabled: true, body: { rawInput: validRawInput }, clientIp: "203.0.113.15" },
    { aiClient: invalidAi, storage: invalidStorage, rateLimiter: new MockRateLimiter() },
  );
  assert.equal(invalidResult.status, 502, "Invalid AI schema should fail safely");
  assert.equal(invalidAi.calls, 1, "Invalid AI schema still means AI was called once");
  assert.equal(invalidStorage.created.length, 0, "Invalid AI schema must not create preview");

  const unsafePreview = clonePreview();
  unsafePreview.conversion.reportDataPatch = {
    ...unsafePreview.conversion.reportDataPatch,
    preparedSignatureUrl: "/api/attachments/private-signature/file",
    privateUserId: "user_123",
    approverName: "Unverified Approver",
    batchNumber: "AI guessed batch",
    defectQuantity: "AI guessed quantity",
  } as P0PlusPreviewResponse["conversion"]["reportDataPatch"] & Record<string, string>;
  const unsafeAi = new MockAiClient(unsafePreview);
  const unsafeStorage = new MockStorage();
  const unsafeResult = await createP0PlusPreview(
    {
      enabled: true,
      body: { rawInput: validRawInput },
      clientIp: "203.0.113.18",
      now: new Date("2026-07-03T00:00:00.000Z"),
    },
    {
      aiClient: unsafeAi,
      storage: unsafeStorage,
      rateLimiter: new MockRateLimiter(),
      createToken: () => "unsafe-preview-token-1234567890",
    },
  );
  assert.equal(unsafeResult.status, 201, "Unsafe conversion patch fields should be sanitized, not fail the preview");
  const unsafePostPreview = unsafeResult.body.preview as P0PlusPreviewResponse;
  const unsafePostPatchText = JSON.stringify(unsafePostPreview.conversion.reportDataPatch);
  for (const forbidden of ["preparedSignatureUrl", "privateUserId", "approverName", "AI guessed batch", "AI guessed quantity"]) {
    assert.equal(unsafePostPatchText.includes(forbidden), false, `POST conversion patch must not include unsafe field/value ${forbidden}`);
  }
  assert.deepEqual(
    (unsafeStorage.created[0]?.previewPayloadJson as P0PlusPreviewResponse).conversion.reportDataPatch,
    {
      problemSource: "production line",
      problemDescription:
        "Production line found flash/excess material on an injection molded part. Supplier and photos are mentioned, but lot and quantity are not confirmed.",
      whereFound: "production line",
      productName: "injection molded part",
    },
    "Stored conversion patch should only include safe provided/extracted fields",
  );
  const unsafeGet = await getP0PlusPreview(
    {
      enabled: true,
      token: "unsafe-preview-token-1234567890",
      now: new Date("2026-07-03T00:00:01.000Z"),
    },
    { storage: unsafeStorage },
  );
  const unsafeGetPreview = unsafeGet.body.preview as P0PlusPreviewResponse;
  const unsafeGetPatchText = JSON.stringify(unsafeGetPreview.conversion.reportDataPatch);
  for (const forbidden of ["preparedSignatureUrl", "privateUserId", "approverName", "AI guessed batch", "AI guessed quantity"]) {
    assert.equal(unsafeGetPatchText.includes(forbidden), false, `GET conversion patch must not include unsafe field/value ${forbidden}`);
  }

  const aiFailure = new MockAiClient(new P0PlusPreviewAiError("invalid json"));
  const aiFailureStorage = new MockStorage();
  const aiFailureResult = await createP0PlusPreview(
    { enabled: true, body: { rawInput: validRawInput }, clientIp: "203.0.113.16" },
    { aiClient: aiFailure, storage: aiFailureStorage, rateLimiter: new MockRateLimiter() },
  );
  assert.equal(aiFailureResult.status, 502, "Invalid AI JSON/provider failure should fail safely");
  assert.equal(aiFailure.calls, 1, "AI failure path should call AI once");
  assert.equal(aiFailureStorage.created.length, 0, "Invalid AI JSON/provider failure must not create preview");

  const unknownGet = await getP0PlusPreview(
    { enabled: true, token: "unknown-preview-token-1234567890" },
    { storage: new MockStorage() },
  );
  assert.equal(unknownGet.status, 404, "Unknown token should fail safely");

  const expiredStorage = new MockStorage();
  await expiredStorage.create({
    tokenHash: hashPreviewToken("expired-preview-token-1234567890"),
    boundedRawInput: validRawInput,
    outputLanguage: "en",
    previewPayloadJson: clonePreview(),
    clientIpHash: "ip_hash",
    browserTokenHash: null,
    expiresAt: new Date("2026-07-03T00:00:00.000Z"),
  });
  const expiredGet = await getP0PlusPreview(
    {
      enabled: true,
      token: "expired-preview-token-1234567890",
      now: new Date("2026-07-03T00:00:01.000Z"),
    },
    { storage: expiredStorage },
  );
  assert.equal(expiredGet.status, 404, "Expired token should fail safely");

  const getResult = await getP0PlusPreview(
    {
      enabled: true,
      token: "test-preview-token-1234567890",
      now: new Date("2026-07-03T00:00:01.000Z"),
    },
    { storage: enabledStorage },
  );
  assert.equal(getResult.status, 200, "Known active token should return preview");
  const getPayloadText = JSON.stringify(getResult.body);
  for (const forbidden of ["userId", "teamId", "reportId", "shareToken", "exportUrl", "convertedReportId"]) {
    assert.equal(getPayloadText.includes(forbidden), false, `Preview response must not include ${forbidden}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
