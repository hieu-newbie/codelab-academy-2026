import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db/sqlite";
import { hashPassword, verifyPassword } from "@/lib/crypto";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại"),
  newPassword: z.string().min(6, "Mật khẩu mới tối thiểu 6 ký tự").max(100),
});

export async function POST(request: Request) {
  const { user, errorResponse } = await requireUser();
  if (errorResponse || !user) return errorResponse;

  const body = await request.json().catch(() => null);
  const parsed = passwordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Dữ liệu mật khẩu không hợp lệ." },
      { status: 400 }
    );
  }

  const db = getDb();
  const row = db.prepare("SELECT password_hash FROM users WHERE id = ?").get(user.id) as
    | { password_hash: string }
    | undefined;

  if (!row || !verifyPassword(parsed.data.currentPassword, row.password_hash)) {
    return NextResponse.json({ error: "Mật khẩu hiện tại không chính xác." }, { status: 400 });
  }

  const newHash = hashPassword(parsed.data.newPassword);
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(newHash, user.id);

  return NextResponse.json({ success: true, message: "Đổi mật khẩu thành công!" });
}
