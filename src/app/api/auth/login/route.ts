import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db/sqlite";
import { verifyPassword } from "@/lib/crypto";
import { attachSessionCookie } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

const loginSchema = z.object({
  email: z.string().trim().email("Email không hợp lệ").toLowerCase(),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "local";
    const rl = checkRateLimit(`login:${ip}`, 25, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau ${rl.retryAfterSec}s.` },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Thông tin đăng nhập không hợp lệ." },
        { status: 400 }
      );
    }

    const db = getDb();
    const userRow = db
      .prepare("SELECT id, email, password_hash FROM users WHERE email = ?")
      .get(parsed.data.email) as { id: string; email: string; password_hash: string } | undefined;

    if (!userRow || !verifyPassword(parsed.data.password, userRow.password_hash)) {
      return NextResponse.json(
        { error: "Email hoặc mật khẩu không chính xác." },
        { status: 401 }
      );
    }

    const profile = db
      .prepare(`
        SELECT id, email, full_name, username, avatar_url, bio, role, xp, level, theme,
               preferred_language, total_study_minutes, bugs_fixed_count, created_at
        FROM profiles WHERE id = ?
      `)
      .get(userRow.id) as { id: string; role: "student" | "admin" } | undefined;

    if (!profile) {
      return NextResponse.json({ error: "Không tìm thấy hồ sơ tài khoản." }, { status: 404 });
    }

    const res = NextResponse.json({ user: profile });
    return attachSessionCookie(res, profile.id, profile.role);
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Lỗi máy chủ khi đăng nhập." }, { status: 500 });
  }
}
