alter table event_registrations
  add column if not exists checked_in_at timestamptz;

alter table event_registrations
  add column if not exists check_in_method text;

alter table event_registrations
  add column if not exists checked_in_by_admin_user_id uuid references admin_users(id) on delete set null;

create index if not exists idx_event_registrations_checked_in_at
  on event_registrations(checked_in_at);

create index if not exists idx_event_registrations_check_in_method
  on event_registrations(check_in_method);
