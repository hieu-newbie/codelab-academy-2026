"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Code2, Eye, EyeOff, Lock, Mail, ShieldCheck, User } from "lucide-react";
import { useAuth, useToast } from "@/components/providers";
import { Button, Card } from "@/components/ui/primitives";

export default function LoginPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Đăng nhập thất bại.");
        return;
      }

      await refreshUser();
      toast({
        title: `Chào mừng trở lại, ${data.user.full_name}!`,
        description: "Chúc bạn một buổi học lập trình thật hiệu quả.",
        variant: "success",
      });
      router.push(data.user.role === "admin" ? "/admin" : "/dashboard");
    } catch {
      setError("Không thể kết nối tới máy chủ. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (demoEmail: string, demoPw: string) => {
    setEmail(demoEmail);
    setPassword(demoPw);
    setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-[#090e1a] px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/25">
              <Code2 className="h-5 w-5" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              CODE<span className="text-blue-600 dark:text-blue-400">LAB</span>
            </span>
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">
            Đăng nhập tài khoản
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Tiếp tục lộ trình lập trình và giữ vững chuỗi Streak của bạn
          </p>
        </div>

        <Card className="p-6 sm:p-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-xs font-medium text-rose-600 dark:text-rose-400">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ban@codelab.vn"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Mật khẩu
                </label>
                <Link href="/forgot-password" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                  Quên mật khẩu?
                </Link>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu của bạn"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-10 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label="Hiện/ẩn mật khẩu"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" loading={submitting} className="w-full">
              Đăng nhập <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          {/* Isolated Demo Accounts Helper */}
          <div className="mt-6 border-t border-slate-200 dark:border-slate-800 pt-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2.5">
              Tài khoản trải nghiệm Chế độ Demo (tách biệt)
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => fillDemo("demo@codelab.vn", "Demo@1234")}
                className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 px-3 py-2 text-left hover:border-blue-500/40 transition-colors cursor-pointer"
              >
                <User className="h-4 w-4 text-blue-500 shrink-0" />
                <div>
                  <p className="text-xs font-bold">Học viên Demo</p>
                  <p className="text-[10px] text-slate-500">demo@codelab.vn</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => fillDemo("admin@codelab.vn", "Admin@1234")}
                className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 px-3 py-2 text-left hover:border-indigo-500/40 transition-colors cursor-pointer"
              >
                <ShieldCheck className="h-4 w-4 text-indigo-500 shrink-0" />
                <div>
                  <p className="text-xs font-bold">Admin Demo</p>
                  <p className="text-[10px] text-slate-500">admin@codelab.vn</p>
                </div>
              </button>
            </div>
          </div>
        </Card>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          Chưa có tài khoản?{" "}
          <Link href="/register" className="font-bold text-blue-600 dark:text-blue-400 hover:underline">
            Đăng ký tài khoản mới
          </Link>
        </p>
      </div>
    </div>
  );
}
