import {
  Document, Packer, Paragraph, TextRun,
  AlignmentType, ImageRun,
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
const TEXT_DARK = "111827";
const TEXT_MUTED = "64748b";

interface WordExportOptions {
  reportData: ReportData;
  reportTitle: string;
  reportId: string;
  withWatermark: boolean;
  logoUrl?: string | null;
  locale?: string;
  attachmentImages?: { url: string; filename: string; stepId?: string; storagePath?: string; mimeType?: string | null }[];
}

type FetchedImage = { buffer: Buffer; contentType?: string | null };

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

function textRun(text: string, options: { bold?: boolean; color?: string; size?: number; italics?: boolean; break?: number } = {}) {
  return new TextRun({
    text,
    bold: options.bold,
    color: options.color,
    size: options.size ?? 20,
    italics: options.italics,
    break: options.break,
  });
}

function sectionHeading(text: string) {
  return new Paragraph({
    spacing: { before: 280, after: 120 },
    children: [textRun(text, { size: 26, bold: true, color: BRAND_BLUE })],
  });
}

function labelValueParagraph(label: string, value: string, options: { compact?: boolean } = {}) {
  return new Paragraph({
    spacing: { before: options.compact ? 40 : 80, after: options.compact ? 40 : 80 },
    children: [
      textRun(`${label}: `, { bold: true, color: TEXT_MUTED, size: 20 }),
      textRun(value || "-", { color: TEXT_DARK, size: 20 }),
    ],
  });
}

function renderMetadataRows(rows: Array<[string, string]>) {
  return rows.map(([label, value]) => labelValueParagraph(label, value));
}

function renderFieldRows(rows: Array<[string, string]>) {
  return rows.map(([label, value]) => labelValueParagraph(label, value || "No relevant data"));
}

function renderAttachmentRows(attachments: Array<{ filename: string; stepId?: string; mimeType?: string | null }>) {
  return attachments.map((att) => new Paragraph({
    spacing: { before: 60, after: 60 },
    children: [
      textRun(`${att.stepId || "General"}: `, { bold: true, color: TEXT_MUTED, size: 19 }),
      textRun(att.filename, { color: TEXT_DARK, size: 19 }),
      textRun(` (${att.mimeType || "file"})`, { color: TEXT_MUTED, size: 18 }),
    ],
  }));
}

async function fetchImageBuffer(img: { url: string; storagePath?: string }): Promise<FetchedImage | null> {
  if (img.storagePath) {
    const object = await getR2ObjectBuffer(img.storagePath);
    if (object?.buffer) return object;
  }

  const key = getR2KeyFromPublicUrl(img.url);
  if (key) {
    const object = await getR2ObjectBuffer(key);
    if (object?.buffer) return object;
  }

  try {
    const res = await fetch(img.url);
    if (!res.ok) return null;
    return {
      buffer: Buffer.from(await res.arrayBuffer()),
      contentType: res.headers.get("content-type"),
    };
  } catch {
    return null;
  }
}

function getDocxImageType(mimeType?: string | null): "png" | "jpg" | null {
  if (mimeType === "image/jpeg" || mimeType === "image/jpg") return "jpg";
  if (mimeType === "image/png") return "png";
  return null;
}

function inferImageMimeType(url: string, mimeType?: string | null) {
  if (mimeType) return mimeType.split(";")[0]?.trim().toLowerCase() || null;
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.endsWith(".jpg") || lowerUrl.endsWith(".jpeg")) return "image/jpeg";
  if (lowerUrl.endsWith(".png")) return "image/png";
  if (lowerUrl.endsWith(".webp")) return "image/webp";
  return null;
}

export async function generateWordDocument(options: WordExportOptions): Promise<Buffer> {
  const { reportData, reportTitle, reportId, withWatermark, logoUrl, attachmentImages = [] } = options;
  const isZh = options.locale?.startsWith("zh");

  const children: Paragraph[] = [];

  // Cover page
  children.push(
    new Paragraph({
      spacing: { before: 2000 },
      children: [],
    })
  );

  if (logoUrl) {
    try {
      const logoImage = await fetchImageBuffer({ url: logoUrl });
      const logoType = getDocxImageType(inferImageMimeType(logoUrl, logoImage?.contentType));
      if (logoImage?.buffer && logoType) {
        children.push(
          new Paragraph({
            alignment: AlignmentType.LEFT,
            children: [new ImageRun({ type: logoType, data: logoImage.buffer, transformation: { width: 120, height: 60 } })],
          })
        );
      } else if (logoImage?.buffer) {
        children.push(
          new Paragraph({
            alignment: AlignmentType.LEFT,
            children: [new TextRun({ text: "Company logo is saved in a format Word export cannot embed yet. Please upload a PNG or JPG logo for Word export.", size: 16, color: "64748b", italics: true })],
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
  children.push(sectionHeading("Report Metadata"));
  children.push(...renderMetadataRows([
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
    children.push(sectionHeading("Attachment List"));
    children.push(...renderAttachmentRows(normalAttachments));
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
      children.push(...renderFieldRows(fieldRows));
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
        children.push(...renderFishboneRows(values));
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
        children.push(...render5WhyRows(values));
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
          const fetched = await fetchImageBuffer(img)
          const imageType = getDocxImageType(inferImageMimeType(img.url, fetched?.contentType || img.mimeType))
          if (!fetched?.buffer || !imageType) continue
          children.push(
            new Paragraph({
              spacing: { after: 50 },
              children: [new TextRun({ text: img.filename, size: 18, italics: true, color: "9ca3af" })],
            })
          )
          children.push(
            new Paragraph({
              children: [new ImageRun({ type: imageType, data: fetched.buffer, transformation: { width: 360, height: 270 } })],
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
      const fetched = await fetchImageBuffer({ url: row.url })
      const imageType = getDocxImageType(inferImageMimeType(row.url, fetched?.contentType))
      if (fetched?.buffer && imageType) {
        children.push(
          new Paragraph({
            spacing: { after: 120 },
            children: [new ImageRun({ type: imageType, data: fetched.buffer, transformation: { width: 160, height: 60 } })],
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
      properties: {
        page: {
          margin: { top: 720, right: 720, bottom: 720, left: 720 },
        },
      },
      children,
    }],
  });

  return Packer.toBuffer(doc);
}

function render5WhyRows(values: string[]) {
  return Array.from({ length: 5 }, (_, index) =>
    labelValueParagraph(`Why ${index + 1}`, values[index]?.trim() || "No relevant data")
  );
}

function renderFishboneRows(values: Array<{ label: string; value: string }>) {
  return values.map((item) => labelValueParagraph(item.label, item.value || "No relevant data"));
}
