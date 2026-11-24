-- ==============================================================================
-- CODELAB – INTERACTIVE CODING ACADEMY
-- Production PostgreSQL + Supabase Schema with Row Level Security (RLS)
-- ==============================================================================

create extension if not exists "pgcrypto";

-- 1. PROFILES (1-to-1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null default 'Học viên CODELAB',
  username text not null unique,
  avatar_url text,
  bio text not null default '',
  role text not null default 'student' check (role in ('student', 'admin')),
  xp integer not null default 0 check (xp >= 0),
  level integer not null default 1 check (level >= 1),
  theme text not null default 'dark' check (theme in ('dark', 'light')),
  preferred_language text not null default 'cpp' check (preferred_language in ('cpp', 'html', 'css', 'javascript')),
  total_study_minutes integer not null default 0 check (total_study_minutes >= 0),
  bugs_fixed_count integer not null default 0 check (bugs_fixed_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Helper function to check admin role safely inside RLS
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- 2. COURSES
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  subtitle text not null default '',
  language text not null check (language in ('cpp', 'html', 'css', 'javascript')),
  description text not null,
  target_audience text not null,
  learning_outcomes jsonb not null default '[]'::jsonb,
  difficulty text not null check (difficulty in ('Cơ bản', 'Trung cấp', 'Nâng cao')),
  estimated_hours numeric(5,1) not null default 10,
  icon text not null default 'code-2',
  accent_color text not null default 'blue',
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- 3. COURSE SECTIONS (CHAPTERS)
create table if not exists public.course_sections (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  description text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- 4. LESSONS
create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.course_sections(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  slug text not null,
  title text not null,
  summary text not null default '',
  estimated_minutes integer not null default 15,
  xp_reward integer not null default 50,
  sort_order integer not null default 0,
  language text not null check (language in ('cpp', 'html', 'css', 'javascript')),
  content_json jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, slug)
);

-- 5. COURSE ENROLLMENTS
create table if not exists public.course_enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  last_lesson_id uuid references public.lessons(id) on delete set null,
  enrolled_at timestamptz not null default now(),
  last_accessed_at timestamptz not null default now(),
  unique (user_id, course_id)
);

-- 6. LESSON PROGRESS
create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  status text not null default 'in_progress' check (status in ('not_started', 'in_progress', 'completed')),
  saved_code text,
  last_scroll_position integer not null default 0,
  checkpoint_passed boolean not null default false,
  time_spent_seconds integer not null default 0,
  xp_awarded boolean not null default false,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

-- 7. LESSON BOOKMARKS
create table if not exists public.lesson_bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

-- 8. EXERCISES (CODING CHALLENGES)
create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  slug text not null unique,
  title text not null,
  description text not null,
  category text not null,
  difficulty text not null check (difficulty in ('Easy', 'Medium', 'Hard')),
  language text not null default 'cpp' check (language in ('cpp', 'html', 'css', 'javascript')),
  input_format text not null,
  output_format text not null,
  constraints text not null,
  sample_input text not null default '',
  sample_output text not null default '',
  sample_explanation text not null default '',
  starter_code text not null,
  hints_json jsonb not null default '[]'::jsonb,
  solution_code text not null,
  solution_explanation text not null default '',
  time_limit_ms integer not null default 1000,
  memory_limit_kb integer not null default 262144,
  xp_reward integer not null default 75,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

-- 9. EXERCISE BOOKMARKS
create table if not exists public.exercise_bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, exercise_id)
);

-- 10. TEST CASES
create table if not exists public.test_cases (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  input_data text not null default '',
  expected_output text not null,
  is_sample boolean not null default false,
  sort_order integer not null default 0
);

-- 11. SUBMISSIONS
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  language text not null default 'cpp',
  source_code text not null,
  status text not null check (status in (
    'Accepted', 'Wrong Answer', 'Compilation Error',
    'Runtime Error', 'Time Limit Exceeded', 'Memory Limit Exceeded', 'Not Configured'
  )),
  passed_tests integer not null default 0,
  total_tests integer not null default 0,
  execution_time_ms integer,
  memory_used_kb integer,
  compiler_output text,
  stderr text,
  stdout text,
  test_results_json jsonb not null default '[]'::jsonb,
  xp_awarded integer not null default 0,
  created_at timestamptz not null default now()
);

