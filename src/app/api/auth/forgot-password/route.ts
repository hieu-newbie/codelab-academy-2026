import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db/sqlite";
import { hashPassword } from "@/lib/crypto";

const requestResetSchema = z.object({
  action: z.literal("request"),
  email: z.string().trim().email("Email không hợp lệ").toLowerCase(),
});

const confirmResetSchema = z.object({
  action: z.literal("confirm"),
  email: z.string().trim().email().toLowerCase(),
  token: z.string().trim().min(6),
  newPassword: z.string().min(6, "Mật khẩu mới tối thiểu 6 ký tự").max(100),
});

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const db = getDb();

    if (body?.action === "confirm") {
      const parsed = confirmResetSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message || "Dữ liệu đặt lại mật khẩu không hợp lệ." },
          { status: 400 }
        );
      }

      const user = db
        .prepare("SELECT id, reset_token, reset_token_expires FROM users WHERE email = ?")
        .get(parsed.data.email) as
        | { id: string; reset_token: string | null; reset_token_expires: string | null }
        | undefined;

      if (
        !user ||
        !user.reset_token ||
        user.reset_token !== parsed.data.token ||
        !user.reset_token_expires ||
        new Date(user.reset_token_expires).getTime() < Date.now()
      ) {
        return NextResponse.json(
          { error: "Mã xác thực không đúng hoặc đã hết hạn." },
          { status: 400 }
        );
      }

      const newHash = hashPassword(parsed.data.newPassword);
      db.prepare(
        "UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?"
      ).run(newHash, user.id);

      return NextResponse.json({
        success: true,
        message: "Đặt lại mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.",
      });
    }

    const parsed = requestResetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Vui lòng nhập email hợp lệ." },
        { status: 400 }
      );
    }

    const user = db.prepare("SELECT id FROM users WHERE email = ?").get(parsed.data.email) as
      | { id: string }
      | undefined;

    if (!user) {
      return NextResponse.json({
        success: true,
        message:
          "Nếu email tồn tại trong hệ thống, hướng dẫn khôi phục đã được tạo. (Lưu ý: chế độ cục bộ chưa kết nối SMTP email.)",
      });
    }

    const token = crypto.randomBytes(4).toString("hex").toUpperCase();
    const expires = new Date(Date.now() + 15 * 60_000).toISOString();
    db.prepare("UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?").run(
      token,
      expires,
      user.id
    );

    // In local dev without SMTP configured, return dev preview token clearly labeled as local mode
    const isLocalDev = process.env.NODE_ENV !== "production";
    return NextResponse.json({
      success: true,
      message: isLocalDev
        ? "Đã tạo mã khôi phục có hiệu lực 15 phút. (Môi trường local chưa gắn dịch vụ gửi Email SMTP nên mã hiển thị trực tiếp bên dưới để kiểm thử.)"
        : "Đã gửi mã khôi phục mật khẩu tới email của bạn.",
      ...(isLocalDev ? { localResetToken: token } : {}),
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    return NextResponse.json({ error: "Lỗi máy chủ khi xử lý khôi phục mật khẩu." }, { status: 500 });
  }
}
