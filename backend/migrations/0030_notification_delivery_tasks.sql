create table if not exists notification_delivery_tasks (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  channel text not null default 'push' check (channel in ('push')),
  dedupe_key text not null,
  status text not null default 'queued'
    check (status in ('queued', 'sent', 'failed', 'retrying', 'cancelled')),
  payload jsonb not null default '{}'::jsonb,
  recipient_count integer not null default 0,
  attempts integer not null default 0,
  provider_evidence jsonb not null default '{}'::jsonb,
  last_error_code text,
  last_error_message text,
  next_attempt_at timestamptz,
  sent_at timestamptz,
  failed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_notification_delivery_tasks_dedupe
  on notification_delivery_tasks(dedupe_key);

create index if not exists idx_notification_delivery_tasks_status
  on notification_delivery_tasks(status);

create index if not exists idx_notification_delivery_tasks_retry
  on notification_delivery_tasks(status, next_attempt_at);
