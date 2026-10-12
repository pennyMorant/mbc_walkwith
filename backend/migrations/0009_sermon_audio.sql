alter table sermons
  add column if not exists audio_storage_path text;
alter table sermons
  add column if not exists audio_url text;
alter table sermons
  add column if not exists audio_file_name text;
alter table sermons
  add column if not exists audio_mime_type text;
alter table sermons
  add column if not exists audio_size_bytes integer not null default 0;
alter table sermons
  add column if not exists audio_status text not null default 'missing';
alter table sermons
  add column if not exists audio_uploaded_at timestamptz;

create index if not exists idx_sermons_audio_status on sermons(audio_status);
