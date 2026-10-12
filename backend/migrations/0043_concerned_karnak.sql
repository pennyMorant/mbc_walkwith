CREATE TABLE "sermon_discussion_guides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sermon_id" uuid NOT NULL,
	"title" text NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"audience_type" text DEFAULT 'public' NOT NULL,
	"audience_id" text,
	"questions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"action_steps" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"prayer_prompts" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"generated_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sermon_discussion_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guide_id" uuid NOT NULL,
	"question_id" text,
	"user_type" text NOT NULL,
	"user_id" text NOT NULL,
	"status" text DEFAULT 'private' NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sermon_discussion_guides" ADD CONSTRAINT "sermon_discussion_guides_sermon_id_sermons_id_fk" FOREIGN KEY ("sermon_id") REFERENCES "public"."sermons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sermon_discussion_responses" ADD CONSTRAINT "sermon_discussion_responses_guide_id_sermon_discussion_guides_id_fk" FOREIGN KEY ("guide_id") REFERENCES "public"."sermon_discussion_guides"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_sermon_discussion_guides_sermon" ON "sermon_discussion_guides" USING btree ("sermon_id");--> statement-breakpoint
CREATE INDEX "idx_sermon_discussion_guides_status" ON "sermon_discussion_guides" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_sermon_discussion_guides_audience" ON "sermon_discussion_guides" USING btree ("audience_type","audience_id");--> statement-breakpoint
CREATE INDEX "idx_sermon_discussion_responses_guide" ON "sermon_discussion_responses" USING btree ("guide_id");--> statement-breakpoint
CREATE INDEX "idx_sermon_discussion_responses_user" ON "sermon_discussion_responses" USING btree ("user_type","user_id");--> statement-breakpoint
CREATE INDEX "idx_sermon_discussion_responses_status" ON "sermon_discussion_responses" USING btree ("status");