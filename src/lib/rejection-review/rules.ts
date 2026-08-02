import {
  REVIEW_SECTIONS,
  type EvidenceStatus,
  type RejectionRiskFinding,
  type RejectionRiskReview,
  type ReviewSection,
  type ReviewSeverity,
} from "@/lib/rejection-review/schema";

const MAX_EXCERPT_CHARS = 280;
const DISCLAIMER = "This review identifies submission risk from the supplied report only. It does not approve the report, confirm root cause, prove effectiveness, certify compliance, or guarantee customer acceptance.";

type SectionMap = Record<ReviewSection, string>;

function compact(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function excerpt(value: string) {
  const clean = compact(value);
  return clean.length > MAX_EXCERPT_CHARS ? `${clean.slice(0, MAX_EXCERPT_CHARS - 1)}…` : clean;
}

function sectionForHeading(heading: string): ReviewSection | null {
  const normalized = heading.toLowerCase();
  const numbered = normalized.match(/\bd\s*([1-8])\b/);
  if (numbered) return `D${numbered[1]}` as ReviewSection;
  if (/\b(team|responsib(?:le|ility)|owner)\b/.test(normalized)) return "D1";
  if (/\b(problem|defect|nonconform|complaint)\b/.test(normalized)) return "D2";
  if (/\b(containment|sorting|quarantine)\b/.test(normalized)) return "D3";
  if (/\b(root cause|occurrence cause|escape cause|cause analysis|5\s*why)\b/.test(normalized)) return "D4";
  if (/\b(permanent corrective|corrective action|selected action)\b/.test(normalized)) return "D5";
  if (/\b(implementation|validation|verification|effectiveness)\b/.test(normalized)) return "D6";
  if (/\b(prevent(?:ion|ive)|recurrence|horizontal deployment|systemic)\b/.test(normalized)) return "D7";
  if (/\b(closure|lessons learned|recognition|approval)\b/.test(normalized)) return "D8";
  if (/\bscar\b/.test(normalized)) return "SCAR";
  return null;
}

export function splitReviewSections(rawText: string): SectionMap {
  const sections = Object.fromEntries(REVIEW_SECTIONS.map((section) => [section, ""])) as SectionMap;
  let current: ReviewSection | null = null;
  for (const rawLine of rawText.replace(/\r\n?/g, "\n").split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;
    const headingCandidate = line.length <= 120 ? sectionForHeading(line) : null;
    const looksLikeHeading = /^(?:d\s*[1-8]\b|scar\b|[A-Za-z][A-Za-z /&-]{2,50}:?$)/i.test(line);
    if (headingCandidate && looksLikeHeading) {
      current = headingCandidate;
      sections[current] = compact(`${sections[current]} ${line.replace(/:$/, "")}`);
      continue;
    }
    if (current) sections[current] = compact(`${sections[current]} ${line}`);
  }
  return sections;
}

function findMatch(text: string, pattern: RegExp) {
  const match = text.match(pattern);
  return match?.[0] ? excerpt(match[0]) : "";
}

function makeFinding(input: {
  id: string;
  section: ReviewSection;
  severity: ReviewSeverity;
  category: RejectionRiskFinding["category"];
  title: string;
  explanation: string;
  evidenceStatus: EvidenceStatus;
  sourceExcerpt?: string;
  factsNeeded: string[];
  likelyCustomerQuestion: string;
}): RejectionRiskFinding {
  return {
    ...input,
    source: input.sourceExcerpt
      ? { type: "report_excerpt", section: input.section, excerpt: excerpt(input.sourceExcerpt), ruleId: input.id }
      : { type: "missing_information", section: input.section, ruleId: input.id },
  };
}

function normalizeCause(value: string) {
  return compact(value)
    .toLowerCase()
    .replace(/\b(?:occurrence|escape|root|cause|why|because|detection)\b/g, "")
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, " ")
    .trim();
}

function labeledValue(text: string, label: RegExp) {
  const match = text.match(new RegExp(
    `${label.source}\\s*[:：-]?\\s*(.{3,400}?)(?=\\s+(?:occurrence\\s+(?:root\\s+)?cause|escape\\s+(?:root\\s+)?cause|detection\\s+cause|发生原因|流出原因|evidence)\\s*[:：-]|$)`,
    label.flags.replace("g", ""),
  ));
  return match?.[1]?.trim() || "";
}

function containsAny(text: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(text));
}

