import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db/sqlite";

const updateBugSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["open", "in_review", "resolved"]),
  admin_note: z.string().trim().max(1000).nullable().optional(),
});

export async function PATCH(request: Request) {
  const { errorResponse } = await requireAdmin();
  if (errorResponse) return errorResponse;

  const body = await request.json().catch(() => null);
  const parsed = updateBugSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dữ liệu cập nhật báo lỗi không hợp lệ." }, { status: 400 });
  }

  const db = getDb();
  const res = db
    .prepare("UPDATE bug_reports SET status = ?, admin_note = ?, updated_at = ? WHERE id = ?")
    .run(parsed.data.status, parsed.data.admin_note ?? null, new Date().toISOString(), parsed.data.id);

  if (res.changes === 0) {
    return NextResponse.json({ error: "Không tìm thấy báo lỗi." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
