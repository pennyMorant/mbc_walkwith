create table if not exists prayer_requests (
  id uuid primary key default gen_random_uuid(),
  author_user_id text,
  title text not null,
  body text not null,
  visibility text not null default 'private',
  group_id text,
  status text not null default 'pending',
  submitter_name text not null default '',
  submitter_email text,
  moderation_note text not null default '',
  moderated_at timestamptz,
  moderated_by_admin_user_id uuid references admin_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_prayer_requests_author
  on prayer_requests(author_user_id);
create index if not exists idx_prayer_requests_status
  on prayer_requests(status);
create index if not exists idx_prayer_requests_visibility
  on prayer_requests(visibility);
create index if not exists idx_prayer_requests_group
  on prayer_requests(group_id);
create index if not exists idx_prayer_requests_created_at
  on prayer_requests(created_at);
