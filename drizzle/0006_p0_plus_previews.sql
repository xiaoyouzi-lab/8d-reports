CREATE TABLE IF NOT EXISTS "p0_plus_previews" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "token_hash" text NOT NULL UNIQUE,
  "bounded_raw_input" text NOT NULL,
  "output_language" text DEFAULT 'en' NOT NULL,
  "preview_payload_json" jsonb NOT NULL,
  "client_ip_hash" text NOT NULL,
  "browser_token_hash" text,
  "expires_at" timestamp NOT NULL,
  "converted_report_id" uuid REFERENCES "reports"("id") ON DELETE SET NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_p0_plus_previews_token_hash" ON "p0_plus_previews" ("token_hash");
CREATE INDEX IF NOT EXISTS "idx_p0_plus_previews_expires_at" ON "p0_plus_previews" ("expires_at");
CREATE INDEX IF NOT EXISTS "idx_p0_plus_previews_client_ip_hash" ON "p0_plus_previews" ("client_ip_hash");