function addMissingSectionFindings(sections: SectionMap, fullText: string, findings: RejectionRiskFinding[]) {
  const expectations: Array<{
    section: ReviewSection;
    id: string;
    global: RegExp;
    category: RejectionRiskFinding["category"];
    title: string;
    facts: string[];
    question: string;
  }> = [
    { section: "D1", id: "missing-team-responsibility", global: /\b(team|owner|responsible|quality engineer)\b/i, category: "evidence_gap", title: "Responsible review team is not stated", facts: ["Named owner", "Relevant functions or reviewers"], question: "Who owns this response and who reviewed it?" },
    { section: "D2", id: "missing-problem-definition", global: /\b(defect|complaint|nonconform|failure|problem)\b/i, category: "problem_definition", title: "Problem definition is missing", facts: ["Part or product", "Defect mode", "Location", "Timing", "Quantity or rate", "Requirement or specification"], question: "What exactly failed, where, when, and by how much?" },
    { section: "D3", id: "missing-containment", global: /\b(contain|quarantine|sort(?:ed|ing)?|blocked|hold)\b/i, category: "containment", title: "Immediate containment is not stated", facts: ["Affected scope", "Owner", "Completion time", "Verification result"], question: "How was customer exposure stopped and verified?" },
    { section: "D4", id: "missing-root-cause", global: /\b(root cause|occurrence cause|escape cause|5\s*why)\b/i, category: "root_cause", title: "Root-cause analysis is missing", facts: ["Occurrence cause", "Escape cause", "Objective supporting evidence"], question: "Why did the defect occur, and why did the control system fail to detect it?" },
    { section: "D5", id: "missing-corrective-action", global: /\b(corrective action|permanent action|countermeasure)\b/i, category: "corrective_action", title: "Permanent corrective action is missing", facts: ["Action linked to each cause", "Owner", "Due or completion date"], question: "What permanent change removes or controls the verified cause?" },
    { section: "D6", id: "missing-effectiveness-verification", global: /\b(validat|verif|effectiveness|sample size|acceptance criteria)\b/i, category: "verification", title: "Effectiveness verification is missing", facts: ["Sample", "Time window", "Acceptance criterion", "Objective result"], question: "What objective result proves that the action worked?" },
    { section: "D7", id: "missing-prevention", global: /\b(prevent|recurrence|horizontal deployment|similar product|control plan|pfmea)\b/i, category: "prevention", title: "Prevention of recurrence is missing", facts: ["System document updates", "Similar products or processes reviewed", "Deployment evidence"], question: "Where else could this failure occur, and what was changed systemically?" },
  ];
  for (const item of expectations) {
    if (sections[item.section] || item.global.test(fullText)) continue;
    findings.push(makeFinding({
      id: item.id,
      section: item.section,
      severity: item.section === "D1" ? "medium" : "high",
      category: item.category,
      title: item.title,
      explanation: "The supplied text does not contain enough source material to support this required review area.",
      evidenceStatus: "missing",
      factsNeeded: item.facts,
      likelyCustomerQuestion: item.question,
    }));
  }
}

