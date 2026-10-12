create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  teacher_name text not null default '',
  location text not null default '',
  schedule_text text not null default '',
  visibility text not null default 'members',
  status text not null default 'draft',
  capacity integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_courses_status
  on courses(status);

create index if not exists idx_courses_visibility
  on courses(visibility);

create table if not exists course_lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  title text not null,
  description text not null default '',
  starts_at timestamptz,
  status text not null default 'scheduled',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_course_lessons_course_sort
  on course_lessons(course_id, sort_order);

create index if not exists idx_course_lessons_status
  on course_lessons(status);

create table if not exists course_enrollments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  user_id text not null,
  member_display_name text not null default '',
  member_email text not null default '',
  status text not null default 'enrolled',
  note text not null default '',
  completed_lesson_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_course_enrollments_course
  on course_enrollments(course_id);

create index if not exists idx_course_enrollments_user
  on course_enrollments(user_id);

create index if not exists idx_course_enrollments_status
  on course_enrollments(status);

create unique index if not exists uq_course_enrollments_active_user
  on course_enrollments(course_id, user_id)
  where status in ('submitted', 'enrolled', 'waitlisted');
