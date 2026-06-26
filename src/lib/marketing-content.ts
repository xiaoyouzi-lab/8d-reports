export const siteUrl = "https://www.8d-reports.com"

export const socialOpenGraphImage = {
  url: `${siteUrl}/opengraph-image`,
  width: 1200,
  height: 630,
  alt: "8D Reports customer-ready 8D reports",
}

export type SimpleFaq = {
  question: string
  answer: string
}

export const faqGroups = [
  {
    title: "Getting Started",
    items: [
      {
        question: "Is it free?",
        answer:
          "Yes. Free includes 3 lifetime reports, the complete D0-D8 editor, attachments, view-only sharing, and watermarked PDF export.",
      },
      {
        question: "Do I need a credit card?",
        answer:
          "No. You can start the Free plan and create your first reports without entering a credit card.",
      },
      {
        question: "What happens after 3 reports?",
        answer:
          "Your existing reports remain accessible. Creating more reports requires Pro or Team, and a single selected report can also be unlocked with one-time export.",
      },
    ],
  },
  {
    title: "Reports and Exports",
    items: [
      {
        question: "Can I export PDF, Word, and Excel?",
        answer:
          "Yes. Free exports a watermarked PDF. Pro, Team, and single report export unlock no-watermark PDF, Word, and Excel for formal delivery.",
      },
      {
        question: "What does the $4.99 single export include?",
        answer:
          "It unlocks one selected report for no-watermark PDF, Word, and Excel export. It does not unlock unlimited reports, company logo, editable sharing, or Pro search.",
      },
      {
        question: "Are attachments included?",
        answer:
          "Attachments can be added to report steps. When attachments exist, the selected report format and the attachment files are downloaded together as a ZIP package.",
      },
    ],
  },
  {
    title: "Sharing and Team",
    items: [
      {
        question: "Can suppliers or customers edit a report?",
        answer:
          "Free sharing is view-only. Editable sharing is available on Pro and Team when an external or internal collaborator needs to contribute directly.",
      },
      {
        question: "What is included in Team?",
        answer:
          "Team includes Pro features, 5 seats, a shared workspace, Owner / Editor / Viewer roles, approval and locking, revisions, and activity history.",
      },
    ],
  },
  {
    title: "Billing and Plans",
    items: [
      {
        question: "Can I cancel?",
        answer:
          "Contact support for cancellation or billing changes. Subscription status is updated through the billing provider and reflected in the product after the billing event is processed.",
      },
      {
        question: "Can I pay for only one report?",
        answer:
          "Yes. Single export is designed for users who only need one formal customer-ready deliverable and do not need ongoing Pro or Team features.",
      },
    ],
  },
  {
    title: "Security and AI",
    items: [
      {
        question: "Where is data stored?",
        answer:
          "Application data is stored in the product database and uploaded files are stored in configured object storage. Security details are documented on the Security page.",
      },
      {
        question: "Does AI approve reports?",
        answer:
          "No. AI Quality Check is a beta assistant that can flag possible gaps. It does not approve, certify, or replace engineering review.",
      },
      {
        question: "Can I delete my data?",
        answer:
          "You can edit report content you control in the app and delete attachments or share links where those controls are available. For account-level, full report, or workspace-level deletion questions, contact support so the request can be handled safely.",
      },
    ],
  },
] satisfies Array<{ title: string; items: SimpleFaq[] }>

export const allFaqs = faqGroups.flatMap((group) => group.items)

export const sampleReportSteps = [
  {
    id: "D0",
    title: "Prepare the response",
    body: "Customer complaint opened for brake bracket coating peel-off. The quality engineer confirmed scope, urgency, first response date, and report owner before launching the 8D.",
    details: "Scope: batch B26-041, customer line validation, high priority.",
  },
  {
    id: "D1",
    title: "Build the team",
    body: "Quality engineering, coating process owner, production supervisor, warehouse, and supplier quality joined the investigation with clear owners for evidence, containment, and customer response.",
    details: "Owner: quality engineering. Contributors: process, production, warehouse, SQE.",
  },
  {
    id: "D2",
    title: "Describe the problem",
    body: "18 of 500 brake brackets showed visible coating peel-off after salt spray validation. The issue was limited to coating line 2, shift B, production date 2026-05-18, batch B26-041.",
    details: "A strong report starts with measurable facts.",
  },
  {
    id: "D3",
    title: "Contain the issue",
    body: "Affected stock was blocked, 100% visual inspection started, customer service was notified, and temporary outgoing inspection was added for all open shipments until root cause was verified.",
    details: "Containment protects the customer while investigation continues.",
  },
  {
    id: "D4",
    title: "Verify root cause",
    body: "Occurrence cause: fixture cleaning check was skipped before line change. Escape cause: outgoing inspection checklist did not include coating edge adhesion.",
    details: "Credible 8D reports separate occurrence and escape causes.",
  },
  {
    id: "D5",
    title: "Choose corrective actions",
    body: "The team added mandatory fixture cleaning sign-off, updated the coating setup checklist, and retrained shift B operators before restart.",
    details: "Actions must trace back to verified causes.",
  },
  {
    id: "D6",
    title: "Implement and validate",
    body: "Three follow-up lots passed adhesion and visual checks. No repeat defect was found after 1,500 pieces shipped.",
    details: "Validation includes result and sample size, not just a completion date.",
  },
  {
    id: "D7",
    title: "Prevent recurrence",
    body: "The control plan, layered audit checklist, and similar line startup checklist were updated. A line-change lesson was added for future coating work.",
    details: "Prevention turns one fix into a reusable quality control.",
  },
  {
    id: "D8",
    title: "Close and recognize",
    body: "The customer accepted the corrective action package. Final lessons learned and team recognition were recorded before closure.",
    details: "Closure records acceptance and preserves learning for future reports.",
  },
]

