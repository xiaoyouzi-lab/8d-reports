import { jsPDF } from "jspdf"
import { STEPS, type ReportStep, type ReportField, type ReportData } from "@/lib/report-steps"

const PAGE_W = 210
const PAGE_H = 297
const MARGIN = 20
const CONTENT_W = PAGE_W - 2 * MARGIN
const LINE_H = 7
const FISHBONE_FIELD_NAMES = new Set([
  "fishboneMan",
  "fishboneMachine",
  "fishboneMaterial",
  "fishboneMethod",
  "fishboneMeasurement",
  "fishboneEnvironment",
])

interface PdfAttachment {
  url: string
  filename: string
  stepId?: string
  fileType?: string
  mimeType?: string | null
}

interface PdfExportOptions {
  reportData: ReportData
  reportTitle: string
  reportId: string
  withWatermark: boolean
  logoUrl?: string | null
  attachments?: PdfAttachment[]
  attachmentImages?: { url: string; filename: string; stepId?: string }[]
}

function resolveSelectLabel(fieldName: string, value: string): string {
  for (const step of STEPS) {
    for (const field of step.fields) {
      if (field.name === fieldName && field.type === "select" && field.options) {
        const option = field.options.find((o) => o.value === value)
        return option ? option.label : value
      }
    }
  }
  return value
}

function formatDateValue(value: string): string {
  if (!value) return ""
  try {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return value
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
  } catch { return value }
}

function formatDisplayValue(field: ReportField, value: string): string {
  if (!value) return "-"
  if (field.type === "select") return resolveSelectLabel(field.name, value)
  if (field.type === "date" || field.type === "datetime-local") return formatDateValue(value)
  if (field.type === "photo") return ""
  return value
}

function isImageAttachment(att: PdfAttachment) {
  return att.fileType === "photo" || (att.mimeType?.startsWith("image/") ?? false)
}

function needsCanvasText(text: string) {
  return /[\u3400-\u9fff\uf900-\ufaff]/.test(text)
}

function textColorToCss(color: number | string) {
  if (typeof color === "string") return color
  return `rgb(${color}, ${color}, ${color})`
}

function wrapCanvasText(ctx: CanvasRenderingContext2D, text: string, maxPx: number) {
  const lines: string[] = []
  for (const paragraph of text.split(/\r?\n/)) {
    let line = ""
    for (const char of paragraph) {
      const next = line + char
      if (line && ctx.measureText(next).width > maxPx) {
        lines.push(line)
        line = char
      } else {
        line = next
      }
    }
    lines.push(line || " ")
  }
  return lines
}

function renderTextImage(text: string, fontSize: number, maxWidthMm: number, color: string, bold = false) {
  const mmPerCssPx = 25.4 / 96
  const dpr = 2
  const widthCssPx = Math.max(1, Math.round(maxWidthMm / mmPerCssPx))
  const fontCssPx = Math.max(10, fontSize * 96 / 72)
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")
  if (!ctx) return null
  const font = `${bold ? "700" : "400"} ${fontCssPx}px Arial, "PingFang SC", "Microsoft YaHei", sans-serif`
  ctx.font = font
  const lines = wrapCanvasText(ctx, text, widthCssPx)
  const lineHeightCssPx = fontCssPx * 1.25
  const heightCssPx = Math.max(lineHeightCssPx, lines.length * lineHeightCssPx)
  canvas.width = Math.ceil(widthCssPx * dpr)
  canvas.height = Math.ceil(heightCssPx * dpr)
  const ctx2 = canvas.getContext("2d")
  if (!ctx2) return null
  ctx2.scale(dpr, dpr)
  ctx2.font = font
  ctx2.fillStyle = color
  ctx2.textBaseline = "top"
  lines.forEach((line, index) => ctx2.fillText(line, 0, index * lineHeightCssPx))
  return {
    dataUrl: canvas.toDataURL("image/png"),
    widthMm: maxWidthMm,
    heightMm: heightCssPx * mmPerCssPx,
  }
}

