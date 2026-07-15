import { sendEmail } from "@/lib/email";

export type QualityCaseInvitationType = "supplier_response" | "customer_review";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function isValidInvitationEmail(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length <= 320 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  );
}

export function buildQualityCaseInvitation(input: {
  type: QualityCaseInvitationType;
  participantName: string;
  participantOrganization: string;
  link: string;
  expiresAt: Date;
}) {
  const safeName = escapeHtml(input.participantName);
  const safeOrganization = escapeHtml(input.participantOrganization);
  const safeLink = escapeHtml(input.link);
  const expiry = input.expiresAt.toISOString();
  if (input.type === "supplier_response") {
    return {
      subject: "质量整改调查邀请 / Quality investigation request",
      text: [
        `${input.participantName}，您好：`,
        "",
        `${input.participantOrganization} 收到一项质量整改调查任务。AI质量助手将用中文逐步引导，无需了解8D术语。`,
        `开始调查：${input.link}`,
        `链接有效期至：${expiry}`,
        "",
        "此链接仅授权当前质量问题，请勿转发。",
      ].join("\n"),
      html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827"><h1 style="font-size:20px">质量整改调查邀请</h1><p>${safeName}，您好：</p><p>${safeOrganization} 收到一项质量整改调查任务。AI质量助手将用中文逐步引导，无需了解8D术语。</p><p><a href="${safeLink}">开始调查</a></p><p>链接有效期至：${escapeHtml(expiry)}</p><p style="color:#6b7280">此链接仅授权当前质量问题，请勿转发。</p></div>`,
    };
  }
  return {
    subject: "Supplier Corrective Action Response — Review Requested",
    text: [
      `Hello ${input.participantName},`,
      "",
      `${input.participantOrganization} has invited you to review a supplier corrective action response.`,
      `Review response: ${input.link}`,
      `This secure link expires at: ${expiry}`,
      "",
      "The link is limited to this Quality Case. Please do not forward it.",
    ].join("\n"),
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827"><h1 style="font-size:20px">Supplier Corrective Action Response</h1><p>Hello ${safeName},</p><p>${safeOrganization} has invited you to review a supplier corrective action response.</p><p><a href="${safeLink}">Review response</a></p><p>This secure link expires at: ${escapeHtml(expiry)}</p><p style="color:#6b7280">The link is limited to this Quality Case. Please do not forward it.</p></div>`,
  };
}

export async function sendQualityCaseInvitation(input: {
  taskId: string;
  type: QualityCaseInvitationType;
  to: string;
  participantName: string;
  participantOrganization: string;
  link: string;
  expiresAt: Date;
}) {
  const content = buildQualityCaseInvitation(input);
  return sendEmail({
    to: input.to,
    ...content,
    purpose: `quality-case-invitation:${input.type}`,
    allowLocalFallback: false,
    idempotencyKey: `quality-case-invitation-${input.taskId}`,
  });
}
