"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AlertCircle, AlertTriangle, Bot, Bug, Loader2, Send, Sparkles, X } from "lucide-react";
import { useAuth } from "@/components/providers";
import { useAiMode } from "@/components/ai/AiModeProvider";
import { AiModeBadgePill, AiModeSettingsPanel } from "@/components/ai/AiModeSettingsPanel";
import { Badge, Button, SimpleMarkdown } from "@/components/ui/primitives";
import type { AiErrorContext, AiExecutionContext } from "@/components/editor/CodePlayground";
import type { TutorContext } from "@/lib/ai-tutor-shared";
import { generateOfflineTutorReply } from "@/lib/offline-tutor";
import { askWebLlmTutor } from "@/lib/webllm-tutor";

export interface AiProblemContext {
  title?: string;
  difficulty?: string;
  statement?: string;
  constraints?: string;
  sampleInput?: string;
  sampleOutput?: string;
  hints?: string[];
}

interface AiTutorDrawerProps {
  open: boolean;
  onClose: () => void;
  courseId?: string;
  lessonId?: string;
  exerciseId?: string;
  language?: string;
  contextTitle: string;
  currentCode: string;
  problemContext?: AiProblemContext | null;
  executionContext?: AiExecutionContext | null;
  errorContext?: AiErrorContext | null;
}

interface ChatItem {
  role: "user" | "assistant";
  content: string;
  providerLabel?: string;
  fallbackNotice?: string | null;
}

