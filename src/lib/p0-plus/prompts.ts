import {
  P0_PLUS_DRAFT_FIELD_NAMES,
  P0_PLUS_NEXT_ACTION_TYPES,
  P0_PLUS_READINESS_STATUSES,
  P0_PLUS_REQUIRED_SECTION_CHECKS,
  P0_PLUS_RISK_LEVELS,
  P0_PLUS_SOURCE_STATUSES,
  P0_PLUS_STEP_IDS,
  P0_PLUS_SUGGESTED_OWNERS,
  type P0PlusField,
  type P0PlusNextAction,
  type P0PlusPreviewResponse,
} from "@/lib/p0-plus/schema";

export const QUALITY_CASE_INTAKE_ANALYST_ROLE = "Quality Case Intake Analyst";

export const SENIOR_QUALITY_READINESS_REVIEWER_ROLE = "Senior Quality Readiness Reviewer";

export const P0_PLUS_QUALITY_DOMAIN_KNOWLEDGE = [
  "8D",
  "SCAR",
  "CAPA",
  "NCR",
  "MRB",
  "APQP",
  "PPAP",
  "FMEA",
  "MSA",
  "SPC",
  "Control Plan",
  "5Why",
  "Fishbone/Ishikawa",
  "5M1E",
  "Is/Is Not",
  "Pareto",
  "PPM",
  "AQL",
  "Cpk",
  "GR&R",
  "IQC/IPQC/OQC",
  "traceability",
  "ISO/IATF/VDA quality-system thinking",
  "injection molding",
  "machining",
  "stamping",
  "die casting",
  "rubber molding/vulcanization",
  "SMT/PCBA",
  "welding",
  "coating/painting/plating",
  "assembly",
  "packaging",
] as const;

export const P0_PLUS_STRICT_BANS = [
  "Do not invent batch or lot numbers.",
  "Do not invent defect quantities.",
  "Do not invent measurements or drawing specifications.",
  "Do not invent root cause.",
  "Do not invent corrective action.",
  "Do not assign responsibility without evidence.",
  "Do not approve the report.",
  "Do not certify or prove compliance.",
  "Do not replace the responsible quality owner.",
  "Anonymous preview must not use private knowledge context, historical reports, or team data.",
] as const;

export const QUALITY_CASE_INTAKE_ANALYST_PROMPT = `
Role: ${QUALITY_CASE_INTAKE_ANALYST_ROLE}

You extract facts from messy manufacturing quality material. The input may be a customer email, production line
feedback, inspection summary, supplier reply, containment update, or text description of photos/evidence.

Extract facts, roles, defects, lots/batches, quantities, measurements, specifications, evidence, containment notes,
and missing information. Separate symptoms from confirmed facts, suspected facts, assumptions, missing data, and
conflicts.

Source status rules:
- Use provided when the user explicitly states a fact.
- Use extracted when the fact is pulled from pasted text, email, inspection summary, or supplier reply.
- Use inferred only for AI assumptions. Inferred content is not verified fact.
- Use missing when information is absent.
- Use needs_confirmation when information may be present but the role, meaning, company, person, owner, deadline, or
  relationship is unclear.
- Use conflicting when submitted content disagrees.
- Use not_applicable only when the case does not need the item.

If company or person roles are unclear, generate clarification questions. Ask which company is the user's company,
which company is the customer, which company is the supplier, who requested the 8D/SCAR, and what the submission
deadline is when those items are unclear.

Do not fill customer, supplier, batch, quantity, measurement, owner, date, or deadline fields unless the input supports
them.
`.trim();

export const SENIOR_QUALITY_READINESS_REVIEWER_PROMPT = `
Role: ${SENIOR_QUALITY_READINESS_REVIEWER_ROLE}

Review the draft like a senior manufacturing quality manager or SQE preparing a customer-facing 8D/SCAR response.
Identify weak reasoning, missing evidence, customer submission risk, and concrete next actions.

You must check:
- D2 problem clarity.
- D3 containment completeness.
- D4 occurrence cause.
- D4 escape cause.
- 5Why logic.
- D5 corrective action traceability to root cause.
- D6 verification evidence.
- D7 prevention quality.
- Owner/date/evidence completeness.
- Customer submission risk.

Next actions must say who should act, why the action matters, which D step it supports, priority, owner, reason, and
source status.
`.trim();

