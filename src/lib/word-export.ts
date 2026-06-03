import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, ImageRun,
} from "docx";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { STEPS, type ReportData } from "./report-steps";
import { getR2Client } from "./r2";

const FISHBONE_FIELD_NAMES = new Set([
  "fishboneMan",
  "fishboneMachine",
  "fishboneMaterial",
  "fishboneMethod",
  "fishboneMeasurement",
  "fishboneEnvironment",
]);

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

async function fetchImageBuffer(img: { url: string; storagePath?: string }): Promise<Buffer | null> {
  if (img.storagePath) {
    const client = getR2Client();
    if (client) {
      try {
        const object = await client.send(
          new GetObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME || "8d-reports",
            Key: img.storagePath,
          })
        );
        const bytes = await object.Body?.transformToByteArray();
        if (bytes) return Buffer.from(bytes);
      } catch {
        // Fall back to URL fetch below.
      }
    }
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
  children.push(addMetaRow("Report Number", reportData.reportNumber || reportId));
  children.push(addMetaRow("Customer", reportData.customerName));
  children.push(addMetaRow("Product / Model", reportData.productName));
  children.push(addMetaRow("Batch / Lot", reportData.batchNumber));
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
    for (const att of normalAttachments) {
      children.push(
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({ text: `${att.stepId || "General"}: `, bold: true, size: 18 }),
            new TextRun({ text: `${att.filename} (${att.mimeType || "file"})`, size: 18 }),
          ],
        })
      );
    }
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

    for (const field of regularFields) {
      const val: unknown = reportData[field.name as keyof ReportData];
      if (!val || String(val).trim() === "") continue;

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
      new TableCell({ width: { size: 2000, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Step", bold: true, size: 20 })] })] }),
      new TableCell({ width: { size: 7000, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Question / Answer", bold: true, size: 20 })] })] }),
    ],
  });

  const rows = [headerRow];
  const labels = ["1st Why", "2nd Why", "3rd Why", "4th Why", "5th Why"];
  for (let i = 0; i < 5; i++) {
    rows.push(
      new TableRow({
        children: [
          new TableCell({ width: { size: 2000, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: labels[i], size: 20 })] })] }),
          new TableCell({ width: { size: 7000, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: values[i] || "-", size: 20 })] })] }),
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
