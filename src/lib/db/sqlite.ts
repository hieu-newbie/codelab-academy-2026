import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { SEED_ACHIEVEMENTS, SEED_COURSES } from "@/lib/seed/courses-meta";
import { CPP_LESSONS_PART1 } from "@/lib/seed/cpp-lessons-part1";
import { CPP_LESSONS_PART2 } from "@/lib/seed/cpp-lessons-part2";
import { WEB_LESSONS } from "@/lib/seed/web-lessons";
import { SEED_EXERCISES } from "@/lib/seed/exercises-seed";
import { SEED_QUIZZES } from "@/lib/seed/quizzes-seed";
import { seedDemoData } from "@/lib/db/demo-seed";

const globalForDb = globalThis as unknown as {
  __codelabDb?: DatabaseSync;
  __codelabDbInitialized?: boolean;
};

function getDbFilePath(): string {
  const custom = process.env.CODELAB_SQLITE_PATH;
  if (custom) return custom;
  const dir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return path.join(dir, "codelab.db");
}

function createSchema(db: DatabaseSync): void {
  db.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      reset_token TEXT,
      reset_token_expires TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      email TEXT NOT NULL UNIQUE,
      full_name TEXT NOT NULL DEFAULT 'Học viên CODELAB',
      username TEXT NOT NULL UNIQUE,
      avatar_url TEXT,
      bio TEXT NOT NULL DEFAULT '',
      role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
      xp INTEGER NOT NULL DEFAULT 0,
      level INTEGER NOT NULL DEFAULT 1,
      theme TEXT NOT NULL DEFAULT 'dark' CHECK (theme IN ('dark', 'light')),
      preferred_language TEXT NOT NULL DEFAULT 'cpp',
      total_study_minutes INTEGER NOT NULL DEFAULT 0,
      bugs_fixed_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      subtitle TEXT NOT NULL DEFAULT '',
      language TEXT NOT NULL CHECK (language IN ('cpp', 'html', 'css', 'javascript')),
      description TEXT NOT NULL,
      target_audience TEXT NOT NULL,
      learning_outcomes_json TEXT NOT NULL DEFAULT '[]',
      difficulty TEXT NOT NULL,
      estimated_hours REAL NOT NULL DEFAULT 10,
      icon TEXT NOT NULL DEFAULT 'code-2',
      accent_color TEXT NOT NULL DEFAULT 'blue',
      is_published INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS course_sections (
      id TEXT PRIMARY KEY,
      course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS lessons (
      id TEXT PRIMARY KEY,
      section_id TEXT NOT NULL REFERENCES course_sections(id) ON DELETE CASCADE,
      course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      slug TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL DEFAULT '',
      estimated_minutes INTEGER NOT NULL DEFAULT 15,
      xp_reward INTEGER NOT NULL DEFAULT 50,
      sort_order INTEGER NOT NULL DEFAULT 0,
      language TEXT NOT NULL,
      content_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE (course_id, slug)
    );

    CREATE TABLE IF NOT EXISTS course_enrollments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      last_lesson_id TEXT REFERENCES lessons(id) ON DELETE SET NULL,
      enrolled_at TEXT NOT NULL,
      last_accessed_at TEXT NOT NULL,
      UNIQUE (user_id, course_id)
    );

    CREATE TABLE IF NOT EXISTS lesson_progress (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
      course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('not_started', 'in_progress', 'completed')),
      saved_code TEXT,
      last_scroll_position INTEGER NOT NULL DEFAULT 0,
      checkpoint_passed INTEGER NOT NULL DEFAULT 0,
      time_spent_seconds INTEGER NOT NULL DEFAULT 0,
      xp_awarded INTEGER NOT NULL DEFAULT 0,
      completed_at TEXT,
      updated_at TEXT NOT NULL,
      UNIQUE (user_id, lesson_id)
    );

    CREATE TABLE IF NOT EXISTS lesson_bookmarks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      UNIQUE (user_id, lesson_id)
    );

    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      difficulty TEXT NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
      language TEXT NOT NULL DEFAULT 'cpp',
      input_format TEXT NOT NULL,
      output_format TEXT NOT NULL,
      constraints TEXT NOT NULL,
      sample_input TEXT NOT NULL DEFAULT '',
      sample_output TEXT NOT NULL DEFAULT '',
      sample_explanation TEXT NOT NULL DEFAULT '',
      starter_code TEXT NOT NULL,
      hints_json TEXT NOT NULL DEFAULT '[]',
      solution_code TEXT NOT NULL,
      solution_explanation TEXT NOT NULL DEFAULT '',
      time_limit_ms INTEGER NOT NULL DEFAULT 1000,
      memory_limit_kb INTEGER NOT NULL DEFAULT 262144,
      xp_reward INTEGER NOT NULL DEFAULT 75,
      is_published INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS exercise_bookmarks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      exercise_id TEXT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      UNIQUE (user_id, exercise_id)
    );

    CREATE TABLE IF NOT EXISTS test_cases (
      id TEXT PRIMARY KEY,
      exercise_id TEXT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
      input_data TEXT NOT NULL DEFAULT '',
      expected_output TEXT NOT NULL,
      is_sample INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS submissions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      exercise_id TEXT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
      language TEXT NOT NULL DEFAULT 'cpp',
      source_code TEXT NOT NULL,
      status TEXT NOT NULL,
      passed_tests INTEGER NOT NULL DEFAULT 0,
      total_tests INTEGER NOT NULL DEFAULT 0,
      execution_time_ms INTEGER,
      memory_used_kb INTEGER,
      compiler_output TEXT,
      stderr TEXT,
      stdout TEXT,
      test_results_json TEXT NOT NULL DEFAULT '[]',
      xp_awarded INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS quizzes (
      id TEXT PRIMARY KEY,
      course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      section_id TEXT REFERENCES course_sections(id) ON DELETE SET NULL,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      topic TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      time_limit_minutes INTEGER NOT NULL DEFAULT 15,
      pass_score_percent INTEGER NOT NULL DEFAULT 70,
      xp_reward INTEGER NOT NULL DEFAULT 60,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS quiz_questions (
      id TEXT PRIMARY KEY,
      quiz_id TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
      question_type TEXT NOT NULL,
      prompt TEXT NOT NULL,
      code_snippet TEXT,
      options_json TEXT NOT NULL DEFAULT '[]',
      correct_answer_json TEXT NOT NULL,
      explanation TEXT NOT NULL,
      topic_tag TEXT NOT NULL,
      points INTEGER NOT NULL DEFAULT 10,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      quiz_id TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
      score INTEGER NOT NULL DEFAULT 0,
      max_score INTEGER NOT NULL DEFAULT 0,
      percentage INTEGER NOT NULL DEFAULT 0,
      passed INTEGER NOT NULL DEFAULT 0,
      answers_json TEXT NOT NULL DEFAULT '{}',
      weak_topics_json TEXT NOT NULL DEFAULT '[]',
      xp_awarded INTEGER NOT NULL DEFAULT 0,
      duration_seconds INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS achievements (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT 'trophy',
      xp_bonus INTEGER NOT NULL DEFAULT 50,
      condition_type TEXT NOT NULL,
      condition_value INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS user_achievements (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      achievement_id TEXT NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
      unlocked_at TEXT NOT NULL,
      UNIQUE (user_id, achievement_id)
    );

    CREATE TABLE IF NOT EXISTS learning_streaks (
      user_id TEXT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
      current_streak INTEGER NOT NULL DEFAULT 0,
      longest_streak INTEGER NOT NULL DEFAULT 0,
      last_active_date TEXT,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS daily_activity (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      activity_date TEXT NOT NULL,
      lessons_completed INTEGER NOT NULL DEFAULT 0,
      exercises_solved INTEGER NOT NULL DEFAULT 0,
      quizzes_completed INTEGER NOT NULL DEFAULT 0,
      xp_earned INTEGER NOT NULL DEFAULT 0,
      study_minutes INTEGER NOT NULL DEFAULT 0,
      UNIQUE (user_id, activity_date)
    );

    CREATE TABLE IF NOT EXISTS ai_conversations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      title TEXT NOT NULL DEFAULT 'Cuộc trò chuyện mới',
      course_id TEXT REFERENCES courses(id) ON DELETE SET NULL,
      lesson_id TEXT REFERENCES lessons(id) ON DELETE SET NULL,
      exercise_id TEXT REFERENCES exercises(id) ON DELETE SET NULL,
      last_interaction_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ai_messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
      content TEXT NOT NULL,
      code_context TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bug_reports (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      target_title TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'resolved')),
      admin_note TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
}

function seedCurriculum(db: DatabaseSync): void {
  const existingCourses = db.prepare("SELECT COUNT(*) as cnt FROM courses").get() as { cnt: number };
  if (existingCourses.cnt > 0) {
    return;
  }

  const now = new Date().toISOString();

  const insertCourse = db.prepare(`
    INSERT OR IGNORE INTO courses
      (id, slug, title, subtitle, language, description, target_audience, learning_outcomes_json, difficulty, estimated_hours, icon, accent_color, is_published, sort_order, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
  `);
  const insertSection = db.prepare(`
    INSERT OR IGNORE INTO course_sections (id, course_id, title, description, sort_order, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const c of SEED_COURSES) {
    insertCourse.run(
      c.id,
      c.slug,
      c.title,
      c.subtitle,
      c.language,
      c.description,
      c.target_audience,
      JSON.stringify(c.learning_outcomes),
      c.difficulty,
      c.estimated_hours,
      c.icon,
      c.accent_color,
      c.sort_order,
      now
    );
    for (const s of c.sections) {
      insertSection.run(s.id, c.id, s.title, s.description, s.sort_order, now);
    }
  }

  const insertLesson = db.prepare(`
    INSERT OR IGNORE INTO lessons
      (id, section_id, course_id, slug, title, summary, estimated_minutes, xp_reward, sort_order, language, content_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const allLessons = [...CPP_LESSONS_PART1, ...CPP_LESSONS_PART2, ...WEB_LESSONS];
  for (const l of allLessons) {
    insertLesson.run(
      l.id,
      l.section_id,
      l.course_id,
      l.slug,
      l.title,
      l.summary,
      l.estimated_minutes,
      l.xp_reward,
      l.sort_order,
      l.language,
      JSON.stringify(l.content),
      now,
      now
    );
  }

  const insertExercise = db.prepare(`
    INSERT OR IGNORE INTO exercises
      (id, code, slug, title, description, category, difficulty, language, input_format, output_format, constraints, sample_input, sample_output, sample_explanation, starter_code, hints_json, solution_code, solution_explanation, time_limit_ms, memory_limit_kb, xp_reward, is_published, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
  `);
  const insertTestCase = db.prepare(`
    INSERT OR IGNORE INTO test_cases (id, exercise_id, input_data, expected_output, is_sample, sort_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const ex of SEED_EXERCISES) {
    insertExercise.run(
      ex.id,
      ex.code,
      ex.slug,
      ex.title,
      ex.description,
      ex.category,
      ex.difficulty,
      ex.language,
      ex.input_format,
      ex.output_format,
      ex.constraints,
      ex.sample_input,
      ex.sample_output,
      ex.sample_explanation,
      ex.starter_code,
      JSON.stringify(ex.hints),
      ex.solution_code,
      ex.solution_explanation,
      ex.time_limit_ms,
      ex.memory_limit_kb,
      ex.xp_reward,
      now
    );
    ex.test_cases.forEach((tc, idx) => {
      insertTestCase.run(
        `${ex.id}-tc-${idx + 1}`,
        ex.id,
        tc.input_data,
        tc.expected_output,
        tc.is_sample ? 1 : 0,
        idx + 1
      );
    });
  }

  const insertQuiz = db.prepare(`
    INSERT OR IGNORE INTO quizzes
      (id, course_id, section_id, slug, title, description, topic, difficulty, time_limit_minutes, pass_score_percent, xp_reward, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertQuestion = db.prepare(`
    INSERT OR IGNORE INTO quiz_questions
      (id, quiz_id, question_type, prompt, code_snippet, options_json, correct_answer_json, explanation, topic_tag, points, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const q of SEED_QUIZZES) {
    insertQuiz.run(
      q.id,
      q.course_id,
      q.section_id,
      q.slug,
      q.title,
      q.description,
      q.topic,
      q.difficulty,
      q.time_limit_minutes,
      q.pass_score_percent,
      q.xp_reward,
      now
    );
    for (const qq of q.questions) {
      insertQuestion.run(
        qq.id,
        q.id,
        qq.question_type,
        qq.prompt,
        qq.code_snippet,
        JSON.stringify(qq.options),
        JSON.stringify(qq.correct_answer),
        qq.explanation,
        qq.topic_tag,
        qq.points,
        qq.sort_order
      );
    }
  }

  const insertAch = db.prepare(`
    INSERT OR IGNORE INTO achievements (id, code, title, description, icon, xp_bonus, condition_type, condition_value)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const a of SEED_ACHIEVEMENTS) {
    insertAch.run(a.id, a.code, a.title, a.description, a.icon, a.xp_bonus, a.condition_type, a.condition_value);
  }
}

function ensureSeedTestCaseUpgrades(db: DatabaseSync): void {
  // Ensure CL-001 (ex-001) has the complete 7 accurate edge-case tests even on pre-existing local SQLite DBs
  const ex001 = SEED_EXERCISES.find((e) => e.id === "ex-001");
  if (!ex001) return;
  const existing = db
    .prepare("SELECT input_data, expected_output, is_sample FROM test_cases WHERE exercise_id = 'ex-001' ORDER BY sort_order ASC")
    .all() as Array<{ input_data: string; expected_output: string; is_sample: number }>;
  const matchesSeed =
    existing.length === ex001.test_cases.length &&
    existing.every(
      (tc, idx) =>
        tc.input_data === ex001.test_cases[idx].input_data &&
        tc.expected_output === ex001.test_cases[idx].expected_output &&
        Boolean(tc.is_sample) === ex001.test_cases[idx].is_sample
    );
  if (existing.length > 0 && !matchesSeed) {
    db.prepare("UPDATE exercises SET constraints = ?, solution_explanation = ? WHERE id = 'ex-001'").run(
      ex001.constraints,
      ex001.solution_explanation
    );
    db.prepare("DELETE FROM test_cases WHERE exercise_id = 'ex-001'").run();
    const insertTc = db.prepare(
      "INSERT INTO test_cases (id, exercise_id, input_data, expected_output, is_sample, sort_order) VALUES (?, ?, ?, ?, ?, ?)"
    );
    ex001.test_cases.forEach((tc, idx) => {
      insertTc.run(`ex-001-tc-${idx + 1}`, "ex-001", tc.input_data, tc.expected_output, tc.is_sample ? 1 : 0, idx + 1);
    });
  }
}

export function getDb(): DatabaseSync {
  if (!globalForDb.__codelabDb) {
    const dbPath = getDbFilePath();
    globalForDb.__codelabDb = new DatabaseSync(dbPath);
  }
  if (!globalForDb.__codelabDbInitialized) {
    createSchema(globalForDb.__codelabDb);
    seedCurriculum(globalForDb.__codelabDb);
    ensureSeedTestCaseUpgrades(globalForDb.__codelabDb);
    seedDemoData(globalForDb.__codelabDb);
    globalForDb.__codelabDbInitialized = true;
  }
  return globalForDb.__codelabDb;
}

/**
 * Helper for isolated unit/integration tests using an in-memory database.
 */
export function createTestDb(withDemo = false): DatabaseSync {
  const db = new DatabaseSync(":memory:");
  createSchema(db);
  seedCurriculum(db);
  if (withDemo) {
    const prev = process.env.ENABLE_DEMO_SEED;
    process.env.ENABLE_DEMO_SEED = "true";
    seedDemoData(db);
    process.env.ENABLE_DEMO_SEED = prev;
  }
  return db;
}
