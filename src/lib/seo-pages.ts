export type SeoPage = {
  slug: string
  title: string
  description: string
  eyebrow: string
  h1: string
  intro: string
  sections: Array<{
    title: string
    body: string
  }>
  checklist: string[]
  faq: Array<{
    question: string
    answer: string
  }>
}

export const seoPages: SeoPage[] = [
  {
    slug: "8d-report-template",
    title: "8D Report Template | Create D0-D8 Reports Online",
    description:
      "Use an online 8D report template with guided D0-D8 sections, evidence uploads, PDF export, and Pro historical search.",
    eyebrow: "8D report template",
    h1: "Online 8D report template for customer-ready corrective action reports",
    intro:
      "A practical 8D template should help quality engineers move from problem description to root cause, corrective action, prevention, and closure without losing evidence along the way.",
    sections: [
      {
        title: "What the template includes",
        body:
          "8D Reports follows the standard D0-D8 structure: prepare, form the team, describe the problem, contain the issue, identify root cause, define corrective actions, verify implementation, prevent recurrence, and close the report.",
      },
      {
        title: "Why use a web-based template",
        body:
          "Spreadsheet templates are familiar, but evidence files, version control, and repeated historical issues often become scattered. A web workflow keeps the report, attachments, export, and search in one place.",
      },
      {
        title: "Free and Pro usage",
        body:
          "Free users can create up to 3 lifetime reports and export watermarked PDFs. Pro unlocks unlimited personal reports, no-watermark PDF export, Word export, company logo, editable sharing, and deep historical search.",
      },
    ],
    checklist: [
      "Define the customer, product, batch, and problem source",
      "Capture containment actions and verification evidence",
      "Document occurrence, escape, and system root causes",
      "Assign corrective and preventive actions with owners and due dates",
      "Export a clear report for customer or supplier review",
    ],
    faq: [
      {
        question: "Can I use this as a supplier 8D template?",
        answer:
          "Yes. The workflow is suitable for supplier corrective action reports, especially when the customer accepts PDF or Word-style deliverables.",
      },
      {
        question: "Does the free template include the full D0-D8 flow?",
        answer:
          "Yes. Free users can complete the full report flow. Pro focuses on formal delivery and long-term reuse.",
      },
    ],
  },
  {
    slug: "8d-report-example",
    title: "8D Report Example | Guided Quality Report Sample",
    description:
      "Review what a complete 8D report should contain, from problem description and containment to root cause and corrective action.",
    eyebrow: "8D report example",
    h1: "A practical 8D report example for quality engineers",
    intro:
      "A useful 8D example is not just a finished document. It shows how the logic connects: problem statement, containment, root cause evidence, corrective action, verification, and lessons learned.",
    sections: [
      {
        title: "Start with a measurable problem",
        body:
          "The D2 problem description should answer what happened, where it happened, when it happened, how often it happened, and which product or batch was affected.",
      },
      {
        title: "Keep containment separate from correction",
        body:
          "D3 containment protects the customer immediately. D5 corrective action addresses the verified root cause. Mixing the two is one of the most common weaknesses in 8D reports.",
      },
      {
        title: "Close with prevention",
        body:
          "D7 should show what changed in the process, control plan, training, checklist, or system so the same issue is less likely to recur.",
      },
    ],
    checklist: [
      "Specific problem statement",
      "Temporary containment action",
      "5-Why or root cause analysis evidence",
      "Corrective action with owner and due date",
      "Verification result",
      "Prevention and lesson learned",
    ],
    faq: [
      {
        question: "Can I generate a sample report in the app?",
        answer:
          "Yes. The dashboard includes a sample report path so you can quickly see how a completed 8D report is structured.",
      },
      {
        question: "Should an 8D example include attachments?",
        answer:
          "Often yes. Photos, inspection records, test results, and process evidence make the report more credible.",
      },
    ],
  },
  {
    slug: "supplier-8d-report",
    title: "Supplier 8D Report | Corrective Action Workflow",
    description:
      "Create supplier 8D reports with structured D0-D8 steps, evidence uploads, export, sharing, and Pro editable links.",
    eyebrow: "Supplier 8D report",
    h1: "Supplier 8D reports that are easier to complete, share, and review",
    intro:
      "Supplier quality teams need 8D reports that are complete enough for customer review but simple enough for suppliers to fill out without fighting a document template.",
    sections: [
      {
        title: "What customers usually need",
        body:
          "Customers generally need a clear problem description, immediate containment, verified root cause, permanent corrective action, implementation evidence, and prevention controls.",
      },
      {
        title: "How web sharing helps",
        body:
          "View-only links let stakeholders review a report without emailing files. Pro editable links can help suppliers contribute directly when collaboration is appropriate.",
      },
      {
        title: "When Word export matters",
        body:
          "Many customers still ask for a formal document. Pro Word export supports that workflow while keeping the structured report history in the system.",
      },
    ],
    checklist: [
      "Supplier name and contact owner",
      "Customer complaint or audit finding",
      "Containment action and affected scope",
      "Root cause and escape cause",
      "Corrective action evidence",
      "Prevention and recurrence controls",
    ],
    faq: [
      {
        question: "Can a supplier use this without Pro?",
        answer:
          "A supplier can complete reports on Free within the 3-report limit. Pro is better for teams that manage recurring supplier reports.",
      },
      {
        question: "Can suppliers edit a shared 8D report?",
        answer:
          "Editable sharing requires Pro or Team. Free sharing is view-only.",
      },
    ],
  },
  {
    slug: "corrective-action-report-template",
    title: "Corrective Action Report Template | 8D and CAPA Workflow",
    description:
      "Use a structured corrective action report template to capture containment, root cause, corrective action, verification, and prevention.",
    eyebrow: "Corrective action report",
    h1: "Corrective action report template for real quality issues",
    intro:
      "Corrective action reports are strongest when they connect evidence to decisions. The 8D format gives quality teams a practical structure for doing that.",
    sections: [
      {
        title: "From issue to action",
        body:
          "A good corrective action report records the issue, immediate containment, cause analysis, permanent action, verification, and prevention measures.",
      },
      {
        title: "Why 8D works well",
        body:
          "The 8D structure is especially useful for customer complaints, supplier issues, recurring process defects, and cross-functional quality investigations.",
      },
      {
        title: "Make history searchable",
        body:
          "Pro deep search helps teams find similar past problems, root causes, corrective actions, and lessons learned before starting from zero again.",
      },
    ],
    checklist: [
      "Problem statement",
      "Immediate containment",
      "Root cause analysis",
      "Corrective action plan",
      "Implementation evidence",
      "Effectiveness verification",
      "Prevention controls",
    ],
    faq: [
      {
        question: "Is an 8D report the same as a corrective action report?",
        answer:
          "An 8D report is one structured type of corrective action report. It is commonly used for customer complaints and supplier quality issues.",
      },
      {
        question: "Can I export the corrective action report?",
        answer:
          "Yes. Free users can export watermarked PDFs. Pro users can export without watermark and use Word export.",
      },
    ],
  },
  {
    slug: "5-why-root-cause-template",
    title: "5 Why Root Cause Template | Use with 8D Reports",
    description:
      "Document 5-Why root cause analysis inside an 8D report and connect causes to corrective and preventive actions.",
    eyebrow: "5-Why root cause",
    h1: "5-Why root cause template connected to your 8D report",
    intro:
      "5-Why analysis is useful when it does not stop at guesses. It should connect each why to evidence and lead to corrective actions that address the verified cause.",
    sections: [
      {
        title: "Use 5-Why inside D4",
        body:
          "D4 is where the team identifies and verifies root causes. A 5-Why table helps structure the thinking, especially for process and system causes.",
      },
      {
        title: "Separate occurrence and escape",
        body:
          "Occurrence cause explains why the defect happened. Escape cause explains why it was not detected before reaching the next process or customer.",
      },
      {
        title: "Turn causes into prevention",
        body:
          "A 5-Why analysis is only useful if the resulting D5 and D7 actions change the process, control plan, training, or system behavior.",
      },
    ],
    checklist: [
      "Define the problem clearly",
      "Ask why the issue occurred",
      "Ask why it escaped detection",
      "Verify answers with evidence",
      "Link final causes to corrective actions",
      "Capture prevention and lessons learned",
    ],
    faq: [
      {
        question: "Is 5-Why enough for every 8D report?",
        answer:
          "Not always. Complex issues may also need Ishikawa, FMEA, test data, or process studies. 5-Why is a practical starting point.",
      },
      {
        question: "Can I attach evidence to the root cause step?",
        answer:
          "Yes. Attachments can be uploaded to the relevant D step so the exported report preserves the supporting evidence.",
      },
    ],
  },
]

export function getSeoPage(slug: string) {
  return seoPages.find((page) => page.slug === slug)
}
