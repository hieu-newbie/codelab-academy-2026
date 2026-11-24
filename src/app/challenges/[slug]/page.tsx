"use client";

import React, { use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Bookmark,
  CheckCircle2,
  Clock,
  Cpu,
  Eye,
  FileCode2,
  GripVertical,
  History,
  Lightbulb,
  Lock,
  XCircle,
  Zap,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth, useToast } from "@/components/providers";
import {
  CodePlayground,
  vietnameseVerdictLabel,
  type AiErrorContext,
  type AiExecutionContext,
  type ExecutionOutputState,
} from "@/components/editor/CodePlayground";
import { AiTutorDrawer } from "@/components/ai/AiTutorDrawer";
import {
  compileCppInBrowser,
  DEFAULT_EXECUTION_TIMEOUT_MS,
  executeWasmInWorker,
} from "@/lib/cpp-wasm-runner";
import { Badge, Button, Card, EmptyState, ErrorState, InlineRichText, LoadingState } from "@/components/ui/primitives";
import { difficultyBadgeClasses, formatRelativeDate } from "@/lib/utils";
import type { ExerciseRecord, SubmissionRecord, TestCaseResult } from "@/types/codelab";

interface ExerciseDetailResponse {
  exercise: ExerciseRecord & { total_test_cases: number };
  submissions: SubmissionRecord[];
}

