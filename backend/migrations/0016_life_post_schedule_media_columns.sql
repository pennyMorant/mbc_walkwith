alter table public_posts
  add column if not exists starts_at timestamptz,
  add column if not exists ends_at timestamptz,
  add column if not exists image_url text;

create index if not exists idx_public_posts_starts_at
  on public_posts(starts_at);
