create table if not exists member_device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  installation_id text not null,
  platform text not null check (platform in ('ios', 'android')),
  provider text not null default 'fcm' check (provider in ('fcm')),
  push_token text not null,
  permission_status text not null default 'not_determined'
    check (permission_status in ('authorized', 'denied', 'provisional', 'not_determined')),
  locale text not null default 'en',
  app_version text,
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_member_device_tokens_push_token
  on member_device_tokens(push_token);

create unique index if not exists idx_member_device_tokens_installation
  on member_device_tokens(user_id, installation_id);

create index if not exists idx_member_device_tokens_user
  on member_device_tokens(user_id);

create index if not exists idx_member_device_tokens_revoked_at
  on member_device_tokens(revoked_at);
