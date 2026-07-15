import assert from "node:assert/strict";
import {
  EVIDENCE_REQUIREMENTS,
  GUIDED_QUESTIONS,
  GUIDED_STAGES,
  QUALITY_COACH_AGENT_CONTRACTS,
  QUALITY_COACH_AGENT_TYPES,
  classifyGuidedAnswer,
  getGuidedFollowUps,
  getGuidedQualityInsights,
  getGuidedReportFieldReferences,
  getGuidedStageCompletion,
} from "@/lib/quality-cases/guided-contract";

assert.deepEqual(GUIDED_STAGES, [
  "problem_description",
  "containment",
  "occurrence_cause",
  "escape_cause",
  "corrective_action",
  "verification_and_prevention",
]);
assert.equal(GUIDED_QUESTIONS.length, 6);
assert.equal(GUIDED_QUESTIONS.every((question) => question.userFacingQuestion.length > 0), true);
assert.equal(GUIDED_QUESTIONS.every((question) => question.mappedQualityConcepts.length > 0), true);
assert.equal(
  GUIDED_QUESTIONS.some((question) => "legacy8dFields" in question),
  false,
  "Guided questions must map to quality concepts rather than directly to D-fields.",
);

const occurrenceFollowUps = getGuidedFollowUps({
  category: "occurrence_cause",
  originalAnswer: "员工操作错误。",
});
assert.equal(occurrenceFollowUps.length, 2);
assert.match(occurrenceFollowUps[0].question, /为什么有机会做错/);
assert.match(occurrenceFollowUps[1].question, /为什么没有发现/);

const trainingFollowUp = getGuidedFollowUps({
  category: "corrective_action",
  originalAnswer: "我们会加强培训并提醒员工。",
});
assert.equal(trainingFollowUp.length, 1);
assert.match(trainingFollowUp[0].question, /除了培训/);
assert.equal(
  getGuidedFollowUps({
    category: "corrective_action",
    originalAnswer: "完成培训，同时更换防错夹具。",
  }).some((rule) => rule.trigger === "training_only"),
  false,
  "A stated durable control must not be mislabelled as training-only.",
);

const inspectionFollowUp = getGuidedFollowUps({
  category: "corrective_action",
  originalAnswer: "我们增加检查。",
});
assert.equal(inspectionFollowUp.length, 1);
assert.equal(inspectionFollowUp[0].trigger, "inspection_only");
assert.match(inspectionFollowUp[0].question, /更难发生/);

const effectivenessFollowUp = getGuidedFollowUps({
  category: "verification_plan",
  originalAnswer: "措施已改善，后续有效。",
});
assert.equal(effectivenessFollowUp.length, 1);
assert.equal(effectivenessFollowUp[0].trigger, "effectiveness_claim");
assert.match(effectivenessFollowUp[0].question, /验证/);

assert.equal(classifyGuidedAnswer({ category: "occurrence_cause", originalAnswer: "可能是工装定位松动。" }), "hypothesis");
assert.equal(classifyGuidedAnswer({ category: "corrective_action", originalAnswer: "更换定位销并在下周完成。" }), "planned_action");
assert.equal(classifyGuidedAnswer({ category: "verification_result", originalAnswer: "抽检 10 件均合格。" }), "stated_fact");
assert.equal(
  classifyGuidedAnswer({
    category: "verification_result",
    originalAnswer: "抽检 10 件均合格。",
    evidenceRequirementIds: ["verification_result"],
  }),
  "verified_result",
);
assert.equal(classifyGuidedAnswer({ category: "problem_fact", originalAnswer: "暂不清楚，需要核实批次。" }), "unknown");

const correctiveTargets = getGuidedReportFieldReferences({ category: "corrective_action" });
assert.deepEqual(correctiveTargets.map((target) => target.semanticKey), ["corrective_action", "implementation_plan"]);
assert.equal(correctiveTargets.every((target) => target.writePolicy === "human_confirmation_required"), true);
assert.equal(correctiveTargets[0].legacy8dFields.includes("selectedCorrectiveAction"), true);
assert.equal(correctiveTargets[0].supportedOutputTypes.includes("scar"), true);
assert.equal(correctiveTargets[0].supportedOutputTypes.includes("capa"), true);

const inspectionInsights = getGuidedQualityInsights({
  category: "corrective_action",
  originalAnswer: "增加检查。",
});
assert.equal(inspectionInsights.length, 1);
assert.equal(inspectionInsights[0].reportEligibility, "advisory_only");
assert.equal(inspectionInsights[0].mayTransitionCase, false);
assert.match(inspectionInsights[0].message, /检测改进/);

assert.equal(EVIDENCE_REQUIREMENTS.some((requirement) => requirement.id === "inspection_record"), true);
assert.equal(EVIDENCE_REQUIREMENTS.some((requirement) => requirement.id === "traceability_scope"), true);
assert.equal(EVIDENCE_REQUIREMENTS.some((requirement) => requirement.id === "verification_result"), true);

const incompleteProblem = getGuidedStageCompletion({
  stage: "problem_description",
  answers: [{ linkedQualityConcepts: ["problem_symptom"] }],
});
assert.equal(incompleteProblem.complete, false);
assert.deepEqual(incompleteProblem.missingConcepts, ["problem_scope", "problem_discovery"]);

const completeProblem = getGuidedStageCompletion({
  stage: "problem_description",
  answers: [{ linkedQualityConcepts: ["problem_symptom", "problem_scope", "problem_discovery"] }],
});
assert.equal(completeProblem.complete, true);

assert.deepEqual(QUALITY_COACH_AGENT_TYPES, ["investigator", "quality_reviewer", "customer_simulator"]);
for (const contract of Object.values(QUALITY_COACH_AGENT_CONTRACTS)) {
  assert.equal(contract.mayTransitionCase, false);
  assert.equal(contract.prohibited.includes("transition_case"), true);
  assert.equal(contract.prohibited.includes("approve"), true);
}
assert.equal(QUALITY_COACH_AGENT_CONTRACTS.customer_simulator.prohibited.includes("read_unconfirmed_supplier_data"), true);

console.log("Guided Quality Experience domain contract tests passed.");
