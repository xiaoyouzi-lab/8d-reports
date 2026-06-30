export const SERVICE_REQUEST_TYPES = ["template_setup", "team_launch", "assisted_8d"] as const;

export const SERVICE_REQUEST_ALLOWED_EXTENSIONS = [
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".pdf",
  ".zip",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
] as const;

export const SERVICE_REQUEST_ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "application/zip",
  "application/x-zip-compressed",
  "multipart/x-zip",
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export const MAX_SERVICE_REQUEST_FILES = 5;
export const MAX_SERVICE_REQUEST_FILE_SIZE = 15 * 1024 * 1024;

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

export function isValidServiceContactEmail(email: string) {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isSupportedServiceRequestFile(file: { name: string; type?: string | null }) {
  const mimeType = (file.type || "").toLowerCase();
  const normalizedName = file.name.toLowerCase();
  return (
    SERVICE_REQUEST_ALLOWED_MIME_TYPES.includes(mimeType as typeof SERVICE_REQUEST_ALLOWED_MIME_TYPES[number]) ||
    SERVICE_REQUEST_ALLOWED_EXTENSIONS.some((extension) => normalizedName.endsWith(extension))
  );
}

export function normalizeServiceQuoteAmount(value: unknown) {
  if (value === undefined || value === null) return undefined;
  const raw = typeof value === "number" ? String(value) : typeof value === "string" ? value.trim() : "";
  if (!raw) return undefined;
  const normalized = raw.replace(/^\$/, "");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount < 0 || amount > 999999.99) return null;
  return amount.toFixed(2);
}

export function serviceRequestTypeLabel(type?: string | null) {
  if (type === "team_launch") return "Team Launch";
  if (type === "assisted_8d") return "Assisted First 8D / SCAR Delivery";
  return "Template Setup";
}

export function serviceRequestStatusLabel(status?: string | null) {
  return (status || "submitted")
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
