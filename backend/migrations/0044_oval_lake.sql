CREATE TABLE "group_attendance_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"meeting_date" timestamp with time zone NOT NULL,
	"member_user_id" text NOT NULL,
	"member_display_name" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'present' NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_material_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"material_type" text NOT NULL,
	"material_id" text NOT NULL,
	"title" text NOT NULL,
	"status" text DEFAULT 'assigned' NOT NULL,
	"due_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "group_attendance_records" ADD CONSTRAINT "group_attendance_records_group_id_ministry_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."ministry_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_material_assignments" ADD CONSTRAINT "group_material_assignments_group_id_ministry_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."ministry_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_group_attendance_records_group_meeting" ON "group_attendance_records" USING btree ("group_id","meeting_date");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_group_attendance_records_member_meeting" ON "group_attendance_records" USING btree ("group_id","meeting_date","member_user_id");--> statement-breakpoint
CREATE INDEX "idx_group_attendance_records_status" ON "group_attendance_records" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_group_material_assignments_group" ON "group_material_assignments" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "idx_group_material_assignments_material" ON "group_material_assignments" USING btree ("material_type","material_id");--> statement-breakpoint
CREATE INDEX "idx_group_material_assignments_status" ON "group_material_assignments" USING btree ("status");