import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { commands } from "@yowasp/clang";
import { WASI, File as WasiFile, OpenFile, ConsoleStdout } from "@bjorn3/browser_wasi_shim";
import manifest from "@/app/manifest";
import { BITS_STDCPP_HEADER } from "@/lib/cpp-bits-header";
import { hashPassword, signSessionToken, verifyPassword, verifySessionToken } from "@/lib/crypto";
import { gradeQuizAttempt } from "@/lib/quiz-grader";
import { executeWithJudge0, mapJudge0Status, normalizeOutput, outputsMatch } from "@/lib/judge0";
import { parseClangDiagnostics, translateClangMessageToVietnamese } from "@/lib/cpp-diagnostics";
import { gradeWasmSubmission } from "@/lib/grading-service";
import {
  askAiCodingTutor,
  buildTutorSystemInstruction,
  buildTutorUserPrompt,
  classifyAiApiError,
} from "@/lib/ai-tutor";
import { analyzeCppCodeStatically, generateOfflineTutorReply } from "@/lib/offline-tutor";
import { checkWebGpuSupport } from "@/lib/webllm-tutor";
import { createTestDb } from "@/lib/db/sqlite";
import {
  computeLevelInfo,
  evaluateAndUnlockAchievements,
  grantXp,
  recordLearningActivity,
} from "@/lib/gamification";

describe("Security: Cryptography & Session Signing", () => {
  it("hashes and verifies passwords with scrypt securely", () => {
    const hash = hashPassword("Secret@2026");
    expect(hash.startsWith("scrypt:")).toBe(true);
    expect(verifyPassword("Secret@2026", hash)).toBe(true);
    expect(verifyPassword("WrongPassword", hash)).toBe(false);
  });

  it("signs, verifies, and rejects tampered session tokens", () => {
    const token = signSessionToken({ uid: "usr_123", role: "student" });
    const parsed = verifySessionToken(token);
    expect(parsed?.uid).toBe("usr_123");
    expect(parsed?.role).toBe("student");

    const tampered = `${token.slice(0, -2)}xx`;
    expect(verifySessionToken(tampered)).toBeNull();
  });
});

describe("Quiz Grader: All 6 Question Types & Weak Topics", () => {
  it("accurately grades single, multi, true/false, fill_blank, predict_output, find_bug", () => {
    const summary = gradeQuizAttempt(
      [
        {
          id: "q1",
          question_type: "single_choice",
          prompt: "p1",
          correct_answer: "long long",
          explanation: "e1",
          topic_tag: "Kiểu dữ liệu",
          points: 10,
        },
        {
          id: "q2",
          question_type: "multiple_choice",
          prompt: "p2",
          correct_answer: ["a", "c"],
          explanation: "e2",
          topic_tag: "Biến",
          points: 20,
        },
        {
          id: "q3",
          question_type: "true_false",
          prompt: "p3",
          correct_answer: "Sai",
          explanation: "e3",
          topic_tag: "Toán tử",
          points: 10,
        },
        {
          id: "q4",
          question_type: "fill_blank",
          prompt: "p4",
          correct_answer: "iomanip",
          explanation: "e4",
          topic_tag: "Nhập xuất",
          points: 15,
        },
        {
          id: "q5",
          question_type: "predict_output",
          prompt: "p5",
          correct_answer: "4 3",
          explanation: "e5",
          topic_tag: "Toán tử",
          points: 15,
        },
        {
          id: "q6",
          question_type: "find_bug",
          prompt: "p6",
          correct_answer: "Thiếu dấu ;",
          explanation: "e6",
          topic_tag: "Cú pháp",
          points: 30,
        },
      ],
      {
        q1: "long long",
        q2: ["c", "a"],
        q3: "Đúng", // wrong
        q4: "  IOMANIP ", // case-insensitive trim pass
        q5: "4 3",
        q6: "Thiếu dấu ;",
      },
      70
    );

    expect(summary.score).toBe(90);
    expect(summary.max_score).toBe(100);
    expect(summary.percentage).toBe(90);
    expect(summary.passed).toBe(true);
    expect(summary.weak_topics).toEqual(["Toán tử"]);
  });
});

describe("Judge0 Sandbox Integrity", () => {
  it("normalizes trailing whitespace and line endings accurately", () => {
    expect(outputsMatch("10 20  \r\n30 \r\n", "10 20\n30")).toBe(true);
    expect(outputsMatch("10 21", "10 20")).toBe(false);
  });

  it("maps Judge0 statuses including MLE/TLE/CE/RE", () => {
    expect(mapJudge0Status(3, 1024, 262144)).toBe("Accepted");
    expect(mapJudge0Status(4, 1024, 262144)).toBe("Wrong Answer");
    expect(mapJudge0Status(5, 1024, 262144)).toBe("Time Limit Exceeded");
    expect(mapJudge0Status(6, null, 262144)).toBe("Compilation Error");
    expect(mapJudge0Status(11, 1024, 262144)).toBe("Runtime Error");
    expect(mapJudge0Status(3, 300000, 262144)).toBe("Memory Limit Exceeded");
  });

  it("never fakes execution results when JUDGE0_API_URL is unset", async () => {
    const prev = process.env.JUDGE0_API_URL;
    delete process.env.JUDGE0_API_URL;
    const res = await executeWithJudge0({ sourceCode: "int main(){return 0;}" });
    process.env.JUDGE0_API_URL = prev;

    expect(res.configured).toBe(false);
    expect(res.status).toBe("Not Configured");
    expect(res.setupGuide?.length).toBeGreaterThan(0);
  });
});

