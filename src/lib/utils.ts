import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins} phút`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}g ${m}p` : `${h} giờ`;
}

export function formatRelativeDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function languageLabel(lang: string): string {
  switch (lang) {
    case "cpp":
      return "C++17";
    case "html":
      return "HTML5";
    case "css":
      return "CSS3";
    case "javascript":
      return "JavaScript";
    default:
      return lang.toUpperCase();
  }
}

export function languageBadgeClasses(lang: string): string {
  switch (lang) {
    case "cpp":
      return "bg-blue-500/15 text-blue-500 dark:text-blue-400 border-blue-500/25";
    case "html":
      return "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/25";
    case "css":
      return "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/25";
    case "javascript":
      return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25";
    default:
      return "bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-500/25";
  }
}

export function difficultyBadgeClasses(diff: string): string {
  switch (diff) {
    case "Easy":
    case "Cơ bản":
      return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25";
    case "Medium":
    case "Trung cấp":
      return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25";
    case "Hard":
    case "Nâng cao":
      return "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/25";
    default:
      return "bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-500/25";
  }
}