export const templateSteps = [
  {
    id: "D0",
    title: "Plan and prepare",
    body: "Confirm the issue needs an 8D and define customer, product, batch, symptom, urgency, affected quantity, initial owner, and first response scope.",
    details: "Use this step to avoid opening a broad report with unclear scope.",
  },
  {
    id: "D1",
    title: "Build the team",
    body: "Assign people who understand the product, process, detection controls, customer impact, and approval path.",
    details: "List functions, responsibilities, leader, and escalation contacts.",
  },
  {
    id: "D2",
    title: "Describe the problem",
    body: "Turn the complaint into a measurable problem statement: what, where, when, who, how many, frequency, specification, and Is / Is Not boundaries.",
    details: "A strong D2 makes the rest of the report easier to verify.",
  },
  {
    id: "D3",
    title: "Contain the issue",
    body: "Protect the customer while permanent cause and corrective action are still being verified. Record sort scope, stock locations, suspect dates, owners, and release criteria.",
    details: "Containment is temporary protection, not permanent correction.",
  },
  {
    id: "D4",
    title: "Verify root cause",
    body: "Identify why the defect occurred and why existing controls allowed it to escape. Record occurrence cause, escape cause, evidence, and verification method.",
    details: "Use 5 Why or fishbone evidence when it helps the reasoning stay traceable.",
  },
  {
    id: "D5",
    title: "Choose corrective actions",
    body: "Select actions linked to the verified causes. Include owner, due date, expected result, risk review, and approval.",
    details: "Every D5 action should point back to a cause from D4.",
  },
  {
    id: "D6",
    title: "Implement and validate",
    body: "Show that permanent actions were completed and effective under real conditions. Include implementation date, validation sample, result, and remaining risk.",
    details: "Do not close D6 with only a status update.",
  },
  {
    id: "D7",
    title: "Prevent recurrence",
    body: "Extend the learning to similar products, processes, documents, controls, and teams. Update control plans, PFMEA, work instructions, training, audits, or deployment owners.",
    details: "D7 is where a local fix becomes a system improvement.",
  },
  {
    id: "D8",
    title: "Close and recognize",
    body: "Confirm customer acceptance, close open actions, and preserve lessons for future reports.",
    details: "Record final approver, customer response, and lessons learned.",
  },
]

export const blankTemplateText = templateSteps
  .map((step) => `${step.id} - ${step.title}\n${step.body}\n`)
  .join("\n")

export type DocsTopic = {
  slug: string
  title: string
  summary: string
  steps: string[]
  callout: string
}

