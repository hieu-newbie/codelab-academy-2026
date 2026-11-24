"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  Bot,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Code2,
  Flame,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  ShieldCheck,
  Sun,
  Terminal,
  Trophy,
  User,
  X,
  Zap,
} from "lucide-react";
import { useAuth, useTheme, useToast } from "@/components/providers";
import { PwaInstallButton } from "@/components/pwa/PwaInstallProvider";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/primitives";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/courses", label: "Khóa học", icon: BookOpen },
  { href: "/challenges", label: "Luyện tập Code", icon: Terminal },
  { href: "/playground", label: "Tự code (Sandbox)", icon: Code2 },
  { href: "/quizzes", label: "Kiểm tra Quiz", icon: ClipboardCheck },
  { href: "/ai-tutor", label: "Gia sư AI", icon: Bot },
  { href: "/leaderboard", label: "Bảng xếp hạng", icon: Trophy },
  { href: "/profile", label: "Hồ sơ cá nhân", icon: User },
];

export function AppShell({
  children,
  fullBleed = false,
}: {
  children: React.ReactNode;
  fullBleed?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast({ title: "Đã đăng xuất", description: "Hẹn gặp lại bạn ở buổi học tiếp theo!", variant: "info" });
    router.push("/login");
  };

  const navItems = user?.role === "admin"
    ? [...NAV_ITEMS, { href: "/admin", label: "Quản trị hệ thống", icon: ShieldCheck }]
    : NAV_ITEMS;

  return (
    <div
      className={cn(
        "min-h-screen flex flex-col bg-[#f8fafc] dark:bg-[#090e1a] text-slate-900 dark:text-slate-100",
        fullBleed && "lg:h-screen lg:overflow-hidden"
      )}
    >
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 h-15 border-b border-slate-200/90 dark:border-slate-800/90 bg-white/90 dark:bg-[#0d1424]/90 backdrop-blur-md">
        <div className="flex h-full items-center justify-between px-3 sm:px-5 gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
              aria-label="Mở menu điều hướng"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2.5 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/25">
                <Code2 className="h-5 w-5" />
              </div>
              <div className="leading-tight">
                <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                  CODE<span className="text-blue-600 dark:text-blue-400">LAB</span>
                </span>
                <span className="hidden sm:block text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Interactive Academy
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {user && (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-600 dark:text-amber-400"
                  title="Điểm kinh nghiệm tích lũy"
                >
                  <Zap className="h-3.5 w-3.5 fill-current" />
                  {user.xp.toLocaleString("vi-VN")} XP · Lv.{user.level}
                </Link>
              </div>
            )}

            <PwaInstallButton compact />

            <button
              onClick={toggleTheme}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={theme === "dark" ? "Chuyển sang Light Mode" : "Chuyển sang Dark Mode"}
              aria-label="Chuyển đổi giao diện Sáng / Tối"
            >
              {theme === "dark" ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
            </button>

            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/profile"
                  className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 px-2.5 py-1.5 hover:border-blue-500/40 transition-colors"
                >
                  {user.avatar_url ? (
                    <Image
                      src={user.avatar_url}
                      alt={user.full_name}
                      width={24}
                      height={24}
                      unoptimized
                      className="h-6 w-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
                      {user.full_name.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <span className="hidden sm:inline max-w-[130px] truncate text-xs font-semibold">
                    {user.full_name}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-rose-500 hover:border-rose-500/30 transition-colors cursor-pointer"
                  title="Đăng xuất"
                  aria-label="Đăng xuất"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">Đăng nhập</Button>
                </Link>
                <Link href="/register">
                  <Button variant="primary" size="sm">Đăng ký miễn phí</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Desktop Sidebar */}
        <aside
          className={cn(
            "hidden lg:flex flex-col shrink-0 border-r border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#0d1424] transition-all duration-200",
            collapsed ? "w-[72px]" : "w-60"
          )}
        >
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all",
                    active
                      ? "bg-blue-600/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-100 border border-transparent"
                  )}
                >
                  <Icon className={cn("h-4 w-4 shrink-0", active && "text-blue-500")} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </div>

          {/* Quick Motivation Card & Collapse Button */}
          <div className="border-t border-slate-200 dark:border-slate-800 p-3 space-y-2">
            {!collapsed && user && (
              <div className="rounded-xl bg-gradient-to-br from-blue-600/10 to-indigo-600/10 border border-blue-500/20 p-3">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400">
                  <Flame className="h-4 w-4 text-orange-500" />
                  Luyện code mỗi ngày
                </div>
                <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  Hoàn thành 1 bài học hoặc giải 1 bài tập hôm nay để giữ vững chuỗi streak!
                </p>
              </div>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 py-2 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <><ChevronLeft className="h-4 w-4" /> Thu gọn thanh bên</>}
            </button>
          </div>
        </aside>

        {/* Mobile Drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
              onClick={() => setMobileOpen(false)}
            />
            <div className="relative z-10 flex w-64 flex-col bg-white dark:bg-[#0d1424] border-r border-slate-200 dark:border-slate-800 p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-base font-extrabold">
                  CODE<span className="text-blue-500">LAB</span>
                </span>
                <button onClick={() => setMobileOpen(false)} aria-label="Đóng menu">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="space-y-1 flex-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold",
                        active
                          ? "bg-blue-600/10 text-blue-600 dark:text-blue-400"
                          : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                <PwaInstallButton />
              </div>
            </div>
          </div>
        )}

        {/* Main Viewport */}
        <main
          className={cn(
            "flex-1 min-w-0",
            fullBleed
              ? "flex flex-col min-h-0 overflow-hidden"
              : "p-4 sm:p-6 lg:p-8 max-w-[1440px] mx-auto w-full"
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
