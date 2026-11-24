"use client";

import React, { useEffect, useState } from "react";
import { Award, BookOpen, Crown, Flame, Medal, Terminal, Trophy, Zap } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge, Card, ErrorState, LoadingState } from "@/components/ui/primitives";

interface LeaderboardEntry {
  rank: number;
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  xp: number;
  level: number;
  current_streak: number;
  completed_lessons: number;
  solved_exercises: number;
  badges_count: number;
  is_current_user: boolean;
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/leaderboard", { cache: "no-store" });
      if (!res.ok) throw new Error("Không thể tải bảng xếp hạng.");
      const data = await res.json();
      setEntries(data.leaderboard || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => loadData(), 0);
    return () => clearTimeout(t);
  }, []);

  const top3 = entries.slice(0, 3);

  return (
    <AppShell>
      <div className="space-y-6 animate-fade-in">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-amber-500">
            Cộng đồng học tập CODELAB
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Trophy className="h-7 w-7 text-amber-500" /> Bảng xếp hạng học viên
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Điểm XP được hệ thống backend xác thực minh bạch từ bài học hoàn thành, bài tập Accepted, bài Quiz đạt chuẩn và huy hiệu thành tích.
          </p>
        </div>

        {loading ? (
          <LoadingState message="Đang cập nhật bảng xếp hạng..." />
        ) : error ? (
          <ErrorState message={error} onRetry={loadData} />
        ) : (
          <>
            {/* Top 3 Podium */}
            {top3.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {top3.map((entry, idx) => (
                  <Card
                    key={entry.id}
                    className={`p-5 relative overflow-hidden ${
                      idx === 0
                        ? "border-amber-500/50 bg-gradient-to-b from-amber-500/12 to-transparent"
                        : idx === 1
                        ? "border-slate-400/40 bg-gradient-to-b from-slate-400/10 to-transparent"
                        : "border-orange-500/35 bg-gradient-to-b from-orange-500/10 to-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <Badge
                        className={
                          idx === 0
                            ? "border-amber-500/40 bg-amber-500/20 text-amber-600 dark:text-amber-300"
                            : "border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        }
                      >
                        {idx === 0 ? <Crown className="h-3.5 w-3.5" /> : <Medal className="h-3.5 w-3.5" />}
                        Hạng #{entry.rank}
                      </Badge>
                      <span className="font-mono text-sm font-extrabold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <Zap className="h-4 w-4 fill-current" /> {entry.xp.toLocaleString("vi-VN")} XP
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-lg font-extrabold text-white">
                        {entry.full_name.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 dark:text-white truncate">
                          {entry.full_name}
                        </h3>
                        <p className="text-xs text-slate-500">
                          @{entry.username} · Level {entry.level}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <BookOpen className="h-3.5 w-3.5 text-blue-500" /> {entry.completed_lessons} bài
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Terminal className="h-3.5 w-3.5 text-emerald-500" /> {entry.solved_exercises} giải thuật
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Flame className="h-3.5 w-3.5 text-orange-500" /> {entry.current_streak}d
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Full Ranked Table */}
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-3 w-16">Hạng</th>
                      <th className="px-4 py-3">Học viên</th>
                      <th className="px-4 py-3">Cấp độ</th>
                      <th className="px-4 py-3">Bài học</th>
                      <th className="px-4 py-3">Bài tập</th>
                      <th className="px-4 py-3">Huy hiệu</th>
                      <th className="px-4 py-3">Streak</th>
                      <th className="px-4 py-3 text-right">Tổng XP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {entries.map((entry) => (
                      <tr
                        key={entry.id}
                        className={
                          entry.is_current_user
                            ? "bg-blue-500/10 font-semibold"
                            : "hover:bg-slate-50 dark:hover:bg-slate-900/40"
                        }
                      >
                        <td className="px-4 py-3.5 font-mono font-bold text-slate-500">
                          #{entry.rank}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                              {entry.full_name.slice(0, 1).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                {entry.full_name}
                                {entry.is_current_user && (
                                  <Badge className="border-blue-500/30 bg-blue-500/15 text-blue-600 dark:text-blue-400">
                                    Bạn
                                  </Badge>
                                )}
                              </p>
                              <p className="text-[11px] text-slate-500">@{entry.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-xs">Lv.{entry.level}</td>
                        <td className="px-4 py-3.5 font-mono text-xs">{entry.completed_lessons}</td>
                        <td className="px-4 py-3.5 font-mono text-xs">{entry.solved_exercises}</td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1 text-xs font-mono">
                            <Award className="h-3.5 w-3.5 text-amber-500" /> {entry.badges_count}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1 text-xs font-mono text-orange-500">
                            <Flame className="h-3.5 w-3.5" /> {entry.current_streak}d
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-extrabold text-amber-600 dark:text-amber-400">
                          {entry.xp.toLocaleString("vi-VN")} XP
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}