function drawText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  options: { maxWidth?: number; fontSize?: number; color?: number | string; bold?: boolean; align?: "left" | "center" } = {},
) {
  if (!needsCanvasText(text)) {
    const normalizedText = text.replace(/\u2014/g, "-")
    const textOptions = options.maxWidth
      ? { maxWidth: options.maxWidth, align: options.align }
      : { align: options.align }
    doc.text(normalizedText, x, y, textOptions)
    return 0
  }

  const fontSize = options.fontSize ?? doc.getFontSize()
  const maxWidth = options.maxWidth ?? CONTENT_W
  const image = renderTextImage(text, fontSize, maxWidth, textColorToCss(options.color ?? 30), options.bold)
  if (!image) {
    doc.text(text, x, y, options.maxWidth ? { maxWidth } : undefined)
    return 0
  }

  const drawX = options.align === "center" ? x - image.widthMm / 2 : x
  doc.addImage(image.dataUrl, "PNG", drawX, y - fontSize * 0.25, image.widthMm, image.heightMm, undefined, "FAST")
  return image.heightMm
}

function addWatermark(doc: jsPDF) {
  doc.saveGraphicsState()
  doc.setFontSize(60)
  doc.setTextColor(230, 230, 230)
  doc.setFont("helvetica", "bold")
  doc.text("SAMPLE - 8D Reports", PAGE_W / 2, PAGE_H / 2, { align: "center", angle: 45 })
  doc.restoreGraphicsState()
}

function drawPageBorder(doc: jsPDF) {
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.3)
  doc.rect(MARGIN - 2, MARGIN - 2, PAGE_W - 2 * MARGIN + 4, PAGE_H - 2 * MARGIN + 4)
}

function checkPageBreak(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > PAGE_H - MARGIN - 10) {
    doc.addPage()
    return MARGIN + 10
  }
  return y
}

function drawHeaderLine(doc: jsPDF, y: number) {
  doc.setDrawColor(79, 70, 229)
  doc.setLineWidth(0.5)
  doc.line(MARGIN, y, MARGIN + 60, y)
}

async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { credentials: "same-origin" })
    if (!res.ok) return null
    const blob = await res.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch { return null }
}

function getImageFormat(dataUrl: string): "JPEG" | "PNG" | "WEBP" {
  if (dataUrl.startsWith("data:image/png")) return "PNG"
  if (dataUrl.startsWith("data:image/webp")) return "WEBP"
  return "JPEG"
}

