import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser, requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db/sqlite";
import { generateId } from "@/lib/crypto";
import { gradeQuizAttempt } from "@/lib/quiz-grader";
import {
  evaluateAndUnlockAchievements,
  grantXp,
  recordLearningActivity,
} from "@/lib/gamification";
import type { QuizQuestionType } from "@/types/codelab";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const user = await getSessionUser();
  const db = getDb();

  const quiz = db.prepare(`
    SELECT q.*, c.title as course_title
    FROM quizzes q
    JOIN courses c ON c.id = q.course_id
    WHERE q.slug = ? OR q.id = ?
    LIMIT 1
  `).get(slug, slug) as (Record<string, unknown> & { id: string }) | undefined;

  if (!quiz) {
    return NextResponse.json({ error: "Không tìm thấy bài kiểm tra." }, { status: 404 });
  }

  // Strip correct_answer and explanation before user submits
  const rawQuestions = db
    .prepare(`
      SELECT id, quiz_id, question_type, prompt, code_snippet, options_json, topic_tag, points, sort_order
      FROM quiz_questions
      WHERE quiz_id = ?
      ORDER BY sort_order ASC
    `)
    .all(quiz.id) as Array<Record<string, unknown> & { options_json: string }>;

  const questions = rawQuestions.map((q) => ({
    id: q.id,
    quiz_id: q.quiz_id,
    question_type: q.question_type,
    prompt: q.prompt,
    code_snippet: q.code_snippet,
    options: JSON.parse(q.options_json || "[]"),
    topic_tag: q.topic_tag,
    points: Number(q.points),
    sort_order: Number(q.sort_order),
  }));

  let attempts: Array<Record<string, unknown>> = [];
  if (user) {
    const rawAttempts = db.prepare(`
      SELECT id, score, max_score, percentage, passed, weak_topics_json, xp_awarded, duration_seconds, created_at
      FROM quiz_attempts
      WHERE user_id = ? AND quiz_id = ?
      ORDER BY created_at DESC
      LIMIT 15
    `).all(user.id, quiz.id) as Array<Record<string, unknown> & { weak_topics_json: string; passed: number }>;

    attempts = rawAttempts.map((a) => ({
      ...a,
      passed: Boolean(a.passed),
      weak_topics: JSON.parse(a.weak_topics_json || "[]"),
    }));
  }

  return NextResponse.json({ quiz, questions, attempts });
}

const submitQuizSchema = z.object({
  answers: z.record(z.string(), z.union([z.string(), z.array(z.string())])),
  durationSeconds: z.number().int().min(0).max(7200).optional().default(0),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { user, errorResponse } = await requireUser();
  if (errorResponse || !user) return errorResponse;

  const { slug } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = submitQuizSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dữ liệu nộp bài kiểm tra không hợp lệ." }, { status: 400 });
  }

  const db = getDb();
  const quiz = db
    .prepare("SELECT * FROM quizzes WHERE slug = ? OR id = ? LIMIT 1")
    .get(slug, slug) as { id: string; pass_score_percent: number; xp_reward: number } | undefined;

  if (!quiz) {
    return NextResponse.json({ error: "Không tìm thấy bài kiểm tra." }, { status: 404 });
  }

  const rawQuestions = db
    .prepare("SELECT * FROM quiz_questions WHERE quiz_id = ? ORDER BY sort_order ASC")
    .all(quiz.id) as Array<{
    id: string;
    question_type: QuizQuestionType;
    prompt: string;
    correct_answer_json: string;
    explanation: string;
    topic_tag: string;
    points: number;
  }>;

  const gradable = rawQuestions.map((q) => ({
    id: q.id,
    question_type: q.question_type,
    prompt: q.prompt,
    correct_answer: JSON.parse(q.correct_answer_json) as string | string[],
    explanation: q.explanation,
    topic_tag: q.topic_tag,
    points: q.points,
  }));

  const grade = gradeQuizAttempt(gradable, parsed.data.answers, quiz.pass_score_percent);
  const now = new Date().toISOString();

  // Count find_bug questions answered correctly to credit Bug Hunter progress!
  const bugsFoundCount = grade.results.filter((r) => {
    const q = gradable.find((g) => g.id === r.question_id);
    return q?.question_type === "find_bug" && r.is_correct;
  }).length;

  const alreadyPassed = db
    .prepare("SELECT id FROM quiz_attempts WHERE user_id = ? AND quiz_id = ? AND passed = 1 LIMIT 1")
    .get(user.id, quiz.id);

  let xpAwarded = 0;
  if (grade.passed && !alreadyPassed) {
    xpAwarded = quiz.xp_reward;
  }

  const attemptId = generateId("qa");
  db.prepare(`
    INSERT INTO quiz_attempts
      (id, user_id, quiz_id, score, max_score, percentage, passed, answers_json, weak_topics_json, xp_awarded, duration_seconds, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    attemptId,
    user.id,
    quiz.id,
    grade.score,
    grade.max_score,
    grade.percentage,
    grade.passed ? 1 : 0,
    JSON.stringify(parsed.data.answers),
    JSON.stringify(grade.weak_topics),
    xpAwarded,
    parsed.data.durationSeconds,
    now
  );

  if (bugsFoundCount > 0 && !alreadyPassed) {
    db.prepare("UPDATE profiles SET bugs_fixed_count = bugs_fixed_count + ?, updated_at = ? WHERE id = ?")
      .run(bugsFoundCount, now, user.id);
  }

  if (xpAwarded > 0) {
    grantXp(db, user.id, xpAwarded);
  }
  recordLearningActivity(db, user.id, {
    quizzesCompleted: 1,
    xpEarned: xpAwarded,
    studyMinutes: Math.max(2, Math.round(parsed.data.durationSeconds / 60)),
  });
  const newlyUnlocked = evaluateAndUnlockAchievements(db, user.id);

  return NextResponse.json({
    attempt_id: attemptId,
    ...grade,
    xp_awarded: xpAwarded,
    newly_unlocked_achievements: newlyUnlocked,
  });
}
