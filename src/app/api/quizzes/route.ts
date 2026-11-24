import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db/sqlite";

export async function GET() {
  const user = await getSessionUser();
  const db = getDb();

  const rows = db.prepare(`
    SELECT q.*, c.title as course_title,
           (SELECT COUNT(*) FROM quiz_questions qq WHERE qq.quiz_id = q.id) as question_count
    FROM quizzes q
    JOIN courses c ON c.id = q.course_id
    ORDER BY q.created_at ASC
  `).all() as Array<Record<string, unknown> & { id: string }>;

  const quizzes = rows.map((q) => {
    let bestPercentage: number | null = null;
    let attemptsCount = 0;
    if (user) {
      const stats = db.prepare(`
        SELECT COUNT(*) as cnt, MAX(percentage) as best
        FROM quiz_attempts
        WHERE user_id = ? AND quiz_id = ?
      `).get(user.id, q.id) as { cnt: number; best: number | null };
      attemptsCount = stats.cnt;
      bestPercentage = stats.best;
    }
    return {
      ...q,
      best_percentage: bestPercentage,
      attempts_count: attemptsCount,
    };
  });

  // Aggregate weak topics across user's attempts
  let weakTopics: Array<{ topic: string; misses: number }> = [];
  if (user) {
    const attemptRows = db
      .prepare("SELECT weak_topics_json FROM quiz_attempts WHERE user_id = ?")
      .all(user.id) as Array<{ weak_topics_json: string }>;
    const counts = new Map<string, number>();
    for (const r of attemptRows) {
      try {
        const list = JSON.parse(r.weak_topics_json || "[]") as string[];
        for (const t of list) counts.set(t, (counts.get(t) ?? 0) + 1);
      } catch {
        // ignore
      }
    }
    weakTopics = Array.from(counts.entries())
      .map(([topic, misses]) => ({ topic, misses }))
      .sort((a, b) => b.misses - a.misses);
  }

  return NextResponse.json({ quizzes, weak_topics: weakTopics });
}
