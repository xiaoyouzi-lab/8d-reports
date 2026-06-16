import JSZip from "jszip";
import { STEPS, type ReportData } from "@/lib/report-steps";

interface XlsxAttachment {
  filename: string;
  fileType: string;
  mimeType?: string | null;
  stepId?: string | null;
  fileSize?: number | null;
  createdAt?: Date | string | null;
}

interface XlsxExportOptions {
  reportData: ReportData;
  reportTitle: string;
  reportId: string;
  status?: string | null;
  workflowStatus?: string | null;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
  attachments?: XlsxAttachment[];
}

type CellValue = string | number | boolean | Date | null | undefined;
type Sheet = {
  name: string;
  rows: CellValue[][];
  widths: number[];
  noteRows?: number[];
};

const ACTION_FIELDS: Array<{ category: string; fields: Array<keyof ReportData> }> = [
  {
    category: "Containment",
    fields: [
      "containmentDescription",
      "containmentScope",
      "containmentResponsible",
      "containmentDueDate",
      "containmentValidUntil",
      "containmentVerification",
    ],
  },
  {
    category: "Root Cause",
    fields: [
      "rootCauseOccurrence",
      "rootCauseEscape",
      "rootCauseSystem",
      "why1",
      "why2",
      "why3",
      "why4",
      "why5",
      "confirmedRootCause",
    ],
  },
  {
    category: "Corrective Action",
    fields: [
      "selectedCorrectiveAction",
      "correctiveRationale",
      "costEstimate",
      "correctiveResponsible",
      "correctiveTargetDate",
      "implementationPlan",
      "completionDate",
    ],
  },
  {
    category: "Verification / Validation",
    fields: ["testingPlan", "testingResults", "validationMethod", "validationResults"],
  },
  {
    category: "Prevention",
    fields: ["systemChanges", "processUpdates", "horizontalDeployment", "trainingNeeds", "lessonsLearned"],
  },
  {
    category: "Closure / Approval",
    fields: ["closureDate", "teamAcknowledgment", "preparedBy", "preparedDate", "reviewedBy", "reviewedDate", "approverName", "approverDate"],
  },
];

const FIELD_LABELS = new Map<string, string>(
  STEPS.flatMap((step) => step.fields.map((field) => [field.name, field.label] as const)),
);

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function safeSheetName(value: string) {
  return value.replace(/[\[\]:*?/\\]/g, " ").slice(0, 31);
}

function formatDate(value?: Date | string | null) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toISOString().replace("T", " ").slice(0, 19);
}

