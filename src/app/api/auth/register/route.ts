import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db/sqlite";
import { generateId, hashPassword } from "@/lib/crypto";
import { attachSessionCookie } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

const registerSchema = z.object({
  full_name: z.string().trim().min(2, "Họ tên tối thiểu 2 ký tự").max(80),
  email: z.string().trim().email("Email không hợp lệ").toLowerCase(),
  username: z
    .string()
    .trim()
    .min(3, "Username tối thiểu 3 ký tự")
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, "Username chỉ chứa chữ cái, số và dấu gạch dưới _")
    .optional(),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự").max(100),
});

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "local";
    const rl = checkRateLimit(`register:${ip}`, 15, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Quá nhiều yêu cầu đăng ký. Vui lòng thử lại sau ${rl.retryAfterSec}s.` },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dữ liệu không hợp lệ." },
        { status: 400 }
      );
    }

    const db = getDb();
    const { full_name, email, password } = parsed.data;
    const rawUsername =
      parsed.data.username ||
      `${email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "").slice(0, 16) || "coder"}_${Math.floor(1000 + Math.random() * 9000)}`;
    const username = rawUsername.toLowerCase();

    const existingEmail = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (existingEmail) {
      return NextResponse.json({ error: "Email này đã được đăng ký." }, { status: 409 });
    }

    const existingUsername = db.prepare("SELECT id FROM profiles WHERE username = ?").get(username);
    if (existingUsername) {
      return NextResponse.json({ error: "Tên người dùng (username) này đã tồn tại." }, { status: 409 });
    }

    const userId = generateId("usr");
    const now = new Date().toISOString();
    const passwordHash = hashPassword(password);

    db.prepare("INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)")
      .run(userId, email, passwordHash, now);

    db.prepare(`
      INSERT INTO profiles
        (id, email, full_name, username, avatar_url, bio, role, xp, level, theme, preferred_language, total_study_minutes, bugs_fixed_count, created_at, updated_at)
      VALUES (?, ?, ?, ?, NULL, '', 'student', 0, 1, 'dark', 'cpp', 0, 0, ?, ?)
    `).run(userId, email, full_name, username, now, now);

    db.prepare(`
      INSERT INTO learning_streaks (user_id, current_streak, longest_streak, last_active_date, updated_at)
      VALUES (?, 0, 0, NULL, ?)
    `).run(userId, now);

    const profile = db
      .prepare(`
        SELECT id, email, full_name, username, avatar_url, bio, role, xp, level, theme,
               preferred_language, total_study_minutes, bugs_fixed_count, created_at
        FROM profiles WHERE id = ?
      `)
      .get(userId);

    const res = NextResponse.json({ user: profile }, { status: 201 });
    return attachSessionCookie(res, userId, "student");
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Lỗi máy chủ khi đăng ký tài khoản." }, { status: 500 });
  }
}