export function AiTutorDrawer({
  open,
  onClose,
  courseId,
  lessonId,
  exerciseId,
  language = "cpp",
  contextTitle,
  currentCode,
  problemContext = null,
  executionContext = null,
  errorContext = null,
}: AiTutorDrawerProps) {
  const { user } = useAuth();
  const { activeMode, preference, reportFallbackToOffline } = useAiMode();

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"explain" | "debug" | "hint" | "generate_practice">("explain");
  const [sending, setSending] = useState(false);

  if (!open) return null;

  const effectiveError: AiErrorContext | null =
    errorContext ||
    (executionContext &&
    executionContext.status !== "Idle" &&
    executionContext.status !== "Running" &&
    executionContext.status !== "Accepted"
      ? {
          status: executionContext.status,
          vietnameseSummary: executionContext.vietnameseSummary,
          compileOutput: executionContext.compileOutput,
          stderr: executionContext.stderr,
          failedSummary: executionContext.failedSummary,
        }
      : null);

  const buildTutorContext = (customMode: typeof mode): TutorContext => ({
    courseLanguage: language,
    exerciseTitle: problemContext?.title || contextTitle,
    exerciseDifficulty: problemContext?.difficulty || null,
    problemStatement: problemContext?.statement || null,
    problemConstraints: problemContext?.constraints || null,
    sampleInput: problemContext?.sampleInput || null,
    sampleOutput: problemContext?.sampleOutput || null,
    problemHints: problemContext?.hints || null,
    codeContext: currentCode.trim() || null,
    stdin: executionContext?.stdin ?? problemContext?.sampleInput ?? null,
    stdout: executionContext?.stdout ?? null,
    expectedOutput: executionContext?.expectedOutput ?? problemContext?.sampleOutput ?? null,
    executionStatus: executionContext?.status ?? effectiveError?.status ?? null,
    compileOutput: executionContext?.compileOutput ?? effectiveError?.compileOutput ?? null,
    stderr: executionContext?.stderr ?? effectiveError?.stderr ?? null,
    failedTestSummary: executionContext?.failedSummary ?? effectiveError?.failedSummary ?? null,
    mode: customMode,
  });

  const sendPrompt = async (promptText: string, customMode = mode) => {
    if (!promptText.trim() || sending) return;
    const historySnapshot = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, { role: "user", content: promptText }]);
    setInput("");
    setSending(true);

    const tutorCtx = buildTutorContext(customMode);

    try {
      // Path 1: In-browser WebLLM (WebGPU) — only when user explicitly enabled & loaded model
      if (activeMode === "webllm") {
        try {
          const webRes = await askWebLlmTutor({
            message: promptText,
            history: historySnapshot,
            context: tutorCtx,
          });
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: webRes.reply,
              providerLabel: webRes.provider,
            },
          ]);
          if (user) {
            fetch("/api/ai/chat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                conversationId,
                message: promptText,
                codeContext: currentCode.trim() || null,
                courseId,
                lessonId,
                exerciseId,
                mode: customMode,
                preferredMode: "webllm",
                clientGeneratedReply: webRes.reply,
                clientProviderLabel: webRes.provider,
              }),
            })
              .then((r) => r.json())
              .then((d) => {
                if (d?.conversationId) setConversationId(d.conversationId);
              })
              .catch(() => {});
          }
          return;
        } catch (err) {
          const reason = `Model WebLLM trong trình duyệt gặp lỗi (${
            err instanceof Error ? err.message : "lỗi WebGPU"
          }). Hệ thống đã tự động chuyển sang chế độ Gợi ý thông minh Offline.`;
          reportFallbackToOffline(reason);
          const offlineReply = generateOfflineTutorReply({
            message: promptText,
            history: historySnapshot,
            context: tutorCtx,
          });
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: offlineReply,
              providerLabel: "Gợi ý thông minh Offline",
              fallbackNotice: reason,
            },
          ]);
          return;
        }
      }

      // Path 2: Guest (not logged in) -> Smart Offline Tutor works immediately in browser
      if (!user) {
        const offlineReply = generateOfflineTutorReply({
          message: promptText,
          history: historySnapshot,
          context: tutorCtx,
        });
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: offlineReply,
            providerLabel: "Gợi ý thông minh Offline",
          },
        ]);
        return;
      }

      // Path 3: Server Provider (Gemini priority if GEMINI_API_KEY exists -> automatic Offline fallback)
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          message: promptText,
          codeContext: currentCode.trim() || null,
          stdin: tutorCtx.stdin,
          stdout: tutorCtx.stdout,
          expectedOutput: tutorCtx.expectedOutput,
          executionStatus: tutorCtx.executionStatus,
          compileOutput: tutorCtx.compileOutput,
          stderr: tutorCtx.stderr,
          failedTestSummary: tutorCtx.failedTestSummary,
          problemStatement: tutorCtx.problemStatement,
          problemConstraints: tutorCtx.problemConstraints,
          courseId,
          lessonId,
          exerciseId,
          mode: customMode,
          preferredMode: preference === "offline" ? "offline" : "auto",
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.conversationId) setConversationId(data.conversationId);

      if (data.fallbackUsed && data.fallbackReason) {
        reportFallbackToOffline(data.fallbackReason);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            data.assistantMessage?.content ||
            generateOfflineTutorReply({ message: promptText, context: tutorCtx }),
          providerLabel: data.provider || "Gợi ý thông minh Offline",
          fallbackNotice: data.fallbackUsed ? data.fallbackReason : null,
        },
      ]);
    } catch {
      const reason =
        "Mất kết nối mạng hoặc không thể liên hệ máy chủ AI. Hệ thống đã tự động chuyển sang chế độ Gợi ý thông minh Offline để bạn tiếp tục sửa bài.";
      reportFallbackToOffline(reason);
      const offlineReply = generateOfflineTutorReply({
        message: promptText,
        history: historySnapshot,
        context: tutorCtx,
      });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: offlineReply,
          providerLabel: "Gợi ý thông minh Offline (Cục bộ)",
          fallbackNotice: reason,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const hasInput = Boolean(executionContext?.stdin?.trim());
  const hasOutput = Boolean(executionContext?.stdout?.trim());

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs" onClick={onClose} />
      <div className="relative z-10 flex h-full w-full max-w-lg flex-col border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1424] shadow-2xl">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-4 py-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Bot className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">Gia sư Lập trình AI</h3>
                <AiModeBadgePill />
              </div>
              <p className="text-[11px] text-slate-500 truncate">Ngữ cảnh: {contextTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            aria-label="Đóng Gia sư AI"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Mode Switcher + Free Google AI Studio Key Guide + WebLLM Opt-in */}
        <AiModeSettingsPanel compact />

        {/* Rich Attached Context Pill (Đề bài + Code + Input + Output + Lỗi) */}
        <div className="border-b border-slate-200 dark:border-slate-800 px-4 py-2 bg-white dark:bg-[#0b1120] text-[11px] space-y-1.5">
          <div className="flex flex-wrap items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <span className="font-semibold">Tự động gửi kèm:</span>
            {problemContext && (
              <Badge className="border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 text-[10px]">
                Đề bài
              </Badge>
            )}
            <Badge className="border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-300 text-[10px]">
              Code ({currentCode.split("\n").length} dòng)
            </Badge>
            {hasInput && (
              <Badge className="border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px]">
                Input
              </Badge>
            )}
            {hasOutput && (
              <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 text-[10px]">
                Output
              </Badge>
            )}
            {effectiveError && (
              <Badge className="border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-300 text-[10px]">
                Lỗi ({effectiveError.status})
              </Badge>
            )}
          </div>
          {effectiveError && (
            <div className="flex items-start gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-rose-700 dark:text-rose-300">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span className="line-clamp-2 font-mono text-[10px]">
                {effectiveError.vietnameseSummary ||
                  effectiveError.stderr ||
                  effectiveError.compileOutput ||
                  effectiveError.failedSummary}
              </span>
            </div>
          )}
          {!user && (
            <p className="text-[10px] text-slate-500">
              Đang dùng chế độ không cần đăng nhập (Offline/WebLLM).{" "}
              <Link href="/login" className="text-blue-500 font-semibold hover:underline">
                Đăng nhập
              </Link>{" "}
              để lưu lịch sử hỏi đáp & dùng Gemini API.
            </p>
          )}
        </div>

        {/* Quick Action Chips */}
        <div className="flex flex-wrap gap-1.5 border-b border-slate-200 dark:border-slate-800 px-4 py-2 bg-slate-50/70 dark:bg-slate-900/40">
          {effectiveError && (
            <button
              type="button"
              onClick={() => {
                setMode("debug");
                void sendPrompt(
                  `Đoạn code của tôi vừa gặp lỗi (${effectiveError.status}). Hãy chỉ ra dòng lỗi, nguyên nhân gốc rễ và gợi ý cách sửa từng bước (không đưa lời giải hoàn chỉnh).`,
                  "debug"
                );
              }}
              className="inline-flex items-center gap-1 rounded-full border border-rose-500/35 bg-rose-500/15 px-2.5 py-1 text-[11px] font-bold text-rose-600 dark:text-rose-300 hover:bg-rose-500/25 cursor-pointer"
            >
              <Bug className="h-3 w-3" /> Phân tích & sửa lỗi vừa gặp
            </button>
          )}
          {[
            {
              m: "debug" as const,
              label: "Kiểm tra lỗi tiềm ẩn",
              q: "Hãy rà soát đoạn code hiện tại (tràn số, thiếu dấu ;, vòng lặp, kiểu dữ liệu...) và gợi ý hướng sửa từng bước, chưa đưa đáp án hoàn chỉnh.",
            },
            {
              m: "hint" as const,
              label: "Gợi ý bước tiếp theo",
              q: "Đừng đưa ngay lời giải hoàn chỉnh, hãy gợi ý hướng tiếp cận từng bước giúp tôi.",
            },
            {
              m: "explain" as const,
              label: "Giải thích code của tôi",
              q: "Hãy giải thích từng dòng đoạn code hiện tại của tôi thật dễ hiểu bằng tiếng Việt.",
            },
          ].map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => {
                setMode(chip.m);
                void sendPrompt(chip.q, chip.m);
              }}
              className="inline-flex items-center gap-1 rounded-full border border-blue-500/25 bg-blue-500/10 px-2.5 py-1 text-[11px] font-semibold text-blue-600 dark:text-blue-300 hover:bg-blue-500/20 cursor-pointer"
            >
              <Sparkles className="h-3 w-3" /> {chip.label}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {messages.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-4 text-xs text-slate-500 space-y-1.5">
              <p className="font-semibold text-slate-700 dark:text-slate-300">
                Gia sư AI sẵn sàng hoạt động ngay (không bắt buộc API key)!
              </p>
              <p className="leading-relaxed">
                Hệ thống tự gửi kèm <strong>đề bài, code, input, output và lỗi</strong>. Gia sư sẽ chỉ ra dòng lỗi và gợi ý từng bước bằng tiếng Việt, không đưa đáp án hoàn chỉnh ngay để giữ trọn tư duy lập trình của bạn.
              </p>
            </div>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              className={`rounded-2xl p-3.5 text-sm space-y-2 ${
                m.role === "user"
                  ? "ml-8 bg-blue-600 text-white"
                  : "mr-4 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80"
              }`}
            >
              {m.role === "user" ? (
                <p className="whitespace-pre-wrap">{m.content}</p>
              ) : (
                <>
                  {m.providerLabel && (
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {m.providerLabel}
                    </p>
                  )}
                  {m.fallbackNotice && (
                    <div className="flex items-start gap-1.5 rounded-lg border border-amber-500/35 bg-amber-500/10 px-2.5 py-1.5 text-[11px] text-amber-800 dark:text-amber-200">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-500" />
                      <span>{m.fallbackNotice}</span>
                    </div>
                  )}
                  <SimpleMarkdown content={m.content} />
                </>
              )}
            </div>
          ))}

          {sending && (
            <div className="flex items-center gap-2 text-xs text-blue-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              {activeMode === "webllm"
                ? "Model WebLLM trên WebGPU đang suy luận..."
                : activeMode === "gemini"
                ? "Google Gemini đang phân tích bài của bạn..."
                : "Đang phân tích code & lỗi (Chế độ Offline thông minh)..."}
            </div>
          )}
        </div>

        {/* Composer */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void sendPrompt(input);
          }}
          className="border-t border-slate-200 dark:border-slate-800 p-3 flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Hỏi về lỗi code, output sai hoặc xin gợi ý từng bước..."
            className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm outline-none focus:border-blue-500"
          />
          <Button type="submit" size="md" loading={sending} disabled={!input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
