ALTER TABLE "member_profiles" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "member_profiles" ADD COLUMN "faith_start_year" integer;--> statement-breakpoint
ALTER TABLE "member_profiles" ADD COLUMN "baptized_year" integer;--> statement-breakpoint
ALTER TABLE "member_profiles" ADD COLUMN "joined_church_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "member_profiles" ADD COLUMN "emergency_contact_name" text;--> statement-breakpoint
ALTER TABLE "member_profiles" ADD COLUMN "emergency_contact_phone" text;