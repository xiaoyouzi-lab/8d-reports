import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ImageRun,
} from "docx";
import { STEPS, type ReportData } from "./report-steps";
import { getR2KeyFromPublicUrl, getR2ObjectBuffer } from "./r2";

const FISHBONE_FIELD_NAMES = new Set([
  "fishboneMan",
  "fishboneMachine",
  "fishboneMaterial",
  "fishboneMethod",
  "fishboneMeasurement",
  "fishboneEnvironment",
]);

const BRAND_BLUE = "1e40af";
const LIGHT_BLUE = "eff6ff";
const LIGHT_GRAY = "f8fafc";

interface WordExportOptions {
  reportData: ReportData;
  reportTitle: string;
  reportId: string;
  withWatermark: boolean;
  logoUrl?: string | null;
  locale?: string;
  attachmentImages?: { url: string; filename: string; stepId?: string; storagePath?: string; mimeType?: string | null }[];
}

function isImageAttachment(att: { mimeType?: string | null; storagePath?: string; url: string }) {
  return att.mimeType?.startsWith("image/") ?? false;
}

function addMetaRow(label: string, value: string) {
  return new Paragraph({
    spacing: { after: 80 },
    children: [
      new TextRun({ text: `${label}: `, bold: true, size: 22 }),
      new TextRun({ text: value || "-", size: 22 }),
    ],
  });
}

function textRun(text: string, options: { bold?: boolean; color?: string; size?: number; italics?: boolean } = {}) {
  return new TextRun({
    text,
    bold: options.bold,
    color: options.color,
    size: options.size ?? 20,
    italics: options.italics,
  });
}

function cell(text: string, options: { bold?: boolean; fill?: string; width?: number; color?: string } = {}) {
  return new TableCell({
    width: options.width ? { size: options.width, type: WidthType.DXA } : undefined,
    shading: options.fill ? { fill: options.fill } : undefined,
    margins: { top: 120, bottom: 120, left: 140, right: 140 },
    children: [
      new Paragraph({
        children: [textRun(text || "-", { bold: options.bold, color: options.color })],
      }),
    ],
  });
}

function renderMetadataTable(rows: Array<[string, string]>) {
  return new Table({
    width: { size: 9000, type: WidthType.DXA },
    rows: rows.map(([label, value]) => new TableRow({
      children: [
        cell(label, { bold: true, fill: LIGHT_BLUE, width: 2600, color: "334155" }),
        cell(value || "-", { width: 6400 }),
      ],
    })),
  });
}

function renderFieldTable(rows: Array<[string, string]>) {
  return new Table({
    width: { size: 9000, type: WidthType.DXA },
    rows: [
      new TableRow({
        children: [
          cell("Field", { bold: true, fill: BRAND_BLUE, width: 3000, color: "ffffff" }),
          cell("Response / Evidence", { bold: true, fill: BRAND_BLUE, width: 6000, color: "ffffff" }),
        ],
      }),
      ...rows.map(([label, value]) => new TableRow({
        children: [
          cell(label, { bold: true, fill: LIGHT_GRAY, width: 3000, color: "334155" }),
          cell(value || "No relevant data", { width: 6000 }),
        ],
      })),
    ],
  });
}

function renderAttachmentTable(attachments: Array<{ filename: string; stepId?: string; mimeType?: string | null }>) {
  return new Table({
    width: { size: 9000, type: WidthType.DXA },
    rows: [
      new TableRow({
        children: [
          cell("Step", { bold: true, fill: BRAND_BLUE, width: 1800, color: "ffffff" }),
          cell("Filename", { bold: true, fill: BRAND_BLUE, width: 5200, color: "ffffff" }),
          cell("Type", { bold: true, fill: BRAND_BLUE, width: 2000, color: "ffffff" }),
        ],
      }),
      ...attachments.map((att) => new TableRow({
        children: [
          cell(att.stepId || "General", { width: 1800 }),
          cell(att.filename, { width: 5200 }),
          cell(att.mimeType || "file", { width: 2000 }),
        ],
      })),
    ],
  });
}

