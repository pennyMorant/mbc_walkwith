alter table public_posts
  add column if not exists is_pinned boolean not null default false;

create index if not exists idx_public_posts_is_pinned
  on public_posts(is_pinned);