describe("AI Tutor Provider Priority, Smart Offline Analyzer, Fallback & WebGPU Check", () => {
  it("builds Vietnamese step-by-step tutor system prompt and full problem/code/I-O/error user prompt", () => {
    const sys = buildTutorSystemInstruction({
      courseTitle: "Lập trình C++",
      lessonTitle: "Mảng một chiều",
      lessonOrder: 8,
      exerciseTitle: "Tổng hai số nguyên lớn",
      mode: "hint",
    });
    expect(sys).toContain("Mảng một chiều");
    expect(sys).toContain("Không sử dụng khái niệm nâng cao");
    expect(sys).toContain("KHÔNG ĐƯA LỜI GIẢI HOÀN CHỈNH NGAY");

    const userPrompt = buildTutorUserPrompt("Tại sao kết quả bị âm?", {
      exerciseTitle: "Tổng hai số nguyên lớn",
      problemStatement: "Tính tổng a + b",
      problemConstraints: "-9×10^18 <= a, b <= 9×10^18",
      codeContext: "int a, b;\ncin >> a >> b;\ncout << a + b;",
      stdin: "1500000000 2700000000",
      stdout: "-647483649",
      expectedOutput: "4200000000",
      executionStatus: "Wrong Answer",
    });
    expect(userPrompt).toContain("Tổng hai số nguyên lớn");
    expect(userPrompt).toContain("1500000000 2700000000");
    expect(userPrompt).toContain("-647483649");
    expect(userPrompt).toContain("4200000000");
    expect(userPrompt).toContain("1 | int a, b;");
  });

  it("uses Smart Offline mode immediately when no API key is set and prioritizes Gemini when GEMINI_API_KEY exists", async () => {
    const prevG = process.env.GEMINI_API_KEY;
    const prevGo = process.env.GOOGLE_API_KEY;
    const prevC = process.env.AI_COMPATIBLE_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_API_KEY;
    delete process.env.AI_COMPATIBLE_API_KEY;

    try {
      // (b) No key -> instant Smart Offline Tutor (not blocked!) + Google AI Studio setup guide
      const offlineRes = await askAiCodingTutor({
        message: "Code của tôi bị sai ở đâu?",
        history: [],
        context: {
          exerciseTitle: "Tổng hai số nguyên lớn",
          problemConstraints: "-9×10^18 <= a, b <= 9×10^18",
          codeContext: "#include <iostream>\nusing namespace std;\nint main() {\n  int a, b;\n  cin >> a >> b;\n  cout << a + b;\n  return 0;\n}",
          stdin: "1500000000 2700000000",
          stdout: "-647483649",
          expectedOutput: "4200000000",
          executionStatus: "Wrong Answer",
          mode: "debug",
        },
      });

      expect(offlineRes.configured).toBe(false);
      expect(offlineRes.providerMode).toBe("offline");
      expect(offlineRes.reply).toContain("tràn số");
      expect(offlineRes.reply).toContain("Dòng 4");
      expect(offlineRes.setupGuide?.some((s) => s.includes("aistudio.google.com"))).toBe(true);

      // (a) GEMINI_API_KEY set -> calls Gemini on server first
      process.env.GEMINI_API_KEY = "test-server-secret-key";
      const geminiRes = await askAiCodingTutor({
        message: "Gợi ý bước đầu tiên",
        history: [],
        context: { exerciseTitle: "CL-001", mode: "hint" },
        geminiRunner: {
          async generate({ apiKey, systemInstruction }) {
            expect(apiKey).toBe("test-server-secret-key");
            expect(systemInstruction).toContain("Gia sư Lập trình AI");
            return { text: "Bước 1: Kiểm tra giới hạn kiểu dữ liệu 64-bit.", interactionId: "int_001" };
          },
        },
      });
      expect(geminiRes.providerMode).toBe("gemini");
      expect(geminiRes.fallbackUsed).toBe(false);
      expect(geminiRes.reply).toContain("Bước 1");
      expect(geminiRes.reply).not.toContain("test-server-secret-key");
    } finally {
      if (prevG === undefined) delete process.env.GEMINI_API_KEY;
      else process.env.GEMINI_API_KEY = prevG;
      if (prevGo === undefined) delete process.env.GOOGLE_API_KEY;
      else process.env.GOOGLE_API_KEY = prevGo;
      if (prevC === undefined) delete process.env.AI_COMPATIBLE_API_KEY;
      else process.env.AI_COMPATIBLE_API_KEY = prevC;
    }
  });

  it("automatically falls back to Smart Offline mode with clear Vietnamese notice on quota (429), invalid key (401/403), and network errors", async () => {
    const prevG = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = "fake-key-for-fallback-test";

    try {
      // 1) Quota exceeded (429)
      const quotaErr = Object.assign(new Error("429 RESOURCE_EXHAUSTED: Quota exceeded"), { status: 429 });
      expect(classifyAiApiError(quotaErr).code).toBe("quota_exceeded");
      const rQuota = await askAiCodingTutor({
        message: "Tìm lỗi giúp tôi",
        history: [],
        context: { codeContext: "int main() { while (true) {} }", mode: "debug" },
        geminiRunner: { async generate() { throw quotaErr; } },
      });
      expect(rQuota.providerMode).toBe("offline");
      expect(rQuota.fallbackUsed).toBe(true);
      expect(rQuota.fallbackErrorCode).toBe("quota_exceeded");
      expect(rQuota.fallbackReason).toContain("hết hạn mức");
      expect(rQuota.reply).toContain("Vòng lặp vô hạn");

      // 2) Invalid API key (401)
      const authErr = Object.assign(new Error("API_KEY_INVALID"), { status: 401 });
      const rKey = await askAiCodingTutor({
        message: "Tìm lỗi",
        history: [],
        context: { codeContext: "int main() { int a = 1\n return 0; }", mode: "debug" },
        geminiRunner: { async generate() { throw authErr; } },
      });
      expect(rKey.providerMode).toBe("offline");
      expect(rKey.fallbackUsed).toBe(true);
      expect(rKey.fallbackErrorCode).toBe("invalid_key");
      expect(rKey.fallbackReason).toContain("GEMINI_API_KEY không hợp lệ");

      // 3) Network outage / timeout
      const netErr = new Error("fetch failed: ETIMEDOUT");
      const rNet = await askAiCodingTutor({
        message: "Giải thích lỗi",
        history: [],
        context: { codeContext: "int add(int a, int b) { int c = a + b; }", mode: "debug" },
        geminiRunner: { async generate() { throw netErr; } },
      });
      expect(rNet.providerMode).toBe("offline");
      expect(rNet.fallbackUsed).toBe(true);
      expect(rNet.fallbackErrorCode).toBe("network_error");
      expect(rNet.fallbackReason).toContain("Mất kết nối mạng");
      expect(rNet.reply).toContain("return");
    } finally {
      if (prevG === undefined) delete process.env.GEMINI_API_KEY;
      else process.env.GEMINI_API_KEY = prevG;
    }
  });

  it("detects common C++ mistakes offline with exact line numbers and NEVER dumps a complete solution", () => {
    const buggyCode = [
      "#include <iostream>",
      "using namespace std;",
      "int calc(int x) {",
      "    int sum;",
      "    sum += x;",
      "}",
      "int main() {",
      "    int n = 5;",
      "    if (n = 3) cout >> n;",
      "    while (n > 0) {",
      "        cout << n;",
      "    }",
      "}",
    ].join("\n");

    const findings = analyzeCppCodeStatically(buggyCode, {
      codeContext: buggyCode,
      compileOutput: "main.cpp:9:20: error: invalid operands to binary expression ('ostream' and 'int')",
      executionStatus: "Compilation Error",
    });

    const categories = new Set(findings.map((f) => f.category));
    expect(categories.has("io_mistake")).toBe(true);
    expect(categories.has("missing_return")).toBe(true);
    expect(categories.has("uninitialized_var")).toBe(true);
    expect(categories.has("type_or_comparison")).toBe(true);
    expect(categories.has("infinite_loop")).toBe(true);

    const reply = generateOfflineTutorReply({
      message: "Cho tôi sửa lỗi bài này",
      context: {
        codeContext: buggyCode,
        compileOutput: "main.cpp:9:20: error: invalid operands to binary expression",
        executionStatus: "Compilation Error",
        mode: "debug",
      },
    });
    expect(reply).toContain("Dòng 9");
    expect(reply).toContain("không đưa sẵn đáp án hoàn chỉnh");
    expect(reply).not.toContain("return sum;");

    // Output mismatch: extra prompt text vs clean answer
    const promptMismatch = generateOfflineTutorReply({
      message: "Tại sao Wrong Answer?",
      context: {
        codeContext: '#include <iostream>\nusing namespace std;\nint main(){ cout << "Nhap a: 8"; return 0; }',
        stdout: "Nhap a: 8",
        expectedOutput: "8",
        executionStatus: "Wrong Answer",
      },
    });
    expect(promptMismatch).toContain("thừa chữ");
  });

  it("detects WebGPU support accurately for optional WebLLM browser mode", async () => {
    const noGpu = await checkWebGpuSupport({ gpu: undefined });
    expect(noGpu.supported).toBe(false);
    expect(noGpu.reason).toContain("WebGPU");

    const nullAdapter = await checkWebGpuSupport({
      gpu: { requestAdapter: async () => null },
    });
    expect(nullAdapter.supported).toBe(false);
    expect(nullAdapter.reason).toContain("GPU Adapter");

    const withF16 = await checkWebGpuSupport({
      gpu: {
        requestAdapter: async () => ({
          features: { has: (feat) => feat === "shader-f16" },
        }),
      },
    });
    expect(withF16.supported).toBe(true);
    expect(withF16.hasF16).toBe(true);
  });
});

