export const REVIEW_SECTIONS = ["D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8", "SCAR"] as const;
export type ReviewSection = (typeof REVIEW_SECTIONS)[number];

export const REVIEW_STATUSES = [
  "not_suitable_to_submit",
  "high_risk",
  "submittable_with_risk",
] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export type ReviewSeverity = "critical" | "high" | "medium" | "low";
export type EvidenceStatus = "stated" | "missing" | "needs_confirmation";

export interface ReviewSource {
  type: "report_excerpt" | "missing_information" | "deterministic_rule";
  section: ReviewSection;
  excerpt?: string;
  ruleId: string;
}

export interface RejectionRiskFinding {
  id: string;
  section: ReviewSection;
  severity: ReviewSeverity;
  category:
    | "problem_definition"
    | "containment"
    | "root_cause"
    | "corrective_action"
    | "verification"
    | "prevention"
    | "evidence_gap"
    | "wording";
  title: string;
  explanation: string;
  evidenceStatus: EvidenceStatus;
  source: ReviewSource;
  factsNeeded: string[];
  likelyCustomerQuestion: string;
}

export interface ReviewSectionResult {
  section: ReviewSection;
  status: "no_material_issue_detected" | "risk_found" | "not_enough_information";
  findingIds: string[];
}

export interface RejectionRiskReview {
  schemaVersion: "rejection-risk-review-v1";
  status: ReviewStatus;
  topRejectionRisks: RejectionRiskFinding[];
  findings: RejectionRiskFinding[];
  sections: ReviewSectionResult[];
  missingInformationCategories: string[];
  evidencePolicy: {
    inventedFactsAllowed: false;
    sourceRequiredForEveryFinding: true;
  };
  disclaimer: string;
}

export interface CustomerReadableRewrite {
  section: ReviewSection;
  sourceExcerpt: string;
  suggestedEnglish: string;
  requiredPlaceholders: string[];
}

export interface ConciergeReviewDeliverable {
  schemaVersion: "concierge-review-delivery-v1";
  review: RejectionRiskReview;
  rewrites: CustomerReadableRewrite[];
  reviewerNotes: string;
  reviewerAttestation: "I verified that every claim and rewrite is grounded in the supplied report or marked as missing.";
  reviewedAt: string;
}

export interface FreeRejectionRiskPreview {
  schemaVersion: "rejection-risk-free-preview-v1";
  status: ReviewStatus;
  topRejectionRisks: Array<Pick<
    RejectionRiskFinding,
    "id" | "section" | "severity" | "category" | "title" | "explanation" | "evidenceStatus" | "source"
  >>;
  missingInformationCategories: string[];
  fullReviewExample: {
    includes: string[];
    redacted: true;
  };
  disclaimer: string;
}

export function toFreeRejectionRiskPreview(review: RejectionRiskReview): FreeRejectionRiskPreview {
  return {
    schemaVersion: "rejection-risk-free-preview-v1",
    status: review.status,
    topRejectionRisks: review.topRejectionRisks.slice(0, 3).map((finding) => ({
      id: finding.id,
      section: finding.section,
      severity: finding.severity,
      category: finding.category,
      title: finding.title,
      explanation: finding.explanation,
      evidenceStatus: finding.evidenceStatus,
      source: finding.source,
    })),
    missingInformationCategories: review.missingInformationCategories,
    fullReviewExample: {
      includes: [
        "D1-D8 or SCAR section-by-section findings",
        "Facts and evidence to add for each issue",
        "Likely customer follow-up questions",
        "Customer-readable English rewrite without invented facts",
        "Downloadable pre-submission review package",
      ],
      redacted: true,
    },
    disclaimer: review.disclaimer,
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function boundedString(value: unknown, max: number) {
  return typeof value === "string" && value.trim().length > 0 && value.length <= max;
}

function isFinding(value: unknown): value is RejectionRiskFinding {
  if (!isObject(value) || !REVIEW_SECTIONS.includes(value.section as ReviewSection)) return false;
  if (!["critical", "high", "medium", "low"].includes(String(value.severity))) return false;
  if (!["problem_definition", "containment", "root_cause", "corrective_action", "verification", "prevention", "evidence_gap", "wording"].includes(String(value.category))) return false;
  if (!["stated", "missing", "needs_confirmation"].includes(String(value.evidenceStatus))) return false;
  if (!boundedString(value.id, 120) || !boundedString(value.title, 500) || !boundedString(value.explanation, 4_000)) return false;
  if (!boundedString(value.likelyCustomerQuestion, 2_000) || !Array.isArray(value.factsNeeded)) return false;
  if (!value.factsNeeded.every((item) => boundedString(item, 1_000))) return false;
  if (!isObject(value.source) || !boundedString(value.source.ruleId, 120)) return false;
  if (!["report_excerpt", "missing_information", "deterministic_rule"].includes(String(value.source.type))) return false;
  if (!REVIEW_SECTIONS.includes(value.source.section as ReviewSection)) return false;
  if (value.source.excerpt !== undefined && typeof value.source.excerpt !== "string") return false;
  if (value.source.type === "report_excerpt" && !boundedString(value.source.excerpt, 4_000)) return false;
  return true;
}

function isReview(value: unknown): value is RejectionRiskReview {
  if (!isObject(value) || value.schemaVersion !== "rejection-risk-review-v1") return false;
  if (!REVIEW_STATUSES.includes(value.status as ReviewStatus)) return false;
  if (!Array.isArray(value.findings) || !value.findings.every(isFinding)) return false;
  if (!Array.isArray(value.topRejectionRisks) || !value.topRejectionRisks.every(isFinding)) return false;
  if (!Array.isArray(value.sections) || !value.sections.every((section) => (
    isObject(section)
    && REVIEW_SECTIONS.includes(section.section as ReviewSection)
    && ["no_material_issue_detected", "risk_found", "not_enough_information"].includes(String(section.status))
    && Array.isArray(section.findingIds)
    && section.findingIds.every((item) => boundedString(item, 120))
  ))) return false;
  if (!Array.isArray(value.missingInformationCategories)
    || !value.missingInformationCategories.every((item) => boundedString(item, 200))) return false;
  if (!isObject(value.evidencePolicy)) return false;
  if (value.evidencePolicy.inventedFactsAllowed !== false || value.evidencePolicy.sourceRequiredForEveryFinding !== true) return false;
  return boundedString(value.disclaimer, 4_000);
}

export function parseConciergeReviewDeliverable(value: unknown): ConciergeReviewDeliverable | null {
  if (!isObject(value) || value.schemaVersion !== "concierge-review-delivery-v1") return null;
  if (!isReview(value.review) || !Array.isArray(value.rewrites) || value.rewrites.length > 60) return null;
  const rewritesValid = value.rewrites.every((rewrite) => {
    if (!isObject(rewrite) || !REVIEW_SECTIONS.includes(rewrite.section as ReviewSection)) return false;
    if (!boundedString(rewrite.sourceExcerpt, 4_000) || !boundedString(rewrite.suggestedEnglish, 6_000)) return false;
    return Array.isArray(rewrite.requiredPlaceholders)
      && rewrite.requiredPlaceholders.every((item) => boundedString(item, 500));
  });
  if (!rewritesValid || typeof value.reviewerNotes !== "string" || value.reviewerNotes.length > 6_000) return null;
  if (value.reviewerAttestation !== "I verified that every claim and rewrite is grounded in the supplied report or marked as missing.") return null;
  if (typeof value.reviewedAt !== "string" || !Number.isFinite(Date.parse(value.reviewedAt))) return null;
  return value as unknown as ConciergeReviewDeliverable;
}
