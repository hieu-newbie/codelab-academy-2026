import type { DatabaseSync } from "node:sqlite";
import { generateId } from "@/lib/crypto";
import { computeLevelInfo, type LevelInfo } from "@/lib/levels";

export { computeLevelInfo, type LevelInfo };

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Authoritative backend-only streak & daily activity recorder.
 */
export function recordLearningActivity(
  db: DatabaseSync,
  userId: string,
  deltas: {
    lessonsCompleted?: number;
    exercisesSolved?: number;
    quizzesCompleted?: number;
    xpEarned?: number;
    studyMinutes?: number;
  }
): { currentStreak: number; longestStreak: number } {
  const today = todayIsoDate();
  const now = new Date().toISOString();

  // Upsert daily_activity row
  const existingAct = db
    .prepare("SELECT id FROM daily_activity WHERE user_id = ? AND activity_date = ?")
    .get(userId, today) as { id: string } | undefined;

  if (existingAct) {
    db.prepare(`
      UPDATE daily_activity
      SET lessons_completed = lessons_completed + ?,
          exercises_solved = exercises_solved + ?,
          quizzes_completed = quizzes_completed + ?,
          xp_earned = xp_earned + ?,
          study_minutes = study_minutes + ?
      WHERE id = ?
    `).run(
      deltas.lessonsCompleted ?? 0,
      deltas.exercisesSolved ?? 0,
      deltas.quizzesCompleted ?? 0,
      deltas.xpEarned ?? 0,
      deltas.studyMinutes ?? 0,
      existingAct.id
    );
  } else {
    db.prepare(`
      INSERT INTO daily_activity
        (id, user_id, activity_date, lessons_completed, exercises_solved, quizzes_completed, xp_earned, study_minutes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      generateId("act"),
      userId,
      today,
      deltas.lessonsCompleted ?? 0,
      deltas.exercisesSolved ?? 0,
      deltas.quizzesCompleted ?? 0,
      deltas.xpEarned ?? 0,
      deltas.studyMinutes ?? 0
    );
  }

  if (deltas.studyMinutes && deltas.studyMinutes > 0) {
    db.prepare("UPDATE profiles SET total_study_minutes = total_study_minutes + ?, updated_at = ? WHERE id = ?")
      .run(deltas.studyMinutes, now, userId);
  }

  // Update learning streak
  const streak = db
    .prepare("SELECT current_streak, longest_streak, last_active_date FROM learning_streaks WHERE user_id = ?")
    .get(userId) as
    | { current_streak: number; longest_streak: number; last_active_date: string | null }
    | undefined;

  let currentStreak = streak?.current_streak ?? 0;
  let longestStreak = streak?.longest_streak ?? 0;
  const lastDate = streak?.last_active_date ?? null;

  if (lastDate !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    if (lastDate === yesterdayStr) {
      currentStreak += 1;
    } else {
      currentStreak = 1;
    }
    if (currentStreak > longestStreak) {
      longestStreak = currentStreak;
    }

    if (streak) {
      db.prepare(`
        UPDATE learning_streaks
        SET current_streak = ?, longest_streak = ?, last_active_date = ?, updated_at = ?
        WHERE user_id = ?
      `).run(currentStreak, longestStreak, today, now, userId);
    } else {
      db.prepare(`
        INSERT INTO learning_streaks (user_id, current_streak, longest_streak, last_active_date, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(userId, currentStreak, longestStreak, today, now);
    }
  }

  return { currentStreak, longestStreak };
}

/**
 * Authoritative backend-only XP grant & level recomputation.
 * Frontend can NEVER send arbitrary XP values.
 */
export function grantXp(db: DatabaseSync, userId: string, amount: number): { xp: number; level: number } {
  if (amount <= 0) {
    const row = db.prepare("SELECT xp, level FROM profiles WHERE id = ?").get(userId) as { xp: number; level: number };
    return row ?? { xp: 0, level: 1 };
  }
  const now = new Date().toISOString();
  const current = db.prepare("SELECT xp FROM profiles WHERE id = ?").get(userId) as { xp: number } | undefined;
  const newXp = (current?.xp ?? 0) + Math.floor(amount);
  const newLevel = computeLevelInfo(newXp).level;

  db.prepare("UPDATE profiles SET xp = ?, level = ?, updated_at = ? WHERE id = ?")
    .run(newXp, newLevel, now, userId);

  return { xp: newXp, level: newLevel };
}

export interface UnlockedAchievement {
  id: string;
  code: string;
  title: string;
  description: string;
  xp_bonus: number;
}

/**
 * Evaluates all achievements against real backend DB metrics and unlocks any newly earned badges.
 */
export function evaluateAndUnlockAchievements(db: DatabaseSync, userId: string): UnlockedAchievement[] {
  const lessonsCompleted = (
    db.prepare("SELECT COUNT(*) as c FROM lesson_progress WHERE user_id = ? AND status = 'completed'").get(userId) as { c: number }
  ).c;

  const exercisesSolved = (
    db.prepare("SELECT COUNT(DISTINCT exercise_id) as c FROM submissions WHERE user_id = ? AND status = 'Accepted'").get(userId) as { c: number }
  ).c;

  const profileRow = db
    .prepare("SELECT bugs_fixed_count FROM profiles WHERE id = ?")
    .get(userId) as { bugs_fixed_count: number } | undefined;
  const bugsFixed = profileRow?.bugs_fixed_count ?? 0;

  const streakRow = db
    .prepare("SELECT longest_streak FROM learning_streaks WHERE user_id = ?")
    .get(userId) as { longest_streak: number } | undefined;
  const longestStreak = streakRow?.longest_streak ?? 0;

  const bestQuizRow = db
    .prepare("SELECT COALESCE(MAX(percentage), 0) as m FROM quiz_attempts WHERE user_id = ?")
    .get(userId) as { m: number };
  const bestQuizScore = bestQuizRow.m;

  // Count how many courses have all their lessons completed by this user
  const coursesCompletedRow = db.prepare(`
    SELECT COUNT(*) as c FROM (
      SELECT l.course_id,
             COUNT(l.id) as total_l,
             SUM(CASE WHEN lp.status = 'completed' THEN 1 ELSE 0 END) as done_l
      FROM lessons l
      LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.user_id = ?
      GROUP BY l.course_id
      HAVING total_l > 0 AND total_l = done_l
    )
  `).get(userId) as { c: number };
  const coursesCompleted = coursesCompletedRow.c;

  const lockedAchievements = db.prepare(`
    SELECT a.* FROM achievements a
    WHERE a.id NOT IN (SELECT achievement_id FROM user_achievements WHERE user_id = ?)
  `).all(userId) as Array<{
    id: string;
    code: string;
    title: string;
    description: string;
    xp_bonus: number;
    condition_type: string;
    condition_value: number;
  }>;

  const newlyUnlocked: UnlockedAchievement[] = [];
  const now = new Date().toISOString();

  for (const ach of lockedAchievements) {
    let met = false;
    switch (ach.condition_type) {
      case "lessons_completed":
        met = lessonsCompleted >= ach.condition_value;
        break;
      case "exercises_solved":
        met = exercisesSolved >= ach.condition_value;
        break;
      case "bugs_fixed":
        met = bugsFixed >= ach.condition_value;
        break;
      case "streak_days":
        met = longestStreak >= ach.condition_value;
        break;
      case "courses_completed":
        met = coursesCompleted >= ach.condition_value;
        break;
      case "quiz_high_score":
        met = bestQuizScore >= ach.condition_value;
        break;
    }

    if (met) {
      db.prepare(
        "INSERT OR IGNORE INTO user_achievements (id, user_id, achievement_id, unlocked_at) VALUES (?, ?, ?, ?)"
      ).run(generateId("ua"), userId, ach.id, now);
      if (ach.xp_bonus > 0) {
        grantXp(db, userId, ach.xp_bonus);
        recordLearningActivity(db, userId, { xpEarned: ach.xp_bonus });
      }
      newlyUnlocked.push({
        id: ach.id,
        code: ach.code,
        title: ach.title,
        description: ach.description,
        xp_bonus: ach.xp_bonus,
      });
    }
  }

  return newlyUnlocked;
}
