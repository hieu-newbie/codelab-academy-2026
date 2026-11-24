import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db/sqlite";
import { generateId } from "@/lib/crypto";
import { getAiProviderStatus } from "@/lib/db/supabase-client";

export async function GET() {
  const { user, errorResponse } = await requireUser();
  if (errorResponse || !user) return errorResponse;

  const db = getDb();
  const conversations = db.prepare(`
    SELECT ac.*, c.title as course_title, l.title as lesson_title, e.title as exercise_title
    FROM ai_conversations ac
    LEFT JOIN courses c ON c.id = ac.course_id
    LEFT JOIN lessons l ON l.id = ac.lesson_id
    LEFT JOIN exercises e ON e.id = ac.exercise_id
    WHERE ac.user_id = ?
    ORDER BY ac.updated_at DESC
    LIMIT 40
  `).all(user.id);

  return NextResponse.json({
    conversations,
    ai_status: getAiProviderStatus(),
  });
}

const createConvSchema = z.object({
  title: z.string().trim().min(1).max(120).optional().default("Cuộc trò chuyện mới"),
  course_id: z.string().nullable().optional(),
  lesson_id: z.string().nullable().optional(),
  exercise_id: z.string().nullable().optional(),
});

export async function POST(request: Request) {
  const { user, errorResponse } = await requireUser();
  if (errorResponse || !user) return errorResponse;

  const body = await request.json().catch(() => ({}));
  const parsed = createConvSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dữ liệu tạo hội thoại không hợp lệ." }, { status: 400 });
  }

  const db = getDb();
  const id = generateId("conv");
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO ai_conversations (id, user_id, title, course_id, lesson_id, exercise_id, last_interaction_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?)
  `).run(
    id,
    user.id,
    parsed.data.title,
    parsed.data.course_id ?? null,
    parsed.data.lesson_id ?? null,
    parsed.data.exercise_id ?? null,
    now,
    now
  );

  const conv = db.prepare("SELECT * FROM ai_conversations WHERE id = ?").get(id);
  return NextResponse.json({ conversation: conv }, { status: 201 });
}
