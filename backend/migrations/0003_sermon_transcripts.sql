create table if not exists sermon_transcripts (
  sermon_id uuid primary key references sermons(id) on delete cascade,
  text text not null default '',
  source text,
  updated_at timestamptz not null default now()
);
