import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db/sqlite";
import { getSystemConfigStatus } from "@/lib/db/supabase-client";

export async function GET() {
  const { errorResponse } = await requireAdmin();
  if (errorResponse) return errorResponse;

  const db = getDb();

  const stats = {
    total_users: (db.prepare("SELECT COUNT(*) as c FROM profiles").get() as { c: number }).c,
    total_courses: (db.prepare("SELECT COUNT(*) as c FROM courses").get() as { c: number }).c,
    total_lessons: (db.prepare("SELECT COUNT(*) as c FROM lessons").get() as { c: number }).c,
    total_exercises: (db.prepare("SELECT COUNT(*) as c FROM exercises").get() as { c: number }).c,
    total_submissions: (db.prepare("SELECT COUNT(*) as c FROM submissions").get() as { c: number }).c,
    total_quizzes: (db.prepare("SELECT COUNT(*) as c FROM quizzes").get() as { c: number }).c,
    total_quiz_attempts: (db.prepare("SELECT COUNT(*) as c FROM quiz_attempts").get() as { c: number }).c,
    open_bug_reports: (
      db.prepare("SELECT COUNT(*) as c FROM bug_reports WHERE status != 'resolved'").get() as { c: number }
    ).c,
  };

  const users = db.prepare(`
    SELECT p.id, p.email, p.full_name, p.username, p.role, p.xp, p.level, p.total_study_minutes, p.created_at,
           (SELECT COUNT(*) FROM lesson_progress lp WHERE lp.user_id = p.id AND lp.status = 'completed') as completed_lessons,
           (SELECT COUNT(DISTINCT s.exercise_id) FROM submissions s WHERE s.user_id = p.id AND s.status = 'Accepted') as solved_exercises
    FROM profiles p
    ORDER BY p.created_at DESC
  `).all();

  const courses = db.prepare(`
    SELECT c.*,
           (SELECT COUNT(*) FROM course_sections cs WHERE cs.course_id = c.id) as section_count,
           (SELECT COUNT(*) FROM lessons l WHERE l.course_id = c.id) as lesson_count
    FROM courses c
    ORDER BY c.sort_order ASC
  `).all();

  const sections = db
    .prepare("SELECT * FROM course_sections ORDER BY course_id ASC, sort_order ASC")
    .all();

  const lessons = db.prepare(`
    SELECT l.id, l.section_id, l.course_id, l.slug, l.title, l.summary, l.estimated_minutes, l.xp_reward, l.sort_order, l.language, l.content_json, l.updated_at,
           c.title as course_title, cs.title as section_title
    FROM lessons l
    JOIN courses c ON c.id = l.course_id
    JOIN course_sections cs ON cs.id = l.section_id
    ORDER BY c.sort_order ASC, cs.sort_order ASC, l.sort_order ASC
  `).all();

  const exercises = db.prepare(`
    SELECT e.*,
           (SELECT COUNT(*) FROM test_cases tc WHERE tc.exercise_id = e.id) as test_case_count
    FROM exercises e
    ORDER BY e.code ASC
  `).all() as Array<Record<string, unknown> & { id: string }>;

  const exercisesWithTests = exercises.map((ex) => ({
    ...ex,
    hints: JSON.parse(String(ex.hints_json || "[]")),
    test_cases: db
      .prepare("SELECT * FROM test_cases WHERE exercise_id = ? ORDER BY sort_order ASC")
      .all(ex.id),
  }));

  const quizzes = db.prepare(`
    SELECT q.*, c.title as course_title
    FROM quizzes q
    JOIN courses c ON c.id = q.course_id
    ORDER BY q.created_at ASC
  `).all() as Array<Record<string, unknown> & { id: string }>;

  const quizzesWithQuestions = quizzes.map((q) => ({
    ...q,
    questions: (
      db
        .prepare("SELECT * FROM quiz_questions WHERE quiz_id = ? ORDER BY sort_order ASC")
        .all(q.id) as Array<Record<string, unknown>>
    ).map((qq) => ({
      ...qq,
      options: JSON.parse(String(qq.options_json || "[]")),
      correct_answer: JSON.parse(String(qq.correct_answer_json || '""')),
    })),
  }));

  const bugReports = db.prepare(`
    SELECT br.*, p.full_name as reporter_name, p.email as reporter_email
    FROM bug_reports br
    JOIN profiles p ON p.id = br.user_id
    ORDER BY CASE br.status WHEN 'open' THEN 0 WHEN 'in_review' THEN 1 ELSE 2 END, br.created_at DESC
  `).all();

  return NextResponse.json({
    stats,
    users,
    courses,
    sections,
    lessons,
    exercises: exercisesWithTests,
    quizzes: quizzesWithQuestions,
    bug_reports: bugReports,
    system_status: getSystemConfigStatus(),
  });
}
