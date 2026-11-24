"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bookmark,
  CheckCircle2,
  Circle,
  Search,
  Terminal,
  Zap,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/ui/primitives";
import { difficultyBadgeClasses } from "@/lib/utils";

interface ExerciseItem {
  id: string;
  code: string;
  slug: string;
  title: string;
  category: string;
  difficulty: "Easy" | "Medium" | "Hard";
  xp_reward: number;
  test_case_count: number;
  solved: boolean;
  attempts_count: number;
  bookmarked: boolean;
}

export default function ChallengesPage() {
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [search, setSearch] = useState("");

  const loadExercises = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (category !== "all") params.set("category", category);
      if (difficulty !== "all") params.set("difficulty", difficulty);
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`/api/exercises?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Không thể tải danh sách bài tập.");
      const data = await res.json();
      setExercises(data.exercises || []);
      setCategories(data.categories || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi tải bài tập.");
    } finally {
      setLoading(false);
    }
  }, [category, difficulty, search]);

  useEffect(() => {
    const t = setTimeout(loadExercises, 150);
    return () => clearTimeout(t);
  }, [loadExercises]);

  const solvedCount = exercises.filter((e) => e.solved).length;

  return (
    <AppShell>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
              Coding Challenges · Luyện giải thuật
            </p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Khu vực luyện tập & Chấm bài tự động
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Rèn tư duy giải thuật C++ theo 11 nhóm chủ đề với bộ test case ẩn chấm trực tiếp bằng Clang WebAssembly (ưu tiên Judge0 nếu được cấu hình).
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Card className="px-4 py-2.5 flex items-center gap-2.5">
              <Terminal className="h-4 w-4 text-emerald-500" />
              <div className="text-xs">
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {solvedCount}/{exercises.length}
                </span>{" "}
                <span className="text-slate-500">bài đã giải</span>
              </div>
            </Card>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo mã bài (CL-001), tên bài hoặc chủ đề..."
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-3 py-2 text-xs outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold outline-none focus:border-blue-500"
          >
            <option value="all">Tất cả chủ đề</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 p-1">
            {["all", "Easy", "Medium", "Hard"].map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold cursor-pointer ${
                  difficulty === d
                    ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {d === "all" ? "Mọi mức" : d}
              </button>
            ))}
          </div>
        </Card>

        {loading ? (
          <LoadingState message="Đang tải kho bài tập giải thuật..." />
        ) : error ? (
          <ErrorState message={error} onRetry={loadExercises} />
        ) : exercises.length === 0 ? (
          <EmptyState
            title="Không có bài tập khớp bộ lọc"
            description="Hãy chọn lại chủ đề hoặc độ khó để xem đầy đủ danh sách bài tập."
          />
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3 w-12">TT</th>
                    <th className="px-4 py-3 w-24">Mã bài</th>
                    <th className="px-4 py-3">Tên bài tập</th>
                    <th className="px-4 py-3">Chủ đề</th>
                    <th className="px-4 py-3">Độ khó</th>
                    <th className="px-4 py-3">Test</th>
                    <th className="px-4 py-3">Thưởng</th>
                    <th className="px-4 py-3 text-right">Thực hành</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {exercises.map((ex) => (
                    <tr
                      key={ex.id}
                      className="hover:bg-blue-500/5 transition-colors group"
                    >
                      <td className="px-4 py-3.5">
                        {ex.solved ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <Circle className="h-4 w-4 text-slate-300 dark:text-slate-700" />
                        )}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs font-bold text-slate-500">
                        {ex.code}
                      </td>
                      <td className="px-4 py-3.5">
                        <Link
                          href={`/challenges/${ex.slug}`}
                          className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center gap-2"
                        >
                          <span>{ex.title}</span>
                          {ex.bookmarked && (
                            <Bookmark className="h-3.5 w-3.5 fill-amber-500 text-amber-500 shrink-0" />
                          )}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-400">
                        {ex.category}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge className={difficultyBadgeClasses(ex.difficulty)}>
                          {ex.difficulty}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-slate-500 whitespace-nowrap">
                        {ex.test_case_count} cases
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-0.5 font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                          <Zap className="h-3 w-3" />+{ex.xp_reward}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <Link
                          href={`/challenges/${ex.slug}`}
                          className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg bg-blue-600/10 hover:bg-blue-600 text-blue-600 dark:text-blue-400 hover:text-white px-3 py-1.5 text-xs font-semibold transition-colors"
                        >
                          Giải ngay <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
