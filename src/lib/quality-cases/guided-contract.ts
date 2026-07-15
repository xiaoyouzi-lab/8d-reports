import type { ReportData } from "@/lib/report-steps";
import type { QualityCaseOutputType } from "@/lib/quality-cases/contract";

/**
 * Framework- and database-independent contract for Guided Mode.
 *
 * A Guided question maps to durable quality concepts. A separate mapping layer
 * can then map a confirmed answer to an 8D field or a future SCAR/CAR/CAPA/
 * customer-template field. Nothing in this module writes a report, changes a
 * Case, or treats AI output as human-confirmed content.
 */

export const GUIDED_STAGES = [
  "problem_description",
  "containment",
  "occurrence_cause",
  "escape_cause",
  "corrective_action",
  "verification_and_prevention",
] as const;

export type GuidedStage = (typeof GUIDED_STAGES)[number];

export const QUALITY_CONCEPTS = [
  "problem_symptom",
  "problem_scope",
  "problem_discovery",
  "containment_action",
  "containment_scope",
  "occurrence_root_cause",
  "escape_root_cause",
  "process_control",
  "detection_improvement",
  "permanent_corrective_action",
  "implementation_plan",
  "effectiveness_verification_plan",
  "effectiveness_verification_result",
  "recurrence_prevention",
  "horizontal_deployment",
  "lessons_learned",
] as const;

export type QualityConcept = (typeof QUALITY_CONCEPTS)[number];

export const GUIDED_ANSWER_CATEGORIES = [
  "problem_fact",
  "containment_action",
  "occurrence_cause",
  "escape_cause",
  "corrective_action",
  "verification_plan",
  "verification_result",
  "prevention_action",
] as const;

export type GuidedAnswerCategory = (typeof GUIDED_ANSWER_CATEGORIES)[number];

export const GUIDED_ANSWER_CLASSIFICATIONS = [
  "stated_fact",
  "hypothesis",
  "planned_action",
  "verified_result",
  "unknown",
] as const;

export type GuidedAnswerClassification = (typeof GUIDED_ANSWER_CLASSIFICATIONS)[number];

export type GuidedAnswerSource =
  | "supplier_guest"
  | "supplier_member"
  | "coordinator"
  | "internal_member";

export type AiConfidence = "low" | "medium" | "high";

export type GuidedAnswerType = "free_text" | "structured_facts" | "action_plan" | "evidence_reference";

export type EvidenceRequirementKind =
  | "batch_or_traceability"
  | "inspection_record"
  | "photo_or_video"
  | "test_result"
  | "process_record"
  | "action_record";

export interface EvidenceRequirement {
  id: string;
  concepts: readonly QualityConcept[];
  kind: EvidenceRequirementKind;
  userFacingReason: string;
  requiredWhen: "claim_is_made" | "verification_result_is_claimed" | "customer_request" | "recommended";
  prevents: string;
}

export type GuidedFollowUpTrigger =
  | "direct_cause"
  | "inspection_missed"
  | "training_only"
  | "inspection_only"
  | "effectiveness_claim"
  | "missing_required_concept";

export interface GuidedFollowUpRule {
  id: string;
  trigger: GuidedFollowUpTrigger;
  appliesTo: readonly GuidedAnswerCategory[];
  keywords: readonly string[];
  /** A rule such as "training only" does not apply when a durable control is stated too. */
  unlessKeywords?: readonly string[];
  question: string;
  explanation: string;
  mappedConcepts: readonly QualityConcept[];
  evidenceRequirementIds?: readonly string[];
}

export interface GuidedQuestion {
  id: string;
  stage: GuidedStage;
  category: GuidedAnswerCategory;
  userFacingQuestion: string;
  explanation: string;
  answerType: GuidedAnswerType;
  mappedQualityConcepts: readonly QualityConcept[];
  followUpRuleIds: readonly string[];
  evidenceRequirementIds: readonly string[];
}

/**
 * User-provided content is always stored verbatim. AI interpretation and AI
 * suggestions are intentionally separate, unconfirmed, and ineligible for a
 * final report until a human confirms a mapped field in a later PR.
 */
