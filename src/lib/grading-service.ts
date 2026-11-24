import type { DatabaseSync } from "node:sqlite";
import { generateId } from "@/lib/crypto";
import { outputsMatch } from "@/lib/judge0";
import {
  evaluateAndUnlockAchievements,
  grantXp,
  recordLearningActivity,
  type UnlockedAchievement,
} from "@/lib/gamification";
import type { SubmissionStatus, TestCaseResult } from "@/types/codelab";

export interface WasmTestCaseRunInput {
  testCaseId: string;
  status: SubmissionStatus;
  stdout: string;
  stderr: string;
  timeMs?: number | null;
  memoryKb?: number | null;
}

export interface PersistedSubmissionResult {
  submission: {
    id: string;
    status: SubmissionStatus;
    passed_tests: number;
    total_tests: number;
    execution_time_ms: number;
    memory_used_kb: number;
    compiler_output: string | null;
    stderr: string | null;
    test_results: TestCaseResult[];
    xp_awarded: number;
    created_at: string;
  };
  newly_unlocked_achievements: UnlockedAchievement[];
}

export function persistSubmissionAtomic(params: {
  db: DatabaseSync;
  userId: string;
  exerciseId: string;
  xpReward: number;
  language: string;
  sourceCode: string;
  overallStatus: SubmissionStatus;
  passedCount: number;
  totalTests: number;
  maxTimeMs: number;
  maxMemKb: number;
  compilerOutput: string;
  firstStderr: string;
  firstStdout: string;
  testResults: TestCaseResult[];
}): PersistedSubmissionResult {
  const { db, userId, exerciseId, xpReward } = params;
  const now = new Date().toISOString();
  const subId = generateId("sub");

  let xpAwarded = 0;
  let newlyUnlocked: UnlockedAchievement[] = [];

  db.exec("BEGIN IMMEDIATE");
  try {
    const prevAccepted = db
      .prepare(
        "SELECT id FROM submissions WHERE user_id = ? AND exercise_id = ? AND status = 'Accepted' LIMIT 1"
      )
      .get(userId, exerciseId);
    const prevFailed = db
      .prepare(
        "SELECT id FROM submissions WHERE user_id = ? AND exercise_id = ? AND status != 'Accepted' LIMIT 1"
      )
      .get(userId, exerciseId);

    // Server-authoritative XP guard: ONLY award XP once when ALL test cases pass & never previously Accepted
    const eligibleForXp =
      params.overallStatus === "Accepted" &&
      params.totalTests > 0 &&
      params.passedCount === params.totalTests &&
      !prevAccepted;

    if (eligibleForXp) {
      xpAwarded = xpReward;
      if (prevFailed) {
        db.prepare(
          "UPDATE profiles SET bugs_fixed_count = bugs_fixed_count + 1, updated_at = ? WHERE id = ?"
        ).run(now, userId);
      }
    }

    db.prepare(`
      INSERT INTO submissions
        (id, user_id, exercise_id, language, source_code, status, passed_tests, total_tests, execution_time_ms, memory_used_kb, compiler_output, stderr, stdout, test_results_json, xp_awarded, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      subId,
      userId,
      exerciseId,
      params.language,
      params.sourceCode,
      params.overallStatus,
      params.passedCount,
      params.totalTests,
      params.maxTimeMs,
      params.maxMemKb,
      params.compilerOutput || null,
      params.firstStderr || null,
      params.firstStdout || null,
      JSON.stringify(params.testResults),
      xpAwarded,
      now
    );

    if (xpAwarded > 0) {
      grantXp(db, userId, xpAwarded);
      recordLearningActivity(db, userId, {
        exercisesSolved: 1,
        xpEarned: xpAwarded,
        studyMinutes: 10,
      });
      newlyUnlocked = evaluateAndUnlockAchievements(db, userId);
    } else {
      recordLearningActivity(db, userId, { studyMinutes: 3 });
    }

    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }

  return {
    submission: {
      id: subId,
      status: params.overallStatus,
      passed_tests: params.passedCount,
      total_tests: params.totalTests,
      execution_time_ms: params.maxTimeMs,
      memory_used_kb: params.maxMemKb,
      compiler_output: params.compilerOutput || null,
      stderr: params.firstStderr || null,
      test_results: params.testResults,
      xp_awarded: xpAwarded,
      created_at: now,
    },
    newly_unlocked_achievements: newlyUnlocked,
  };
}

/**
 * Evaluates client-executed WASM outputs strictly against server-stored expected_outputs,
 * hiding hidden test inputs/outputs and awarding XP atomically at most once per exercise.
 */
export function gradeWasmSubmission(params: {
  db: DatabaseSync;
  userId: string;
  exerciseId: string;
  xpReward: number;
  language: string;
  sourceCode: string;
  compileFailed: boolean;
  compileOutput: string;
  runs: WasmTestCaseRunInput[];
}): PersistedSubmissionResult {
  const testCases = params.db
    .prepare(
      "SELECT id, input_data, expected_output, is_sample, sort_order FROM test_cases WHERE exercise_id = ? ORDER BY sort_order ASC"
    )
    .all(params.exerciseId) as Array<{
    id: string;
    input_data: string;
    expected_output: string;
    is_sample: number;
    sort_order: number;
  }>;

  const testResults: TestCaseResult[] = [];
  let passedCount = 0;
  let overallStatus: SubmissionStatus = "Accepted";
  let maxTimeMs = 0;
  let maxMemKb = 0;
  let firstStderr = "";
  let firstStdout = "";

  if (params.compileFailed) {
    overallStatus = "Compilation Error";
    testResults.push({
      testCaseIndex: 1,
      isSample: Boolean(testCases[0]?.is_sample),
      status: "Compilation Error",
    });
  } else {
    const runMap = new Map(params.runs.map((r) => [r.testCaseId, r]));

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      const run = runMap.get(tc.id);

      if (!run) {
        overallStatus = overallStatus === "Accepted" ? "Runtime Error" : overallStatus;
        testResults.push({
          testCaseIndex: i + 1,
          isSample: Boolean(tc.is_sample),
          status: "Runtime Error",
          stderr: "Thiếu kết quả thực thi cho test case này.",
        });
        continue;
      }

      if (typeof run.timeMs === "number") maxTimeMs = Math.max(maxTimeMs, run.timeMs);
      if (typeof run.memoryKb === "number") maxMemKb = Math.max(maxMemKb, run.memoryKb);
      if (run.stderr && !firstStderr) firstStderr = run.stderr;
      if (i === 0) firstStdout = run.stdout;

      let tcStatus: SubmissionStatus = run.status;
      if (tcStatus === "Accepted") {
        if (outputsMatch(run.stdout, tc.expected_output)) {
          passedCount++;
        } else {
          tcStatus = "Wrong Answer";
        }
      }

      // Public sample test exposes input, expectedOutput & actualOutput; hidden test exposes ONLY status + metrics
      testResults.push({
        testCaseIndex: i + 1,
        isSample: Boolean(tc.is_sample),
        status: tcStatus,
        ...(tc.is_sample
          ? {
              input: tc.input_data,
              expectedOutput: tc.expected_output,
              actualOutput: run.stdout,
              stderr: run.stderr || undefined,
            }
          : {}),
        timeMs: run.timeMs ?? undefined,
        memoryKb: run.memoryKb ?? undefined,
      });

      if (tcStatus !== "Accepted" && overallStatus === "Accepted") {
        overallStatus = tcStatus;
      }
    }
  }

  return persistSubmissionAtomic({
    db: params.db,
    userId: params.userId,
    exerciseId: params.exerciseId,
    xpReward: params.xpReward,
    language: params.language,
    sourceCode: params.sourceCode,
    overallStatus,
    passedCount,
    totalTests: testCases.length,
    maxTimeMs,
    maxMemKb,
    compilerOutput: params.compileOutput,
    firstStderr,
    firstStdout,
    testResults,
  });
}
