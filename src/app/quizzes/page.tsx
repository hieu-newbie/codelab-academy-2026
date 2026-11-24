"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  HelpCircle,
  Zap,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge, Button, Card, ErrorState, LoadingState } from "@/components/ui/primitives";
import { difficultyBadgeClasses } from "@/lib/utils";
import type { QuizRecord } from "@/types/codelab";

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<QuizRecord[]>([]);
  const [weakTopics, setWeakTopics] = useState<Array<{ topic: string; misses: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadQuizzes = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/quizzes", { cache: "no-store" });
      if (!res.ok) throw new Error("Không thể tải danh sách bài kiểm tra.");
      const data = await res.json();
      setQuizzes(data.quizzes || []);
      setWeakTopics(data.weak_topics || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi tải danh sách quiz.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => loadQuizzes(), 0);
    return () => clearTimeout(t);
  }, []);

  return (
    <AppShell>
      <div className="space-y-6 animate-fade-in">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
            Đánh giá & Củng cố kiến thức
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Hệ thống kiểm tra Quiz tương tác
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Gồm đầy đủ 6 dạng câu hỏi: Trắc nghiệm một/nhiều đáp án, Đúng/Sai, Điền khuyết, Dự đoán output và Tìm lỗi trong code — tự động chấm điểm và phân tích chủ đề còn yếu.
          </p>
        </div>

        {weakTopics.length > 0 && (
          <Card className="p-4 border-amber-500/30 bg-amber-500/5">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-amber-700 dark:text-amber-400 inline-flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" /> Chủ đề bạn hay trả lời sai gần đây:
              </span>
              {weakTopics.map((wt) => (
                <Badge
                  key={wt.topic}
                  className="border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300"
                >
                  {wt.topic} ({wt.misses})
                </Badge>
              ))}
            </div>
          </Card>
        )}

        {loading ? (
          <LoadingState message="Đang tải các bài kiểm tra..." />
        ) : error ? (
          <ErrorState message={error} onRetry={loadQuizzes} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {quizzes.map((qz) => {
              const passed = (qz.best_percentage ?? 0) >= qz.pass_score_percent;
              return (
                <Card key={qz.id} className="p-5 flex flex-col justify-between hover:border-blue-500/40 transition-colors">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <Badge className={difficultyBadgeClasses(qz.difficulty)}>
                          {qz.difficulty}
                        </Badge>
                        <Badge className="border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {qz.topic}
                        </Badge>
                      </div>
                      {passed && (
                        <Badge className="border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" /> Đạt {qz.best_percentage}%
                        </Badge>
                      )}
                    </div>

                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      {qz.title}
                    </h2>
                    <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                      {qz.description}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <HelpCircle className="h-3.5 w-3.5 text-blue-500" /> {qz.question_count} câu hỏi
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-cyan-500" /> {qz.time_limit_minutes} phút
                      </span>
                      <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold font-mono">
                        <Zap className="h-3.5 w-3.5" /> +{qz.xp_reward} XP
                      </span>
                      <span>Đạt từ {qz.pass_score_percent}%</span>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-500">
                      {(qz.attempts_count ?? 0) > 0
                        ? `Đã làm ${qz.attempts_count} lần · Cao nhất ${qz.best_percentage}%`
                        : "Chưa thực hiện lần nào"}
                    </span>
                    <Link href={`/quizzes/${qz.slug}`}>
                      <Button size="sm" variant="primary">
                        <ClipboardCheck className="h-3.5 w-3.5" />
                        {(qz.attempts_count ?? 0) > 0 ? "Làm lại Quiz" : "Bắt đầu làm bài"}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
