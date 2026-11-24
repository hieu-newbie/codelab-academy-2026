import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db/sqlite";

export async function GET() {
  const user = await getSessionUser();
  const db = getDb();

  const rows = db.prepare(`
    SELECT c.*,
           (SELECT COUNT(*) FROM course_sections cs WHERE cs.course_id = c.id) as section_count,
           (SELECT COUNT(*) FROM lessons l WHERE l.course_id = c.id) as lesson_count
    FROM courses c
    WHERE c.is_published = 1
    ORDER BY c.sort_order ASC
  `).all() as Array<Record<string, unknown> & { id: string; learning_outcomes_json: string; lesson_count: number }>;

  const courses = rows.map((c) => {
    let completedLessons = 0;
    let enrolled = false;
    if (user) {
      const done = db
        .prepare("SELECT COUNT(*) as cnt FROM lesson_progress WHERE user_id = ? AND course_id = ? AND status = 'completed'")
        .get(user.id, c.id) as { cnt: number };
      completedLessons = done.cnt;
      const enr = db
        .prepare("SELECT id FROM course_enrollments WHERE user_id = ? AND course_id = ?")
        .get(user.id, c.id);
      enrolled = Boolean(enr);
    }
    return {
      id: c.id,
      slug: c.slug,
      title: c.title,
      subtitle: c.subtitle,
      language: c.language,
      description: c.description,
      target_audience: c.target_audience,
      learning_outcomes: JSON.parse(c.learning_outcomes_json || "[]"),
      difficulty: c.difficulty,
      estimated_hours: Number(c.estimated_hours),
      icon: c.icon,
      accent_color: c.accent_color,
      is_published: Boolean(c.is_published),
      sort_order: Number(c.sort_order),
      section_count: Number(c.section_count),
      lesson_count: Number(c.lesson_count),
      completed_lessons: completedLessons,
      progress_percent: c.lesson_count > 0 ? Math.round((completedLessons / c.lesson_count) * 100) : 0,
      enrolled,
    };
  });

  return NextResponse.json({ courses });
}
