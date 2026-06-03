import { NextRequest, NextResponse } from "next/server";
import { jsPDF } from "jspdf";

const samples: Record<string, { title: string; industry: string; problem: string; rootCause: string; action: string }> = {
  automotive: {
    title: "Automotive 8D Sample - Brake Bracket Coating Failure",
    industry: "Automotive supplier quality",
    problem: "Customer reported coating peel-off on brake brackets from lot BB-2026-031 after salt spray validation.",
    rootCause: "Pretreatment bath concentration drifted below the control limit and the shift handover checklist did not require verification before restart.",
    action: "Locked pretreatment concentration checks before production restart, retrained operators, and added layered process audit confirmation.",
  },
  supplier: {
    title: "Supplier SCAR Sample - Incoming Dimension Out of Tolerance",
    industry: "Supplier corrective action",
    problem: "Incoming machined bushings exceeded upper tolerance on inner diameter during receiving inspection.",
    rootCause: "Supplier tool offset was changed without second-person verification after insert replacement.",
    action: "Supplier added offset approval, first-piece revalidation, and shipment certificate review for three lots.",
  },
  electronics: {
    title: "Electronics 8D Sample - Solder Joint Intermittent Failure",
    industry: "Electronics manufacturing",
    problem: "Functional test found intermittent LED driver failure after thermal cycling on assembly line 2.",
    rootCause: "Reflow soak-zone recipe was edited without engineering approval, reducing wetting margin on one connector pad.",
    action: "Restored approved recipe, locked recipe permissions, and added AOI trend review for the connector joint.",
  },
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ type: string }> },
) {
  const { type } = await params;
  const sample = samples[type] || samples.automotive;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  let y = 24;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(79, 70, 229);
  doc.text("8D REPORT SAMPLE", 20, y);
  y += 14;
  doc.setTextColor(20, 20, 20);
  doc.setFontSize(14);
  doc.text(sample.title, 20, y);
  y += 12;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const rows = [
    ["Industry", sample.industry],
    ["D2 Problem Description", sample.problem],
    ["D3 Containment", "Suspect stock quarantined, customer pipeline checked, and 100% inspection applied until permanent action verified."],
    ["D4 Root Cause", sample.rootCause],
    ["D5 Corrective Action", sample.action],
    ["D6 Verification", "Three consecutive lots passed inspection with no repeat failure; audit evidence attached."],
    ["D7 Prevention", "Control plan, work instruction, training record, and layered audit checklist updated."],
    ["D8 Approval", "Prepared / Reviewed / Approved signature area included in paid exports."],
  ];
  for (const [label, value] of rows) {
    doc.setFont("helvetica", "bold");
    doc.text(label, 20, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(value, 170);
    doc.text(lines, 20, y);
    y += lines.length * 5 + 6;
  }
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text("Generated sample from 8D Reports. Replace with your own report evidence before customer submission.", 20, 285);
  const bytes = doc.output("arraybuffer");
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${type}-8d-sample.pdf"`,
    },
  });
}
