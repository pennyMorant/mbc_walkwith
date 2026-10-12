create table if not exists care_requests (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  member_display_name text not null default '',
  member_email text not null default '',
  title text not null,
  body text not null,
  status text not null default 'submitted',
  privacy_level text not null default 'pastoral_only',
  assignee_admin_user_id uuid references admin_users(id) on delete set null,
  assignee_name text not null default '',
  next_follow_up_at timestamptz,
  internal_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_care_requests_user
  on care_requests(user_id);

create index if not exists idx_care_requests_status
  on care_requests(status);

create index if not exists idx_care_requests_assignee
  on care_requests(assignee_admin_user_id);

create table if not exists care_follow_ups (
  id uuid primary key default gen_random_uuid(),
  care_request_id uuid not null references care_requests(id) on delete cascade,
  author_admin_user_id uuid references admin_users(id) on delete set null,
  author_name text not null default '',
  note text not null,
  status text not null default 'completed',
  planned_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_care_follow_ups_request
  on care_follow_ups(care_request_id);
