"use client";

import React, { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  History,
  RotateCcw,
  Send,
  XCircle,
  Zap,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth, useToast } from "@/components/providers";
import { Badge, Button, Card, ErrorState, InlineRichText, LoadingState } from "@/components/ui/primitives";
import { formatRelativeDate } from "@/lib/utils";
import type { QuizAttemptRecord, QuizQuestionRecord, QuizRecord } from "@/types/codelab";

const QUESTION_TYPE_LABEL: Record<string, string> = {
  single_choice: "Trắc nghiệm một đáp án",
  multiple_choice: "Trắc nghiệm nhiều đáp án",
  true_false: "Đúng / Sai",
  fill_blank: "Điền khuyết",
  predict_output: "Dự đoán kết quả code",
  find_bug: "Tìm lỗi trong code",
};

interface GradedResult {
  score: number;
  max_score: number;
  percentage: number;
  passed: boolean;
  weak_topics: string[];
  xp_awarded: number;
  results: Array<{
    question_id: string;
    is_correct: boolean;
    earned_points: number;
    max_points: number;
    user_answer: string | string[] | null;
    correct_answer: string | string[];
    explanation: string;
    topic_tag: string;
  }>;
}

export default function QuizDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();

  const [quiz, setQuiz] = useState<QuizRecord | null>(null);
  const [questions, setQuestions] = useState<QuizQuestionRecord[]>([]);
  const [attempts, setAttempts] = useState<QuizAttemptRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [elapsedSec, setElapsedSec] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [graded, setGraded] = useState<GradedResult | null>(null);

  const loadQuiz = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/quizzes/${slug}`, { cache: "no-store" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || "Không tìm thấy bài kiểm tra.");
        return;
      }
      const data = await res.json();
      setQuiz(data.quiz);
      setQuestions(data.questions || []);
      setAttempts(data.attempts || []);
    } catch {
      setError("Lỗi tải bài kiểm tra.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    const t = setTimeout(() => loadQuiz(), 0);
    return () => clearTimeout(t);
  }, [loadQuiz]);

  useEffect(() => {
    if (loading || graded || !quiz) return;
    const t = setInterval(() => setElapsedSec((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [loading, graded, quiz]);

  const toggleMultiOption = (qId: string, option: string) => {
    setAnswers((prev) => {
      const current = Array.isArray(prev[qId]) ? (prev[qId] as string[]) : [];
      const exists = current.includes(option);
      const next = exists ? current.filter((x) => x !== option) : [...current, option];
      return { ...prev, [qId]: next };
    });
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Vui lòng đăng nhập để nộp bài kiểm tra",
        description: "Hệ thống sẽ chấm điểm tự động, lưu lịch sử và phân tích chủ đề cần ôn tập.",
        variant: "info",
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/quizzes/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, durationSeconds: elapsedSec }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error || "Không thể chấm bài kiểm tra", variant: "error" });
        return;
      }
      setGraded(data);
      await refreshUser();
      await loadQuiz();
      toast({
        title: data.passed
          ? `Xuất sắc! Đạt ${data.percentage}%${data.xp_awarded > 0 ? ` (+${data.xp_awarded} XP)` : ""}`
          : `Kết quả: ${data.percentage}% (Chưa đạt mốc ${quiz?.pass_score_percent}%)`,
        description: "Xem lời giải chi tiết cho từng câu hỏi ngay bên dưới.",
        variant: data.passed ? "success" : "info",
      });
      if (Array.isArray(data.newly_unlocked_achievements)) {
        for (const ach of data.newly_unlocked_achievements) {
          toast({
            title: `Mở khóa huy hiệu: ${ach.title}!`,
            description: `${ach.description} (+${ach.xp_bonus} XP)`,
            variant: "achievement",
          });
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setAnswers({});
    setGraded(null);
    setElapsedSec(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return (
      <AppShell>
        <LoadingState message="Đang chuẩn bị đề kiểm tra..." />
      </AppShell>
    );
  }

  if (error || !quiz) {
    return (
      <AppShell>
        <ErrorState message={error || "Không tìm thấy bài kiểm tra."} onRetry={loadQuiz} />
      </AppShell>
    );
  }

  const mm = String(Math.floor(elapsedSec / 60)).padStart(2, "0");
  const ss = String(elapsedSec % 60).padStart(2, "0");

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/quizzes"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-500"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Quay lại danh sách Quiz
          </Link>
          <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 font-mono text-xs font-bold">
            <Clock className="h-3.5 w-3.5 text-blue-500" /> {mm}:{ss} / {quiz.time_limit_minutes}:00
          </div>
        </div>

        {/* Quiz Header */}
        <Card className="p-6">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge className="border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400">
              {quiz.topic}
            </Badge>
            <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Zap className="h-3 w-3" /> +{quiz.xp_reward} XP khi đạt &ge; {quiz.pass_score_percent}%
            </Badge>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            {quiz.title}
          </h1>
          <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">{quiz.description}</p>
        </Card>

        {/* Graded Summary Card */}
        {graded && (
          <Card
            className={`p-6 border-2 ${
              graded.passed
                ? "border-emerald-500/40 bg-emerald-500/5"
                : "border-amber-500/40 bg-amber-500/5"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Kết quả chấm tự động
                </p>
                <h2 className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
                  {graded.score} / {graded.max_score} điểm ({graded.percentage}%)
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {graded.passed
                    ? `Chúc mừng! Bạn đã vượt qua bài kiểm tra${graded.xp_awarded > 0 ? ` và nhận +${graded.xp_awarded} XP` : ""}.`
                    : `Bạn cần tối thiểu ${quiz.pass_score_percent}% để đạt. Hãy xem giải thích bên dưới và làm lại!`}
                </p>
              </div>
              <Button variant="primary" onClick={handleRetry}>
                <RotateCcw className="h-4 w-4" /> Làm lại bài kiểm tra
              </Button>
            </div>

            {graded.weak_topics.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2 text-xs">
                <span className="font-bold text-rose-500 inline-flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" /> Chủ đề cần ôn thêm:
                </span>
                {graded.weak_topics.map((wt) => (
                  <Badge key={wt} className="border-rose-500/30 bg-rose-500/10 text-rose-500">
                    {wt}
                  </Badge>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Questions List */}
        <div className="space-y-4">
          {questions.map((q, idx) => {
            const res = graded?.results.find((r) => r.question_id === q.id);
            const currentAns = answers[q.id];

            return (
              <Card
                key={q.id}
                className={`p-5 space-y-3.5 ${
                  res
                    ? res.is_correct
                      ? "border-emerald-500/40"
                      : "border-rose-500/40"
                    : ""
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white">
                      {idx + 1}
                    </span>
                    <Badge className="border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {QUESTION_TYPE_LABEL[q.question_type] || q.question_type}
                    </Badge>
                    <span className="text-xs text-slate-500">Chủ đề: {q.topic_tag}</span>
                  </div>
                  <span className="font-mono text-xs font-semibold text-slate-500">
                    {q.points} điểm
                  </span>
                </div>

                <p className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white leading-relaxed">
                  <InlineRichText text={q.prompt} />
                </p>

                {q.code_snippet && (
                  <pre className="overflow-x-auto rounded-xl bg-slate-950 p-4 font-mono text-xs text-slate-100 leading-relaxed">
                    <code>{q.code_snippet}</code>
                  </pre>
                )}

                {/* Answer Controls by Question Type */}
                {q.question_type === "fill_blank" ? (
                  <div>
                    <input
                      type="text"
                      disabled={Boolean(graded)}
                      value={typeof currentAns === "string" ? currentAns : ""}
                      onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                      placeholder="Nhập đáp án chính xác vào đây..."
                      className="w-full sm:w-80 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 font-mono text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                ) : q.question_type === "multiple_choice" ? (
                  <div className="space-y-2">
                    <p className="text-[11px] text-slate-500 italic">Có thể chọn nhiều đáp án đúng:</p>
                    {q.options.map((opt) => {
                      const selected = Array.isArray(currentAns) && currentAns.includes(opt);
                      return (
                        <button
                          key={opt}
                          type="button"
                          disabled={Boolean(graded)}
                          onClick={() => toggleMultiOption(q.id, opt)}
                          className={`flex w-full items-center gap-3 rounded-xl border px-4 py-2.5 text-left text-sm transition-colors cursor-pointer disabled:cursor-default ${
                            selected
                              ? "border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-300 font-semibold"
                              : "border-slate-200 dark:border-slate-800 hover:border-blue-500/40"
                          }`}
                        >
                          <span
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                              selected ? "border-blue-500 bg-blue-600 text-white" : "border-slate-400"
                            }`}
                          >
                            {selected ? "✓" : ""}
                          </span>
                          <span>{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {q.options.map((opt) => {
                      const selected = currentAns === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          disabled={Boolean(graded)}
                          onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                          className={`flex w-full items-center gap-3 rounded-xl border px-4 py-2.5 text-left text-sm transition-colors cursor-pointer disabled:cursor-default ${
                            selected
                              ? "border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-300 font-semibold"
                              : "border-slate-200 dark:border-slate-800 hover:border-blue-500/40"
                          }`}
                        >
                          <span
                            className={`h-4 w-4 shrink-0 rounded-full border-2 ${
                              selected ? "border-blue-600 bg-blue-600" : "border-slate-400"
                            }`}
                          />
                          <span>{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Per-question Graded Explanation */}
                {res && (
                  <div
                    className={`rounded-xl border p-3.5 text-xs leading-relaxed space-y-1 ${
                      res.is_correct
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
                        : "border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-200"
                    }`}
                  >
                    <p className="font-bold flex items-center gap-1.5">
                      {res.is_correct ? (
                        <><CheckCircle2 className="h-4 w-4" /> Chính xác (+{res.earned_points} điểm)</>
                      ) : (
                        <><XCircle className="h-4 w-4" /> Chưa chính xác — Đáp án đúng:{" "}
                          <code className="font-mono underline">
                            {Array.isArray(res.correct_answer)
                              ? res.correct_answer.join(", ")
                              : res.correct_answer}
                          </code>
                        </>
                      )}
                    </p>
                    <p><InlineRichText text={res.explanation} /></p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {!graded && (
          <div className="flex justify-end">
            <Button size="lg" variant="primary" loading={submitting} onClick={handleSubmit}>
              <Send className="h-4 w-4" /> Nộp bài & Chấm điểm tự động
            </Button>
          </div>
        )}

        {/* Attempt History */}
        {attempts.length > 0 && (
          <Card className="p-5">
            <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
              <History className="h-4 w-4 text-blue-500" /> Lịch sử làm bài của bạn
            </h3>
            <div className="space-y-2">
              {attempts.map((a) => (
                <div
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <Badge
                      className={
                        a.passed
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "border-rose-500/30 bg-rose-500/10 text-rose-500"
                      }
                    >
                      {a.passed ? "Đạt" : "Chưa đạt"}
                    </Badge>
                    <span className="font-mono font-bold">
                      {a.score}/{a.max_score} ({a.percentage}%)
                    </span>
                  </div>
                  <span className="text-slate-500">{formatRelativeDate(a.created_at)}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
