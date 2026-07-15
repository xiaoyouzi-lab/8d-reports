import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validateQualityCaseAction } from "@/lib/quality-cases/contract";
import {
  assembleSupplierResponsePackage,
  isSupplierResponseTaskScopeValid,
  SupplierResponsePackageError,
  submitSupplierResponsePackageWithDependencies,
} from "@/lib/quality-cases/supplier-response-package";

const NOW = new Date("2026-07-10T08:00:00.000Z");
const CASE_ID = "00000000-0000-4000-8000-000000000001";
const TASK_ID = "00000000-0000-4000-8000-000000000002";
const SESSION_ID = "00000000-0000-4000-8000-000000000003";
const PARTICIPANT_ID = "00000000-0000-4000-8000-000000000004";

function rows() {
  const question = (id: string, stage: string, category = stage) => ({
    id,
    sessionId: SESSION_ID,
    stage,
    category,
  });
  const answer = (input: {
    id: string;
    questionId: string;
    groupId: string;
    revision?: number;
    supersedesAnswerId?: string | null;
    text: string;
    missing?: string[];
  }) => ({
    id: input.id,
    questionId: input.questionId,
    answerGroupId: input.groupId,
    revision: input.revision || 1,
    supersedesAnswerId: input.supersedesAnswerId || null,
    originalText: input.text,
    classification: "stated_fact",
    actorId: null,
    actorParticipantId: PARTICIPANT_ID,
    actorOrganization: "Shenzhen Supplier Co.",
    missingInformation: input.missing || [],
    createdAt: new Date(NOW.getTime() - 60_000 + (input.revision || 1) * 1000),
  });
  const questions = [
    question("q-problem", "problem_description", "problem_fact"),
    question("q-containment", "containment"),
    question("q-occurrence", "occurrence_cause"),
    question("q-escape", "escape_cause"),
    question("q-action", "corrective_action"),
    question("q-verification", "verification_and_prevention", "verification_plan"),
  ];
  const answers = [
    answer({ id: "a-problem-v1", questionId: "q-problem", groupId: "g-problem", text: "客户发现外壳有裂纹。" }),
    answer({ id: "a-problem-v2", questionId: "q-problem", groupId: "g-problem", revision: 2, supersedesAnswerId: "a-problem-v1", text: "客户在来料检验发现 A123 外壳裂纹，批次 L2407 共 3 件。" }),
    answer({ id: "a-containment", questionId: "q-containment", groupId: "g-containment", text: "已隔离同批次库存并暂停出货。" }),
    answer({ id: "a-occurrence", questionId: "q-occurrence", groupId: "g-occurrence", text: "初步怀疑注塑压力波动，仍需核实设备记录。", missing: ["machine_parameter_record"] }),
    answer({ id: "a-escape", questionId: "q-escape", groupId: "g-escape", text: "现有抽检未覆盖内侧细裂纹。" }),
    answer({ id: "a-action", questionId: "q-action", groupId: "g-action", text: "计划增加模具定位检查和首件确认。" }),
    answer({ id: "a-verification", questionId: "q-verification", groupId: "g-verification", text: "连续三个批次记录裂纹结果并复核。" }),
  ];
  return {
    qualityCase: {
      id: CASE_ID,
      title: "A123 housing crack",
      currentVersion: 4,
      dueAt: new Date("2026-07-15T08:00:00.000Z"),
      caseData: {
        product: "A123 housing",
        complaintSummary: "Customer found cracks during incoming inspection.",
        reportData: { rootCause: "Existing report content must not be copied or changed." },
      },
    },
    task: { id: TASK_ID, taskType: "supplier_response", expiresAt: new Date("2026-07-20T08:00:00.000Z") },
    session: { id: SESSION_ID },
    participant: { id: PARTICIPANT_ID, displayName: "Li Wei", organizationName: "Shenzhen Supplier Co." },
    questions,
    answers,
    aiRuns: [{
      id: "run-1",
      agentType: "investigator",
      promptIdentifier: "guided-investigator",
      promptVersion: "v1",
      response: { answerRestatement: "供应商认为压力波动是待验证的假设。", nextQuestion: "设备记录显示了什么？" },
      requestMetadata: { answerId: "a-occurrence" },
      confidence: "medium",
      sourceType: "deepseek",
      policyOutcome: "accepted",
      generatedAt: new Date("2026-07-10T07:58:00.000Z"),
    }],
    insights: [{
      id: "insight-1",
      insightKey: "unverified_pressure_hypothesis",
      kind: "logic_risk",
      severity: "high",
      sourceType: "ai_investigator",
      message: "压力波动仍是待验证假设，不能确认为根因。",
      aiRunId: "run-1",
      answerId: "a-occurrence",
      confidence: "medium",
      resolvedAt: null,
      generatedAt: new Date("2026-07-10T07:58:30.000Z"),
    }],
    requirements: [
      {
        id: "requirement-verification",
        questionId: "q-verification",
        answerId: "a-verification",
        aiRunId: "run-1",
        requirementKey: "verification_result",
        reason: "需要客观记录证明改善是否有效。",
        status: "satisfied",
        requirementSnapshot: { evidenceIds: ["evidence-1"], relatedInsightId: "insight-1" },
        createdAt: new Date("2026-07-10T07:58:40.000Z"),
      },
      {
        id: "requirement-machine-record",
        questionId: "q-occurrence",
        answerId: "a-occurrence",
        aiRunId: "run-1",
        requirementKey: "machine_parameter_record",
        reason: "需要记录验证压力波动假设。",
        status: "open",
        requirementSnapshot: { evidenceIds: [], relatedInsightId: "insight-1" },
        createdAt: new Date("2026-07-10T07:58:45.000Z"),
      },
    ],
    evidence: [{
      id: "evidence-1",
      uploadedByParticipantId: PARTICIPANT_ID,
      filename: "three-lot-verification.xlsx",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      fileSize: 4096,
      createdAt: new Date("2026-07-10T07:59:00.000Z"),
    }],
    mappings: [{
      answerId: "a-action",
      qualityConcept: "permanent_corrective_action",
      semanticKey: "corrective_action",
      targetReference: { legacy8dFields: ["selectedCorrectiveAction", "implementationPlan"] },
      decision: "proposed",
      createdAt: new Date("2026-07-10T07:58:50.000Z"),
      id: "mapping-1",
    }],
    now: NOW,
  };
}

