import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db/sqlite";
import { generateId } from "@/lib/crypto";

const lessonSchema = z.object({
  id: z.string().optional(),
  course_id: z.string().min(1),
  section_id: z.string().min(1),
  slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9-]+$/),
  title: z.string().trim().min(3).max(180),
  summary: z.string().trim().max(400).default(""),
  estimated_minutes: z.number().int().min(3).max(180).default(15),
  xp_reward: z.number().int().min(10).max(500).default(60),
  language: z.enum(["cpp", "html", "css", "javascript"]),
  content: z.record(z.string(), z.unknown()),
});

export async function POST(request: Request) {
  const { errorResponse } = await requireAdmin();
  if (errorResponse) return errorResponse;

  const body = await request.json().catch(() => null);
  const parsed = lessonSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Dữ liệu bài học không hợp lệ." },
      { status: 400 }
    );
  }

  const db = getDb();
  const id = generateId("lesson");
  const now = new Date().toISOString();
  const maxOrder = (
    db.prepare("SELECT COALESCE(MAX(sort_order), 0) as m FROM lessons WHERE section_id = ?").get(parsed.data.section_id) as { m: number }
  ).m;

  try {
    db.prepare(`
      INSERT INTO lessons
        (id, section_id, course_id, slug, title, summary, estimated_minutes, xp_reward, sort_order, language, content_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      parsed.data.section_id,
      parsed.data.course_id,
      parsed.data.slug,
      parsed.data.title,
      parsed.data.summary,
      parsed.data.estimated_minutes,
      parsed.data.xp_reward,
      maxOrder + 1,
      parsed.data.language,
      JSON.stringify(parsed.data.content),
      now,
      now
    );
    return NextResponse.json({ id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Slug bài học đã tồn tại trong khóa học này." }, { status: 409 });
  }
}

export async function PATCH(request: Request) {
  const { errorResponse } = await requireAdmin();
  if (errorResponse) return errorResponse;

  const body = await request.json().catch(() => null);
  const parsed = lessonSchema.extend({ id: z.string().min(1) }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Dữ liệu cập nhật bài học không hợp lệ." },
      { status: 400 }
    );
  }

  const db = getDb();
  const now = new Date().toISOString();
  const res = db.prepare(`
    UPDATE lessons
    SET section_id = ?, course_id = ?, slug = ?, title = ?, summary = ?,
        estimated_minutes = ?, xp_reward = ?, language = ?, content_json = ?, updated_at = ?
    WHERE id = ?
  `).run(
    parsed.data.section_id,
    parsed.data.course_id,
    parsed.data.slug,
    parsed.data.title,
    parsed.data.summary,
    parsed.data.estimated_minutes,
    parsed.data.xp_reward,
    parsed.data.language,
    JSON.stringify(parsed.data.content),
    now,
    parsed.data.id
  );

  if (res.changes === 0) {
    return NextResponse.json({ error: "Không tìm thấy bài học." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const { errorResponse } = await requireAdmin();
  if (errorResponse) return errorResponse;

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Thiếu mã bài học." }, { status: 400 });

  const db = getDb();
  db.prepare("DELETE FROM lessons WHERE id = ?").run(id);
  return NextResponse.json({ deleted: true });
}
