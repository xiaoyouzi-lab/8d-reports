import JSZip from "jszip";

export const REJECTION_REVIEW_MAX_FILE_BYTES = 5 * 1024 * 1024;
export const REJECTION_REVIEW_MAX_TEXT_CHARS = 60_000;
export const REJECTION_REVIEW_MIN_VISIBLE_CHARS = 80;

export class RejectionReviewInputError extends Error {
  constructor(
    public readonly code:
      | "file_too_large"
      | "unsupported_file_type"
      | "invalid_docx"
      | "extracted_text_too_large"
      | "input_too_long"
      | "input_too_short",
    message: string,
  ) {
    super(message);
    this.name = "RejectionReviewInputError";
  }
}

function decodeXmlEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_match, decimal: string) => String.fromCodePoint(Number(decimal)))
    .replace(/&#x([0-9a-f]+);/gi, (_match, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)));
}

export function normalizeReviewText(value: string) {
  const normalized = value
    .replace(/\u0000/g, "")
    .replace(/\r\n?/g, "\n")
    .replace(/[\t ]+\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
  if (normalized.length > REJECTION_REVIEW_MAX_TEXT_CHARS) {
    throw new RejectionReviewInputError(
      "input_too_long",
      `Use no more than ${REJECTION_REVIEW_MAX_TEXT_CHARS.toLocaleString()} characters.`,
    );
  }
  if (normalized.replace(/\s+/g, "").length < REJECTION_REVIEW_MIN_VISIBLE_CHARS) {
    throw new RejectionReviewInputError(
      "input_too_short",
      "Add more of the report before running the rejection check.",
    );
  }
  return normalized;
}

export async function extractTextFromDocx(buffer: ArrayBuffer) {
  if (buffer.byteLength > REJECTION_REVIEW_MAX_FILE_BYTES) {
    throw new RejectionReviewInputError("file_too_large", "DOCX files must be 5 MB or smaller.");
  }
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(buffer, { checkCRC32: true });
  } catch {
    throw new RejectionReviewInputError("invalid_docx", "The DOCX file could not be read.");
  }
  const documentXml = zip.file("word/document.xml");
  if (!documentXml) {
    throw new RejectionReviewInputError("invalid_docx", "The file is not a valid DOCX document.");
  }
  const xml = await documentXml.async("string");
  if (xml.length > REJECTION_REVIEW_MAX_TEXT_CHARS * 20) {
    throw new RejectionReviewInputError("extracted_text_too_large", "The DOCX document is too large to review safely.");
  }
  const text = decodeXmlEntities(
    xml
      .replace(/<w:tab\b[^>]*\/>/gi, "\t")
      .replace(/<w:(?:br|cr)\b[^>]*\/>/gi, "\n")
      .replace(/<\/w:p>/gi, "\n")
      .replace(/<[^>]+>/g, ""),
  );
  return normalizeReviewText(text);
}

function safeFilename(value: string) {
  return value
    .replace(/[\\/\u0000-\u001f\u007f]/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160) || "review.docx";
}

export async function extractReviewSubmission(input: {
  pastedText?: unknown;
  file?: unknown;
}) {
  if (input.file instanceof File && input.file.size > 0) {
    if (input.file.size > REJECTION_REVIEW_MAX_FILE_BYTES) {
      throw new RejectionReviewInputError("file_too_large", "Files must be 5 MB or smaller.");
    }
    const filename = safeFilename(input.file.name);
    const lower = filename.toLowerCase();
    if (lower.endsWith(".docx")) {
      return {
        sourceType: "docx" as const,
        sourceFilename: filename,
        text: await extractTextFromDocx(await input.file.arrayBuffer()),
      };
    }
    if (lower.endsWith(".txt") || input.file.type === "text/plain") {
      return {
        sourceType: "txt" as const,
        sourceFilename: filename,
        text: normalizeReviewText(await input.file.text()),
      };
    }
    throw new RejectionReviewInputError(
      "unsupported_file_type",
      "Use pasted text, TXT, or DOCX. PDF is not enabled until extraction reliability is validated.",
    );
  }
  return {
    sourceType: "paste" as const,
    sourceFilename: null,
    text: normalizeReviewText(typeof input.pastedText === "string" ? input.pastedText : ""),
  };
}
