export type RevenueGeoResource = {
  slug: string
  title: string
  metaTitle: string
  metaDescription: string
  h1: string
  targetQuery: string
  intent: "informational" | "commercial" | "service" | "template" | "comparison"
  category: string
  answer: string
  proofElements: string[]
  checklist: string[]
  mistakes: string[]
  table: {
    title: string
    columns: [string, string, string]
    rows: [string, string, string][]
  }
  sections: {
    title: string
    body: string
  }[]
  primaryCta: {
    label: string
    href: string
    eventName?: string
    eventData?: Record<string, string>
  }
  secondaryCta: {
    label: string
    href: string
  }
  relatedLinks: {
    label: string
    href: string
  }[]
  faq: {
    question: string
    answer: string
  }[]
}

export const revenueGeoResources: RevenueGeoResource[] = [
  {
    slug: "how-to-write-8d-report-customer-complaint",
    title: "How to Write an 8D Report for a Customer Complaint",
    metaTitle: "How to Write an 8D Report for a Customer Complaint",
    metaDescription:
      "Write a customer complaint 8D report with D0-D8 structure, containment, root cause, corrective action, validation, prevention, and common mistakes.",
    h1: "How to write an 8D report for a customer complaint",
    targetQuery: "how to write an 8D report for customer complaint",
    intent: "informational",
    category: "Customer complaint",
    answer:
      "To write an 8D report for a customer complaint, start with a measurable problem statement, protect the customer with containment, verify occurrence and escape root causes, choose corrective actions that match those causes, validate the actions, update prevention controls, and close with lessons learned.",
    proofElements: [
      "Complaint number, product, lot, date, and affected quantity",
      "Containment scope and verification method",
      "Root-cause evidence, action owners, validation result, and closure record",
    ],
    checklist: [
      "Capture the customer symptom in measurable terms.",
      "Define suspect product, inventory, shipments, and production window.",
      "Record immediate containment separately from permanent corrective action.",
      "Verify occurrence cause and escape cause with evidence.",
      "Connect each D5 action to a verified D4 cause.",
      "Show D6 validation method, sample, result, and monitoring period.",
      "Update D7 controls and D8 lessons so the next team can reuse the learning.",
    ],
    mistakes: [
      "Using a broad symptom without quantity, location, timing, or specification.",
      "Calling sorting or rework the permanent corrective action.",
      "Skipping the escape cause and only explaining why the defect happened.",
      "Closing validation with a date but no result or sample size.",
    ],
    table: {
      title: "Customer complaint 8D structure",
      columns: ["Step", "What to write", "Evidence to attach"],
      rows: [
        ["D2", "What happened, where, when, how many, and who found it.", "Complaint, photos, inspection data"],
        ["D3", "How the customer is protected while cause is investigated.", "Sort records, stock hold list"],
        ["D4", "Occurrence and escape causes verified by evidence.", "5 Why, test logs, process records"],
        ["D5-D6", "Permanent actions and effectiveness validation.", "Action plan, audit or test results"],
        ["D7-D8", "System updates, lessons, closure, and recognition.", "Control plan, training, closure note"],
      ],
    },
    sections: [
      {
        title: "Start with the customer risk",
        body:
          "A customer complaint 8D should make the customer impact clear before the team debates causes. Record what the customer found, what product or shipment is affected, and how the team will protect open shipments.",
      },
      {
        title: "Keep containment and correction separate",
        body:
          "Containment is temporary protection. Corrective action changes the process or system that created the issue. Mixing them makes the report look fast but weak.",
      },
      {
        title: "When to use Template Setup or Assisted First 8D",
        body:
          "Use Template Setup when the customer requires a specific Excel or Word format. Use Assisted First 8D when the response is due soon and the team needs help structuring the first customer-ready package.",
      },
    ],
    primaryCta: {
      label: "Get assisted first 8D help",
      href: "/custom-8d-template-setup?service=assisted_8d#request",
      eventName: "pricing_service_cta_clicked",
      eventData: { service: "assisted_8d" },
    },
    secondaryCta: { label: "View sample report", href: "/sample-report" },
    relatedLinks: [
      { label: "Customer complaint 8D example", href: "/8d-report-example/customer-complaint" },
      { label: "Demo reports", href: "/demo-reports" },
      { label: "8D report template", href: "/8d-report-template" },
    ],
    faq: [
      {
        question: "What should the first 80 words of a customer complaint 8D answer?",
        answer:
          "They should answer what happened, who found it, which product or lot is affected, what containment is active, and what the team is verifying next.",
      },
      {
        question: "Can AI write the 8D response for me?",
        answer:
          "AI can help review gaps, but it should not invent evidence, approve the report, or replace engineering judgment.",
      },
    ],
  },
  {
    slug: "supplier-corrective-action-request-template",
    title: "Supplier Corrective Action Request Template",
    metaTitle: "Supplier Corrective Action Request Template | SCAR Response",
    metaDescription:
      "Use a practical supplier corrective action request template with SCAR fields, 8D mapping, containment, root cause, corrective action, and closure criteria.",
    h1: "Supplier corrective action request template for customer-ready SCAR responses",
    targetQuery: "supplier corrective action request template",
    intent: "template",
    category: "SCAR",
    answer:
      "A supplier corrective action request should ask for the defect description, affected scope, immediate containment, root cause, corrective action, effectiveness validation, prevention update, owner, due date, and closure evidence. For serious issues, the response can be structured as an 8D.",
    proofElements: [
      "Supplier lot, purchase order, drawing or specification reference",
      "Containment records and certified-stock decision",
      "Action owners, validation data, and closure criteria",
    ],
    checklist: [
      "State the nonconformance and required response date.",
      "Ask the supplier to identify affected inventory and shipments.",
      "Require containment before permanent action is complete.",
      "Separate occurrence root cause from escape or detection cause.",
      "Require action owner, due date, and validation evidence.",
      "Define closure criteria before accepting the response.",
    ],
    mistakes: [
      "Requesting a corrective action without a clear defect definition.",
      "Accepting a supplier promise without validation evidence.",
      "Treating a revised inspection step as prevention when the process cause remains.",
      "Closing the SCAR before affected stock is reconciled.",
    ],
    table: {
      title: "SCAR fields mapped to 8D logic",
      columns: ["SCAR field", "8D equivalent", "Review question"],
      rows: [
        ["Problem statement", "D2", "Is the defect measurable and scoped?"],
        ["Containment", "D3", "Is the customer protected now?"],
        ["Root cause", "D4", "Is the cause verified, not guessed?"],
        ["Corrective action", "D5-D6", "Does validation prove the action worked?"],
        ["Prevention", "D7-D8", "Will the supplier prevent recurrence?"],
      ],
    },
    sections: [
      {
        title: "Use the request to control the response",
        body:
          "A SCAR template is not just a blank form. It should tell the supplier exactly what evidence is required before the response can be accepted.",
      },
      {
        title: "Keep review criteria visible",
        body:
          "Quality teams should define what counts as acceptable containment, root cause, validation, and closure. That avoids back-and-forth after the supplier submits a weak response.",
      },
      {
        title: "When to use Template Setup or Assisted First 8D",
        body:
          "Use Template Setup when your customer or company already has a SCAR form. Use Assisted First 8D when a customer SCAR response is due and the team needs a structured first package.",
      },
    ],
    primaryCta: {
      label: "Request template setup",
      href: "/custom-8d-template-setup#request",
      eventName: "pricing_service_cta_clicked",
      eventData: { service: "template_setup" },
    },
    secondaryCta: { label: "Download demo report", href: "/demo-reports/automotive" },
    relatedLinks: [
      { label: "Supplier 8D report", href: "/supplier-8d-report" },
      { label: "Automotive demo report", href: "/demo-reports/automotive" },
      { label: "Team Launch", href: "/team-launch" },
    ],
    faq: [
      {
        question: "Is a SCAR the same as an 8D?",
        answer:
          "Not always. A SCAR is the request for supplier corrective action. An 8D is one structured response format that can satisfy many SCAR requests.",
      },
      {
        question: "Should the supplier include attachments?",
        answer:
          "Usually yes. Inspection records, photos, test data, and updated controls help reviewers judge whether the response is credible.",
      },
    ],
  },
  {
    slug: "8d-vs-scar",
    title: "8D vs SCAR: When to Use Each Corrective Action Format",
    metaTitle: "8D vs SCAR | Corrective Action and Supplier Response",
    metaDescription:
      "Compare 8D and SCAR workflows, when to use each format, what evidence belongs in the response, and when assisted 8D support helps.",
    h1: "8D vs SCAR: when a supplier request becomes a full 8D response",
    targetQuery: "8D vs SCAR",
    intent: "comparison",
    category: "Comparison",
    answer:
      "A SCAR is a supplier corrective action request. An 8D is a structured problem-solving report. Use SCAR to request and track supplier response; use 8D when the issue needs containment, root-cause analysis, corrective action, validation, prevention, and closure evidence.",
    proofElements: [
      "Request scope and due date",
      "D0-D8 evidence package or supplier response form",
      "Closure criteria and review decision",
    ],
    checklist: [
      "Use SCAR when asking a supplier to respond to a defect or audit finding.",
      "Use 8D when the response needs structured containment and root-cause evidence.",
      "Define whether the customer expects a specific form or a complete 8D package.",
      "Track owner, due date, review status, and closure evidence.",
      "Preserve lessons learned for future supplier quality issues.",
    ],
    mistakes: [
      "Using SCAR as a vague email request with no closure criteria.",
      "Requiring a full 8D for a minor issue where a simpler correction is enough.",
      "Accepting containment as final corrective action.",
      "Forgetting to update supplier controls after closure.",
    ],
    table: {
      title: "8D vs SCAR comparison",
      columns: ["Decision", "SCAR", "8D"],
      rows: [
        ["Main purpose", "Request supplier corrective action", "Document full problem-solving logic"],
        ["Best fit", "Supplier nonconformance or audit finding", "Customer complaint or recurring defect"],
        ["Evidence", "Supplier response and closure proof", "D0-D8 evidence and validation"],
        ["Review", "SQE or customer quality review", "Cross-functional report review"],
        ["Output", "Accepted or returned supplier response", "Customer-ready corrective action report"],
      ],
    },
    sections: [
      {
        title: "SCAR is the request; 8D is often the response",
        body:
          "Customers may issue a SCAR and ask the supplier to answer in an 8D format. Keeping the distinction clear helps the team manage both the request workflow and the response content.",
      },
      {
        title: "Use the format that matches risk",
        body:
          "A full 8D is useful when the issue has customer impact, repeat risk, unclear root cause, or required validation. Simpler issues may only need a targeted corrective action response.",
      },
      {
        title: "When to use Template Setup or Assisted First 8D",
        body:
          "Use Template Setup for a customer-specific SCAR/8D form. Use Assisted First 8D when the team needs a first response package for a customer deadline.",
      },
    ],
    primaryCta: {
      label: "Get SCAR response help",
      href: "/custom-8d-template-setup?service=assisted_8d#request",
      eventName: "pricing_service_cta_clicked",
      eventData: { service: "assisted_8d" },
    },
    secondaryCta: { label: "View supplier 8D", href: "/supplier-8d-report" },
    relatedLinks: [
      { label: "Supplier corrective action template", href: "/resources/supplier-corrective-action-request-template" },
      { label: "Corrective action report template", href: "/corrective-action-report-template" },
      { label: "Pricing", href: "/pricing" },
    ],
    faq: [
      {
        question: "Can an 8D report be used as a SCAR response?",
        answer:
          "Yes, when the customer or SQE accepts the 8D as the supplier corrective action response.",
      },
      {
        question: "Does 8D Reports claim to replace a full QMS?",
        answer:
          "No. It is a focused 8D, SCAR response, evidence, workflow, and export workspace, not a full QMS.",
      },
    ],
  },
  {
    slug: "excel-8d-template-vs-8d-software",
    title: "Excel 8D Template vs Online 8D Software",
    metaTitle: "Excel 8D Template vs 8D Software | When to Move Online",
    metaDescription:
      "Compare Excel 8D templates with online 8D software for evidence, revision control, export, team workflow, and reusable quality knowledge.",
    h1: "Excel 8D template vs online 8D software",
    targetQuery: "Excel 8D template vs 8D software",
    intent: "comparison",
    category: "Excel replacement",
    answer:
      "An Excel 8D template is fast and familiar for a single report. Online 8D software is better when reports need evidence attachments, controlled sharing, revision history, export-ready delivery, team review, and reuse of past root causes or corrective actions.",
    proofElements: [
      "File-control risk comparison",
      "Export and attachment workflow",
      "Reuse and Knowledge Base workflow",
    ],
    checklist: [
      "Stay in Excel for a one-time internal worksheet with low review risk.",
      "Move online when attachments, versions, and customer-ready exports matter.",
      "Move online when multiple people review or update the report.",
      "Move online when similar problems repeat and past actions should be searchable.",
      "Use Template Setup if your customer still requires a specific Excel output.",
    ],
    mistakes: [
      "Emailing multiple spreadsheet copies and losing the source of truth.",
      "Putting photos and test data in separate folders with no report traceability.",
      "Treating a custom customer format as a reason to avoid workflow entirely.",
      "Ignoring historical search until recurring defects appear.",
    ],
    table: {
      title: "Excel template vs online workflow",
      columns: ["Need", "Excel template", "Online 8D software"],
      rows: [
        ["Single draft", "Fast and familiar", "Still usable but more structured"],
        ["Attachments", "Often scattered", "Stored by report step"],
        ["Review", "Manual file control", "Roles, workflow, and activity history"],
        ["Export", "Customer-specific but fragile", "PDF, Word, Excel, and ZIP outputs"],
        ["Reuse", "Hard to search", "Completed reports become knowledge assets"],
      ],
    },
    sections: [
      {
        title: "Excel is not the enemy",
        body:
          "Many teams start with Excel because it is available and flexible. The problem starts when files, evidence, revisions, and customer exports split across email and shared folders.",
      },
      {
        title: "Online workflow helps when quality knowledge matters",
        body:
          "When a report is completed, its root cause, corrective action, validation, prevention, and lessons learned can help the next team avoid starting from zero.",
      },
      {
        title: "When to use Template Setup or Assisted First 8D",
        body:
          "Use Template Setup when your Excel format is required by a customer. Use Assisted First 8D when the team needs help completing the first response, not only converting a file.",
      },
    ],
    primaryCta: {
      label: "Request template setup",
      href: "/custom-8d-template-setup#request",
      eventName: "pricing_service_cta_clicked",
      eventData: { service: "template_setup" },
    },
    secondaryCta: { label: "Compare plans", href: "/pricing" },
    relatedLinks: [
      { label: "Demo report downloads", href: "/demo-reports" },
      { label: "8D report template", href: "/8d-report-template" },
      { label: "Knowledge Base", href: "/knowledge" },
    ],
    faq: [
      {
        question: "Can I still export Excel from 8D Reports?",
        answer:
          "Yes. Demo reports include Excel downloads, and paid report export can include Excel for real user reports according to plan entitlements.",
      },
      {
        question: "Can a company-specific Excel template be supported?",
        answer:
          "Template Setup is intended for teams that need help mapping their current Word or Excel format into a reusable workflow or output plan.",
      },
    ],
  },
  {
    slug: "custom-8d-template-setup-guide",
    title: "Custom 8D Template Setup Guide",
    metaTitle: "Custom 8D Template Setup Guide | Word and Excel 8D Formats",
    metaDescription:
      "Prepare for custom 8D template setup by gathering your current Word, Excel, or PowerPoint format, required export, fields, workflow, and examples.",
    h1: "Custom 8D template setup guide",
    targetQuery: "custom 8D report template setup",
    intent: "service",
    category: "Service",
    answer:
      "Custom 8D template setup starts by collecting your current Word, Excel, PowerPoint, or customer form, identifying required fields and export format, mapping those fields to D0-D8, and deciding which workflow, evidence, review, and reuse steps matter for your team.",
    proofElements: [
      "Current template file and required customer output",
      "Field map from current format to D0-D8",
      "Workflow owners, reviewers, export needs, and first sample report",
    ],
    checklist: [
      "Gather the current form or screenshot of the customer-required format.",
      "Mark required fields, optional fields, signatures, and approval blocks.",
      "List required outputs: PDF, Word, Excel, ZIP, or customer file.",
      "Identify who creates, reviews, approves, and exports the report.",
      "Choose one real past issue as the setup sample.",
      "Decide whether completed reports should feed Knowledge Base reuse.",
    ],
    mistakes: [
      "Starting setup without the actual customer-required format.",
      "Mapping fields but ignoring evidence attachments and export workflow.",
      "Trying to automate a broken internal process before clarifying ownership.",
      "Promising a custom output before confirming the required file behavior.",
    ],
    table: {
      title: "What to prepare for setup",
      columns: ["Input", "Why it matters", "Example"],
      rows: [
        ["Current template", "Shows required sections and output shape", "Excel SCAR form"],
        ["Required export", "Determines delivery path", "Customer PDF plus Excel action table"],
        ["Workflow owners", "Defines review and approval", "Owner, editor, viewer"],
        ["Sample issue", "Tests the mapped workflow", "Recent customer complaint"],
        ["Evidence needs", "Controls attachment and ZIP expectations", "Photos, inspection records"],
      ],
    },
    sections: [
      {
        title: "Template setup is not just formatting",
        body:
          "The goal is a reusable workflow that can produce the customer-ready output. Field mapping, evidence handling, ownership, and export expectations all matter.",
      },
      {
        title: "Start with one real report",
        body:
          "A real past issue helps reveal missing fields, ambiguous owners, awkward export requirements, and places where the team still relies on email.",
      },
      {
        title: "When to use Template Setup or Assisted First 8D",
        body:
          "Use Template Setup for format/workflow conversion. Use Assisted First 8D when the immediate problem is completing the first customer response.",
      },
    ],
    primaryCta: {
      label: "Upload your template",
      href: "/custom-8d-template-setup#request",
      eventName: "pricing_service_cta_clicked",
      eventData: { service: "template_setup" },
    },
    secondaryCta: { label: "See service pricing", href: "/pricing" },
    relatedLinks: [
      { label: "Template Setup page", href: "/custom-8d-template-setup" },
      { label: "Team Launch", href: "/team-launch" },
      { label: "Excel vs software", href: "/resources/excel-8d-template-vs-8d-software" },
    ],
    faq: [
      {
        question: "Do I need to upload a file before asking about setup?",
        answer:
          "No. A file helps, but the request can start with your process, required export, timeline, and message.",
      },
      {
        question: "Does setup guarantee customer acceptance?",
        answer:
          "No. Setup can help create a clearer workflow and output, but the customer still reviews the evidence and engineering logic.",
      },
    ],
  },
  {
    slug: "ai-8d-report-checker",
    title: "AI 8D Report Checker",
    metaTitle: "AI 8D Report Checker | Conservative Quality Review",
    metaDescription:
      "Use an AI 8D report checker conservatively to find gaps in root cause, corrective action, validation, prevention, and evidence without inventing facts.",
    h1: "AI 8D report checker for conservative quality review",
    targetQuery: "AI 8D report checker",
    intent: "commercial",
    category: "AI Quality Check",
    answer:
      "An AI 8D report checker should help identify gaps, weak evidence, missing validation, unclear root cause, and prevention risks. It should not approve the report, certify the response, invent evidence, or replace the quality engineer's review.",
    proofElements: [
      "Saved report content and visible evidence summary",
      "Checklist of D4-D7 review questions",
      "Safe output that flags gaps instead of inventing answers",
    ],
    checklist: [
      "Review whether D2 is measurable.",
      "Check whether D4 separates occurrence and escape cause.",
      "Check whether D5 actions trace to verified causes.",
      "Check whether D6 validation includes method, sample, and result.",
      "Check whether D7 prevention updates the system, not only the part.",
      "Treat AI findings as review prompts, not final approval.",
    ],
    mistakes: [
      "Asking AI to invent missing root cause evidence.",
      "Treating AI output as customer approval.",
      "Ignoring attachments or test records because the AI summary looks fluent.",
      "Using AI to hide weak validation instead of improving it.",
    ],
    table: {
      title: "Safe AI review boundaries",
      columns: ["AI can help with", "AI must not do", "Human owner"],
      rows: [
        ["Find missing fields", "Invent measurements", "Quality engineer"],
        ["Flag weak cause/action logic", "Approve root cause", "Process owner"],
        ["Suggest review questions", "Certify customer acceptance", "Report owner"],
        ["Compare against reusable knowledge", "Copy history blindly", "Team reviewer"],
        ["Summarize gaps", "Replace evidence", "Quality manager"],
      ],
    },
    sections: [
      {
        title: "Use AI as a reviewer, not an author of evidence",
        body:
          "A useful AI check should make the report harder to fool, not easier to pad. It should point to missing evidence and unclear reasoning.",
      },
      {
        title: "Knowledge context can improve review quality",
        body:
          "Historical completed reports can show repeated patterns and prevention ideas, but they are reference context only. The current report still needs its own evidence.",
      },
      {
        title: "When to use Template Setup or Assisted First 8D",
        body:
          "Use Template Setup when AI review reveals a recurring format/workflow problem. Use Assisted First 8D when the current customer response needs structured human review.",
      },
    ],
    primaryCta: {
      label: "Start free",
      href: "/signup",
      eventName: "marketing_cta_clicked",
      eventData: { cta: "signup" },
    },
    secondaryCta: { label: "View report review service", href: "/8d-report-review-service" },
    relatedLinks: [
      { label: "AI Quality Check service", href: "/8d-report-review-service" },
      { label: "Knowledge Base", href: "/knowledge" },
      { label: "Sample report", href: "/sample-report" },
    ],
    faq: [
      {
        question: "Can AI approve an 8D report?",
        answer:
          "No. AI can flag review issues, but approval remains a human quality and customer decision.",
      },
      {
        question: "Should AI write missing validation results?",
        answer:
          "No. Missing validation should be shown as missing data, not invented text.",
      },
    ],
  },
  {
    slug: "8d-root-cause-d4-guide",
    title: "D4 Root Cause Guide for 8D Reports",
    metaTitle: "D4 Root Cause Guide | Occurrence and Escape Cause in 8D",
    metaDescription:
      "Write stronger D4 root cause sections by separating occurrence cause, escape cause, evidence, 5 Why logic, and corrective action traceability.",
    h1: "D4 root cause guide for 8D reports",
    targetQuery: "how to complete D4 root cause in 8D",
    intent: "informational",
    category: "D4 root cause",
    answer:
      "D4 should identify and verify why the defect occurred and why existing controls failed to detect it. A strong D4 separates occurrence cause from escape cause, ties each cause to evidence, and prepares the D5 corrective actions.",
    proofElements: [
      "5 Why or fishbone analysis",
      "Process records, inspection data, test results, and photos",
      "Cause verification method and rejected alternative causes",
    ],
    checklist: [
      "Restate the D2 problem before analyzing cause.",
      "Identify occurrence cause and escape cause separately.",
      "Use 5 Why, fishbone, data review, or process audit as appropriate.",
      "Record what evidence confirms each cause.",
      "List alternative causes that were checked and ruled out.",
      "Make sure D5 actions trace back to D4 causes.",
    ],
    mistakes: [
      "Stopping at operator error without system or process evidence.",
      "Writing a cause that simply repeats the symptom.",
      "Ignoring the escape cause.",
      "Choosing corrective actions before the cause is verified.",
    ],
    table: {
      title: "Occurrence vs escape cause",
      columns: ["Cause type", "Question", "Example evidence"],
      rows: [
        ["Occurrence", "Why did the defect happen?", "Setup record, process audit, test data"],
        ["Escape", "Why was it not detected?", "Inspection checklist, control limit, audit gap"],
        ["System", "Why could the weakness repeat?", "Control plan or training gap"],
        ["Alternative", "What was ruled out?", "Test result or process comparison"],
        ["Link to D5", "What action addresses this cause?", "Action plan traceability"],
      ],
    },
    sections: [
      {
        title: "Occurrence cause is not enough",
        body:
          "Customer-facing 8D reports often look weak when they explain why the defect happened but not why it escaped. D4 needs both when detection failed.",
      },
      {
        title: "Evidence beats fluent wording",
        body:
          "A short cause with real process evidence is stronger than a long narrative with no verification. Keep the reasoning traceable.",
      },
      {
        title: "When to use Template Setup or Assisted First 8D",
        body:
          "Use Assisted First 8D if the team is stuck proving D4 before a deadline. Use Template Setup if the company format does not clearly separate occurrence and escape cause.",
      },
    ],
    primaryCta: {
      label: "View completed example",
      href: "/sample-report",
      eventName: "demo_report_downloaded",
      eventData: { source: "d4_resource" },
    },
    secondaryCta: { label: "Search Knowledge Base", href: "/knowledge" },
    relatedLinks: [
      { label: "5 Why template", href: "/5-why-root-cause-template" },
      { label: "5 Why examples", href: "/5-why-example/customer-complaint" },
      { label: "D5 corrective action guide", href: "/resources/8d-corrective-action-d5-guide" },
    ],
    faq: [
      {
        question: "Should D4 include both occurrence and escape cause?",
        answer:
          "Usually yes when the defect reached a customer or downstream process. Occurrence explains why it happened; escape explains why controls missed it.",
      },
      {
        question: "Is 5 Why required?",
        answer:
          "Not always, but the report should show a traceable method for verifying root cause.",
      },
    ],
  },
  {
    slug: "8d-corrective-action-d5-guide",
    title: "D5 Corrective Action Guide for 8D Reports",
    metaTitle: "D5 Corrective Action Guide | Link Actions to Root Cause",
    metaDescription:
      "Write stronger D5 corrective actions by linking every action to a verified root cause, owner, due date, risk, and validation plan.",
    h1: "D5 corrective action guide for 8D reports",
    targetQuery: "how to complete D5 corrective action in 8D",
    intent: "informational",
    category: "D5 corrective action",
    answer:
      "D5 should select permanent corrective actions that address the verified D4 root causes. Each action needs an owner, due date, expected effect, risk review, and a plan for D6 validation.",
    proofElements: [
      "D4 cause-to-action traceability",
      "Owner, due date, and implementation plan",
      "Risk review and validation method",
    ],
    checklist: [
      "Copy the verified D4 cause into the action review.",
      "Define one or more actions that directly address that cause.",
      "Assign a responsible owner and due date.",
      "State the expected process change or control improvement.",
      "Review side effects and implementation risk.",
      "Define how D6 will prove the action worked.",
    ],
    mistakes: [
      "Choosing training for every issue without fixing the process weakness.",
      "Listing actions that do not trace to a verified root cause.",
      "Leaving owner or due date blank.",
      "Skipping validation planning until after implementation.",
    ],
    table: {
      title: "D5 action selection table",
      columns: ["Root cause", "Corrective action", "Validation idea"],
      rows: [
        ["Fixture check skipped", "Mandatory line-change sign-off", "Audit three restarts"],
        ["Inspection checklist missing edge check", "Add edge-adhesion check", "Review outgoing inspection records"],
        ["Tool wear sample too low", "Increase sample frequency", "Three clean lots above target Cpk"],
        ["Recipe changed without approval", "Lock recipe edits", "No unapproved edits for 30 days"],
        ["Supplier control plan gap", "Update supplier control plan", "Monthly SPC evidence"],
      ],
    },
    sections: [
      {
        title: "Corrective action should change the system",
        body:
          "A strong D5 action removes or controls the cause. It should not be a vague instruction to be careful unless the real verified cause is only behavior and the control supports it.",
      },
      {
        title: "Plan D6 before closing D5",
        body:
          "If the team cannot explain how the action will be validated, the action may be too vague or disconnected from the cause.",
      },
      {
        title: "When to use Template Setup or Assisted First 8D",
        body:
          "Use Assisted First 8D when cause/action logic is weak before customer submission. Use Template Setup if your standard form does not force action traceability.",
      },
    ],
    primaryCta: {
      label: "Get first 8D review help",
      href: "/custom-8d-template-setup?service=assisted_8d#request",
      eventName: "pricing_service_cta_clicked",
      eventData: { service: "assisted_8d" },
    },
    secondaryCta: { label: "View D4 guide", href: "/resources/8d-root-cause-d4-guide" },
    relatedLinks: [
      { label: "Sample report", href: "/sample-report" },
      { label: "Corrective action template", href: "/corrective-action-report-template" },
      { label: "D6 validation guide", href: "/resources/8d-validation-d6-guide" },
    ],
    faq: [
      {
        question: "Can containment be a D5 corrective action?",
        answer:
          "Containment belongs in D3. D5 should address the verified permanent cause unless the containment is being converted into a controlled process change.",
      },
      {
        question: "How many D5 actions should an 8D have?",
        answer:
          "Use as many as needed to address the verified occurrence and escape causes, but avoid unrelated action lists.",
      },
    ],
  },
  {
    slug: "8d-validation-d6-guide",
    title: "D6 Validation Guide for 8D Reports",
    metaTitle: "D6 Validation Guide | Prove Corrective Actions Worked",
    metaDescription:
      "Document D6 validation with implementation evidence, method, sample size, results, monitoring period, and remaining risk for customer-ready 8D reports.",
    h1: "D6 validation guide for 8D reports",
    targetQuery: "D6 validation in 8D report",
    intent: "informational",
    category: "D6 validation",
    answer:
      "D6 should show that corrective actions were implemented and effective. Include what changed, when it changed, who verified it, the validation method, sample size or period, actual result, and any remaining risk or follow-up monitoring.",
    proofElements: [
      "Implementation record and responsible owner",
      "Validation method, sample size, date range, and result",
      "Follow-up monitoring or audit record",
    ],
    checklist: [
      "Confirm the corrective action was implemented as planned.",
      "Record the validation method before stating success.",
      "Include sample size, date range, or monitoring period.",
      "Show actual results, not only completion status.",
      "State whether additional monitoring remains open.",
      "Attach test, audit, inspection, or production evidence.",
    ],
    mistakes: [
      "Writing 'implemented' without showing effectiveness.",
      "Using one checked part as proof for a broader process change.",
      "Leaving the validation period unclear.",
      "Forgetting to verify both occurrence and escape controls.",
    ],
    table: {
      title: "D6 validation evidence",
      columns: ["Action type", "Validation method", "Stronger evidence"],
      rows: [
        ["Process checklist", "Layered audit", "Three audited restarts with no misses"],
        ["Inspection update", "Record review", "Outgoing checks for affected feature"],
        ["Supplier control", "Incoming lot review", "Three accepted lots plus SPC data"],
        ["Equipment setting", "Capability run", "Cpk or defect-rate trend"],
        ["Training", "Observed work", "Operator sign-off plus audit result"],
      ],
    },
    sections: [
      {
        title: "Validation is more than implementation",
        body:
          "Implementation says the team did the action. Validation says the action worked under real conditions.",
      },
      {
        title: "Use the right evidence for the action",
        body:
          "A training action may need observation and audit. A process change may need defect-rate trend or capability evidence. Match the proof to the risk.",
      },
      {
        title: "When to use Template Setup or Assisted First 8D",
        body:
          "Use Assisted First 8D if validation evidence is weak before a customer deadline. Use Template Setup if your form does not capture method, sample, and result clearly.",
      },
    ],
    primaryCta: {
      label: "Download demo package",
      href: "/demo-reports",
      eventName: "demo_report_downloaded",
      eventData: { source: "d6_resource" },
    },
    secondaryCta: { label: "View sample report", href: "/sample-report" },
    relatedLinks: [
      { label: "D5 corrective action guide", href: "/resources/8d-corrective-action-d5-guide" },
      { label: "Automotive demo report", href: "/demo-reports/automotive" },
      { label: "8D report template", href: "/8d-report-template" },
    ],
    faq: [
      {
        question: "What is the difference between D5 and D6?",
        answer:
          "D5 selects the corrective actions. D6 implements and validates that those actions worked.",
      },
      {
        question: "Does D6 need a sample size?",
        answer:
          "For many manufacturing issues, yes. If sample size does not apply, document the monitoring period or audit scope instead.",
      },
    ],
  },
  {
    slug: "8d-lessons-learned-d8-guide",
    title: "D8 Lessons Learned Guide for 8D Reports",
    metaTitle: "D8 Lessons Learned Guide | Prevention and Knowledge Reuse",
    metaDescription:
      "Close 8D reports with D7 prevention and D8 lessons learned that preserve reusable knowledge for future root-cause and corrective-action work.",
    h1: "D8 lessons learned guide for reusable 8D knowledge",
    targetQuery: "D8 lessons learned in 8D report",
    intent: "informational",
    category: "D8 lessons learned",
    answer:
      "D8 should close the report by confirming actions, preserving lessons learned, recognizing the team, and making the completed 8D useful for future similar problems. Strong D8 notes explain what changed, what the team learned, and what future teams should check first.",
    proofElements: [
      "Closed actions and final review decision",
      "Control-plan, checklist, training, or process update",
      "Reusable lessons learned for future quality issues",
    ],
    checklist: [
      "Confirm D5/D6 actions are closed or clearly tracked.",
      "Record what changed in D7 prevention controls.",
      "Write lessons learned in a way another engineer can reuse.",
      "Name similar products, processes, or suppliers that should be checked.",
      "Recognize contributors without turning the report into a story.",
      "Make completed reports searchable for future root-cause and action reuse.",
    ],
    mistakes: [
      "Writing 'team recognized' without any lesson learned.",
      "Repeating the corrective action instead of explaining the future learning.",
      "Skipping prevention updates for similar processes.",
      "Closing the report before reusable knowledge is captured.",
    ],
    table: {
      title: "D7 prevention and D8 lessons",
      columns: ["Closeout item", "Weak wording", "Stronger wording"],
      rows: [
        ["Prevention", "Updated checklist", "Added fixture-cleaning photo evidence to line-change checklist"],
        ["Lesson", "Need better training", "Line-change controls need independent verification before restart"],
        ["Reuse", "Check similar lines", "Search coating line startup issues before next fixture change"],
        ["Closure", "Actions complete", "Three lots validated with outgoing edge-adhesion checks"],
        ["Recognition", "Thanks team", "Recognized process, inspection, and SQE owners for evidence turnaround"],
      ],
    },
    sections: [
      {
        title: "Lessons learned should help the next report",
        body:
          "A completed 8D is not only a document. It is a quality knowledge asset when the root cause, corrective action, validation, prevention, and lesson can be found again.",
      },
      {
        title: "D7 feeds D8",
        body:
          "Prevention changes in D7 give D8 something concrete to preserve. Without system changes, lessons learned often become vague reminders.",
      },
      {
        title: "When to use Template Setup or Assisted First 8D",
        body:
          "Use Template Setup if your current format has no place for lessons learned. Use Assisted First 8D if closure is blocked by weak prevention or validation evidence.",
      },
    ],
    primaryCta: {
      label: "Search reusable knowledge",
      href: "/knowledge",
      eventName: "knowledge_search_used",
      eventData: { source: "d8_resource" },
    },
    secondaryCta: { label: "Start a free report", href: "/signup" },
    relatedLinks: [
      { label: "Knowledge Base", href: "/knowledge" },
      { label: "D6 validation guide", href: "/resources/8d-validation-d6-guide" },
      { label: "Demo reports", href: "/demo-reports" },
    ],
    faq: [
      {
        question: "What should lessons learned include?",
        answer:
          "They should describe the reusable learning, related process or product areas, and what future teams should check before repeating the issue.",
      },
      {
        question: "Does a completed report become reusable knowledge?",
        answer:
          "Yes. Completed and closed reports can become searchable knowledge assets for future root cause, corrective action, prevention, and lessons learned reuse.",
      },
    ],
  },
]

export function getRevenueGeoResource(slug: string) {
  return revenueGeoResources.find((resource) => resource.slug === slug)
}
