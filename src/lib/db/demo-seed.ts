import type { DatabaseSync } from "node:sqlite";
import { hashPassword } from "@/lib/crypto";

function daysAgoIsoDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function daysAgoTimestamp(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

/**
 * Isolated Demo Mode Seed (Section 16: "Tạo dữ liệu mẫu riêng biệt cho chế độ demo.")
 * Controlled by ENABLE_DEMO_SEED env var (disabled when ENABLE_DEMO_SEED=false).
 * Newly registered users always start completely fresh with 0 XP and 0 progress.
 */
export function seedDemoData(db: DatabaseSync): void {
  if (process.env.ENABLE_DEMO_SEED === "false") {
    return;
  }

  const existingDemo = db
    .prepare("SELECT id FROM users WHERE email = ?")
    .get("demo@codelab.vn") as { id: string } | undefined;

  if (existingDemo) {
    return;
  }

  const demoUsers = [
    {
      id: "user-admin-demo",
      email: "admin@codelab.vn",
      password: hashPassword("Admin@1234"),
      full_name: "Quản trị viên CODELAB",
      username: "codelab_admin",
      bio: "Giảng viên & Quản trị nền tảng học lập trình tương tác CODELAB.",
      role: "admin",
      xp: 1850,
      level: 10,
      study_minutes: 420,
      bugs_fixed: 14,
    },
    {
      id: "user-student-demo",
      email: "demo@codelab.vn",
      password: hashPassword("Demo@1234"),
      full_name: "Nguyễn Minh Khôi",
      username: "minhkhoi_dev",
      bio: "Sinh viên năm nhất CNTT đang chinh phục lộ trình C++ và Full-stack Web.",
      role: "student",
      xp: 485,
      level: 4,
      study_minutes: 215,
      bugs_fixed: 4,
    },
    {
      id: "user-peer-01",
      email: "linh.tran@codelab.vn",
      password: hashPassword("Demo@1234"),
      full_name: "Trần Khánh Linh",
      username: "khanhlinh_cpp",
      bio: "Đam mê thuật toán và lập trình thi đấu C++.",
      role: "student",
      xp: 920,
      level: 7,
      study_minutes: 390,
      bugs_fixed: 11,
    },
    {
      id: "user-peer-02",
      email: "hung.le@codelab.vn",
      password: hashPassword("Demo@1234"),
      full_name: "Lê Gia Hưng",
      username: "giahung_web",
      bio: "Học Frontend từ con số 0 với HTML, CSS và JavaScript.",
      role: "student",
      xp: 640,
      level: 5,
      study_minutes: 270,
      bugs_fixed: 6,
    },
  ];

  const insertUser = db.prepare(
    "INSERT OR IGNORE INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)"
  );
  const insertProfile = db.prepare(`
    INSERT OR IGNORE INTO profiles
      (id, email, full_name, username, avatar_url, bio, role, xp, level, theme, preferred_language, total_study_minutes, bugs_fixed_count, created_at, updated_at)
    VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?, 'dark', 'cpp', ?, ?, ?, ?)
  `);
  const insertStreak = db.prepare(`
    INSERT OR IGNORE INTO learning_streaks (user_id, current_streak, longest_streak, last_active_date, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const u of demoUsers) {
    const createdAt = daysAgoTimestamp(14);
    insertUser.run(u.id, u.email, u.password, createdAt);
    insertProfile.run(
      u.id,
      u.email,
      u.full_name,
      u.username,
      u.bio,
      u.role,
      u.xp,
      u.level,
      u.study_minutes,
      u.bugs_fixed,
      createdAt,
      daysAgoTimestamp(0)
    );
  }

  insertStreak.run("user-admin-demo", 12, 15, daysAgoIsoDate(0), daysAgoTimestamp(0));
  insertStreak.run("user-student-demo", 5, 7, daysAgoIsoDate(0), daysAgoTimestamp(0));
  insertStreak.run("user-peer-01", 9, 9, daysAgoIsoDate(0), daysAgoTimestamp(0));
  insertStreak.run("user-peer-02", 4, 6, daysAgoIsoDate(1), daysAgoTimestamp(1));

  // Enroll demo student into C++ and HTML courses
  const insertEnroll = db.prepare(`
    INSERT OR IGNORE INTO course_enrollments (id, user_id, course_id, last_lesson_id, enrolled_at, last_accessed_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertEnroll.run("enr-demo-cpp", "user-student-demo", "course-cpp", "lesson-cpp-05", daysAgoTimestamp(10), daysAgoTimestamp(0));
  insertEnroll.run("enr-demo-html", "user-student-demo", "course-html", "lesson-html-01", daysAgoTimestamp(6), daysAgoTimestamp(1));
  insertEnroll.run("enr-demo-js", "user-student-demo", "course-js", "lesson-js-01", daysAgoTimestamp(3), daysAgoTimestamp(2));

  // Real lesson progress rows for demo student (4 completed, 2 in progress)
  const insertProg = db.prepare(`
    INSERT OR IGNORE INTO lesson_progress
      (id, user_id, lesson_id, course_id, status, saved_code, checkpoint_passed, time_spent_seconds, xp_awarded, completed_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertProg.run("lp-d1", "user-student-demo", "lesson-cpp-01", "course-cpp", "completed", null, 1, 900, 1, daysAgoTimestamp(5), daysAgoTimestamp(5));
  insertProg.run("lp-d2", "user-student-demo", "lesson-cpp-02", "course-cpp", "completed", null, 1, 840, 1, daysAgoTimestamp(4), daysAgoTimestamp(4));
  insertProg.run("lp-d3", "user-student-demo", "lesson-cpp-03", "course-cpp", "completed", null, 1, 1200, 1, daysAgoTimestamp(3), daysAgoTimestamp(3));
  insertProg.run("lp-d4", "user-student-demo", "lesson-cpp-04", "course-cpp", "completed", null, 1, 1080, 1, daysAgoTimestamp(1), daysAgoTimestamp(1));
  insertProg.run("lp-d5", "user-student-demo", "lesson-cpp-05", "course-cpp", "in_progress", null, 0, 420, 0, null, daysAgoTimestamp(0));
  insertProg.run("lp-d6", "user-student-demo", "lesson-html-01", "course-html", "completed", null, 1, 780, 1, daysAgoTimestamp(2), daysAgoTimestamp(2));
  insertProg.run("lp-d7", "user-student-demo", "lesson-js-01", "course-js", "in_progress", null, 0, 300, 0, null, daysAgoTimestamp(1));

  // Bookmark for demo student
  db.prepare("INSERT OR IGNORE INTO lesson_bookmarks (id, user_id, lesson_id, created_at) VALUES (?, ?, ?, ?)")
    .run("bm-d1", "user-student-demo", "lesson-cpp-03", daysAgoTimestamp(3));

  // Real quiz attempt history for demo student
  db.prepare(`
    INSERT OR IGNORE INTO quiz_attempts
      (id, user_id, quiz_id, score, max_score, percentage, passed, answers_json, weak_topics_json, xp_awarded, duration_seconds, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    "qa-demo-1",
    "user-student-demo",
    "quiz-cpp-basics",
    65,
    80,
    81,
    1,
    JSON.stringify({ "qq-cpp-1": "long long", "qq-cpp-3": "Sai" }),
    JSON.stringify(["Nhập xuất dữ liệu"]),
    80,
    410,
    daysAgoTimestamp(2)
  );

  // Daily activity rows across recent 10 days for charts
  const activityPlan = [
    { daysAgo: 9, lessons: 0, exercises: 0, quizzes: 0, xp: 0, mins: 10 },
    { daysAgo: 8, lessons: 1, exercises: 0, quizzes: 0, xp: 50, mins: 25 },
    { daysAgo: 7, lessons: 0, exercises: 0, quizzes: 0, xp: 0, mins: 0 },
    { daysAgo: 6, lessons: 1, exercises: 0, quizzes: 0, xp: 50, mins: 20 },
    { daysAgo: 5, lessons: 1, exercises: 0, quizzes: 0, xp: 50, mins: 30 },
    { daysAgo: 4, lessons: 1, exercises: 0, quizzes: 0, xp: 50, mins: 28 },
    { daysAgo: 3, lessons: 1, exercises: 0, quizzes: 0, xp: 60, mins: 35 },
    { daysAgo: 2, lessons: 1, exercises: 0, quizzes: 1, xp: 130, mins: 42 },
    { daysAgo: 1, lessons: 1, exercises: 0, quizzes: 0, xp: 60, mins: 25 },
    { daysAgo: 0, lessons: 0, exercises: 0, quizzes: 0, xp: 35, mins: 15 },
  ];
  const insertAct = db.prepare(`
    INSERT OR IGNORE INTO daily_activity
      (id, user_id, activity_date, lessons_completed, exercises_solved, quizzes_completed, xp_earned, study_minutes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const row of activityPlan) {
    insertAct.run(
      `act-demo-${row.daysAgo}`,
      "user-student-demo",
      daysAgoIsoDate(row.daysAgo),
      row.lessons,
      row.exercises,
      row.quizzes,
      row.xp,
      row.mins
    );
  }

  // Unlock real earned badges for demo student
  const insertUA = db.prepare(
    "INSERT OR IGNORE INTO user_achievements (id, user_id, achievement_id, unlocked_at) VALUES (?, ?, ?, ?)"
  );
  insertUA.run("ua-d1", "user-student-demo", "ach-first-code", daysAgoTimestamp(5));
  insertUA.run("ua-d2", "user-student-demo", "ach-dedicated", daysAgoTimestamp(1));
  insertUA.run("ua-peer-1", "user-peer-01", "ach-first-code", daysAgoTimestamp(12));
  insertUA.run("ua-peer-2", "user-peer-01", "ach-consistency", daysAgoTimestamp(2));
  insertUA.run("ua-peer-3", "user-peer-01", "ach-bug-hunter", daysAgoTimestamp(1));

  // Sample bug report for Admin moderation queue
  db.prepare(`
    INSERT OR IGNORE INTO bug_reports
      (id, user_id, target_type, target_id, target_title, description, status, admin_note, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    "bug-demo-1",
    "user-student-demo",
    "lesson",
    "lesson-cpp-04",
    "Nhập xuất dữ liệu với cin, cout và định dạng số",
    "Đề xuất bổ sung thêm ví dụ kết hợp cin.ignore() với nhiều dòng getline liên tiếp để người mới dễ hình dung hơn.",
    "open",
    null,
    daysAgoTimestamp(1),
    daysAgoTimestamp(1)
  );
}
