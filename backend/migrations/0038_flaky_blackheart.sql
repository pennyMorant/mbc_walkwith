DROP INDEX "idx_public_posts_is_pinned";--> statement-breakpoint
ALTER TABLE "public_posts" ADD COLUMN "display_weight" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_public_posts_display_weight" ON "public_posts" USING btree ("display_weight");--> statement-breakpoint
ALTER TABLE "public_posts" DROP COLUMN "is_pinned";