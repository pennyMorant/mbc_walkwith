create table if not exists payment_provider_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_event_id text not null,
  event_type text not null,
  status text not null default 'received',
  payload jsonb not null default '{}'::jsonb,
  error_message text,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

create unique index if not exists uq_payment_provider_events_provider_event
  on payment_provider_events(provider, provider_event_id);

create index if not exists idx_payment_provider_events_provider_status
  on payment_provider_events(provider, status);

create index if not exists idx_payment_provider_events_received_at
  on payment_provider_events(received_at);
