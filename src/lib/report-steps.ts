export type FieldType = "text" | "textarea" | "select" | "number" | "date" | "datetime-local" | "photo"

export interface ReportField {
  name: string
  label: string
  type: FieldType
  required?: boolean
  placeholder?: string
  options?: { value: string; label: string }[]
  hint?: string
}

export interface ReportStep {
  id: string
  label: string
  description: string
  fields: ReportField[]
}

export interface ReportData {
  reportNumber: string
  reportType: string
  problemSource: string
  customerName: string
  priority: string
  teamLeader: string
  teamMembers: string
  problemDescription: string
  whereFound: string
  whenFound: string
  whoFound: string
  productName: string
  batchNumber: string
  defectQuantity: string
  totalQuantity: string
  containmentDescription: string
  containmentScope: string
  containmentResponsible: string
  containmentDueDate: string
  containmentValidUntil: string
  containmentVerification: string
  rootCauseOccurrence: string
  rootCauseEscape: string
  rootCauseSystem: string
  fishboneMan: string
  fishboneMachine: string
  fishboneMaterial: string
  fishboneMethod: string
  fishboneMeasurement: string
  fishboneEnvironment: string
  why1: string
  why2: string
  why3: string
  why4: string
  why5: string
  testingPlan: string
  testingResults: string
  confirmedRootCause: string
  selectedCorrectiveAction: string
  correctiveRationale: string
  costEstimate: string
  correctiveResponsible: string
  correctiveTargetDate: string
  implementationPlan: string
  completionDate: string
  validationMethod: string
  validationResults: string
  systemChanges: string
  processUpdates: string
  horizontalDeployment: string
  trainingNeeds: string
  closureDate: string
  lessonsLearned: string
  teamAcknowledgment: string
  preparedBy: string
  preparedDate: string
  preparedSignatureId: string
  preparedSignatureUrl: string
  reviewedBy: string
  reviewedDate: string
  reviewedSignatureId: string
  reviewedSignatureUrl: string
  approverName: string
  approverDate: string
  approvedSignatureId: string
  approvedSignatureUrl: string
}

export const DEFAULT_REPORT_DATA: ReportData = {
  reportNumber: "",
  reportType: "customer_8d",
  problemSource: "",
  customerName: "",
  priority: "medium",
  teamLeader: "",
  teamMembers: "",
  problemDescription: "",
  whereFound: "",
  whenFound: "",
  whoFound: "",
  productName: "",
  batchNumber: "",
  defectQuantity: "",
  totalQuantity: "",
  containmentDescription: "",
  containmentScope: "",
  containmentResponsible: "",
  containmentDueDate: "",
  containmentValidUntil: "",
  containmentVerification: "",
  rootCauseOccurrence: "",
  rootCauseEscape: "",
  rootCauseSystem: "",
  fishboneMan: "",
  fishboneMachine: "",
  fishboneMaterial: "",
  fishboneMethod: "",
  fishboneMeasurement: "",
  fishboneEnvironment: "",
  why1: "",
  why2: "",
  why3: "",
  why4: "",
  why5: "",
  testingPlan: "",
  testingResults: "",
  confirmedRootCause: "",
  selectedCorrectiveAction: "",
  correctiveRationale: "",
  costEstimate: "",
  correctiveResponsible: "",
  correctiveTargetDate: "",
  implementationPlan: "",
  completionDate: "",
  validationMethod: "",
  validationResults: "",
  systemChanges: "",
  processUpdates: "",
  horizontalDeployment: "",
  trainingNeeds: "",
  closureDate: "",
  lessonsLearned: "",
  teamAcknowledgment: "",
  preparedBy: "",
  preparedDate: "",
  preparedSignatureId: "",
  preparedSignatureUrl: "",
  reviewedBy: "",
  reviewedDate: "",
  reviewedSignatureId: "",
  reviewedSignatureUrl: "",
  approverName: "",
  approverDate: "",
  approvedSignatureId: "",
  approvedSignatureUrl: "",
}

const COMPLETION_REQUIREMENTS: Array<{
  stepId: string
  label: string
  fields: Array<keyof ReportData>
  mode?: "any" | "all"
}> = [
  { stepId: "D0", label: "D0 report number and type", fields: ["reportNumber", "reportType"], mode: "all" },
  { stepId: "D1", label: "D1 team leader and members", fields: ["teamLeader", "teamMembers"], mode: "all" },
  { stepId: "D2", label: "D2 problem description", fields: ["problemDescription"], mode: "all" },
  { stepId: "D3", label: "D3 containment action", fields: ["containmentDescription"], mode: "all" },
  {
    stepId: "D4",
    label: "D4 root cause",
    fields: [
      "rootCauseOccurrence",
      "confirmedRootCause",
      "fishboneMan",
      "fishboneMachine",
      "fishboneMaterial",
      "fishboneMethod",
      "fishboneMeasurement",
      "fishboneEnvironment",
    ],
    mode: "any",
  },
  { stepId: "D5", label: "D5 corrective action", fields: ["selectedCorrectiveAction"], mode: "all" },
  { stepId: "D6", label: "D6 implementation plan", fields: ["implementationPlan"], mode: "all" },
  { stepId: "D7", label: "D7 prevention action", fields: ["systemChanges", "processUpdates", "horizontalDeployment"], mode: "any" },
  { stepId: "D8", label: "D8 closure or approval", fields: ["closureDate", "lessonsLearned", "preparedBy", "reviewedBy", "approverName"], mode: "any" },
]

