CREATE TABLE "life_post_translations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"locale" text NOT NULL,
	"source_version" integer NOT NULL,
	"source" text NOT NULL,
	"fields" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"provider" text,
	"model" text,
	"input_tokens" integer,
	"output_tokens" integer,
	"generated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"life_post_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_message_translations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"locale" text NOT NULL,
	"source_version" integer NOT NULL,
	"source" text NOT NULL,
	"fields" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"provider" text,
	"model" text,
	"input_tokens" integer,
	"output_tokens" integer,
	"generated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"notification_message_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "public_landing_translations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"locale" text NOT NULL,
	"source_version" integer NOT NULL,
	"source" text NOT NULL,
	"fields" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"provider" text,
	"model" text,
	"input_tokens" integer,
	"output_tokens" integer,
	"generated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resource_id" text DEFAULT 'landing' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sermon_discussion_guide_translations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"locale" text NOT NULL,
	"source_version" integer NOT NULL,
	"source" text NOT NULL,
	"fields" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"provider" text,
	"model" text,
	"input_tokens" integer,
	"output_tokens" integer,
	"generated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sermon_discussion_guide_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sermon_translations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"locale" text NOT NULL,
	"source_version" integer NOT NULL,
	"source" text NOT NULL,
	"fields" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"provider" text,
	"model" text,
	"input_tokens" integer,
	"output_tokens" integer,
	"generated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sermon_id" uuid NOT NULL
);
--> statement-breakpoint
DROP TABLE "content_localizations" CASCADE;--> statement-breakpoint
ALTER TABLE "life_post_translations" ADD CONSTRAINT "life_post_translations_life_post_id_public_posts_id_fk" FOREIGN KEY ("life_post_id") REFERENCES "public"."public_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_message_translations" ADD CONSTRAINT "notification_message_translations_notification_message_id_notification_messages_id_fk" FOREIGN KEY ("notification_message_id") REFERENCES "public"."notification_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sermon_discussion_guide_translations" ADD CONSTRAINT "sermon_discussion_guide_translations_sermon_discussion_guide_id_sermon_discussion_guides_id_fk" FOREIGN KEY ("sermon_discussion_guide_id") REFERENCES "public"."sermon_discussion_guides"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sermon_translations" ADD CONSTRAINT "sermon_translations_sermon_id_sermons_id_fk" FOREIGN KEY ("sermon_id") REFERENCES "public"."sermons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_life_post_translations_resource_locale" ON "life_post_translations" USING btree ("life_post_id","locale");--> statement-breakpoint
CREATE INDEX "idx_life_post_translations_resource" ON "life_post_translations" USING btree ("life_post_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_notification_translations_resource_locale" ON "notification_message_translations" USING btree ("notification_message_id","locale");--> statement-breakpoint
CREATE INDEX "idx_notification_translations_resource" ON "notification_message_translations" USING btree ("notification_message_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_public_landing_translations_resource_locale" ON "public_landing_translations" USING btree ("resource_id","locale");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_sermon_guide_translations_resource_locale" ON "sermon_discussion_guide_translations" USING btree ("sermon_discussion_guide_id","locale");--> statement-breakpoint
CREATE INDEX "idx_sermon_guide_translations_resource" ON "sermon_discussion_guide_translations" USING btree ("sermon_discussion_guide_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_sermon_translations_resource_locale" ON "sermon_translations" USING btree ("sermon_id","locale");--> statement-breakpoint
CREATE INDEX "idx_sermon_translations_resource" ON "sermon_translations" USING btree ("sermon_id");