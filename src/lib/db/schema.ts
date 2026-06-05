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
  cidr,
} from "drizzle-orm/pg-core";

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
