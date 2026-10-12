create table if not exists member_login_codes (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_member_login_codes_email
  on member_login_codes(email);
create index if not exists idx_member_login_codes_expires_at
  on member_login_codes(expires_at);

create table if not exists member_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token_id text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_member_sessions_user
  on member_sessions(user_id);
create index if not exists idx_member_sessions_token
  on member_sessions(token_id);
create index if not exists idx_member_sessions_expires_at
  on member_sessions(expires_at);
