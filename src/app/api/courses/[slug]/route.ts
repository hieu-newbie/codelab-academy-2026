import { NextResponse } from "next/server";
import { getSessionUser, requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db/sqlite";
import { generateId } from "@/lib/crypto";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const user = await getSessionUser();
  const db = getDb();

  const course = db
    .prepare("SELECT * FROM courses WHERE slug = ?")
    .get(slug) as (Record<string, unknown> & { id: string; learning_outcomes_json: string }) | undefined;

  if (!course) {
    return NextResponse.json({ error: "Không tìm thấy khóa học." }, { status: 404 });
  }

  const sections = db
    .prepare("SELECT * FROM course_sections WHERE course_id = ? ORDER BY sort_order ASC")
    .all(course.id) as Array<{ id: string; course_id: string; title: string; description: string; sort_order: number }>;

  const lessons = db
    .prepare(`
      SELECT id, section_id, course_id, slug, title, summary, estimated_minutes, xp_reward, sort_order, language
      FROM lessons
      WHERE course_id = ?
      ORDER BY sort_order ASC
    `)
    .all(course.id) as Array<{
    id: string;
    section_id: string;
    course_id: string;
    slug: string;
    title: string;
    summary: string;
    estimated_minutes: number;
    xp_reward: number;
    sort_order: number;
    language: string;
  }>;

  const progressMap = new Map<string, string>();
  const bookmarkSet = new Set<string>();
  let enrolled = false;

  if (user) {
    const progs = db
      .prepare("SELECT lesson_id, status FROM lesson_progress WHERE user_id = ? AND course_id = ?")
      .all(user.id, course.id) as Array<{ lesson_id: string; status: string }>;
    progs.forEach((p) => progressMap.set(p.lesson_id, p.status));

    const bms = db
      .prepare("SELECT lesson_id FROM lesson_bookmarks WHERE user_id = ?")
      .all(user.id) as Array<{ lesson_id: string }>;
    bms.forEach((b) => bookmarkSet.add(b.lesson_id));

    enrolled = Boolean(
      db
        .prepare("SELECT id FROM course_enrollments WHERE user_id = ? AND course_id = ?")
        .get(user.id, course.id)
    );
  }

  const lessonsBySection = new Map<string, typeof lessons>();
  for (const l of lessons) {
    const arr = lessonsBySection.get(l.section_id) ?? [];
    arr.push(l);
    lessonsBySection.set(l.section_id, arr);
  }

  const completedCount = lessons.filter((l) => progressMap.get(l.id) === "completed").length;

  const enrichedSections = sections.map((sec) => ({
    ...sec,
    lessons: (lessonsBySection.get(sec.id) ?? []).map((l) => ({
      ...l,
      status: progressMap.get(l.id) ?? "not_started",
      bookmarked: bookmarkSet.has(l.id),
    })),
  }));

  const relatedQuizzes = db
    .prepare("SELECT id, slug, title, topic, difficulty, time_limit_minutes, xp_reward FROM quizzes WHERE course_id = ?")
    .all(course.id);

  return NextResponse.json({
    course: {
      id: course.id,
      slug: course.slug,
      title: course.title,
      subtitle: course.subtitle,
      language: course.language,
      description: course.description,
      target_audience: course.target_audience,
      learning_outcomes: JSON.parse(course.learning_outcomes_json || "[]"),
      difficulty: course.difficulty,
      estimated_hours: Number(course.estimated_hours),
      icon: course.icon,
      accent_color: course.accent_color,
      section_count: sections.length,
      lesson_count: lessons.length,
      completed_lessons: completedCount,
      progress_percent: lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0,
      enrolled,
    },
    sections: enrichedSections,
    quizzes: relatedQuizzes,
  });
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { user, errorResponse } = await requireUser();
  if (errorResponse || !user) return errorResponse;

  const { slug } = await context.params;
  const db = getDb();
  const course = db.prepare("SELECT id FROM courses WHERE slug = ?").get(slug) as { id: string } | undefined;
  if (!course) {
    return NextResponse.json({ error: "Không tìm thấy khóa học." }, { status: 404 });
  }

  const now = new Date().toISOString();
  const existing = db
    .prepare("SELECT id FROM course_enrollments WHERE user_id = ? AND course_id = ?")
    .get(user.id, course.id) as { id: string } | undefined;

  if (existing) {
    db.prepare("UPDATE course_enrollments SET last_accessed_at = ? WHERE id = ?").run(now, existing.id);
  } else {
    db.prepare(`
      INSERT INTO course_enrollments (id, user_id, course_id, last_lesson_id, enrolled_at, last_accessed_at)
      VALUES (?, ?, ?, NULL, ?, ?)
    `).run(generateId("enr"), user.id, course.id, now, now);
  }

  return NextResponse.json({ enrolled: true });
}