function hasValue(value: unknown) {
  return typeof value === "string" ? value.trim().length > 0 : Boolean(value)
}

export function getReportCompletionIssues(data: ReportData): string[] {
  return COMPLETION_REQUIREMENTS
    .filter((requirement) => {
      const values = requirement.fields.map((field) => data[field])
      return requirement.mode === "any"
        ? !values.some(hasValue)
        : !values.every(hasValue)
    })
    .map((requirement) => requirement.label)
}

export function getCompletedStepIds(data: ReportData): string[] {
  return COMPLETION_REQUIREMENTS
    .filter((requirement) => {
      const values = requirement.fields.map((field) => data[field])
      return requirement.mode === "any"
        ? values.some(hasValue)
        : values.every(hasValue)
    })
    .map((requirement) => requirement.stepId)
}

export type KnowledgeReadinessKey =
  | "rootCause"
  | "correctiveAction"
  | "validation"
  | "prevention"
  | "lessonsLearned"

export type KnowledgeReadinessStatus = "Ready" | "Needs detail" | "Missing"

export interface KnowledgeReadinessItem {
  key: KnowledgeReadinessKey
  label: string
  status: KnowledgeReadinessStatus
  fields: Array<keyof ReportData>
}

export interface KnowledgeReadinessSummary {
  items: KnowledgeReadinessItem[]
  missingCount: number
  hasRootCause: boolean
  hasCorrectiveAction: boolean
  hasValidation: boolean
  hasPrevention: boolean
  hasLessonsLearned: boolean
}

function filledCount(data: ReportData, fields: Array<keyof ReportData>) {
  return fields.filter((field) => hasValue(data[field])).length
}

function readinessStatus(data: ReportData, fields: Array<keyof ReportData>, readyAt = 1): KnowledgeReadinessStatus {
  const count = filledCount(data, fields)
  if (count === 0) return "Missing"
  return count >= readyAt ? "Ready" : "Needs detail"
}

export function getKnowledgeReadinessSummary(data: ReportData): KnowledgeReadinessSummary {
  const rootCauseFields: Array<keyof ReportData> = [
    "confirmedRootCause",
    "rootCauseOccurrence",
    "rootCauseEscape",
    "rootCauseSystem",
    "why1",
    "why2",
    "why3",
    "why4",
    "why5",
    "testingResults",
  ]
  const correctiveActionFields: Array<keyof ReportData> = [
    "selectedCorrectiveAction",
    "correctiveRationale",
    "implementationPlan",
  ]
  const validationFields: Array<keyof ReportData> = [
    "validationMethod",
    "validationResults",
    "testingResults",
  ]
  const preventionFields: Array<keyof ReportData> = [
    "systemChanges",
    "processUpdates",
    "horizontalDeployment",
    "trainingNeeds",
  ]
  const lessonsLearnedFields: Array<keyof ReportData> = ["lessonsLearned"]

  const items: KnowledgeReadinessItem[] = [
    {
      key: "rootCause",
      label: "Root cause captured?",
      status: readinessStatus(data, rootCauseFields, 2),
      fields: rootCauseFields,
    },
    {
      key: "correctiveAction",
      label: "Corrective action captured?",
      status: readinessStatus(data, correctiveActionFields, 2),
      fields: correctiveActionFields,
    },
    {
      key: "validation",
      label: "Validation captured?",
      status: readinessStatus(data, validationFields, 2),
      fields: validationFields,
    },
    {
      key: "prevention",
      label: "Prevention/system change captured?",
      status: readinessStatus(data, preventionFields, 1),
      fields: preventionFields,
    },
    {
      key: "lessonsLearned",
      label: "Lessons learned captured?",
      status: readinessStatus(data, lessonsLearnedFields, 1),
      fields: lessonsLearnedFields,
    },
  ]

  return {
    items,
    missingCount: items.filter((item) => item.status !== "Ready").length,
    hasRootCause: filledCount(data, rootCauseFields) > 0,
    hasCorrectiveAction: filledCount(data, correctiveActionFields) > 0,
    hasValidation: filledCount(data, validationFields) > 0,
    hasPrevention: filledCount(data, preventionFields) > 0,
    hasLessonsLearned: filledCount(data, lessonsLearnedFields) > 0,
  }
}

