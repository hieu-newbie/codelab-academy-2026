import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db/sqlite";
import { getSystemConfigStatus } from "@/lib/db/supabase-client";
import type { CourseLanguage, CourseRecord, DailyActivityPoint } from "@/types/codelab";

function buildDateWindow(days: number): string[] {
  const dates: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

function formatDayLabel(isoDate: string): string {
  const [, m, d] = isoDate.split("-");
  return `${d}/${m}`;
}

export async function GET() {
  const { user, errorResponse } = await requireUser();
  if (errorResponse || !user) return errorResponse;

  const db = getDb();

  // Streak
  const streakRow = db
    .prepare("SELECT current_streak, longest_streak, last_active_date FROM learning_streaks WHERE user_id = ?")
    .get(user.id) as
    | { current_streak: number; longest_streak: number; last_active_date: string | null }
    | undefined;

  // Core stats from REAL DB rows
  const completedLessonsRow = db
    .prepare("SELECT COUNT(*) as c FROM lesson_progress WHERE user_id = ? AND status = 'completed'")
    .get(user.id) as { c: number };
  const totalLessonsRow = db.prepare("SELECT COUNT(*) as c FROM lessons").get() as { c: number };
  const solvedExercisesRow = db
    .prepare("SELECT COUNT(DISTINCT exercise_id) as c FROM submissions WHERE user_id = ? AND status = 'Accepted'")
    .get(user.id) as { c: number };
  const totalSubmissionsRow = db
    .prepare("SELECT COUNT(*) as c FROM submissions WHERE user_id = ? AND status != 'Not Configured'")
    .get(user.id) as { c: number };
  const acceptedSubmissionsRow = db
    .prepare("SELECT COUNT(*) as c FROM submissions WHERE user_id = ? AND status = 'Accepted'")
    .get(user.id) as { c: number };
  const quizzesPassedRow = db
    .prepare("SELECT COUNT(DISTINCT quiz_id) as c FROM quiz_attempts WHERE user_id = ? AND passed = 1")
    .get(user.id) as { c: number };

  const accuracyRate =
    totalSubmissionsRow.c > 0
      ? Math.round((acceptedSubmissionsRow.c / totalSubmissionsRow.c) * 100)
      : 0;

  // Enrolled courses with real progress
  const courseRows = db.prepare(`
    SELECT c.*,
           (SELECT COUNT(*) FROM course_sections cs WHERE cs.course_id = c.id) as section_count,
           (SELECT COUNT(*) FROM lessons l WHERE l.course_id = c.id) as lesson_count,
           (SELECT COUNT(*) FROM lesson_progress lp WHERE lp.course_id = c.id AND lp.user_id = ? AND lp.status = 'completed') as completed_lessons,
           ce.last_accessed_at
    FROM course_enrollments ce
    JOIN courses c ON c.id = ce.course_id
    WHERE ce.user_id = ?
    ORDER BY ce.last_accessed_at DESC
  `).all(user.id, user.id) as Array<
    Record<string, unknown> & {
      learning_outcomes_json: string;
      lesson_count: number;
      completed_lessons: number;
    }
  >;

  const enrolledCourses: CourseRecord[] = courseRows.map((r) => ({
    id: String(r.id),
    slug: String(r.slug),
    title: String(r.title),
    subtitle: String(r.subtitle),
    language: r.language as CourseLanguage,
    description: String(r.description),
    target_audience: String(r.target_audience),
    learning_outcomes: JSON.parse(r.learning_outcomes_json || "[]"),
    difficulty: r.difficulty as CourseRecord["difficulty"],
    estimated_hours: Number(r.estimated_hours),
    icon: String(r.icon),
    accent_color: String(r.accent_color),
    is_published: Boolean(r.is_published),
    sort_order: Number(r.sort_order),
    section_count: Number(r.section_count),
    lesson_count: Number(r.lesson_count),
    completed_lessons: Number(r.completed_lessons),
    progress_percent:
      r.lesson_count > 0 ? Math.round((r.completed_lessons / r.lesson_count) * 100) : 0,
    enrolled: true,
  }));

  // In-progress lessons
  const inProgressLessons = db.prepare(`
    SELECT lp.lesson_id, l.slug as lesson_slug, l.title as lesson_title,
           c.slug as course_slug, c.title as course_title, l.language, lp.updated_at,
           cs.title as section_title
    FROM lesson_progress lp
    JOIN lessons l ON l.id = lp.lesson_id
    JOIN courses c ON c.id = lp.course_id
    JOIN course_sections cs ON cs.id = l.section_id
    WHERE lp.user_id = ? AND lp.status = 'in_progress'
    ORDER BY lp.updated_at DESC
    LIMIT 6
  `).all(user.id) as Array<{
    lesson_id: string;
    lesson_slug: string;
    lesson_title: string;
    course_slug: string;
    course_title: string;
    section_title: string;
    language: CourseLanguage;
    updated_at: string;
  }>;

  // Recommended next lessons (not yet completed, prioritizing enrolled courses then C++ intro)
  const recommendedLessons = db.prepare(`
    SELECT l.id as lesson_id, l.slug as lesson_slug, l.title as lesson_title,
           c.slug as course_slug, c.title as course_title, cs.title as section_title,
           l.estimated_minutes, l.xp_reward, l.language,
           CASE WHEN ce.id IS NOT NULL THEN 0 ELSE 1 END as priority
    FROM lessons l
    JOIN courses c ON c.id = l.course_id
    JOIN course_sections cs ON cs.id = l.section_id
    LEFT JOIN course_enrollments ce ON ce.course_id = c.id AND ce.user_id = ?
    LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = ?
    WHERE lp.status IS NULL OR lp.status != 'completed'
    ORDER BY priority ASC, c.sort_order ASC, cs.sort_order ASC, l.sort_order ASC
    LIMIT 4
  `).all(user.id, user.id) as Array<{
    lesson_id: string;
    lesson_slug: string;
    lesson_title: string;
    course_slug: string;
    course_title: string;
    section_title: string;
    estimated_minutes: number;
    xp_reward: number;
    language: CourseLanguage;
  }>;

  const continueLesson =
    inProgressLessons[0]
      ? {
          lesson_slug: inProgressLessons[0].lesson_slug,
          lesson_title: inProgressLessons[0].lesson_title,
          course_slug: inProgressLessons[0].course_slug,
          course_title: inProgressLessons[0].course_title,
          section_title: inProgressLessons[0].section_title,
          language: inProgressLessons[0].language,
        }
      : recommendedLessons[0]
      ? {
          lesson_slug: recommendedLessons[0].lesson_slug,
          lesson_title: recommendedLessons[0].lesson_title,
          course_slug: recommendedLessons[0].course_slug,
          course_title: recommendedLessons[0].course_title,
          section_title: recommendedLessons[0].section_title,
          language: recommendedLessons[0].language,
        }
      : null;

  // Achievements
  const achievements = db.prepare(`
    SELECT a.*, ua.unlocked_at, CASE WHEN ua.id IS NOT NULL THEN 1 ELSE 0 END as unlocked
    FROM achievements a
    LEFT JOIN user_achievements ua ON ua.achievement_id = a.id AND ua.user_id = ?
    ORDER BY unlocked DESC, a.xp_bonus ASC
  `).all(user.id);

  // Activity charts (daily 7d, weekly 4w, monthly 6m) from real daily_activity rows
  const rawActivity = db.prepare(`
    SELECT activity_date, lessons_completed, exercises_solved, quizzes_completed, xp_earned, study_minutes
    FROM daily_activity
    WHERE user_id = ?
    ORDER BY activity_date ASC
  `).all(user.id) as Array<{
    activity_date: string;
    lessons_completed: number;
    exercises_solved: number;
    quizzes_completed: number;
    xp_earned: number;
    study_minutes: number;
  }>;

  const actMap = new Map(rawActivity.map((r) => [r.activity_date, r]));

  const activityDaily: DailyActivityPoint[] = buildDateWindow(7).map((date) => {
    const r = actMap.get(date);
    return {
      date,
      label: formatDayLabel(date),
      lessons_completed: r?.lessons_completed ?? 0,
      exercises_solved: r?.exercises_solved ?? 0,
      quizzes_completed: r?.quizzes_completed ?? 0,
      xp_earned: r?.xp_earned ?? 0,
      study_minutes: r?.study_minutes ?? 0,
    };
  });

  // Weekly aggregation (last 4 weeks)
  const last28 = buildDateWindow(28);
  const activityWeekly: DailyActivityPoint[] = [];
  for (let w = 0; w < 4; w++) {
    const slice = last28.slice(w * 7, w * 7 + 7);
    const agg = slice.reduce(
      (acc, d) => {
        const r = actMap.get(d);
        if (r) {
          acc.lessons_completed += r.lessons_completed;
          acc.exercises_solved += r.exercises_solved;
          acc.quizzes_completed += r.quizzes_completed;
          acc.xp_earned += r.xp_earned;
          acc.study_minutes += r.study_minutes;
        }
        return acc;
      },
      { lessons_completed: 0, exercises_solved: 0, quizzes_completed: 0, xp_earned: 0, study_minutes: 0 }
    );
    activityWeekly.push({
      date: slice[0],
      label: `Tuần ${w + 1}`,
      ...agg,
    });
  }

  // Monthly aggregation (last 6 months)
  const activityMonthly: DailyActivityPoint[] = [];
  const now = new Date();
  for (let m = 5; m >= 0; m--) {
    const dt = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const prefix = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
    const agg = rawActivity
      .filter((r) => r.activity_date.startsWith(prefix))
      .reduce(
        (acc, r) => {
          acc.lessons_completed += r.lessons_completed;
          acc.exercises_solved += r.exercises_solved;
          acc.quizzes_completed += r.quizzes_completed;
          acc.xp_earned += r.xp_earned;
          acc.study_minutes += r.study_minutes;
          return acc;
        },
        { lessons_completed: 0, exercises_solved: 0, quizzes_completed: 0, xp_earned: 0, study_minutes: 0 }
      );
    activityMonthly.push({
      date: `${prefix}-01`,
      label: `T${dt.getMonth() + 1}/${String(dt.getFullYear()).slice(2)}`,
      ...agg,
    });
  }

  // Weak topics across quiz attempts
  const attemptRows = db
    .prepare("SELECT weak_topics_json FROM quiz_attempts WHERE user_id = ?")
    .all(user.id) as Array<{ weak_topics_json: string }>;
  const topicCounts = new Map<string, number>();
  for (const a of attemptRows) {
    try {
      const topics = JSON.parse(a.weak_topics_json || "[]") as string[];
      for (const t of topics) {
        topicCounts.set(t, (topicCounts.get(t) ?? 0) + 1);
      }
    } catch {
      // ignore malformed
    }
  }
  const weakTopics = Array.from(topicCounts.entries())
    .map(([topic, misses]) => ({ topic, misses }))
    .sort((a, b) => b.misses - a.misses)
    .slice(0, 6);

  return NextResponse.json({
    profile: user,
    streak: {
      current_streak: streakRow?.current_streak ?? 0,
      longest_streak: streakRow?.longest_streak ?? 0,
      last_active_date: streakRow?.last_active_date ?? null,
    },
    stats: {
      completed_lessons: completedLessonsRow.c,
      total_lessons: totalLessonsRow.c,
      solved_exercises: solvedExercisesRow.c,
      total_submissions: totalSubmissionsRow.c,
      accepted_submissions: acceptedSubmissionsRow.c,
      accuracy_rate: accuracyRate,
      total_study_minutes: user.total_study_minutes,
      quizzes_passed: quizzesPassedRow.c,
    },
    enrolled_courses: enrolledCourses,
    in_progress_lessons: inProgressLessons,
    continue_lesson: continueLesson,
    recommended_lessons: recommendedLessons,
    achievements,
    activity_daily: activityDaily,
    activity_weekly: activityWeekly,
    activity_monthly: activityMonthly,
    weak_topics: weakTopics,
    system_status: getSystemConfigStatus(),
  });
}