async function fetchImageBuffer(img: { url: string; storagePath?: string }): Promise<Buffer | null> {
  if (img.storagePath) {
    const object = await getR2ObjectBuffer(img.storagePath);
    if (object?.buffer) return object.buffer;
  }

  const key = getR2KeyFromPublicUrl(img.url);
  if (key) {
    const object = await getR2ObjectBuffer(key);
    if (object?.buffer) return object.buffer;
  }

  try {
    const res = await fetch(img.url);
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

function getDocxImageType(mimeType?: string | null): "png" | "jpg" {
  return mimeType === "image/jpeg" || mimeType === "image/jpg" ? "jpg" : "png";
}

export async function generateWordDocument(options: WordExportOptions): Promise<Buffer> {
  const { reportData, reportTitle, reportId, withWatermark, logoUrl, attachmentImages = [] } = options;
  const isZh = options.locale?.startsWith("zh");

  const children: Array<Paragraph | Table> = [];

  // Cover page
  children.push(
    new Paragraph({
      spacing: { before: 2000 },
      children: [],
    })
  );

  if (logoUrl) {
    try {
      const buf = await fetchImageBuffer({ url: logoUrl });
      if (buf) {
        children.push(
          new Paragraph({
            alignment: AlignmentType.LEFT,
            children: [new ImageRun({ type: getDocxImageType(logoUrl.endsWith(".jpg") || logoUrl.endsWith(".jpeg") ? "image/jpeg" : "image/png"), data: buf, transformation: { width: 120, height: 60 } })],
          })
        );
      }
    } catch { /* ignore logo error */ }
  }

  children.push(
    new Paragraph({
      spacing: { before: 400 },
      children: [new TextRun({ text: isZh ? "8D 纠正措施报告" : "8D Corrective Action Report", size: 52, bold: true, color: BRAND_BLUE })],
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
      children: [new TextRun({ text: isZh ? "客户/供应商质量记录" : "Customer / supplier quality record", size: 22, color: "64748b" })],
    })
  );
  children.push(
    new Paragraph({
      spacing: { before: 240, after: 120 },
      children: [new TextRun({ text: "Report Metadata", size: 24, bold: true, color: BRAND_BLUE })],
    })
  );
  children.push(renderMetadataTable([
    ["Report Number", reportData.reportNumber || reportId],
    ["Customer / Supplier", reportData.customerName],
    ["Product / Part", reportData.productName],
    ["Batch / Lot", reportData.batchNumber],
    ["Report Type", reportData.reportType],
    ["Priority", reportData.priority],
    ["Generated Date", new Date().toLocaleDateString(isZh ? "zh-CN" : "en-US", { year: "numeric", month: "long", day: "numeric" })],
  ]));

  if (withWatermark) {
    children.push(
      new Paragraph({
        spacing: { before: 400 },
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Generated with 8d-reports.com", size: 28, color: "94a3b8", italics: true })],
      })
    );
  }

  children.push(
    new Paragraph({
      spacing: { before: 400 },
      children: [],
    })
  );

  children.push(
    new Paragraph({
      spacing: { before: 300, after: 100 },
      children: [new TextRun({ text: "D0-D8 Contents", size: 28, bold: true, color: "1e40af" })],
    })
  );
  for (const step of STEPS) {
    children.push(
      new Paragraph({
        spacing: { after: 80 },
        children: [
          new TextRun({ text: `${step.label}: `, bold: true, size: 20 }),
          new TextRun({ text: step.description, size: 18, color: "6b7280" }),
        ],
      })
    );
  }

  const normalAttachments = attachmentImages.filter((att) => att.stepId?.startsWith("signature_") !== true);
  if (normalAttachments.length > 0) {
    children.push(
      new Paragraph({
        spacing: { before: 300, after: 100 },
        children: [new TextRun({ text: "Attachment List", size: 28, bold: true, color: "1e40af" })],
      })
    );
    children.push(renderAttachmentTable(normalAttachments));
  }

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

    const fishboneFields = step.fields.filter((field) => FISHBONE_FIELD_NAMES.has(field.name));
    const fiveWhyFields = step.fields.filter((field) => field.name.startsWith("why"));
    const regularFields = step.fields.filter((field) => !FISHBONE_FIELD_NAMES.has(field.name) && !field.name.startsWith("why"));

    const fieldRows = regularFields
      .filter((field) => field.type !== "photo")
      .map((field) => [field.label, String(reportData[field.name as keyof ReportData] || "").trim()] as [string, string])
      .filter(([, value]) => value !== "");
    if (fieldRows.length > 0) {
      children.push(renderFieldTable(fieldRows));
    }

    if (fishboneFields.length > 0) {
      const values = fishboneFields.map((field) => ({
        label: field.label.replace("Fishbone 6M — ", ""),
        value: String(reportData[field.name as keyof ReportData] || ""),
      }));
      if (values.some((item) => item.value.trim() !== "")) {
        children.push(
          new Paragraph({
            spacing: { before: 200, after: 100 },
            children: [new TextRun({ text: "Fishbone / Ishikawa 6M Analysis", bold: true, size: 22, color: "1e40af" })],
          })
        );
        children.push(renderFishboneTable(values));
      }
    }

    if (fiveWhyFields.length > 0) {
      const values = fiveWhyFields.map((field) => String(reportData[field.name as keyof ReportData] || ""));
      if (values.some((value) => value.trim() !== "")) {
        children.push(
          new Paragraph({
            spacing: { before: 200, after: 100 },
            children: [new TextRun({ text: "5-Why Analysis", bold: true, size: 22, color: "1e40af" })],
          })
        );
        children.push(render5WhyTable(values));
      }
    }

    const stepImages = attachmentImages.filter((img) => img.stepId === step.id && isImageAttachment(img))
    const stepFiles = attachmentImages.filter((img) => img.stepId === step.id && !isImageAttachment(img))
    if (stepImages.length > 0) {
      children.push(
        new Paragraph({
          spacing: { before: 200, after: 100 },
          children: [new TextRun({ text: isZh ? "附件图片：" : "Attached Images:", bold: true, size: 20, italics: true, color: "6b7280" })],
        })
      )
      for (const img of stepImages) {
        try {
          const buf = await fetchImageBuffer(img)
          if (!buf) continue
          children.push(
            new Paragraph({
              spacing: { after: 50 },
              children: [new TextRun({ text: img.filename, size: 18, italics: true, color: "9ca3af" })],
            })
          )
          children.push(
            new Paragraph({
              children: [new ImageRun({ type: getDocxImageType(img.mimeType), data: buf, transformation: { width: 360, height: 270 } })],
            })
          )
        } catch { /* skip failed image fetch */ }
      }
    }
    if (stepFiles.length > 0) {
      children.push(
        new Paragraph({
          spacing: { before: 160, after: 80 },
          children: [new TextRun({ text: "Attached Files:", bold: true, size: 20, italics: true, color: "6b7280" })],
        })
      )
      for (const file of stepFiles) {
        children.push(
          new Paragraph({
            spacing: { after: 50 },
            children: [new TextRun({ text: `${file.filename} (${file.mimeType || "file"})`, size: 18, color: "4b5563" })],
          })
        )
      }
    }
  }

  children.push(
    new Paragraph({
      spacing: { before: 400, after: 120 },
      children: [new TextRun({ text: "Approval", size: 28, bold: true, color: "1e40af" })],
    })
  )
  const signatureRows = [
    { label: "Prepared by", name: reportData.preparedBy, date: reportData.preparedDate, url: reportData.preparedSignatureUrl },
    { label: "Reviewed by", name: reportData.reviewedBy, date: reportData.reviewedDate, url: reportData.reviewedSignatureUrl },
    { label: "Approved by", name: reportData.approverName, date: reportData.approverDate, url: reportData.approvedSignatureUrl },
  ]
  for (const row of signatureRows) {
    children.push(addMetaRow(row.label, `${row.name || "-"}    Date: ${row.date || "-"}`))
    if (row.url) {
      const isWebp = row.url.toLowerCase().includes(".webp")
      const buf = isWebp ? null : await fetchImageBuffer({ url: row.url })
      if (buf) {
        children.push(
          new Paragraph({
            spacing: { after: 120 },
            children: [new ImageRun({ type: getDocxImageType(row.url.endsWith(".jpg") ? "image/jpeg" : "image/png"), data: buf, transformation: { width: 160, height: 60 } })],
          })
        )
      } else {
        children.push(new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "Signature: ______________________________", size: 18 })] }))
      }
    } else {
      children.push(new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "Signature: ______________________________", size: 18 })] }))
    }
  }
  children.push(
    new Paragraph({
      spacing: { before: 100 },
      children: [new TextRun({ text: "Signature images are used for report presentation and are not a legal electronic signature.", size: 16, color: "6b7280" })],
    })
  )

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
      new TableCell({ width: { size: 1800, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Why", bold: true, size: 20 })] })] }),
      new TableCell({ width: { size: 7200, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Answer / Evidence", bold: true, size: 20 })] })] }),
    ],
  });

  const rows = [headerRow];
  for (let i = 0; i < 5; i++) {
    const value = values[i]?.trim() || "No relevant data";
    rows.push(
      new TableRow({
        children: [
          new TableCell({ width: { size: 1800, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: `Why ${i + 1}`, bold: true, size: 20 })] })] }),
          new TableCell({ width: { size: 7200, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: value, size: 20 })] })] }),
        ],
      })
    );
  }

  return new Table({ rows, width: { size: 9000, type: WidthType.DXA } });
}

function renderFishboneTable(values: Array<{ label: string; value: string }>) {
  const headerRow = new TableRow({
    children: [
      new TableCell({ width: { size: 2500, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "6M Category", bold: true, size: 20 })] })] }),
      new TableCell({ width: { size: 6500, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Possible Causes / Evidence Checked", bold: true, size: 20 })] })] }),
    ],
  });

  const rows = [
    headerRow,
    ...values.map((item) => new TableRow({
      children: [
        new TableCell({ width: { size: 2500, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: item.label, bold: true, size: 20 })] })] }),
        new TableCell({ width: { size: 6500, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: item.value || "-", size: 20 })] })] }),
      ],
    })),
  ];

  return new Table({ rows, width: { size: 9000, type: WidthType.DXA } });
}
