import assert from "node:assert/strict";
import {
  convertP0PlusPreviewToReport,
  getP0PlusContinuationState,
} from "@/lib/p0-plus/convert";
import { getP0PlusContinueLoginPath } from "@/lib/p0-plus/paths";
import { injectionMoldingFlashFixture } from "@/lib/p0-plus/__fixtures__/injection-molding-flash";
import { hashPreviewToken } from "@/lib/p0-plus/tokens";
import type {
  CreateP0PlusPreviewInput,
  P0PlusPreviewConversionStorage,
  P0PlusPreviewRecord,
} from "@/lib/p0-plus/storage";
import type { P0PlusPreviewResponse } from "@/lib/p0-plus/schema";
import type {
  CreateReportFromDataInput,
  CreateReportFromDataResult,
} from "@/lib/report-creation";

function clonePreview(): P0PlusPreviewResponse {
  return structuredClone(injectionMoldingFlashFixture.response);
}

class MockConversionStorage implements P0PlusPreviewConversionStorage {
  records = new Map<string, P0PlusPreviewRecord>();
  markCalls = 0;

  async create(input: CreateP0PlusPreviewInput) {
    const record: P0PlusPreviewRecord = {
      id: `preview_${this.records.size + 1}`,
      tokenHash: input.tokenHash,
      boundedRawInput: input.boundedRawInput,
      outputLanguage: input.outputLanguage,
      previewPayloadJson: input.previewPayloadJson,
      clientIpHash: input.clientIpHash,
      browserTokenHash: input.browserTokenHash || null,
      expiresAt: input.expiresAt,
      convertedReportId: null,
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

  async markConverted(previewId: string, reportId: string, now = new Date()) {
    this.markCalls += 1;
    for (const [tokenHash, record] of this.records.entries()) {
      if (record.id !== previewId || record.convertedReportId) continue;
      const updated = { ...record, convertedReportId: reportId, updatedAt: now };
      this.records.set(tokenHash, updated);
      return updated;
    }
    return null;
  }
}

function addRecord(
  storage: MockConversionStorage,
  token: string,
  overrides: Partial<P0PlusPreviewRecord> = {},
) {
  const record: P0PlusPreviewRecord = {
    id: overrides.id || `preview_${storage.records.size + 1}`,
    tokenHash: hashPreviewToken(token),
    boundedRawInput: "Production line found flash on injection molded part.",
    outputLanguage: "en",
    previewPayloadJson: clonePreview(),
    clientIpHash: "ip_hash",
    browserTokenHash: null,
    expiresAt: new Date("2026-07-04T00:00:00.000Z"),
    convertedReportId: null,
    createdAt: new Date("2026-07-03T00:00:00.000Z"),
    updatedAt: new Date("2026-07-03T00:00:00.000Z"),
    ...overrides,
  };
  storage.records.set(record.tokenHash, record);
  return record;
}

function makeCreateReportMock() {
  const inputs: CreateReportFromDataInput[] = [];
  const createReport = async (input: CreateReportFromDataInput): Promise<CreateReportFromDataResult> => {
    inputs.push(input);
    return {
      ok: true,
      report: {
        id: `report_${inputs.length}`,
        userId: input.user.id,
        title: input.title || "Untitled Report",
        reportType: String(input.reportType || "customer_8d"),
        priority: String(input.priority || "medium"),
        source: input.source || null,
        data: input.data || {},
        stepStatus: input.stepStatus || {},
        status: input.status || "draft",
        workflowStatus: "draft",
        revision: 0,
        lockedAt: null,
        lockedBy: null,
        templateId: null,
        metadata: {},
        reportNumber: inputs.length,
        hasConsumedQuota: true,
        createdAt: new Date("2026-07-03T00:00:00.000Z"),
        updatedAt: new Date("2026-07-03T00:00:00.000Z"),
      } as never,
    };
  };
  return { createReport, inputs };
}

async function main() {
  const originalWarn = console.warn;
  console.warn = () => undefined;
  try {
  const user = { id: "user_1", name: "Quality Owner" };
  const token = "preview-token-1234567890";

  assert.equal(
    getP0PlusContinueLoginPath(token),
    "/login?callbackUrl=/p0-plus/continue/preview-token-1234567890",
    "Unauthenticated continuation should use a safe local login callback",
  );

  const disabledStorage = new MockConversionStorage();
  const disabledCreate = makeCreateReportMock();
  const disabledResult = await convertP0PlusPreviewToReport(
    { enabled: false, token, user },
    { storage: disabledStorage, createReport: disabledCreate.createReport },
  );
  assert.equal(disabledResult.status, 404, "Feature flag disabled should hide conversion");
  assert.equal(disabledCreate.inputs.length, 0, "Feature flag disabled must not create a report");

  const unauthStorage = new MockConversionStorage();
  addRecord(unauthStorage, token);
  const unauthCreate = makeCreateReportMock();
  const unauthResult = await convertP0PlusPreviewToReport(
    { enabled: true, token, user: null },
    { storage: unauthStorage, createReport: unauthCreate.createReport },
  );
  assert.equal(unauthResult.status, 401, "Guest conversion should not succeed");
  assert.equal(unauthCreate.inputs.length, 0, "Guest conversion must not create a report");

  const getOnlyStorage = new MockConversionStorage();
  addRecord(getOnlyStorage, token);
  const getOnlyCreate = makeCreateReportMock();
  const continuation = await getP0PlusContinuationState(
    { enabled: true, token, userId: user.id, now: new Date("2026-07-03T00:00:01.000Z") },
    {
      storage: getOnlyStorage,
      createReport: async (input) => {
        getOnlyCreate.inputs.push(input);
        throw new Error("GET continuation state must not create a report");
      },
      getAccessibleReport: async () => null,
    },
  );
  assert.equal(continuation.kind, "active", "Known active preview should render confirmation state");
  assert.equal(getOnlyCreate.inputs.length, 0, "Continuation GET state must not create a report");

  const unknownResult = await convertP0PlusPreviewToReport(
    { enabled: true, token: "unknown-preview-token-1234567890", user },
    { storage: new MockConversionStorage(), createReport: makeCreateReportMock().createReport },
  );
  assert.equal(unknownResult.status, 404, "Unknown token should fail safely");

  const expiredStorage = new MockConversionStorage();
  addRecord(expiredStorage, "expired-preview-token-1234567890", {
    expiresAt: new Date("2026-07-03T00:00:00.000Z"),
  });
  const expiredCreate = makeCreateReportMock();
  const expiredResult = await convertP0PlusPreviewToReport(
    {
      enabled: true,
      token: "expired-preview-token-1234567890",
      user,
      now: new Date("2026-07-03T00:00:01.000Z"),
    },
    { storage: expiredStorage, createReport: expiredCreate.createReport },
  );
  assert.equal(expiredResult.status, 404, "Expired token should fail safely");
  assert.equal(expiredCreate.inputs.length, 0, "Expired token must not create a report");

  const validStorage = new MockConversionStorage();
  addRecord(validStorage, token);
  const validCreate = makeCreateReportMock();
  const validResult = await convertP0PlusPreviewToReport(
    { enabled: true, token, user, now: new Date("2026-07-03T00:00:01.000Z") },
    {
      storage: validStorage,
      createReport: validCreate.createReport,
      getAccessibleReport: async (reportId) => ({ id: reportId }),
    },
  );
  assert.equal(validResult.status, 201, "Valid authenticated POST should create a report");
  assert.equal(validResult.body.reportId, "report_1");
  assert.equal(validResult.body.redirectPath, "/reports/report_1");
  assert.equal(validCreate.inputs.length, 1, "Valid conversion should consume report creation quota once");
  assert.equal(validStorage.markCalls, 1, "Valid conversion should mark preview converted");
  assert.equal(validCreate.inputs[0]?.source, "p0_plus_preview");
  assert.equal(validCreate.inputs[0]?.title, "Injection molded part flash/excess material");
  assert.deepEqual(
    validCreate.inputs[0]?.data,
    {
      problemSource: "production line",
      problemDescription:
        "Production line found flash/excess material on an injection molded part. Supplier and photos are mentioned, but lot and quantity are not confirmed.",
      whereFound: "production line",
      productName: "injection molded part",
    },
    "Conversion should write only sanitized provided/extracted report data",
  );

  const repeatResult = await convertP0PlusPreviewToReport(
    { enabled: true, token, user, now: new Date("2026-07-03T00:00:02.000Z") },
    {
      storage: validStorage,
      createReport: validCreate.createReport,
      getAccessibleReport: async (reportId) => ({ id: reportId }),
    },
  );
  assert.equal(repeatResult.status, 200, "Repeat conversion should return existing report");
  assert.equal(repeatResult.body.reportId, "report_1");
  assert.equal(validCreate.inputs.length, 1, "Repeat conversion must not create a duplicate report or consume quota again");

  const inaccessibleStorage = new MockConversionStorage();
  addRecord(inaccessibleStorage, "converted-inaccessible-token-1234567890", {
    convertedReportId: "private_report",
  });
  const inaccessibleResult = await convertP0PlusPreviewToReport(
    { enabled: true, token: "converted-inaccessible-token-1234567890", user },
    {
      storage: inaccessibleStorage,
      createReport: makeCreateReportMock().createReport,
      getAccessibleReport: async () => null,
    },
  );
  assert.equal(inaccessibleResult.status, 404, "Already converted previews should not leak inaccessible report ids");
  assert.equal(JSON.stringify(inaccessibleResult.body).includes("private_report"), false);

  const unsafePreview = clonePreview();
  unsafePreview.conversion.reportDataPatch = {
    ...unsafePreview.conversion.reportDataPatch,
    preparedSignatureUrl: "/api/private/signature",
    reviewedSignatureUrl: "/api/private/reviewed",
    approvedSignatureUrl: "/api/private/approved",
    approverName: "Unverified Approver",
    batchNumber: "AI guessed batch",
    defectQuantity: "AI guessed quantity",
  };
  const unsafeStorage = new MockConversionStorage();
  addRecord(unsafeStorage, "unsafe-preview-token-1234567890", { previewPayloadJson: unsafePreview });
  const unsafeCreate = makeCreateReportMock();
  const unsafeResult = await convertP0PlusPreviewToReport(
    { enabled: true, token: "unsafe-preview-token-1234567890", user, now: new Date("2026-07-03T00:00:01.000Z") },
    {
      storage: unsafeStorage,
      createReport: unsafeCreate.createReport,
      getAccessibleReport: async (reportId) => ({ id: reportId }),
    },
  );
  assert.equal(unsafeResult.status, 201, "Unsafe fields should be sanitized rather than written");
  const unsafeWrite = JSON.stringify(unsafeCreate.inputs[0]?.data || {});
  for (const forbidden of [
    "preparedSignatureUrl",
    "reviewedSignatureUrl",
    "approvedSignatureUrl",
    "approverName",
    "AI guessed batch",
    "AI guessed quantity",
  ]) {
    assert.equal(unsafeWrite.includes(forbidden), false, `Conversion must not write ${forbidden}`);
  }

  const invalidPrivatePreview = clonePreview();
  invalidPrivatePreview.conversion.reportDataPatch = {
    ...invalidPrivatePreview.conversion.reportDataPatch,
    exportUrl: "/api/export/private",
    shareToken: "share_secret",
    privateUserId: "user_private",
  } as P0PlusPreviewResponse["conversion"]["reportDataPatch"] & Record<string, string>;
  const invalidPrivateStorage = new MockConversionStorage();
  addRecord(invalidPrivateStorage, "invalid-private-preview-token-1234567890", {
    previewPayloadJson: invalidPrivatePreview,
  });
  const invalidPrivateCreate = makeCreateReportMock();
  const privateFieldResult = await convertP0PlusPreviewToReport(
    {
      enabled: true,
      token: "invalid-private-preview-token-1234567890",
      user,
      now: new Date("2026-07-03T00:00:01.000Z"),
    },
    {
      storage: invalidPrivateStorage,
      createReport: invalidPrivateCreate.createReport,
      getAccessibleReport: async (reportId) => ({ id: reportId }),
    },
  );
  assert.equal(privateFieldResult.status, 201, "Private/share/export patch fields should be sanitized before writing");
  const privateFieldWrite = JSON.stringify(invalidPrivateCreate.inputs[0]?.data || {});
  for (const forbidden of ["exportUrl", "shareToken", "privateUserId", "/api/export/private", "share_secret", "user_private"]) {
    assert.equal(privateFieldWrite.includes(forbidden), false, `Conversion must not write ${forbidden}`);
  }

  const disabledState = await getP0PlusContinuationState(
    { enabled: false, token, userId: user.id },
    { storage: new MockConversionStorage() },
  );
  assert.equal(disabledState.kind, "unavailable", "Feature flag disabled should hide continuation flow");
  } finally {
    console.warn = originalWarn;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