-- 12. QUIZZES
create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  section_id uuid references public.course_sections(id) on delete set null,
  slug text not null unique,
  title text not null,
  description text not null default '',
  topic text not null,
  difficulty text not null check (difficulty in ('Cơ bản', 'Trung cấp', 'Nâng cao')),
  time_limit_minutes integer not null default 15,
  pass_score_percent integer not null default 70,
  xp_reward integer not null default 60,
  created_at timestamptz not null default now()
);

-- 13. QUIZ QUESTIONS
create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  question_type text not null check (question_type in (
    'single_choice', 'multiple_choice', 'true_false',
    'fill_blank', 'predict_output', 'find_bug'
  )),
  prompt text not null,
  code_snippet text,
  options_json jsonb not null default '[]'::jsonb,
  correct_answer_json jsonb not null,
  explanation text not null,
  topic_tag text not null,
  points integer not null default 10,
  sort_order integer not null default 0
);

-- 14. QUIZ ATTEMPTS
create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  score integer not null default 0,
  max_score integer not null default 0,
  percentage integer not null default 0,
  passed boolean not null default false,
  answers_json jsonb not null default '{}'::jsonb,
  weak_topics_json jsonb not null default '[]'::jsonb,
  xp_awarded integer not null default 0,
  duration_seconds integer not null default 0,
  created_at timestamptz not null default now()
);

-- 15. ACHIEVEMENTS & USER ACHIEVEMENTS
create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  description text not null,
  icon text not null default 'trophy',
  xp_bonus integer not null default 50,
  condition_type text not null,
  condition_value integer not null default 1
);

create table if not exists public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  unique (user_id, achievement_id)
);

-- 16. LEARNING STREAKS & DAILY ACTIVITY
create table if not exists public.learning_streaks (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_active_date date,
  updated_at timestamptz not null default now()
);

create table if not exists public.daily_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  activity_date date not null,
  lessons_completed integer not null default 0,
  exercises_solved integer not null default 0,
  quizzes_completed integer not null default 0,
  xp_earned integer not null default 0,
  study_minutes integer not null default 0,
  unique (user_id, activity_date)
);

-- 17. AI CONVERSATIONS & MESSAGES
create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'Cuộc trò chuyện mới',
  course_id uuid references public.courses(id) on delete set null,
  lesson_id uuid references public.lessons(id) on delete set null,
  exercise_id uuid references public.exercises(id) on delete set null,
  last_interaction_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  code_context text,
  created_at timestamptz not null default now()
);

-- 18. BUG REPORTS (ADMIN MODERATION)
create table if not exists public.bug_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('lesson', 'exercise', 'quiz', 'system')),
  target_id text not null,
  target_title text not null,
  description text not null,
  status text not null default 'open' check (status in ('open', 'in_review', 'resolved')),
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ==============================================================================
-- INDEXES
-- ==============================================================================
create index if not exists idx_sections_course on public.course_sections(course_id, sort_order);
create index if not exists idx_lessons_section on public.lessons(section_id, sort_order);
create index if not exists idx_lessons_course on public.lessons(course_id, sort_order);
create index if not exists idx_lesson_progress_user on public.lesson_progress(user_id, course_id);
create index if not exists idx_test_cases_exercise on public.test_cases(exercise_id, sort_order);
create index if not exists idx_submissions_user on public.submissions(user_id, exercise_id, created_at desc);
create index if not exists idx_quiz_questions_quiz on public.quiz_questions(quiz_id, sort_order);
create index if not exists idx_quiz_attempts_user on public.quiz_attempts(user_id, quiz_id, created_at desc);
create index if not exists idx_daily_activity_user_date on public.daily_activity(user_id, activity_date desc);
create index if not exists idx_ai_messages_conv on public.ai_messages(conversation_id, created_at asc);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================================================
alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.course_sections enable row level security;
alter table public.lessons enable row level security;
alter table public.course_enrollments enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.lesson_bookmarks enable row level security;
alter table public.exercises enable row level security;
alter table public.exercise_bookmarks enable row level security;
alter table public.test_cases enable row level security;
alter table public.submissions enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;
alter table public.learning_streaks enable row level security;
alter table public.daily_activity enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
alter table public.bug_reports enable row level security;