function formatFileSize(size?: number | null) {
  if (!size) return "";
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function displayValue(value: CellValue) {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return formatDate(value);
  return String(value);
}

function fieldLabel(fieldName: keyof ReportData | string) {
  return FIELD_LABELS.get(String(fieldName)) || String(fieldName);
}

function fieldValue(data: ReportData, fieldName: keyof ReportData) {
  return String(data[fieldName] || "").trim();
}

function columnName(index: number) {
  let name = "";
  let current = index + 1;
  while (current > 0) {
    const remainder = (current - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    current = Math.floor((current - 1) / 26);
  }
  return name;
}

function cellStyle(rowIndex: number, noteRows?: number[]) {
  if (rowIndex === 0) return 1;
  if (noteRows?.includes(rowIndex)) return 3;
  return 2;
}

function rowHeight(row: CellValue[]) {
  const longest = Math.max(...row.map((value) => displayValue(value).length));
  if (longest > 240) return 86;
  if (longest > 140) return 64;
  if (longest > 80) return 44;
  return 22;
}

function cellXml(value: CellValue, rowIndex: number, columnIndex: number, styleId: number) {
  const address = `${columnName(columnIndex)}${rowIndex + 1}`;
  const text = escapeXml(displayValue(value));
  return `<c r="${address}" t="inlineStr" s="${styleId}"><is><t xml:space="preserve">${text}</t></is></c>`;
}

function sheetXml(sheet: Sheet) {
  const cols = sheet.widths
    .map((width, index) => `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`)
    .join("");
  const rows = sheet.rows
    .map((row, rowIndex) => {
      const styleId = cellStyle(rowIndex, sheet.noteRows);
      const cells = row.map((value, columnIndex) => cellXml(value, rowIndex, columnIndex, styleId)).join("");
      const height = rowHeight(row);
      return `<row r="${rowIndex + 1}" ht="${height}" customHeight="1">${cells}</row>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
  <sheetFormatPr defaultRowHeight="22"/>
  <cols>${cols}</cols>
  <sheetData>${rows}</sheetData>
  <pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3"/>
</worksheet>`;
}

function workbookXml(sheets: Sheet[]) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    ${sheets.map((sheet, index) => `<sheet name="${escapeXml(safeSheetName(sheet.name))}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`).join("")}
  </sheets>
</workbook>`;
}

function workbookRelsXml(sheets: Sheet[]) {
  const sheetRels = sheets
    .map((_, index) => `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`)
    .join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${sheetRels}
  <Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;
}

function contentTypesXml(sheets: Sheet[]) {
  const sheetOverrides = sheets
    .map((_, index) => `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`)
    .join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
  ${sheetOverrides}
</Types>`;
}

function stylesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="3">
    <font><sz val="11"/><color theme="1"/><name val="Calibri"/><family val="2"/></font>
    <font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/><family val="2"/></font>
    <font><i/><sz val="10"/><color rgb="FF475569"/><name val="Calibri"/><family val="2"/></font>
  </fonts>
  <fills count="4">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF1D4ED8"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFEFF6FF"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border><left style="thin"><color rgb="FFE2E8F0"/></left><right style="thin"><color rgb="FFE2E8F0"/></right><top style="thin"><color rgb="FFE2E8F0"/></top><bottom style="thin"><color rgb="FFE2E8F0"/></bottom><diagonal/></border>
  </borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="4">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"><alignment vertical="top" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="2" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment vertical="top" wrapText="1"/></xf>
  </cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;
}

function rootRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;
}

function coreXml(reportTitle: string) {
  const now = new Date().toISOString();
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>${escapeXml(reportTitle)}</dc:title>
  <dc:creator>8D Reports</dc:creator>
  <cp:lastModifiedBy>8D Reports</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified>
</cp:coreProperties>`;
}

function appXml(sheetNames: string[]) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>8D Reports</Application>
  <DocSecurity>0</DocSecurity>
  <ScaleCrop>false</ScaleCrop>
  <HeadingPairs><vt:vector size="2" baseType="variant"><vt:variant><vt:lpstr>Worksheets</vt:lpstr></vt:variant><vt:variant><vt:i4>${sheetNames.length}</vt:i4></vt:variant></vt:vector></HeadingPairs>
  <TitlesOfParts><vt:vector size="${sheetNames.length}" baseType="lpstr">${sheetNames.map((name) => `<vt:lpstr>${escapeXml(name)}</vt:lpstr>`).join("")}</vt:vector></TitlesOfParts>
</Properties>`;
}

function summarySheet(options: XlsxExportOptions): Sheet {
  const { reportData, reportTitle, reportId, status, workflowStatus, createdAt, updatedAt } = options;
  return {
    name: "Summary",
    widths: [28, 80],
    rows: [
      ["8D Corrective Action Report", reportTitle],
      ["Generated by", "8d-reports.com"],
      ["Report Metadata", ""],
      ["Field", "Value"],
      ["Report Title", reportTitle],
      ["Report ID", reportId],
      ["Report Number", reportData.reportNumber || reportId],
      ["Report Type", reportData.reportType],
      ["Priority", reportData.priority],
      ["Status", status || ""],
      ["Workflow Status", workflowStatus || ""],
      ["Created", formatDate(createdAt)],
      ["Updated", formatDate(updatedAt)],
      ["Problem Source", reportData.problemSource],
      ["Customer / Supplier", reportData.customerName],
      ["Product / Part", reportData.productName],
      ["Batch / Lot", reportData.batchNumber],
      ["Defect Quantity", reportData.defectQuantity],
      ["Total Quantity", reportData.totalQuantity],
    ],
  };
}

function reportSheet(reportData: ReportData): Sheet {
  const rows: CellValue[][] = [["Step", "Section", "Field", "Value"]];
  for (const step of STEPS) {
    for (const field of step.fields) {
      const value = fieldValue(reportData, field.name as keyof ReportData);
      rows.push([step.id, step.label, field.label, value]);
    }
  }
  return {
    name: "D0-D8 Report",
    widths: [12, 26, 34, 90],
    rows,
  };
}

function actionsSheet(reportData: ReportData): Sheet {
  const rows: CellValue[][] = [["Category", "Field", "Value"]];
  for (const group of ACTION_FIELDS) {
    for (const field of group.fields) {
      rows.push([group.category, fieldLabel(field), fieldValue(reportData, field)]);
    }
  }
  return {
    name: "Actions",
    widths: [28, 36, 90],
    rows,
  };
}

function evidenceSheet(attachments: XlsxAttachment[] = []): Sheet {
  const rows: CellValue[][] = [
    ["Step", "Filename", "Type", "MIME Type", "Size", "Uploaded"],
    ["Note", "Attachment files are included in the ZIP attachments folder when exported with attachments.", "", "", "", ""],
  ];
  for (const attachment of attachments) {
    rows.push([
      attachment.stepId || "General",
      attachment.filename,
      attachment.fileType,
      attachment.mimeType || "",
      formatFileSize(attachment.fileSize),
      formatDate(attachment.createdAt),
    ]);
  }
  if (attachments.length === 0) rows.push(["", "No attachments recorded", "", "", "", ""]);
  return {
    name: "Evidence",
    widths: [16, 64, 20, 36, 16, 26],
    rows,
    noteRows: [1],
  };
}

export async function generateExcelWorkbook(options: XlsxExportOptions): Promise<Buffer> {
  const sheets = [
    summarySheet(options),
    reportSheet(options.reportData),
    actionsSheet(options.reportData),
    evidenceSheet(options.attachments),
  ];

  const zip = new JSZip();
  zip.file("[Content_Types].xml", contentTypesXml(sheets));
  zip.file("_rels/.rels", rootRelsXml());
  zip.file("docProps/core.xml", coreXml(options.reportTitle));
  zip.file("docProps/app.xml", appXml(sheets.map((sheet) => sheet.name)));
  zip.file("xl/workbook.xml", workbookXml(sheets));
  zip.file("xl/_rels/workbook.xml.rels", workbookRelsXml(sheets));
  zip.file("xl/styles.xml", stylesXml());
  sheets.forEach((sheet, index) => {
    zip.file(`xl/worksheets/sheet${index + 1}.xml`, sheetXml(sheet));
  });

  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}
