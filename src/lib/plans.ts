export const FREE_REPORT_LIMIT = 3;

export const PLAN_KEYS = ["free", "pro", "team"] as const;
export type PlanKey = (typeof PLAN_KEYS)[number];

export const CHECKOUT_TYPES = ["pro_monthly", "team_monthly", "single_report_export"] as const;
export type CheckoutType = (typeof CHECKOUT_TYPES)[number];

export interface PlanEntitlements {
  plan: PlanKey;
  freeReportLimit: number;
  unlimitedReports: boolean;
  pdfWatermark: boolean;
  wordExport: boolean;
  companyLogo: boolean;
  editableShare: boolean;
  deepSearch: boolean;
  maxAttachmentSizeMb: number;
  maxAttachmentsPerReport: number;
  teamSeats: number;
}

export const PLAN_ENTITLEMENTS: Record<PlanKey, PlanEntitlements> = {
  free: {
    plan: "free",
    freeReportLimit: FREE_REPORT_LIMIT,
    unlimitedReports: false,
    pdfWatermark: true,
    wordExport: false,
    companyLogo: false,
    editableShare: false,
    deepSearch: false,
    maxAttachmentSizeMb: 5,
    maxAttachmentsPerReport: 10,
    teamSeats: 1,
  },
  pro: {
    plan: "pro",
    freeReportLimit: FREE_REPORT_LIMIT,
    unlimitedReports: true,
    pdfWatermark: false,
    wordExport: true,
    companyLogo: true,
    editableShare: true,
    deepSearch: true,
    maxAttachmentSizeMb: 10,
    maxAttachmentsPerReport: 30,
    teamSeats: 1,
  },
  team: {
    plan: "team",
    freeReportLimit: FREE_REPORT_LIMIT,
    unlimitedReports: true,
    pdfWatermark: false,
    wordExport: true,
    companyLogo: true,
    editableShare: true,
    deepSearch: true,
    maxAttachmentSizeMb: 10,
    maxAttachmentsPerReport: 30,
    teamSeats: 5,
  },
};

export function isPlanKey(value: unknown): value is PlanKey {
  return typeof value === "string" && (PLAN_KEYS as readonly string[]).includes(value);
}

export function isCheckoutType(value: unknown): value is CheckoutType {
  return typeof value === "string" && (CHECKOUT_TYPES as readonly string[]).includes(value);
}

export function getPlanFromName(name?: string | null): PlanKey {
  const normalized = (name || "").toLowerCase();
  if (normalized.includes("team")) return "team";
  if (normalized.includes("pro")) return "pro";
  return "free";
}

export function getPlanProductEnvKey(type: CheckoutType) {
  switch (type) {
    case "pro_monthly":
      return ["CREEM_PRODUCT_PRO_MONTHLY", "CREEM_PRODUCT_MONTHLY"];
    case "team_monthly":
      return ["CREEM_PRODUCT_TEAM_MONTHLY"];
    case "single_report_export":
      return ["CREEM_PRODUCT_SINGLE_REPORT_EXPORT"];
  }
}

export function getConfiguredProductId(type: CheckoutType) {
  for (const key of getPlanProductEnvKey(type)) {
    const value = process.env[key];
    if (value) return value;
  }
  return null;
}

export function getCheckoutLabel(type: CheckoutType) {
  switch (type) {
    case "pro_monthly":
      return "Pro monthly";
    case "team_monthly":
      return "Team monthly";
    case "single_report_export":
      return "Single report export";
  }
}
