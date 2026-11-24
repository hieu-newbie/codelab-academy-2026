import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db/sqlite";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { user, errorResponse } = await requireUser();
  if (errorResponse || !user) return errorResponse;

  const { id } = await context.params;
  const db = getDb();
  const conv = db
    .prepare(`
      SELECT ac.*, c.title as course_title, l.title as lesson_title, e.title as exercise_title
      FROM ai_conversations ac
      LEFT JOIN courses c ON c.id = ac.course_id
      LEFT JOIN lessons l ON l.id = ac.lesson_id
      LEFT JOIN exercises e ON e.id = ac.exercise_id
      WHERE ac.id = ? AND ac.user_id = ?
    `)
    .get(id, user.id);

  if (!conv) {
    return NextResponse.json({ error: "Không tìm thấy cuộc trò chuyện." }, { status: 404 });
  }

  const messages = db
    .prepare("SELECT * FROM ai_messages WHERE conversation_id = ? ORDER BY created_at ASC")
    .all(id);

  return NextResponse.json({ conversation: conv, messages });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { user, errorResponse } = await requireUser();
  if (errorResponse || !user) return errorResponse;

  const { id } = await context.params;
  const db = getDb();
  const result = db
    .prepare("DELETE FROM ai_conversations WHERE id = ? AND user_id = ?")
    .run(id, user.id);

  if (result.changes === 0) {
    return NextResponse.json({ error: "Không tìm thấy cuộc trò chuyện để xóa." }, { status: 404 });
  }

  return NextResponse.json({ deleted: true });
}
