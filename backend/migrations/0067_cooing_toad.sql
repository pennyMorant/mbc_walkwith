ALTER TABLE "course_lessons" RENAME COLUMN "sort" TO "position";--> statement-breakpoint
ALTER TABLE "discipleship_stages" RENAME COLUMN "sort" TO "position";--> statement-breakpoint
ALTER TABLE "discipleship_tasks" RENAME COLUMN "sort" TO "position";--> statement-breakpoint
ALTER TABLE "sermon_outlines" RENAME COLUMN "sort" TO "position";--> statement-breakpoint
WITH "ranked" AS (
  SELECT "id", row_number() OVER (
    PARTITION BY "course_id"
    ORDER BY "position" DESC, "title" ASC, "id" ASC
  ) - 1 AS "next_position"
  FROM "course_lessons"
)
UPDATE "course_lessons" SET "position" = "ranked"."next_position"
FROM "ranked" WHERE "course_lessons"."id" = "ranked"."id";--> statement-breakpoint
WITH "ranked" AS (
  SELECT "id", row_number() OVER (
    PARTITION BY "journey_id"
    ORDER BY "position" DESC, "created_at" ASC, "id" ASC
  ) - 1 AS "next_position"
  FROM "discipleship_stages"
)
UPDATE "discipleship_stages" SET "position" = "ranked"."next_position"
FROM "ranked" WHERE "discipleship_stages"."id" = "ranked"."id";--> statement-breakpoint
WITH "ranked" AS (
  SELECT "id", row_number() OVER (
    PARTITION BY "journey_id"
    ORDER BY "position" DESC, "created_at" ASC, "id" ASC
  ) - 1 AS "next_position"
  FROM "discipleship_tasks"
)
UPDATE "discipleship_tasks" SET "position" = "ranked"."next_position"
FROM "ranked" WHERE "discipleship_tasks"."id" = "ranked"."id";--> statement-breakpoint
WITH "ranked" AS (
  SELECT "id", row_number() OVER (
    PARTITION BY "sermon_id"
    ORDER BY "position" DESC, "start_seconds" ASC, "id" ASC
  ) - 1 AS "next_position"
  FROM "sermon_outlines"
)
UPDATE "sermon_outlines" SET "position" = "ranked"."next_position"
FROM "ranked" WHERE "sermon_outlines"."id" = "ranked"."id";--> statement-breakpoint
DROP INDEX "idx_course_lessons_course_sort";--> statement-breakpoint
DROP INDEX "idx_discipleship_stages_journey_sort";--> statement-breakpoint
DROP INDEX "idx_discipleship_tasks_journey_sort";--> statement-breakpoint
DROP INDEX "idx_sermon_outlines_sermon_sort";--> statement-breakpoint
CREATE INDEX "idx_course_lessons_course_position" ON "course_lessons" USING btree ("course_id","position");--> statement-breakpoint
CREATE INDEX "idx_discipleship_stages_journey_position" ON "discipleship_stages" USING btree ("journey_id","position");--> statement-breakpoint
CREATE INDEX "idx_discipleship_tasks_journey_position" ON "discipleship_tasks" USING btree ("journey_id","position");--> statement-breakpoint
CREATE INDEX "idx_sermon_outlines_sermon_position" ON "sermon_outlines" USING btree ("sermon_id","position");
