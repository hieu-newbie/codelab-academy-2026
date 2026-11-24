"use client";

import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Award,
  Bookmark,
  BookOpen,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  History,
  KeyRound,
  Moon,
  Save,
  Sun,
  Terminal,
  Trophy,
  User,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth, useTheme, useToast } from "@/components/providers";
import { Badge, Button, Card, EmptyState, ErrorState, LoadingState } from "@/components/ui/primitives";
import { formatRelativeDate, languageBadgeClasses, languageLabel } from "@/lib/utils";
import type { AchievementRecord, CourseLanguage, UserProfile } from "@/types/codelab";

interface ProfilePayload {
  profile: UserProfile;
  bookmarkedLessons: Array<{
    id: string;
    slug: string;
    title: string;
    language: string;
    course_slug: string;
    course_title: string;
  }>;
  bookmarkedExercises: Array<{
    id: string;
    code: string;
    slug: string;
    title: string;
    category: string;
    difficulty: string;
  }>;
  recentLessons: Array<{
    status: string;
    updated_at: string;
    lesson_slug: string;
    lesson_title: string;
    course_slug: string;
    course_title: string;
    language: string;
  }>;
  recentSubmissions: Array<{
    id: string;
    status: string;
    passed_tests: number;
    total_tests: number;
    created_at: string;
    exercise_code: string;
    exercise_slug: string;
    exercise_title: string;
  }>;
  recentQuizAttempts: Array<{
    id: string;
    score: number;
    max_score: number;
    percentage: number;
    passed: number;
    created_at: string;
    quiz_slug: string;
    quiz_title: string;
  }>;
  achievements: AchievementRecord[];
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading, refreshUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  const [data, setData] = useState<ProfilePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"settings" | "bookmarks" | "history" | "achievements">("settings");

