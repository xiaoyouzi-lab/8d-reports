import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getSessionUser } from "@/lib/api-helpers";
import { db } from "@/lib/db";
import { analyticsEvents } from "@/lib/db/schema";

const ALLOWED_EVENTS = new Set([
  "signup_success",
  "login_success",
  "report_created",
  "report_saved",
  "step_changed",
  "attachment_uploaded",
  "export_clicked",
  "export_succeeded",
  "watermark_exported",
  "quota_limit_seen",
  "word_export_gate_clicked",
  "excel_export_gate_clicked",
  "logo_upload_gate_clicked",
  "deep_search_gate_clicked",
  "ai_draft_interest_clicked",
  "ai_report_review_clicked",
  "ai_draft_generate_clicked",
  "ai_draft_applied",
  "upgrade_clicked",
  "checkout_started",
  "checkout_completed",
  "app_navigation_clicked",
  "dashboard_feature_entry_clicked",
  "dashboard_search_used",
  "search_result_clicked",
  "search_no_results",
  "search_to_report_opened_rate",
  "share_link_created",
  "seo_page_view",
  "seo_cta_click",
  "seo_template_click",
  "seo_signup_click",
  "demo_report_viewed",
  "team_demo_feedback_submitted",
  "marketing_cta_clicked",
  "sample_download",
  "resource_opened",
  "resource_filter_used",
  "pricing_plan_clicked",
  "docs_topic_opened",
  "faq_opened",
  "content_step_opened",
  "knowledge_search_used",
  "knowledge_no_results",
  "knowledge_result_opened",
  "knowledge_filter_used",
  "knowledge_root_cause_copied",
  "knowledge_corrective_action_copied",
  "knowledge_lesson_copied",
  "knowledge_reuse_panel_opened",
  "knowledge_reuse_search_used",
  "knowledge_reuse_result_opened",
  "knowledge_reuse_root_cause_copied",
  "knowledge_reuse_corrective_action_copied",
  "knowledge_reuse_lesson_copied",
  "knowledge_readiness_viewed",
  "knowledge_readiness_warning_shown",
]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function inferDeviceType(userAgent: string | null): string {
  if (!userAgent) return "desktop";
  return /Mobile|Android|iPhone|iPad/i.test(userAgent) ? "mobile" : "desktop";
}

function normalizePlan(value: unknown) {
  return value === "pro" || value === "team" ? value : "free";
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  const body = await req.json().catch(() => ({}));
  const eventName = typeof body.eventName === "string" ? body.eventName : "";

  if (!ALLOWED_EVENTS.has(eventName)) {
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  }

  const headerStore = await headers();
  const metadata = isPlainObject(body.metadata) ? body.metadata : {};
  const reportId = typeof body.reportId === "string" && body.reportId.length > 0
    ? body.reportId
    : null;

  try {
    await db.insert(analyticsEvents).values({
      eventName,
      userId: user?.id ?? null,
      reportId,
      plan: normalizePlan(body.plan),
      locale: typeof body.locale === "string" ? body.locale : "en",
      deviceType: inferDeviceType(headerStore.get("user-agent")),
      path: typeof body.path === "string" ? body.path : null,
      metadata,
    });
  } catch (err) {
    console.warn("analytics event dropped", err);
  }

  return NextResponse.json({ success: true });
}
