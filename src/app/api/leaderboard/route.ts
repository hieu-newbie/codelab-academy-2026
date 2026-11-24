import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db/sqlite";

export async function GET() {
  const currentUser = await getSessionUser();
  const db = getDb();

  // Only expose safe public leaderboard fields (never email, password, private bio)
  const rows = db.prepare(`
    SELECT p.id, p.full_name, p.username, p.avatar_url, p.xp, p.level,
           COALESCE(ls.current_streak, 0) as current_streak,
           (SELECT COUNT(*) FROM lesson_progress lp WHERE lp.user_id = p.id AND lp.status = 'completed') as completed_lessons,
           (SELECT COUNT(DISTINCT s.exercise_id) FROM submissions s WHERE s.user_id = p.id AND s.status = 'Accepted') as solved_exercises,
           (SELECT COUNT(*) FROM user_achievements ua WHERE ua.user_id = p.id) as badges_count
    FROM profiles p
    LEFT JOIN learning_streaks ls ON ls.user_id = p.id
    ORDER BY p.xp DESC, completed_lessons DESC, p.created_at ASC
    LIMIT 50
  `).all() as Array<Record<string, unknown>>;

  const leaderboard = rows.map((row, idx) => ({
    rank: idx + 1,
    ...row,
    is_current_user: currentUser ? row.id === currentUser.id : false,
  }));

  return NextResponse.json({ leaderboard });
}
