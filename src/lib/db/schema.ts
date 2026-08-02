import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  numeric,
  boolean,
  jsonb,
  serial,
  index,
  uniqueIndex,
  check,
  cidr,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  name: text("name").notNull(),
  image: text("image"),
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  idToken: text("id_token"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const verifications = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const plans = pgTable("plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  creemProductId: text("creem_product_id").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  priceMonthly: numeric("price_monthly", { precision: 10, scale: 2 }),
  priceYearly: numeric("price_yearly", { precision: 10, scale: 2 }),
  reportsPerMonth: integer("reports_per_month").default(-1),
  maxTeamMembers: integer("max_team_members").default(1),
  features: jsonb("features").default("[]"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  planId: uuid("plan_id").references(() => plans.id),
  creemSubscriptionId: text("creem_subscription_id").unique(),
  creemCustomerId: text("creem_customer_id"),
  status: text("status").notNull().default("trialing"),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  reportsUsedThisPeriod: integer("reports_used_this_period").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const teamWorkspaces = pgTable("team_workspaces", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerId: text("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  maxSeats: integer("max_seats").default(5),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_team_workspaces_owner_id").on(table.ownerId),
]);

export const teamMembers = pgTable("team_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  teamId: uuid("team_id").notNull().references(() => teamWorkspaces.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("member"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_team_members_team_id").on(table.teamId),
  index("idx_team_members_user_id").on(table.userId),
]);

export const templates = pgTable("templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  creatorId: text("creator_id").references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(),
  category: text("category"),
  structure: jsonb("structure").notNull(),
  settings: jsonb("settings").default("{}"),
  isDefault: boolean("is_default").default(false),
  isPublic: boolean("is_public").default(false),
  usageCount: integer("usage_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const reports = pgTable("reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  templateId: uuid("template_id").references(() => templates.id),
  title: text("title").notNull(),
  status: text("status").notNull().default("draft"),
  workflowStatus: text("workflow_status").notNull().default("draft"),
  revision: integer("revision").notNull().default(0),
  lockedAt: timestamp("locked_at"),
  lockedBy: text("locked_by").references(() => users.id, { onDelete: "set null" }),
  reportType: text("report_type").notNull().default("customer_8d"),
  priority: text("priority").notNull().default("medium"),
  source: text("source"),
  data: jsonb("data").notNull().default("{}"),
  stepStatus: jsonb("step_status").default("{}"),
  metadata: jsonb("metadata").default("{}"),
  reportNumber: serial("report_number"),
  hasConsumedQuota: boolean("has_consumed_quota").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_reports_user_id").on(table.userId),
  index("idx_reports_status").on(table.status),
  index("idx_reports_created_at").on(table.createdAt.desc()),
]);

export const reportPurchases = pgTable("report_purchases", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  reportId: uuid("report_id").notNull().references(() => reports.id, { onDelete: "cascade" }),
  creemCheckoutId: text("creem_checkout_id").unique(),
  creemProductId: text("creem_product_id"),
  status: text("status").notNull().default("active"),
  purchaseType: text("purchase_type").notNull().default("single_report_export"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_report_purchases_user_report").on(table.userId, table.reportId),
]);

