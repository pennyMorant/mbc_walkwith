CREATE TABLE "discipleship_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"journey_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"source_type" text DEFAULT 'member' NOT NULL,
	"source_id" text,
	"assignee_admin_user_id" uuid,
	"assignee_name" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'not_started' NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discipleship_journeys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discipleship_stages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"journey_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discipleship_task_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assignment_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"status" text DEFAULT 'available' NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"completed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discipleship_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"journey_id" uuid NOT NULL,
	"stage_id" uuid,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"reference_type" text NOT NULL,
	"reference_id" text DEFAULT '' NOT NULL,
	"required" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "discipleship_assignments" ADD CONSTRAINT "discipleship_assignments_journey_id_discipleship_journeys_id_fk" FOREIGN KEY ("journey_id") REFERENCES "public"."discipleship_journeys"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discipleship_assignments" ADD CONSTRAINT "discipleship_assignments_assignee_admin_user_id_admin_users_id_fk" FOREIGN KEY ("assignee_admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discipleship_stages" ADD CONSTRAINT "discipleship_stages_journey_id_discipleship_journeys_id_fk" FOREIGN KEY ("journey_id") REFERENCES "public"."discipleship_journeys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discipleship_task_progress" ADD CONSTRAINT "discipleship_task_progress_assignment_id_discipleship_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."discipleship_assignments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discipleship_task_progress" ADD CONSTRAINT "discipleship_task_progress_task_id_discipleship_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."discipleship_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discipleship_tasks" ADD CONSTRAINT "discipleship_tasks_journey_id_discipleship_journeys_id_fk" FOREIGN KEY ("journey_id") REFERENCES "public"."discipleship_journeys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discipleship_tasks" ADD CONSTRAINT "discipleship_tasks_stage_id_discipleship_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."discipleship_stages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_discipleship_assignments_user" ON "discipleship_assignments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_discipleship_assignments_journey" ON "discipleship_assignments" USING btree ("journey_id");--> statement-breakpoint
CREATE INDEX "idx_discipleship_assignments_status" ON "discipleship_assignments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_discipleship_journeys_status" ON "discipleship_journeys" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_discipleship_stages_journey_sort" ON "discipleship_stages" USING btree ("journey_id","sort_order");--> statement-breakpoint
CREATE INDEX "idx_discipleship_task_progress_assignment" ON "discipleship_task_progress" USING btree ("assignment_id");--> statement-breakpoint
CREATE INDEX "idx_discipleship_task_progress_task" ON "discipleship_task_progress" USING btree ("task_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_discipleship_task_progress_assignment_task" ON "discipleship_task_progress" USING btree ("assignment_id","task_id");--> statement-breakpoint
CREATE INDEX "idx_discipleship_tasks_journey_sort" ON "discipleship_tasks" USING btree ("journey_id","sort_order");--> statement-breakpoint
CREATE INDEX "idx_discipleship_tasks_stage" ON "discipleship_tasks" USING btree ("stage_id");