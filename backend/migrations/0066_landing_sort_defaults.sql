CREATE OR REPLACE FUNCTION pg_temp.mbc_add_landing_sort(node jsonb)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF jsonb_typeof(node) = 'array' THEN
    RETURN COALESCE(
      (
        SELECT jsonb_agg(
          CASE
            WHEN jsonb_typeof(entry.value) = 'object' THEN
              pg_temp.mbc_add_landing_sort(
                entry.value ||
                CASE
                  WHEN jsonb_typeof(entry.value->'sort') = 'number' THEN '{}'::jsonb
                  ELSE '{"sort": 0}'::jsonb
                END
              )
            ELSE pg_temp.mbc_add_landing_sort(entry.value)
          END
          ORDER BY entry.ordinality
        )
        FROM jsonb_array_elements(node) WITH ORDINALITY AS entry(value, ordinality)
      ),
      '[]'::jsonb
    );
  END IF;

  IF jsonb_typeof(node) = 'object' THEN
    RETURN COALESCE(
      (
        SELECT jsonb_object_agg(entry.key, pg_temp.mbc_add_landing_sort(entry.value))
        FROM jsonb_each(node) AS entry(key, value)
      ),
      '{}'::jsonb
    );
  END IF;

  RETURN node;
END;
$$;--> statement-breakpoint

UPDATE "app_settings"
SET "value" = pg_temp.mbc_add_landing_sort("value")
WHERE "key" LIKE 'publicLanding.%';--> statement-breakpoint

UPDATE "app_settings"
SET "value" = "value" || '{"sort": 0}'::jsonb
WHERE (
  "key" = 'publicLanding.brandAction'
  OR "key" LIKE 'publicLanding.%.brandAction'
)
AND jsonb_typeof("value"->'sort') IS DISTINCT FROM 'number';