function inspectProblemDefinition(sections: SectionMap, findings: RejectionRiskFinding[]) {
  const text = sections.D2;
  if (!text) return;
  const measurableSignals = [
    /\b\d+(?:\.\d+)?\s*(?:%|ppm|pcs?|pieces?|units?|mm|cm|kg|hours?|days?)\b/i,
    /\b(?:lot|batch|serial|part(?: number)?|po)\s*[:#-]?\s*[a-z0-9-]+\b/i,
    /\b(?:specification|requirement|tolerance|drawing)\b/i,
  ];
  const signalCount = measurableSignals.filter((pattern) => pattern.test(text)).length;
  if (signalCount >= 2) return;
  findings.push(makeFinding({
    id: "problem-not-measurable",
    section: "D2",
    severity: "high",
    category: "problem_definition",
    title: "Problem description is not sufficiently measurable",
    explanation: "The problem statement is present, but it lacks enough traceable scope, quantity, or requirement detail for a customer reviewer to test the claim.",
    evidenceStatus: "needs_confirmation",
    sourceExcerpt: text,
    factsNeeded: ["Affected part and lot", "Defect quantity and inspected quantity", "Measured condition versus requirement", "Detection location and date"],
    likelyCustomerQuestion: "What is the exact affected scope and measured deviation from the requirement?",
  }));
}

function inspectContainment(sections: SectionMap, findings: RejectionRiskFinding[]) {
  const text = sections.D3;
  if (!text) return;
  const missing: string[] = [];
  if (!/\b(?:all|lot|batch|stock|wip|warehouse|shipment|scope|from\s+.+\s+to)\b/i.test(text)) missing.push("affected scope");
  if (!/\b(?:owner|responsible|assigned|quality|production|supplier)\b/i.test(text)) missing.push("responsible owner");
  if (!/\b(?:verified|result|found|completed|record|pass|zero defect)\b/i.test(text)) missing.push("containment verification result");
  if (!missing.length) return;
  findings.push(makeFinding({
    id: "containment-missing-control-details",
    section: "D3",
    severity: "high",
    category: "containment",
    title: "Containment lacks scope, ownership, or verification",
    explanation: `The containment statement does not substantiate ${missing.join(", ")}.`,
    evidenceStatus: "needs_confirmation",
    sourceExcerpt: text,
    factsNeeded: missing,
    likelyCustomerQuestion: "Which material was contained, who completed it, and what record proves the containment was effective?",
  }));
}

function inspectRootCause(sections: SectionMap, fullText: string, findings: RejectionRiskFinding[]) {
  const text = sections.D4 || fullText;
  const blame = findMatch(text, /\b(?:operator|employee|worker|personnel|staff)\s+(?:error|mistake|negligence|carelessness|oversight)|human error|员工疏忽|员工失误|操作员疏忽\b/i);
  if (blame) {
    findings.push(makeFinding({
      id: "root-cause-human-blame",
      section: "D4",
      severity: "critical",
      category: "root_cause",
      title: "Root cause stops at human error",
      explanation: "A person-level error describes the immediate event but does not explain which process, control, design, instruction, or management-system condition allowed it.",
      evidenceStatus: "stated",
      sourceExcerpt: blame,
      factsNeeded: ["Process condition that enabled the error", "Why prevention controls were insufficient", "Evidence supporting the systemic cause"],
      likelyCustomerQuestion: "What system weakness allowed this error, and how was that cause verified?",
    }));
  }

  const occurrence = labeledValue(text, /(?:occurrence\s+(?:root\s+)?cause|发生原因)/i);
  const escape = labeledValue(text, /(?:escape\s+(?:root\s+)?cause|流出原因|detection\s+cause)/i);
  if (occurrence && escape && normalizeCause(occurrence) === normalizeCause(escape)) {
    findings.push(makeFinding({
      id: "occurrence-escape-same",
      section: "D4",
      severity: "high",
      category: "root_cause",
      title: "Occurrence cause and escape cause are the same",
      explanation: "The report does not distinguish why the defect was created from why the detection or release control failed.",
      evidenceStatus: "stated",
      sourceExcerpt: `Occurrence cause: ${occurrence}; Escape cause: ${escape}`,
      factsNeeded: ["Separate occurrence mechanism", "Separate control or detection failure", "Evidence for both causal paths"],
      likelyCustomerQuestion: "Why did the defect occur, and separately, why was it not detected before shipment?",
    }));
  }
}

function inspectCorrectiveAction(sections: SectionMap, fullText: string, findings: RejectionRiskFinding[]) {
  const text = sections.D5 || fullText;
  const actionContext = /\b(?:corrective action|permanent action|countermeasure|d5)\b/i.test(text) ? text : sections.D5;
  if (!actionContext) return;
  const training = findMatch(actionContext, /\b(?:retrain(?:ed|ing)?|training|trained|remind(?:ed|er)?|awareness|教育培训|重新培训)\b/i);
  const inspection = findMatch(actionContext, /\b(?:100\s*%\s*(?:inspection|check|sorting)|increase(?:d)? inspection|加强\s*100\s*%?\s*检验|全检)\b/i);
  const strongerChange = containsAny(actionContext, [
    /\b(?:poka[- ]?yoke|error proof|interlock|fixture|tooling|software|sensor|parameter|specification|process change|design change|control plan|pfmea|work instruction revised)\b/i,
    /(?:防错|互锁|工装|治具|传感器|参数|设计变更|流程变更|控制计划|作业指导书修订)/i,
  ]);
  if (training && !strongerChange) {
    findings.push(makeFinding({
      id: "action-training-only",
      section: "D5",
      severity: "critical",
      category: "corrective_action",
      title: "Corrective action relies only on training or reminders",
      explanation: "Training can support implementation, but by itself it does not remove the process condition or control weakness that enabled the failure.",
      evidenceStatus: "stated",
      sourceExcerpt: training,
      factsNeeded: ["Process or system change tied to the verified cause", "Implementation evidence", "Owner and completion date"],
      likelyCustomerQuestion: "What changed in the process so the same failure cannot recur after the training is forgotten?",
    }));
  }
  if (inspection && !strongerChange) {
    findings.push(makeFinding({
      id: "action-inspection-only",
      section: "D5",
      severity: "high",
      category: "corrective_action",
      title: "100% inspection is presented as the permanent action",
      explanation: "Additional inspection is detection or containment. It does not by itself correct the occurrence cause.",
      evidenceStatus: "stated",
      sourceExcerpt: inspection,
      factsNeeded: ["Action that addresses the occurrence cause", "Plan for reducing temporary inspection", "Evidence the permanent change was implemented"],
      likelyCustomerQuestion: "What prevents the defect from being produced rather than only detecting it later?",
    }));
  }

  const equipmentCause = /\b(?:machine|equipment|tool|fixture|sensor|temperature|pressure|torque|software|material)\b/i.test(sections.D4);
  if (equipmentCause && (training || inspection) && !strongerChange) {
    findings.push(makeFinding({
      id: "action-not-linked-to-cause",
      section: "D5",
      severity: "high",
      category: "corrective_action",
      title: "Corrective action is not linked to the stated cause",
      explanation: "The stated cause concerns equipment, tooling, process settings, software, or material, while the action shown is limited to people or inspection controls.",
      evidenceStatus: "needs_confirmation",
      sourceExcerpt: `${sections.D4} ${actionContext}`,
      factsNeeded: ["Cause-to-action linkage", "Technical change addressing the cause", "Rationale for the selected action"],
      likelyCustomerQuestion: "How does this action eliminate or control the specific root cause stated in D4?",
    }));
  }
}

function inspectImplementationAndVerification(sections: SectionMap, findings: RejectionRiskFinding[]) {
  const implementation = compact(`${sections.D5} ${sections.D6}`);
  if (!implementation) return;
  const implementationEvidence = containsAny(implementation, [
    /\b(?:completed|implemented|released|installed|record|revision|work order|photo|attachment|approved)\b/i,
    /\b\d{4}[-/.]\d{1,2}[-/.]\d{1,2}\b/,
  ]);
  if (!implementationEvidence) {
    findings.push(makeFinding({
      id: "implementation-evidence-missing",
      section: "D6",
      severity: "high",
      category: "evidence_gap",
      title: "Implementation evidence is not shown",
      explanation: "The supplied text describes an action but does not provide a completion record, revision, installation record, approval, or other objective implementation evidence.",
      evidenceStatus: "missing",
      sourceExcerpt: implementation,
      factsNeeded: ["Implementation record", "Responsible owner", "Completion date", "Controlled-document or change reference"],
      likelyCustomerQuestion: "What objective record proves the corrective action was actually implemented?",
    }));
  }

  const verification = sections.D6;
  if (!verification) return;
  const missing: string[] = [];
  if (!/\b(?:sample|n\s*=|\d+\s*(?:pcs?|pieces?|units?|lots?|batches?))\b/i.test(verification)) missing.push("sample size or scope");
  if (!/\b(?:day|week|month|hour|from\s+.+\s+to|period|date)\b/i.test(verification)) missing.push("verification time window");
  if (!/\b(?:acceptance|criterion|target|specification|tolerance|zero defect|pass if|≤|>=|<=)\b/i.test(verification)) missing.push("acceptance criterion");
  if (!/\b(?:result|passed|failed|observed|measured|ppm|%)\b/i.test(verification)) missing.push("objective result");
  if (!missing.length) return;
  findings.push(makeFinding({
    id: "verification-criteria-incomplete",
    section: "D6",
    severity: "high",
    category: "verification",
    title: "Effectiveness verification is not objectively testable",
    explanation: `The verification statement does not substantiate ${missing.join(", ")}.`,
    evidenceStatus: "needs_confirmation",
    sourceExcerpt: verification,
    factsNeeded: missing,
    likelyCustomerQuestion: "What sample, period, acceptance criterion, and measured result demonstrate effectiveness?",
  }));
}

function inspectPrevention(sections: SectionMap, findings: RejectionRiskFinding[]) {
  const text = sections.D7;
  if (!text) return;
  if (/\b(?:similar product|similar process|horizontal deployment|across all|family|other line|other plant|pfmea|control plan)\b/i.test(text)) return;
  findings.push(makeFinding({
    id: "prevention-no-horizontal-deployment",
    section: "D7",
    severity: "medium",
    category: "prevention",
    title: "Prevention does not cover similar products or processes",
    explanation: "The prevention statement does not show whether the same failure mode was evaluated beyond the single affected item or line.",
    evidenceStatus: "needs_confirmation",
    sourceExcerpt: text,
    factsNeeded: ["Similar-product review scope", "Similar-process review scope", "System document updates and deployment evidence"],
    likelyCustomerQuestion: "Where else can this failure occur, and how was the prevention deployed there?",
  }));
}

function inspectWording(fullText: string, sections: SectionMap, findings: RejectionRiskFinding[]) {
  const vague = findMatch(fullText, /\b(?:proper(?:ly)?|appropriate(?:ly)?|some|soon|as needed|improve(?:d|ment)?|enhance(?:d|ment)?|加强|适当|尽快)\b/i);
  if (!vague) return;
  const section = REVIEW_SECTIONS.find((key) => sections[key].includes(vague)) || "SCAR";
  findings.push(makeFinding({
    id: "wording-vague-unmeasurable",
    section,
    severity: "low",
    category: "wording",
    title: "Wording is vague even though the underlying facts may be available",
    explanation: "This wording is difficult for a customer to verify. A rewrite should preserve only stated facts and replace vague terms with the actual action, owner, scope, date, or result.",
    evidenceStatus: "stated",
    sourceExcerpt: vague,
    factsNeeded: ["Exact action or condition represented by the vague term"],
    likelyCustomerQuestion: "What specifically was changed or verified?",
  }));
}

function statusFor(findings: RejectionRiskFinding[]): RejectionRiskReview["status"] {
  const critical = findings.filter((item) => item.severity === "critical").length;
  const high = findings.filter((item) => item.severity === "high").length;
  const medium = findings.filter((item) => item.severity === "medium").length;
  if (critical > 0 || high >= 3) return "not_suitable_to_submit";
  if (high > 0 || medium >= 3) return "high_risk";
  return "submittable_with_risk";
}

const severityRank: Record<ReviewSeverity, number> = { critical: 4, high: 3, medium: 2, low: 1 };

export function runDeterministicRejectionReview(rawText: string): RejectionRiskReview {
  const fullText = rawText.replace(/\r\n?/g, "\n").trim().slice(0, 60_000);
  const sections = splitReviewSections(fullText);
  const findings: RejectionRiskFinding[] = [];
  addMissingSectionFindings(sections, fullText, findings);
  inspectProblemDefinition(sections, findings);
  inspectContainment(sections, findings);
  inspectRootCause(sections, fullText, findings);
  inspectCorrectiveAction(sections, fullText, findings);
  inspectImplementationAndVerification(sections, findings);
  inspectPrevention(sections, findings);
  inspectWording(fullText, sections, findings);

  const uniqueFindings = Array.from(new Map(findings.map((finding) => [finding.id, finding])).values())
    .sort((a, b) => severityRank[b.severity] - severityRank[a.severity]);
  const sectionResults = REVIEW_SECTIONS.map((section) => {
    const sectionFindings = uniqueFindings.filter((finding) => finding.section === section);
    return {
      section,
      status: sectionFindings.length
        ? sectionFindings.some((finding) => finding.evidenceStatus === "missing")
          ? "not_enough_information" as const
          : "risk_found" as const
        : "no_material_issue_detected" as const,
      findingIds: sectionFindings.map((finding) => finding.id),
    };
  });
  const missingInformationCategories = Array.from(new Set(
    uniqueFindings
      .filter((finding) => finding.evidenceStatus !== "stated")
      .map((finding) => finding.category),
  ));

  return {
    schemaVersion: "rejection-risk-review-v1",
    status: statusFor(uniqueFindings),
    topRejectionRisks: uniqueFindings.slice(0, 3),
    findings: uniqueFindings,
    sections: sectionResults,
    missingInformationCategories,
    evidencePolicy: {
      inventedFactsAllowed: false,
      sourceRequiredForEveryFinding: true,
    },
    disclaimer: DISCLAIMER,
  };
}