export default function ChallengeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { user, systemStatus, refreshUser } = useAuth();
  const { toast } = useToast();

  const [data, setData] = useState<ExerciseDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [leftTab, setLeftTab] = useState<"statement" | "hints" | "submissions">("statement");
  const [submitting, setSubmitting] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [errorContext, setErrorContext] = useState<AiErrorContext | null>(null);
  const [executionContext, setExecutionContext] = useState<AiExecutionContext | null>(null);
  const storageKey = `codelab:code:challenge:${slug}`;

  // Explicit disclosure controls (NO spoilers on load!)
  const [revealedHints, setRevealedHints] = useState(0);
  const [solutionUnlocked, setSolutionUnlocked] = useState(false);

  // Judge results state
  const [externalOutput, setExternalOutput] = useState<ExecutionOutputState | null>(null);
  const [latestTestResults, setLatestTestResults] = useState<TestCaseResult[]>([]);
  const [latestJudgeStatus, setLatestJudgeStatus] = useState<string | null>(null);

  // Resizable desktop horizontal split
  const [leftRatio, setLeftRatio] = useState(44);
  const splitRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const loadedSlugRef = useRef<string | null>(null);

  const loadExercise = useCallback(async (silent = false) => {
    const isNewSlug = loadedSlugRef.current !== slug;
    if (!silent || isNewSlug) {
      setLoading(true);
    }
    setError(null);
    try {
      const res = await fetch(`/api/exercises/${slug}`, { cache: "no-store" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || "Không tìm thấy bài tập.");
        return;
      }
      const json = (await res.json()) as ExerciseDetailResponse;
      setData(json);
      if (isNewSlug) {
        loadedSlugRef.current = slug;
        let restoredLocal: string | null = null;
        try {
          restoredLocal = localStorage.getItem(storageKey);
        } catch {
          // ignore
        }
        setCode(restoredLocal ?? json.submissions[0]?.source_code ?? json.exercise.starter_code);
        setLatestTestResults([]);
        setLatestJudgeStatus(null);
        setExternalOutput(null);
        setErrorContext(null);
        setRevealedHints(0);
        setSolutionUnlocked(false);
      }
      setBookmarked(Boolean(json.exercise.bookmarked));
    } catch {
      setError("Lỗi tải bài tập.");
    } finally {
      if (!silent || isNewSlug) {
        setLoading(false);
      }
    }
  }, [slug, storageKey]);

  useEffect(() => {
    const t = setTimeout(() => loadExercise(), 0);
    return () => clearTimeout(t);
  }, [loadExercise]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!draggingRef.current || !splitRef.current) return;
      const rect = splitRef.current.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setLeftRatio(Math.max(30, Math.min(65, pct)));
    };
    const onUp = () => {
      draggingRef.current = false;
      document.body.style.cursor = "";
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  const handleToggleBookmark = async () => {
    if (!user) {
      toast({ title: "Vui lòng đăng nhập để lưu bài tập yêu thích", variant: "info" });
      return;
    }
    const res = await fetch(`/api/exercises/${slug}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle_bookmark" }),
    });
    if (res.ok) {
      const j = await res.json();
      setBookmarked(j.bookmarked);
      toast({ title: j.bookmarked ? "Đã lưu bài tập yêu thích" : "Đã bỏ lưu bài tập", variant: "info" });
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Đăng nhập để nộp bài chấm tự động",
        description: "Hệ thống lưu lịch sử nộp bài và cộng XP theo tài khoản cá nhân.",
        variant: "info",
      });
      return;
    }

    const useJudge0 = Boolean(systemStatus?.judge0_configured);
    setSubmitting(true);
    setExternalOutput({
      status: "Running",
      stdout: "",
      stderr: "",
      compileOutput: "",
      timeMs: null,
      memoryKb: null,
      progressMessage: useJudge0
        ? "Đang gửi bài lên Judge0 Sandbox..."
        : "Đang tải test cases và biên dịch C++ WebAssembly...",
      progressPercent: useJudge0 ? undefined : 10,
    });

    try {
      let j: {
        configured?: boolean;
        error?: string;
        submission?: SubmissionRecord;
        newly_unlocked_achievements?: Array<{ title: string; description: string; xp_bonus: number }>;
      };

      if (useJudge0) {
        const res = await fetch(`/api/exercises/${slug}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "submit", sourceCode: code, language: "cpp" }),
        });
        j = await res.json();
        if (!res.ok) {
          setExternalOutput({
            status: "Runtime Error",
            stdout: "",
            stderr: j.error || "Không thể nộp bài.",
            compileOutput: "",
            timeMs: null,
            memoryKb: null,
          });
          return;
        }
      } else {
        // Default mode: Compile once in Clang WASM Worker, execute each test case in isolated Runner Worker, verify on server!
        const prepRes = await fetch(`/api/exercises/${slug}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "prepare_wasm_grade" }),
        });
        const prepData = await prepRes.json();
        if (!prepRes.ok || !Array.isArray(prepData.test_cases)) {
          setExternalOutput({
            status: "Runtime Error",
            stdout: "",
            stderr: prepData.error || "Không thể chuẩn bị bộ test case.",
            compileOutput: "",
            timeMs: null,
            memoryKb: null,
          });
          return;
        }

        const compiled = await compileCppInBrowser(code, (ev) => {
          setExternalOutput({
            status: "Running",
            stdout: "",
            stderr: "",
            compileOutput: "",
            timeMs: null,
            memoryKb: null,
            progressMessage: ev.message,
            progressPercent: ev.percent,
          });
        });

        let payload: Record<string, unknown>;
        if (!compiled.ok || !compiled.wasmBytes) {
          payload = {
            action: "submit_wasm_results",
            sourceCode: code,
            language: "cpp",
            compileFailed: true,
            compileOutput: compiled.compileOutput,
            runs: [],
          };
        } else {
          const testCases = prepData.test_cases as Array<{
            id: string;
            sort_order: number;
            is_sample: boolean;
            input_data: string;
          }>;
          const timeoutMs = DEFAULT_EXECUTION_TIMEOUT_MS;
          const runs = [];

          for (let i = 0; i < testCases.length; i++) {
            const tc = testCases[i];
            setExternalOutput({
              status: "Running",
              stdout: "",
              stderr: "",
              compileOutput: "",
              timeMs: null,
              memoryKb: null,
              progressMessage: `Đang chấm test case ${i + 1}/${testCases.length} trong Web Worker (timeout 3s)...`,
              progressPercent: Math.round(((i + 1) / testCases.length) * 100),
            });

            const runRes = await executeWasmInWorker(compiled.wasmBytes, tc.input_data, timeoutMs);
            runs.push({
              testCaseId: tc.id,
              status: runRes.status,
              stdout: runRes.stdout,
              stderr: runRes.stderr,
              timeMs: runRes.timeMs,
              memoryKb: runRes.memoryKb,
            });
          }

          payload = {
            action: "submit_wasm_results",
            sourceCode: code,
            language: "cpp",
            compileFailed: false,
            compileOutput: "",
            runs,
          };
        }

        const submitRes = await fetch(`/api/exercises/${slug}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        j = await submitRes.json();
        if (!submitRes.ok) {
          setExternalOutput({
            status: "Runtime Error",
            stdout: "",
            stderr: j.error || "Không thể lưu kết quả chấm bài.",
            compileOutput: "",
            timeMs: null,
            memoryKb: null,
          });
          return;
        }
      }

      const sub = j.submission;
      if (!sub) return;
      setLatestTestResults(sub.test_results || []);
      setLatestJudgeStatus(sub.status);
      setExternalOutput({
        status: sub.status,
        stdout: `Đạt ${sub.passed_tests}/${sub.total_tests} test cases (${vietnameseVerdictLabel(sub.status).label}).`,
        stderr: sub.stderr || "",
        compileOutput: sub.compiler_output || "",
        timeMs: sub.execution_time_ms ?? null,
        memoryKb: sub.memory_used_kb ?? null,
        engineLabel: useJudge0 ? "Judge0" : "Clang WASM",
        testResults: sub.test_results || [],
      });

      if (sub.status === "Accepted") {
        await refreshUser();
        toast({
          title:
            sub.xp_awarded > 0
              ? `Accepted! +${sub.xp_awarded} XP`
              : "Accepted! Vượt qua toàn bộ test cases!",
          description: `${sub.passed_tests}/${sub.total_tests} test case chính xác.`,
          variant: "success",
        });
        if (Array.isArray(j.newly_unlocked_achievements)) {
          for (const ach of j.newly_unlocked_achievements) {
            toast({
              title: `Mở khóa huy hiệu: ${ach.title}!`,
              description: `${ach.description} (+${ach.xp_bonus} XP)`,
              variant: "achievement",
            });
          }
        }
      } else {
        toast({
          title: `Kết quả chấm: ${sub.status}`,
          description: `Đạt ${sub.passed_tests}/${sub.total_tests} test cases. Hãy kiểm tra lỗi hoặc nhờ Gia sư AI gợi ý!`,
          variant: "error",
        });
      }

      await loadExercise(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AppShell fullBleed>
        <LoadingState message="Đang mở không gian luyện giải thuật..." />
      </AppShell>
    );
  }

  if (error || !data) {
    return (
      <AppShell>
        <ErrorState message={error || "Không tìm thấy bài tập."} onRetry={loadExercise} />
      </AppShell>
    );
  }

  const { exercise, submissions } = data;

  return (
    <AppShell fullBleed>
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1424] px-4 py-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <Link
            href="/challenges"
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:border-blue-500/40"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Danh sách
          </Link>
          <span className="font-mono text-xs font-bold text-slate-500">{exercise.code}</span>
          <h1 className="text-sm font-bold text-slate-900 dark:text-white truncate">
            {exercise.title}
          </h1>
          <Badge className={difficultyBadgeClasses(exercise.difficulty)}>
            {exercise.difficulty}
          </Badge>
          {exercise.solved && (
            <Badge className="border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3 w-3" /> Đã giải
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Zap className="h-3 w-3" /> +{exercise.xp_reward} XP
          </Badge>
          <button
            onClick={handleToggleBookmark}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border cursor-pointer ${
              bookmarked
                ? "border-amber-500/40 bg-amber-500/15 text-amber-500"
                : "border-slate-200 dark:border-slate-800 text-slate-400 hover:text-amber-500"
            }`}
            title="Lưu bài tập yêu thích"
          >
            <Bookmark className={`h-4 w-4 ${bookmarked ? "fill-current" : ""}`} />
          </button>
        </div>
      </div>

      {/* 2-Column Resizable IDE */}
      <div
        ref={splitRef}
        style={{ "--split-left": `${leftRatio}%` } as React.CSSProperties}
        className="flex flex-1 flex-col lg:grid lg:grid-cols-[var(--split-left)_10px_1fr] min-h-0 overflow-y-auto lg:overflow-hidden"
      >
        {/* Left Pane */}
        <div className="lg:h-full lg:min-h-0 flex flex-col border-b lg:border-b-0 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b1120] overflow-hidden">
          <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 px-3 py-2 bg-slate-50 dark:bg-slate-900/60">
            {[
              { id: "statement", label: "Đề bài", icon: FileCode2 },
              { id: "hints", label: "Gợi ý & Lời giải", icon: Lightbulb },
              { id: "submissions", label: `Lịch sử nộp (${submissions.length})`, icon: History },
            ].map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setLeftTab(t.id as typeof leftTab)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                    leftTab === t.id
                      ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" /> {t.label}
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {leftTab === "statement" && (
              <>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    Chủ đề: {exercise.category}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {exercise.time_limit_ms}ms
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Cpu className="h-3.5 w-3.5" /> {Math.round(exercise.memory_limit_kb / 1024)}MB
                  </span>
                  <span>{exercise.total_test_cases} test cases</span>
                </div>

                <div className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                  <InlineRichText text={exercise.description} />
                </div>

                <div className="space-y-3 text-xs">
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5">
                    <p className="font-bold text-slate-900 dark:text-white mb-1">Dữ liệu vào (Input)</p>
                    <p className="text-slate-600 dark:text-slate-300"><InlineRichText text={exercise.input_format} /></p>
                  </div>
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5">
                    <p className="font-bold text-slate-900 dark:text-white mb-1">Dữ liệu ra (Output)</p>
                    <p className="text-slate-600 dark:text-slate-300"><InlineRichText text={exercise.output_format} /></p>
                  </div>
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5">
                    <p className="font-bold text-slate-900 dark:text-white mb-1">Giới hạn (Constraints)</p>
                    <p className="font-mono text-blue-600 dark:text-blue-400">{exercise.constraints}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Ví dụ minh họa</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3">
                      <p className="font-sans text-[11px] font-bold text-slate-500 mb-1">Input mẫu</p>
                      <pre className="whitespace-pre-wrap">{exercise.sample_input}</pre>
                    </div>
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3">
                      <p className="font-sans text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                        Output mẫu
                      </p>
                      <pre className="whitespace-pre-wrap">{exercise.sample_output}</pre>
                    </div>
                  </div>
                  {exercise.sample_explanation && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                      Giải thích: {exercise.sample_explanation}
                    </p>
                  )}
                </div>

                {/* Live Test Cases Breakdown after Submit */}
                {latestTestResults.length > 0 && (
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-2.5">
                    <p className="text-xs font-bold uppercase text-slate-500">
                      Chi tiết lần chấm gần nhất ({vietnameseVerdictLabel(latestJudgeStatus || "").label})
                    </p>
                    <div className="space-y-2">
                      {latestTestResults.map((tr) => {
                        const v = vietnameseVerdictLabel(tr.status);
                        const boxCls =
                          v.tone === "emerald"
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                            : v.tone === "amber"
                            ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                            : "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300";
                        return (
                          <div key={tr.testCaseIndex} className={`rounded-xl border p-3 text-xs space-y-2 ${boxCls}`}>
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold">
                                Test #{tr.testCaseIndex} {tr.isSample ? "(Công khai)" : "(Test ẩn)"}
                              </span>
                              <span className="font-mono font-bold">
                                {v.shortLabel}
                                {typeof tr.timeMs === "number" ? ` · ${tr.timeMs}ms` : ""}
                              </span>
                            </div>
                            {tr.isSample && (
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[11px] text-slate-800 dark:text-slate-100">
                                <div className="rounded-lg bg-white/80 dark:bg-slate-950/80 p-2">
                                  <p className="font-sans text-[10px] font-bold text-slate-500">Input</p>
                                  <pre className="whitespace-pre-wrap break-all">{tr.input ?? ""}</pre>
                                </div>
                                <div className="rounded-lg bg-white/80 dark:bg-slate-950/80 p-2">
                                  <p className="font-sans text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Mong đợi</p>
                                  <pre className="whitespace-pre-wrap break-all">{tr.expectedOutput ?? ""}</pre>
                                </div>
                                <div className="rounded-lg bg-white/80 dark:bg-slate-950/80 p-2">
                                  <p className="font-sans text-[10px] font-bold text-blue-600 dark:text-blue-400">Thực tế</p>
                                  <pre className="whitespace-pre-wrap break-all">{tr.actualOutput ?? "(rỗng)"}</pre>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            {leftTab === "hints" && (
              <div className="space-y-5">
                <div className="rounded-xl border border-blue-500/25 bg-blue-500/5 p-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Để phát triển tư duy giải thuật thật sự, CODELAB ẩn gợi ý và đáp án mặc định. Hãy thử tự suy nghĩ trước rồi mới mở từng gợi ý!
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold">Gợi ý từng bước</h3>
                    {revealedHints < exercise.hints.length && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setRevealedHints((n) => n + 1)}
                      >
                        <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                        Mở gợi ý #{revealedHints + 1}
                      </Button>
                    )}
                  </div>
                  {revealedHints === 0 ? (
                    <p className="text-xs text-slate-500">
                      Chưa mở gợi ý nào ({exercise.hints.length} gợi ý sẵn có).
                    </p>
                  ) : (
                    exercise.hints.slice(0, revealedHints).map((h, i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-800 dark:text-amber-200"
                      >
                        <strong>Gợi ý {i + 1}:</strong> {h}
                      </div>
                    ))
                  )}
                </div>

                <div className="border-t border-slate-200 dark:border-slate-800 pt-5 space-y-3">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <Lock className="h-4 w-4 text-slate-400" /> Lời giải tham khảo C++
                  </h3>
                  {!solutionUnlocked ? (
                    <Card className="p-5 text-center space-y-3">
                      <p className="text-xs text-slate-500">
                        Lời giải tham khảo đang được ẩn. Bạn có chắc muốn chủ động mở xem không?
                      </p>
                      <Button size="sm" variant="outline" onClick={() => setSolutionUnlocked(true)}>
                        <Eye className="h-3.5 w-3.5" /> Tôi muốn xem lời giải tham khảo
                      </Button>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
                        <div className="flex items-center justify-between border-b border-slate-800 px-3 py-1.5 text-[11px] text-slate-400">
                          <span>C++17 Reference Solution</span>
                          <button
                            onClick={() => {
                              setCode(exercise.solution_code);
                              toast({ title: "Đã nạp lời giải mẫu vào Editor", variant: "info" });
                            }}
                            className="text-blue-400 hover:underline cursor-pointer"
                          >
                            Nạp vào Editor
                          </button>
                        </div>
                        <pre className="overflow-x-auto p-4 font-mono text-xs text-emerald-300">
                          <code>{exercise.solution_code}</code>
                        </pre>
                      </div>
                      {exercise.solution_explanation && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          <strong>Phân tích độ phức tạp & ý tưởng:</strong> {exercise.solution_explanation}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {leftTab === "submissions" && (
              <div className="space-y-3">
                {!user ? (
                  <EmptyState
                    title="Đăng nhập để xem lịch sử nộp bài"
                    description="Mỗi lần nộp bài của bạn sẽ được lưu trữ chi tiết kèm mã nguồn và kết quả chấm."
                  />
                ) : submissions.length === 0 ? (
                  <EmptyState
                    title="Chưa có lần nộp bài nào"
                    description="Viết lời giải ở khung Editor bên phải và bấm 'Nộp bài chấm điểm'."
                  />
                ) : (
                  submissions.map((sub) => {
                    const v = vietnameseVerdictLabel(sub.status);
                    return (
                    <Card key={sub.id} className="p-3.5 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge
                            className={
                              sub.status === "Accepted"
                                ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                : sub.status === "Time Limit Exceeded" || sub.status === "Not Configured"
                                ? "border-amber-500/30 bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                : "border-rose-500/30 bg-rose-500/15 text-rose-600 dark:text-rose-400"
                            }
                          >
                            {sub.status === "Accepted" ? (
                              <CheckCircle2 className="h-3 w-3" />
                            ) : sub.status === "Time Limit Exceeded" || sub.status === "Not Configured" ? (
                              <AlertTriangle className="h-3 w-3" />
                            ) : (
                              <XCircle className="h-3 w-3" />
                            )}
                            {v.label}
                          </Badge>
                          {sub.xp_awarded > 0 && (
                            <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                              +{sub.xp_awarded} XP
                            </Badge>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500">
                          {formatRelativeDate(sub.created_at)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                        <span>
                          Test: {sub.passed_tests}/{sub.total_tests}
                        </span>
                        <span>
                          {sub.execution_time_ms ?? 0}ms ·{" "}
                          {sub.memory_used_kb ? `${(sub.memory_used_kb / 1024).toFixed(1)}MB` : "—"}
                        </span>
                        <button
                          onClick={() => {
                            setCode(sub.source_code);
                            toast({ title: "Đã tải lại mã nguồn của lần nộp này", variant: "info" });
                          }}
                          className="font-sans font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                        >
                          Xem code
                        </button>
                      </div>
                    </Card>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>

        {/* Resizable Horizontal Divider */}
        <div
          onPointerDown={() => {
            draggingRef.current = true;
            document.body.style.cursor = "col-resize";
          }}
          className="hidden lg:flex w-2.5 shrink-0 cursor-col-resize items-center justify-center border-x border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 hover:bg-blue-500/25"
        >
          <GripVertical className="h-4 w-4 text-slate-400" />
        </div>

        {/* Right Pane: Monaco Editor + WASM/Judge0 Runner */}
        <div className="h-[620px] lg:h-full lg:min-h-0 min-w-0 overflow-hidden">
          <CodePlayground
            code={code}
            onChange={setCode}
            defaultCode={exercise.starter_code}
            language="cpp"
            storageKey={storageKey}
            initialStdin={exercise.sample_input}
            onSubmit={handleSubmit}
            submitting={submitting}
            submitLabel="Nộp bài chấm điểm"
            onOpenAiTutor={() => setAiOpen(true)}
            externalOutput={externalOutput}
            onErrorContextChange={setErrorContext}
            onExecutionContextChange={setExecutionContext}
          />
        </div>
      </div>

      <AiTutorDrawer
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        exerciseId={exercise.id}
        language={exercise.language}
        contextTitle={`${exercise.code}: ${exercise.title} (${exercise.difficulty})`}
        currentCode={code}
        problemContext={{
          title: `${exercise.code}: ${exercise.title}`,
          difficulty: exercise.difficulty,
          statement: `${exercise.description}\nInput: ${exercise.input_format}\nOutput: ${exercise.output_format}`,
          constraints: exercise.constraints,
          sampleInput: exercise.sample_input,
          sampleOutput: exercise.sample_output,
          hints: exercise.hints,
        }}
        executionContext={executionContext}
        errorContext={errorContext}
      />
    </AppShell>
  );
}
