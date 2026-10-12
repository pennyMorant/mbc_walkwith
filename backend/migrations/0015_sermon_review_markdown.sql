alter table sermons
  add column if not exists review_markdown text;

alter table sermons
  add column if not exists processing_metadata jsonb;
