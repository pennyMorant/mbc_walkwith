create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  display_name text not null,
  phone text,
  role text not null default 'member',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_users_email on users(email);
create index if not exists idx_users_status on users(status);

create table if not exists member_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  app_locale text not null default 'en',
  fellowship_group_id text,
  notification_settings jsonb not null default '{}'::jsonb
);

create unique index if not exists idx_member_profiles_user
  on member_profiles(user_id);
create index if not exists idx_member_profiles_group
  on member_profiles(fellowship_group_id);