describe("Database Curriculum Seed & Backend Gamification", () => {
  it("seeds all 4 courses, 18 C++ sections, exercises, quizzes, and awards verified XP", () => {
    const db = createTestDb(false);

    const courses = db.prepare("SELECT COUNT(*) as c FROM courses").get() as { c: number };
    const cppSections = db
      .prepare("SELECT COUNT(*) as c FROM course_sections WHERE course_id = 'course-cpp'")
      .get() as { c: number };
    const cppLessons = db
      .prepare("SELECT COUNT(*) as c FROM lessons WHERE course_id = 'course-cpp'")
      .get() as { c: number };
    const exercises = db.prepare("SELECT COUNT(*) as c FROM exercises").get() as { c: number };
    const quizzes = db.prepare("SELECT COUNT(*) as c FROM quizzes").get() as { c: number };

    expect(courses.c).toBe(4);
    expect(cppSections.c).toBe(18);
    expect(cppLessons.c).toBeGreaterThanOrEqual(18);
    expect(exercises.c).toBeGreaterThanOrEqual(12);
    expect(quizzes.c).toBeGreaterThanOrEqual(4);

    // Fresh user starts at 0 XP & Level 1
    const now = new Date().toISOString();
    db.prepare("INSERT INTO users (id, email, password_hash, created_at) VALUES ('u1', 'u1@test.vn', 'h', ?)").run(now);
    db.prepare(`
      INSERT INTO profiles (id, email, full_name, username, role, xp, level, theme, preferred_language, total_study_minutes, bugs_fixed_count, created_at, updated_at)
      VALUES ('u1', 'u1@test.vn', 'Test User', 'test_u1', 'student', 0, 1, 'dark', 'cpp', 0, 0, ?, ?)
    `).run(now, now);

    // Complete 1 lesson -> backend grants XP & unlocks First Code badge
    db.prepare(`
      INSERT INTO lesson_progress (id, user_id, lesson_id, course_id, status, xp_awarded, completed_at, updated_at)
      VALUES ('lp1', 'u1', 'lesson-cpp-01', 'course-cpp', 'completed', 1, ?, ?)
    `).run(now, now);

    const resXp = grantXp(db, "u1", 50);
    expect(resXp.xp).toBe(50);

    const streak = recordLearningActivity(db, "u1", { lessonsCompleted: 1, xpEarned: 50, studyMinutes: 15 });
    expect(streak.currentStreak).toBe(1);

    const unlocked = evaluateAndUnlockAchievements(db, "u1");
    expect(unlocked.some((a) => a.code === "first_code")).toBe(true);

    // Level computation check
    expect(computeLevelInfo(0).level).toBe(1);
    expect(computeLevelInfo(500).level).toBe(4);
  });
});