async function addCoverPage(doc: jsPDF, reportTitle: string, reportId: string, withWatermark: boolean, logoUrl?: string | null) {
  if (withWatermark) addWatermark(doc)
  drawPageBorder(doc)

  let y = MARGIN + 30
  if (logoUrl) {
    try {
      const b64 = await fetchImageAsBase64(logoUrl)
      if (b64) doc.addImage(b64, getImageFormat(b64), MARGIN, MARGIN + 10, 30, 15)
    } catch { /* ignore */ }
  }

  doc.setFont("helvetica", "bold")
  doc.setFontSize(32)
  doc.setTextColor(79, 70, 229)
  doc.text("8D REPORT", MARGIN, y)
  y += 20

  doc.setFontSize(16)
  doc.setTextColor(30, 30, 30)
  const titleHeight = drawText(doc, reportTitle, MARGIN, y, {
    maxWidth: CONTENT_W,
    fontSize: 16,
    color: 30,
    bold: true,
  })
  y += titleHeight > 0 ? Math.max(12, titleHeight) : 12

  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text(`Report ID: ${reportId}`, MARGIN, y)
  y += 8
  doc.text(`Date: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, MARGIN, y)
  y += 8

  if (withWatermark) {
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.setTextColor(200, 50, 50)
    doc.text("SAMPLE REPORT - DO NOT SUBMIT", MARGIN, y)
  }

  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.text("Generated by 8D Reports (https://8d-reports.com)", PAGE_W / 2, PAGE_H - MARGIN - 5, { align: "center" })
  doc.setTextColor(0, 0, 0)
}

async function addStepPage(
  doc: jsPDF,
  step: ReportStep,
  data: ReportData,
  withWatermark: boolean,
  stepAttachments: PdfAttachment[],
) {
  if (withWatermark) addWatermark(doc)
  drawPageBorder(doc)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(16)
  doc.setTextColor(79, 70, 229)
  const headerY = MARGIN + 10
  doc.text(step.label, MARGIN, headerY)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(120, 120, 120)
  drawText(doc, step.description, MARGIN, headerY + 6, { maxWidth: CONTENT_W, fontSize: 9, color: 120 })

  drawHeaderLine(doc, headerY + 12)

  doc.setTextColor(0, 0, 0)
  let y = headerY + 22
  const fiveWhyFields = step.fields.filter((f) => f.name.startsWith("why"))
  const fishboneFields = step.fields.filter((f) => FISHBONE_FIELD_NAMES.has(f.name))
  const otherFields = step.fields.filter((f) => !f.name.startsWith("why") && !FISHBONE_FIELD_NAMES.has(f.name))
  const labelX = MARGIN
  const valueX = MARGIN + 68
  const valueMaxW = CONTENT_W - 72

  for (const field of otherFields) {
    y = checkPageBreak(doc, y, 20)
    const rawValue = (data[field.name as keyof ReportData] ?? "") as string
    const displayValue = formatDisplayValue(field, rawValue)

    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    drawText(doc, field.label, labelX, y, { maxWidth: 62, fontSize: 8, color: 100, bold: true })

    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(30, 30, 30)

    if (field.type === "photo") {
      // Photos render in the attachment section.
    } else if (needsCanvasText(displayValue)) {
      const renderedHeight = drawText(doc, displayValue, valueX, y, { maxWidth: valueMaxW, fontSize: 9, color: 30 })
      y += Math.max(5, renderedHeight)
    } else if (field.type === "textarea" && displayValue !== "-") {
      const lines = doc.splitTextToSize(displayValue, valueMaxW)
      for (const line of lines) {
        y = checkPageBreak(doc, y, 7)
        doc.text(line, valueX, y)
        y += 5
      }
    } else {
      doc.text(displayValue, valueX, y, { maxWidth: valueMaxW })
    }

    y += LINE_H + 2
    doc.setDrawColor(230, 230, 230)
    doc.setLineWidth(0.2)
    doc.line(labelX, y - 2, PAGE_W - MARGIN, y - 2)
  }

  if (fishboneFields.length > 0) {
    y = checkPageBreak(doc, y, 18)
    y += 6
    doc.setFont("helvetica", "bold")
    doc.setFontSize(11)
    doc.setTextColor(79, 70, 229)
    doc.text("Fishbone / Ishikawa 6M Analysis", MARGIN, y)
    doc.setTextColor(0, 0, 0)
    y += 8

    for (const field of fishboneFields) {
      const rawValue = (data[field.name as keyof ReportData] ?? "") as string
      const displayValue = rawValue || "-"
      y = checkPageBreak(doc, y, 16)

      doc.setFont("helvetica", "bold")
      doc.setFontSize(8)
      doc.setTextColor(100, 100, 100)
      drawText(doc, field.label.replace("Fishbone 6M — ", ""), labelX, y, { maxWidth: 62, fontSize: 8, color: 100, bold: true })

      doc.setFont("helvetica", "normal")
      doc.setFontSize(9)
      doc.setTextColor(30, 30, 30)
      const renderedHeight = drawText(doc, displayValue, valueX, y, { maxWidth: valueMaxW, fontSize: 9, color: 30 })
      y += Math.max(8, renderedHeight + 2)
      doc.setDrawColor(225, 225, 225)
      doc.setLineWidth(0.15)
      doc.line(MARGIN, y - 2, PAGE_W - MARGIN, y - 2)
    }
  }

  if (fiveWhyFields.length > 0) {
    y = checkPageBreak(doc, y, 15)
    y += 6
    doc.setFont("helvetica", "bold")
    doc.setFontSize(11)
    doc.setTextColor(79, 70, 229)
    doc.text("5-Why Analysis", MARGIN, y)
    doc.setTextColor(0, 0, 0)
    y += 8

    for (let i = 0; i < fiveWhyFields.length; i++) {
      const field = fiveWhyFields[i]
      const rawValue = (data[field.name as keyof ReportData] ?? "") as string
      const displayValue = rawValue || "-"
      y = checkPageBreak(doc, y, 14)
      doc.setFont("helvetica", "bold")
      doc.setFontSize(9)
      doc.setTextColor(79, 70, 229)
      doc.text(`Why ${i + 1}`, MARGIN, y)
      doc.setFont("helvetica", "normal")
      doc.setFontSize(9)
      doc.setTextColor(30, 30, 30)
      const renderedHeight = drawText(doc, displayValue, MARGIN + 28, y, { maxWidth: CONTENT_W - 30, fontSize: 9, color: 30 })
      y += Math.max(8, renderedHeight + 2)
      doc.setDrawColor(225, 225, 225)
      doc.setLineWidth(0.15)
      doc.line(MARGIN, y - 2, PAGE_W - MARGIN, y - 2)
    }
  }

  const stepImages = stepAttachments.filter(isImageAttachment)
  const stepFiles = stepAttachments.filter((att) => !isImageAttachment(att))

  if (stepImages.length > 0 || stepFiles.length > 0) {
    y = checkPageBreak(doc, y, 20)
    y += 4
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.setTextColor(120, 120, 120)
    doc.text("Attachments:", MARGIN, y)
    y += 7
  }

  if (stepImages.length > 0) {
    const imgW = (CONTENT_W - 8) / 2
    const imgH = imgW * 0.75
    let col = 0
    for (const img of stepImages) {
      const b64 = await fetchImageAsBase64(img.url)
      if (!b64) continue
      const imgX = MARGIN + col * (imgW + 8)
      y = checkPageBreak(doc, y, imgH + 10)
      try {
        doc.addImage(b64, getImageFormat(b64), imgX, y, imgW, imgH, undefined, "FAST")
        doc.setFont("helvetica", "normal")
        doc.setFontSize(7)
        doc.setTextColor(150, 150, 150)
        drawText(doc, img.filename.length > 30 ? `${img.filename.substring(0, 28)}..` : img.filename, imgX, y + imgH + 4, {
          maxWidth: imgW,
          fontSize: 7,
          color: 150,
        })
        doc.setTextColor(0, 0, 0)
      } catch { /* skip broken image */ }
      col++
      if (col >= 2) {
        col = 0
        y += imgH + 12
      }
    }
    if (col !== 0) y += imgH + 12
  }

  if (stepFiles.length > 0) {
    for (const file of stepFiles) {
      y = checkPageBreak(doc, y, 10)
      doc.setFont("helvetica", "normal")
      doc.setFontSize(8)
      doc.setTextColor(80, 80, 80)
      const renderedHeight = drawText(doc, `Attachment: ${file.filename}`, MARGIN, y, {
        maxWidth: CONTENT_W,
        fontSize: 8,
        color: 80,
      })
      y += Math.max(6, renderedHeight + 1)
    }
  }
}

function addPageNumbers(doc: jsPDF) {
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(`Page ${i} of ${totalPages}`, PAGE_W / 2, PAGE_H - MARGIN + 8, { align: "center" })
    doc.setTextColor(0, 0, 0)
  }
}

export async function exportReportToPdf(options: PdfExportOptions): Promise<jsPDF> {
  const { reportData, reportTitle, reportId, withWatermark, logoUrl, attachments, attachmentImages = [] } = options
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const allAttachments = attachments ?? attachmentImages.map((img) => ({
    ...img,
    fileType: "photo",
    mimeType: "image/*",
  }))

  await addCoverPage(doc, reportTitle, reportId, withWatermark, logoUrl)

  for (const step of STEPS) {
    doc.addPage()
    const stepAttachments = allAttachments.filter((attachment) => attachment.stepId === step.id)
    await addStepPage(doc, step, reportData, withWatermark, stepAttachments)
  }

  addPageNumbers(doc)
  return doc
}
