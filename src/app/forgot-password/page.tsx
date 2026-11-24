"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Code2, KeyRound, Mail } from "lucide-react";
import { useToast } from "@/components/providers";
import { Button, Card } from "@/components/ui/primitives";

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [step, setStep] = useState<"request" | "confirm" | "done">("request");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [localTokenHint, setLocalTokenHint] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request", email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Không thể tạo yêu cầu khôi phục.");
        return;
      }
      setMessage(data.message);
      if (data.localResetToken) {
        setLocalTokenHint(data.localResetToken);
        setToken(data.localResetToken);
      }
      setStep("confirm");
    } catch {
      setError("Lỗi kết nối máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm", email, token, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Không thể đặt lại mật khẩu.");
        return;
      }
      toast({ title: "Đặt lại mật khẩu thành công!", variant: "success" });
      setStep("done");
    } catch {
      setError("Lỗi kết nối máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-[#090e1a] px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Code2 className="h-5 w-5" />
            </div>
            <span className="text-2xl font-extrabold">
              CODE<span className="text-blue-500">LAB</span>
            </span>
          </Link>
          <h1 className="mt-4 text-xl font-bold">Khôi phục mật khẩu</h1>
        </div>

        <Card className="p-6">
          {error && (
            <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-500">
              {error}
            </div>
          )}

          {step === "request" && (
            <form onSubmit={handleRequest} className="space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Nhập địa chỉ email đã đăng ký tài khoản CODELAB để nhận mã khôi phục mật khẩu có hiệu lực trong 15 phút.
              </p>
              <div>
                <label className="block text-xs font-semibold mb-1.5">Email tài khoản</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ban@codelab.vn"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-3.5 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <Button type="submit" loading={loading} className="w-full">
                Tạo mã khôi phục
              </Button>
            </form>
          )}

          {step === "confirm" && (
            <form onSubmit={handleConfirm} className="space-y-4">
              {message && (
                <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3 text-xs text-blue-600 dark:text-blue-300">
                  {message}
                  {localTokenHint && (
                    <div className="mt-2 font-mono text-sm font-bold text-slate-900 dark:text-white">
                      Mã local: {localTokenHint}
                    </div>
                  )}
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold mb-1.5">Mã xác thực</label>
                <input
                  type="text"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm font-mono outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5">Mật khẩu mới</label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-3.5 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <Button type="submit" loading={loading} className="w-full">
                Xác nhận mật khẩu mới
              </Button>
            </form>
          )}

          {step === "done" && (
            <div className="text-center space-y-4 py-2">
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                Mật khẩu của bạn đã được cập nhật thành công!
              </p>
              <Link href="/login">
                <Button className="w-full">Quay lại trang Đăng nhập</Button>
              </Link>
            </div>
          )}
        </Card>

        <div className="text-center">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-500">
            <ArrowLeft className="h-3.5 w-3.5" /> Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}
