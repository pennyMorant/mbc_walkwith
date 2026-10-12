alter table public_posts
  add column if not exists meta text not null default '',
  add column if not exists icon_name text not null default 'church';

do $$
declare
  post_record record;
  parsed_body jsonb;
begin
  for post_record in
    select id, body, meta, icon_name
    from public_posts
    where body ~ '^\\s*\\{'
  loop
    begin
      parsed_body := post_record.body::jsonb;
      update public_posts
      set
        body = coalesce(parsed_body ->> 'body', post_record.body),
        meta = coalesce(parsed_body ->> 'meta', post_record.meta),
        icon_name = coalesce(parsed_body ->> 'iconName', post_record.icon_name)
      where id = post_record.id;
    exception when others then
      null;
    end;
  end loop;
end $$;
