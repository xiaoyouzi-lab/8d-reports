CREATE TABLE IF NOT EXISTS "team_workspaces" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "owner_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "max_seats" integer DEFAULT 5,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_team_workspaces_owner_id" ON "team_workspaces" ("owner_id");

CREATE TABLE IF NOT EXISTS "team_members" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "team_id" uuid NOT NULL REFERENCES "team_workspaces"("id") ON DELETE CASCADE,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "role" text DEFAULT 'member' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_team_members_team_id" ON "team_members" ("team_id");
CREATE INDEX IF NOT EXISTS "idx_team_members_user_id" ON "team_members" ("user_id");

CREATE TABLE IF NOT EXISTS "report_purchases" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "report_id" uuid NOT NULL REFERENCES "reports"("id") ON DELETE CASCADE,
  "creem_checkout_id" text UNIQUE,
  "creem_product_id" text,
  "status" text DEFAULT 'active' NOT NULL,
  "purchase_type" text DEFAULT 'single_report_export' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_report_purchases_user_report" ON "report_purchases" ("user_id", "report_id");

UPDATE "user_quotas"
SET "total_quota" = 3, "updated_at" = now()
WHERE "total_quota" = 5;
