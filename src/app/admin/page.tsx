"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  ClipboardCheck,
  Edit3,
  Flag,
  Lock,
  Plus,
  ShieldCheck,
  Terminal,
  Trash2,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth, useToast } from "@/components/providers";
import { ExerciseCmsEditor, LessonCmsEditor } from "@/components/admin/AdminEditors";
import { Badge, Button, Card, ErrorState, LoadingState } from "@/components/ui/primitives";
import { difficultyBadgeClasses, formatRelativeDate } from "@/lib/utils";
import type { BugReportRecord, CourseLanguage, QuizQuestionType } from "@/types/codelab";

interface AdminOverviewData {
  stats: {
    total_users: number;
    total_courses: number;
    total_lessons: number;
    total_exercises: number;
    total_submissions: number;
    total_quizzes: number;
    total_quiz_attempts: number;
    open_bug_reports: number;
  };
  users: Array<{
    id: string;
    email: string;
    full_name: string;
    username: string;
    role: "student" | "admin";
    xp: number;
    level: number;
    completed_lessons: number;
    solved_exercises: number;
    created_at: string;
  }>;
  courses: Array<{
    id: string;
    slug: string;
    title: string;
    language: CourseLanguage;
    difficulty: string;
    section_count: number;
    lesson_count: number;
  }>;
  sections: Array<{ id: string; course_id: string; title: string; sort_order: number }>;
  lessons: Array<{
    id: string;
    course_id: string;
    section_id: string;
    slug: string;
    title: string;
    summary: string;
    estimated_minutes: number;
    xp_reward: number;
    language: CourseLanguage;
    content_json: string;
    course_title: string;
    section_title: string;
  }>;
  exercises: Array<{
    id: string;
    code: string;
    slug: string;
    title: string;
    category: string;
    difficulty: string;
    xp_reward: number;
    test_case_count: number;
  }>;
  quizzes: Array<{
    id: string;
    slug: string;
    title: string;
    topic: string;
    course_title: string;
    questions: Array<{
      id: string;
      question_type: QuizQuestionType;
      prompt: string;
      topic_tag: string;
      points: number;
    }>;
  }>;
  bug_reports: BugReportRecord[];
}

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [data, setData] = useState<AdminOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"users" | "lessons" | "exercises" | "quizzes" | "bugs">("lessons");

  // CMS Modals / Forms
  const [showLessonEditor, setShowLessonEditor] = useState(false);
  const [editingLesson, setEditingLesson] = useState<AdminOverviewData["lessons"][number] | null>(null);
  const [showExerciseEditor, setShowExerciseEditor] = useState(false);

  // Quick Add Quiz Question form
  const [qQuizId, setQQuizId] = useState("");
  const [qType, setQType] = useState<QuizQuestionType>("single_choice");
  const [qPrompt, setQPrompt] = useState("");
  const [qOptions, setQOptions] = useState("Lựa chọn A\nLựa chọn B\nLựa chọn C\nLựa chọn D");
  const [qCorrect, setQCorrect] = useState("Lựa chọn A");
  const [qExplanation, setQExplanation] = useState("");
  const [qTopic, setQTopic] = useState("C++ Cơ bản");
  const [addingQuestion, setAddingQuestion] = useState(false);

  // Quick Add Section form
  const [secCourseId, setSecCourseId] = useState("");
  const [secTitle, setSecTitle] = useState("");

  const loadAdmin = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/overview", { cache: "no-store" });
      if (res.status === 401 || res.status === 403) {
        setError("forbidden");
        return;
      }
      if (!res.ok) throw new Error("Không thể tải dữ liệu quản trị.");
      const json = (await res.json()) as AdminOverviewData;
      setData(json);
      if (!qQuizId && json.quizzes[0]) setQQuizId(json.quizzes[0].id);
      if (!secCourseId && json.courses[0]) setSecCourseId(json.courses[0].id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi tải Admin Dashboard.");
    } finally {
      setLoading(false);
    }
  }, [qQuizId, secCourseId]);

  useEffect(() => {
    if (authLoading) return;
    const t = setTimeout(() => {
      if (!user || user.role !== "admin") {
        setError("forbidden");
        setLoading(false);
      } else {
        loadAdmin();
      }
    }, 0);
    return () => clearTimeout(t);
  }, [authLoading, user, loadAdmin]);

  const toggleUserRole = async (userId: string, currentRole: "student" | "admin") => {
    const nextRole = currentRole === "admin" ? "student" : "admin";
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role: nextRole }),
    });
    const j = await res.json();
    if (!res.ok) {
      toast({ title: j.error || "Không thể đổi quyền", variant: "error" });
      return;
    }
    toast({ title: `Đã cập nhật vai trò thành ${nextRole}`, variant: "success" });
    loadAdmin();
  };

  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secCourseId || !secTitle.trim()) return;
    const res = await fetch("/api/admin/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "section",
        course_id: secCourseId,
        title: secTitle.trim(),
        sort_order: (data?.sections.filter((s) => s.course_id === secCourseId).length ?? 0) + 1,
      }),
    });
    if (res.ok) {
      setSecTitle("");
      toast({ title: "Đã thêm chương mới!", variant: "success" });
      loadAdmin();
    }
  };

  const handleDeleteLesson = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa bài học này?")) return;
    const res = await fetch(`/api/admin/lessons?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "Đã xóa bài học", variant: "info" });
      loadAdmin();
    }
  };

  const handleDeleteExercise = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa bài tập và toàn bộ test cases của nó?")) return;
    const res = await fetch(`/api/admin/exercises?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (res.ok) {
      toast({ title: "Đã xóa bài tập", variant: "info" });
      loadAdmin();
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingQuestion(true);
    try {
      const optionsArr =
        qType === "fill_blank"
          ? []
          : qType === "true_false"
          ? ["Đúng", "Sai"]
          : qOptions.split("\n").map((s) => s.trim()).filter(Boolean);
      const correctVal =
        qType === "multiple_choice"
          ? qCorrect.split(",").map((s) => s.trim()).filter(Boolean)
          : qCorrect.trim();

      const res = await fetch("/api/admin/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "question",
          quiz_id: qQuizId,
          question_type: qType,
          prompt: qPrompt,
          options: optionsArr,
          correct_answer: correctVal,
          explanation: qExplanation,
          topic_tag: qTopic,
          points: 15,
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        toast({ title: j.error || "Không thể thêm câu hỏi", variant: "error" });
        return;
      }
      setQPrompt("");
      setQExplanation("");
      toast({ title: "Đã thêm câu hỏi vào Quiz!", variant: "success" });
      loadAdmin();
    } finally {
      setAddingQuestion(false);
    }
  };

  const handleDeleteQuestion = async (qid: string) => {
    const res = await fetch(`/api/admin/quizzes?questionId=${encodeURIComponent(qid)}`, {
      method: "DELETE",
    });
    if (res.ok) {
      toast({ title: "Đã xóa câu hỏi", variant: "info" });
      loadAdmin();
    }
  };

  const handleUpdateBug = async (id: string, status: "open" | "in_review" | "resolved") => {
    const res = await fetch("/api/admin/bug-reports", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        status,
        admin_note: status === "resolved" ? "Đã kiểm tra và cập nhật nội dung." : "Đang xử lý.",
      }),
    });
    if (res.ok) {
      toast({ title: `Đã chuyển trạng thái báo lỗi sang "${status}"`, variant: "success" });
      loadAdmin();
    }
  };

  if (authLoading || loading) {
    return (
      <AppShell>
        <LoadingState message="Đang xác thực quyền quản trị..." />
      </AppShell>
    );
  }

  if (error === "forbidden") {
    return (
      <AppShell>
        <Card className="max-w-lg mx-auto my-14 p-8 text-center space-y-4 border-rose-500/30">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-500">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
            Khu vực giới hạn – Chỉ dành cho Admin
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Tài khoản hiện tại không có quyền Quản trị viên (role = admin). Mọi endpoint quản trị đều được bảo vệ phía máy chủ bằng HTTP 403.
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/dashboard">
              <Button variant="secondary">Về Dashboard</Button>
            </Link>
            <Link href="/login">
              <Button variant="primary">Đăng nhập tài khoản Admin</Button>
            </Link>
          </div>
        </Card>
      </AppShell>
    );
  }

  if (error || !data) {
    return (
      <AppShell>
        <ErrorState message={error || "Không thể tải Admin Dashboard."} onRetry={loadAdmin} />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Badge className="border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mb-2">
              <ShieldCheck className="h-3.5 w-3.5" /> Admin CMS · RBAC Verified
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Quản trị hệ thống CODELAB
            </h1>
            <p className="text-sm text-slate-500">
              Biên tập khóa học, bài học, bài tập, test cases, câu hỏi Quiz và xử lý báo lỗi người dùng trực tiếp trên cơ sở dữ liệu.
            </p>
          </div>
        </div>

        {/* Analytics Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Tổng người dùng", val: data.stats.total_users, color: "text-blue-500" },
            { label: "Khóa học / Bài học", val: `${data.stats.total_courses} / ${data.stats.total_lessons}`, color: "text-emerald-500" },
            { label: "Bài tập / Lượt nộp", val: `${data.stats.total_exercises} / ${data.stats.total_submissions}`, color: "text-indigo-500" },
            { label: "Báo lỗi cần xử lý", val: data.stats.open_bug_reports, color: "text-rose-500" },
          ].map((s) => (
            <Card key={s.label} className="p-4">
              <p className={`text-2xl font-extrabold font-mono ${s.color}`}>{s.val}</p>
              <p className="mt-1 text-xs text-slate-500">{s.label}</p>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: "lessons", label: `Khóa học & Bài học (${data.lessons.length})`, icon: BookOpen },
            { id: "exercises", label: `Bài tập & Test Cases (${data.exercises.length})`, icon: Terminal },
            { id: "quizzes", label: `Quizzes & Câu hỏi (${data.quizzes.length})`, icon: ClipboardCheck },
            { id: "users", label: `Người dùng (${data.users.length})`, icon: Users },
            { id: "bugs", label: `Báo lỗi (${data.stats.open_bug_reports})`, icon: Flag },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id as typeof tab)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold cursor-pointer transition-colors ${
                  tab === t.id
                    ? "bg-blue-600 text-white"
                    : "border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300"
                }`}
              >
                <Icon className="h-4 w-4" /> {t.label}
              </button>
            );
          })}
        </div>

        {/* TAB: LESSONS & COURSES CMS */}
        {tab === "lessons" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <form onSubmit={handleAddSection} className="flex flex-wrap items-center gap-2">
                <select
                  value={secCourseId}
                  onChange={(e) => setSecCourseId(e.target.value)}
                  className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
                >
                  {data.courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={secTitle}
                  onChange={(e) => setSecTitle(e.target.value)}
                  placeholder="Tên chương mới..."
                  className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs w-52"
                />
                <Button type="submit" size="sm" variant="secondary">
                  <Plus className="h-3.5 w-3.5" /> Thêm chương
                </Button>
              </form>

              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  setEditingLesson(null);
                  setShowLessonEditor(true);
                }}
              >
                <Plus className="h-4 w-4" /> Biên soạn bài học mới
              </Button>
            </div>

            {showLessonEditor && (
              <LessonCmsEditor
                courses={data.courses}
                sections={data.sections}
                editingLesson={editingLesson}
                onCancel={() => {
                  setShowLessonEditor(false);
                  setEditingLesson(null);
                }}
                onSaved={() => {
                  setShowLessonEditor(false);
                  setEditingLesson(null);
                  loadAdmin();
                }}
              />
            )}

            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 text-[11px] font-bold uppercase text-slate-500">
                      <th className="px-4 py-3">Khóa học / Chương</th>
                      <th className="px-4 py-3">Bài học</th>
                      <th className="px-4 py-3">Ngôn ngữ</th>
                      <th className="px-4 py-3">XP</th>
                      <th className="px-4 py-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {data.lessons.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900 dark:text-white">{l.course_title}</p>
                          <p className="text-[11px] text-slate-500">{l.section_title}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-900 dark:text-white">{l.title}</p>
                          <p className="font-mono text-[11px] text-slate-500">/{l.slug}</p>
                        </td>
                        <td className="px-4 py-3 font-mono uppercase">{l.language}</td>
                        <td className="px-4 py-3 font-mono font-bold text-amber-500">+{l.xp_reward}</td>
                        <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingLesson(l);
                              setShowLessonEditor(true);
                            }}
                          >
                            <Edit3 className="h-3.5 w-3.5" /> Sửa
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteLesson(l.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* TAB: EXERCISES & TEST CASES */}
        {tab === "exercises" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" variant="primary" onClick={() => setShowExerciseEditor(true)}>
                <Plus className="h-4 w-4" /> Tạo bài tập & Test Cases mới
              </Button>
            </div>

            {showExerciseEditor && (
              <ExerciseCmsEditor
                onCancel={() => setShowExerciseEditor(false)}
                onSaved={() => {
                  setShowExerciseEditor(false);
                  loadAdmin();
                }}
              />
            )}

            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 text-[11px] font-bold uppercase text-slate-500">
                      <th className="px-4 py-3">Mã</th>
                      <th className="px-4 py-3">Tên bài tập</th>
                      <th className="px-4 py-3">Chủ đề</th>
                      <th className="px-4 py-3">Độ khó</th>
                      <th className="px-4 py-3">Test Cases</th>
                      <th className="px-4 py-3 text-right">Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {data.exercises.map((ex) => (
                      <tr key={ex.id}>
                        <td className="px-4 py-3 font-mono font-bold">{ex.code}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                          <Link href={`/challenges/${ex.slug}`} className="hover:text-blue-500">
                            {ex.title}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-slate-500">{ex.category}</td>
                        <td className="px-4 py-3">
                          <Badge className={difficultyBadgeClasses(ex.difficulty)}>{ex.difficulty}</Badge>
                        </td>
                        <td className="px-4 py-3 font-mono">{ex.test_case_count} cases</td>
                        <td className="px-4 py-3 text-right">
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteExercise(ex.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* TAB: QUIZZES & QUESTIONS */}
        {tab === "quizzes" && (
          <div className="space-y-5">
            <Card className="p-5">
              <h3 className="text-sm font-bold mb-3">Thêm câu hỏi kiểm tra mới vào Quiz</h3>
              <form onSubmit={handleAddQuestion} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <select value={qQuizId} onChange={(e) => setQQuizId(e.target.value)} className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2">
                    {data.quizzes.map((q) => (
                      <option key={q.id} value={q.id}>{q.title}</option>
                    ))}
                  </select>
                  <select value={qType} onChange={(e) => setQType(e.target.value as QuizQuestionType)} className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2">
                    <option value="single_choice">Trắc nghiệm 1 đáp án</option>
                    <option value="multiple_choice">Trắc nghiệm nhiều đáp án</option>
                    <option value="true_false">Đúng / Sai</option>
                    <option value="fill_blank">Điền khuyết</option>
                    <option value="predict_output">Dự đoán output</option>
                    <option value="find_bug">Tìm lỗi code</option>
                  </select>
                  <input required value={qTopic} onChange={(e) => setQTopic(e.target.value)} placeholder="Nhãn chủ đề (vd: Vòng lặp)" className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2" />
                </div>
                <input required value={qPrompt} onChange={(e) => setQPrompt(e.target.value)} placeholder="Nội dung câu hỏi..." className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {qType !== "fill_blank" && qType !== "true_false" && (
                    <textarea rows={3} value={qOptions} onChange={(e) => setQOptions(e.target.value)} placeholder="Các phương án (mỗi dòng 1 phương án)" className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5" />
                  )}
                  <div className="space-y-2">
                    <input required value={qCorrect} onChange={(e) => setQCorrect(e.target.value)} placeholder={qType === "multiple_choice" ? "Các đáp án đúng cách nhau dấu phẩy" : "Đáp án đúng chính xác"} className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2" />
                    <input required value={qExplanation} onChange={(e) => setQExplanation(e.target.value)} placeholder="Giải thích tại sao đúng/sai..." className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2" />
                  </div>
                </div>
                <Button type="submit" size="sm" loading={addingQuestion}>
                  <Plus className="h-3.5 w-3.5" /> Thêm câu hỏi
                </Button>
              </form>
            </Card>

            {data.quizzes.map((qz) => (
              <Card key={qz.id} className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold">{qz.title}</h3>
                    <p className="text-xs text-slate-500">{qz.course_title} · {qz.questions.length} câu hỏi</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {qz.questions.map((qq, i) => (
                    <div key={qq.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 text-xs">
                      <div className="min-w-0">
                        <span className="font-mono font-bold text-blue-500 mr-2">#{i + 1} [{qq.question_type}]</span>
                        <span className="text-slate-800 dark:text-slate-200">{qq.prompt}</span>
                      </div>
                      <button onClick={() => handleDeleteQuestion(qq.id)} className="text-rose-500 hover:text-rose-400 cursor-pointer shrink-0">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* TAB: USERS MANAGEMENT */}
        {tab === "users" && (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 text-[11px] font-bold uppercase text-slate-500">
                    <th className="px-4 py-3">Người dùng</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">XP / Cấp</th>
                    <th className="px-4 py-3">Bài học / Bài tập</th>
                    <th className="px-4 py-3">Vai trò</th>
                    <th className="px-4 py-3 text-right">Phân quyền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.users.map((u) => (
                    <tr key={u.id}>
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900 dark:text-white">{u.full_name}</p>
                        <p className="text-[11px] text-slate-500">@{u.username}</p>
                      </td>
                      <td className="px-4 py-3 font-mono">{u.email}</td>
                      <td className="px-4 py-3 font-mono">{u.xp} XP · Lv.{u.level}</td>
                      <td className="px-4 py-3 font-mono">{u.completed_lessons} / {u.solved_exercises}</td>
                      <td className="px-4 py-3">
                        <Badge
                          className={
                            u.role === "admin"
                              ? "border-indigo-500/30 bg-indigo-500/15 text-indigo-600 dark:text-indigo-400"
                              : "border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                          }
                        >
                          {u.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={u.id === user?.id}
                          onClick={() => toggleUserRole(u.id, u.role)}
                        >
                          {u.role === "admin" ? "Hạ xuống Student" : "Nâng lên Admin"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* TAB: BUG REPORTS */}
        {tab === "bugs" && (
          <div className="space-y-3">
            {data.bug_reports.length === 0 ? (
              <Card className="p-8 text-center text-sm text-slate-500">Không có báo lỗi nào.</Card>
            ) : (
              data.bug_reports.map((b) => (
                <Card key={b.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        className={
                          b.status === "resolved"
                            ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : b.status === "in_review"
                            ? "border-amber-500/30 bg-amber-500/15 text-amber-600 dark:text-amber-400"
                            : "border-rose-500/30 bg-rose-500/15 text-rose-600 dark:text-rose-400"
                        }
                      >
                        {b.status}
                      </Badge>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        [{b.target_type}] {b.target_title}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">{b.description}</p>
                    <p className="text-[11px] text-slate-500">
                      Báo cáo bởi {b.reporter_name} ({b.reporter_email}) · {formatRelativeDate(b.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {b.status !== "in_review" && b.status !== "resolved" && (
                      <Button size="sm" variant="secondary" onClick={() => handleUpdateBug(b.id, "in_review")}>
                        Đang kiểm tra
                      </Button>
                    )}
                    {b.status !== "resolved" && (
                      <Button size="sm" variant="success" onClick={() => handleUpdateBug(b.id, "resolved")}>
                        Đánh dấu đã sửa
                      </Button>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
