import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db/sqlite";
import { generateId } from "@/lib/crypto";

const testCaseSchema = z.object({
  input_data: z.string(),
  expected_output: z.string().min(1),
  is_sample: z.boolean().default(false),
});

const exerciseSchema = z.object({
  id: z.string().optional(),
  code: z.string().trim().min(2).max(20),
  slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9-]+$/),
  title: z.string().trim().min(3).max(180),
  description: z.string().trim().min(10).max(4000),
  category: z.string().trim().min(2).max(60),
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  language: z.enum(["cpp", "html", "css", "javascript"]).default("cpp"),
  input_format: z.string().trim().min(1).max(1000),
  output_format: z.string().trim().min(1).max(1000),
  constraints: z.string().trim().min(1).max(500),
  sample_input: z.string().default(""),
  sample_output: z.string().default(""),
  sample_explanation: z.string().default(""),
  starter_code: z.string().min(1),
  hints: z.array(z.string()).default([]),
  solution_code: z.string().min(1),
  solution_explanation: z.string().default(""),
  time_limit_ms: z.number().int().min(250).max(5000).default(1000),
  memory_limit_kb: z.number().int().min(32768).max(524288).default(262144),
  xp_reward: z.number().int().min(10).max(500).default(80),
  test_cases: z.array(testCaseSchema).min(1, "Cần ít nhất 1 test case"),
});

export async function POST(request: Request) {
  const { errorResponse } = await requireAdmin();
  if (errorResponse) return errorResponse;

  const body = await request.json().catch(() => null);
  const parsed = exerciseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Dữ liệu bài tập không hợp lệ." },
      { status: 400 }
    );
  }

  const db = getDb();
  const id = generateId("ex");
  const now = new Date().toISOString();
  const d = parsed.data;

  try {
    db.prepare(`
      INSERT INTO exercises
        (id, code, slug, title, description, category, difficulty, language, input_format, output_format, constraints, sample_input, sample_output, sample_explanation, starter_code, hints_json, solution_code, solution_explanation, time_limit_ms, memory_limit_kb, xp_reward, is_published, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `).run(
      id, d.code, d.slug, d.title, d.description, d.category, d.difficulty, d.language,
      d.input_format, d.output_format, d.constraints, d.sample_input, d.sample_output,
      d.sample_explanation, d.starter_code, JSON.stringify(d.hints), d.solution_code,
      d.solution_explanation, d.time_limit_ms, d.memory_limit_kb, d.xp_reward, now
    );

    const insertTc = db.prepare(
      "INSERT INTO test_cases (id, exercise_id, input_data, expected_output, is_sample, sort_order) VALUES (?, ?, ?, ?, ?, ?)"
    );
    d.test_cases.forEach((tc, idx) => {
      insertTc.run(generateId("tc"), id, tc.input_data, tc.expected_output, tc.is_sample ? 1 : 0, idx + 1);
    });

    return NextResponse.json({ id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Mã bài tập hoặc slug đã tồn tại." }, { status: 409 });
  }
}

export async function PATCH(request: Request) {
  const { errorResponse } = await requireAdmin();
  if (errorResponse) return errorResponse;

  const body = await request.json().catch(() => null);
  const parsed = exerciseSchema.extend({ id: z.string().min(1) }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Dữ liệu cập nhật bài tập không hợp lệ." },
      { status: 400 }
    );
  }

  const db = getDb();
  const d = parsed.data;
  db.prepare(`
    UPDATE exercises
    SET code = ?, slug = ?, title = ?, description = ?, category = ?, difficulty = ?,
        input_format = ?, output_format = ?, constraints = ?, sample_input = ?,
        sample_output = ?, sample_explanation = ?, starter_code = ?, hints_json = ?,
        solution_code = ?, solution_explanation = ?, time_limit_ms = ?, memory_limit_kb = ?, xp_reward = ?
    WHERE id = ?
  `).run(
    d.code, d.slug, d.title, d.description, d.category, d.difficulty,
    d.input_format, d.output_format, d.constraints, d.sample_input,
    d.sample_output, d.sample_explanation, d.starter_code, JSON.stringify(d.hints),
    d.solution_code, d.solution_explanation, d.time_limit_ms, d.memory_limit_kb, d.xp_reward, d.id
  );

  db.prepare("DELETE FROM test_cases WHERE exercise_id = ?").run(d.id);
  const insertTc = db.prepare(
    "INSERT INTO test_cases (id, exercise_id, input_data, expected_output, is_sample, sort_order) VALUES (?, ?, ?, ?, ?, ?)"
  );
  d.test_cases.forEach((tc, idx) => {
    insertTc.run(generateId("tc"), d.id, tc.input_data, tc.expected_output, tc.is_sample ? 1 : 0, idx + 1);
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const { errorResponse } = await requireAdmin();
  if (errorResponse) return errorResponse;

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Thiếu mã bài tập." }, { status: 400 });

  const db = getDb();
  db.prepare("DELETE FROM exercises WHERE id = ?").run(id);
  return NextResponse.json({ deleted: true });
}
