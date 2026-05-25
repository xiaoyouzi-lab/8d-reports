CREATE TABLE IF NOT EXISTS "analytics_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "event_name" text NOT NULL,
  "user_id" text REFERENCES "users"("id") ON DELETE SET NULL,
  "report_id" uuid REFERENCES "reports"("id") ON DELETE SET NULL,
  "plan" text DEFAULT 'free',
  "locale" text DEFAULT 'en',
  "device_type" text DEFAULT 'desktop',
  "path" text,
  "metadata" jsonb DEFAULT '{}',
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_analytics_events_name" ON "analytics_events" ("event_name");
CREATE INDEX IF NOT EXISTS "idx_analytics_events_user_id" ON "analytics_events" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_analytics_events_created_at" ON "analytics_events" ("created_at" DESC);
