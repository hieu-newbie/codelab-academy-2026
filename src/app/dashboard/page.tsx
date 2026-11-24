"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Award,
  BookOpen,
  Bot,
  CheckCircle2,
  Clock,
  Flame,
  Play,
  Sparkles,
  Target,
  Terminal,
  Trophy,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/components/providers";
import { AiModeBadgePill } from "@/components/ai/AiModeSettingsPanel";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  ProgressBar,
} from "@/components/ui/primitives";
import { computeLevelInfo } from "@/lib/levels";
import { formatMinutes, languageBadgeClasses, languageLabel } from "@/lib/utils";
import type { DashboardData } from "@/types/codelab";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartRange, setChartRange] = useState<"daily" | "weekly" | "monthly">("daily");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard", { cache: "no-store" });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || "Không thể tải bảng điều khiển.");
        return;
      }
      const json = (await res.json()) as DashboardData;
      setData(json);
    } catch {
      setError("Lỗi kết nối máy chủ khi tải Dashboard.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    const t = setTimeout(() => loadDashboard(), 0);
    return () => clearTimeout(t);
  }, [authLoading, user, router, loadDashboard]);

  if (authLoading || loading) {
    return (
      <AppShell>
        <LoadingState message="Đang đồng bộ số liệu học tập thực tế của bạn..." />
      </AppShell>
    );
  }

  if (error || !data) {
    return (
      <AppShell>
        <ErrorState message={error || "Không có dữ liệu Dashboard."} onRetry={loadDashboard} />
      </AppShell>
    );
  }

  const levelInfo = computeLevelInfo(data.profile.xp);
  const chartData =
    chartRange === "daily"
      ? data.activity_daily
      : chartRange === "weekly"
      ? data.activity_weekly
      : data.activity_monthly;
  const unlockedCount = data.achievements.filter((a) => a.unlocked).length;

  return (
    <AppShell>
      <div className="space-y-6 animate-fade-in">
        {/* Top Welcome & Continue Learning Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-blue-500/25 bg-gradient-to-br from-blue-600/12 via-indigo-600/8 to-transparent dark:from-blue-600/20 dark:via-indigo-900/20 dark:to-[#111827] p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border-amber-500/30 bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  <Flame className="h-3.5 w-3.5 fill-current" />
                  Chuỗi {data.streak.current_streak} ngày liên tiếp
                </Badge>
                <Badge className="border-blue-500/30 bg-blue-500/15 text-blue-600 dark:text-blue-400">
                  <Zap className="h-3.5 w-3.5" />
                  Cấp {levelInfo.level}: {levelInfo.title}
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                Xin chào, {data.profile.full_name}!
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
                {data.continue_lesson
                  ? `Bài học tiếp theo dành cho bạn: "${data.continue_lesson.lesson_title}" (${data.continue_lesson.course_title}).`
                  : "Hãy chọn một khóa học để bắt đầu hành trình chinh phục lập trình!"}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {data.continue_lesson ? (
                <Link
                  href={`/courses/${data.continue_lesson.course_slug}/lessons/${data.continue_lesson.lesson_slug}`}
                >
                  <Button size="lg" variant="primary">
                    <Play className="h-4 w-4 fill-current" /> Tiếp tục học
                  </Button>
                </Link>
              ) : (
                <Link href="/courses">
                  <Button size="lg" variant="primary">
                    <BookOpen className="h-4 w-4" /> Chọn khóa học đầu tiên
                  </Button>
                </Link>
              )}
              <Link href="/playground">
                <Button size="lg" variant="outline">
                  <Terminal className="h-4 w-4 text-emerald-500" /> Tự code (Sandbox)
                </Button>
              </Link>
              <Link href="/ai-tutor">
                <Button size="lg" variant="secondary">
                  <Bot className="h-4 w-4 text-blue-500" /> Hỏi Gia sư AI <AiModeBadgePill />
                </Button>
              </Link>
            </div>
          </div>

          {/* Level XP Progress */}
          <div className="mt-5 pt-4 border-t border-slate-200/70 dark:border-slate-800/80">
            <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
              <span className="text-slate-600 dark:text-slate-300">
                Tiến độ lên Cấp {levelInfo.level + 1}
              </span>
              <span className="font-mono text-blue-600 dark:text-blue-400">
                {data.profile.xp.toLocaleString("vi-VN")} / {levelInfo.nextLevelXp.toLocaleString("vi-VN")} XP ({levelInfo.progressPercent}%)
              </span>
            </div>
            <ProgressBar value={levelInfo.progressPercent} />
          </div>
        </div>

        {/* 6 Real Account KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {[
            {
              label: "Bài học hoàn thành",
              value: `${data.stats.completed_lessons}/${data.stats.total_lessons}`,
              icon: BookOpen,
              color: "text-blue-500 bg-blue-500/10",
            },
            {
              label: "Bài tập đã giải",
              value: String(data.stats.solved_exercises),
              icon: Terminal,
              color: "text-emerald-500 bg-emerald-500/10",
            },
            {
              label: "Tỷ lệ giải đúng",
              value: `${data.stats.accuracy_rate}%`,
              icon: Target,
              color: "text-indigo-500 bg-indigo-500/10",
            },
            {
              label: "Thời gian học tập",
              value: formatMinutes(data.stats.total_study_minutes),
              icon: Clock,
              color: "text-cyan-500 bg-cyan-500/10",
            },
            {
              label: "Learning Streak",
              value: `${data.streak.current_streak} ngày`,
              icon: Flame,
              color: "text-orange-500 bg-orange-500/10",
            },
            {
              label: "Huy hiệu đạt được",
              value: `${unlockedCount}/${data.achievements.length}`,
              icon: Trophy,
              color: "text-amber-500 bg-amber-500/10",
            },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="p-4">
                <div className={`mb-2.5 inline-flex h-9 w-9 items-center justify-center rounded-xl ${stat.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-xl font-extrabold font-mono text-slate-900 dark:text-white">
                  {stat.value}
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{stat.label}</p>
              </Card>
            );
          })}
        </div>

        {/* Chart + Enrolled Courses */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Activity Chart */}
          <Card className="xl:col-span-7 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Thống kê hoạt động học tập
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Theo dõi XP kiếm được và thời lượng học thực tế của tài khoản
                </p>
              </div>
              <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 p-1">
                {[
                  { key: "daily", label: "Ngày" },
                  { key: "weekly", label: "Tuần" },
                  { key: "monthly", label: "Tháng" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setChartRange(tab.key as "daily" | "weekly" | "monthly")}
                    className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                      chartRange === tab.key
                        ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="xpGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="minGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#1e293b",
                      borderRadius: "12px",
                      fontSize: "12px",
                      color: "#f8fafc",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="xp_earned"
                    name="XP đạt được"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    fill="url(#xpGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="study_minutes"
                    name="Phút học"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#minGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Enrolled Courses */}
          <Card className="xl:col-span-5 p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Khóa học đang tham gia
              </h2>
              <Link href="/courses" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                Tất cả khóa học
              </Link>
            </div>

            {data.enrolled_courses.length === 0 ? (
              <EmptyState
                title="Bạn chưa tham gia khóa học nào"
                description="Khám phá lộ trình C++, HTML, CSS hoặc JavaScript và bắt đầu bài học đầu tiên."
                action={
                  <Link href="/courses">
                    <Button size="sm">Khám phá khóa học</Button>
                  </Link>
                }
              />
            ) : (
              <div className="space-y-3.5 flex-1">
                {data.enrolled_courses.map((course) => (
                  <Link
                    key={course.id}
                    href={`/courses/${course.slug}`}
                    className="block rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-3.5 hover:border-blue-500/40 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <Badge className={languageBadgeClasses(course.language)}>
                        {languageLabel(course.language)}
                      </Badge>
                      <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                        {course.progress_percent ?? 0}%
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                      {course.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Đã hoàn thành {course.completed_lessons}/{course.lesson_count} bài học
                    </p>
                    <ProgressBar value={course.progress_percent ?? 0} className="mt-2.5 h-1.5" />
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* In-progress Lessons + Recommended Next Lessons */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-5">
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Bài học đang học dở
            </h2>
            {data.in_progress_lessons.length === 0 ? (
              <EmptyState
                title="Không có bài học nào bị bỏ dở"
                description="Tuyệt vời! Bạn có thể chọn bài học mới ở danh sách đề xuất bên cạnh."
              />
            ) : (
              <div className="space-y-2.5">
                {data.in_progress_lessons.map((item) => (
                  <Link
                    key={item.lesson_id}
                    href={`/courses/${item.course_slug}/lessons/${item.lesson_slug}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 hover:border-blue-500/40 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={languageBadgeClasses(item.language)}>
                          {languageLabel(item.language)}
                        </Badge>
                        <span className="text-[11px] text-slate-500 truncate">{item.course_title}</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {item.lesson_title}
                      </p>
                    </div>
                    <Button size="sm" variant="secondary" className="shrink-0">
                      Học tiếp <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-500" />
                Bài học được đề xuất tiếp theo
              </h2>
            </div>
            {data.recommended_lessons.length === 0 ? (
              <EmptyState
                title="Bạn đã hoàn thành toàn bộ bài học!"
                description="Hãy chuyển sang khu vực Coding Challenges để rèn luyện giải thuật nâng cao."
              />
            ) : (
              <div className="space-y-2.5">
                {data.recommended_lessons.map((rec) => (
                  <Link
                    key={rec.lesson_id}
                    href={`/courses/${rec.course_slug}/lessons/${rec.lesson_slug}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 hover:border-blue-500/40 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={languageBadgeClasses(rec.language)}>
                          {languageLabel(rec.language)}
                        </Badge>
                        <span className="text-[11px] text-slate-500">
                          {rec.estimated_minutes} phút · +{rec.xp_reward} XP
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {rec.lesson_title}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400 shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Achievements + Weak Topics + System Status */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-8 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-500" /> Thành tích & Huy hiệu
              </h2>
              <span className="text-xs font-semibold text-slate-500">
                Đã mở khóa {unlockedCount}/{data.achievements.length}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.achievements.map((ach) => (
                <div
                  key={ach.id}
                  className={`flex items-start gap-3 rounded-xl border p-3.5 transition-all ${
                    ach.unlocked
                      ? "border-amber-500/35 bg-amber-500/8 dark:bg-amber-500/10"
                      : "border-slate-200 dark:border-slate-800 opacity-60"
                  }`}
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      ach.unlocked
                        ? "bg-amber-500 text-white shadow-sm"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                    }`}
                  >
                    <Trophy className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {ach.title}
                      </p>
                      {ach.unlocked && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400 leading-snug">
                      {ach.description}
                    </p>
                    <p className="mt-1 text-[11px] font-mono font-semibold text-amber-600 dark:text-amber-400">
                      +{ach.xp_bonus} XP thưởng
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="lg:col-span-4 space-y-6">
            <Card className="p-5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3">
                Chủ đề cần củng cố (từ Quiz)
              </h2>
              {data.weak_topics.length === 0 ? (
                <p className="text-xs text-slate-500 leading-relaxed">
                  Chưa phát hiện lỗ hổng kiến thức. Hãy làm thêm các bài <Link href="/quizzes" className="text-blue-500 font-semibold hover:underline">Kiểm tra Quiz</Link> để hệ thống phân tích tự động!
                </p>
              ) : (
                <div className="space-y-2">
                  {data.weak_topics.map((wt) => (
                    <div
                      key={wt.topic}
                      className="flex items-center justify-between rounded-xl border border-rose-500/20 bg-rose-500/5 px-3 py-2 text-xs"
                    >
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{wt.topic}</span>
                      <span className="font-mono text-rose-500 font-bold">{wt.misses} lần sai</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-5">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-blue-500" /> Trạng thái tích hợp hệ thống
              </h2>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Cơ sở dữ liệu</span>
                  <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    {data.system_status.database_mode === "supabase" ? "Supabase Postgres" : "Local SQLite (Đang chạy)"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Trình chạy C++17</span>
                  <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    {data.system_status.judge0_configured ? "Judge0 Sandbox" : "Clang WASM (Trình duyệt)"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">AI Coding Tutor</span>
                  <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    {data.system_status.ai_tutor_configured ? "Google Gemini API" : "Offline thông minh (Sẵn sàng)"}
                  </Badge>
                </div>
                <p className="pt-2 text-[11px] text-slate-500 leading-relaxed border-t border-slate-200 dark:border-slate-800">
                  Xem tệp <code className="font-mono">.env.example</code> và <code className="font-mono">README.md</code> để gắn khóa Judge0, Gemini AI và Supabase PostgreSQL cho môi trường production.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
