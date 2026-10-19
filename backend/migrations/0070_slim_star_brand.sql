CREATE TABLE "media_object_cleanup_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"media_asset_id" uuid NOT NULL,
	"storage_key" text NOT NULL,
	"reason" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "idx_media_object_cleanup_storage_key" ON "media_object_cleanup_tasks" USING btree ("storage_key");--> statement-breakpoint
CREATE INDEX "idx_media_object_cleanup_status_updated" ON "media_object_cleanup_tasks" USING btree ("status","updated_at");--> statement-breakpoint
CREATE INDEX "idx_media_object_cleanup_media_asset" ON "media_object_cleanup_tasks" USING btree ("media_asset_id");