export interface GuidedAnswer {
  id: string;
  questionId: string;
  category: GuidedAnswerCategory;
  source: GuidedAnswerSource;
  originalAnswer: {
    text: string;
    language: "zh-CN" | "en";
    submittedAt: string;
  };
  userFact: {
    classification: GuidedAnswerClassification;
    statedByHuman: true;
  };
  aiInterpretation?: {
    summary: string;
    confidence: AiConfidence;
    status: "unconfirmed";
  };
  aiSuggestion?: {
    text: string;
    status: "advisory_only";
  };
  missingInformation: readonly QualityConcept[];
  linkedQualityConcepts: readonly QualityConcept[];
  followUpQuestionIds: readonly string[];
  evidenceRequirementIds: readonly string[];
}

export type QualityInsightKind =
  | "missing_information"
  | "logic_risk"
  | "customer_attention_point"
  | "verification_suggestion"
  | "evidence_needed";

export type QualityInsightSeverity = "info" | "attention" | "high";

/** AI advisory record. It is never a formal report field or workflow action. */
export interface QualityInsight {
  id: string;
  kind: QualityInsightKind;
  severity: QualityInsightSeverity;
  affectedConcepts: readonly QualityConcept[];
  message: string;
  suggestedQuestion?: string;
  evidenceRequirementIds: readonly string[];
  reportEligibility: "advisory_only";
  mayTransitionCase: false;
}

export type GuidedOutputSemanticKey =
  | "complaint_summary"
  | "containment"
  | "occurrence_analysis"
  | "escape_analysis"
  | "corrective_action"
  | "implementation_plan"
  | "effectiveness_verification"
  | "preventive_action"
  | "lessons_learned";

export interface GuidedReportFieldReference {
  semanticKey: GuidedOutputSemanticKey;
  qualityCaseTextFieldPath?: string;
  legacy8dFields: readonly (keyof ReportData)[];
  supportedOutputTypes: readonly QualityCaseOutputType[];
  writePolicy: "human_confirmation_required";
}

/**
 * The contract's core indirection: Answer category -> quality concept ->
 * semantic output target -> legacy output compatibility fields. Future output
 * templates can consume semanticKey without changing Guided questions.
 */
export interface GuidedFieldMapping {
  answerCategory: GuidedAnswerCategory;
  concept: QualityConcept;
  target: GuidedReportFieldReference;
}

export const EVIDENCE_REQUIREMENTS: readonly EvidenceRequirement[] = [
  {
    id: "traceability_scope",
    concepts: ["problem_scope"],
    kind: "batch_or_traceability",
    userFacingReason: "批次、订单或序列号能帮助确认影响范围，避免遗漏库存或已发货产品。",
    requiredWhen: "claim_is_made",
    prevents: "把不完整范围当成已隔离范围。",
  },
  {
    id: "containment_record",
    concepts: ["containment_action", "containment_scope"],
    kind: "action_record",
    userFacingReason: "隔离、筛选或停发记录能说明临时控制实际覆盖了哪些产品。",
    requiredWhen: "claim_is_made",
    prevents: "把计划中的控制措施写成已完成。",
  },
  {
    id: "inspection_record",
    concepts: ["escape_root_cause", "detection_improvement"],
    kind: "inspection_record",
    userFacingReason: "检验记录能说明当时怎样检查，以及为什么没有提前发现问题。",
    requiredWhen: "recommended",
    prevents: "把“漏检”当成完整原因。",
  },
  {
    id: "process_record",
    concepts: ["occurrence_root_cause", "process_control"],
    kind: "process_record",
    userFacingReason: "工艺、设备、工装或操作记录可帮助确认问题发生的条件。",
    requiredWhen: "recommended",
    prevents: "把未经确认的推测写成根因。",
  },
  {
    id: "verification_result",
    concepts: ["effectiveness_verification_result"],
    kind: "test_result",
    userFacingReason: "实际测试或验证记录才能支持“措施有效”的结论。",
    requiredWhen: "verification_result_is_claimed",
    prevents: "把验证计划写成验证结果。",
  },
  {
    id: "defect_photo",
    concepts: ["problem_symptom"],
    kind: "photo_or_video",
    userFacingReason: "缺陷照片或视频可帮助确认问题现象，但不能替代数量、批次或测试记录。",
    requiredWhen: "recommended",
    prevents: "仅凭口头描述误判缺陷现象。",
  },
];

