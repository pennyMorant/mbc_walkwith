create table if not exists giving_funds (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text not null default '',
  status text not null default 'draft',
  target_amount_cents integer,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_giving_funds_status
  on giving_funds(status);

create index if not exists idx_giving_funds_display_order
  on giving_funds(display_order);

insert into giving_funds (code, name, description, status, display_order)
values
  ('offering', 'General Offering', 'General church offering.', 'active', 10),
  ('missions', 'Missions', 'Missions and outreach giving.', 'active', 20),
  ('building', 'Building Fund', 'Building and facility giving.', 'paused', 30)
on conflict (code) do nothing;

alter table giving_transactions
  add column if not exists fund_id uuid references giving_funds(id) on delete set null;

update giving_transactions
set fund_id = giving_funds.id
from giving_funds
where giving_transactions.fund_id is null
  and giving_transactions.category = giving_funds.code;

create index if not exists idx_giving_transactions_fund
  on giving_transactions(fund_id);