describe("Clang WebAssembly C++17 Compiler & WASI Runner", () => {
  it("compiles and runs a + b with stdin '3 5' producing '8' and supports STL headers", async () => {
    const code = `
#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
using namespace std;
int main() {
    long long a, b;
    cin >> a >> b;
    vector<long long> v = {b, a};
    sort(v.begin(), v.end());
    cout << (v[0] + v[1]) << "\\n";
    return 0;
}
`;
    const outFiles = (await commands["clang++"](
      ["-std=c++17", "-O1", "-fno-exceptions", "-fno-color-diagnostics", "main.cpp", "-o", "main.wasm"],
      { "main.cpp": code },
      { stderr: () => {} }
    )) as Record<string, Uint8Array>;

    const wasmBytes = outFiles["main.wasm"];
    expect(wasmBytes).toBeInstanceOf(Uint8Array);
    expect(wasmBytes.byteLength).toBeGreaterThan(1000);

    let stdout = "";
    const dec = new TextDecoder();
    const fds = [
      new OpenFile(new WasiFile(new TextEncoder().encode("3 5\n"))),
      new ConsoleStdout((chunk) => {
        stdout += dec.decode(chunk, { stream: true });
      }),
      new ConsoleStdout(() => {}),
    ];
    const wasi = new WASI(["main.wasm"], [], fds);
    const wasmCopy = new Uint8Array(wasmBytes);
    const mod = await WebAssembly.compile(wasmCopy);
    const inst = await WebAssembly.instantiate(mod, { wasi_snapshot_preview1: wasi.wasiImport });
    const exitCode = wasi.start(
      inst as unknown as { exports: { memory: WebAssembly.Memory; _start: () => unknown } }
    );
    stdout += dec.decode();

    expect(exitCode).toBe(0);
    expect(outputsMatch(stdout, "8")).toBe(true);
  }, 30000);

  it("reports compiler diagnostics with line numbers on C++ syntax error", async () => {
    const badCode = `#include <iostream>\nint main() {\n    int x = 10\n    return 0;\n}`;
    let errText = "";
    const dec = new TextDecoder();
    let failed = false;
    try {
      await commands["clang++"](
        ["-std=c++17", "-fno-exceptions", "-fno-color-diagnostics", "main.cpp", "-o", "main.wasm"],
        { "main.cpp": badCode },
        {
          stderr: (b) => {
            if (b) errText += dec.decode(b, { stream: true });
          },
        }
      );
    } catch {
      failed = true;
    }
    errText += dec.decode();
    expect(failed).toBe(true);
    expect(errText).toContain("main.cpp:3:");
    expect(errText).toContain("error:");

    const parsed = parseClangDiagnostics(errText);
    expect(parsed.markers.length).toBeGreaterThan(0);
    expect(parsed.markers[0].line).toBe(3);
    expect(parsed.markers[0].severity).toBe("error");
    expect(parsed.vietnameseSummary).toContain("Dòng 3");
    expect(parsed.vietnameseSummary).toContain("chấm phẩy");
  }, 30000);
});

