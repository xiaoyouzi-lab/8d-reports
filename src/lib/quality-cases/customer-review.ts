export const CUSTOMER_REVIEW_SCHEMA_VERSION = "customer-review-v1" as const;

export type CustomerReviewSectionGroup =
  | "problem_summary"
  | "containment"
  | "root_cause_investigation"
  | "corrective_action"
  | "verification"
  | "prevention";

export type CustomerReviewSection = {
  fieldPath: string;
  group: CustomerReviewSectionGroup;
  label: string;
  text: string;
  sourceType: "human_confirmation" | "confirmed_translation";
  sourceConfirmationId: string | null;
};

export type CustomerReviewEvidence = {
  id: string;
  filename: string;
  mimeType: string | null;
  fileSize: number | null;
  createdAt: string;
};

export type CustomerReviewSnapshot = {
  schemaVersion: typeof CUSTOMER_REVIEW_SCHEMA_VERSION;
  caseVersion: number;
  product: string;
  supplier: { name: string; organization: string | null };
  submissionDate: string | null;
  issueSummary: string;
  sections: CustomerReviewSection[];
  evidence: CustomerReviewEvidence[];
  fieldPaths: string[];
  text: string;
  createdAt: string;
};

export type CustomerFieldComment = {
  fieldPath: string;
  comment: string;
};

export type CustomerFeedback = {
  id: string;
  taskId: string;
  caseVersion: number;
  customer: {
    participantId: string | null;
    name: string;
    organization: string | null;
  };
  submittedAt: string;
  fieldComments: CustomerFieldComment[];
};

type ConfirmedMappingInput = {
  mappingId: string;
  decision: string;
  confirmationId: string | null;
  sourceType: "human_confirmation" | "ai_suggestion";
  semanticKey: string;
  confirmedText: string;
  language: string;
  approvedEvidenceIds: string[];
};

type LegacySectionInput = {
  fieldPath: string;
  label: string;
  text: string;
};

type EvidenceInput = CustomerReviewEvidence;

const SECTION_DEFINITIONS: Record<
  string,
  { group: CustomerReviewSectionGroup; label: string }
> = {
  complaint_summary: { group: "problem_summary", label: "Problem Summary" },
  containment: { group: "containment", label: "Containment" },
  root_cause: {
    group: "root_cause_investigation",
    label: "Root Cause Investigation",
  },
  occurrence_analysis: {
    group: "root_cause_investigation",
    label: "Why the Issue Occurred",
  },
  escape_analysis: {
    group: "root_cause_investigation",
    label: "Why It Was Not Detected",
  },
  corrective_action: {
    group: "corrective_action",
    label: "Corrective Action",
  },
  implementation_plan: {
    group: "corrective_action",
    label: "Implementation Plan",
  },
  effectiveness_verification: {
    group: "verification",
    label: "Verification",
  },
  preventive_action: { group: "prevention", label: "Prevention" },
  lessons_learned: { group: "prevention", label: "Lessons Learned" },
};

const SECTION_ORDER = Object.keys(SECTION_DEFINITIONS);
const LEGACY_LABELS: Record<string, string> = {
  complaint_summary: "Complaint summary",
  containment: "Containment",
  root_cause: "Confirmed root cause",
  corrective_action: "Corrective action",
  implementation_plan: "Implementation plan",
  effectiveness_verification: "Effectiveness verification",
  preventive_action: "Preventive action",
  lessons_learned: "Lessons learned",
};

function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function safeText(value: unknown, maximum = 12000) {
  return typeof value === "string"
    ? value
        .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, " ")
        .trim()
        .slice(0, maximum)
    : "";
}

function safeStrings(value: unknown, maximum = 50) {
  return Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === "string")
        .map((item) => safeText(item, 200))
        .filter(Boolean)
        .slice(0, maximum)
    : [];
}

function normalizedSection(input: {
  fieldPath: unknown;
  text: unknown;
  sourceType: CustomerReviewSection["sourceType"];
  sourceConfirmationId?: unknown;
  label?: unknown;
}): CustomerReviewSection | null {
  const fieldPath = safeText(input.fieldPath, 120);
  const definition = SECTION_DEFINITIONS[fieldPath];
  const text = safeText(input.text);
  if (!definition || !text) return null;
  return {
    fieldPath,
    group: definition.group,
    label: safeText(input.label, 180) || definition.label,
    text,
    sourceType: input.sourceType,
    sourceConfirmationId:
      typeof input.sourceConfirmationId === "string"
        ? input.sourceConfirmationId
        : null,
  };
}

