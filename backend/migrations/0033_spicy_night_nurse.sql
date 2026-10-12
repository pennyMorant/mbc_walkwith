ALTER TABLE "member_device_tokens" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "notification_delivery_tasks" ADD COLUMN "audience" text DEFAULT 'members' NOT NULL;--> statement-breakpoint
ALTER TABLE "notification_delivery_tasks" ADD COLUMN "preference_key" text;--> statement-breakpoint
ALTER TABLE "notification_delivery_tasks" ADD COLUMN "recipient_user_ids" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "notification_messages" ADD COLUMN "audience" text DEFAULT 'members' NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_notification_delivery_tasks_audience" ON "notification_delivery_tasks" USING btree ("audience");--> statement-breakpoint
CREATE INDEX "idx_notification_messages_audience" ON "notification_messages" USING btree ("audience");