export const GUIDED_FOLLOW_UP_RULES: readonly GuidedFollowUpRule[] = [
  {
    id: "direct_cause_requires_system_explanation",
    trigger: "direct_cause",
    appliesTo: ["occurrence_cause"],
    keywords: ["员工错误", "操作错误", "操作失误", "人为错误", "人为疏忽", "operator error", "human error"],
    question: "员工为什么有机会做错？流程、工装、作业指导或设置中原本应防止该错误的措施是什么，为什么没有起作用？",
    explanation: "“员工操作错误”是直接原因。客户通常还会追问系统为什么允许这个错误发生。",
    mappedConcepts: ["occurrence_root_cause", "process_control"],
    evidenceRequirementIds: ["process_record"],
  },
  {
    id: "direct_cause_requires_escape_explanation",
    trigger: "direct_cause",
    appliesTo: ["occurrence_cause"],
    keywords: ["员工错误", "操作错误", "操作失误", "人为错误", "人为疏忽", "operator error", "human error"],
    question: "出货前或下一道工序为什么没有发现这个错误？当时采用了什么检查方式？",
    explanation: "发生原因和未发现原因需要分别说明。",
    mappedConcepts: ["escape_root_cause"],
    evidenceRequirementIds: ["inspection_record"],
  },
  {
    id: "inspection_missed_requires_method",
    trigger: "inspection_missed",
    appliesTo: ["escape_cause"],
    keywords: ["漏检", "没检查出来", "未发现", "检验员", "inspection missed", "not detected"],
    question: "当时检查什么、怎样检查、抽检范围或频次是什么？该缺陷是否能被这种方法发现？",
    explanation: "“漏检”还不能解释检查控制为什么失效。",
    mappedConcepts: ["escape_root_cause", "process_control"],
    evidenceRequirementIds: ["inspection_record"],
  },
  {
    id: "training_only_requires_durable_control",
    trigger: "training_only",
    appliesTo: ["corrective_action", "prevention_action"],
    keywords: ["培训", "提醒", "加强管理", "注意操作", "training", "remind operator"],
    unlessKeywords: ["工装", "夹具", "防错", "流程", "标准", "自动", "程序", "tooling", "fixture", "poka", "process control"],
    question: "培训可以作为支持措施。除了培训，是否会改变流程、工具、工装、标准或检查方式，让同样的错误更难发生或更容易被发现？",
    explanation: "培训本身可能是短期措施，仍需说明更持久的控制方式。",
    mappedConcepts: ["permanent_corrective_action", "detection_improvement", "recurrence_prevention"],
  },
  {
    id: "inspection_only_requires_prevention",
    trigger: "inspection_only",
    appliesTo: ["corrective_action", "prevention_action"],
    keywords: ["增加检查", "全检", "加严检查", "增加检验", "100% inspection", "add inspection"],
    question: "增加检查属于更早发现问题的改进。除了检查，是否有措施让问题本身更难发生？请说明责任人和完成时间。",
    explanation: "检测改进可以降低流出风险，但不必然消除发生原因。",
    mappedConcepts: ["detection_improvement", "permanent_corrective_action", "implementation_plan"],
    evidenceRequirementIds: ["inspection_record"],
  },
  {
    id: "effectiveness_claim_requires_evidence",
    trigger: "effectiveness_claim",
    appliesTo: ["verification_plan", "verification_result"],
    keywords: ["有效", "已改善", "已解决", "没有问题", "effective", "resolved", "improved"],
    question: "请说明如何验证、覆盖多少批或多少件、实际结果是什么、何时完成，并附上可用记录。若尚未验证，请把它作为验证计划保存。",
    explanation: "验证计划和已经取得的验证结果必须分开记录。",
    mappedConcepts: ["effectiveness_verification_plan", "effectiveness_verification_result"],
    evidenceRequirementIds: ["verification_result"],
  },
];

