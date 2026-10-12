CREATE TABLE "newcomer_follow_ups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"newcomer_id" uuid NOT NULL,
	"author_admin_user_id" uuid,
	"author_name" text DEFAULT '' NOT NULL,
	"note" text NOT NULL,
	"status" text DEFAULT 'completed' NOT NULL,
	"planned_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "newcomer_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"external_user_id" text,
	"linked_member_user_id" text,
	"display_name" text NOT NULL,
	"email" text,
	"phone" text,
	"preferred_language" text DEFAULT '' NOT NULL,
	"source" text DEFAULT 'app' NOT NULL,
	"interest" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"assignee_admin_user_id" uuid,
	"assignee_name" text DEFAULT '' NOT NULL,
	"next_follow_up_at" timestamp with time zone,
	"conversion_status" text DEFAULT 'none' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "newcomer_follow_ups" ADD CONSTRAINT "newcomer_follow_ups_newcomer_id_newcomer_profiles_id_fk" FOREIGN KEY ("newcomer_id") REFERENCES "public"."newcomer_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newcomer_follow_ups" ADD CONSTRAINT "newcomer_follow_ups_author_admin_user_id_admin_users_id_fk" FOREIGN KEY ("author_admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newcomer_profiles" ADD CONSTRAINT "newcomer_profiles_assignee_admin_user_id_admin_users_id_fk" FOREIGN KEY ("assignee_admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_newcomer_follow_ups_newcomer" ON "newcomer_follow_ups" USING btree ("newcomer_id");--> statement-breakpoint
CREATE INDEX "idx_newcomer_follow_ups_status" ON "newcomer_follow_ups" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_newcomer_profiles_status" ON "newcomer_profiles" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_newcomer_profiles_assignee" ON "newcomer_profiles" USING btree ("assignee_admin_user_id");--> statement-breakpoint
CREATE INDEX "idx_newcomer_profiles_external_user" ON "newcomer_profiles" USING btree ("external_user_id");--> statement-breakpoint
CREATE INDEX "idx_newcomer_profiles_email" ON "newcomer_profiles" USING btree ("email");