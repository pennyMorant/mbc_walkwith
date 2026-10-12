alter table bible_knowledge_entities
  add column if not exists sections jsonb not null default '[]'::jsonb;
