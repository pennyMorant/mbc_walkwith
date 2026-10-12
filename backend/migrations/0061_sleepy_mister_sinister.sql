ALTER TABLE "public_posts" ADD COLUMN "source_locale" text DEFAULT 'zh-Hans' NOT NULL;--> statement-breakpoint
ALTER TABLE "sermon_discussion_guides" ADD COLUMN "revision" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "sermon_discussion_guides" ADD COLUMN "source_locale" text DEFAULT 'zh-Hans' NOT NULL;--> statement-breakpoint
ALTER TABLE "sermons" ADD COLUMN "source_locale" text DEFAULT 'zh-Hans' NOT NULL;