export const GUIDED_QUESTIONS: readonly GuidedQuestion[] = [
  {
    id: "problem_facts",
    stage: "problem_description",
    category: "problem_fact",
    userFacingQuestion: "请用自己的话说明发现了什么问题。在哪个产品、批次或订单中发现？影响多少？在哪里发现？",
    explanation: "先确认问题和影响范围，避免后续调查遗漏产品或批次。",
    answerType: "structured_facts",
    mappedQualityConcepts: ["problem_symptom", "problem_scope", "problem_discovery"],
    followUpRuleIds: [],
    evidenceRequirementIds: ["traceability_scope", "defect_photo"],
  },
  {
    id: "containment_action",
    stage: "containment",
    category: "containment_action",
    userFacingQuestion: "为了避免更多不良流出，当时先做了什么？从什么时候开始？覆盖哪些库存、在制品或已发货产品？",
    explanation: "临时控制和长期改善不同；请记录实际已做的动作和范围。",
    answerType: "action_plan",
    mappedQualityConcepts: ["containment_action", "containment_scope"],
    followUpRuleIds: [],
    evidenceRequirementIds: ["containment_record"],
  },
  {
    id: "occurrence_cause",
    stage: "occurrence_cause",
    category: "occurrence_cause",
    userFacingQuestion: "请描述出错前后的实际流程。这个错误为什么有机会发生？原本应如何防止？",
    explanation: "我们需要理解流程条件，而不只是指出谁做错了。",
    answerType: "free_text",
    mappedQualityConcepts: ["occurrence_root_cause", "process_control"],
    followUpRuleIds: ["direct_cause_requires_system_explanation", "direct_cause_requires_escape_explanation"],
    evidenceRequirementIds: ["process_record"],
  },
  {
    id: "escape_cause",
    stage: "escape_cause",
    category: "escape_cause",
    userFacingQuestion: "产品在出货前或下一道工序为什么没有被发现？当时检查什么、怎样检查？",
    explanation: "发生原因和没有发现的原因可能不同，需要分别说明。",
    answerType: "free_text",
    mappedQualityConcepts: ["escape_root_cause", "process_control"],
    followUpRuleIds: ["inspection_missed_requires_method"],
    evidenceRequirementIds: ["inspection_record"],
  },
  {
    id: "corrective_action",
    stage: "corrective_action",
    category: "corrective_action",
    userFacingQuestion: "除了提醒和培训，准备怎样改变流程、工具、工装、标准或检查，让同样的问题更难发生或更容易被发现？谁负责，何时完成？",
    explanation: "客户通常会关心长期控制，而不仅是一次性提醒。",
    answerType: "action_plan",
    mappedQualityConcepts: ["permanent_corrective_action", "detection_improvement", "implementation_plan"],
    followUpRuleIds: ["training_only_requires_durable_control", "inspection_only_requires_prevention"],
    evidenceRequirementIds: ["action_record", "inspection_record"],
  },
  {
    id: "verification_and_prevention",
    stage: "verification_and_prevention",
    category: "verification_plan",
    userFacingQuestion: "完成后怎样确认措施有效？检查什么范围、用什么方法、由谁记录？还会怎样防止同类问题在其他产品或工序发生？",
    explanation: "请把验证计划和已经取得的验证结果分开说明。",
    answerType: "action_plan",
    mappedQualityConcepts: ["effectiveness_verification_plan", "effectiveness_verification_result", "recurrence_prevention", "horizontal_deployment"],
    followUpRuleIds: ["effectiveness_claim_requires_evidence"],
    evidenceRequirementIds: ["verification_result"],
  },
];

const ALL_OUTPUT_TYPES: readonly QualityCaseOutputType[] = [
  "8d",
  "scar",
  "car",
  "capa",
  "ncr_response",
  "corrective_action_report",
];

