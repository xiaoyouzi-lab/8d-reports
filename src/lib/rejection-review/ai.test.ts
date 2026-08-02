import assert from "node:assert/strict";
import {
  DEFAULT_REJECTION_REVIEW_AI_MODEL,
  DeepSeekRejectionReviewAiClient,
  RejectionReviewAiProviderError,
  applyRejectionReviewAiOverlay,
  getRejectionReviewAiModel,
  runRejectionReviewAiOverlay,
  validateRejectionReviewAiOverlay,
  type RejectionReviewAiClient,
  type RejectionReviewAiOverlay,
} from "@/lib/rejection-review/ai";
import {
  REVIEW_SECTIONS,
  type RejectionRiskReview,
} from "@/lib/rejection-review/schema";

const RAW_REPORT = [
  "D4 Root Cause",
  "The fixture allowed reverse installation, while the visual check did not cover orientation.",
  "D5 Corrective Action",
  "A keyed fixture will be added.",
].join("\n");

const deterministicReview: RejectionRiskReview = {
  schemaVersion: "rejection-risk-review-v1",
  status: "submittable_with_risk",
  topRejectionRisks: [],
  findings: [
    {
      id: "deterministic-linkage-gap",
      section: "D5",
      severity: "medium",
      category: "corrective_action",
      title: "Cause-to-action linkage needs confirmation",
      explanation: "The supplied action does not explicitly explain its linkage to the occurrence cause.",
      evidenceStatus: "needs_confirmation",
      source: {
        type: "report_excerpt",
        section: "D5",
        excerpt: "A keyed fixture will be added.",
        ruleId: "deterministic-linkage-gap",
      },
      factsNeeded: ["Cause-to-action rationale"],
      likelyCustomerQuestion: "How does this action address the stated cause?",
    },
  ],
  sections: REVIEW_SECTIONS.map((section) => ({
    section,
    status: section === "D5" ? "risk_found" : "no_material_issue_detected",
    findingIds: section === "D5" ? ["deterministic-linkage-gap"] : [],
  })),
  missingInformationCategories: ["corrective_action"],
  evidencePolicy: {
    inventedFactsAllowed: false,
    sourceRequiredForEveryFinding: true,
  },
  disclaimer: "Advisory review only.",
};

function validOverlay(): RejectionReviewAiOverlay {
  return {
    schemaVersion: "rejection-review-ai-overlay-v1",
    explanations: [
      {
        findingId: "deterministic-linkage-gap",
        supplementalExplanation:
          "The current wording leaves the cause-to-action rationale open to customer follow-up.",
      },
    ],
    additionalRisks: [
      {
        id: "action-linkage-not-explicit",
        section: "D5",
        severity: "medium",
        category: "corrective_action",
        title: "Action linkage is not explicit",
        explanation:
          "The action statement does not explicitly connect the keyed fixture to the stated occurrence mechanism.",
        sourceExcerpt: "A keyed fixture will be added.",
        factsNeeded: [
          "Explain how the keyed fixture controls the stated occurrence mechanism.",
        ],
        likelyCustomerQuestion:
          "How does the keyed fixture address the stated occurrence cause?",
        confidence: "medium",
      },
    ],
    englishRewrites: [
      {
        section: "D5",
        sourceExcerpt: "A keyed fixture will be added.",
        suggestedEnglish:
          "A keyed fixture is planned. [ADD VERIFIED FACT: IMPLEMENTATION OWNER AND COMPLETION DATE]",
        placeholders: [
          "[ADD VERIFIED FACT: IMPLEMENTATION OWNER AND COMPLETION DATE]",
        ],
        confidence: "medium",
      },
    ],
    limitations: [
      "The supplied text does not establish implementation or effectiveness.",
    ],
  };
}

function cloneOverlay() {
  return structuredClone(validOverlay());
}

