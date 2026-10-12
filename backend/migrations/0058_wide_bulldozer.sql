CREATE TABLE "content_localizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" text NOT NULL,
	"locale" text NOT NULL,
	"source_version" integer NOT NULL,
	"source" text NOT NULL,
	"fields" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"provider" text,
	"model" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "idx_content_localizations_resource_locale" ON "content_localizations" USING btree ("resource_type","resource_id","locale");--> statement-breakpoint
CREATE INDEX "idx_content_localizations_resource" ON "content_localizations" USING btree ("resource_type","resource_id");