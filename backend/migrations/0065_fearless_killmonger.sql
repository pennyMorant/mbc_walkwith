ALTER TABLE "course_lessons" RENAME COLUMN "sort_order" TO "sort";--> statement-breakpoint
ALTER TABLE "discipleship_stages" RENAME COLUMN "sort_order" TO "sort";--> statement-breakpoint
ALTER TABLE "discipleship_tasks" RENAME COLUMN "sort_order" TO "sort";--> statement-breakpoint
ALTER TABLE "giving_funds" RENAME COLUMN "display_order" TO "sort";--> statement-breakpoint
ALTER TABLE "public_posts" RENAME COLUMN "display_weight" TO "sort";--> statement-breakpoint
ALTER TABLE "sermon_outlines" RENAME COLUMN "sort_order" TO "sort";--> statement-breakpoint
WITH "ranked" AS (
  SELECT "id", max("sort") OVER (PARTITION BY "course_id") - "sort" AS "next_sort"
  FROM "course_lessons"
)
UPDATE "course_lessons" SET "sort" = "ranked"."next_sort"
FROM "ranked" WHERE "course_lessons"."id" = "ranked"."id";--> statement-breakpoint
WITH "ranked" AS (
  SELECT "id", max("sort") OVER (PARTITION BY "journey_id") - "sort" AS "next_sort"
  FROM "discipleship_stages"
)
UPDATE "discipleship_stages" SET "sort" = "ranked"."next_sort"
FROM "ranked" WHERE "discipleship_stages"."id" = "ranked"."id";--> statement-breakpoint
WITH "ranked" AS (
  SELECT "id", max("sort") OVER (PARTITION BY "journey_id") - "sort" AS "next_sort"
  FROM "discipleship_tasks"
)
UPDATE "discipleship_tasks" SET "sort" = "ranked"."next_sort"
FROM "ranked" WHERE "discipleship_tasks"."id" = "ranked"."id";--> statement-breakpoint
WITH "ranked" AS (
  SELECT "id", max("sort") OVER () - "sort" AS "next_sort"
  FROM "giving_funds"
)
UPDATE "giving_funds" SET "sort" = "ranked"."next_sort"
FROM "ranked" WHERE "giving_funds"."id" = "ranked"."id";--> statement-breakpoint
WITH "ranked" AS (
  SELECT "id", max("sort") OVER (PARTITION BY "sermon_id") - "sort" AS "next_sort"
  FROM "sermon_outlines"
)
UPDATE "sermon_outlines" SET "sort" = "ranked"."next_sort"
FROM "ranked" WHERE "sermon_outlines"."id" = "ranked"."id";--> statement-breakpoint
DROP INDEX "idx_giving_funds_display_order";--> statement-breakpoint
DROP INDEX "idx_public_posts_display_weight";--> statement-breakpoint
DROP INDEX "idx_course_lessons_course_sort";--> statement-breakpoint
DROP INDEX "idx_discipleship_stages_journey_sort";--> statement-breakpoint
DROP INDEX "idx_discipleship_tasks_journey_sort";--> statement-breakpoint
DROP INDEX "idx_sermon_outlines_sermon_sort";--> statement-breakpoint
CREATE INDEX "idx_giving_funds_sort" ON "giving_funds" USING btree ("sort");--> statement-breakpoint
CREATE INDEX "idx_public_posts_sort" ON "public_posts" USING btree ("sort");--> statement-breakpoint
CREATE INDEX "idx_course_lessons_course_sort" ON "course_lessons" USING btree ("course_id","sort");--> statement-breakpoint
CREATE INDEX "idx_discipleship_stages_journey_sort" ON "discipleship_stages" USING btree ("journey_id","sort");--> statement-breakpoint
CREATE INDEX "idx_discipleship_tasks_journey_sort" ON "discipleship_tasks" USING btree ("journey_id","sort");--> statement-breakpoint
CREATE INDEX "idx_sermon_outlines_sermon_sort" ON "sermon_outlines" USING btree ("sermon_id","sort");
