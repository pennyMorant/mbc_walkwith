CREATE TABLE "sermon_audio_cleanup_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sermon_id" uuid NOT NULL,
	"storage_path" text NOT NULL,
	"reason" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "idx_sermon_audio_cleanup_storage_path" ON "sermon_audio_cleanup_tasks" USING btree ("storage_path");--> statement-breakpoint
CREATE INDEX "idx_sermon_audio_cleanup_status_updated" ON "sermon_audio_cleanup_tasks" USING btree ("status","updated_at");--> statement-breakpoint
CREATE INDEX "idx_sermon_audio_cleanup_sermon" ON "sermon_audio_cleanup_tasks" USING btree ("sermon_id");
