create table if not exists giving_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id text,
  donor_name text not null default '',
  donor_email text,
  provider text not null,
  provider_transaction_id text,
  amount_cents integer not null,
  currency text not null default 'USD',
  category text not null,
  status text not null default 'pending',
  given_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_giving_transactions_user
  on giving_transactions(user_id);
create index if not exists idx_giving_transactions_status
  on giving_transactions(status);
create index if not exists idx_giving_transactions_category
  on giving_transactions(category);
create index if not exists idx_giving_transactions_given_at
  on giving_transactions(given_at);
create index if not exists idx_giving_transactions_provider
  on giving_transactions(provider, provider_transaction_id);

create table if not exists annual_statements (
  id uuid primary key default gen_random_uuid(),
  user_id text,
  donor_name text not null default '',
  donor_email text,
  tax_year integer not null,
  total_amount_cents integer not null default 0,
  currency text not null default 'USD',
  pdf_object_key text,
  status text not null default 'pending',
  generated_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists idx_annual_statements_user
  on annual_statements(user_id);
create index if not exists idx_annual_statements_tax_year
  on annual_statements(tax_year);
create index if not exists idx_annual_statements_status
  on annual_statements(status);
