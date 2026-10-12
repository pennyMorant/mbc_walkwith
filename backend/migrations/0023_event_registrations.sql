alter table public_posts
  add column if not exists registration_enabled boolean not null default false;

alter table public_posts
  add column if not exists registration_capacity integer;

alter table public_posts
  add column if not exists registration_deadline timestamptz;

alter table public_posts
  add column if not exists registration_allow_cancellation boolean not null default true;

alter table public_posts
  add column if not exists registration_max_party_size integer not null default 1;

create index if not exists idx_public_posts_registration
  on public_posts(registration_enabled);

create table if not exists event_registrations (
  id uuid primary key default gen_random_uuid(),
  life_post_id uuid not null references public_posts(id) on delete cascade,
  user_id text,
  attendee_name text not null default '',
  attendee_email text,
  party_size integer not null default 1,
  status text not null default 'confirmed',
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table event_registrations
  alter column user_id drop not null;

create index if not exists idx_event_registrations_event
  on event_registrations(life_post_id);

create index if not exists idx_event_registrations_user
  on event_registrations(user_id);

create index if not exists idx_event_registrations_status
  on event_registrations(status);

create unique index if not exists uq_event_registrations_active_user
  on event_registrations(life_post_id, user_id)
  where status in ('confirmed', 'checked_in');