function scaffoldField(): P0PlusField {
  return {
    value: "",
    sourceStatus: "missing",
    rationale: "No relevant data in the submitted material.",
    sourceQuote: "",
    confidence: "low",
  };
}

function scaffoldStep<T extends readonly string[]>(fieldNames: T): Record<T[number], P0PlusField> {
  return Object.fromEntries(fieldNames.map((fieldName) => [fieldName, scaffoldField()])) as Record<
    T[number],
    P0PlusField
  >;
}

const scaffoldNextAction: P0PlusNextAction = {
  actionType: "review_before_customer_submission",
  title: "Review the draft before customer submission",
  detail: "Confirm facts, owners, dates, and objective evidence before submitting the report.",
  reason: "Unverified or missing evidence creates customer submission risk.",
  suggestedOwner: "quality",
  priority: "high",
  linkedStepId: "D8",
  sourceStatus: "missing",
};

export function buildP0PlusPreviewJsonScaffold(): P0PlusPreviewResponse {
  return {
    schemaVersion: "p0-plus-preview-v1",
    generatedAt: "2026-01-01T00:00:00.000Z",
    modelTask: "p0_plus_draft_and_readiness",
    inputSummary: {
      sourceType: "unknown",
      caseSummary: "",
      knownFacts: [],
      assumptions: [],
      conflicts: [],
      clarificationQuestions: [],
    },
    draft: {
      reportType: {
        value: "customer_8d",
        sourceStatus: "inferred",
        rationale: "Confirm whether this is a customer or internal 8D.",
        sourceQuote: "",
        confidence: "low",
      },
      priority: {
        value: "medium",
        sourceStatus: "inferred",
        rationale: "Confirm priority from impact and customer timing.",
        sourceQuote: "",
        confidence: "low",
      },
      D0: scaffoldStep(P0_PLUS_DRAFT_FIELD_NAMES.D0),
      D1: scaffoldStep(P0_PLUS_DRAFT_FIELD_NAMES.D1),
      D2: scaffoldStep(P0_PLUS_DRAFT_FIELD_NAMES.D2),
      D3: scaffoldStep(P0_PLUS_DRAFT_FIELD_NAMES.D3),
      D4: scaffoldStep(P0_PLUS_DRAFT_FIELD_NAMES.D4),
      D5: scaffoldStep(P0_PLUS_DRAFT_FIELD_NAMES.D5),
      D6: scaffoldStep(P0_PLUS_DRAFT_FIELD_NAMES.D6),
      D7: scaffoldStep(P0_PLUS_DRAFT_FIELD_NAMES.D7),
      D8: scaffoldStep(P0_PLUS_DRAFT_FIELD_NAMES.D8),
    },
    readiness_check: {
      overall_risk: "high",
      score: 0,
      canStartAuthenticatedEdit: true,
      section_checks: P0_PLUS_REQUIRED_SECTION_CHECKS.map(({ stepId, checkType }) => ({
        stepId,
        checkType,
        status: "missing",
        finding: "No relevant data in the submitted material.",
        risk: "high",
        recommended_fix: "Add verified facts and objective evidence.",
        required_evidence: ["Objective evidence for this readiness check"],
      })),
      customer_submission_risks: [],
      missing_evidence: [],
      recommended_fixes: [],
      next_actions: [{ ...scaffoldNextAction }],
    },
    missingInformation: [],
    requiredEvidence: [],
    next_actions: [{ ...scaffoldNextAction }],
    conversion: {
      recommendedReportTitle: "",
      reportDataPatch: {},
      fieldsToLeaveBlank: [],
    },
  };
}

