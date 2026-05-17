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
  approverName: string
  approverDate: string
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
  approverName: "",
  approverDate: "",
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
      { name: "reportNumber", label: "Report Number", type: "text", placeholder: "Auto-generated", hint: "Auto-generated report number" },
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
    description: "Identify root causes — use tools like 5-Why, Ishikawa, or FMEA to determine why the problem occurred.",
    fields: [
      { name: "rootCauseOccurrence", label: "Root Cause — Occurrence", type: "textarea", required: true, placeholder: "Why did the problem occur in the first place?" },
      { name: "rootCauseEscape", label: "Root Cause — Escape", type: "textarea", placeholder: "Why did the problem escape detection?" },
      { name: "rootCauseSystem", label: "Root Cause — System", type: "textarea", placeholder: "What systemic issue allowed this to happen?" },
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
      { name: "approverName", label: "Approver Name", type: "text", placeholder: "Name of the person approving closure" },
      { name: "approverDate", label: "Approver Date", type: "date", placeholder: "" },
    ],
  },
]
