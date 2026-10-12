CREATE TABLE "reading_plan_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"user_type" text NOT NULL,
	"user_id" text NOT NULL,
	"source_type" text DEFAULT 'self' NOT NULL,
	"source_id" text,
	"status" text DEFAULT 'not_started' NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reading_plan_day_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assignment_id" uuid NOT NULL,
	"day_id" uuid NOT NULL,
	"status" text DEFAULT 'available' NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"completed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reading_plan_days" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"day_number" integer NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"references" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reading_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"visibility" text DEFAULT 'public' NOT NULL,
	"locale" text DEFAULT 'zh-Hans' NOT NULL,
	"duration_days" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reading_plan_assignments" ADD CONSTRAINT "reading_plan_assignments_plan_id_reading_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."reading_plans"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading_plan_day_progress" ADD CONSTRAINT "reading_plan_day_progress_assignment_id_reading_plan_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."reading_plan_assignments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading_plan_day_progress" ADD CONSTRAINT "reading_plan_day_progress_day_id_reading_plan_days_id_fk" FOREIGN KEY ("day_id") REFERENCES "public"."reading_plan_days"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading_plan_days" ADD CONSTRAINT "reading_plan_days_plan_id_reading_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."reading_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_reading_plan_assignments_plan_user" ON "reading_plan_assignments" USING btree ("plan_id","user_type","user_id");--> statement-breakpoint
CREATE INDEX "idx_reading_plan_assignments_user" ON "reading_plan_assignments" USING btree ("user_type","user_id");--> statement-breakpoint
CREATE INDEX "idx_reading_plan_assignments_status" ON "reading_plan_assignments" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_reading_plan_day_progress_assignment_day" ON "reading_plan_day_progress" USING btree ("assignment_id","day_id");--> statement-breakpoint
CREATE INDEX "idx_reading_plan_day_progress_status" ON "reading_plan_day_progress" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_reading_plan_days_plan_day" ON "reading_plan_days" USING btree ("plan_id","day_number");--> statement-breakpoint
CREATE INDEX "idx_reading_plans_status" ON "reading_plans" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_reading_plans_visibility" ON "reading_plans" USING btree ("visibility");--> statement-breakpoint
CREATE INDEX "idx_reading_plans_locale" ON "reading_plans" USING btree ("locale");