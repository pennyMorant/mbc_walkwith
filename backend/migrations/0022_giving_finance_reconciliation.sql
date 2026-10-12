alter table giving_transactions
  add column if not exists fee_cents integer not null default 0;

alter table giving_transactions
  add column if not exists net_amount_cents integer not null default 0;

alter table giving_transactions
  add column if not exists refunded_amount_cents integer not null default 0;

alter table giving_transactions
  add column if not exists reconciliation_status text not null default 'unreconciled';

alter table giving_transactions
  add column if not exists payout_id text;

alter table giving_transactions
  add column if not exists available_on timestamptz;

alter table giving_transactions
  add column if not exists dispute_id text;

alter table giving_transactions
  add column if not exists dispute_status text not null default 'none';

alter table giving_transactions
  add column if not exists disputed_amount_cents integer not null default 0;

update giving_transactions
set net_amount_cents = amount_cents
where net_amount_cents = 0
  and status = 'succeeded';

create index if not exists idx_giving_transactions_reconciliation
  on giving_transactions(reconciliation_status);

create index if not exists idx_giving_transactions_payout
  on giving_transactions(provider, payout_id);

create index if not exists idx_giving_transactions_dispute
  on giving_transactions(provider, dispute_id);
