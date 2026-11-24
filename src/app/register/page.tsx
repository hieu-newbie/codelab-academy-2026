"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, AtSign, Code2, Lock, Mail, User } from "lucide-react";
import { useAuth, useToast } from "@/components/providers";
import { Button, Card } from "@/components/ui/primitives";

export default function RegisterPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const { toast } = useToast();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPw) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          email,
          username: username.trim() || undefined,
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Đăng ký thất bại.");
        return;
      }

      await refreshUser();
      toast({
        title: "Đăng ký tài khoản thành công!",
        description: "Chào mừng bạn đến với CODELAB. Hãy bắt đầu bài học đầu tiên ngay!",
        variant: "success",
      });
      router.push("/dashboard");
    } catch {
      setError("Không thể kết nối máy chủ. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
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
            Tạo tài khoản CODELAB
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Mọi số liệu tiến độ, XP và chuỗi học tập đều được lưu riêng cho tài khoản của bạn
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
              <label htmlFor="fullName" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Họ và tên
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nguyễn Văn An"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div>
              <label htmlFor="username" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Username (tùy chọn)
              </label>
              <div className="relative">
                <AtSign className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="vanan_coder"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

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
                  placeholder="ban@example.com"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="confirmPw" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Xác nhận mật khẩu
                </label>
                <input
                  id="confirmPw"
                  type="password"
                  required
                  minLength={6}
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  placeholder="Nhập lại mật khẩu"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <Button type="submit" loading={submitting} className="w-full">
              Tạo tài khoản ngay <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        </Card>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          Đã có tài khoản?{" "}
          <Link href="/login" className="font-bold text-blue-600 dark:text-blue-400 hover:underline">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
