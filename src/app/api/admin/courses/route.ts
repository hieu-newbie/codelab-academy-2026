import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db/sqlite";
import { generateId } from "@/lib/crypto";

const createCourseSchema = z.object({
  type: z.literal("course"),
  slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9-]+$/),
  title: z.string().trim().min(3).max(150),
  subtitle: z.string().trim().max(200).optional().default(""),
  language: z.enum(["cpp", "html", "css", "javascript"]),
  description: z.string().trim().min(10).max(2000),
  target_audience: z.string().trim().min(5).max(1000),
  learning_outcomes: z.array(z.string().trim().min(1)).default([]),
  difficulty: z.enum(["Cơ bản", "Trung cấp", "Nâng cao"]),
  estimated_hours: z.number().min(1).max(200),
});

const createSectionSchema = z.object({
  type: z.literal("section"),
  course_id: z.string().min(1),
  title: z.string().trim().min(3).max(150),
  description: z.string().trim().max(500).optional().default(""),
  sort_order: z.number().int().min(1).max(999).optional().default(1),
});

const updateCourseSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(3).max(150),
  subtitle: z.string().trim().max(200).optional().default(""),
  description: z.string().trim().min(10).max(2000),
  difficulty: z.enum(["Cơ bản", "Trung cấp", "Nâng cao"]),
  estimated_hours: z.number().min(1).max(200),
  is_published: z.boolean().optional().default(true),
});

export async function POST(request: Request) {
  const { errorResponse } = await requireAdmin();
  if (errorResponse) return errorResponse;

  const body = await request.json().catch(() => null);
  const db = getDb();
  const now = new Date().toISOString();

  if (body?.type === "section") {
    const parsed = createSectionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Dữ liệu chương không hợp lệ." }, { status: 400 });
    }
    const id = generateId("sec");
    db.prepare(`
      INSERT INTO course_sections (id, course_id, title, description, sort_order, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, parsed.data.course_id, parsed.data.title, parsed.data.description, parsed.data.sort_order, now);
    return NextResponse.json({ id }, { status: 201 });
  }

  const parsed = createCourseSchema.safeParse({ ...body, type: "course" });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Dữ liệu khóa học không hợp lệ." }, { status: 400 });
  }

  const id = generateId("course");
  const maxSort = (db.prepare("SELECT COALESCE(MAX(sort_order), 0) as m FROM courses").get() as { m: number }).m;
  try {
    db.prepare(`
      INSERT INTO courses
        (id, slug, title, subtitle, language, description, target_audience, learning_outcomes_json, difficulty, estimated_hours, icon, accent_color, is_published, sort_order, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'code-2', 'blue', 1, ?, ?)
    `).run(
      id,
      parsed.data.slug,
      parsed.data.title,
      parsed.data.subtitle,
      parsed.data.language,
      parsed.data.description,
      parsed.data.target_audience,
      JSON.stringify(parsed.data.learning_outcomes),
      parsed.data.difficulty,
      parsed.data.estimated_hours,
      maxSort + 1,
      now
    );
    return NextResponse.json({ id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Slug khóa học đã tồn tại." }, { status: 409 });
  }
}

export async function PATCH(request: Request) {
  const { errorResponse } = await requireAdmin();
  if (errorResponse) return errorResponse;

  const body = await request.json().catch(() => null);
  const parsed = updateCourseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Dữ liệu cập nhật không hợp lệ." }, { status: 400 });
  }

  const db = getDb();
  db.prepare(`
    UPDATE courses
    SET title = ?, subtitle = ?, description = ?, difficulty = ?, estimated_hours = ?, is_published = ?
    WHERE id = ?
  `).run(
    parsed.data.title,
    parsed.data.subtitle,
    parsed.data.description,
    parsed.data.difficulty,
    parsed.data.estimated_hours,
    parsed.data.is_published ? 1 : 0,
    parsed.data.id
  );

  return NextResponse.json({ success: true });
}