async function compileCppOnceForTest(code: string): Promise<WebAssembly.Module> {
  const outFiles = (await commands["clang++"](
    ["-std=c++17", "-O1", "-fno-exceptions", "-fno-color-diagnostics", "main.cpp", "-o", "main.wasm"],
    { "main.cpp": code },
    { stderr: () => {} }
  )) as Record<string, Uint8Array>;
  return WebAssembly.compile(new Uint8Array(outFiles["main.wasm"]));
}

async function runCompiledWasmForTest(mod: WebAssembly.Module, stdin: string): Promise<string> {
  let stdout = "";
  const dec = new TextDecoder();
  const fds = [
    new OpenFile(new WasiFile(new TextEncoder().encode(stdin))),
    new ConsoleStdout((chunk) => {
      stdout += dec.decode(chunk, { stream: true });
    }),
    new ConsoleStdout(() => {}),
  ];
  const wasi = new WASI(["main.wasm"], [], fds);
  const inst = await WebAssembly.instantiate(mod, { wasi_snapshot_preview1: wasi.wasiImport });
  wasi.start(inst as unknown as { exports: { memory: WebAssembly.Memory; _start: () => unknown } });
  stdout += dec.decode();
  return stdout;
}

describe("Automated C++ Grading, Output Normalization, Diagnostics & XP Idempotency", () => {
  it("ignores trailing whitespace and trailing blank lines while keeping internal structure strict", () => {
    expect(normalizeOutput("8   \t  \r\n\r\n\n")).toBe("8");
    expect(outputsMatch("8   \n\n\n", "8")).toBe(true);
    expect(outputsMatch("1 2  \r\n3 4 \t\r\n\r\n", "1 2\n3 4")).toBe(true);
    expect(outputsMatch("1\n\n2", "1\n2")).toBe(false);
    expect(outputsMatch("8", "9")).toBe(false);
  });

  it("translates common Clang compiler errors into Vietnamese with exact Monaco line markers", () => {
    expect(translateClangMessageToVietnamese("expected ';' after expression")).toContain("chấm phẩy");
    expect(translateClangMessageToVietnamese("use of undeclared identifier 'x'")).toContain("'x'");
    expect(translateClangMessageToVietnamese("'iostreamx' file not found")).toContain("'iostreamx'");
    expect(
      translateClangMessageToVietnamese("invalid operands to binary expression ('ostream' and 'int')")
    ).toContain("<<");

    const parsed = parseClangDiagnostics(
      "main.cpp:5:12: error: use of undeclared identifier 'ans'\nmain.cpp:6:5: error: expected ';' after return statement"
    );
    expect(parsed.markers).toHaveLength(2);
    expect(parsed.markers[0]).toMatchObject({ line: 5, column: 12, severity: "error" });
    expect(parsed.markers[1]).toMatchObject({ line: 6, column: 5, severity: "error" });
    expect(parsed.vietnameseSummary).toContain("Dòng 5, cột 12");
    expect(parsed.vietnameseSummary).toContain("Dòng 6, cột 5");
  });

  it("grades CL-001 edge cases (0, negatives, LLONG_MAX), masks hidden tests, and awards XP strictly once", async () => {
    const db = createTestDb(false);
    const now = new Date().toISOString();
    db.prepare("INSERT INTO users (id, email, password_hash, created_at) VALUES ('u_grade', 'g@test.vn', 'h', ?)").run(
      now
    );
    db.prepare(`
      INSERT INTO profiles (id, email, full_name, username, role, xp, level, theme, preferred_language, total_study_minutes, bugs_fixed_count, created_at, updated_at)
      VALUES ('u_grade', 'g@test.vn', 'Grader Student', 'grader_u1', 'student', 0, 1, 'dark', 'cpp', 0, 0, ?, ?)
    `).run(now, now);

    const ex = db
      .prepare("SELECT id, xp_reward FROM exercises WHERE id = 'ex-001'")
      .get() as { id: string; xp_reward: number };
    const testCases = db
      .prepare(
        "SELECT id, input_data, expected_output, is_sample FROM test_cases WHERE exercise_id = 'ex-001' ORDER BY sort_order ASC"
      )
      .all() as Array<{ id: string; input_data: string; expected_output: string; is_sample: number }>;

    // Verify all 7 edge-case test cases exist (sample, positive, 0 0, mixed, big negatives, near LLONG_MAX, opposite limits)
    expect(testCases.length).toBe(7);
    expect(testCases.some((t) => t.input_data.trim() === "0 0" && t.expected_output.trim() === "0")).toBe(true);
    expect(testCases.some((t) => t.input_data.includes("-4000000000000000000"))).toBe(true);
    expect(testCases.some((t) => t.expected_output.trim() === "9223372036854775807")).toBe(true);

    // 1) Wrong solution using 32-bit int overflows on long long edge cases -> 0 XP & hidden tests masked
    const intCode = `#include <iostream>\nusing namespace std;\nint main(){ int a, b; cin >> a >> b; cout << a + b; return 0; }`;
    const intMod = await compileCppOnceForTest(intCode);
    const intRuns = [];
    for (const tc of testCases) {
      const out = await runCompiledWasmForTest(intMod, tc.input_data);
      intRuns.push({ testCaseId: tc.id, status: "Accepted" as const, stdout: out, stderr: "", timeMs: 3, memoryKb: 512 });
    }
    const failRes = gradeWasmSubmission({
      db,
      userId: "u_grade",
      exerciseId: ex.id,
      xpReward: ex.xp_reward,
      language: "cpp",
      sourceCode: intCode,
      compileFailed: false,
      compileOutput: "",
      runs: intRuns,
    });

    expect(failRes.submission.status).toBe("Wrong Answer");
    expect(failRes.submission.passed_tests).toBeLessThan(testCases.length);
    expect(failRes.submission.xp_awarded).toBe(0);

    // Public test #1 exposes input, expectedOutput, actualOutput
    const publicCard = failRes.submission.test_results.find((r) => r.isSample);
    expect(publicCard).toBeDefined();
    expect(publicCard?.input).toBeDefined();
    expect(publicCard?.expectedOutput).toBeDefined();
    expect(publicCard?.actualOutput).toBeDefined();

    // Hidden tests #2..#7 NEVER leak input, expectedOutput, actualOutput, or stderr
    const hiddenCards = failRes.submission.test_results.filter((r) => !r.isSample);
    expect(hiddenCards.length).toBe(6);
    for (const h of hiddenCards) {
      expect(h.input).toBeUndefined();
      expect(h.expectedOutput).toBeUndefined();
      expect(h.actualOutput).toBeUndefined();
      expect(h.stderr).toBeUndefined();
    }

    // 2) Correct 64-bit long long solution with trailing spaces & blank lines -> 7/7 Accepted + XP awarded ONCE
    const okCode = `#include <iostream>\nusing namespace std;\nint main(){ long long a, b; cin >> a >> b; cout << (a + b) << "   \\n\\n"; return 0; }`;
    const okMod = await compileCppOnceForTest(okCode);
    const okRuns = [];
    for (const tc of testCases) {
      const out = await runCompiledWasmForTest(okMod, tc.input_data);
      okRuns.push({ testCaseId: tc.id, status: "Accepted" as const, stdout: out, stderr: "", timeMs: 4, memoryKb: 512 });
    }
    const pass1 = gradeWasmSubmission({
      db,
      userId: "u_grade",
      exerciseId: ex.id,
      xpReward: ex.xp_reward,
      language: "cpp",
      sourceCode: okCode,
      compileFailed: false,
      compileOutput: "",
      runs: okRuns,
    });

    expect(pass1.submission.status).toBe("Accepted");
    expect(pass1.submission.passed_tests).toBe(7);
    expect(pass1.submission.total_tests).toBe(7);
    expect(pass1.submission.xp_awarded).toBe(ex.xp_reward);

    const profileAfterPass1 = db
      .prepare("SELECT xp, bugs_fixed_count FROM profiles WHERE id = 'u_grade'")
      .get() as { xp: number; bugs_fixed_count: number };
    expect(profileAfterPass1.xp).toBeGreaterThanOrEqual(ex.xp_reward);
    expect(profileAfterPass1.bugs_fixed_count).toBe(1);

    // 3) Re-submitting Accepted solution a 2nd time -> XP strictly 0 and profile XP unchanged!
    const pass2 = gradeWasmSubmission({
      db,
      userId: "u_grade",
      exerciseId: ex.id,
      xpReward: ex.xp_reward,
      language: "cpp",
      sourceCode: okCode,
      compileFailed: false,
      compileOutput: "",
      runs: okRuns,
    });

    expect(pass2.submission.status).toBe("Accepted");
    expect(pass2.submission.passed_tests).toBe(7);
    expect(pass2.submission.xp_awarded).toBe(0);

    const profileAfterPass2 = db
      .prepare("SELECT xp FROM profiles WHERE id = 'u_grade'")
      .get() as { xp: number };
    expect(profileAfterPass2.xp).toBe(profileAfterPass1.xp);

    // 4) Incomplete runs (skipping hidden tests), TLE, and Compilation Error never grant XP
    const partialRes = gradeWasmSubmission({
      db,
      userId: "u_grade",
      exerciseId: ex.id,
      xpReward: ex.xp_reward,
      language: "cpp",
      sourceCode: okCode,
      compileFailed: false,
      compileOutput: "",
      runs: [okRuns[0]],
    });
    expect(partialRes.submission.status).toBe("Runtime Error");
    expect(partialRes.submission.passed_tests).toBe(1);
    expect(partialRes.submission.xp_awarded).toBe(0);

    const tleRes = gradeWasmSubmission({
      db,
      userId: "u_grade",
      exerciseId: ex.id,
      xpReward: ex.xp_reward,
      language: "cpp",
      sourceCode: "int main(){ while(true){} }",
      compileFailed: false,
      compileOutput: "",
      runs: testCases.map((tc) => ({
        testCaseId: tc.id,
        status: "Time Limit Exceeded" as const,
        stdout: "",
        stderr: "Quá thời gian thực thi (3 giây)",
        timeMs: 3000,
        memoryKb: null,
      })),
    });
    expect(tleRes.submission.status).toBe("Time Limit Exceeded");
    expect(tleRes.submission.passed_tests).toBe(0);
    expect(tleRes.submission.xp_awarded).toBe(0);

    const ceRes = gradeWasmSubmission({
      db,
      userId: "u_grade",
      exerciseId: ex.id,
      xpReward: ex.xp_reward,
      language: "cpp",
      sourceCode: "int main(){ int a }",
      compileFailed: true,
      compileOutput: "main.cpp:1:18: error: expected ';'",
      runs: [],
    });
    expect(ceRes.submission.status).toBe("Compilation Error");
    expect(ceRes.submission.xp_awarded).toBe(0);

    // Verify all 6 submissions are saved in submission history
    const subCount = db
      .prepare("SELECT COUNT(*) as c FROM submissions WHERE user_id = 'u_grade' AND exercise_id = 'ex-001'")
      .get() as { c: number };
    expect(subCount.c).toBe(6);
  }, 60000);
});

