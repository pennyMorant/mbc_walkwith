CREATE TABLE "sermon_playback_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sermon_id" uuid NOT NULL,
	"user_type" text NOT NULL,
	"user_id" text NOT NULL,
	"position_seconds" integer DEFAULT 0 NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sermon_playback_progress" ADD CONSTRAINT "sermon_playback_progress_sermon_id_sermons_id_fk" FOREIGN KEY ("sermon_id") REFERENCES "public"."sermons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_sermon_playback_progress_sermon_user" ON "sermon_playback_progress" USING btree ("sermon_id","user_type","user_id");--> statement-breakpoint
CREATE INDEX "idx_sermon_playback_progress_user" ON "sermon_playback_progress" USING btree ("user_type","user_id","updated_at");