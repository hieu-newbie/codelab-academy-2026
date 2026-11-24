import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db/sqlite";

const updateProfileSchema = z.object({
  full_name: z.string().trim().min(2, "Họ tên tối thiểu 2 ký tự").max(80).optional(),
  username: z
    .string()
    .trim()
    .min(3, "Username tối thiểu 3 ký tự")
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, "Username chỉ chứa chữ, số và _")
    .optional(),
  bio: z.string().trim().max(300).optional(),
  avatar_url: z.string().trim().max(500000).nullable().optional(),
  theme: z.enum(["dark", "light"]).optional(),
  preferred_language: z.enum(["cpp", "html", "css", "javascript"]).optional(),
});

export async function GET() {
  const { user, errorResponse } = await requireUser();
  if (errorResponse || !user) return errorResponse;

  const db = getDb();

  const bookmarkedLessons = db.prepare(`
    SELECT l.id, l.slug, l.title, l.language, l.estimated_minutes, c.slug as course_slug, c.title as course_title, lb.created_at
    FROM lesson_bookmarks lb
    JOIN lessons l ON l.id = lb.lesson_id
    JOIN courses c ON c.id = l.course_id
    WHERE lb.user_id = ?
    ORDER BY lb.created_at DESC
  `).all(user.id);

  const bookmarkedExercises = db.prepare(`
    SELECT e.id, e.code, e.slug, e.title, e.category, e.difficulty, eb.created_at
    FROM exercise_bookmarks eb
    JOIN exercises e ON e.id = eb.exercise_id
    WHERE eb.user_id = ?
    ORDER BY eb.created_at DESC
  `).all(user.id);

  const recentLessons = db.prepare(`
    SELECT lp.status, lp.updated_at, lp.completed_at, l.slug as lesson_slug, l.title as lesson_title,
           c.slug as course_slug, c.title as course_title, l.language
    FROM lesson_progress lp
    JOIN lessons l ON l.id = lp.lesson_id
    JOIN courses c ON c.id = lp.course_id
    WHERE lp.user_id = ?
    ORDER BY lp.updated_at DESC
    LIMIT 15
  `).all(user.id);

  const recentSubmissions = db.prepare(`
    SELECT s.id, s.status, s.passed_tests, s.total_tests, s.execution_time_ms, s.created_at,
           e.code as exercise_code, e.slug as exercise_slug, e.title as exercise_title
    FROM submissions s
    JOIN exercises e ON e.id = s.exercise_id
    WHERE s.user_id = ?
    ORDER BY s.created_at DESC
    LIMIT 15
  `).all(user.id);

  const recentQuizAttempts = db.prepare(`
    SELECT qa.id, qa.score, qa.max_score, qa.percentage, qa.passed, qa.created_at,
           q.slug as quiz_slug, q.title as quiz_title
    FROM quiz_attempts qa
    JOIN quizzes q ON q.id = qa.quiz_id
    WHERE qa.user_id = ?
    ORDER BY qa.created_at DESC
    LIMIT 15
  `).all(user.id);

  const achievements = db.prepare(`
    SELECT a.*, ua.unlocked_at, CASE WHEN ua.id IS NOT NULL THEN 1 ELSE 0 END as unlocked
    FROM achievements a
    LEFT JOIN user_achievements ua ON ua.achievement_id = a.id AND ua.user_id = ?
    ORDER BY unlocked DESC, a.xp_bonus ASC
  `).all(user.id);

  return NextResponse.json({
    profile: user,
    bookmarkedLessons,
    bookmarkedExercises,
    recentLessons,
    recentSubmissions,
    recentQuizAttempts,
    achievements,
  });
}

export async function PATCH(request: Request) {
  const { user, errorResponse } = await requireUser();
  if (errorResponse || !user) return errorResponse;

  const body = await request.json().catch(() => null);
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Dữ liệu cập nhật không hợp lệ." },
      { status: 400 }
    );
  }

  const db = getDb();
  const data = parsed.data;

  if (data.username && data.username.toLowerCase() !== user.username) {
    const exists = db
      .prepare("SELECT id FROM profiles WHERE username = ? AND id != ?")
      .get(data.username.toLowerCase(), user.id);
    if (exists) {
      return NextResponse.json({ error: "Username này đã được người khác sử dụng." }, { status: 409 });
    }
  }

  // Validate avatar_url safely (only allow https://, http://, /, or data:image/)
  if (data.avatar_url) {
    const okPrefix =
      data.avatar_url.startsWith("https://") ||
      data.avatar_url.startsWith("http://") ||
      data.avatar_url.startsWith("/") ||
      data.avatar_url.startsWith("data:image/");
    if (!okPrefix) {
      return NextResponse.json({ error: "Định dạng ảnh đại diện không hợp lệ." }, { status: 400 });
    }
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE profiles
    SET full_name = ?,
        username = ?,
        bio = ?,
        avatar_url = ?,
        theme = ?,
        preferred_language = ?,
        updated_at = ?
    WHERE id = ?
  `).run(
    data.full_name ?? user.full_name,
    data.username ? data.username.toLowerCase() : user.username,
    data.bio ?? user.bio,
    data.avatar_url !== undefined ? data.avatar_url : user.avatar_url,
    data.theme ?? user.theme,
    data.preferred_language ?? user.preferred_language,
    now,
    user.id
  );

  const updated = db
    .prepare(`
      SELECT id, email, full_name, username, avatar_url, bio, role, xp, level, theme,
             preferred_language, total_study_minutes, bugs_fixed_count, created_at
      FROM profiles WHERE id = ?
    `)
    .get(user.id);

  return NextResponse.json({ user: updated });
}
