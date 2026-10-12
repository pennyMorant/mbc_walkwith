alter table public_posts
  add column if not exists cta_label text,
  add column if not exists cta_url text;
