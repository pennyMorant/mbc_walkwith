CREATE TABLE "member_notification_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"route" text,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"read_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"route" text,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"source_type" text,
	"source_id" text,
	"dedupe_key" text NOT NULL,
	"created_by_admin_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notification_delivery_tasks" ADD COLUMN "message_id" uuid;--> statement-breakpoint
ALTER TABLE "member_notification_items" ADD CONSTRAINT "member_notification_items_message_id_notification_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."notification_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_notification_items" ADD CONSTRAINT "member_notification_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_messages" ADD CONSTRAINT "notification_messages_created_by_admin_user_id_admin_users_id_fk" FOREIGN KEY ("created_by_admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_member_notification_items_message_user" ON "member_notification_items" USING btree ("message_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_member_notification_items_user_created" ON "member_notification_items" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_member_notification_items_unread" ON "member_notification_items" USING btree ("user_id","read_at");--> statement-breakpoint
CREATE INDEX "idx_member_notification_items_archived" ON "member_notification_items" USING btree ("user_id","archived_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_notification_messages_dedupe" ON "notification_messages" USING btree ("dedupe_key");--> statement-breakpoint
CREATE INDEX "idx_notification_messages_type" ON "notification_messages" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_notification_messages_source" ON "notification_messages" USING btree ("source_type","source_id");--> statement-breakpoint
CREATE INDEX "idx_notification_messages_created_at" ON "notification_messages" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "notification_delivery_tasks" ADD CONSTRAINT "notification_delivery_tasks_message_id_notification_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."notification_messages"("id") ON DELETE set null ON UPDATE no action;