import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db/sqlite";

export async function GET(request: Request) {
  const user = await getSessionUser();
  const db = getDb();
  const url = new URL(request.url);
  const category = url.searchParams.get("category")?.trim() || "";
  const difficulty = url.searchParams.get("difficulty")?.trim() || "";
  const search = url.searchParams.get("search")?.trim().toLowerCase() || "";

  const rows = db.prepare(`
    SELECT id, code, slug, title, category, difficulty, language, xp_reward, time_limit_ms, memory_limit_kb,
           (SELECT COUNT(*) FROM test_cases tc WHERE tc.exercise_id = exercises.id) as test_case_count
    FROM exercises
    WHERE is_published = 1
    ORDER BY code ASC
  `).all() as Array<{
    id: string;
    code: string;
    slug: string;
    title: string;
    category: string;
    difficulty: string;
    language: string;
    xp_reward: number;
    time_limit_ms: number;
    memory_limit_kb: number;
    test_case_count: number;
  }>;

  const solvedSet = new Set<string>();
  const attemptsMap = new Map<string, number>();
  const bookmarkSet = new Set<string>();

  if (user) {
    const subs = db
      .prepare("SELECT exercise_id, status FROM submissions WHERE user_id = ? AND status != 'Not Configured'")
      .all(user.id) as Array<{ exercise_id: string; status: string }>;
    for (const s of subs) {
      attemptsMap.set(s.exercise_id, (attemptsMap.get(s.exercise_id) ?? 0) + 1);
      if (s.status === "Accepted") solvedSet.add(s.exercise_id);
    }

    const bms = db
      .prepare("SELECT exercise_id FROM exercise_bookmarks WHERE user_id = ?")
      .all(user.id) as Array<{ exercise_id: string }>;
    bms.forEach((b) => bookmarkSet.add(b.exercise_id));
  }

  const filtered = rows
    .filter((r) => (!category || category === "all" ? true : r.category === category))
    .filter((r) => (!difficulty || difficulty === "all" ? true : r.difficulty === difficulty))
    .filter((r) =>
      !search
        ? true
        : r.title.toLowerCase().includes(search) ||
          r.code.toLowerCase().includes(search) ||
          r.category.toLowerCase().includes(search)
    )
    .map((r) => ({
      ...r,
      solved: solvedSet.has(r.id),
      attempts_count: attemptsMap.get(r.id) ?? 0,
      bookmarked: bookmarkSet.has(r.id),
    }));

  const categories = Array.from(new Set(rows.map((r) => r.category)));

  return NextResponse.json({ exercises: filtered, categories });
}
