"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Award, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { AiModeProvider } from "@/components/ai/AiModeProvider";
import { PwaInstallProvider } from "@/components/pwa/PwaInstallProvider";
import type { ThemeMode, UserProfile } from "@/types/codelab";

interface SystemStatus {
  database_mode: "supabase" | "sqlite_local";
  judge0_configured: boolean;
  ai_tutor_configured: boolean;
  ai_default_mode?: "gemini" | "offline";
  ai_offline_ready?: boolean;
  ai_provider: string | null;
}

interface AuthContextValue {
  user: UserProfile | null;
  systemStatus: SystemStatus | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  logout: () => Promise<void>;
}

interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (next: ThemeMode) => void;
  toggleTheme: () => void;
}

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant?: "success" | "error" | "info" | "achievement";
}

interface ToastContextValue {
  toast: (item: Omit<ToastItem, "id">) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const ThemeContext = createContext<ThemeContextValue | null>(null);
const ToastContext = createContext<ToastContextValue | null>(null);

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setThemeState] = useState<ThemeMode>("dark");
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const applyThemeDom = useCallback((mode: ThemeMode) => {
    const root = document.documentElement;
    if (mode === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    try {
      localStorage.setItem("codelab-theme", mode);
    } catch {
      // ignore storage quota errors
    }
  }, []);

  useEffect(() => {
    let initial: ThemeMode = "dark";
    try {
      const saved = localStorage.getItem("codelab-theme");
      if (saved === "light" || saved === "dark") initial = saved;
    } catch {
      // ignore
    }
    applyThemeDom(initial);
    const id = requestAnimationFrame(() => setThemeState(initial));
    return () => cancelAnimationFrame(id);
  }, [applyThemeDom]);

  const setTheme = useCallback(
    (next: ThemeMode) => {
      setThemeState(next);
      applyThemeDom(next);
      if (user) {
        fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ theme: next }),
        }).catch(() => {});
      }
    },
    [applyThemeDom, user]
  );

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = await res.json();
      setUser(data.user ?? null);
      setSystemStatus(data.system ?? null);
      if (data.user?.theme === "light" || data.user?.theme === "dark") {
        setThemeState(data.user.theme);
        applyThemeDom(data.user.theme);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [applyThemeDom]);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        setUser(data.user ?? null);
        setSystemStatus(data.system ?? null);
        if (data.user?.theme === "light" || data.user?.theme === "dark") {
          setThemeState(data.user.theme);
          applyThemeDom(data.user.theme);
        }
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [applyThemeDom]);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  }, []);

  const toast = useCallback((item: Omit<ToastItem, "id">) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev.slice(-3), { ...item, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <AuthContext.Provider value={{ user, systemStatus, loading, refreshUser, setUser, logout }}>
      <AiModeProvider>
        <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
          <ToastContext.Provider value={{ toast }}>
            <PwaInstallProvider>{children}</PwaInstallProvider>
          {/* Global Toast Portal */}
          <div
            aria-live="polite"
            className="fixed bottom-4 right-4 z-[100] flex max-w-sm flex-col gap-2.5 pointer-events-none"
          >
            {toasts.map((t) => (
              <div
                key={t.id}
                className="pointer-events-auto animate-fade-in flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 p-4 shadow-xl shadow-slate-950/15"
              >
                <div className="mt-0.5 shrink-0">
                  {t.variant === "success" && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                  {t.variant === "error" && <XCircle className="h-5 w-5 text-rose-500" />}
                  {t.variant === "achievement" && <Award className="h-5 w-5 text-amber-500" />}
                  {(!t.variant || t.variant === "info") && <Info className="h-5 w-5 text-blue-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t.title}</p>
                  {t.description && (
                    <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {t.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => dismissToast(t.id)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  aria-label="Đóng thông báo"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </ToastContext.Provider>
      </ThemeContext.Provider>
      </AiModeProvider>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AppProviders");
  return ctx;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside AppProviders");
  return ctx;
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside AppProviders");
  return ctx;
}