const TARGETS: Record<GuidedOutputSemanticKey, GuidedReportFieldReference> = {
  complaint_summary: {
    semanticKey: "complaint_summary",
    qualityCaseTextFieldPath: "complaint_summary",
    legacy8dFields: ["problemDescription", "productName", "batchNumber", "whereFound", "whenFound", "defectQuantity", "totalQuantity"],
    supportedOutputTypes: ALL_OUTPUT_TYPES,
    writePolicy: "human_confirmation_required",
  },
  containment: {
    semanticKey: "containment",
    qualityCaseTextFieldPath: "containment",
    legacy8dFields: ["containmentDescription", "containmentScope", "containmentResponsible", "containmentDueDate", "containmentVerification"],
    supportedOutputTypes: ALL_OUTPUT_TYPES,
    writePolicy: "human_confirmation_required",
  },
  occurrence_analysis: {
    semanticKey: "occurrence_analysis",
    qualityCaseTextFieldPath: "root_cause",
    legacy8dFields: ["rootCauseOccurrence", "why1", "why2", "why3", "why4", "why5", "confirmedRootCause"],
    supportedOutputTypes: ALL_OUTPUT_TYPES,
    writePolicy: "human_confirmation_required",
  },
  escape_analysis: {
    semanticKey: "escape_analysis",
    qualityCaseTextFieldPath: "root_cause",
    legacy8dFields: ["rootCauseEscape", "fishboneMeasurement", "testingPlan", "testingResults"],
    supportedOutputTypes: ALL_OUTPUT_TYPES,
    writePolicy: "human_confirmation_required",
  },
  corrective_action: {
    semanticKey: "corrective_action",
    qualityCaseTextFieldPath: "corrective_action",
    legacy8dFields: ["selectedCorrectiveAction", "correctiveRationale", "correctiveResponsible", "correctiveTargetDate"],
    supportedOutputTypes: ALL_OUTPUT_TYPES,
    writePolicy: "human_confirmation_required",
  },
  implementation_plan: {
    semanticKey: "implementation_plan",
    qualityCaseTextFieldPath: "implementation_plan",
    legacy8dFields: ["implementationPlan", "completionDate"],
    supportedOutputTypes: ALL_OUTPUT_TYPES,
    writePolicy: "human_confirmation_required",
  },
  effectiveness_verification: {
    semanticKey: "effectiveness_verification",
    qualityCaseTextFieldPath: "effectiveness_verification",
    legacy8dFields: ["validationMethod", "validationResults"],
    supportedOutputTypes: ALL_OUTPUT_TYPES,
    writePolicy: "human_confirmation_required",
  },
  preventive_action: {
    semanticKey: "preventive_action",
    qualityCaseTextFieldPath: "preventive_action",
    legacy8dFields: ["systemChanges", "processUpdates", "horizontalDeployment", "trainingNeeds"],
    supportedOutputTypes: ALL_OUTPUT_TYPES,
    writePolicy: "human_confirmation_required",
  },
  lessons_learned: {
    semanticKey: "lessons_learned",
    qualityCaseTextFieldPath: "lessons_learned",
    legacy8dFields: ["lessonsLearned"],
    supportedOutputTypes: ALL_OUTPUT_TYPES,
    writePolicy: "human_confirmation_required",
  },
};

export const GUIDED_FIELD_MAPPINGS: readonly GuidedFieldMapping[] = [
  { answerCategory: "problem_fact", concept: "problem_symptom", target: TARGETS.complaint_summary },
  { answerCategory: "problem_fact", concept: "problem_scope", target: TARGETS.complaint_summary },
  { answerCategory: "problem_fact", concept: "problem_discovery", target: TARGETS.complaint_summary },
  { answerCategory: "containment_action", concept: "containment_action", target: TARGETS.containment },
  { answerCategory: "containment_action", concept: "containment_scope", target: TARGETS.containment },
  { answerCategory: "occurrence_cause", concept: "occurrence_root_cause", target: TARGETS.occurrence_analysis },
  { answerCategory: "occurrence_cause", concept: "process_control", target: TARGETS.occurrence_analysis },
  { answerCategory: "escape_cause", concept: "escape_root_cause", target: TARGETS.escape_analysis },
  { answerCategory: "escape_cause", concept: "process_control", target: TARGETS.escape_analysis },
  { answerCategory: "corrective_action", concept: "permanent_corrective_action", target: TARGETS.corrective_action },
  { answerCategory: "corrective_action", concept: "detection_improvement", target: TARGETS.corrective_action },
  { answerCategory: "corrective_action", concept: "implementation_plan", target: TARGETS.implementation_plan },
  { answerCategory: "verification_plan", concept: "effectiveness_verification_plan", target: TARGETS.effectiveness_verification },
  { answerCategory: "verification_result", concept: "effectiveness_verification_result", target: TARGETS.effectiveness_verification },
  { answerCategory: "prevention_action", concept: "recurrence_prevention", target: TARGETS.preventive_action },
  { answerCategory: "prevention_action", concept: "horizontal_deployment", target: TARGETS.preventive_action },
  { answerCategory: "prevention_action", concept: "lessons_learned", target: TARGETS.lessons_learned },
];

