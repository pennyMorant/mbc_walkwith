CREATE TABLE "event_check_in_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"life_post_id" uuid NOT NULL,
	"qr_payload" text NOT NULL,
	"short_code" text NOT NULL,
	"expires_at" timestamp with time zone,
	"disabled_at" timestamp with time zone,
	"created_by_admin_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "event_check_in_codes" ADD CONSTRAINT "event_check_in_codes_life_post_id_public_posts_id_fk" FOREIGN KEY ("life_post_id") REFERENCES "public"."public_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_check_in_codes" ADD CONSTRAINT "event_check_in_codes_created_by_admin_user_id_admin_users_id_fk" FOREIGN KEY ("created_by_admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_event_check_in_codes_life_post" ON "event_check_in_codes" USING btree ("life_post_id");--> statement-breakpoint
CREATE INDEX "idx_event_check_in_codes_expires_at" ON "event_check_in_codes" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_event_check_in_codes_disabled_at" ON "event_check_in_codes" USING btree ("disabled_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_event_check_in_codes_qr_payload" ON "event_check_in_codes" USING btree ("qr_payload");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_event_check_in_codes_short_code" ON "event_check_in_codes" USING btree ("short_code");