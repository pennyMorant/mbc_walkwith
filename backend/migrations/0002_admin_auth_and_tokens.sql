create extension if not exists "pgcrypto";

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
