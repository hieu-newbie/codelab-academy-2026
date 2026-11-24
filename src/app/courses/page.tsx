"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Clock,
  Cpu,
  Globe,
  Layers,
  Palette,
  Search,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  ProgressBar,
} from "@/components/ui/primitives";
import { difficultyBadgeClasses, languageBadgeClasses, languageLabel } from "@/lib/utils";
import type { CourseRecord } from "@/types/codelab";

function CourseIcon({ icon }: { icon: string }) {
  switch (icon) {
    case "cpu":
      return <Cpu className="h-5 w-5 text-blue-500" />;
    case "globe":
      return <Globe className="h-5 w-5 text-orange-500" />;
    case "palette":
      return <Palette className="h-5 w-5 text-cyan-500" />;
    default:
      return <Sparkles className="h-5 w-5 text-amber-500" />;
  }
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [langFilter, setLangFilter] = useState("all");
  const [search, setSearch] = useState("");

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/courses", { cache: "no-store" });
      if (!res.ok) throw new Error("Không thể tải danh sách khóa học.");
      const data = await res.json();
      setCourses(data.courses || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi tải khóa học.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => fetchCourses(), 0);
    return () => clearTimeout(t);
  }, []);

  const filtered = courses.filter((c) => {
    const matchLang = langFilter === "all" || c.language === langFilter;
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      c.title.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.language.includes(q);
    return matchLang && matchSearch;
  });

  return (
    <AppShell>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
              Thư viện khóa học CODELAB
            </p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Lộ trình học lập trình bài bản
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Chọn ngôn ngữ bạn muốn chinh phục — mỗi khóa đều có chương trình chi tiết, ví dụ thực tế, trình viết code trực tiếp và kiểm tra kiến thức.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm khóa học..."
                className="w-56 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-3 py-2 text-xs outline-none focus:border-blue-500"
              />
            </div>
            <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1">
              {[
                { key: "all", label: "Tất cả" },
                { key: "cpp", label: "C++" },
                { key: "html", label: "HTML" },
                { key: "css", label: "CSS" },
                { key: "javascript", label: "JS" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setLangFilter(tab.key)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold cursor-pointer ${
                    langFilter === tab.key
                      ? "bg-blue-600 text-white"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <LoadingState message="Đang tải thư viện khóa học..." />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchCourses} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Không tìm thấy khóa học phù hợp"
            description="Hãy thử bỏ bộ lọc hoặc tìm bằng từ khóa khác."
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filtered.map((course) => (
              <Card key={course.id} className="p-6 flex flex-col justify-between hover:border-blue-500/40 transition-all">
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                        <CourseIcon icon={course.icon} />
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={languageBadgeClasses(course.language)}>
                          {languageLabel(course.language)}
                        </Badge>
                        <Badge className={difficultyBadgeClasses(course.difficulty)}>
                          {course.difficulty}
                        </Badge>
                      </div>
                    </div>
                    {course.enrolled && (
                      <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        Đang học
                      </Badge>
                    )}
                  </div>

                  <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    {course.title}
                  </h2>
                  <p className="mt-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                    {course.subtitle}
                  </p>
                  <p className="mt-2.5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {course.description}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-blue-500" /> {course.section_count} chương
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-indigo-500" /> {course.lesson_count} bài học tương tác
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-amber-500" /> ~{course.estimated_hours} giờ
                    </span>
                  </div>

                  {course.learning_outcomes.length > 0 && (
                    <div className="mt-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 p-3.5">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                        Kiến thức đầu ra nổi bật
                      </p>
                      <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                        {course.learning_outcomes.slice(0, 3).map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-500">
                        Tiến độ: {course.completed_lessons ?? 0}/{course.lesson_count ?? 0} bài
                      </span>
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                        {course.progress_percent ?? 0}%
                      </span>
                    </div>
                    <ProgressBar value={course.progress_percent ?? 0} className="h-1.5" />
                  </div>

                  <Link href={`/courses/${course.slug}`} className="block">
                    <Button variant={course.enrolled ? "primary" : "secondary"} className="w-full">
                      {course.enrolled ? "Tiếp tục khóa học" : "Xem lộ trình & Bắt đầu học"}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
