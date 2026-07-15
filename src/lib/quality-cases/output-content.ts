import type { ReportData } from "@/lib/report-steps";

export type QualityCaseOutputLanguageMode = "en" | "bilingual";

type TranslationPayload = {
  language?: unknown;
  text?: unknown;
};

export type QualityCaseTextForOutput = {
  fieldPath?: unknown;
  original?: TranslationPayload | null;
  aiTranslation?: TranslationPayload | null;
  confirmedTranslation?: TranslationPayload | null;
};

type OutputField = {
  fieldPath: string;
  reportField: keyof ReportData;
  requiredForEnglish?: boolean;
  customerLabel: string;
};

export const QUALITY_CASE_OUTPUT_FIELDS: readonly OutputField[] = [
  { fieldPath: "complaint_summary", reportField: "problemDescription", requiredForEnglish: true, customerLabel: "Complaint summary" },
  { fieldPath: "containment", reportField: "containmentDescription", customerLabel: "Containment" },
  { fieldPath: "root_cause", reportField: "confirmedRootCause", customerLabel: "Confirmed root cause" },
  { fieldPath: "corrective_action", reportField: "selectedCorrectiveAction", customerLabel: "Corrective action" },
  { fieldPath: "implementation_plan", reportField: "implementationPlan", customerLabel: "Implementation plan" },
  { fieldPath: "effectiveness_verification", reportField: "validationMethod", customerLabel: "Effectiveness verification" },
  { fieldPath: "preventive_action", reportField: "systemChanges", customerLabel: "Preventive action" },
  { fieldPath: "lessons_learned", reportField: "lessonsLearned", customerLabel: "Lessons learned" },
];

function safeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function renderConfirmedText(input: {
  languageMode: QualityCaseOutputLanguageMode;
  original: string;
  confirmed: string;
}) {
  if (input.languageMode === "en") return input.confirmed;
  return `原文 / Original:\n${input.original}\n\nEnglish (human-confirmed):\n${input.confirmed}`;
}

/**
 * Produces only explicit, human-confirmed English content for a legacy 8D
 * output. AI drafts are deliberately ignored. Optional field mappings are
 * left blank until a user has provided both source and confirmed English.
 */
export function buildEightDOutputContent(input: {
  languageMode: QualityCaseOutputLanguageMode;
  caseComplaint: unknown;
  translations: readonly QualityCaseTextForOutput[];
}): { ok: true; value: Partial<ReportData> } | { ok: false; error: string } {
  const translationByPath = new Map(
    input.translations
      .filter((row) => typeof row.fieldPath === "string")
      .map((row) => [row.fieldPath as string, row]),
  );
  const output: Partial<ReportData> = {};

  for (const field of QUALITY_CASE_OUTPUT_FIELDS) {
    const translation = translationByPath.get(field.fieldPath);
    const original =
      safeText(translation?.original?.text) ||
      (field.fieldPath === "complaint_summary"
        ? safeText(input.caseComplaint)
        : "");
    const confirmed =
      translation?.confirmedTranslation?.language === "en"
        ? safeText(translation.confirmedTranslation.text)
        : "";
    if (field.requiredForEnglish && !confirmed) {
      return {
        ok: false,
        error:
          "Confirm the English complaint summary before creating an English or bilingual 8D output. AI draft text cannot be exported.",
      };
    }
    if (!confirmed) continue;
    if (input.languageMode === "bilingual" && !original) {
      return {
        ok: false,
        error: `Save the original text for ${field.fieldPath} before creating a bilingual 8D output.`,
      };
    }
    output[field.reportField] = renderConfirmedText({
      languageMode: input.languageMode,
      original,
      confirmed,
    });
  }
  return { ok: true, value: output };
}

/**
 * Produces the exact English content that may be shown to a customer task.
 * Supplier free-form text, original Chinese, and AI drafts are deliberately
 * excluded: a customer review link is not a shortcut around human approval.
 */
export function buildCustomerAuthorizedResponse(input: {
  translations: readonly QualityCaseTextForOutput[];
}):
  | {
      ok: true;
      value: {
        text: string;
        fieldPaths: string[];
        complaintSummary: string;
        sections: Array<{ fieldPath: string; label: string; text: string }>;
      };
    }
  | { ok: false; error: string } {
  const translationByPath = new Map(
    input.translations
      .filter((row) => typeof row.fieldPath === "string")
      .map((row) => [row.fieldPath as string, row]),
  );
  const sections: string[] = [];
  const structuredSections: Array<{
    fieldPath: string;
    label: string;
    text: string;
  }> = [];
  const fieldPaths: string[] = [];

  for (const field of QUALITY_CASE_OUTPUT_FIELDS) {
    const confirmed = translationByPath.get(field.fieldPath)?.confirmedTranslation;
    const text = confirmed?.language === "en" ? safeText(confirmed.text) : "";
    if (field.requiredForEnglish && !text) {
      return {
        ok: false,
        error:
          "Confirm the English complaint summary before sending a customer review link. AI draft text and supplier free-form text cannot be shared with the customer.",
      };
    }
    if (!text) continue;
    sections.push(`${field.customerLabel}\n${text}`);
    structuredSections.push({
      fieldPath: field.fieldPath,
      label: field.customerLabel,
      text,
    });
    fieldPaths.push(field.fieldPath);
  }

  return {
    ok: true,
    value: {
      text: sections.join("\n\n"),
      fieldPaths,
      complaintSummary: sections[0].replace(/^Complaint summary\n/, ""),
      sections: structuredSections,
    },
  };
}

/** @deprecated Use buildEightDOutputContent for all output fields. */
export function selectComplaintForEightDOutput(input: {
  languageMode: QualityCaseOutputLanguageMode;
  caseComplaint: unknown;
  translation: QualityCaseTextForOutput | null;
}) {
  const result = buildEightDOutputContent({
    languageMode: input.languageMode,
    caseComplaint: input.caseComplaint,
    translations: input.translation
      ? [{ ...input.translation, fieldPath: "complaint_summary" }]
      : [],
  });
  if (!result.ok) return result;
  return { ok: true as const, value: result.value.problemDescription || "" };
}
