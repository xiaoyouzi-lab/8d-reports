export const funnelEventNames = [
  "sign_up",
  "create_report",
  "export_pdf",
  "export_word",
  "export_excel",
  "checkout_started",
  "checkout_completed",
] as const;

export type FunnelEventName = (typeof funnelEventNames)[number];

export const observedEventAliases: Record<FunnelEventName, readonly string[]> = {
  sign_up: ["signup_success"],
  create_report: ["report_created"],
  export_pdf: ["export_clicked", "export_succeeded"],
  export_word: ["export_clicked", "export_succeeded"],
  export_excel: ["export_clicked", "export_succeeded"],
  checkout_started: [],
  checkout_completed: [],
};

const exportEventByFormat: Record<string, FunnelEventName> = {
  pdf: "export_pdf",
  docx: "export_word",
  xlsx: "export_excel",
};

export function getGa4EventName(
  internalEventName: string,
  metadata: Record<string, unknown>,
) {
  if (internalEventName === "signup_success") return "sign_up";
  if (internalEventName === "report_created") return "create_report";

  if (internalEventName === "export_clicked") {
    const format = typeof metadata.format === "string" ? metadata.format : "";
    return exportEventByFormat[format] || internalEventName;
  }

  return internalEventName;
}
