create extension if not exists "pgcrypto";

create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null,
  role text not null default 'viewer',
  status text not null default 'active',
  password_hash text not null default '',
  password_updated_at timestamptz,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table admin_users
  add column if not exists status text not null default 'active';
alter table admin_users
  add column if not exists password_hash text not null default '';
alter table admin_users
  alter column password_hash drop default;
alter table admin_users
  add column if not exists password_updated_at timestamptz;
alter table admin_users
  add column if not exists last_login_at timestamptz;
alter table admin_users
  alter column role set default 'viewer';
update admin_users set role = 'content_editor' where role = 'editor';

create index if not exists idx_admin_users_role on admin_users(role);

create table if not exists admin_refresh_tokens (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references admin_users(id) on delete cascade,
  token_hash text not null unique,
  family_id uuid not null,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  revoked_reason text,
  replaced_by_token_id uuid,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_refresh_tokens_admin_user
  on admin_refresh_tokens(admin_user_id);
create index if not exists idx_admin_refresh_tokens_family
  on admin_refresh_tokens(family_id);
create index if not exists idx_admin_refresh_tokens_expires_at
  on admin_refresh_tokens(expires_at);

create table if not exists admin_access_token_revocations (
  token_id text primary key,
  admin_user_id uuid not null references admin_users(id) on delete cascade,
  expires_at timestamptz not null,
  reason text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_access_revocations_admin_user
  on admin_access_token_revocations(admin_user_id);
create index if not exists idx_admin_access_revocations_expires_at
  on admin_access_token_revocations(expires_at);

create table if not exists sermons (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  speaker text not null,
  sermon_date timestamptz not null,
  series text,
  primary_reference text,
  summary text,
  thumbnail_url text,
  duration_seconds integer not null default 0,
  status text not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_sermons_sermon_date on sermons(sermon_date);
create index if not exists idx_sermons_speaker on sermons(speaker);
create index if not exists idx_sermons_series on sermons(series);
create index if not exists idx_sermons_status on sermons(status);

create table if not exists sermon_outlines (
  id uuid primary key default gen_random_uuid(),
  sermon_id uuid not null references sermons(id) on delete cascade,
  title text not null,
  summary text not null default '',
  start_seconds integer not null default 0,
  sort_order integer not null default 0
);

create index if not exists idx_sermon_outlines_sermon_sort
  on sermon_outlines(sermon_id, sort_order);

create table if not exists sermon_references (
  id uuid primary key default gen_random_uuid(),
  sermon_id uuid not null references sermons(id) on delete cascade,
  verse_id text not null,
  reference_text text not null,
  note text,
  start_seconds integer
);

create index if not exists idx_sermon_references_verse_id
  on sermon_references(verse_id);

create table if not exists sermon_transcripts (
  sermon_id uuid primary key references sermons(id) on delete cascade,
  text text not null default '',
  source text,
  updated_at timestamptz not null default now()
);

create table if not exists bible_knowledge_entities (
  id text not null,
  type text not null,
  locale text not null default 'en',
  translation_id text not null default 'web',
  name text not null,
  category text not null,
  summary text not null,
  description text not null,
  sections jsonb not null default '[]'::jsonb,
  aliases jsonb not null default '[]'::jsonb,
  verse_aliases jsonb not null default '{}'::jsonb,
  status text not null default 'draft',
  updated_at timestamptz not null default now(),
  primary key (id, locale, translation_id)
);

create index if not exists idx_bible_knowledge_type
  on bible_knowledge_entities(type);
create index if not exists idx_bible_knowledge_translation
  on bible_knowledge_entities(translation_id);

create table if not exists public_posts (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  title text not null,
  body text not null,
  meta text not null default '',
  icon_name text not null default 'church',
  starts_at timestamptz,
  ends_at timestamptz,
  visibility text not null default 'public',
  image_url text,
  updated_at timestamptz not null default now()
);

create index if not exists idx_public_posts_visibility
  on public_posts(visibility);
create index if not exists idx_public_posts_starts_at
  on public_posts(starts_at);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid,
  action text not null,
  resource_type text not null,
  resource_id text not null,
  before_json jsonb,
  after_json jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_actor on audit_logs(actor_user_id);
create index if not exists idx_audit_logs_created_at on audit_logs(created_at);
