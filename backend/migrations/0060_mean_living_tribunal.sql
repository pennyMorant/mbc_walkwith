CREATE TABLE "content_translation_chunks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resource_type" text NOT NULL,
	"resource_id" text NOT NULL,
	"locale" text NOT NULL,
	"source_version" integer NOT NULL,
	"field" text NOT NULL,
	"chunk_index" integer NOT NULL,
	"source_text" text NOT NULL,
	"translated_text" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"provider" text,
	"model" text,
	"input_tokens" integer,
	"output_tokens" integer,
	"error_code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_content_translation_chunks_resource" ON "content_translation_chunks" USING btree ("resource_type","resource_id","locale","source_version");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_content_translation_chunks_unique" ON "content_translation_chunks" USING btree ("resource_type","resource_id","locale","source_version","field","chunk_index");