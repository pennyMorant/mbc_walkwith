DROP INDEX "idx_reading_plan_assignments_plan_user";--> statement-breakpoint
ALTER TABLE "reading_plan_assignments" ADD COLUMN "plan_title" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "reading_plan_assignments" ADD COLUMN "plan_duration_days" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "reading_plan_assignments" ADD COLUMN "attempt_number" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "reading_plan_assignments" ADD COLUMN "ended_at" timestamp with time zone;--> statement-breakpoint
UPDATE "reading_plan_assignments" AS "assignment"
SET
  "plan_title" = "plan"."title",
  "plan_duration_days" = "plan"."duration_days",
  "ended_at" = CASE
    WHEN "assignment"."status" = 'completed' THEN "assignment"."completed_at"
    WHEN "assignment"."status" = 'abandoned' THEN "assignment"."updated_at"
    ELSE NULL
  END
FROM "reading_plans" AS "plan"
WHERE "assignment"."plan_id" = "plan"."id";--> statement-breakpoint
CREATE UNIQUE INDEX "idx_reading_plan_assignments_plan_user_attempt" ON "reading_plan_assignments" USING btree ("plan_id","user_type","user_id","attempt_number");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_reading_plan_assignments_open_plan_user" ON "reading_plan_assignments" USING btree ("plan_id","user_type","user_id") WHERE "reading_plan_assignments"."status" in ('not_started', 'active', 'paused');--> statement-breakpoint
CREATE INDEX "idx_reading_plan_assignments_user_ended_at" ON "reading_plan_assignments" USING btree ("user_type","user_id","ended_at");
