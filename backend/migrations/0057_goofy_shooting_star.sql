ALTER TABLE "notification_delivery_tasks" ADD COLUMN "pending_device_ids" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "notification_delivery_tasks" ADD COLUMN "lease_id" text;--> statement-breakpoint
ALTER TABLE "notification_delivery_tasks" ADD COLUMN "lease_expires_at" timestamp with time zone;