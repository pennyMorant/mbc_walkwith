alter table public_posts
  add column if not exists status text not null default 'draft';

update public_posts
set status = case
  when visibility in ('public', 'members') then 'published'
  else 'draft'
end
where status = 'draft';

create index if not exists idx_public_posts_status
  on public_posts(status);