describe("C++ <bits/stdc++.h> Integration & PWA Installability", () => {
  it("compiles and executes C++17 code using #include <bits/stdc++.h> with STL containers & algorithms", async () => {
    const code = `#include <bits/stdc++.h>
using namespace std;
int main() {
    int n;
    cin >> n;
    vector<long long> a(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    sort(a.begin(), a.end());
    map<string, int> mp;
    mp["bonus"] = 5;
    priority_queue<long long> pq(a.begin(), a.end());
    unordered_set<long long> us(a.begin(), a.end());
    long long sum = accumulate(a.begin(), a.end(), 0LL);
    bitset<4> bs(3);
    cout << sum + pq.top() + mp["bonus"] + (long long)us.size() + (long long)bs.count() << "\\n";
    return 0;
}
`;
    let errText = "";
    const dec = new TextDecoder();
    const outFiles = (await commands["clang++"](
      ["-std=c++17", "-O1", "-fno-exceptions", "-fno-color-diagnostics", "-I.", "main.cpp", "-o", "main.wasm"],
      {
        "main.cpp": code,
        bits: { "stdc++.h": BITS_STDCPP_HEADER },
      },
      {
        stderr: (b) => {
          if (b) errText += dec.decode(b, { stream: true });
        },
      }
    )) as Record<string, Uint8Array>;
    errText += dec.decode();

    expect(errText.trim()).toBe("");
    const mod = await WebAssembly.compile(new Uint8Array(outFiles["main.wasm"]));
    // Input: n=3, a=[10, 20, 10] -> sum=40, pq.top()=20, bonus=5, unique=2, bs(3).count()=2 => 69
    const stdout = await runCompiledWasmForTest(mod, "3\n10 20 10\n");
    expect(outputsMatch(stdout, "69")).toBe(true);

    // Ensure browser compiler worker also injects bits/stdc++.h with -I.
    const workerSrc = fs.readFileSync(
      path.resolve(process.cwd(), "public/workers/cpp-compiler.worker.js"),
      "utf8"
    );
    expect(workerSrc).toContain('"-I."');
    expect(workerSrc).toContain('"stdc++.h": BITS_STDCPP_HEADER');
  }, 45000);

  it("exposes a valid PWA manifest, PNG icons, and Service Worker", () => {
    const m = manifest();
    expect(m.name).toContain("CODELAB");
    expect(m.short_name).toBe("CODELAB");
    expect(m.display).toBe("standalone");
    expect(m.start_url).toBe("/");
    expect(Array.isArray(m.icons)).toBe(true);
    expect((m.icons?.length ?? 0)).toBeGreaterThanOrEqual(3);

    // Confirm all icons referenced in manifest exist and have valid PNG signatures (89 50 4E 47)
    for (const icon of m.icons ?? []) {
      const iconPath = path.resolve(process.cwd(), "public", icon.src.replace(/^\//, ""));
      expect(fs.existsSync(iconPath)).toBe(true);
      const header = fs.readFileSync(iconPath).subarray(0, 4);
      expect(Array.from(header)).toEqual([0x89, 0x50, 0x4e, 0x47]);
    }

    const appleIcon = path.resolve(process.cwd(), "public/icons/apple-touch-icon.png");
    expect(fs.existsSync(appleIcon)).toBe(true);

    const swPath = path.resolve(process.cwd(), "public/sw.js");
    expect(fs.existsSync(swPath)).toBe(true);
    const swSrc = fs.readFileSync(swPath, "utf8");
    expect(swSrc).toContain("self.addEventListener(\"install\"");
    expect(swSrc).toContain("self.addEventListener(\"fetch\"");
  });

  it("answers diverse Vietnamese CS topics, comparisons, and conversation follow-ups accurately offline", () => {
    // 1) User asks "học về map" (the exact real-world query!)
    const mapReply = generateOfflineTutorReply({
      message: "học về map",
      context: { mode: "explain" },
    });
    expect(mapReply).toContain("std::map");
    expect(mapReply).toContain("O(log N)");
    expect(mapReply).toContain("mp.count");

    // 2) Accent-stripped query works equally well ("de quy la gi")
    const recReply = generateOfflineTutorReply({
      message: "de quy la gi",
      context: { mode: "explain" },
    });
    expect(recReply).toContain("Đệ quy");
    expect(recReply).toContain("Base Case");

    // 3) Side-by-side comparison ("so sánh map và unordered_map")
    const cmpReply = generateOfflineTutorReply({
      message: "so sánh map và unordered_map",
      context: { mode: "explain" },
    });
    expect(cmpReply).toContain("So sánh:");
    expect(cmpReply).toContain("std::map");
    expect(cmpReply).toContain("std::unordered_map");

    // 4) Follow-up question uses conversation history ("lỗi thường gặp là gì?")
    const followUp = generateOfflineTutorReply({
      message: "lỗi thường gặp là gì?",
      history: [
        { role: "user", content: "học về map" },
        { role: "assistant", content: mapReply },
      ],
      context: { mode: "explain" },
    });
    expect(followUp).toContain("mp[x] == 0");

    // 5) Topic question still works even when starter code is sitting in the editor!
    const withStarterCode = generateOfflineTutorReply({
      message: "CSS Flexbox là gì?",
      context: {
        codeContext: "#include <iostream>\nint main(){ return 0; }",
        mode: "explain",
      },
    });
    expect(withStarterCode).toContain("Flexbox");
    expect(withStarterCode).toContain("justify-content");

    // 6) Practice generation targets the specific topic ("tạo bài tập về map")
    const practiceMap = generateOfflineTutorReply({
      message: "tạo bài tập về map",
      context: { mode: "generate_practice" },
    });
    expect(practiceMap).toContain("Bài tập thực hành");
    expect(practiceMap).toContain("map");

    // 7) Unknown topic returns honest helpful list (NOT unrelated Input/Output boilerplate)
    const unknown = generateOfflineTutorReply({
      message: "quantum teleportation xyz123",
      context: { mode: "general" },
    });
    expect(unknown).toContain("quantum teleportation xyz123");
    expect(unknown).toContain("Offline thông minh");
    expect(unknown).not.toContain("Bước 1: Xác định rõ Input");
  });

  it("handles tricky Vietnamese homonyms and classic C++ problems accurately without false triggers", () => {
    // Exact user screenshot query: "biến" here means "convert", NOT "variable"!
    const binaryReply = generateOfflineTutorReply({
      message: "code của bài biến số nguyên thành số nhị phân",
      context: { mode: "explain" },
    });
    expect(binaryReply).toContain("Nhị phân");
    expect(binaryReply).toContain("toBinary");
    expect(binaryReply).not.toContain("Biến, Kiểu dữ liệu");

    const primeReply = generateOfflineTutorReply({
      message: "code bài kiểm tra số nguyên tố",
      context: { mode: "explain" },
    });
    expect(primeReply).toContain("isPrime");

    const quadReply = generateOfflineTutorReply({
      message: "giải phương trình bậc 2 bằng C++",
      context: { mode: "explain" },
    });
    expect(quadReply).toContain("delta");

    const palReply = generateOfflineTutorReply({
      message: "code đảo ngược số và kiểm tra số đối xứng",
      context: { mode: "explain" },
    });
    expect(palReply).toContain("rev * 10");

    const sqReply = generateOfflineTutorReply({
      message: "kiểm tra số chính phương và số hoàn hảo",
      context: { mode: "explain" },
    });
    expect(sqReply).toContain("isPerfectSquare");

    // Homonym disambiguation: "tam giác sao" -> pattern loops, NOT triangle geometry!
    const starTri = generateOfflineTutorReply({
      message: "vẽ hình tam giác sao bằng vòng lặp",
      context: { mode: "explain" },
    });
    expect(starTri).toContain("Tam giác sao");
    expect(starTri).not.toContain("Heron");

    // Homonym disambiguation: "sinh xâu nhị phân" -> backtracking, NOT base conversion!
    const genBin = generateOfflineTutorReply({
      message: "sinh xâu nhị phân độ dài n bằng quay lui",
      context: { mode: "explain" },
    });
    expect(genBin).toContain("genBinary");
    expect(genBin).not.toContain("toBinary");

    // Homonym disambiguation: "cây nhị phân" -> binary tree, NOT binary search or base conversion!
    const bstReply = generateOfflineTutorReply({
      message: "cây nhị phân duyệt inorder",
      context: { mode: "explain" },
    });
    expect(bstReply).toContain("inorder");
    expect(bstReply).not.toContain("toBinary");

    const bigIntReply = generateOfflineTutorReply({
      message: "cộng hai số nguyên cực lớn 1000 chữ số",
      context: { mode: "explain" },
    });
    expect(bigIntReply).toContain("addBigInt");

    const normName = generateOfflineTutorReply({
      message: "chuẩn hóa họ tên trong C++",
      context: { mode: "explain" },
    });
    expect(normName).toContain("normalizeName");
  });
});
