alter table giving_transactions
  add column if not exists provider_checkout_session_id text;

alter table giving_transactions
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create index if not exists idx_giving_transactions_checkout_session
  on giving_transactions(provider, provider_checkout_session_id);

create unique index if not exists uq_giving_transactions_provider_transaction
  on giving_transactions(provider, provider_transaction_id)
  where provider_transaction_id is not null;

create unique index if not exists uq_giving_transactions_provider_checkout_session
  on giving_transactions(provider, provider_checkout_session_id)
  where provider_checkout_session_id is not null;