export const docsTopics: DocsTopic[] = [
  {
    slug: "getting-started",
    title: "Getting started",
    summary:
      "Start with the workflow the product is built for: open a customer complaint or supplier issue, complete D0-D8, attach evidence, and export a formal deliverable. Free includes 3 lifetime reports, so the first useful test is to complete one realistic report instead of browsing settings.",
    steps: [
      "Create a free account from Start free.",
      "Open the dashboard and create a new 8D report.",
      "Fill the report title, product, customer or supplier context, and initial owner.",
      "Move through D0-D8 in order, saving evidence and decisions as you go.",
      "Use export or sharing only after the report is ready for review.",
    ],
    callout:
      "Registration verification is sent by Resend email. Verification codes are not read from server logs.",
  },
  {
    slug: "create-report",
    title: "Create a report",
    summary:
      "A report should start with a real complaint, defect, supplier issue, or recurring internal problem. 8D Reports keeps the report structured so the final PDF, Word, or Excel file can be delivered with attachments when present.",
    steps: [
      "Choose New report from the dashboard.",
      "Enter a concise title and report number or customer reference when available.",
      "Add product, batch, customer, supplier, priority, and owner details.",
      "Save the report, then start D0 and D1 before writing the full problem statement.",
    ],
    callout:
      "Avoid opening duplicate reports for the same issue unless the customer or supplier requires a separate response.",
  },
  {
    slug: "edit-d0-d8",
    title: "Edit D0-D8",
    summary:
      "The editor is designed for quality reasoning, not just form filling. Keep containment separate from corrective action and make sure every D5 action traces back to a verified D4 cause.",
    steps: [
      "Use D0 to confirm scope and readiness.",
      "Use D1 to assign the cross-functional team.",
      "Use D2 to write a measurable problem statement.",
      "Use D3 for temporary containment and customer protection.",
      "Use D4-D7 for verified causes, corrective action, validation, and prevention.",
      "Use D8 to close the report after review and customer acceptance.",
    ],
    callout:
      "If evidence is missing, write that clearly. Do not invent measurements, tests, or approvals.",
  },
  {
    slug: "attachments",
    title: "Attachments",
    summary:
      "Attachments keep evidence tied to the step where it supports the decision. Photos, inspection records, test files, and customer documents are easier to review when they stay with the report instead of living in email threads.",
    steps: [
      "Open the relevant D-step in the editor.",
      "Upload photos, inspection sheets, logs, or other supporting files.",
      "Name evidence clearly so reviewers know what each file proves.",
      "Review the attachment list before exporting a package.",
    ],
    callout:
      "Do not upload unrelated private files. Attachments should support the specific 8D report.",
  },
  {
    slug: "export-and-zip",
    title: "Export and ZIP packages",
    summary:
      "Exports are for formal delivery. Free reports can export watermarked PDF, while Pro, Team, and single export unlock no-watermark PDF, Word, and Excel for the selected report.",
    steps: [
      "Review D0-D8 content and attachments before export.",
      "Choose PDF when the recipient needs a fixed final record.",
      "Choose Word when the recipient requires an editable document.",
      "Choose Excel when a tabular customer format is expected.",
      "When attachments exist, use the ZIP package generated for the selected report format.",
    ],
    callout:
      "When attachments exist, the selected report format and the attachment files are downloaded together as a ZIP package.",
  },
  {
    slug: "sharing",
    title: "Sharing",
    summary:
      "Sharing lets internal reviewers, suppliers, or customers inspect a report without emailing changing file versions. Free sharing is view-only; editable sharing is available on Pro and Team.",
    steps: [
      "Open the report sharing controls.",
      "Choose view-only sharing for customer or management review.",
      "Use editable sharing only when the collaborator should contribute to the report.",
      "Revoke links that are no longer needed.",
    ],
    callout:
      "Use view-only links for formal review unless the recipient must edit the report.",
  },
  {
    slug: "team-workflow",
    title: "Team workflow",
    summary:
      "Team is for small quality teams that need shared report control. It includes 5 seats, a shared workspace, roles, approval and locking, revisions, and activity history.",
    steps: [
      "Set up the team workspace and invite members.",
      "Assign Owner, Editor, or Viewer roles.",
      "Use review and approval states before formal export.",
      "Lock reports when they should no longer be edited casually.",
      "Use revisions and activity history to understand what changed.",
    ],
    callout:
      "Team is a lightweight 8D response and delivery workspace for shared review and control.",
  },
  {
    slug: "plans-and-billing",
    title: "Plans and billing",
    summary:
      "Free is for evaluation, Pro is for regular personal delivery, Team is for shared quality control, and single export is for one selected report. The $4.99 single export unlocks no-watermark PDF, Word, and Excel for one report.",
    steps: [
      "Use Free to create up to 3 lifetime reports.",
      "Upgrade to Pro for unlimited personal reports and formal exports.",
      "Choose Team when multiple people need shared workspace control.",
      "Use single export when you only need one formal report deliverable.",
    ],
    callout:
      "Pricing amounts and checkout behavior are handled by the product billing flow and are not changed by the public site redesign.",
  },
  {
    slug: "security-and-data",
    title: "Security and data",
    summary:
      "8D Reports keeps product claims conservative as a report workflow and delivery workspace. Security details, sharing behavior, data deletion questions, and AI handling should be reviewed before broader team rollout.",
    steps: [
      "Use role and sharing controls to limit who can view or edit reports.",
      "Avoid placing unnecessary confidential data in a report.",
      "Review the Security page before team rollout.",
      "Contact support for account-level or workspace-level deletion questions.",
    ],
    callout:
      "Do not treat AI output as approval, certification, or verified evidence.",
  },
  {
    slug: "ai-quality-check",
    title: "AI Quality Check",
    summary:
      "AI Quality Check is a beta assistant for conservative report review. It can flag possible gaps, weak reasoning, or missing evidence, but it does not approve reports or create evidence.",
    steps: [
      "Open AI Quality Check from a report when it is available.",
      "Review suggested gaps or risks against your actual evidence.",
      "Update the report only when the suggestion is supported by facts.",
      "Keep human review and approval responsible for final decisions.",
    ],
    callout:
      "If evidence is missing, the correct answer is to say so. The assistant must not invent facts.",
  },
]

export function getDocsTopic(slug: string) {
  return docsTopics.find((topic) => topic.slug === slug)
}

export function docsTopicUrl(slug: string) {
  return `${siteUrl}/docs/${slug}`
}
