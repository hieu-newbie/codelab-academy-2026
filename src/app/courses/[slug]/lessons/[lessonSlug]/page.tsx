"use client";

import React, { use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Circle,
  Code2,
  Eye,
  Flag,
  GripVertical,
  HelpCircle,
  Info,
  Lightbulb,
  List,
  Play,
  Sparkles,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth, useToast } from "@/components/providers";
import {
  CodePlayground,
  type AiErrorContext,
  type AiExecutionContext,
} from "@/components/editor/CodePlayground";
import { AiTutorDrawer } from "@/components/ai/AiTutorDrawer";
import { Badge, Button, Card, ErrorState, InlineRichText, LoadingState } from "@/components/ui/primitives";
import { languageBadgeClasses, languageLabel } from "@/lib/utils";
import type { LessonDetail } from "@/types/codelab";

interface LessonApiResponse {
  lesson: LessonDetail & { section_order: number };
  navigation: {
    prev: { slug: string; title: string } | null;
    next: { slug: string; title: string } | null;
    syllabus: Array<{
      id: string;
      slug: string;
      title: string;
      section_title: string;
      estimated_minutes: number;
      status: string;
    }>;
  };
}

export default function InteractiveLessonPage({
  params,
}: {
  params: Promise<{ slug: string; lessonSlug: string }>;
}) {
  const { slug, lessonSlug } = use(params);
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();

  const [data, setData] = useState<LessonApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Interactive editor state
  const [code, setCode] = useState("");
  const [stdin, setStdin] = useState("");
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [lessonStatus, setLessonStatus] = useState<string>("not_started");

  // Hints & Solution disclosure (never spoilers by default!)
  const [revealedHints, setRevealedHints] = useState(0);
  const [showSolution, setShowSolution] = useState(false);

  // Inline Checkpoint Quiz
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [checkpointResult, setCheckpointResult] = useState<{
    correct: boolean;
    explanation: string;
  } | null>(null);
  const [checkingQuiz, setCheckingQuiz] = useState(false);

  // Drawers & Modals
  const [syllabusOpen, setSyllabusOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [errorContext, setErrorContext] = useState<AiErrorContext | null>(null);
  const [executionContext, setExecutionContext] = useState<AiExecutionContext | null>(null);
  const [bugModalOpen, setBugModalOpen] = useState(false);
  const lessonStorageKey = `codelab:code:lesson:${lessonSlug}`;
  const [bugDesc, setBugDesc] = useState("");
  const [submittingBug, setSubmittingBug] = useState(false);

  // Desktop Horizontal Split-Pane Resizing
  const [leftRatio, setLeftRatio] = useState(48);
  const splitContainerRef = useRef<HTMLDivElement>(null);
  const draggingSplitRef = useRef(false);

  const loadLesson = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/lessons/${lessonSlug}`, { cache: "no-store" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || "Không tìm thấy bài học.");
        return;
      }
      const json = (await res.json()) as LessonApiResponse;
      setData(json);
      let localDraft: string | null = null;
      try {
        localDraft = localStorage.getItem(lessonStorageKey);
      } catch {
        // ignore
      }
      setCode(localDraft ?? json.lesson.saved_code ?? json.lesson.content.practice.starterCode);
      setStdin(json.lesson.content.practice.sampleInput ?? "");
      setBookmarked(Boolean(json.lesson.bookmarked));
      setLessonStatus(json.lesson.status ?? "not_started");
      setRevealedHints(0);
      setShowSolution(false);
      setSelectedOption(null);
      setCheckpointResult(null);
    } catch {
      setError("Lỗi tải bài học.");
    } finally {
      setLoading(false);
    }
  }, [lessonSlug, lessonStorageKey]);

  useEffect(() => {
    const t = setTimeout(() => loadLesson(), 0);
    return () => clearTimeout(t);
  }, [loadLesson]);

  // Study time heartbeat every 60s for logged-in users
  useEffect(() => {
    if (!user || !data) return;
    const timer = setInterval(() => {
      fetch(`/api/lessons/${lessonSlug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "heartbeat", secondsDelta: 60 }),
      }).catch(() => {});
    }, 60_000);
    return () => clearInterval(timer);
  }, [user, data, lessonSlug]);

  // Horizontal split drag handler
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!draggingSplitRef.current || !splitContainerRef.current) return;
      const rect = splitContainerRef.current.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setLeftRatio(Math.max(30, Math.min(68, pct)));
    };
    const onUp = () => {
      draggingSplitRef.current = false;
      document.body.style.cursor = "";
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  const handleSaveCode = async () => {
    if (!user) {
      toast({ title: "Hãy đăng nhập để lưu code cá nhân", variant: "info" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/lessons/${lessonSlug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_code", code }),
      });
      if (res.ok) {
        toast({ title: "Đã lưu mã nguồn của bạn!", variant: "success" });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggleBookmark = async () => {
    if (!user) {
      toast({ title: "Đăng nhập để đánh dấu bài học yêu thích", variant: "info" });
      return;
    }
    const res = await fetch(`/api/lessons/${lessonSlug}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle_bookmark" }),
    });
    if (res.ok) {
      const j = await res.json();
      setBookmarked(j.bookmarked);
      toast({
        title: j.bookmarked ? "Đã lưu vào bài học yêu thích" : "Đã bỏ khỏi danh sách yêu thích",
        variant: "info",
      });
    }
  };

  const handleVerifyCheckpoint = async () => {
    if (selectedOption === null || !data) return;
    setCheckingQuiz(true);
    try {
      if (user) {
        const res = await fetch(`/api/lessons/${lessonSlug}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "checkpoint", selectedIndex: selectedOption }),
        });
        const j = await res.json();
        setCheckpointResult({ correct: j.correct, explanation: j.explanation });
      } else {
        const q = data.lesson.content.checkpointQuiz;
        setCheckpointResult({
          correct: selectedOption === q.correctIndex,
          explanation: q.explanation,
        });
      }
    } finally {
      setCheckingQuiz(false);
    }
  };

  const handleCompleteLesson = async () => {
    if (!user) {
      toast({
        title: "Đăng nhập để lưu tiến độ & nhận XP",
        description: "Hệ thống chỉ cộng XP khi xác thực tài khoản trên backend.",
        variant: "info",
      });
      return;
    }
    setCompleting(true);
    try {
      const res = await fetch(`/api/lessons/${lessonSlug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete" }),
      });
      const j = await res.json();
      if (res.ok) {
        setLessonStatus("completed");
        await refreshUser();
        toast({
          title:
            j.xp_granted > 0
              ? `Hoàn thành bài học! +${j.xp_granted} XP`
              : "Đã ghi nhận hoàn thành bài học!",
          description: "Tiến độ khóa học và chuỗi Streak của bạn đã được cập nhật.",
          variant: "success",
        });
        if (Array.isArray(j.newly_unlocked_achievements)) {
          for (const ach of j.newly_unlocked_achievements) {
            toast({
              title: `Mở khóa huy hiệu: ${ach.title}!`,
              description: `${ach.description} (+${ach.xp_bonus} XP thưởng)`,
              variant: "achievement",
            });
          }
        }
      }
    } finally {
      setCompleting(false);
    }
  };

  const handleSubmitBug = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data || !user) return;
    setSubmittingBug(true);
    try {
      const res = await fetch("/api/bug-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_type: "lesson",
          target_id: data.lesson.id,
          target_title: data.lesson.title,
          description: bugDesc,
        }),
      });
      const j = await res.json();
      if (res.ok) {
        toast({ title: "Đã gửi báo lỗi", description: j.message, variant: "success" });
        setBugDesc("");
        setBugModalOpen(false);
      } else {
        toast({ title: j.error || "Không thể gửi báo lỗi", variant: "error" });
      }
    } finally {
      setSubmittingBug(false);
    }
  };

  if (loading) {
    return (
      <AppShell fullBleed>
        <LoadingState message="Đang mở không gian học lập trình tương tác..." />
      </AppShell>
    );
  }

  if (error || !data) {
    return (
      <AppShell>
        <ErrorState message={error || "Không tìm thấy bài học."} onRetry={loadLesson} />
      </AppShell>
    );
  }

  const { lesson, navigation } = data;
  const c = lesson.content;

  return (
    <AppShell fullBleed>
      {/* Lesson Workspace Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1424] px-3 sm:px-4 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => setSyllabusOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 text-xs font-semibold hover:border-blue-500/40 cursor-pointer shrink-0"
          >
            <List className="h-3.5 w-3.5 text-blue-500" /> Mục lục
          </button>
          <Link
            href={`/courses/${slug}`}
            className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-blue-500 truncate"
          >
            {lesson.course_title}
          </Link>
          <ChevronRight className="hidden sm:block h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
            {lesson.title}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleToggleBookmark}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border cursor-pointer transition-colors ${
              bookmarked
                ? "border-amber-500/40 bg-amber-500/15 text-amber-500"
                : "border-slate-200 dark:border-slate-800 text-slate-400 hover:text-amber-500"
            }`}
            title="Đánh dấu bài học yêu thích"
          >
            <Bookmark className={`h-4 w-4 ${bookmarked ? "fill-current" : ""}`} />
          </button>
          {user && (
            <button
              onClick={() => setBugModalOpen(true)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-rose-500 cursor-pointer"
              title="Báo lỗi nội dung bài học"
            >
              <Flag className="h-3.5 w-3.5" />
            </button>
          )}
          <div className="flex items-center gap-1">
            {navigation.prev && (
              <Link href={`/courses/${slug}/lessons/${navigation.prev.slug}`}>
                <Button size="sm" variant="outline" title={navigation.prev.title}>
                  <ArrowLeft className="h-3.5 w-3.5" /> <span className="hidden md:inline">Trước</span>
                </Button>
              </Link>
            )}
            {navigation.next && (
              <Link href={`/courses/${slug}/lessons/${navigation.next.slug}`}>
                <Button size="sm" variant="secondary" title={navigation.next.title}>
                  <span className="hidden md:inline">Bài tiếp</span> <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Split-Pane Desktop Workspace */}
      <div
        ref={splitContainerRef}
        style={{ "--split-left": `${leftRatio}%` } as React.CSSProperties}
        className="flex flex-1 flex-col lg:grid lg:grid-cols-[var(--split-left)_10px_1fr] min-h-0 overflow-y-auto lg:overflow-hidden"
      >
        {/* LEFT PANE: 9-Step Interactive Lesson Content */}
        <div className="lg:h-full lg:min-h-0 overflow-y-auto border-b lg:border-b-0 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b1120] p-5 sm:p-7 space-y-8">
          {/* Step 1: Intro & Objectives */}
          <section className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={languageBadgeClasses(lesson.language)}>
                {languageLabel(lesson.language)}
              </Badge>
              <Badge className="border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {lesson.section_title}
              </Badge>
              <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Zap className="h-3 w-3" /> +{lesson.xp_reward} XP
              </Badge>
              {lessonStatus === "completed" && (
                <Badge className="border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" /> Đã hoàn thành
                </Badge>
              )}
            </div>

            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-snug">
              {lesson.title}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <InlineRichText text={c.introduction} />
            </p>

            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" /> Mục tiêu sau bài học
              </p>
              <ul className="space-y-1.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                {c.objectives.map((obj, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Step 2: Structured Theory & Beginner Glossary */}
          <section className="space-y-6">
            {c.theoryBlocks.map((block, idx) => (
              <div key={idx} className="space-y-3">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {block.heading}
                </h2>
                {block.paragraphs.map((p, pIdx) => (
                  <p key={pIdx} className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    <InlineRichText text={p} />
                  </p>
                ))}

                {block.glossary && block.glossary.length > 0 && (
                  <div className="rounded-xl border border-indigo-500/25 bg-indigo-500/5 p-4 space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" /> Giải thích thuật ngữ chuyên ngành
                    </p>
                    <dl className="space-y-2 text-xs">
                      {block.glossary.map((g, gIdx) => (
                        <div key={gIdx} className="rounded-lg bg-white/70 dark:bg-slate-900/60 p-2.5 border border-indigo-500/15">
                          <dt className="font-bold text-slate-900 dark:text-white">{g.term}</dt>
                          <dd className="mt-0.5 text-slate-600 dark:text-slate-300">{g.definition}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}

                {block.callout && (
                  <div
                    className={`rounded-xl border p-4 text-xs leading-relaxed ${
                      block.callout.type === "warning"
                        ? "border-amber-500/35 bg-amber-500/10 text-amber-800 dark:text-amber-200"
                        : block.callout.type === "tip"
                        ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
                        : "border-blue-500/35 bg-blue-500/10 text-blue-800 dark:text-blue-200"
                    }`}
                  >
                    <p className="font-bold flex items-center gap-1.5 mb-1">
                      {block.callout.type === "warning" ? (
                        <AlertTriangle className="h-4 w-4" />
                      ) : block.callout.type === "tip" ? (
                        <Lightbulb className="h-4 w-4" />
                      ) : (
                        <Info className="h-4 w-4" />
                      )}
                      {block.callout.title}
                    </p>
                    <p><InlineRichText text={block.callout.content} /></p>
                  </div>
                )}
              </div>
            ))}
          </section>

          {/* Optional Visual Diagram */}
          {c.diagram && (
            <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Minh họa trực quan: {c.diagram.title}
              </h3>
              <div
                className={`grid gap-2.5 ${
                  c.diagram.type === "memory"
                    ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-5"
                    : "grid-cols-1 sm:grid-cols-2"
                }`}
              >
                {c.diagram.items.map((item, idx) => (
                  <div
                    key={idx}
                    className={`rounded-xl border p-3 ${
                      item.highlight
                        ? "border-blue-500/50 bg-blue-500/10"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
                    }`}
                  >
                    <p className="font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400">
                      {item.label}
                    </p>
                    <p className="mt-1 font-mono text-sm font-extrabold text-slate-900 dark:text-white">
                      {item.value}
                    </p>
                    {item.detail && (
                      <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                        {item.detail}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 italic">{c.diagram.caption}</p>
            </section>
          )}

          {/* Step 3 & 4: Progressive Code Examples + Line-by-line Explanation */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Code2 className="h-5 w-5 text-blue-500" /> Ví dụ thực tế & Giải thích từng dòng code
            </h2>

            {c.examples.map((ex, idx) => (
              <Card key={idx} className="overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 px-4 py-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {ex.title}
                      </span>
                      <Badge className="border-blue-500/25 bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        {ex.level}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">{ex.description}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setCode(ex.code);
                      if (ex.sampleInput) setStdin(ex.sampleInput);
                      toast({ title: "Đã nạp ví dụ vào Monaco Editor", variant: "info" });
                    }}
                  >
                    <Play className="h-3 w-3" /> Thử trên Editor
                  </Button>
                </div>

                <pre className="overflow-x-auto bg-slate-950 p-4 font-mono text-xs text-slate-100 leading-relaxed">
                  <code>{ex.code}</code>
                </pre>

                {ex.expectedOutput && (
                  <div className="border-t border-slate-800 bg-[#070b14] px-4 py-2.5 text-xs font-mono">
                    {ex.sampleInput && (
                      <div className="text-slate-400 mb-1">
                        <span className="font-sans font-semibold text-slate-500">Input: </span>
                        {ex.sampleInput}
                      </div>
                    )}
                    <div className="text-emerald-400">
                      <span className="font-sans font-semibold text-slate-400">Output: </span>
                      <span className="whitespace-pre-wrap">{ex.expectedOutput}</span>
                    </div>
                  </div>
                )}

                {ex.lineExplanations.length > 0 && (
                  <div className="border-t border-slate-200 dark:border-slate-800 p-4 space-y-2 bg-white dark:bg-[#111827]">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Giải thích từng dòng
                    </p>
                    {ex.lineExplanations.map((le, lIdx) => (
                      <div key={lIdx} className="text-xs flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                        <span className="font-mono font-bold text-blue-600 dark:text-blue-400 shrink-0">
                          {le.line}:
                        </span>
                        <code className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 font-mono text-[11px] text-slate-800 dark:text-slate-200 shrink-0">
                          {le.code}
                        </code>
                        <span className="text-slate-600 dark:text-slate-400">— {le.explanation}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </section>

          {/* Step 5: Common Beginner Mistakes */}
          {c.commonMistakes.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" /> Lỗi người mới thường gặp
              </h2>
              {c.commonMistakes.map((m, idx) => (
                <Card key={idx} className="p-4 space-y-3 border-amber-500/25">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{m.title}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-3">
                      <p className="text-[11px] font-bold text-rose-500 mb-1.5 flex items-center gap-1">
                        <XCircle className="h-3.5 w-3.5" /> Cách viết dễ gây lỗi
                      </p>
                      <pre className="overflow-x-auto font-mono text-xs text-rose-700 dark:text-rose-300">
                        <code>{m.badCode}</code>
                      </pre>
                    </div>
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3">
                      <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mb-1.5 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Cách viết đúng chuẩn
                      </p>
                      <pre className="overflow-x-auto font-mono text-xs text-emerald-800 dark:text-emerald-300">
                        <code>{m.goodCode}</code>
                      </pre>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {m.explanation}
                  </p>
                </Card>
              ))}
            </section>
          )}

          {/* Step 6 & 7: Hands-on Practice Task + Progressive Hints + Hidden Solution */}
          <section className="rounded-2xl border-2 border-blue-500/30 bg-blue-500/5 p-5 space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-500" /> {c.practice.title}
              </h2>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setCode(c.practice.starterCode);
                  setStdin(c.practice.sampleInput ?? "");
                  toast({ title: "Đã nạp khung bài tập vào Editor", variant: "info" });
                }}
              >
                Nạp khung bài tập
              </Button>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
              <InlineRichText text={c.practice.prompt} />
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-mono">
              {c.practice.sampleInput && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3">
                  <p className="font-sans text-[11px] font-bold text-slate-500 mb-1">Input mẫu</p>
                  <pre className="whitespace-pre-wrap">{c.practice.sampleInput}</pre>
                </div>
              )}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3">
                <p className="font-sans text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                  Output kỳ vọng
                </p>
                <pre className="whitespace-pre-wrap">{c.practice.expectedOutput}</pre>
              </div>
            </div>

            {/* Progressive Hints & Solution (Never visible until explicitly requested!) */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {revealedHints < c.practice.hints.length && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setRevealedHints((h) => h + 1)}
                >
                  <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                  Xem gợi ý ({revealedHints}/{c.practice.hints.length})
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowSolution(!showSolution)}
              >
                <Eye className="h-3.5 w-3.5" />
                {showSolution ? "Ẩn đáp án tham khảo" : "Chủ động xem đáp án tham khảo"}
              </Button>
            </div>

            {revealedHints > 0 && (
              <div className="space-y-1.5">
                {c.practice.hints.slice(0, revealedHints).map((hint, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-3.5 py-2 text-xs text-amber-800 dark:text-amber-200"
                  >
                    <strong>Gợi ý {i + 1}:</strong> {hint}
                  </div>
                ))}
              </div>
            )}

            {showSolution && (
              <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
                <div className="flex items-center justify-between border-b border-slate-800 px-3 py-1.5 text-[11px] text-slate-400">
                  <span>Đáp án tham khảo</span>
                  <button
                    onClick={() => {
                      setCode(c.practice.solutionCode);
                      toast({ title: "Đã nạp đáp án tham khảo vào Editor", variant: "info" });
                    }}
                    className="text-blue-400 hover:underline cursor-pointer"
                  >
                    Nạp vào Editor
                  </button>
                </div>
                <pre className="overflow-x-auto p-3.5 font-mono text-xs text-emerald-300">
                  <code>{c.practice.solutionCode}</code>
                </pre>
              </div>
            )}
          </section>

          {/* Step 8: Inline Checkpoint Knowledge Check */}
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-5 space-y-3.5">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-indigo-500" /> Kiểm tra kiến thức nhanh
            </h2>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
              <InlineRichText text={c.checkpointQuiz.question} />
            </p>
            {c.checkpointQuiz.codeSnippet && (
              <pre className="overflow-x-auto rounded-xl bg-slate-950 p-3 font-mono text-xs text-slate-100">
                <code>{c.checkpointQuiz.codeSnippet}</code>
              </pre>
            )}
            <div className="space-y-2">
              {c.checkpointQuiz.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedOption(idx);
                    setCheckpointResult(null);
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left text-xs sm:text-sm transition-colors cursor-pointer ${
                    selectedOption === idx
                      ? "border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-300 font-semibold"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-blue-500/40"
                  }`}
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current text-[11px] font-bold">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span>{opt}</span>
                </button>
              ))}
            </div>
            <Button
              size="sm"
              variant="primary"
              disabled={selectedOption === null}
              loading={checkingQuiz}
              onClick={handleVerifyCheckpoint}
            >
              Kiểm tra đáp án
            </Button>

            {checkpointResult && (
              <div
                className={`rounded-xl border p-3.5 text-xs leading-relaxed ${
                  checkpointResult.correct
                    ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
                    : "border-rose-500/35 bg-rose-500/10 text-rose-800 dark:text-rose-200"
                }`}
              >
                <p className="font-bold mb-1">
                  {checkpointResult.correct ? "Chính xác! Bạn đã hiểu chắc kiến thức này." : "Chưa chính xác — hãy xem giải thích bên dưới:"}
                </p>
                <p>{checkpointResult.explanation}</p>
              </div>
            )}
          </section>

          {/* Step 9: Summary & Complete Lesson */}
          <section className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Tổng kết bài học
            </h2>
            <ul className="space-y-1.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              {c.takeaways.map((t, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-emerald-500/20">
              <Button
                variant={lessonStatus === "completed" ? "secondary" : "success"}
                loading={completing}
                onClick={handleCompleteLesson}
              >
                <CheckCircle2 className="h-4 w-4" />
                {lessonStatus === "completed"
                  ? "Bài học đã hoàn thành"
                  : `Hoàn thành bài học (+${lesson.xp_reward} XP)`}
              </Button>
              {navigation.next && (
                <Link href={`/courses/${slug}/lessons/${navigation.next.slug}`}>
                  <Button variant="primary">
                    Bài tiếp theo <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>
          </section>
        </div>

        {/* Desktop Resizable Horizontal Splitter */}
        <div
          onPointerDown={() => {
            draggingSplitRef.current = true;
            document.body.style.cursor = "col-resize";
          }}
          className="hidden lg:flex w-2.5 shrink-0 cursor-col-resize items-center justify-center border-x border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 hover:bg-blue-500/25 transition-colors"
          title="Kéo trái/phải để thay đổi tỷ lệ khung bài học & Editor"
        >
          <GripVertical className="h-4 w-4 text-slate-400" />
        </div>

        {/* RIGHT PANE: Monaco Code Editor & Execution Sandbox */}
        <div className="h-[620px] lg:h-full lg:min-h-0 min-w-0 overflow-hidden">
          <CodePlayground
            code={code}
            onChange={setCode}
            defaultCode={c.practice.starterCode}
            language={lesson.language}
            storageKey={lessonStorageKey}
            initialStdin={stdin}
            onSave={handleSaveCode}
            saving={saving}
            onOpenAiTutor={() => setAiOpen(true)}
            onErrorContextChange={setErrorContext}
            onExecutionContextChange={setExecutionContext}
          />
        </div>
      </div>

      {/* Course Syllabus Drawer */}
      {syllabusOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={() => setSyllabusOpen(false)} />
          <div className="relative z-10 flex h-full w-80 max-w-full flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1424]">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 p-4">
              <div>
                <p className="text-[11px] font-bold uppercase text-blue-500">Mục lục khóa học</p>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                  {lesson.course_title}
                </h3>
              </div>
              <button onClick={() => setSyllabusOpen(false)} className="cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {navigation.syllabus.map((item) => {
                const isCurrent = item.slug === lesson.slug;
                return (
                  <Link
                    key={item.id}
                    href={`/courses/${slug}/lessons/${item.slug}`}
                    onClick={() => setSyllabusOpen(false)}
                    className={`flex items-start gap-2.5 rounded-xl px-3 py-2.5 text-xs transition-colors ${
                      isCurrent
                        ? "bg-blue-600/15 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/25"
                        : "hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {item.status === "completed" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-500 truncate">{item.section_title}</p>
                      <p className="leading-snug">{item.title}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Contextual AI Coding Tutor Slide-over Drawer */}
      <AiTutorDrawer
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        courseId={lesson.course_id}
        lessonId={lesson.id}
        language={lesson.language}
        contextTitle={`${lesson.section_title} — ${lesson.title}`}
        currentCode={code}
        problemContext={{
          title: c.practice.title,
          statement: c.practice.prompt,
          sampleInput: c.practice.sampleInput,
          sampleOutput: c.practice.expectedOutput,
          hints: c.practice.hints,
        }}
        executionContext={executionContext}
        errorContext={errorContext}
      />

      {/* Bug Report Modal */}
      {bugModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/60" onClick={() => setBugModalOpen(false)} />
          <Card className="relative z-10 w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Flag className="h-4 w-4 text-rose-500" /> Báo lỗi nội dung bài học
              </h3>
              <button onClick={() => setBugModalOpen(false)} className="cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSubmitBug} className="space-y-3">
              <p className="text-xs text-slate-500">
                Bài học: <strong>{lesson.title}</strong>
              </p>
              <textarea
                required
                minLength={10}
                rows={4}
                value={bugDesc}
                onChange={(e) => setBugDesc(e.target.value)}
                placeholder="Mô tả lỗi chính tả, ví dụ code hoặc đề xuất cải thiện..."
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-sm outline-none focus:border-blue-500"
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setBugModalOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit" size="sm" loading={submittingBug}>
                  Gửi báo lỗi
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