/**
 * Builds the immutable customer authorization snapshot. It accepts only
 * explicit human-confirmed English content and never reads AI interpretations,
 * supplier scratch answers, or internal review findings.
 */
export function buildCustomerReviewSnapshot(input: {
  caseVersion: number;
  product: unknown;
  supplier: { name?: unknown; organization?: unknown } | null;
  submissionDate: Date | string | null;
  legacySections: readonly LegacySectionInput[];
  mappings: readonly ConfirmedMappingInput[];
  evidence: readonly EvidenceInput[];
  now?: Date;
}):
  | { ok: true; value: CustomerReviewSnapshot }
  | { ok: false; error: string } {
  const sectionsByPath = new Map<string, CustomerReviewSection>();
  for (const section of input.legacySections) {
    const normalized = normalizedSection({
      ...section,
      sourceType: "confirmed_translation",
    });
    if (normalized) sectionsByPath.set(normalized.fieldPath, normalized);
  }

  const approvedEvidenceIds = new Set<string>();
  for (const mapping of input.mappings) {
    if (
      mapping.decision !== "confirmed" ||
      mapping.sourceType !== "human_confirmation" ||
      !mapping.confirmationId ||
      mapping.language !== "en"
    )
      continue;
    const normalized = normalizedSection({
      fieldPath: mapping.semanticKey,
      text: mapping.confirmedText,
      sourceType: "human_confirmation",
      sourceConfirmationId: mapping.confirmationId,
    });
    if (!normalized) continue;
    sectionsByPath.set(normalized.fieldPath, normalized);
    for (const evidenceId of mapping.approvedEvidenceIds) {
      if (typeof evidenceId === "string" && evidenceId.trim())
        approvedEvidenceIds.add(evidenceId);
    }
  }

  const sections = [...sectionsByPath.values()].sort(
    (left, right) =>
      SECTION_ORDER.indexOf(left.fieldPath) -
      SECTION_ORDER.indexOf(right.fieldPath),
  );
  const problemSummary = sections.find(
    (section) => section.fieldPath === "complaint_summary",
  );
  if (!problemSummary) {
    return {
      ok: false,
      error:
        "Confirm an English problem summary before creating a customer review link.",
    };
  }
  const evidence = input.evidence.filter((file) =>
    approvedEvidenceIds.has(file.id),
  );
  const supplierName = safeText(input.supplier?.name, 180) || "Supplier";
  const supplierOrganization = safeText(input.supplier?.organization, 180);
  const parsedSubmissionDate = input.submissionDate
    ? new Date(input.submissionDate)
    : null;
  const submissionDate =
    parsedSubmissionDate && !Number.isNaN(parsedSubmissionDate.getTime())
      ? parsedSubmissionDate.toISOString()
      : null;
  return {
    ok: true,
    value: {
      schemaVersion: CUSTOMER_REVIEW_SCHEMA_VERSION,
      caseVersion: Math.max(1, Math.trunc(input.caseVersion)),
      product: safeText(input.product, 300) || "No relevant data",
      supplier: {
        name: supplierName,
        organization: supplierOrganization || null,
      },
      submissionDate,
      issueSummary: problemSummary.text,
      sections,
      evidence,
      fieldPaths: sections.map((section) => section.fieldPath),
      text: sections
        .map((section) => `${section.label}\n${section.text}`)
        .join("\n\n"),
      createdAt: (input.now || new Date()).toISOString(),
    },
  };
}

