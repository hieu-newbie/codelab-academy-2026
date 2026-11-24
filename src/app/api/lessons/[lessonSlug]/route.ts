import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser, requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db/sqlite";
import { generateId } from "@/lib/crypto";
import {
  evaluateAndUnlockAchievements,
  grantXp,
  recordLearningActivity,
} from "@/lib/gamification";
import type { LessonContent } from "@/types/codelab";

export async function GET(
  _request: Request,
  context: { params: Promise<{ lessonSlug: string }> }
) {
  const { lessonSlug } = await context.params;
  const user = await getSessionUser();
  const db = getDb();

  const lesson = db.prepare(`
    SELECT l.*, c.slug as course_slug, c.title as course_title, cs.title as section_title, cs.sort_order as section_order
    FROM lessons l
    JOIN courses c ON c.id = l.course_id
    JOIN course_sections cs ON cs.id = l.section_id
    WHERE l.slug = ? OR l.id = ?
    LIMIT 1
  `).get(lessonSlug, lessonSlug) as
    | (Record<string, unknown> & {
        id: string;
        course_id: string;
        section_id: string;
        content_json: string;
      })
    | undefined;

  if (!lesson) {
    return NextResponse.json({ error: "Không tìm thấy bài học." }, { status: 404 });
  }

  // Ordered siblings for sidebar & prev/next navigation
  const courseLessons = db.prepare(`
    SELECT l.id, l.slug, l.title, l.section_id, cs.title as section_title, cs.sort_order as section_order, l.sort_order, l.estimated_minutes
    FROM lessons l
    JOIN course_sections cs ON cs.id = l.section_id
    WHERE l.course_id = ?
    ORDER BY cs.sort_order ASC, l.sort_order ASC
  `).all(lesson.course_id) as Array<{
    id: string;
    slug: string;
    title: string;
    section_id: string;
    section_title: string;
    section_order: number;
    sort_order: number;
    estimated_minutes: number;
  }>;

  const progressMap = new Map<string, string>();
  let savedCode: string | null = null;
  let status = "not_started";
  let checkpointPassed = false;
  let timeSpentSeconds = 0;
  let bookmarked = false;

  if (user) {
    const allProgs = db
      .prepare("SELECT lesson_id, status FROM lesson_progress WHERE user_id = ? AND course_id = ?")
      .all(user.id, lesson.course_id) as Array<{ lesson_id: string; status: string }>;
    allProgs.forEach((p) => progressMap.set(p.lesson_id, p.status));

    const currentProg = db
      .prepare("SELECT status, saved_code, checkpoint_passed, time_spent_seconds FROM lesson_progress WHERE user_id = ? AND lesson_id = ?")
      .get(user.id, lesson.id) as
      | { status: string; saved_code: string | null; checkpoint_passed: number; time_spent_seconds: number }
      | undefined;

    if (currentProg) {
      status = currentProg.status;
      savedCode = currentProg.saved_code;
      checkpointPassed = Boolean(currentProg.checkpoint_passed);
      timeSpentSeconds = currentProg.time_spent_seconds;
    }

    bookmarked = Boolean(
      db
        .prepare("SELECT id FROM lesson_bookmarks WHERE user_id = ? AND lesson_id = ?")
        .get(user.id, lesson.id)
    );
  }

  const currentIdx = courseLessons.findIndex((item) => item.id === lesson.id);
  const prevLesson = currentIdx > 0 ? courseLessons[currentIdx - 1] : null;
  const nextLesson =
    currentIdx >= 0 && currentIdx < courseLessons.length - 1
      ? courseLessons[currentIdx + 1]
      : null;

  return NextResponse.json({
    lesson: {
      id: lesson.id,
      section_id: lesson.section_id,
      course_id: lesson.course_id,
      course_slug: lesson.course_slug,
      course_title: lesson.course_title,
      section_title: lesson.section_title,
      section_order: lesson.section_order,
      slug: lesson.slug,
      title: lesson.title,
      summary: lesson.summary,
      estimated_minutes: Number(lesson.estimated_minutes),
      xp_reward: Number(lesson.xp_reward),
      sort_order: Number(lesson.sort_order),
      language: lesson.language,
      content: JSON.parse(lesson.content_json) as LessonContent,
      status,
      saved_code: savedCode,
      checkpoint_passed: checkpointPassed,
      time_spent_seconds: timeSpentSeconds,
      bookmarked,
    },
    navigation: {
      prev: prevLesson ? { slug: prevLesson.slug, title: prevLesson.title } : null,
      next: nextLesson ? { slug: nextLesson.slug, title: nextLesson.title } : null,
      syllabus: courseLessons.map((item) => ({
        ...item,
        status: progressMap.get(item.id) ?? "not_started",
      })),
    },
  });
}