  // Profile form state
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [preferredLang, setPreferredLang] = useState<CourseLanguage>("cpp");
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changingPw, setChangingPw] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/profile", { cache: "no-store" });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) throw new Error("Không thể tải hồ sơ cá nhân.");
      const json = (await res.json()) as ProfilePayload;
      setData(json);
      setFullName(json.profile.full_name);
      setUsername(json.profile.username);
      setBio(json.profile.bio || "");
      setAvatarUrl(json.profile.avatar_url);
      setPreferredLang(json.profile.preferred_language);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi tải hồ sơ.");
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
    const t = setTimeout(() => loadProfile(), 0);
    return () => clearTimeout(t);
  }, [authLoading, user, router, loadProfile]);

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 350 * 1024) {
      toast({ title: "Ảnh tối đa 350KB để tối ưu tốc độ tải", variant: "error" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          username,
          bio,
          avatar_url: avatarUrl,
          preferred_language: preferredLang,
          theme,
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        toast({ title: j.error || "Không thể cập nhật hồ sơ", variant: "error" });
        return;
      }
      await refreshUser();
      await loadProfile();
      toast({ title: "Đã cập nhật hồ sơ cá nhân!", variant: "success" });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangingPw(true);
    try {
      const res = await fetch("/api/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const j = await res.json();
      if (!res.ok) {
        toast({ title: j.error || "Đổi mật khẩu thất bại", variant: "error" });
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      toast({ title: "Đã đổi mật khẩu thành công!", variant: "success" });
    } finally {
      setChangingPw(false);
    }
  };

  if (authLoading || loading) {
    return (
      <AppShell>
        <LoadingState message="Đang tải hồ sơ cá nhân..." />
      </AppShell>
    );
  }

  if (error || !data) {
    return (
      <AppShell>
        <ErrorState message={error || "Không có dữ liệu hồ sơ."} onRetry={loadProfile} />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
        {/* Header Summary */}
        <Card className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={data.profile.full_name}
                  width={64}
                  height={64}
                  unoptimized
                  className="h-16 w-16 rounded-2xl object-cover border border-slate-200 dark:border-slate-700"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-2xl font-extrabold text-white">
                  {data.profile.full_name.slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
                {data.profile.full_name}
              </h1>
              <p className="text-xs text-slate-500">
                @{data.profile.username} · {data.profile.email}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge className="border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  Level {data.profile.level}
                </Badge>
                <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  {data.profile.xp.toLocaleString("vi-VN")} XP
                </Badge>
                <Badge className="border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                  {data.profile.role === "admin" ? "Quản trị viên" : "Học viên"}
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: "settings", label: "Hồ sơ & Cài đặt", icon: User },
            { id: "bookmarks", label: "Bài đã lưu yêu thích", icon: Bookmark },
            { id: "history", label: "Lịch sử học tập", icon: History },
            { id: "achievements", label: "Thành tích cá nhân", icon: Award },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id as typeof tab)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-colors cursor-pointer ${
                  tab === t.id
                    ? "bg-blue-600 text-white shadow-sm"
                    : "border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-blue-500/40"
                }`}
              >
                <Icon className="h-4 w-4" /> {t.label}
              </button>
            );
          })}
        </div>

        {/* Tab 1: Settings */}
        {tab === "settings" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <Card className="lg:col-span-7 p-6">
              <h2 className="text-base font-bold mb-4">Cập nhật thông tin cá nhân</h2>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="flex items-center gap-4">
                  <label className="inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 px-3.5 py-2 text-xs font-semibold cursor-pointer hover:border-blue-500">
                    <Camera className="h-4 w-4 text-blue-500" /> Chọn ảnh đại diện (PNG/JPG)
                    <input type="file" accept="image/*" onChange={handleAvatarFile} className="hidden" />
                  </label>
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setAvatarUrl(null)}
                      className="text-xs text-rose-500 hover:underline cursor-pointer"
                    >
                      Xóa ảnh
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">Họ và tên</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">Username</label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">Giới thiệu ngắn (Bio)</label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Mục tiêu học lập trình của bạn..."
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">Ngôn ngữ ưu tiên</label>
                    <select
                      value={preferredLang}
                      onChange={(e) => setPreferredLang(e.target.value as CourseLanguage)}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                    >
                      <option value="cpp">C++ Programming</option>
                      <option value="html">HTML5</option>
                      <option value="css">CSS3</option>
                      <option value="javascript">JavaScript</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5">Chế độ giao diện</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setTheme("light")}
                        className={`inline-flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-semibold cursor-pointer ${
                          theme === "light"
                            ? "border-blue-500 bg-blue-500/10 text-blue-600"
                            : "border-slate-300 dark:border-slate-700"
                        }`}
                      >
                        <Sun className="h-3.5 w-3.5" /> Sáng
                      </button>
                      <button
                        type="button"
                        onClick={() => setTheme("dark")}
                        className={`inline-flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-semibold cursor-pointer ${
                          theme === "dark"
                            ? "border-blue-500 bg-blue-500/15 text-blue-400"
                            : "border-slate-300 dark:border-slate-700"
                        }`}
                      >
                        <Moon className="h-3.5 w-3.5" /> Tối
                      </button>
                    </div>
                  </div>
                </div>

                <Button type="submit" loading={savingProfile}>
                  <Save className="h-4 w-4" /> Lưu thay đổi hồ sơ
                </Button>
              </form>
            </Card>

            <Card className="lg:col-span-5 p-6">
              <h2 className="text-base font-bold flex items-center gap-2 mb-4">
                <KeyRound className="h-4 w-4 text-blue-500" /> Đổi mật khẩu bảo mật
              </h2>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Mật khẩu hiện tại</label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5">Mật khẩu mới (tối thiểu 6 ký tự)</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </div>
                <Button type="submit" variant="secondary" loading={changingPw} className="w-full">
                  Cập nhật mật khẩu
                </Button>
              </form>
            </Card>
          </div>
        )}

        {/* Tab 2: Bookmarks */}
        {tab === "bookmarks" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-5 space-y-3">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-blue-500" /> Bài học yêu thích ({data.bookmarkedLessons.length})
              </h2>
              {data.bookmarkedLessons.length === 0 ? (
                <EmptyState title="Chưa lưu bài học nào" description="Bấm biểu tượng đánh dấu trong bài học để lưu ôn tập nhanh." />
              ) : (
                data.bookmarkedLessons.map((l) => (
                  <Link
                    key={l.id}
                    href={`/courses/${l.course_slug}/lessons/${l.slug}`}
                    className="block rounded-xl border border-slate-200 dark:border-slate-800 p-3 hover:border-blue-500/40"
                  >
                    <Badge className={languageBadgeClasses(l.language)}>{languageLabel(l.language)}</Badge>
                    <p className="mt-1 text-sm font-bold">{l.title}</p>
                    <p className="text-xs text-slate-500">{l.course_title}</p>
                  </Link>
                ))
              )}
            </Card>

            <Card className="p-5 space-y-3">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <Terminal className="h-4 w-4 text-emerald-500" /> Bài tập yêu thích ({data.bookmarkedExercises.length})
              </h2>
              {data.bookmarkedExercises.length === 0 ? (
                <EmptyState title="Chưa lưu bài tập nào" description="Đánh dấu những bài giải thuật hay để luyện lại trước kỳ thi." />
              ) : (
                data.bookmarkedExercises.map((ex) => (
                  <Link
                    key={ex.id}
                    href={`/challenges/${ex.slug}`}
                    className="block rounded-xl border border-slate-200 dark:border-slate-800 p-3 hover:border-blue-500/40"
                  >
                    <p className="text-xs font-mono text-slate-500">{ex.code} · {ex.category}</p>
                    <p className="text-sm font-bold">{ex.title}</p>
                  </Link>
                ))
              )}
            </Card>
          </div>
        )}

        {/* Tab 3: History */}
        {tab === "history" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <Card className="p-5 space-y-3">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-blue-500" /> Bài học gần đây
              </h3>
              {data.recentLessons.length === 0 ? (
                <p className="text-xs text-slate-500">Chưa có lịch sử học bài.</p>
              ) : (
                data.recentLessons.map((rl, i) => (
                  <Link
                    key={i}
                    href={`/courses/${rl.course_slug}/lessons/${rl.lesson_slug}`}
                    className="block rounded-xl border border-slate-200 dark:border-slate-800 p-3 text-xs hover:border-blue-500/40"
                  >
                    <p className="font-bold text-slate-900 dark:text-white">{rl.lesson_title}</p>
                    <p className="text-slate-500 mt-0.5">
                      {rl.status === "completed" ? "Hoàn thành" : "Đang học"} · {formatRelativeDate(rl.updated_at)}
                    </p>
                  </Link>
                ))
              )}
            </Card>

            <Card className="p-5 space-y-3">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Terminal className="h-4 w-4 text-emerald-500" /> Lịch sử nộp code
              </h3>
              {data.recentSubmissions.length === 0 ? (
                <p className="text-xs text-slate-500">Chưa có bài nộp nào.</p>
              ) : (
                data.recentSubmissions.map((s) => (
                  <Link
                    key={s.id}
                    href={`/challenges/${s.exercise_slug}`}
                    className="block rounded-xl border border-slate-200 dark:border-slate-800 p-3 text-xs hover:border-blue-500/40"
                  >
                    <p className="font-bold">{s.exercise_code}: {s.exercise_title}</p>
                    <p className="text-slate-500 mt-0.5">
                      {s.status} ({s.passed_tests}/{s.total_tests}) · {formatRelativeDate(s.created_at)}
                    </p>
                  </Link>
                ))
              )}
            </Card>

            <Card className="p-5 space-y-3">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-indigo-500" /> Lịch sử làm Quiz
              </h3>
              {data.recentQuizAttempts.length === 0 ? (
                <p className="text-xs text-slate-500">Chưa làm bài kiểm tra nào.</p>
              ) : (
                data.recentQuizAttempts.map((q) => (
                  <Link
                    key={q.id}
                    href={`/quizzes/${q.quiz_slug}`}
                    className="block rounded-xl border border-slate-200 dark:border-slate-800 p-3 text-xs hover:border-blue-500/40"
                  >
                    <p className="font-bold">{q.quiz_title}</p>
                    <p className="text-slate-500 mt-0.5">
                      {q.percentage}% ({q.passed ? "Đạt" : "Chưa đạt"}) · {formatRelativeDate(q.created_at)}
                    </p>
                  </Link>
                ))
              )}
            </Card>
          </div>
        )}

        {/* Tab 4: Achievements */}
        {tab === "achievements" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.achievements.map((ach) => (
              <Card
                key={ach.id}
                className={`p-4 flex items-start gap-3 ${
                  ach.unlocked ? "border-amber-500/40 bg-amber-500/5" : "opacity-60"
                }`}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    ach.unlocked ? "bg-amber-500 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                  }`}
                >
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold flex items-center gap-1.5">
                    {ach.title} {ach.unlocked && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                  </p>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{ach.description}</p>
                  <p className="mt-1.5 font-mono text-[11px] font-bold text-amber-600 dark:text-amber-400">
                    +{ach.xp_bonus} XP thưởng
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
