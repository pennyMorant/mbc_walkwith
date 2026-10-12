create table if not exists app_settings (
  key text primary key,
  category text not null,
  label text not null,
  description text not null default '',
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists idx_app_settings_category
  on app_settings(category);

insert into app_settings(key, category, label, description, value)
values
  (
    'church.name',
    'church',
    'Church name',
    'Display name used by app and admin surfaces.',
    '"MBC WalkWith"'::jsonb
  ),
  (
    'church.timezone',
    'church',
    'Church timezone',
    'Default timezone for schedules and reporting.',
    '"America/Los_Angeles"'::jsonb
  ),
  (
    'app.defaultLocale',
    'app',
    'Default locale',
    'Fallback locale for member-facing app copy.',
    '"en"'::jsonb
  ),
  (
    'features.prayerEnabled',
    'features',
    'Prayer enabled',
    'Controls whether prayer submission surfaces are shown.',
    'true'::jsonb
  ),
  (
    'features.givingEnabled',
    'features',
    'Giving enabled',
    'Controls whether giving surfaces are shown.',
    'true'::jsonb
  )
on conflict (key) do nothing;
