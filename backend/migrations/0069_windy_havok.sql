ALTER TABLE "public_posts" ADD COLUMN "image_media_id" uuid;--> statement-breakpoint
ALTER TABLE "public_posts" ADD CONSTRAINT "public_posts_image_media_id_media_assets_id_fk" FOREIGN KEY ("image_media_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "public_posts" DROP COLUMN "image_url";--> statement-breakpoint
UPDATE "app_settings"
SET "value" = "value" - 'imageUrl'
WHERE "key" ~ '^publicLanding(\.(en|es|zh-Hans|zh-Hant))?\.(hero|service)$';--> statement-breakpoint
UPDATE "app_settings"
SET "value" = jsonb_set(
  "value",
  '{items}',
  COALESCE(
    (
      SELECT jsonb_agg(item - 'imageUrl')
      FROM jsonb_array_elements("value"->'items') AS item
    ),
    '[]'::jsonb
  )
)
WHERE "key" ~ '^publicLanding(\.(en|es|zh-Hans|zh-Hant))?\.(people|gallery)$'
  AND jsonb_typeof("value"->'items') = 'array';
