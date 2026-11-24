import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db/sqlite";

const updateUserSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["student", "admin"]),
});

export async function PATCH(request: Request) {
  const { user: adminUser, errorResponse } = await requireAdmin();
  if (errorResponse || !adminUser) return errorResponse;

  const body = await request.json().catch(() => null);
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dữ liệu phân quyền không hợp lệ." }, { status: 400 });
  }

  if (parsed.data.userId === adminUser.id && parsed.data.role !== "admin") {
    return NextResponse.json(
      { error: "Bạn không thể tự hạ quyền quản trị của chính mình." },
      { status: 400 }
    );
  }

  const db = getDb();
  const res = db
    .prepare("UPDATE profiles SET role = ?, updated_at = ? WHERE id = ?")
    .run(parsed.data.role, new Date().toISOString(), parsed.data.userId);

  if (res.changes === 0) {
    return NextResponse.json({ error: "Không tìm thấy người dùng." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
