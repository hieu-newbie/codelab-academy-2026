"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Bot,
  CheckCircle2,
  ClipboardCheck,
  Code2,
  Cpu,
  Flame,
  Globe,
  Layers,
  Moon,
  Palette,
  Play,
  Shield,
  Sparkles,
  Sun,
  Terminal,
  Trophy,
} from "lucide-react";
import { useAuth, useTheme } from "@/components/providers";
import { PwaInstallButton } from "@/components/pwa/PwaInstallProvider";
import { Badge, Button, Card } from "@/components/ui/primitives";

const SAMPLE_TABS = {
  cpp: {
    label: "C++17",
    filename: "main.cpp",
    code: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    vector<int> scores = {85, 92, 78, 96, 88};
    int best = scores[0];
    for (int s : scores) {
        if (s > best) best = s;
    }
    cout << "Diem cao nhat: " << best << "\\n";
    return 0;
}`,
    output: "Diem cao nhat: 96",
    note: "Biên dịch & chạy ngay bằng Clang WebAssembly (hoặc Judge0)",
  },
  html: {
    label: "HTML5 & CSS3",
    filename: "card.html",
    code: `<article class="badge-card">
  <span class="tag">Lộ trình Web</span>
  <h2>Xây dựng giao diện chuẩn Semantic</h2>
  <p>Xem trực tiếp kết quả hiển thị ngay khi bạn gõ code!</p>
</article>`,
    output: "Live Preview trực tiếp trên trình duyệt — 0 độ trễ",
    note: "Chạy thật trong iframe sandbox an toàn",
  },
  js: {
    label: "JavaScript ES6+",
    filename: "analytics.js",
    code: `const lessons = [
  { title: "Biến & Kiểu dữ liệu", xp: 60, done: true },
  { title: "Vòng lặp & Mảng", xp: 75, done: true },
  { title: "Con trỏ & STL", xp: 90, done: false }
];

const earnedXP = lessons
  .filter((l) => l.done)
  .reduce((sum, l) => sum + l.xp, 0);

console.log(\`XP đã tích lũy: \${earnedXP} XP\`);`,
    output: "XP đã tích lũy: 135 XP",
    note: "Thực thi JavaScript chuẩn ES6+ trong sandbox cô lập",
  },
} as const;

