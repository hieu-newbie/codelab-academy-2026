"use client";

import React from "react";
import { AlertTriangle, Inbox, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const variants = {
    primary:
      "bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-600/20 border border-blue-500/30",
    secondary:
      "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700",
    outline:
      "bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700",
    ghost:
      "bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-300",
    danger:
      "bg-rose-600 hover:bg-rose-500 text-white border border-rose-500/30",
    success:
      "bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/20 border border-emerald-500/30",
  };
  const sizes = {
    sm: "h-8 px-3 text-xs rounded-lg gap-1.5",
    md: "h-10 px-4 text-sm rounded-xl gap-2",
    lg: "h-11 px-5 text-sm rounded-xl gap-2",
  };

  return (
    <button
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-semibold transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm shadow-slate-900/5",
        className
      )}
    >
      {children}
    </div>
  );
}

export function Badge({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        className
      )}
    >
      {children}
    </span>
  );
}

export function ProgressBar({
  value,
  className,
  barClassName,
}: {
  value: number;
  className?: string;
  barClassName?: string;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      className={cn(
        "h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800",
        className
      )}
    >
      <div
        className={cn(
          "h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-500",
          barClassName
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

export function LoadingState({ message = "Đang tải dữ liệu..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500 mb-3">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{message}</p>
    </div>
  );
}

export function ErrorState({
  title = "Không thể tải dữ liệu",
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <Card className="p-8 text-center max-w-lg mx-auto my-10">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-500">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
      <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} className="mt-4">
          <RefreshCw className="h-3.5 w-3.5" /> Thử lại
        </Button>
      )}
    </Card>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-900/40 px-6 py-12 text-center">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-200/70 dark:bg-slate-800 text-slate-500">
        <Inbox className="h-5 w-5" />
      </div>
      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</h3>
      <p className="mt-1 max-w-md text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/**
 * Lightweight safe Markdown + Code Block renderer for AI Tutor & Exercise descriptions.
 */
export function SimpleMarkdown({ content }: { content: string }) {
  const parts = content.split(/(```[\s\S]*?```)/g);
  return (
    <div className="space-y-2.5 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
      {parts.map((part, idx) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          const lines = part.slice(3, -3).split("\n");
          const lang = lines[0]?.trim() || "";
          const code = (lang && !lang.includes(" ") ? lines.slice(1) : lines).join("\n").trim();
          return (
            <div
              key={idx}
              className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-950 text-slate-100"
            >
              {lang && !lang.includes(" ") && (
                <div className="border-b border-slate-800 bg-slate-900/90 px-3 py-1 text-[11px] font-mono uppercase tracking-wider text-slate-400">
                  {lang}
                </div>
              )}
              <pre className="overflow-x-auto p-3.5 text-xs font-mono leading-relaxed">
                <code>{code}</code>
              </pre>
            </div>
          );
        }

        const lines = part.split("\n");
        const blocks: React.ReactNode[] = [];
        let listBuffer: Array<{ ordered: boolean; text: string }> = [];

        const flushList = (keyPrefix: string) => {
          if (listBuffer.length === 0) return;
          const ordered = listBuffer[0].ordered;
          const items = listBuffer;
          listBuffer = [];
          if (ordered) {
            blocks.push(
              <ol key={`${keyPrefix}-ol-${blocks.length}`} className="list-decimal list-inside space-y-1 pl-1">
                {items.map((it, li) => (
                  <li key={li}>{renderInlineCodeAndBold(it.text)}</li>
                ))}
              </ol>
            );
          } else {
            blocks.push(
              <ul key={`${keyPrefix}-ul-${blocks.length}`} className="list-disc list-inside space-y-1 pl-1">
                {items.map((it, li) => (
                  <li key={li}>{renderInlineCodeAndBold(it.text)}</li>
                ))}
              </ul>
            );
          }
        };

        lines.forEach((rawLine, lIdx) => {
          const trimmed = rawLine.trim();
          if (!trimmed) {
            flushList(`${idx}-${lIdx}`);
            return;
          }

          const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
          if (headingMatch) {
            flushList(`${idx}-${lIdx}`);
            const level = headingMatch[1].length;
            const cls =
              level === 1
                ? "text-base font-extrabold text-slate-900 dark:text-white pt-1"
                : level === 2
                ? "text-[15px] font-bold text-slate-900 dark:text-white pt-1"
                : "text-sm font-bold text-blue-700 dark:text-blue-300 pt-1";
            blocks.push(
              <h4 key={`${idx}-h-${lIdx}`} className={cls}>
                {renderInlineCodeAndBold(headingMatch[2])}
              </h4>
            );
            return;
          }

          if (trimmed.startsWith("> ")) {
            flushList(`${idx}-${lIdx}`);
            blocks.push(
              <blockquote
                key={`${idx}-bq-${lIdx}`}
                className="border-l-2 border-blue-500/60 bg-blue-500/5 rounded-r-lg px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300"
              >
                {renderInlineCodeAndBold(trimmed.slice(2))}
              </blockquote>
            );
            return;
          }

          const ulMatch = trimmed.match(/^[-*]\s+(.+)$/);
          if (ulMatch) {
            if (listBuffer.length > 0 && listBuffer[0].ordered) flushList(`${idx}-${lIdx}`);
            listBuffer.push({ ordered: false, text: ulMatch[1] });
            return;
          }

          const olMatch = trimmed.match(/^\d+\.\s+(.+)$/);
          if (olMatch) {
            if (listBuffer.length > 0 && !listBuffer[0].ordered) flushList(`${idx}-${lIdx}`);
            listBuffer.push({ ordered: true, text: olMatch[1] });
            return;
          }

          flushList(`${idx}-${lIdx}`);
          blocks.push(
            <p key={`${idx}-p-${lIdx}`} className="whitespace-pre-wrap">
              {renderInlineCodeAndBold(trimmed)}
            </p>
          );
        });
        flushList(`${idx}-end`);

        return <React.Fragment key={idx}>{blocks}</React.Fragment>;
      })}
    </div>
  );
}

export function InlineRichText({ text }: { text: string }) {
  return <>{renderInlineCodeAndBold(text)}</>;
}

function renderInlineCodeOnly(text: string): React.ReactNode[] {
  const tokens = text.split(/(`[^`]+`)/g);
  return tokens.map((tok, i) => {
    if (tok.startsWith("`") && tok.endsWith("`") && tok.length > 2) {
      return (
        <code
          key={i}
          className="rounded-md bg-slate-200/80 dark:bg-slate-800 px-1.5 py-0.5 font-mono text-[12px] font-normal text-blue-700 dark:text-blue-300"
        >
          {tok.slice(1, -1)}
        </code>
      );
    }
    return <React.Fragment key={i}>{tok}</React.Fragment>;
  });
}

function renderInlineCodeAndBold(text: string): React.ReactNode[] {
  const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*\n]+\*)/g);
  return tokens.map((tok, i) => {
    if (tok.startsWith("`") && tok.endsWith("`") && tok.length > 2) {
      return (
        <code
          key={i}
          className="rounded-md bg-slate-200/80 dark:bg-slate-800 px-1.5 py-0.5 font-mono text-[12px] text-blue-700 dark:text-blue-300"
        >
          {tok.slice(1, -1)}
        </code>
      );
    }
    if (tok.startsWith("**") && tok.endsWith("**") && tok.length > 4) {
      return (
        <strong key={i} className="font-semibold text-slate-900 dark:text-white">
          {renderInlineCodeOnly(tok.slice(2, -2))}
        </strong>
      );
    }
    if (tok.startsWith("*") && tok.endsWith("*") && tok.length > 2) {
      return (
        <em key={i} className="italic text-slate-600 dark:text-slate-300">
          {renderInlineCodeOnly(tok.slice(1, -1))}
        </em>
      );
    }
    return <React.Fragment key={i}>{tok}</React.Fragment>;
  });
}