async function main() {
  assert.equal(
    getRejectionReviewAiModel({}),
    DEFAULT_REJECTION_REVIEW_AI_MODEL,
    "The official current DeepSeek Flash model should be the default",
  );
  assert.equal(
    getRejectionReviewAiModel({ REJECTION_REVIEW_AI_MODEL: "deepseek-v4-pro" }),
    "deepseek-v4-pro",
    "The task-specific model environment variable should override the default",
  );
  assert.equal(
    getRejectionReviewAiModel({ DEEPSEEK_MODEL: "deepseek-v4-flash-custom" }),
    "deepseek-v4-flash-custom",
    "The shared DeepSeek model environment variable should remain configurable",
  );

  const accepted = validateRejectionReviewAiOverlay(cloneOverlay(), {
    rawReport: RAW_REPORT,
    deterministicReview,
  });
  assert.equal(accepted.success, true, JSON.stringify(accepted.issues));

  const unknownTopLevel = {
    ...cloneOverlay(),
    status: "submittable_with_risk",
  };
  const unknownResult = validateRejectionReviewAiOverlay(unknownTopLevel, {
    rawReport: RAW_REPORT,
    deterministicReview,
  });
  assert.equal(unknownResult.success, false);
  assert.equal(
    unknownResult.issues.some((issue) => issue.code === "schema_unknown_key"),
    true,
    "The overlay must not be able to replace the deterministic status",
  );

  const downgradeAttempt = cloneOverlay() as RejectionReviewAiOverlay & {
    explanations: Array<Record<string, unknown>>;
  };
  downgradeAttempt.explanations[0].severity = "low";
  const downgradeResult = validateRejectionReviewAiOverlay(downgradeAttempt, {
    rawReport: RAW_REPORT,
    deterministicReview,
  });
  assert.equal(downgradeResult.success, false);
  assert.equal(
    downgradeResult.issues.some((issue) => issue.code === "schema_unknown_key"),
    true,
    "An explanation cannot downgrade a deterministic finding",
  );

  const fabricatedFacts = cloneOverlay();
  fabricatedFacts.englishRewrites[0] = {
    ...fabricatedFacts.englishRewrites[0],
    suggestedEnglish:
      "Testing of 47 units was completed on 2026-09-01 and all samples passed.",
    placeholders: [],
  };
  const fabricatedFactsResult = validateRejectionReviewAiOverlay(
    fabricatedFacts,
    { rawReport: RAW_REPORT, deterministicReview },
  );
  assert.equal(fabricatedFactsResult.success, false);
  for (const code of [
    "unsupported_date",
    "unsupported_quantity",
    "unsupported_test_result",
    "unsupported_implementation_status",
  ]) {
    assert.equal(
      fabricatedFactsResult.issues.some((issue) => issue.code === code),
      true,
      `Fabricated output should be rejected with ${code}`,
    );
  }

  const fabricatedDecisions = cloneOverlay();
  fabricatedDecisions.englishRewrites[0] = {
    ...fabricatedDecisions.englishRewrites[0],
    suggestedEnglish:
      "The corrective action was approved and implemented, and the root cause was confirmed.",
    placeholders: [],
  };
  const fabricatedDecisionsResult = validateRejectionReviewAiOverlay(
    fabricatedDecisions,
    { rawReport: RAW_REPORT, deterministicReview },
  );
  assert.equal(fabricatedDecisionsResult.success, false);
  for (const code of [
    "unsupported_approval",
    "unsupported_implementation_status",
    "unsupported_confirmed_root_cause",
  ]) {
    assert.equal(
      fabricatedDecisionsResult.issues.some((issue) => issue.code === code),
      true,
      `Fabricated decision output should be rejected with ${code}`,
    );
  }

  const unsupportedVerification = cloneOverlay();
  unsupportedVerification.englishRewrites[0] = {
    ...unsupportedVerification.englishRewrites[0],
    suggestedEnglish: "The corrective action was verified as effective.",
    placeholders: [],
  };
  const unsupportedVerificationResult = validateRejectionReviewAiOverlay(
    unsupportedVerification,
    { rawReport: RAW_REPORT, deterministicReview },
  );
  assert.equal(unsupportedVerificationResult.success, false);
  assert.equal(
    unsupportedVerificationResult.issues.some(
      (issue) => issue.code === "unsupported_test_result",
    ),
    true,
  );

  const inventedExcerpt = cloneOverlay();
  inventedExcerpt.additionalRisks[0].sourceExcerpt =
    "This sentence is not in the source report.";
  const inventedExcerptResult = validateRejectionReviewAiOverlay(
    inventedExcerpt,
    { rawReport: RAW_REPORT, deterministicReview },
  );
  assert.equal(inventedExcerptResult.success, false);
  assert.equal(
    inventedExcerptResult.issues.some(
      (issue) => issue.code === "source_excerpt_not_found",
    ),
    true,
  );

  const supportedSource = [
    RAW_REPORT,
    "D4 The root cause was confirmed from the supplied process record.",
    "D5 The corrective action was implemented and approved.",
    "D6 Testing of 47 units was completed on 2026-09-01 and all samples passed.",
  ].join("\n");
  const supportedClaims = cloneOverlay();
  supportedClaims.englishRewrites[0] = {
    section: "D6",
    sourceExcerpt:
      "Testing of 47 units was completed on 2026-09-01 and all samples passed.",
    suggestedEnglish:
      "Testing of 47 units was completed on 2026-09-01 and all samples passed. The corrective action was implemented and approved, and the root cause was confirmed.",
    placeholders: [],
    confidence: "medium",
  };
  const supportedResult = validateRejectionReviewAiOverlay(supportedClaims, {
    rawReport: supportedSource,
    deterministicReview,
  });
  assert.equal(supportedResult.success, true, JSON.stringify(supportedResult.issues));

  const applied = applyRejectionReviewAiOverlay(
    deterministicReview,
    accepted.success ? accepted.data : cloneOverlay(),
  );
  const originalFinding = applied.review.findings.find(
    (finding) => finding.id === "deterministic-linkage-gap",
  );
  assert.deepEqual(
    originalFinding,
    deterministicReview.findings[0],
    "The deterministic finding must remain byte-for-byte equivalent after enrichment",
  );
  assert.equal(
    applied.review.findings.some(
      (finding) => finding.id === "ai:action-linkage-not-explicit",
    ),
    true,
  );
  assert.equal(
    applied.overlay.explanations[0]?.findingId,
    "deterministic-linkage-gap",
  );

  let capturedRequest: RequestInit | undefined;
  const provider = new DeepSeekRejectionReviewAiClient({
    env: {
      DEEPSEEK_API_KEY: "test-key",
      REJECTION_REVIEW_AI_MODEL: "deepseek-v4-pro",
    },
    fetchImpl: async (_input, init) => {
      capturedRequest = init;
      return new Response(
        JSON.stringify({
          choices: [
            {
              finish_reason: "stop",
              message: { content: JSON.stringify(cloneOverlay()) },
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    },
  });
  const providerOutput = await provider.generateOverlay({
    rawReport: RAW_REPORT,
    deterministicReview,
  });
  assert.deepEqual(providerOutput, cloneOverlay());
  const requestBody = JSON.parse(String(capturedRequest?.body));
  assert.equal(requestBody.model, "deepseek-v4-pro");
  assert.deepEqual(requestBody.thinking, { type: "disabled" });
  assert.deepEqual(requestBody.response_format, { type: "json_object" });
  assert.equal(requestBody.messages[0].content.includes("JSON"), true);

  class FakeClient implements RejectionReviewAiClient {
    readonly modelIdentifier = "fake-provider";
    constructor(private readonly value: unknown | Error) {}
    async generateOverlay() {
      if (this.value instanceof Error) throw this.value;
      return this.value;
    }
  }

  const generated = await runRejectionReviewAiOverlay(
    { rawReport: RAW_REPORT, deterministicReview },
    { client: new FakeClient(cloneOverlay()) },
  );
  assert.equal(generated.policyOutcome, "ai_accepted");
  assert.equal(generated.overlay?.schemaVersion, "rejection-review-ai-overlay-v1");
  assert.equal(generated.review.findings.length, 2);

  const invalidFallback = await runRejectionReviewAiOverlay(
    { rawReport: RAW_REPORT, deterministicReview },
    { client: new FakeClient(fabricatedFacts) },
  );
  assert.equal(invalidFallback.policyOutcome, "deterministic_only");
  assert.equal(invalidFallback.failureCategory, "unsupported_claim");
  assert.deepEqual(invalidFallback.review, deterministicReview);
  assert.equal(invalidFallback.overlay, null);

  const unavailableFallback = await runRejectionReviewAiOverlay(
    { rawReport: RAW_REPORT, deterministicReview },
    {
      client: new FakeClient(
        new RejectionReviewAiProviderError(
          "provider_unavailable",
          "AI provider is temporarily unavailable.",
        ),
      ),
    },
  );
  assert.equal(unavailableFallback.policyOutcome, "deterministic_only");
  assert.equal(unavailableFallback.failureCategory, "provider_unavailable");
  assert.deepEqual(unavailableFallback.review, deterministicReview);
  assert.equal(unavailableFallback.overlay, null);

  console.log("Rejection Review AI overlay contract tests passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
