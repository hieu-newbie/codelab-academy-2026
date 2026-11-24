import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser, requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db/sqlite";
import { generateId } from "@/lib/crypto";
import { executeWithJudge0, outputsMatch } from "@/lib/judge0";
import { gradeWasmSubmission, persistSubmissionAtomic } from "@/lib/grading-service";
import { checkRateLimit } from "@/lib/rate-limit";
import type { SubmissionStatus, TestCaseResult } from "@/types/codelab";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const user = await getSessionUser();
  const db = getDb();

  const ex = db
    .prepare("SELECT * FROM exercises WHERE slug = ? OR id = ? LIMIT 1")
    .get(slug, slug) as (Record<string, unknown> & { id: string; hints_json: string }) | undefined;

  if (!ex) {
    return NextResponse.json({ error: "Không tìm thấy bài tập." }, { status: 404 });
  }

  const sampleTests = db
    .prepare(
      "SELECT id, input_data, expected_output, is_sample, sort_order FROM test_cases WHERE exercise_id = ? AND is_sample = 1 ORDER BY sort_order ASC"
    )
    .all(ex.id);
  const totalTestCount = (
    db.prepare("SELECT COUNT(*) as c FROM test_cases WHERE exercise_id = ?").get(ex.id) as { c: number }
  ).c;

  let submissions: Array<Record<string, unknown>> = [];
  let bookmarked = false;
  let solved = false;

  if (user) {
    const rawSubs = db.prepare(`
      SELECT id, language, source_code, status, passed_tests, total_tests,
             execution_time_ms, memory_used_kb, compiler_output, stderr, stdout,
             test_results_json, xp_awarded, created_at
      FROM submissions
      WHERE user_id = ? AND exercise_id = ?
      ORDER BY created_at DESC
      LIMIT 20
    `).all(user.id, ex.id) as Array<Record<string, unknown> & { status: string; test_results_json: string }>;

    submissions = rawSubs.map((s) => ({
      ...s,
      test_results: JSON.parse(s.test_results_json || "[]"),
    }));
    solved = rawSubs.some((s) => s.status === "Accepted");
    bookmarked = Boolean(
      db
        .prepare("SELECT id FROM exercise_bookmarks WHERE user_id = ? AND exercise_id = ?")
        .get(user.id, ex.id)
    );
  }

  return NextResponse.json({
    exercise: {
      id: ex.id,
      code: ex.code,
      slug: ex.slug,
      title: ex.title,
      description: ex.description,
      category: ex.category,
      difficulty: ex.difficulty,
      language: ex.language,
      input_format: ex.input_format,
      output_format: ex.output_format,
      constraints: ex.constraints,
      sample_input: ex.sample_input,
      sample_output: ex.sample_output,
      sample_explanation: ex.sample_explanation,
      starter_code: ex.starter_code,
      hints: JSON.parse(ex.hints_json || "[]"),
      solution_code: ex.solution_code,
      solution_explanation: ex.solution_explanation,
      time_limit_ms: Number(ex.time_limit_ms),
      memory_limit_kb: Number(ex.memory_limit_kb),
      xp_reward: Number(ex.xp_reward),
      total_test_cases: totalTestCount,
      sample_tests: sampleTests,
      solved,
      bookmarked,
    },
    submissions,
  });
}

const wasmRunItemSchema = z.object({
  testCaseId: z.string().min(1),
  status: z.enum([
    "Accepted",
    "Wrong Answer",
    "Compilation Error",
    "Runtime Error",
    "Time Limit Exceeded",
    "Memory Limit Exceeded",
  ]),
  stdout: z.string().max(1048576).default(""),
  stderr: z.string().max(65536).default(""),
  timeMs: z.number().nullable().optional(),
  memoryKb: z.number().nullable().optional(),
});

