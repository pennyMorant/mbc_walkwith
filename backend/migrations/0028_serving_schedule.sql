create table if not exists serving_teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_serving_teams_status
  on serving_teams(status);

create table if not exists serving_roles (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references serving_teams(id) on delete cascade,
  name text not null,
  description text not null default '',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_serving_roles_team
  on serving_roles(team_id);

create index if not exists idx_serving_roles_status
  on serving_roles(status);

create table if not exists serving_assignments (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references serving_teams(id) on delete restrict,
  role_id uuid not null references serving_roles(id) on delete restrict,
  user_id text not null,
  member_display_name text not null default '',
  member_email text not null default '',
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text not null default '',
  status text not null default 'scheduled',
  note text not null default '',
  response_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_serving_assignments_user
  on serving_assignments(user_id, starts_at);

create index if not exists idx_serving_assignments_status
  on serving_assignments(status);

create index if not exists idx_serving_assignments_team
  on serving_assignments(team_id);