const reportTypeOptions = [
  { value: "customer_8d", label: "Customer 8D" },
  { value: "internal_8d", label: "Internal 8D" },
]

const priorityOptions = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
]

export const STEPS: ReportStep[] = [
  {
    id: "D0",
    label: "D0: Prepare",
    description: "Prepare for the 8D process — define the problem and assemble the preliminary information.",
    fields: [
      { name: "reportNumber", label: "Report Number", type: "text", placeholder: "YYYY-MM-DD-001", hint: "Default report number, editable" },
      { name: "reportType", label: "Report Type", type: "select", required: true, options: reportTypeOptions },
      { name: "problemSource", label: "Problem Source", type: "text", placeholder: "e.g. Customer complaint, Internal audit" },
      { name: "customerName", label: "Customer Name", type: "text", placeholder: "Customer or department name" },
      { name: "priority", label: "Priority", type: "select", required: true, options: priorityOptions },
    ],
  },
  {
    id: "D1",
    label: "D1: Team",
    description: "Establish the team — identify who will be involved in solving the problem.",
    fields: [
      { name: "teamLeader", label: "Team Leader", type: "text", required: true, placeholder: "Name of the team leader" },
      { name: "teamMembers", label: "Team Members", type: "textarea", required: true, placeholder: "List all team members, one per line" },
    ],
  },
  {
    id: "D2",
    label: "D2: Describe",
    description: "Describe the problem — define what is wrong in measurable, quantified terms.",
    fields: [
      { name: "problemDescription", label: "Problem Description", type: "textarea", required: true, placeholder: "Describe the problem in detail — what, where, when, how much" },
      { name: "whereFound", label: "Where Found", type: "text", placeholder: "Location or process step where the problem was detected" },
      { name: "whenFound", label: "When Found", type: "datetime-local", placeholder: "" },
      { name: "whoFound", label: "Who Found", type: "text", placeholder: "Person who identified the problem" },
      { name: "productName", label: "Product Name / Model", type: "text", placeholder: "Affected product name or model number" },
      { name: "batchNumber", label: "Batch Number", type: "text", placeholder: "Lot or batch identifier" },
      { name: "defectQuantity", label: "Defect Quantity", type: "number", placeholder: "0" },
      { name: "totalQuantity", label: "Total Quantity", type: "number", placeholder: "0" },
      { name: "d2Photo", label: "Photo Upload", type: "photo" },
    ],
  },
  {
    id: "D3",
    label: "D3: Contain",
    description: "Develop interim containment actions — isolate the problem from the customer.",
    fields: [
      { name: "containmentDescription", label: "Containment Description", type: "textarea", required: true, placeholder: "Describe the immediate containment actions taken" },
      { name: "containmentScope", label: "Scope", type: "textarea", placeholder: "Define the scope of containment — which batches, products, or areas are affected" },
      { name: "containmentResponsible", label: "Responsible Person", type: "text", placeholder: "Name of person responsible for containment" },
      { name: "containmentDueDate", label: "Due Date", type: "date", placeholder: "" },
      { name: "containmentValidUntil", label: "Valid Until", type: "date", placeholder: "" },
      { name: "containmentVerification", label: "Verification Method", type: "textarea", placeholder: "How will you verify the containment is effective?" },
      { name: "d3Photo", label: "Photo Upload", type: "photo" },
    ],
  },
  {
    id: "D4",
    label: "D4: Root Cause",
    description: "Identify root causes — use Fishbone 6M, 5-Why, testing evidence, or FMEA to determine why the problem occurred and why it escaped.",
    fields: [
      { name: "rootCauseOccurrence", label: "Root Cause — Occurrence", type: "textarea", required: true, placeholder: "Why did the problem occur in the first place?" },
      { name: "rootCauseEscape", label: "Root Cause — Escape", type: "textarea", placeholder: "Why did the problem escape detection?" },
      { name: "rootCauseSystem", label: "Root Cause — System", type: "textarea", placeholder: "What systemic issue allowed this to happen?" },
      { name: "fishboneMan", label: "Fishbone 6M — Man / People", type: "textarea", placeholder: "Operator skill, training, staffing, handover, fatigue, or responsibility factors." },
      { name: "fishboneMachine", label: "Fishbone 6M — Machine / Equipment", type: "textarea", placeholder: "Machine condition, tooling, fixture, maintenance, calibration, or equipment capability factors." },
      { name: "fishboneMaterial", label: "Fishbone 6M — Material", type: "textarea", placeholder: "Incoming material, lot variation, supplier change, storage, shelf life, or contamination factors." },
      { name: "fishboneMethod", label: "Fishbone 6M — Method / Process", type: "textarea", placeholder: "Work instruction, process parameters, setup sequence, inspection method, or control plan gaps." },
      { name: "fishboneMeasurement", label: "Fishbone 6M — Measurement / Inspection", type: "textarea", placeholder: "Gauge accuracy, sample size, detection limit, inspection frequency, MSA, or data recording factors." },
      { name: "fishboneEnvironment", label: "Fishbone 6M — Environment", type: "textarea", placeholder: "Temperature, humidity, dust, lighting, ESD, vibration, or other environmental contributors." },
      { name: "why1", label: "5-Why — Why 1", type: "text", placeholder: "Why did this happen?" },
      { name: "why2", label: "5-Why — Why 2", type: "text", placeholder: "Answering the previous why..." },
      { name: "why3", label: "5-Why — Why 3", type: "text", placeholder: "Answering the previous why..." },
      { name: "why4", label: "5-Why — Why 4", type: "text", placeholder: "Answering the previous why..." },
      { name: "why5", label: "5-Why — Why 5", type: "text", placeholder: "Answering the previous why..." },
      { name: "testingPlan", label: "Testing Plan", type: "textarea", placeholder: "Describe the plan to test the root cause hypothesis" },
      { name: "testingResults", label: "Results", type: "textarea", placeholder: "Results from testing the root cause hypothesis" },
      { name: "confirmedRootCause", label: "Confirmed Root Cause", type: "textarea", placeholder: "Final confirmed root cause statement" },
    ],
  },
  {
    id: "D5",
    label: "D5: Correct",
    description: "Choose and verify permanent corrective actions — ensure the root cause is addressed.",
    fields: [
      { name: "selectedCorrectiveAction", label: "Selected Corrective Action", type: "textarea", required: true, placeholder: "Describe the chosen permanent corrective action" },
      { name: "correctiveRationale", label: "Rationale", type: "textarea", placeholder: "Why was this corrective action selected over alternatives?" },
      { name: "costEstimate", label: "Cost Estimate", type: "number", placeholder: "0.00" },
      { name: "correctiveResponsible", label: "Responsible", type: "text", placeholder: "Person responsible for implementation" },
      { name: "correctiveTargetDate", label: "Target Date", type: "date", placeholder: "" },
    ],
  },
  {
    id: "D6",
    label: "D6: Implement",
    description: "Implement and validate permanent corrective actions — put the fix in place and verify it works.",
    fields: [
      { name: "implementationPlan", label: "Implementation Plan", type: "textarea", required: true, placeholder: "Step-by-step plan to implement the corrective action" },
      { name: "completionDate", label: "Completion Date", type: "date", placeholder: "" },
      { name: "validationMethod", label: "Validation Method", type: "textarea", placeholder: "How will you validate the corrective action is working?" },
      { name: "validationResults", label: "Results", type: "textarea", placeholder: "Results from validation" },
      { name: "d6Photo", label: "Photo Upload", type: "photo" },
    ],
  },
  {
    id: "D7",
    label: "D7: Prevent",
    description: "Prevent recurrence — update systems, processes, and procedures to ensure the problem does not happen again.",
    fields: [
      { name: "systemChanges", label: "System Changes", type: "textarea", placeholder: "What system-level changes are being made?" },
      { name: "processUpdates", label: "Process Updates", type: "textarea", placeholder: "What process documents or work instructions are being updated?" },
      { name: "horizontalDeployment", label: "Horizontal Deployment", type: "textarea", placeholder: "Can this fix be applied to other lines, products, or facilities?" },
      { name: "trainingNeeds", label: "Training Needs", type: "textarea", placeholder: "What training is required for the team?" },
    ],
  },
  {
    id: "D8",
    label: "D8: Close",
    description: "Recognize the team and close the project — capture lessons learned for future improvement.",
    fields: [
      { name: "closureDate", label: "Closure Date", type: "date", placeholder: "" },
      { name: "lessonsLearned", label: "Lessons Learned", type: "textarea", placeholder: "What did the team learn from this process?" },
      { name: "teamAcknowledgment", label: "Team Acknowledgment", type: "textarea", placeholder: "Recognition and acknowledgment of the team's efforts" },
      { name: "preparedBy", label: "Prepared By", type: "text", placeholder: "Name of the report preparer" },
      { name: "preparedDate", label: "Prepared Date", type: "date", placeholder: "" },
      { name: "reviewedBy", label: "Reviewed By", type: "text", placeholder: "Name of the reviewer" },
      { name: "reviewedDate", label: "Reviewed Date", type: "date", placeholder: "" },
      { name: "approverName", label: "Approved By", type: "text", placeholder: "Name of the person approving closure" },
      { name: "approverDate", label: "Approval Date", type: "date", placeholder: "" },
    ],
  },
]