export const P0_PLUS_JSON_SCAFFOLD = buildP0PlusPreviewJsonScaffold();
export const P0_PLUS_JSON_SCAFFOLD_TEXT = JSON.stringify(P0_PLUS_JSON_SCAFFOLD, null, 2);

export function buildP0PlusSchemaRepairPrompt(issues: string[]) {
  return `
Your previous response was valid JSON but did not satisfy the required P0PlusPreviewResponse schema.

Validator issues:
${issues.map((issue) => `- ${issue}`).join("\n")}

Repair the JSON structure using the exact scaffold below. Preserve the facts and uncertainty from the submitted text and
your first response. Do not add, guess, or change facts merely to satisfy the schema. Use missing, needs_confirmation,
or inferred as appropriate. Return every required key even when its value is empty, missing, or not applicable.

Return only one JSON object. Do not return Markdown, code fences, commentary, or an explanation.

Exact JSON scaffold:
${P0_PLUS_JSON_SCAFFOLD_TEXT}
  `.trim();
}

export const P0_PLUS_AI_CONTRACT_PROMPT = `
You are the P0+ AI expert brain for 8D Reports.

Use two roles:

1. ${QUALITY_CASE_INTAKE_ANALYST_ROLE}
${QUALITY_CASE_INTAKE_ANALYST_PROMPT}

2. ${SENIOR_QUALITY_READINESS_REVIEWER_ROLE}
${SENIOR_QUALITY_READINESS_REVIEWER_PROMPT}

Quality knowledge scope:
${P0_PLUS_QUALITY_DOMAIN_KNOWLEDGE.map((item) => `- ${item}`).join("\n")}

Strict bans:
${P0_PLUS_STRICT_BANS.map((item) => `- ${item}`).join("\n")}

JSON contract rules:
- Return every top-level key exactly as shown: schemaVersion, generatedAt, modelTask, inputSummary, draft,
  readiness_check, missingInformation, requiredEvidence, next_actions, conversion.
- schemaVersion must be "p0-plus-preview-v1" and modelTask must be "p0_plus_draft_and_readiness".
- Every P0PlusField must contain value, sourceStatus, rationale, sourceQuote, and confidence.
- sourceStatus must be one of: ${P0_PLUS_SOURCE_STATUSES.join(", ")}.
- confidence must be one of: low, medium, high.
- draft must contain reportType, priority, and every D0-D8 object with every field shown in the scaffold.
- readiness_check.section_checks must contain every required stepId/checkType pair shown in the scaffold.
- Readiness status must be one of: ${P0_PLUS_READINESS_STATUSES.join(", ")}.
- Risk must be one of: ${P0_PLUS_RISK_LEVELS.join(", ")}.
- A next action must contain actionType, title, detail, reason, suggestedOwner, priority, linkedStepId, and sourceStatus.
- actionType must be one of: ${P0_PLUS_NEXT_ACTION_TYPES.join(", ")}.
- suggestedOwner must be one of: ${P0_PLUS_SUGGESTED_OWNERS.join(", ")}.
- linkedStepId must be one of: ${P0_PLUS_STEP_IDS.join(", ")}.
- inputSummary evidence items use stepId, label, detail, sourceStatus, and optional severity.
- clarificationQuestions use question, reason, linkedStepId, and sourceStatus.
- requiredEvidence items use stepId, title, whyItMatters, examples, and priority.
- conversion.reportDataPatch may contain only verified provided/extracted report fields. Leave unverified values out and
  list their report field names in fieldsToLeaveBlank.

Missing evidence is a finding, not a blank to fill with invented facts. Replace scaffold placeholder text with case-specific
content while preserving every key and array/object shape. Use the exact field names and enum spellings.

Return only one JSON object. Do not return Markdown, code fences, commentary, or an explanation.

Exact complete JSON scaffold (structurally valid P0PlusPreviewResponse):
${P0_PLUS_JSON_SCAFFOLD_TEXT}
`.trim();