// Test 1: a package includes the immutable answer history, AI provenance,
// evidence relationships, advisory readiness, and non-writing mappings.
const completeRows = rows();
const packageValue = assembleSupplierResponsePackage(completeRows as never);
assert.equal(packageValue.caseContext.caseVersion, 4);
assert.equal(packageValue.caseContext.taskStatus, "active");
assert.equal(isSupplierResponseTaskScopeValid({ expiresAt: new Date("2026-07-10T09:00:00.000Z"), revokedAt: null, now: NOW }), true);
assert.equal(isSupplierResponseTaskScopeValid({ expiresAt: NOW, revokedAt: null, now: NOW }), false);
assert.equal(isSupplierResponseTaskScopeValid({ expiresAt: new Date("2026-07-10T09:00:00.000Z"), revokedAt: NOW, now: NOW }), false);
assert.equal(packageValue.investigation.originalAnswers.length, 7);
assert.equal(packageValue.investigation.currentAnswers.length, 6);
assert.equal(packageValue.investigation.currentAnswers.find((item) => item.answerGroupId === "g-problem")?.revision, 2);
assert.deepEqual(packageValue.investigation.aiInterpretations[0], {
  aiRunId: "run-1",
  answerId: "a-occurrence",
  summary: "供应商认为压力波动是待验证的假设。",
  confidence: "medium",
  status: "unconfirmed",
  generatedAt: "2026-07-10T07:58:00.000Z",
});
assert.equal(packageValue.investigation.insights[0].requiresConfirmation, true);
assert.equal(packageValue.investigation.missingInformation.some((item) => item.key === "machine_parameter_record"), true);
assert.deepEqual(packageValue.evidence.files[0].requirementIds, ["requirement-verification"]);
assert.equal(packageValue.evidence.files[0].stage, "verification_and_prevention");
assert.equal(packageValue.evidence.files[0].relatedAnswerId, "a-verification");
assert.equal(packageValue.evidence.files[0].relatedInsightId, "insight-1");
assert.deepEqual(packageValue.evidence.files[0].associations, [{ requirementId: "requirement-verification", stage: "verification_and_prevention", relatedAnswerId: "a-verification", relatedInsightId: "insight-1" }]);
assert.equal(packageValue.evidence.files[0].uploaderParticipantId, PARTICIPANT_ID);
assert.equal(packageValue.readiness.advisoryOnly, true);
assert.equal(packageValue.readiness.doesNotBlockSubmission, true);
assert.equal(packageValue.readiness.rootCause, "needs_review");
assert.equal(packageValue.mappingSuggestions[0].writesReport, false);
assert.deepEqual(packageValue.mappingSuggestions[0].legacy8dFields, ["selectedCorrectiveAction", "implementationPlan"]);
assert.equal(JSON.stringify(packageValue).includes("confirmedRootCause"), false);
assert.equal(JSON.stringify(packageValue).includes("closeCase"), false);
const laterRows = rows();
laterRows.now = new Date("2026-07-10T08:05:00.000Z");
const laterProjection = assembleSupplierResponsePackage(laterRows as never);
assert.equal(laterProjection.packageId, packageValue.packageId, "Projection time must not change the content-addressed package id.");
assert.notEqual(laterProjection.generatedAt, packageValue.generatedAt);

