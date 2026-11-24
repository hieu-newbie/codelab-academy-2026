import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db/sqlite";
import { generateId } from "@/lib/crypto";

const bugSchema = z.object({
  target_type: z.enum(["lesson", "exercise", "quiz", "system"]),
  target_id: z.string().trim().min(1).max(120),
  target_title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(10, "Mô tả lỗi tối thiểu 10 ký tự").max(1500),
});

export async function POST(request: Request) {
  const { user, errorResponse } = await requireUser();
  if (errorResponse || !user) return errorResponse;

  const body = await request.json().catch(() => null);
  const parsed = bugSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Nội dung báo lỗi không hợp lệ." },
      { status: 400 }
    );
  }

  const db = getDb();
  const now = new Date().toISOString();
  const id = generateId("bug");

  db.prepare(`
    INSERT INTO bug_reports (id, user_id, target_type, target_id, target_title, description, status, admin_note, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 'open', NULL, ?, ?)
  `).run(
    id,
    user.id,
    parsed.data.target_type,
    parsed.data.target_id,
    parsed.data.target_title,
    parsed.data.description,
    now,
    now
  );

  return NextResponse.json(
    { id, message: "Cảm ơn bạn đã báo lỗi! Đội ngũ quản trị CODELAB sẽ kiểm tra sớm." },
    { status: 201 }
  );
}
