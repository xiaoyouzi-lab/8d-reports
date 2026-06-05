export const SERVICE_REQUEST_TYPES = ["template_setup", "team_launch"] as const;

export const SERVICE_REQUEST_STATUSES = [
  "submitted",
  "under_review",
  "quote_sent",
  "in_progress",
  "ready_for_review",
  "delivered",
  "cancelled",
] as const;

export type ServiceRequestType = (typeof SERVICE_REQUEST_TYPES)[number];
export type ServiceRequestStatus = (typeof SERVICE_REQUEST_STATUSES)[number];

export function isServiceRequestType(value: unknown): value is ServiceRequestType {
  return typeof value === "string" && (SERVICE_REQUEST_TYPES as readonly string[]).includes(value);
}

export function isServiceRequestStatus(value: unknown): value is ServiceRequestStatus {
  return typeof value === "string" && (SERVICE_REQUEST_STATUSES as readonly string[]).includes(value);
}

export function isServiceAdmin(email?: string | null) {
  const admins = (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return Boolean(email && admins.includes(email.toLowerCase()));
}

export function serviceRequestTypeLabel(type?: string | null) {
  return type === "team_launch" ? "Team Launch" : "Template Setup";
}

export function serviceRequestStatusLabel(status?: string | null) {
  return (status || "submitted")
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