// Test 2: package generation is a projection and cannot mutate or copy legacy
// report data into a report patch.
const reportBefore = structuredClone(completeRows.qualityCase.caseData.reportData);
const generatedAgain = assembleSupplierResponsePackage(completeRows as never);
assert.deepEqual(completeRows.qualityCase.caseData.reportData, reportBefore);
assert.equal(JSON.stringify(generatedAgain).includes("Existing report content must not be copied or changed."), false);
assert.equal("reportPatch" in (generatedAgain as unknown as Record<string, unknown>), false);
const packageServiceSource = readFileSync("src/lib/quality-cases/supplier-response-package.ts", "utf8");
const externalTaskSource = readFileSync("src/lib/quality-cases/external-tasks.ts", "utf8");
assert.doesNotMatch(packageServiceSource, /db\.transaction\(/, "neon-http does not support callback transactions at runtime");
assert.match(externalTaskSource, /database\.batch\(\[/, "supplier confirmation and workflow writes must use Neon's transactional batch");
assert.match(
  externalTaskSource,
  /\$\{qualityCaseTaskLinks\}\.\$\{qualityCaseTaskLinks\.id\}/,
  "multi-table supplier submission guards must qualify columns to avoid ambiguous PostgreSQL identifiers",
);
assert.match(
  externalTaskSource,
  /database\.batch\(\[[\s\S]*insert\(qualityCaseGuidanceConfirmations\)[\s\S]*update\(qualityCases\)[\s\S]*update\(qualityCaseTaskLinks\)[\s\S]*insert\(qualityCaseVersions\)[\s\S]*insert\(qualityCaseActivities\)[\s\S]*update\(qualityCaseGuidanceSessions\)/,
  "confirmation, Case/task, version, audit, and session writes must share one transactional batch",
);
assert.doesNotMatch(packageServiceSource, /\breports\b|reportPatch/, "the package service must not import or write legacy ReportData");
assert.doesNotMatch(packageServiceSource, /db\.(?:insert|update|delete)\(/, "the package service must remain a read-only projection plus atomic task delegation");

// Test 3: Guided and Expert modes share this orchestration and one atomic
// confirmation + external-task commit.
async function runSubmissionTests() {
  const calls: string[] = [];
  const submitted = await submitSupplierResponsePackageWithDependencies(
    { confirmationText: "我确认以上回答和附件来自本次实际调查。" },
    {
      async inspect() { calls.push("inspect"); return { completed: false, existing: null }; },
      async buildPackage() { calls.push("build"); return packageValue; },
      async commitAtomic() { calls.push("atomic-commit"); return { ok: true, status: "supplier_submitted", confirmationId: "confirmation-1" }; },
    },
  );
  assert.deepEqual(calls, ["inspect", "build", "atomic-commit"]);
  assert.deepEqual(submitted, { status: "supplier_submitted", packageId: packageValue.packageId, confirmationId: "confirmation-1", alreadySubmitted: false });
  const supplierTransition = validateQualityCaseAction("waiting_for_supplier", { action: "supplier_submit", actorRole: "external_guest" });
  assert.equal(supplierTransition.ok, true);
  if (supplierTransition.ok) {
    assert.equal(supplierTransition.transition.to, "supplier_submitted");
    assert.equal(supplierTransition.transition.waitingOn, "internal");
  }
  const reviewTransition = validateQualityCaseAction("supplier_submitted", { action: "start_internal_review", actorRole: "internal_member" });
  assert.equal(reviewTransition.ok, true);
  if (reviewTransition.ok) assert.equal(reviewTransition.transition.to, "internal_review");

  // Test 4: a retry returns the prior confirmation and does not rebuild,
  // submit, or create a second audit trail.
  let duplicateSideEffects = 0;
  const duplicate = await submitSupplierResponsePackageWithDependencies(
    { confirmationText: "retry" },
    {
      async inspect() { return { completed: true, existing: { id: "confirmation-1", packageId: packageValue.packageId, status: "supplier_submitted" } }; },
      async buildPackage() { duplicateSideEffects += 1; return packageValue; },
      async commitAtomic() { duplicateSideEffects += 1; return { ok: true, status: "supplier_submitted", confirmationId: "confirmation-2" }; },
    },
  );
  assert.equal(duplicate.alreadySubmitted, true);
  assert.equal(duplicate.confirmationId, "confirmation-1");
  assert.equal(duplicateSideEffects, 0);

  // A forged token/session scope must stop before any package or mutation.
  let unauthorizedSideEffects = 0;
  await assert.rejects(
    submitSupplierResponsePackageWithDependencies(
      { confirmationText: "confirm" },
      {
        async inspect() { throw new SupplierResponsePackageError("Supplier task is unavailable or expired.", 404); },
        async buildPackage() { unauthorizedSideEffects += 1; return packageValue; },
        async commitAtomic() { unauthorizedSideEffects += 1; return { ok: true, status: "supplier_submitted", confirmationId: "forbidden" }; },
      },
    ),
    (error: unknown) => error instanceof SupplierResponsePackageError && error.status === 404,
  );
  assert.equal(unauthorizedSideEffects, 0);

  // The atomic adapter reports failure only after rolling its writes back.
  let persistedConfirmations = 0;
  let inspections = 0;
  await assert.rejects(
    submitSupplierResponsePackageWithDependencies(
      { confirmationText: "confirm" },
      {
        async inspect() { inspections += 1; return { completed: false, existing: null }; },
        async buildPackage() { return packageValue; },
        async commitAtomic() {
          persistedConfirmations += 1;
          persistedConfirmations -= 1;
          return { ok: false, status: 409, error: "Case changed." };
        },
      },
    ),
    (error: unknown) => error instanceof SupplierResponsePackageError && error.status === 409,
  );
  assert.equal(persistedConfirmations, 0);
  assert.equal(inspections, 2, "a failed concurrent commit must re-check idempotency before returning an error");

  console.log("Supplier Response Package service tests passed.");
}

runSubmissionTests().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