const submitSchema = z.object({
  action: z
    .enum(["submit", "toggle_bookmark", "prepare_wasm_grade", "submit_wasm_results"])
    .default("submit"),
  sourceCode: z.string().min(1).max(65536).optional(),
  language: z.enum(["cpp"]).optional().default("cpp"),
  compileFailed: z.boolean().optional().default(false),
  compileOutput: z.string().max(65536).optional().default(""),
  runs: z.array(wasmRunItemSchema).max(50).optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { user, errorResponse } = await requireUser();
  if (errorResponse || !user) return errorResponse;

  const { slug } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dữ liệu nộp bài không hợp lệ." }, { status: 400 });
  }

  const db = getDb();
  const ex = db
    .prepare("SELECT * FROM exercises WHERE slug = ? OR id = ? LIMIT 1")
    .get(slug, slug) as
    | {
        id: string;
        time_limit_ms: number;
        memory_limit_kb: number;
        xp_reward: number;
      }
    | undefined;

  if (!ex) {
    return NextResponse.json({ error: "Không tìm thấy bài tập." }, { status: 404 });
  }

  const now = new Date().toISOString();

  if (parsed.data.action === "toggle_bookmark") {
    const existing = db
      .prepare("SELECT id FROM exercise_bookmarks WHERE user_id = ? AND exercise_id = ?")
      .get(user.id, ex.id) as { id: string } | undefined;
    if (existing) {
      db.prepare("DELETE FROM exercise_bookmarks WHERE id = ?").run(existing.id);
      return NextResponse.json({ bookmarked: false });
    }
    db.prepare("INSERT INTO exercise_bookmarks (id, user_id, exercise_id, created_at) VALUES (?, ?, ?, ?)")
      .run(generateId("ebm"), user.id, ex.id, now);
    return NextResponse.json({ bookmarked: true });
  }

  const testCases = db
    .prepare(
      "SELECT id, input_data, expected_output, is_sample, sort_order FROM test_cases WHERE exercise_id = ? ORDER BY sort_order ASC"
    )
    .all(ex.id) as Array<{
    id: string;
    input_data: string;
    expected_output: string;
    is_sample: number;
    sort_order: number;
  }>;

  if (testCases.length === 0) {
    return NextResponse.json({ error: "Bài tập chưa có test case nào để chấm." }, { status: 400 });
  }

  if (parsed.data.action === "prepare_wasm_grade") {
    return NextResponse.json({
      time_limit_ms: ex.time_limit_ms,
      test_cases: testCases.map((tc) => ({
        id: tc.id,
        sort_order: tc.sort_order,
        is_sample: Boolean(tc.is_sample),
        input_data: tc.input_data,
      })),
    });
  }

  const rl = checkRateLimit(`submit:${user.id}`, 15, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Bạn nộp bài quá nhanh. Vui lòng thử lại sau ${rl.retryAfterSec}s.` },
      { status: 429 }
    );
  }

  const sourceCode = parsed.data.sourceCode?.trim();
  if (!sourceCode) {
    return NextResponse.json({ error: "Vui lòng viết mã nguồn trước khi nộp bài." }, { status: 400 });
  }

  if (parsed.data.action === "submit_wasm_results") {
    const persisted = gradeWasmSubmission({
      db,
      userId: user.id,
      exerciseId: ex.id,
      xpReward: ex.xp_reward,
      language: parsed.data.language,
      sourceCode,
      compileFailed: parsed.data.compileFailed,
      compileOutput: parsed.data.compileOutput,
      runs: parsed.data.runs ?? [],
    });

    return NextResponse.json({
      configured: true,
      engine: "wasm",
      ...persisted,
    });
  }

  // Priority Judge0 Mode when JUDGE0_API_URL is configured
  const testResults: TestCaseResult[] = [];
  let passedCount = 0;
  let overallStatus: SubmissionStatus = "Accepted";
  let maxTimeMs = 0;
  let maxMemKb = 0;
  let compilerOutput = "";
  let firstStderr = "";
  let firstStdout = "";

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const res = await executeWithJudge0({
      sourceCode,
      stdin: tc.input_data,
      cpuTimeLimitSec: Math.max(1, ex.time_limit_ms / 1000),
      memoryLimitKb: ex.memory_limit_kb,
    });

    if (!res.configured) {
      return NextResponse.json(
        {
          configured: false,
          status: "Not Configured",
          message: res.message,
          setupGuide: res.setupGuide,
        },
        { status: 503 }
      );
    }

    if (res.timeMs !== null) maxTimeMs = Math.max(maxTimeMs, res.timeMs);
    if (res.memoryKb !== null) maxMemKb = Math.max(maxMemKb, res.memoryKb);
    if (res.compileOutput && !compilerOutput) compilerOutput = res.compileOutput;
    if (res.stderr && !firstStderr) firstStderr = res.stderr;
    if (i === 0) firstStdout = res.stdout;

    let tcStatus: SubmissionStatus = res.status;
    if (tcStatus === "Accepted") {
      if (outputsMatch(res.stdout, tc.expected_output)) {
        passedCount++;
      } else {
        tcStatus = "Wrong Answer";
      }
    }

    testResults.push({
      testCaseIndex: i + 1,
      isSample: Boolean(tc.is_sample),
      status: tcStatus,
      ...(tc.is_sample
        ? {
            input: tc.input_data,
            expectedOutput: tc.expected_output,
            actualOutput: res.stdout,
            stderr: res.stderr || undefined,
          }
        : {}),
      timeMs: res.timeMs ?? undefined,
      memoryKb: res.memoryKb ?? undefined,
    });

    if (tcStatus === "Compilation Error") {
      overallStatus = "Compilation Error";
      break;
    }
    if (tcStatus !== "Accepted" && overallStatus === "Accepted") {
      overallStatus = tcStatus;
    }
  }

  const persisted = persistSubmissionAtomic({
    db,
    userId: user.id,
    exerciseId: ex.id,
    xpReward: ex.xp_reward,
    language: parsed.data.language,
    sourceCode,
    overallStatus,
    passedCount,
    totalTests: testCases.length,
    maxTimeMs,
    maxMemKb,
    compilerOutput,
    firstStderr,
    firstStdout,
    testResults,
  });

  return NextResponse.json({
    configured: true,
    engine: "judge0",
    ...persisted,
  });
}
