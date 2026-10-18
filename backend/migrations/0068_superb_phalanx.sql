CREATE TABLE "media_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"visibility" text DEFAULT 'public' NOT NULL,
	"consent_status" text DEFAULT 'pending' NOT NULL,
	"storage_key" text NOT NULL,
	"public_url" text NOT NULL,
	"original_file_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"width" integer,
	"height" integer,
	"focal_x" integer DEFAULT 50 NOT NULL,
	"focal_y" integer DEFAULT 50 NOT NULL,
	"alt_text" text DEFAULT '' NOT NULL,
	"caption" text DEFAULT '' NOT NULL,
	"copyright_source" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "idx_media_assets_storage_key" ON "media_assets" USING btree ("storage_key");--> statement-breakpoint
CREATE INDEX "idx_media_assets_kind_created_at" ON "media_assets" USING btree ("kind","created_at");--> statement-breakpoint
CREATE INDEX "idx_media_assets_visibility" ON "media_assets" USING btree ("visibility");