export default function LandingPage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<keyof typeof SAMPLE_TABS>("cpp");
  const sample = SAMPLE_TABS[activeTab];

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#090e1a] text-slate-900 dark:text-slate-100">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/85 dark:bg-[#090e1a]/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/25">
              <Code2 className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <span className="text-lg font-extrabold tracking-tight">
                CODE<span className="text-blue-600 dark:text-blue-400">LAB</span>
              </span>
              <span className="block text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                Interactive Coding Academy
              </span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-5 text-sm font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
            <Link href="/courses" className="whitespace-nowrap hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Khóa học
            </Link>
            <Link href="/challenges" className="whitespace-nowrap hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Luyện giải thuật
            </Link>
            <Link href="/playground" className="whitespace-nowrap hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Tự code
            </Link>
            <Link href="/quizzes" className="whitespace-nowrap hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Kiểm tra Quiz
            </Link>
            <Link href="/ai-tutor" className="whitespace-nowrap hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Gia sư AI
            </Link>
            <Link href="/leaderboard" className="whitespace-nowrap hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              Bảng xếp hạng
            </Link>
          </nav>

          <div className="flex items-center gap-2.5">
            <PwaInstallButton compact />
            <button
              onClick={toggleTheme}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              aria-label="Chuyển giao diện Sáng / Tối"
            >
              {theme === "dark" ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
            </button>
            {user ? (
              <Link href="/dashboard">
                <Button variant="primary" size="sm">
                  Vào Dashboard <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">Đăng nhập</Button>
                </Link>
                <Link href="/register">
                  <Button variant="primary" size="sm">Bắt đầu học miễn phí</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(59,130,246,0.14),transparent_60%)]" />
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-14 sm:px-6 lg:grid-cols-12 lg:items-center lg:py-20">
          <div className="lg:col-span-6 space-y-6">
            <Badge className="border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 px-3 py-1">
              <Sparkles className="h-3.5 w-3.5" /> Nền tảng học lập trình tương tác chuẩn thực chiến
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.12] text-slate-900 dark:text-white">
              Học lập trình từ <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">con số 0</span> bằng cách viết code thật mỗi ngày
            </h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
              CODELAB kết hợp lộ trình bài học 9 bước chuyên sâu (C++, HTML, CSS, JavaScript), trình soạn thảo Monaco Editor, Sandbox tự code tự do không cần bài tập, biên dịch C++17 (<code className="font-mono text-sm">&lt;bits/stdc++.h&gt;</code>) bằng Clang WebAssembly và Gia sư Lập trình AI đồng hành 24/7.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link href={user ? "/dashboard" : "/register"}>
                <Button size="lg" variant="primary">
                  {user ? "Tiếp tục học ngay" : "Tạo tài khoản miễn phí"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/playground">
                <Button size="lg" variant="secondary">
                  <Terminal className="h-4 w-4 text-emerald-500" /> Tự code ngay (Sandbox)
                </Button>
              </Link>
              <Link href="/courses">
                <Button size="lg" variant="outline">
                  <BookOpen className="h-4 w-4" /> Khám phá 4 lộ trình học
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200 dark:border-slate-800 max-w-md">
              <div>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white">18</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Chương C++ đầy đủ</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white">12+</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Bài tập giải thuật</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white">9 bước</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Mỗi bài học tương tác</p>
              </div>
            </div>
          </div>

          {/* Interactive IDE Preview Card */}
          <div className="lg:col-span-6">
            <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-[#0d1322] shadow-2xl shadow-blue-950/25">
              <div className="flex items-center justify-between border-b border-slate-800 bg-[#11192e] px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-rose-500/80" />
                  <span className="h-3 w-3 rounded-full bg-amber-400/80" />
                  <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 font-mono text-xs text-slate-400">{sample.filename}</span>
                </div>
                <div className="flex items-center gap-1 rounded-lg bg-slate-900/90 p-1">
                  {(Object.keys(SAMPLE_TABS) as Array<keyof typeof SAMPLE_TABS>).map((k) => (
                    <button
                      key={k}
                      onClick={() => setActiveTab(k)}
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                        activeTab === k
                          ? "bg-blue-600 text-white"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {SAMPLE_TABS[k].label}
                    </button>
                  ))}
                </div>
              </div>

              <pre className="overflow-x-auto p-5 font-mono text-xs sm:text-[13px] leading-relaxed text-slate-100">
                <code>{sample.code}</code>
              </pre>

              <div className="border-t border-slate-800 bg-[#080d18] px-5 py-3.5">
                <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <Play className="h-3 w-3 fill-current" /> Output minh họa
                  </span>
                  <span className="text-slate-500">{sample.note}</span>
                </div>
                <div className="font-mono text-xs text-emerald-300">{sample.output}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Core Tracks */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
              Thư viện khóa học trọng tâm
            </p>
            <h2 className="mt-1.5 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              4 lộ trình bài bản từ nền tảng đến thực chiến
            </h2>
          </div>
          <Link href="/courses">
            <Button variant="outline" size="sm">
              Xem toàn bộ khóa học <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              slug: "cpp-programming",
              icon: Cpu,
              accent: "text-blue-500 bg-blue-500/10 border-blue-500/25",
              title: "C++ Programming",
              meta: "18 chương · 36 giờ · Đầy đủ từ con số 0",
              desc: "Biến, vòng lặp, mảng 1-2 chiều, chuỗi, hàm, con trỏ, Struct, Vector, đệ quy, thuật toán & OOP.",
            },
            {
              slug: "html-fundamentals",
              icon: Globe,
              accent: "text-orange-500 bg-orange-500/10 border-orange-500/25",
              title: "HTML5 Chuẩn Ngữ Nghĩa",
              meta: "10 chương · 12 giờ · Live Preview",
              desc: "Cấu trúc trang web, văn bản, danh sách, bảng biểu, Form validation và Semantic HTML tối ưu SEO.",
            },
            {
              slug: "css-modern-layout",
              icon: Palette,
              accent: "text-cyan-500 bg-cyan-500/10 border-cyan-500/25",
              title: "CSS3 & Bố cục Hiện đại",
              meta: "12 chương · 18 giờ · Live Preview",
              desc: "Bộ chọn, Box Model, Position, Flexbox, CSS Grid, Responsive Design và Animation mượt mà.",
            },
            {
              slug: "javascript-interactive",
              icon: Sparkles,
              accent: "text-amber-500 bg-amber-500/10 border-amber-500/25",
              title: "JavaScript Tương tác",
              meta: "12 chương · 24 giờ · Console Sandbox",
              desc: "ES6+, mảng & Object (map/filter/reduce), DOM, Event, JSON, Async/Await và Fetch API.",
            },
          ].map((track) => {
            const Icon = track.icon;
            return (
              <Link key={track.slug} href={`/courses/${track.slug}`} className="group">
                <Card className="h-full p-5 transition-all hover:border-blue-500/50 hover:-translate-y-0.5">
                  <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border ${track.accent}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {track.title}
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{track.meta}</p>
                  <p className="mt-2.5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {track.desc}
                  </p>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Platform Pillars */}
      <section className="border-t border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-[#0d1424]/70">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold">
              Mọi công cụ cần thiết trong một không gian học tập duy nhất
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400">
              Được kiến trúc cho triển khai thực tế: lưu tiến độ theo từng tài khoản, chấm bài sandbox an toàn và xác nhận XP hoàn toàn phía máy chủ.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {[
              {
                icon: Layers,
                title: "Bài học tương tác 9 bước",
                desc: "Lý thuyết sâu sắc, giải thích thuật ngữ mới, ví dụ phân tích từng dòng code, lỗi thường gặp, sơ đồ trực quan và bài tập ngay trong bài.",
              },
              {
                icon: Terminal,
                title: "Monaco Editor & Judge0 Sandbox",
                desc: "Trình soạn thảo chuẩn VS Code chia cột kéo giãn được, lưu code cá nhân, hỗ trợ stdin/stdout và chấm test case tự động qua Judge0.",
              },
              {
                icon: Bot,
                title: "Gia sư Lập trình AI cá nhân hóa",
                desc: "Tự nhận diện khóa học và bài học hiện tại để giải thích đúng trình độ, phân tích lỗi code và gợi ý từng bước không làm mất tư duy.",
              },
              {
                icon: ClipboardCheck,
                title: "Quiz 6 dạng câu hỏi & Phân tích điểm yếu",
                desc: "Trắc nghiệm đơn/đa đáp án, Đúng/Sai, Điền khuyết, Dự đoán output, Tìm lỗi code — tự chấm điểm và thống kê chủ đề cần ôn lại.",
              },
              {
                icon: Trophy,
                title: "Gamification chống gian lận",
                desc: "XP, cấp độ, chuỗi Streak, bảng xếp hạng và huy hiệu (First Code, Bug Hunter, Problem Solver, Consistency, Master) do backend xác thực.",
              },
              {
                icon: Shield,
                title: "Quản trị CMS & Phân quyền chặt chẽ",
                desc: "Admin Dashboard riêng biệt cho phép biên tập bài học, quản lý bài tập/test case, câu hỏi quiz và xử lý báo lỗi mà không cần sửa code.",
              },
            ].map((feat) => {
              const Icon = feat.icon;
              return (
                <Card key={feat.title} className="p-5">
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{feat.title}</h3>
                  <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {feat.desc}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300">
            <Flame className="h-4 w-4 text-orange-500" />
            CODELAB – Interactive Coding Academy
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Tiếng Việt · Next.js + Monaco + Judge0 + Gemini AI
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
