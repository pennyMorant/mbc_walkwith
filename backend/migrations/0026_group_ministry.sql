create table if not exists ministry_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  meeting_time text not null default '',
  location text not null default '',
  leader_name text not null default '',
  visibility text not null default 'members',
  status text not null default 'draft',
  capacity integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ministry_groups_status
  on ministry_groups(status);

create index if not exists idx_ministry_groups_visibility
  on ministry_groups(visibility);

create table if not exists group_applications (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references ministry_groups(id) on delete cascade,
  user_id text not null,
  member_display_name text not null default '',
  member_email text not null default '',
  status text not null default 'submitted',
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_group_applications_group
  on group_applications(group_id);

create index if not exists idx_group_applications_user
  on group_applications(user_id);

create index if not exists idx_group_applications_status
  on group_applications(status);

create unique index if not exists uq_group_applications_active_user
  on group_applications(group_id, user_id)
  where status = 'submitted';

create table if not exists group_memberships (
  group_id uuid not null references ministry_groups(id) on delete cascade,
  user_id text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create index if not exists idx_group_memberships_user
  on group_memberships(user_id);

create index if not exists idx_group_memberships_status
  on group_memberships(status);
