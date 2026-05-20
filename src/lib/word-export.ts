import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, WidthType, ImageRun, Header,
} from "docx";
import { STEPS, type ReportData } from "./report-steps";

interface WordExportOptions {
  reportData: ReportData;
  reportTitle: string;
  reportId: string;
  withWatermark: boolean;
  logoUrl?: string | null;
  locale?: string;
}

export async function generateWordDocument(options: WordExportOptions): Promise<Buffer> {
  const { reportData, reportTitle, reportId, withWatermark, logoUrl } = options;
  const isZh = options.locale?.startsWith("zh");

  const children: any[] = [];

  // Cover page
  children.push(
    new Paragraph({
      spacing: { before: 2000 },
      children: [],
    })
  );

  if (logoUrl) {
    try {
      const res = await fetch(logoUrl);
      const buf = Buffer.from(await res.arrayBuffer());
      children.push(
        new Paragraph({
          alignment: AlignmentType.LEFT,
          children: [new ImageRun({ type: "png", data: buf, transformation: { width: 120, height: 60 } })],
        })
      );
    } catch { /* ignore logo error */ }
  }

  children.push(
    new Paragraph({
      spacing: { before: 400 },
      children: [new TextRun({ text: isZh ? "8D 报告" : "8D Report", size: 56, bold: true, color: "1e40af" })],
    })
  );
  children.push(
    new Paragraph({
      spacing: { before: 200 },
      children: [new TextRun({ text: reportTitle, size: 36, bold: true })],
    })
  );
  children.push(
    new Paragraph({
      spacing: { before: 100 },
      children: [new TextRun({ text: reportId, size: 24, color: "4b5563" })],
    })
  );
  children.push(
    new Paragraph({
      spacing: { before: 100 },
      children: [new TextRun({ text: new Date().toLocaleDateString(isZh ? "zh-CN" : "en-US", { year: "numeric", month: "long", day: "numeric" }), size: 24, color: "4b5563" })],
    })
  );

  if (withWatermark) {
    children.push(
      new Paragraph({
        spacing: { before: 400 },
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: isZh ? "样 例 报 告" : "SAMPLE REPORT", size: 40, color: "d1d5db", italics: true })],
      })
    );
  }

  children.push(
    new Paragraph({
      spacing: { before: 400 },
      children: [],
    })
  );

  // Steps
  for (const step of STEPS) {
    children.push(
      new Paragraph({
        spacing: { before: 400, after: 100 },
        children: [new TextRun({ text: step.label, size: 28, bold: true, color: "1e40af" })],
      })
    );
    children.push(
      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({ text: step.description, size: 20, italics: true, color: "6b7280" })],
      })
    );

    for (const field of step.fields) {
      const val = (reportData as any)[field.name];
      if (!val || String(val).trim() === "") continue;

      if ((field.type as string) === "table-5why") {
        children.push(render5WhyTable(val as string[]));
      } else {
        children.push(
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: field.label + ": ", bold: true, size: 22 }),
              new TextRun({ text: String(val), size: 22 }),
            ],
          })
        );
      }
    }
  }

  const doc = new Document({
    sections: [{
      properties: {},
      children,
    }],
  });

  return Packer.toBuffer(doc);
}

function render5WhyTable(values: string[]) {
  const headerRow = new TableRow({
    children: [
      new TableCell({ width: { size: 2000, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Step", bold: true, size: 20 })] })] }),
      new TableCell({ width: { size: 4000, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Question / Observation", bold: true, size: 20 })] })] }),
      new TableCell({ width: { size: 3000, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Answer / Root Cause", bold: true, size: 20 })] })] }),
    ],
  });

  const rows = [headerRow];
  const labels = ["1st Why", "2nd Why", "3rd Why", "4th Why", "5th Why"];
  for (let i = 0; i < 5; i++) {
    rows.push(
      new TableRow({
        children: [
          new TableCell({ width: { size: 2000, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: labels[i], size: 20 })] })] }),
          new TableCell({ width: { size: 4000, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: values[i * 2] || "", size: 20 })] })] }),
          new TableCell({ width: { size: 3000, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: values[i * 2 + 1] || "", size: 20 })] })] }),
        ],
      })
    );
  }

  return new Table({ rows, width: { size: 9000, type: WidthType.DXA } });
}
