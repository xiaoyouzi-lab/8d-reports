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

export interface FreeRejectionRiskPreview {
  schemaVersion: "rejection-risk-free-preview-v1";
  status: ReviewStatus;
  topRejectionRisks: RejectionRiskFinding[];
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
    topRejectionRisks: review.topRejectionRisks.slice(0, 3),
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
