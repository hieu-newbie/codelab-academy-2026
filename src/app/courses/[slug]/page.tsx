"use client";

import React, { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookOpen,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  Clock,
  GraduationCap,
  Layers,
  Play,
  Users,
  Zap,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth, useToast } from "@/components/providers";
import {
  Badge,
  Button,
  Card,
  ErrorState,
  LoadingState,
  ProgressBar,
} from "@/components/ui/primitives";
import { difficultyBadgeClasses, languageBadgeClasses, languageLabel } from "@/lib/utils";
import type { CourseRecord, CourseSectionRecord } from "@/types/codelab";

interface CourseDetailResponse {
  course: CourseRecord;
  sections: CourseSectionRecord[];
  quizzes: Array<{
    id: string;
    slug: string;
    title: string;
    topic: string;
    difficulty: string;
    time_limit_minutes: number;
    xp_reward: number;
  }>;
}

export default function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const [data, setData] = useState<CourseDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCourse = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/courses/${slug}`, { cache: "no-store" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || "Không tìm thấy khóa học.");
        return;
      }
      setData(await res.json());
    } catch {
      setError("Lỗi tải thông tin khóa học.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    const t = setTimeout(() => loadCourse(), 0);
    return () => clearTimeout(t);
  }, [loadCourse]);

  const firstUnfinishedLesson = data?.sections
    .flatMap((s) => s.lessons ?? [])
    .find((l) => l.status !== "completed");
  const firstLesson = data?.sections.flatMap((s) => s.lessons ?? [])[0];
  const targetLesson = firstUnfinishedLesson ?? firstLesson;

  const handleStartCourse = async () => {
    if (!targetLesson) return;
    if (user && !data?.course.enrolled) {
      setEnrolling(true);
      try {
        await fetch(`/api/courses/${slug}`, { method: "POST" });
        toast({ title: "Đã tham gia khóa học!", variant: "success" });
      } finally {
        setEnrolling(false);
      }
    }
    router.push(`/courses/${slug}/lessons/${targetLesson.slug}`);
  };

  if (loading) {
    return (
      <AppShell>
        <LoadingState message="Đang tải lộ trình khóa học..." />
      </AppShell>
    );
  }

  if (error || !data) {
    return (
      <AppShell>
        <ErrorState message={error || "Không có dữ liệu khóa học."} onRetry={loadCourse} />
      </AppShell>
    );
  }

  const { course, sections, quizzes } = data;

  return (
    <AppShell>
      <div className="space-y-6 animate-fade-in">
        <Link
          href="/courses"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-500"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Quay lại Thư viện khóa học
        </Link>

        {/* Course Hero Card */}
        <Card className="p-6 sm:p-8 bg-gradient-to-br from-blue-600/10 via-transparent to-transparent">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={languageBadgeClasses(course.language)}>
                  {languageLabel(course.language)}
                </Badge>
                <Badge className={difficultyBadgeClasses(course.difficulty)}>
                  {course.difficulty}
                </Badge>
                <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                  <Layers className="h-3.5 w-3.5" /> {course.section_count} chương
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                  <BookOpen className="h-3.5 w-3.5" /> {course.lesson_count} bài học
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                  <Clock className="h-3.5 w-3.5" /> ~{course.estimated_hours} giờ
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                {course.title}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {course.description}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3">
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 p-4">
                  <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1.5">
                    <Users className="h-4 w-4 text-blue-500" /> Đối tượng phù hợp
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {course.target_audience}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 p-4">
                  <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1.5">
                    <GraduationCap className="h-4 w-4 text-emerald-500" /> Kiến thức đầu ra
                  </p>
                  <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                    {course.learning_outcomes.slice(0, 3).map((out, i) => (
                      <li key={i}>• {out}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                  <span>Tiến độ hoàn thành</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400">
                    {course.progress_percent ?? 0}%
                  </span>
                </div>
                <ProgressBar value={course.progress_percent ?? 0} />
                <p className="mt-1.5 text-xs text-slate-500">
                  {course.completed_lessons ?? 0} / {course.lesson_count ?? 0} bài học đã hoàn thành
                </p>
              </div>

              {targetLesson && (
                <Button
                  size="lg"
                  variant="primary"
                  className="w-full"
                  loading={enrolling}
                  onClick={handleStartCourse}
                >
                  <Play className="h-4 w-4 fill-current" />
                  {course.enrolled ? "Tiếp tục học ngay" : "Bắt đầu khóa học"}
                </Button>
              )}

              {!user && (
                <p className="text-[11px] text-slate-500 text-center">
                  <Link href="/login" className="text-blue-500 font-semibold hover:underline">
                    Đăng nhập
                  </Link>{" "}
                  để tự động lưu tiến độ, code thực hành và nhận XP!
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Course Sections & Lessons Tree */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-4">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Nội dung chi tiết ({sections.length} chương)
            </h2>

            {sections.map((section) => {
              const secLessons = section.lessons ?? [];
              return (
                <Card key={section.id} className="overflow-hidden">
                  <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 px-5 py-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {section.title}
                      </h3>
                      <span className="text-[11px] font-mono text-slate-500 shrink-0">
                        {secLessons.length} bài học
                      </span>
                    </div>
                    {section.description && (
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {section.description}
                      </p>
                    )}
                  </div>

                  {secLessons.length === 0 ? (
                    <div className="px-5 py-3 text-xs text-slate-500 italic">
                      Chương khung lộ trình — Quản trị viên có thể bổ sung bài học mới trực tiếp từ Admin Dashboard.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                      {secLessons.map((lesson) => (
                        <Link
                          key={lesson.id}
                          href={`/courses/${course.slug}/lessons/${lesson.slug}`}
                          className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-blue-500/5 transition-colors group"
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="mt-0.5 shrink-0">
                              {lesson.status === "completed" ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                              ) : lesson.status === "in_progress" ? (
                                <Play className="h-4 w-4 text-blue-500" />
                              ) : (
                                <Circle className="h-4 w-4 text-slate-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                {lesson.title}
                              </p>
                              <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">
                                {lesson.summary}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0 text-xs text-slate-500">
                            {lesson.bookmarked && (
                              <Bookmark className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                            )}
                            <span className="hidden sm:inline font-mono">
                              {lesson.estimated_minutes}p
                            </span>
                            <span className="inline-flex items-center gap-0.5 font-mono text-amber-600 dark:text-amber-400 font-semibold">
                              <Zap className="h-3 w-3" />+{lesson.xp_reward}
                            </span>
                            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-500" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Sidebar Quizzes & Practice CTA */}
          <div className="lg:col-span-4 space-y-4">
            <Card className="p-5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                <ClipboardCheck className="h-4 w-4 text-blue-500" /> Bài kiểm tra cuối chương
              </h3>
              {quizzes.length === 0 ? (
                <p className="text-xs text-slate-500">
                  Khám phá kho bài kiểm tra tổng hợp tại mục Kiểm tra Quiz.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {quizzes.map((qz) => (
                    <Link
                      key={qz.id}
                      href={`/quizzes/${qz.slug}`}
                      className="block rounded-xl border border-slate-200 dark:border-slate-800 p-3 hover:border-blue-500/40 transition-colors"
                    >
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{qz.title}</p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        {qz.time_limit_minutes} phút · +{qz.xp_reward} XP
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-5 bg-gradient-to-br from-indigo-500/10 to-blue-500/5 border-indigo-500/25">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">
                Luyện giải thuật đi kèm
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                Sau mỗi chương lý thuyết, hãy vào khu vực Coding Challenges để rèn phản xạ viết code vượt qua các test case ẩn.
              </p>
              <Link href="/challenges">
                <Button size="sm" variant="primary" className="w-full">
                  Mở khu vực Coding Challenges <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
