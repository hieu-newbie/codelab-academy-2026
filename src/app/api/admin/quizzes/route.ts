import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db/sqlite";
import { generateId } from "@/lib/crypto";

const createQuestionSchema = z.object({
  type: z.literal("question"),
  quiz_id: z.string().min(1),
  question_type: z.enum([
    "single_choice",
    "multiple_choice",
    "true_false",
    "fill_blank",
    "predict_output",
    "find_bug",
  ]),
  prompt: z.string().trim().min(5).max(1500),
  code_snippet: z.string().nullable().optional(),
  options: z.array(z.string()).default([]),
  correct_answer: z.union([z.string(), z.array(z.string())]),
  explanation: z.string().trim().min(5).max(1500),
  topic_tag: z.string().trim().min(2).max(80),
  points: z.number().int().min(5).max(100).default(15),
});

const createQuizSchema = z.object({
  type: z.literal("quiz"),
  course_id: z.string().min(1),
  slug: z.string().trim().min(3).max(120).regex(/^[a-z0-9-]+$/),
  title: z.string().trim().min(5).max(180),
  description: z.string().trim().max(500).default(""),
  topic: z.string().trim().min(2).max(80),
  difficulty: z.enum(["Cơ bản", "Trung cấp", "Nâng cao"]),
  time_limit_minutes: z.number().int().min(3).max(90).default(15),
  pass_score_percent: z.number().int().min(40).max(100).default(70),
  xp_reward: z.number().int().min(10).max(500).default(80),
});

export async function POST(request: Request) {
  const { errorResponse } = await requireAdmin();
  if (errorResponse) return errorResponse;

  const body = await request.json().catch(() => null);
  const db = getDb();

  if (body?.type === "question") {
    const parsed = createQuestionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dữ liệu câu hỏi không hợp lệ." },
        { status: 400 }
      );
    }
    const id = generateId("qq");
    const maxSort = (
      db.prepare("SELECT COALESCE(MAX(sort_order), 0) as m FROM quiz_questions WHERE quiz_id = ?").get(parsed.data.quiz_id) as { m: number }
    ).m;
    db.prepare(`
      INSERT INTO quiz_questions
        (id, quiz_id, question_type, prompt, code_snippet, options_json, correct_answer_json, explanation, topic_tag, points, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      parsed.data.quiz_id,
      parsed.data.question_type,
      parsed.data.prompt,
      parsed.data.code_snippet ?? null,
      JSON.stringify(parsed.data.options),
      JSON.stringify(parsed.data.correct_answer),
      parsed.data.explanation,
      parsed.data.topic_tag,
      parsed.data.points,
      maxSort + 1
    );
    return NextResponse.json({ id }, { status: 201 });
  }

  const parsed = createQuizSchema.safeParse({ ...body, type: "quiz" });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Dữ liệu bài kiểm tra không hợp lệ." },
      { status: 400 }
    );
  }
  const id = generateId("quiz");
  try {
    db.prepare(`
      INSERT INTO quizzes
        (id, course_id, section_id, slug, title, description, topic, difficulty, time_limit_minutes, pass_score_percent, xp_reward, created_at)
      VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      parsed.data.course_id,
      parsed.data.slug,
      parsed.data.title,
      parsed.data.description,
      parsed.data.topic,
      parsed.data.difficulty,
      parsed.data.time_limit_minutes,
      parsed.data.pass_score_percent,
      parsed.data.xp_reward,
      new Date().toISOString()
    );
    return NextResponse.json({ id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Slug bài kiểm tra đã tồn tại." }, { status: 409 });
  }
}

export async function DELETE(request: Request) {
  const { errorResponse } = await requireAdmin();
  if (errorResponse) return errorResponse;

  const url = new URL(request.url);
  const questionId = url.searchParams.get("questionId");
  const quizId = url.searchParams.get("quizId");
  const db = getDb();

  if (questionId) {
    db.prepare("DELETE FROM quiz_questions WHERE id = ?").run(questionId);
    return NextResponse.json({ deleted: true });
  }
  if (quizId) {
    db.prepare("DELETE FROM quizzes WHERE id = ?").run(quizId);
    return NextResponse.json({ deleted: true });
  }
  return NextResponse.json({ error: "Thiếu ID cần xóa." }, { status: 400 });
}
