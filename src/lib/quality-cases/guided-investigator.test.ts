import assert from "node:assert/strict";
import { buildGuidedInvestigatorPrompt, validateGuidedInvestigatorResponse } from "@/lib/quality-cases/guided-investigator";

const valid = validateGuidedInvestigatorResponse({ schemaVersion: "guided-investigator-v1", confidence: "medium", missingConcepts: ["process_control"], nextQuestion: "作业指导和防错措施是什么？", whyAsked: "需要了解流程为何允许错误发生。", insight: { kind: "logic_risk", message: "当前回答仍是直接原因。" } });
assert.equal(valid.success, true);
assert.equal(validateGuidedInvestigatorResponse({ schemaVersion: "guided-investigator-v1", confidence: "high", missingConcepts: [], nextQuestion: "下一步？", whyAsked: "原因", confirmedRootCause: "operator error" }).success, false);
assert.equal(validateGuidedInvestigatorResponse({ schemaVersion: "guided-investigator-v1", confidence: "high", missingConcepts: [], nextQuestion: "下一步？", whyAsked: "原因", workflowAction: "close_case" }).success, false);
const prompt = buildGuidedInvestigatorPrompt({ stage: "occurrence_cause", category: "occurrence_cause", currentQuestion: "为什么发生？", answer: "员工操作错误", priorAnswers: [] });
assert.match(prompt, /not a report writer or approver/i);
assert.match(prompt, /operator error/i);
console.log("Guided Investigator contract tests passed.");
