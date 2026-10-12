delete from jobs
where type in (
  'sermon_import',
  'youtube_audio_import',
  'youtube_metadata_import'
);

alter table sermons
  drop column if exists youtube_video_id,
  drop column if exists youtube_url,
  drop column if exists youtube_channel_id,
  drop column if exists youtube_playlist_id;

delete from app_settings
where key = 'sermons.youtubeChannelId';