function normalized(value: string) {
  return value.trim().toLocaleLowerCase();
}

function containsKeyword(text: string, keywords: readonly string[]) {
  const value = normalized(text);
  return keywords.some((keyword) => value.includes(keyword.toLocaleLowerCase()));
}

export function getGuidedQuestion(questionId: string) {
  return GUIDED_QUESTIONS.find((question) => question.id === questionId) || null;
}

export function getEvidenceRequirement(requirementId: string) {
  return EVIDENCE_REQUIREMENTS.find((requirement) => requirement.id === requirementId) || null;
}

export function getGuidedFollowUps(input: {
  category: GuidedAnswerCategory;
  originalAnswer: string;
}): GuidedFollowUpRule[] {
  if (!input.originalAnswer.trim()) return [];
  return GUIDED_FOLLOW_UP_RULES.filter((rule) =>
    rule.appliesTo.includes(input.category) &&
    containsKeyword(input.originalAnswer, rule.keywords) &&
    !(rule.unlessKeywords && containsKeyword(input.originalAnswer, rule.unlessKeywords)),
  );
}

/**
 * Conservative deterministic hints for later Coach UI. They do not claim a
 * root cause, generate facts, or make a response eligible for output.
 */
export function getGuidedQualityInsights(input: {
  category: GuidedAnswerCategory;
  originalAnswer: string;
}): QualityInsight[] {
  return getGuidedFollowUps(input).map((rule) => ({
    id: `rule:${rule.id}`,
    kind:
      rule.trigger === "effectiveness_claim"
        ? "verification_suggestion"
        : rule.trigger === "training_only" || rule.trigger === "inspection_only"
          ? "logic_risk"
          : "missing_information",
    severity: rule.trigger === "direct_cause" || rule.trigger === "effectiveness_claim" ? "attention" : "info",
    affectedConcepts: rule.mappedConcepts,
    message: rule.explanation,
    suggestedQuestion: rule.question,
    evidenceRequirementIds: rule.evidenceRequirementIds || [],
    reportEligibility: "advisory_only",
    mayTransitionCase: false,
  }));
}

export function classifyGuidedAnswer(input: {
  category: GuidedAnswerCategory;
  originalAnswer: string;
  evidenceRequirementIds?: readonly string[];
}): GuidedAnswerClassification {
  const text = normalized(input.originalAnswer);
  if (!text || /暂不清楚|需要核实|unknown|not sure/.test(text)) return "unknown";
  if (
    input.category === "verification_result" &&
    input.evidenceRequirementIds?.includes("verification_result") &&
    /合格|通过|有效|结果|passed|effective/.test(text)
  ) {
    return "verified_result";
  }
  if (/可能|应该|推测|猜测|perhaps|maybe|likely/.test(text)) return "hypothesis";
  if (input.category === "corrective_action" || input.category === "verification_plan" || input.category === "prevention_action") {
    return "planned_action";
  }
  return "stated_fact";
}

export function getGuidedMappings(input: {
  category: GuidedAnswerCategory;
  concepts?: readonly QualityConcept[];
}): GuidedFieldMapping[] {
  const requestedConcepts = input.concepts ? new Set(input.concepts) : null;
  return GUIDED_FIELD_MAPPINGS.filter((mapping) =>
    mapping.answerCategory === input.category && (!requestedConcepts || requestedConcepts.has(mapping.concept)),
  );
}

export function getGuidedReportFieldReferences(input: {
  category: GuidedAnswerCategory;
  concepts?: readonly QualityConcept[];
}) {
  const seen = new Set<GuidedOutputSemanticKey>();
  return getGuidedMappings(input)
    .map((mapping) => mapping.target)
    .filter((target) => {
      if (seen.has(target.semanticKey)) return false;
      seen.add(target.semanticKey);
      return true;
    });
}

