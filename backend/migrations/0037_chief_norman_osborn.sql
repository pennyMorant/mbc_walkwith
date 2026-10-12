ALTER TABLE "member_login_codes" ADD COLUMN "purpose" text DEFAULT 'registration_email_verification' NOT NULL;--> statement-breakpoint
ALTER TABLE "member_login_codes" ADD COLUMN "display_name" text;--> statement-breakpoint
ALTER TABLE "member_login_codes" ADD COLUMN "password_hash" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_hash" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_updated_at" timestamp with time zone;