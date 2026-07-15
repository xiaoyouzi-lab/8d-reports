import { Document, Packer, Paragraph, TextRun } from "docx";

const BRAND_BLUE = "1e40af";
const TEXT_MUTED = "64748b";

export type QualityCaseDocumentContent = {
  title: string;
  caseId: string;
  outputType: string;
  status: string;
  waitingOn: string;
  assignee: string;
  dueAt: string | null;
  languageMode: "en" | "bilingual";
  fields: Record<string, string | undefined>;
};

const OUTPUT_TYPE_LABELS: Record<string, string> = {
  scar: "Supplier Corrective Action Request (SCAR)",
  car: "Corrective Action Report (CAR)",
  capa: "Corrective and Preventive Action (CAPA)",
  ncr_response: "Nonconformance Response (NCR)",
  corrective_action_report: "Corrective Action Report",
  "8d": "8D Corrective Action Report",
};

const CONTENT_FIELDS: Array<[string, keyof QualityCaseDocumentContent["fields"]]> = [
  ["Customer complaint", "problemDescription"],
  ["Immediate containment", "containmentDescription"],
  ["Confirmed root cause", "confirmedRootCause"],
  ["Corrective action", "selectedCorrectiveAction"],
  ["Implementation plan", "implementationPlan"],
  ["Effectiveness verification", "validationMethod"],
  ["Prevention of recurrence", "systemChanges"],
  ["Lessons learned", "lessonsLearned"],
];

function value(text: string | undefined) {
  return text?.trim() || "No relevant data";
}

function line(label: string, content: string) {
  return new Paragraph({
    spacing: { after: 100 },
    children: [
      new TextRun({ text: `${label}: `, bold: true, color: TEXT_MUTED, size: 20 }),
      new TextRun({ text: content, size: 20 }),
    ],
  });
}

function heading(text: string) {
  return new Paragraph({
    spacing: { before: 300, after: 140 },
    children: [new TextRun({ text, bold: true, color: BRAND_BLUE, size: 28 })],
  });
}

export function qualityCaseDocumentFilename(input: {
  caseId: string;
  outputType: string;
}) {
  const safeType = input.outputType.replace(/[^a-z0-9_-]/gi, "_") || "quality_case";
  return `${input.caseId.slice(0, 8)}_${safeType}_response.docx`;
}

export async function generateQualityCaseWordDocument(
  content: QualityCaseDocumentContent,
): Promise<Buffer> {
  const label = OUTPUT_TYPE_LABELS[content.outputType] || "Corrective Action Response";
  const children: Paragraph[] = [
    new Paragraph({ spacing: { before: 700 }, children: [] }),
    new Paragraph({
      children: [new TextRun({ text: label, bold: true, color: BRAND_BLUE, size: 44 })],
    }),
    new Paragraph({
      spacing: { before: 160, after: 320 },
      children: [new TextRun({ text: content.title, bold: true, size: 30 })],
    }),
    heading("Case metadata"),
    line("Case ID", content.caseId),
    line("Status", content.status),
    line("Waiting on", content.waitingOn),
    line("Responsible internal owner", content.assignee || "No relevant data"),
    line("Due date", content.dueAt || "No relevant data"),
    line("Output language", content.languageMode === "bilingual" ? "Chinese + English" : "English"),
    heading("Corrective action response"),
  ];
  for (const [labelText, key] of CONTENT_FIELDS) {
    children.push(line(labelText, value(content.fields[key])));
  }
  children.push(
    heading("Evidence handling"),
    new Paragraph({
      spacing: { after: 100 },
      children: [
        new TextRun({
          text: "Internal evidence is not automatically included in this document. Attach only evidence explicitly authorized for the intended recipient.",
          italics: true,
          color: TEXT_MUTED,
          size: 18,
        }),
      ],
    }),
    new Paragraph({
      spacing: { before: 300 },
      children: [
        new TextRun({
          text: "This document is a controlled Quality Case output. Customer acceptance does not close the Case; effectiveness verification remains required.",
          italics: true,
          color: TEXT_MUTED,
          size: 18,
        }),
      ],
    }),
  );
  return Packer.toBuffer(
    new Document({
      sections: [
        {
          properties: { page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } } },
          children,
        },
      ],
    }),
  );
}