const progressSchema = z.object({
  action: z.enum(["save_code", "heartbeat", "checkpoint", "complete", "toggle_bookmark"]),
  code: z.string().max(50000).optional(),
  selectedIndex: z.number().int().min(0).max(10).optional(),
  secondsDelta: z.number().int().min(0).max(600).optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ lessonSlug: string }> }
) {
  const { user, errorResponse } = await requireUser();
  if (errorResponse || !user) return errorResponse;

  const { lessonSlug } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = progressSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Yêu cầu cập nhật bài học không hợp lệ." }, { status: 400 });
  }

  const db = getDb();
  const lesson = db
    .prepare("SELECT id, course_id, xp_reward, estimated_minutes, content_json FROM lessons WHERE slug = ? OR id = ?")
    .get(lessonSlug, lessonSlug) as
    | { id: string; course_id: string; xp_reward: number; estimated_minutes: number; content_json: string }
    | undefined;

  if (!lesson) {
    return NextResponse.json({ error: "Không tìm thấy bài học." }, { status: 404 });
  }

  const now = new Date().toISOString();

  // Handle bookmark toggle
  if (parsed.data.action === "toggle_bookmark") {
    const existingBm = db
      .prepare("SELECT id FROM lesson_bookmarks WHERE user_id = ? AND lesson_id = ?")
      .get(user.id, lesson.id) as { id: string } | undefined;

    if (existingBm) {
      db.prepare("DELETE FROM lesson_bookmarks WHERE id = ?").run(existingBm.id);
      return NextResponse.json({ bookmarked: false });
    }
    db.prepare("INSERT INTO lesson_bookmarks (id, user_id, lesson_id, created_at) VALUES (?, ?, ?, ?)")
      .run(generateId("bm"), user.id, lesson.id, now);
    return NextResponse.json({ bookmarked: true });
  }

  // Ensure course enrollment exists & update last_lesson_id
  const enrollment = db
    .prepare("SELECT id FROM course_enrollments WHERE user_id = ? AND course_id = ?")
    .get(user.id, lesson.course_id) as { id: string } | undefined;

  if (enrollment) {
    db.prepare("UPDATE course_enrollments SET last_lesson_id = ?, last_accessed_at = ? WHERE id = ?")
      .run(lesson.id, now, enrollment.id);
  } else {
    db.prepare(`
      INSERT INTO course_enrollments (id, user_id, course_id, last_lesson_id, enrolled_at, last_accessed_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(generateId("enr"), user.id, lesson.course_id, lesson.id, now, now);
  }

  // Ensure lesson_progress row exists
  let prog = db
    .prepare("SELECT * FROM lesson_progress WHERE user_id = ? AND lesson_id = ?")
    .get(user.id, lesson.id) as
    | {
        id: string;
        status: string;
        saved_code: string | null;
        checkpoint_passed: number;
        time_spent_seconds: number;
        xp_awarded: number;
      }
    | undefined;

  if (!prog) {
    const newId = generateId("lp");
    db.prepare(`
      INSERT INTO lesson_progress
        (id, user_id, lesson_id, course_id, status, saved_code, checkpoint_passed, time_spent_seconds, xp_awarded, completed_at, updated_at)
      VALUES (?, ?, ?, ?, 'in_progress', NULL, 0, 0, 0, NULL, ?)
    `).run(newId, user.id, lesson.id, lesson.course_id, now);
    prog = {
      id: newId,
      status: "in_progress",
      saved_code: null,
      checkpoint_passed: 0,
      time_spent_seconds: 0,
      xp_awarded: 0,
    };
  }

  if (parsed.data.action === "save_code") {
    db.prepare("UPDATE lesson_progress SET saved_code = ?, updated_at = ? WHERE id = ?")
      .run(parsed.data.code ?? "", now, prog.id);
    return NextResponse.json({ saved: true });
  }

  if (parsed.data.action === "heartbeat") {
    const delta = parsed.data.secondsDelta ?? 30;
    db.prepare("UPDATE lesson_progress SET time_spent_seconds = time_spent_seconds + ?, updated_at = ? WHERE id = ?")
      .run(delta, now, prog.id);
    const addedMins = Math.floor(delta / 60);
    if (addedMins > 0) {
      recordLearningActivity(db, user.id, { studyMinutes: addedMins });
    }
    return NextResponse.json({ ok: true });
  }

  if (parsed.data.action === "checkpoint") {
    const content = JSON.parse(lesson.content_json) as LessonContent;
    const isCorrect = parsed.data.selectedIndex === content.checkpointQuiz.correctIndex;
    if (isCorrect) {
      db.prepare("UPDATE lesson_progress SET checkpoint_passed = 1, updated_at = ? WHERE id = ?")
        .run(now, prog.id);
    }
    return NextResponse.json({
      correct: isCorrect,
      explanation: content.checkpointQuiz.explanation,
      correctIndex: content.checkpointQuiz.correctIndex,
    });
  }

  // Complete lesson: backend-authoritative XP grant (only once!)
  let xpGranted = 0;
  let newUnlocked: ReturnType<typeof evaluateAndUnlockAchievements> = [];
  if (prog.xp_awarded === 0) {
    xpGranted = lesson.xp_reward;
    db.prepare(`
      UPDATE lesson_progress
      SET status = 'completed', xp_awarded = 1, completed_at = ?, updated_at = ?
      WHERE id = ?
    `).run(now, now, prog.id);

    grantXp(db, user.id, xpGranted);
    recordLearningActivity(db, user.id, {
      lessonsCompleted: 1,
      xpEarned: xpGranted,
      studyMinutes: Math.max(5, Math.min(lesson.estimated_minutes, 25)),
    });
    newUnlocked = evaluateAndUnlockAchievements(db, user.id);
  } else {
    db.prepare("UPDATE lesson_progress SET status = 'completed', updated_at = ? WHERE id = ?")
      .run(now, prog.id);
  }

  const updatedProfile = db
    .prepare("SELECT xp, level FROM profiles WHERE id = ?")
    .get(user.id) as { xp: number; level: number };

  return NextResponse.json({
    status: "completed",
    xp_granted: xpGranted,
    profile_xp: updatedProfile.xp,
    profile_level: updatedProfile.level,
    newly_unlocked_achievements: newUnlocked,
  });
}