-- Profiles: users read/update only their own safe columns (XP/role updates only via service role / admin)
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (auth.uid() = id or public.is_admin());
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select role from public.profiles where id = auth.uid())
    and xp = (select xp from public.profiles where id = auth.uid())
    and level = (select level from public.profiles where id = auth.uid())
  );

-- Public catalog tables: readable by authenticated/public, writable only by admin
create policy "courses_read_published" on public.courses
  for select using (is_published = true or public.is_admin());
create policy "courses_admin_write" on public.courses
  for all using (public.is_admin()) with check (public.is_admin());

create policy "sections_read" on public.course_sections
  for select using (true);
create policy "sections_admin_write" on public.course_sections
  for all using (public.is_admin()) with check (public.is_admin());

create policy "lessons_read" on public.lessons
  for select using (true);
create policy "lessons_admin_write" on public.lessons
  for all using (public.is_admin()) with check (public.is_admin());

create policy "exercises_read_published" on public.exercises
  for select using (is_published = true or public.is_admin());
create policy "exercises_admin_write" on public.exercises
  for all using (public.is_admin()) with check (public.is_admin());

-- Hidden test cases are ONLY readable by server service role or admin; samples are public
create policy "test_cases_read_sample_or_admin" on public.test_cases
  for select using (is_sample = true or public.is_admin());
create policy "test_cases_admin_write" on public.test_cases
  for all using (public.is_admin()) with check (public.is_admin());

create policy "quizzes_read" on public.quizzes for select using (true);
create policy "quizzes_admin_write" on public.quizzes
  for all using (public.is_admin()) with check (public.is_admin());

create policy "quiz_questions_read" on public.quiz_questions for select using (true);
create policy "quiz_questions_admin_write" on public.quiz_questions
  for all using (public.is_admin()) with check (public.is_admin());

create policy "achievements_read" on public.achievements for select using (true);
create policy "achievements_admin_write" on public.achievements
  for all using (public.is_admin()) with check (public.is_admin());

-- Strictly user-owned private data
create policy "enrollments_own" on public.course_enrollments
  for all using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

create policy "lesson_progress_own" on public.lesson_progress
  for select using (auth.uid() = user_id or public.is_admin());

create policy "lesson_bookmarks_own" on public.lesson_bookmarks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "exercise_bookmarks_own" on public.exercise_bookmarks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "submissions_own_read" on public.submissions
  for select using (auth.uid() = user_id or public.is_admin());

create policy "quiz_attempts_own_read" on public.quiz_attempts
  for select using (auth.uid() = user_id or public.is_admin());

create policy "user_achievements_own_read" on public.user_achievements
  for select using (auth.uid() = user_id or public.is_admin());

create policy "streaks_own_read" on public.learning_streaks
  for select using (auth.uid() = user_id or public.is_admin());

create policy "daily_activity_own_read" on public.daily_activity
  for select using (auth.uid() = user_id or public.is_admin());

create policy "ai_conversations_own" on public.ai_conversations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "ai_messages_own" on public.ai_messages
  for all using (
    exists (
      select 1 from public.ai_conversations c
      where c.id = ai_messages.conversation_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.ai_conversations c
      where c.id = ai_messages.conversation_id and c.user_id = auth.uid()
    )
  );

create policy "bug_reports_own_or_admin" on public.bug_reports
  for select using (auth.uid() = user_id or public.is_admin());
create policy "bug_reports_insert_own" on public.bug_reports
  for insert with check (auth.uid() = user_id);
create policy "bug_reports_admin_update" on public.bug_reports
  for update using (public.is_admin());

-- Auto-create profile & learning streak on Supabase Auth signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
begin
  base_username := split_part(new.email, '@', 1) || '_' || substr(new.id::text, 1, 6);
  insert into public.profiles (id, email, full_name, username, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    base_username,
    'student'
  )
  on conflict (id) do nothing;

  insert into public.learning_streaks (user_id, current_streak, longest_streak)
  values (new.id, 0, 0)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