function legacySections(value: Record<string, unknown>) {
  const text = safeText(value.text);
  const fieldPaths = safeStrings(value.fieldPaths);
  if (!text || !fieldPaths.length) return [];
  const chunks = text.split(/\n\n+/);
  return fieldPaths.flatMap((fieldPath) => {
    const definition = SECTION_DEFINITIONS[fieldPath];
    if (!definition) return [];
    const legacyLabel = LEGACY_LABELS[fieldPath] || definition.label;
    const chunk = chunks.find(
      (candidate) =>
        candidate.startsWith(`${definition.label}\n`) ||
        candidate.startsWith(`${legacyLabel}\n`),
    );
    const sectionText = chunk ? chunk.slice(chunk.indexOf("\n") + 1) : "";
    const normalized = normalizedSection({
      fieldPath,
      text: sectionText,
      sourceType: "confirmed_translation",
    });
    return normalized ? [normalized] : [];
  });
}

/** Backward-compatible, allowlist-only parser for task authorization JSON. */
export function parseCustomerReviewSnapshot(
  value: unknown,
): CustomerReviewSnapshot | null {
  const snapshot = record(value);
  if (snapshot.schemaVersion === CUSTOMER_REVIEW_SCHEMA_VERSION) {
    const sections = Array.isArray(snapshot.sections)
      ? snapshot.sections.flatMap((item) => {
          const section = record(item);
          const normalized = normalizedSection({
            fieldPath: section.fieldPath,
            text: section.text,
            sourceType:
              section.sourceType === "human_confirmation"
                ? "human_confirmation"
                : "confirmed_translation",
            sourceConfirmationId: section.sourceConfirmationId,
          });
          return normalized ? [normalized] : [];
        })
      : [];
    const issueSummary = sections.find(
      (section) => section.fieldPath === "complaint_summary",
    );
    if (!issueSummary) return null;
    const evidence = Array.isArray(snapshot.evidence)
      ? snapshot.evidence.flatMap((item) => {
          const file = record(item);
          const id = safeText(file.id, 180);
          const filename = safeText(file.filename, 300);
          if (!id || !filename) return [];
          return [
            {
              id,
              filename,
              mimeType: safeText(file.mimeType, 180) || null,
              fileSize:
                typeof file.fileSize === "number" && file.fileSize >= 0
                  ? file.fileSize
                  : null,
              createdAt: safeText(file.createdAt, 100),
            },
          ];
        })
      : [];
    return {
      schemaVersion: CUSTOMER_REVIEW_SCHEMA_VERSION,
      caseVersion:
        typeof snapshot.caseVersion === "number"
          ? Math.max(1, Math.trunc(snapshot.caseVersion))
          : 1,
      product: safeText(snapshot.product, 300) || "No relevant data",
      supplier: {
        name: safeText(record(snapshot.supplier).name, 180) || "Supplier",
        organization:
          safeText(record(snapshot.supplier).organization, 180) || null,
      },
      submissionDate: safeText(snapshot.submissionDate, 100) || null,
      issueSummary: issueSummary.text,
      sections,
      evidence,
      fieldPaths: sections.map((section) => section.fieldPath),
      text: sections
        .map((section) => `${section.label}\n${section.text}`)
        .join("\n\n"),
      createdAt: safeText(snapshot.createdAt, 100),
    };
  }

  const sections = legacySections(snapshot);
  const problemSummary = sections.find(
    (section) => section.fieldPath === "complaint_summary",
  );
  if (!problemSummary) return null;
  return {
    schemaVersion: CUSTOMER_REVIEW_SCHEMA_VERSION,
    caseVersion: 1,
    product: "No relevant data",
    supplier: { name: "Supplier", organization: null },
    submissionDate: null,
    issueSummary: problemSummary.text,
    sections,
    evidence: [],
    fieldPaths: sections.map((section) => section.fieldPath),
    text: sections
      .map((section) => `${section.label}\n${section.text}`)
      .join("\n\n"),
    createdAt: "",
  };
}

export function normalizeCustomerFieldComments(
  value: unknown,
  authorizedFieldPaths: readonly string[],
): CustomerFieldComment[] {
  if (!Array.isArray(value)) return [];
  const allowed = new Set(authorizedFieldPaths);
  const comments = new Map<string, string>();
  for (const item of value.slice(0, 50)) {
    const candidate = record(item);
    const fieldPath = safeText(candidate.fieldPath, 120);
    const comment = safeText(candidate.comment, 2000);
    if (allowed.has(fieldPath) && comment) comments.set(fieldPath, comment);
  }
  return [...comments].map(([fieldPath, comment]) => ({ fieldPath, comment }));
}