export interface GuidedStageCompletion {
  stage: GuidedStage;
  complete: boolean;
  answeredConcepts: readonly QualityConcept[];
  missingConcepts: readonly QualityConcept[];
}

const STAGE_REQUIRED_CONCEPTS: Record<GuidedStage, readonly QualityConcept[]> = {
  problem_description: ["problem_symptom", "problem_scope", "problem_discovery"],
  containment: ["containment_action", "containment_scope"],
  occurrence_cause: ["occurrence_root_cause", "process_control"],
  escape_cause: ["escape_root_cause"],
  corrective_action: ["permanent_corrective_action", "implementation_plan"],
  verification_and_prevention: ["effectiveness_verification_plan", "recurrence_prevention"],
};

export function getGuidedStageCompletion(input: {
  stage: GuidedStage;
  answers: readonly Pick<GuidedAnswer, "linkedQualityConcepts">[];
}): GuidedStageCompletion {
  const answered = new Set(input.answers.flatMap((answer) => answer.linkedQualityConcepts));
  const required = STAGE_REQUIRED_CONCEPTS[input.stage];
  const missingConcepts = required.filter((concept) => !answered.has(concept));
  return {
    stage: input.stage,
    complete: missingConcepts.length === 0,
    answeredConcepts: [...answered],
    missingConcepts,
  };
}

export const QUALITY_COACH_AGENT_TYPES = ["investigator", "quality_reviewer", "customer_simulator"] as const;
export type QualityCoachAgentType = (typeof QUALITY_COACH_AGENT_TYPES)[number];

export interface QualityCoachRequestBase {
  caseId: string;
  promptVersion: string;
  language: "zh-CN" | "en";
  answers: readonly GuidedAnswer[];
  evidenceRequirementIds: readonly string[];
}

export interface AiInvestigatorRequest extends QualityCoachRequestBase {
  agent: "investigator";
  currentQuestionId: string;
}

export interface AiInvestigatorResponse {
  nextQuestion: string;
  whyAsked: string;
  answerRestatement?: string;
  missingConcepts: readonly QualityConcept[];
  followUpRuleIds: readonly string[];
  candidateMappings: readonly GuidedFieldMapping[];
  insights: readonly QualityInsight[];
  mayTransitionCase: false;
}

export interface AiQualityReviewerRequest extends QualityCoachRequestBase {
  agent: "quality_reviewer";
}

export interface AiQualityReviewerResponse {
  insights: readonly QualityInsight[];
  completion: readonly GuidedStageCompletion[];
  mayTransitionCase: false;
}

export interface AiCustomerSimulatorRequest {
  agent: "customer_simulator";
  caseId: string;
  promptVersion: string;
  outputType: QualityCaseOutputType;
  /** Only human-confirmed candidate output may be supplied to this agent. */
  humanConfirmedOutput: readonly {
    semanticKey: GuidedOutputSemanticKey;
    text: string;
  }[];
  authorizedEvidenceIds: readonly string[];
}

export interface AiCustomerSimulatorResponse {
  insights: readonly QualityInsight[];
  mayTransitionCase: false;
}

export const QUALITY_COACH_AGENT_CONTRACTS: Readonly<Record<QualityCoachAgentType, {
  permitted: readonly string[];
  prohibited: readonly string[];
  mayTransitionCase: false;
}>> = {
  investigator: {
    permitted: ["ask_question", "restate_answer", "identify_missing_information"],
    prohibited: ["approve", "submit", "transition_case", "close_case", "create_evidence"],
    mayTransitionCase: false,
  },
  quality_reviewer: {
    permitted: ["identify_logic_risk", "identify_missing_evidence", "suggest_verification"],
    prohibited: ["approve", "submit", "transition_case", "confirm_root_cause", "create_test_result"],
    mayTransitionCase: false,
  },
  customer_simulator: {
    permitted: ["identify_likely_customer_question", "identify_clarity_risk"],
    prohibited: ["approve", "contact_customer", "accept", "return", "transition_case", "read_unconfirmed_supplier_data"],
    mayTransitionCase: false,
  },
};
