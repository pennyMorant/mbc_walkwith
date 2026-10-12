CREATE TABLE "serving_availability_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"status" text NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "serving_check_ins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assignment_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"checked_in_at" timestamp with time zone,
	"note" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "serving_check_ins" ADD CONSTRAINT "serving_check_ins_assignment_id_serving_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."serving_assignments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_serving_availability_user_time" ON "serving_availability_records" USING btree ("user_id","starts_at");--> statement-breakpoint
CREATE INDEX "idx_serving_availability_status" ON "serving_availability_records" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_serving_check_ins_assignment" ON "serving_check_ins" USING btree ("assignment_id");--> statement-breakpoint
CREATE INDEX "idx_serving_check_ins_user" ON "serving_check_ins" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_serving_check_ins_status" ON "serving_check_ins" USING btree ("status");