export const attachments = pgTable("attachments", {
  id: uuid("id").defaultRandom().primaryKey(),
  reportId: uuid("report_id").notNull().references(() => reports.id, { onDelete: "cascade" }),
  stepId: text("step_id"),
  storagePath: text("storage_path").notNull(),
  url: text("url").notNull(),
  filename: text("filename").notNull(),
  fileType: text("file_type").notNull(),
  mimeType: text("mime_type"),
  fileSize: integer("file_size"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_attachments_report_id").on(table.reportId),
]);

export const reportShares = pgTable("report_shares", {
  id: uuid("id").defaultRandom().primaryKey(),
  reportId: uuid("report_id").notNull().references(() => reports.id, { onDelete: "cascade" }),
  sharedBy: text("shared_by").references(() => users.id),
  permissionLevel: text("permission_level").notNull().default("view"),
  accessToken: text("access_token").unique(),
  expiresAt: timestamp("expires_at"),
  views: integer("views").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userQuotas = pgTable("user_quotas", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  totalQuota: integer("total_quota").default(3),
  usedQuota: integer("used_quota").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const reportEditHistory = pgTable("report_edit_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  reportId: uuid("report_id").notNull().references(() => reports.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  saveCount: integer("save_count").default(0),
  completedSteps: text("completed_steps").array(),
  hasAttachments: boolean("has_attachments").default(false),
  hasExportedPdf: boolean("has_exported_pdf").default(false),
  fieldCompletionRate: numeric("field_completion_rate", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const reportActivities = pgTable("report_activities", {
  id: uuid("id").defaultRandom().primaryKey(),
  reportId: uuid("report_id").notNull().references(() => reports.id, { onDelete: "cascade" }),
  actorId: text("actor_id").references(() => users.id, { onDelete: "set null" }),
  actorName: text("actor_name"),
  actionType: text("action_type").notNull(),
  entityType: text("entity_type").notNull().default("report"),
  entityId: text("entity_id"),
  fieldName: text("field_name"),
  oldValuePreview: text("old_value_preview"),
  newValuePreview: text("new_value_preview"),
  metadata: jsonb("metadata").default("{}"),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_report_activities_report_id").on(table.reportId),
  index("idx_report_activities_created_at").on(table.createdAt.desc()),
]);

export const registrationRateLimits = pgTable("registration_rate_limits", {
  ipAddress: cidr("ip_address").primaryKey(),
  registrations24h: integer("registrations_24h").default(0),
  firstRegistrationAt: timestamp("first_registration_at"),
  blockedUntil: timestamp("blocked_until"),
});

export const blockedEmailDomains = pgTable("blocked_email_domains", {
  id: uuid("id").defaultRandom().primaryKey(),
  domain: text("domain").notNull().unique(),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const feedback = pgTable("feedback", {
  id: uuid("id").defaultRandom().primaryKey(),
  rating: integer("rating").default(0),
  text: text("text").default(""),
  email: text("email"),
  locale: text("locale").default("en"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const analyticsEvents = pgTable("analytics_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventName: text("event_name").notNull(),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  reportId: uuid("report_id").references(() => reports.id, { onDelete: "set null" }),
  plan: text("plan").default("free"),
  locale: text("locale").default("en"),
  deviceType: text("device_type").default("desktop"),
  path: text("path"),
  metadata: jsonb("metadata").default("{}"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_analytics_events_name").on(table.eventName),
  index("idx_analytics_events_user_id").on(table.userId),
  index("idx_analytics_events_created_at").on(table.createdAt.desc()),
]);

export const aiTasks = pgTable("ai_tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  reportId: uuid("report_id").references(() => reports.id, { onDelete: "set null" }),
  taskType: text("task_type").notNull(),
  inputSummary: text("input_summary"),
  output: jsonb("output").default("{}"),
  status: text("status").notNull().default("completed"),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_ai_tasks_user_id").on(table.userId),
  index("idx_ai_tasks_report_id").on(table.reportId),
  index("idx_ai_tasks_type").on(table.taskType),
]);

export const rejectionReviewTasks = pgTable("rejection_review_tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  tokenHash: text("token_hash").notNull().unique(),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  anonymousSessionHash: text("anonymous_session_hash").notNull(),
  trafficSource: text("traffic_source").notNull().default("direct"),
  sourceType: text("source_type").notNull(),
  sourceFilename: text("source_filename"),
  inputText: text("input_text").notNull(),
  inputHash: text("input_hash").notNull(),
  status: text("status").notNull().default("free_ready"),
  freeResultJson: jsonb("free_result_json").notNull(),
  fullResultJson: jsonb("full_result_json").notNull(),
  deliveryResultJson: jsonb("delivery_result_json"),
  aiPolicyOutcome: text("ai_policy_outcome").notNull().default("rules_only"),
  analysisFailureCode: text("analysis_failure_code"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_rejection_review_tasks_session_created").on(table.anonymousSessionHash, table.createdAt.desc()),
  index("idx_rejection_review_tasks_user_created").on(table.userId, table.createdAt.desc()),
  index("idx_rejection_review_tasks_expires_at").on(table.expiresAt),
  check("chk_rejection_review_tasks_source_type", sql`${table.sourceType} in ('paste', 'txt', 'docx')`),
  check("chk_rejection_review_tasks_status", sql`${table.status} in ('free_ready', 'full_ready', 'analysis_failed')`),
]);

export const rejectionReviewOrders = pgTable("rejection_review_orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  taskId: uuid("task_id").notNull().references(() => rejectionReviewTasks.id, { onDelete: "restrict" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  providerRequestId: text("provider_request_id").notNull().unique(),
  providerCheckoutId: text("provider_checkout_id").unique(),
  providerOrderId: text("provider_order_id").unique(),
  providerTransactionId: text("provider_transaction_id").unique(),
  providerProductId: text("provider_product_id"),
  priceVariant: text("price_variant").notNull().default("deep_review"),
  providerMode: text("provider_mode").notNull().default("test"),
  checkoutUrl: text("checkout_url"),
  status: text("status").notNull().default("pending"),
  customerKind: text("customer_kind").notNull().default("unknown"),
  expectedAmountCents: integer("expected_amount_cents").notNull().default(9900),
  paidAmountCents: integer("paid_amount_cents").notNull().default(0),
  refundedAmountCents: integer("refunded_amount_cents").notNull().default(0),
  currency: text("currency").notNull().default("USD"),
  failureType: text("failure_type"),
  qualificationStatus: text("qualification_status").notNull().default("unverified"),
  qualificationReason: text("qualification_reason"),
  deliverableReadyAt: timestamp("deliverable_ready_at"),
  fullResultViewedAt: timestamp("full_result_viewed_at"),
  exportedAt: timestamp("exported_at"),
  paidAt: timestamp("paid_at"),
  revokedAt: timestamp("revoked_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_rejection_review_orders_task_created").on(table.taskId, table.createdAt.desc()),
  index("idx_rejection_review_orders_status_created").on(table.status, table.createdAt.desc()),
  uniqueIndex("uq_rejection_review_orders_active_task").on(table.taskId)
    .where(sql`${table.status} in ('pending', 'processing', 'paid')`),
  check("chk_rejection_review_orders_status", sql`${table.status} in ('pending', 'processing', 'paid', 'failed', 'cancelled', 'refunded', 'disputed')`),
  check("chk_rejection_review_orders_provider_mode", sql`${table.providerMode} in ('test', 'production')`),
  check("chk_rejection_review_orders_price_variant", sql`${table.priceVariant} in ('instant_scan', 'deep_review')`),
  check("chk_rejection_review_orders_customer_kind", sql`${table.customerKind} in ('unknown', 'owner', 'test', 'external')`),
  check("chk_rejection_review_orders_qualification_status", sql`${table.qualificationStatus} in ('unverified', 'qualified', 'excluded_owner', 'excluded_test', 'excluded_friend', 'excluded_refund', 'excluded_dispute', 'excluded_incomplete_delivery')`),
  check("chk_rejection_review_orders_currency", sql`${table.currency} = 'USD'`),
  check("chk_rejection_review_orders_amounts", sql`${table.expectedAmountCents} >= 0 and ${table.paidAmountCents} >= 0 and ${table.refundedAmountCents} >= 0`),
]);

export const rejectionReviewEntitlements = pgTable("rejection_review_entitlements", {
  id: uuid("id").defaultRandom().primaryKey(),
  taskId: uuid("task_id").notNull().references(() => rejectionReviewTasks.id, { onDelete: "cascade" }).unique(),
  orderId: uuid("order_id").notNull().references(() => rejectionReviewOrders.id, { onDelete: "restrict" }).unique(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  status: text("status").notNull().default("pending"),
  grantedAt: timestamp("granted_at").defaultNow().notNull(),
  revokedAt: timestamp("revoked_at"),
  revokeReason: text("revoke_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_rejection_review_entitlements_user_status").on(table.userId, table.status),
  check("chk_rejection_review_entitlements_status", sql`${table.status} in ('pending', 'active', 'revoked')`),
]);

export const rejectionReviewRevocations = pgTable("rejection_review_revocations", {
  id: uuid("id").defaultRandom().primaryKey(),
  providerEventId: text("provider_event_id").notNull().unique(),
  kind: text("kind").notNull(),
  providerObjectId: text("provider_object_id").notNull(),
  providerTransactionId: text("provider_transaction_id").notNull(),
  providerOrderId: text("provider_order_id"),
  providerRequestId: text("provider_request_id"),
  providerProductId: text("provider_product_id"),
  amountCents: integer("amount_cents"),
  currency: text("currency"),
  reason: text("reason"),
  matchedOrderId: uuid("matched_order_id").references(() => rejectionReviewOrders.id, { onDelete: "set null" }),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_rejection_review_revocations_transaction").on(table.providerTransactionId),
  index("idx_rejection_review_revocations_order").on(table.providerOrderId),
  index("idx_rejection_review_revocations_request").on(table.providerRequestId),
  index("idx_rejection_review_revocations_pending").on(table.processedAt),
  check("chk_rejection_review_revocations_kind", sql`${table.kind} in ('refund', 'dispute')`),
]);

export const rejectionReviewFunnelEvents = pgTable("rejection_review_funnel_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventName: text("event_name").notNull(),
  anonymousSessionHash: text("anonymous_session_hash").notNull(),
  actorKind: text("actor_kind").notNull().default("anonymous"),
  trafficSource: text("traffic_source").notNull().default("direct"),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  taskId: uuid("task_id").references(() => rejectionReviewTasks.id, { onDelete: "set null" }),
  orderId: uuid("order_id").references(() => rejectionReviewOrders.id, { onDelete: "set null" }),
  failureType: text("failure_type"),
  durationMs: integer("duration_ms"),
  metadata: jsonb("metadata").notNull().default("{}"),
  dedupeKey: text("dedupe_key").unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_rejection_review_funnel_event_created").on(table.eventName, table.createdAt.desc()),
  index("idx_rejection_review_funnel_actor_created").on(table.actorKind, table.createdAt.desc()),
  index("idx_rejection_review_funnel_session_created").on(table.anonymousSessionHash, table.createdAt),
  check("chk_rejection_review_funnel_actor_kind", sql`${table.actorKind} in ('anonymous', 'unknown', 'owner', 'test', 'external')`),
  check("chk_rejection_review_funnel_event_name", sql`${table.eventName} in ('qualified_landing_view', 'review_upload_started', 'review_upload_completed', 'review_free_result_viewed', 'review_checkout_started', 'review_purchase_completed', 'review_full_result_viewed', 'review_delivered', 'review_refund_requested', 'review_repeat_purchase')`),
]);

export const p0PlusPreviews = pgTable("p0_plus_previews", {
  id: uuid("id").defaultRandom().primaryKey(),
  tokenHash: text("token_hash").notNull().unique(),
  boundedRawInput: text("bounded_raw_input").notNull(),
  outputLanguage: text("output_language").notNull().default("en"),
  previewPayloadJson: jsonb("preview_payload_json").notNull(),
  clientIpHash: text("client_ip_hash").notNull(),
  browserTokenHash: text("browser_token_hash"),
  expiresAt: timestamp("expires_at").notNull(),
  convertedReportId: uuid("converted_report_id").references(() => reports.id, { onDelete: "set null" }),
  convertedCaseId: uuid("converted_case_id").references(() => qualityCases.id, { onDelete: "set null" }),
  conversionClaimToken: text("conversion_claim_token"),
  conversionClaimedAt: timestamp("conversion_claimed_at"),
  conversionClaimExpiresAt: timestamp("conversion_claim_expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_p0_plus_previews_token_hash").on(table.tokenHash),
  index("idx_p0_plus_previews_expires_at").on(table.expiresAt),
  index("idx_p0_plus_previews_client_ip_hash").on(table.clientIpHash),
  index("idx_p0_plus_previews_conversion_claim_expires_at").on(table.conversionClaimExpiresAt),
  index("idx_p0_plus_previews_converted_case_id").on(table.convertedCaseId),
]);

/**
 * Quality Cases are intentionally independent from legacy reports. A case can
 * later reference one or more report outputs without changing historical 8D
 * records or their access/export semantics.
 */
export const qualityCases = pgTable("quality_cases", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerId: text("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  workspaceId: uuid("workspace_id").references(() => teamWorkspaces.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  status: text("status").notNull().default("draft"),
  outputType: text("output_type").notNull().default("8d"),
  priority: text("priority").notNull().default("medium"),
  waitingOn: text("waiting_on").notNull().default("internal"),
  nextAction: text("next_action").notNull().default("Prepare the case before assigning a supplier task."),
  assigneeUserId: text("assignee_user_id").references(() => users.id, { onDelete: "set null" }),
  dueAt: timestamp("due_at"),
  currentVersion: integer("current_version").notNull().default(1),
  caseData: jsonb("case_data").notNull().default("{}"),
  closedAt: timestamp("closed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_quality_cases_owner_id").on(table.ownerId),
  index("idx_quality_cases_workspace_id").on(table.workspaceId),
  index("idx_quality_cases_status_due_at").on(table.status, table.dueAt),
  index("idx_quality_cases_assignee_user_id").on(table.assigneeUserId),
  index("idx_quality_cases_updated_at").on(table.updatedAt.desc()),
]);

export const qualityCaseParticipants = pgTable("quality_case_participants", {
  id: uuid("id").defaultRandom().primaryKey(),
  caseId: uuid("case_id").notNull().references(() => qualityCases.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  role: text("role").notNull(),
  displayName: text("display_name").notNull(),
  email: text("email"),
  organizationName: text("organization_name"),
  isInternal: boolean("is_internal").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_quality_case_participants_case_id").on(table.caseId),
  index("idx_quality_case_participants_user_id").on(table.userId),
]);

export const qualityCaseOutputs = pgTable("quality_case_outputs", {
  id: uuid("id").defaultRandom().primaryKey(),
  caseId: uuid("case_id").notNull().references(() => qualityCases.id, { onDelete: "cascade" }),
  reportId: uuid("report_id").references(() => reports.id, { onDelete: "set null" }),
  outputType: text("output_type").notNull(),
  languageMode: text("language_mode").notNull().default("en"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_quality_case_outputs_case_id").on(table.caseId),
  index("idx_quality_case_outputs_report_id").on(table.reportId),
]);

export const qualityCaseVersions = pgTable("quality_case_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  caseId: uuid("case_id").notNull().references(() => qualityCases.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  snapshot: jsonb("snapshot").notNull(),
  createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_quality_case_versions_case_version").on(table.caseId, table.version),
]);

export const qualityCaseActivities = pgTable("quality_case_activities", {
  id: uuid("id").defaultRandom().primaryKey(),
  caseId: uuid("case_id").notNull().references(() => qualityCases.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  actionType: text("action_type").notNull(),
  actorId: text("actor_id").references(() => users.id, { onDelete: "set null" }),
  actorRole: text("actor_role").notNull(),
  actorOrganization: text("actor_organization"),
  comment: text("comment"),
  requestedFieldIds: jsonb("requested_field_ids").notNull().default("[]"),
  dueAt: timestamp("due_at"),
  diff: jsonb("diff").notNull().default("{}"),
  evidenceIds: jsonb("evidence_ids").notNull().default("[]"),
  metadata: jsonb("metadata").notNull().default("{}"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_quality_case_activities_case_created_at").on(table.caseId, table.createdAt.desc()),
  index("idx_quality_case_activities_actor_id").on(table.actorId),
]);

export const qualityCaseTaskLinks = pgTable("quality_case_task_links", {
  id: uuid("id").defaultRandom().primaryKey(),
  caseId: uuid("case_id").notNull().references(() => qualityCases.id, { onDelete: "cascade" }),
  participantId: uuid("participant_id").references(() => qualityCaseParticipants.id, { onDelete: "set null" }),
  taskType: text("task_type").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  allowedSections: jsonb("allowed_sections").notNull().default("[]"),
  authorizedResponse: jsonb("authorized_response"),
  expiresAt: timestamp("expires_at").notNull(),
  revokedAt: timestamp("revoked_at"),
  completedAt: timestamp("completed_at"),
  claimedByUserId: text("claimed_by_user_id").references(() => users.id, { onDelete: "set null" }),
  createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_quality_case_task_links_case_id").on(table.caseId),
  index("idx_quality_case_task_links_expires_at").on(table.expiresAt),
]);

export const qualityCaseEvidence = pgTable("quality_case_evidence", {
  id: uuid("id").defaultRandom().primaryKey(),
  caseId: uuid("case_id").notNull().references(() => qualityCases.id, { onDelete: "cascade" }),
  uploadedByParticipantId: uuid("uploaded_by_participant_id").references(() => qualityCaseParticipants.id, { onDelete: "set null" }),
  visibility: text("visibility").notNull().default("internal"),
  storagePath: text("storage_path").notNull(),
  filename: text("filename").notNull(),
  mimeType: text("mime_type"),
  fileSize: integer("file_size"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_quality_case_evidence_case_id").on(table.caseId),
]);

export const qualityCaseTexts = pgTable("quality_case_texts", {
  id: uuid("id").defaultRandom().primaryKey(),
  caseId: uuid("case_id").notNull().references(() => qualityCases.id, { onDelete: "cascade" }),
  fieldPath: text("field_path").notNull(),
  original: jsonb("original").notNull(),
  aiTranslation: jsonb("ai_translation"),
  confirmedTranslation: jsonb("confirmed_translation"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_quality_case_texts_case_id").on(table.caseId),
  index("idx_quality_case_texts_case_field").on(table.caseId, table.fieldPath),
]);

/**
 * Guided investigation records are additive to Quality Cases. They are an
 * auditable investigation ledger, not an AI chat transcript and not a
 * shortcut for writing legacy report fields. A later authorized service maps
 * a human-confirmed decision to an output.
 */
export const qualityCaseGuidanceSessions = pgTable("quality_case_guidance_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  caseId: uuid("case_id").notNull().references(() => qualityCases.id, { onDelete: "cascade" }),
  taskLinkId: uuid("task_link_id").references(() => qualityCaseTaskLinks.id, { onDelete: "set null" }),
  participantId: uuid("participant_id").references(() => qualityCaseParticipants.id, { onDelete: "set null" }),
  mode: text("mode").notNull().default("guided"),
  language: text("language").notNull().default("zh-CN"),
  status: text("status").notNull().default("active"),
  promptPolicyVersion: text("prompt_policy_version").notNull(),
  retentionClass: text("retention_class").notNull().default("case_audit"),
  retainUntil: timestamp("retain_until"),
  temporaryExpiresAt: timestamp("temporary_expires_at"),
  metadata: jsonb("metadata").notNull().default("{}"),
  submittedAt: timestamp("submitted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_qc_guidance_sessions_case_created").on(table.caseId, table.createdAt.desc()),
  index("idx_qc_guidance_sessions_task_link").on(table.taskLinkId),
  index("idx_qc_guidance_sessions_retention").on(table.retentionClass, table.retainUntil),
]);

export const qualityCaseGuidanceAiRuns = pgTable("quality_case_guidance_ai_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  caseId: uuid("case_id").notNull().references(() => qualityCases.id, { onDelete: "cascade" }),
  sessionId: uuid("session_id").notNull().references(() => qualityCaseGuidanceSessions.id, { onDelete: "cascade" }),
  agentType: text("agent_type").notNull(),
  sourceType: text("source_type").notNull(),
  promptIdentifier: text("prompt_identifier").notNull(),
  promptVersion: text("prompt_version").notNull(),
  promptInputHash: text("prompt_input_hash").notNull(),
  modelIdentifier: text("model_identifier"),
  response: jsonb("response").notNull(),
  confidence: text("confidence").notNull(),
  requestMetadata: jsonb("request_metadata").notNull().default("{}"),
  policyOutcome: text("policy_outcome").notNull().default("accepted"),
  generatedAt: timestamp("generated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_qc_guidance_ai_runs_case_generated").on(table.caseId, table.generatedAt.desc()),
  index("idx_qc_guidance_ai_runs_session_generated").on(table.sessionId, table.generatedAt.desc()),
  index("idx_qc_guidance_ai_runs_agent_type").on(table.agentType),
]);

export const qualityCaseGuidanceQuestions = pgTable("quality_case_guidance_questions", {
  id: uuid("id").defaultRandom().primaryKey(),
  caseId: uuid("case_id").notNull().references(() => qualityCases.id, { onDelete: "cascade" }),
  sessionId: uuid("session_id").notNull().references(() => qualityCaseGuidanceSessions.id, { onDelete: "cascade" }),
  aiRunId: uuid("ai_run_id").references(() => qualityCaseGuidanceAiRuns.id, { onDelete: "set null" }),
  questionKey: text("question_key").notNull(),
  questionVersion: text("question_version").notNull(),
  sourceType: text("source_type").notNull(),
  stage: text("stage").notNull(),
  category: text("category").notNull(),
  userFacingQuestion: text("user_facing_question").notNull(),
  explanation: text("explanation"),
  qualityConcepts: jsonb("quality_concepts").notNull().default("[]"),
  followUpRuleIds: jsonb("follow_up_rule_ids").notNull().default("[]"),
  evidenceRequirementIds: jsonb("evidence_requirement_ids").notNull().default("[]"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_qc_guidance_questions_session_created").on(table.sessionId, table.createdAt),
  index("idx_qc_guidance_questions_case_key").on(table.caseId, table.questionKey),
]);

/** Each user edit appends a revision. Original quality information is never overwritten. */
export const qualityCaseGuidanceAnswers = pgTable("quality_case_guidance_answers", {
  id: uuid("id").defaultRandom().primaryKey(),
  caseId: uuid("case_id").notNull().references(() => qualityCases.id, { onDelete: "cascade" }),
  sessionId: uuid("session_id").notNull().references(() => qualityCaseGuidanceSessions.id, { onDelete: "cascade" }),
  questionId: uuid("question_id").notNull().references(() => qualityCaseGuidanceQuestions.id, { onDelete: "cascade" }),
  answerGroupId: uuid("answer_group_id").notNull(),
  revision: integer("revision").notNull().default(1),
  supersedesAnswerId: uuid("supersedes_answer_id").references((): AnyPgColumn => qualityCaseGuidanceAnswers.id, { onDelete: "set null" }),
  sourceType: text("source_type").notNull(),
  actorId: text("actor_id").references(() => users.id, { onDelete: "set null" }),
  actorParticipantId: uuid("actor_participant_id").references(() => qualityCaseParticipants.id, { onDelete: "set null" }),
  actorOrganization: text("actor_organization"),
  originalText: text("original_text").notNull(),
  language: text("language").notNull(),
  classification: text("classification").notNull(),
  linkedQualityConcepts: jsonb("linked_quality_concepts").notNull().default("[]"),
  missingInformation: jsonb("missing_information").notNull().default("[]"),
  followUpQuestionIds: jsonb("follow_up_question_ids").notNull().default("[]"),
  evidenceRequirementIds: jsonb("evidence_requirement_ids").notNull().default("[]"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("uq_qc_guidance_answers_revision").on(table.sessionId, table.answerGroupId, table.revision),
  index("idx_qc_guidance_answers_session_created").on(table.sessionId, table.createdAt.desc()),
  index("idx_qc_guidance_answers_question_created").on(table.questionId, table.createdAt.desc()),
  index("idx_qc_guidance_answers_actor_id").on(table.actorId),
]);

export const qualityCaseGuidanceInsights = pgTable("quality_case_guidance_insights", {
  id: uuid("id").defaultRandom().primaryKey(),
  caseId: uuid("case_id").notNull().references(() => qualityCases.id, { onDelete: "cascade" }),
  sessionId: uuid("session_id").notNull().references(() => qualityCaseGuidanceSessions.id, { onDelete: "cascade" }),
  aiRunId: uuid("ai_run_id").notNull().references(() => qualityCaseGuidanceAiRuns.id, { onDelete: "cascade" }),
  answerId: uuid("answer_id").references(() => qualityCaseGuidanceAnswers.id, { onDelete: "set null" }),
  insightKey: text("insight_key").notNull(),
  kind: text("kind").notNull(),
  severity: text("severity").notNull(),
  sourceType: text("source_type").notNull(),
  message: text("message").notNull(),
  suggestedQuestion: text("suggested_question"),
  affectedConcepts: jsonb("affected_concepts").notNull().default("[]"),
  evidenceRequirementIds: jsonb("evidence_requirement_ids").notNull().default("[]"),
  confidence: text("confidence").notNull(),
  generatedAt: timestamp("generated_at").notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: text("resolved_by").references(() => users.id, { onDelete: "set null" }),
}, (table) => [
  index("idx_qc_guidance_insights_session_generated").on(table.sessionId, table.generatedAt.desc()),
  index("idx_qc_guidance_insights_ai_run").on(table.aiRunId),
]);

export const qualityCaseGuidanceEvidenceRequirements = pgTable("quality_case_guidance_evidence_requirements", {
  id: uuid("id").defaultRandom().primaryKey(),
  caseId: uuid("case_id").notNull().references(() => qualityCases.id, { onDelete: "cascade" }),
  sessionId: uuid("session_id").notNull().references(() => qualityCaseGuidanceSessions.id, { onDelete: "cascade" }),
  questionId: uuid("question_id").references(() => qualityCaseGuidanceQuestions.id, { onDelete: "set null" }),
  answerId: uuid("answer_id").references(() => qualityCaseGuidanceAnswers.id, { onDelete: "set null" }),
  aiRunId: uuid("ai_run_id").references(() => qualityCaseGuidanceAiRuns.id, { onDelete: "set null" }),
  requirementKey: text("requirement_key").notNull(),
  sourceType: text("source_type").notNull(),
  reason: text("reason").notNull(),
  requirementSnapshot: jsonb("requirement_snapshot").notNull(),
  status: text("status").notNull().default("open"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  satisfiedAt: timestamp("satisfied_at"),
  satisfiedBy: text("satisfied_by").references(() => users.id, { onDelete: "set null" }),
}, (table) => [
  index("idx_qc_guidance_evidence_req_session_status").on(table.sessionId, table.status),
  index("idx_qc_guidance_evidence_req_case_key").on(table.caseId, table.requirementKey),
]);

export const qualityCaseGuidanceConfirmations = pgTable("quality_case_guidance_confirmations", {
  id: uuid("id").defaultRandom().primaryKey(),
  caseId: uuid("case_id").notNull().references(() => qualityCases.id, { onDelete: "cascade" }),
  sessionId: uuid("session_id").notNull().references(() => qualityCaseGuidanceSessions.id, { onDelete: "cascade" }),
  answerId: uuid("answer_id").references(() => qualityCaseGuidanceAnswers.id, { onDelete: "set null" }),
  confirmationType: text("confirmation_type").notNull(),
  decision: text("decision").notNull(),
  comment: text("comment"),
  actorId: text("actor_id").references(() => users.id, { onDelete: "set null" }),
  actorParticipantId: uuid("actor_participant_id").references(() => qualityCaseParticipants.id, { onDelete: "set null" }),
  actorOrganization: text("actor_organization"),
  confirmedSnapshot: jsonb("confirmed_snapshot").notNull(),
  confirmedAt: timestamp("confirmed_at").notNull().defaultNow(),
}, (table) => [
  index("idx_qc_guidance_confirmations_session_time").on(table.sessionId, table.confirmedAt.desc()),
  index("idx_qc_guidance_confirmations_answer_time").on(table.answerId, table.confirmedAt.desc()),
]);

/** A mapping decision remains a decision ledger until a later authorized output write. */
export const qualityCaseGuidanceFieldMappings = pgTable("quality_case_guidance_field_mappings", {
  id: uuid("id").defaultRandom().primaryKey(),
  caseId: uuid("case_id").notNull().references(() => qualityCases.id, { onDelete: "cascade" }),
  sessionId: uuid("session_id").notNull().references(() => qualityCaseGuidanceSessions.id, { onDelete: "cascade" }),
  answerId: uuid("answer_id").notNull().references(() => qualityCaseGuidanceAnswers.id, { onDelete: "cascade" }),
  confirmationId: uuid("confirmation_id").references(() => qualityCaseGuidanceConfirmations.id, { onDelete: "set null" }),
  qualityConcept: text("quality_concept").notNull(),
  semanticKey: text("semantic_key").notNull(),
  targetReference: jsonb("target_reference").notNull(),
  decision: text("decision").notNull().default("proposed"),
  decidedBy: text("decided_by").references(() => users.id, { onDelete: "set null" }),
  decidedAt: timestamp("decided_at"),
  decisionComment: text("decision_comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_qc_guidance_mappings_session_decision").on(table.sessionId, table.decision),
  index("idx_qc_guidance_mappings_answer").on(table.answerId),
]);

/**
 * Effectiveness verification is a separate, append-only quality domain. It
 * never writes legacy ReportData and preserves every historical cycle.
 */
export const qualityCaseVerificationCycles = pgTable("quality_case_verification_cycles", {
  id: uuid("id").defaultRandom().primaryKey(),
  caseId: uuid("case_id").notNull().references(() => qualityCases.id, { onDelete: "cascade" }),
  cycleNumber: integer("cycle_number").notNull(),
  status: text("status").notNull().default("verification_planning"),
  createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
  createdByParticipantId: uuid("created_by_participant_id").references(() => qualityCaseParticipants.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
}, (table) => [
  uniqueIndex("uq_qc_verification_cycle_number").on(table.caseId, table.cycleNumber),
  index("idx_qc_verification_cycles_case_created").on(table.caseId, table.createdAt.desc()),
  index("idx_qc_verification_cycles_status").on(table.status),
]);

export const qualityCaseVerificationPlans = pgTable("quality_case_verification_plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  cycleId: uuid("cycle_id").notNull().references(() => qualityCaseVerificationCycles.id, { onDelete: "cascade" }),
  method: text("method").notNull(),
  description: text("description").notNull(),
  ownerName: text("owner_name").notNull(),
  organization: text("organization").notNull(),
  plannedStartAt: timestamp("planned_start_at").notNull(),
  plannedEndAt: timestamp("planned_end_at").notNull(),
  dueAt: timestamp("due_at").notNull(),
  sampleSize: integer("sample_size").notNull(),
  sampleScope: text("sample_scope").notNull(),
  acceptanceCriteria: text("acceptance_criteria").notNull(),
  createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
  createdByParticipantId: uuid("created_by_participant_id").references(() => qualityCaseParticipants.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("uq_qc_verification_plan_cycle").on(table.cycleId),
  index("idx_qc_verification_plans_due").on(table.dueAt),
]);

export const qualityCaseVerificationExecutions = pgTable("quality_case_verification_executions", {
  id: uuid("id").defaultRandom().primaryKey(),
  cycleId: uuid("cycle_id").notNull().references(() => qualityCaseVerificationCycles.id, { onDelete: "cascade" }),
  executorName: text("executor_name").notNull(),
  executorOrganization: text("executor_organization").notNull(),
  executionStartAt: timestamp("execution_start_at").notNull(),
  executionEndAt: timestamp("execution_end_at").notNull(),
  actualScope: text("actual_scope").notNull(),
  executionNotes: text("execution_notes").notNull(),
  updatedBy: text("updated_by").references(() => users.id, { onDelete: "set null" }),
  updatedByParticipantId: uuid("updated_by_participant_id").references(() => qualityCaseParticipants.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("uq_qc_verification_execution_cycle").on(table.cycleId),
]);

export const qualityCaseVerificationResults = pgTable("quality_case_verification_results", {
  id: uuid("id").defaultRandom().primaryKey(),
  executionId: uuid("execution_id").notNull().references(() => qualityCaseVerificationExecutions.id, { onDelete: "cascade" }),
  resultSummary: text("result_summary").notNull(),
  actualSampleSize: integer("actual_sample_size").notNull(),
  passFail: text("pass_fail").notNull(),
  criteriaComparison: text("criteria_comparison").notNull(),
  status: text("status").notNull().default("draft"),
  submittedBy: text("submitted_by").references(() => users.id, { onDelete: "set null" }),
  submittedByParticipantId: uuid("submitted_by_participant_id").references(() => qualityCaseParticipants.id, { onDelete: "set null" }),
  submittedAt: timestamp("submitted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("uq_qc_verification_result_execution").on(table.executionId),
  index("idx_qc_verification_results_status").on(table.status),
]);

export const qualityCaseVerificationEvidence = pgTable("quality_case_verification_evidence", {
  id: uuid("id").defaultRandom().primaryKey(),
  resultId: uuid("result_id").notNull().references(() => qualityCaseVerificationResults.id, { onDelete: "cascade" }),
  evidenceId: uuid("evidence_id").notNull().references(() => qualityCaseEvidence.id, { onDelete: "restrict" }),
  evidenceType: text("evidence_type").notNull(),
  description: text("description").notNull(),
  uploadedBy: text("uploaded_by").references(() => users.id, { onDelete: "set null" }),
  uploadedByParticipantId: uuid("uploaded_by_participant_id").references(() => qualityCaseParticipants.id, { onDelete: "set null" }),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("uq_qc_verification_result_evidence").on(table.resultId, table.evidenceId),
  index("idx_qc_verification_evidence_result").on(table.resultId),
]);

export const qualityCaseVerificationReviews = pgTable("quality_case_verification_reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  resultId: uuid("result_id").notNull().references(() => qualityCaseVerificationResults.id, { onDelete: "cascade" }),
  reviewerId: text("reviewer_id").references(() => users.id, { onDelete: "set null" }),
  reviewerOrganization: text("reviewer_organization").notNull(),
  decision: text("decision").notNull(),
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_qc_verification_reviews_result_created").on(table.resultId, table.createdAt.desc()),
]);

export const qualityCaseVerificationAudits = pgTable("quality_case_verification_audits", {
  id: uuid("id").defaultRandom().primaryKey(),
  caseId: uuid("case_id").notNull().references(() => qualityCases.id, { onDelete: "cascade" }),
  cycleId: uuid("cycle_id").references(() => qualityCaseVerificationCycles.id, { onDelete: "set null" }),
  actorId: text("actor_id").references(() => users.id, { onDelete: "set null" }),
  actorParticipantId: uuid("actor_participant_id").references(() => qualityCaseParticipants.id, { onDelete: "set null" }),
  actorOrganization: text("actor_organization"),
  actorRole: text("actor_role").notNull(),
  action: text("action").notNull(),
  fromStatus: text("from_status"),
  toStatus: text("to_status"),
  reason: text("reason"),
  metadata: jsonb("metadata").notNull().default("{}"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_qc_verification_audits_cycle_created").on(table.cycleId, table.createdAt.desc()),
  index("idx_qc_verification_audits_case_created").on(table.caseId, table.createdAt.desc()),
]);

export const qualityCaseVerificationCoachRuns = pgTable("quality_case_verification_coach_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  caseId: uuid("case_id").notNull().references(() => qualityCases.id, { onDelete: "cascade" }),
  cycleId: uuid("cycle_id").notNull().references(() => qualityCaseVerificationCycles.id, { onDelete: "cascade" }),
  sourceType: text("source_type").notNull(),
  promptIdentifier: text("prompt_identifier").notNull(),
  promptVersion: text("prompt_version").notNull(),
  promptInputHash: text("prompt_input_hash").notNull(),
  modelIdentifier: text("model_identifier"),
  response: jsonb("response").notNull(),
  confidence: text("confidence").notNull(),
  policyOutcome: text("policy_outcome").notNull(),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_qc_verification_coach_cycle_generated").on(table.cycleId, table.generatedAt.desc()),
]);

export const customTemplateRequests = pgTable("custom_template_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  requestType: text("request_type").notNull().default("template_setup"),
  companyName: text("company_name").notNull(),
  contactEmail: text("contact_email").notNull(),
  templateUseCase: text("template_use_case").notNull(),
  customerRequirements: text("customer_requirements"),
  languageRequirement: text("language_requirement"),
  expectedExportFormat: text("expected_export_format"),
  uploadedFiles: jsonb("uploaded_files").default("[]"),
  aiEvaluation: jsonb("ai_evaluation").default("{}"),
  status: text("status").notNull().default("submitted"),
  adminNotes: text("admin_notes"),
  quotedAmount: numeric("quoted_amount", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_custom_template_requests_user_id").on(table.userId),
  index("idx_custom_template_requests_status").on(table.status),
  index("idx_custom_template_requests_type").on(table.requestType),
  index("idx_custom_template_requests_created_at").on(table.createdAt.desc()),
]);
