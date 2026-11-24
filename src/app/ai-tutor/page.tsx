"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Bot,
  Bug,
  Code2,
  Compass,
  Loader2,
  MessageSquare,
  Plus,
  Send,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth, useToast } from "@/components/providers";
import { useAiMode } from "@/components/ai/AiModeProvider";
import { AiModeBadgePill, AiModeSettingsPanel } from "@/components/ai/AiModeSettingsPanel";
import { Button, Card, LoadingState, SimpleMarkdown } from "@/components/ui/primitives";
import { generateOfflineTutorReply } from "@/lib/offline-tutor";
import { askWebLlmTutor } from "@/lib/webllm-tutor";
import type { AiConversationRecord, AiMessageRecord, CourseRecord } from "@/types/codelab";

const MODES = [
  { id: "explain", label: "Giải thích kiến thức", icon: Sparkles, desc: "Giải thích khái niệm, từng dòng code, so sánh cách viết" },
  { id: "debug", label: "Phân tích lỗi code", icon: Bug, desc: "Tìm nguyên nhân lỗi, giải thích tại sao sai & hướng sửa" },
  { id: "hint", label: "Hỗ trợ giải bài tập", icon: Compass, desc: "Phân tích đề, gợi ý từng bước (không làm mất tư duy)" },
  { id: "generate_practice", label: "Tạo bài tập & Quiz", icon: Wand2, desc: "Sinh bài tập theo chủ đề, độ khó và câu hỏi trắc nghiệm" },
] as const;

interface UiMessage extends AiMessageRecord {
  providerLabel?: string;
  fallbackNotice?: string | null;
}

export default function AiTutorPage() {
  const { user, loading: authLoading } = useAuth();
  const { activeMode, preference, reportFallbackToOffline } = useAiMode();
  const { toast } = useToast();

  const [conversations, setConversations] = useState<AiConversationRecord[]>([]);
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  const [mode, setMode] = useState<(typeof MODES)[number]["id"]>("explain");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [codeSnippet, setCodeSnippet] = useState("");
  const [showCodeBox, setShowCodeBox] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const msgSeqRef = useRef(0);

  const nextLocalId = (prefix: string) => {
    msgSeqRef.current += 1;
    return `${prefix}-${msgSeqRef.current}`;
  };

  const loadConversations = useCallback(async () => {
    setLoadingList(true);
    try {
      const [convRes, courseRes] = await Promise.all([
        fetch("/api/ai/conversations", { cache: "no-store" }),
        fetch("/api/courses", { cache: "no-store" }),
      ]);
      if (convRes.ok) {
        const d = await convRes.json();
        setConversations(d.conversations || []);
      }
      if (courseRes.ok) {
        const cd = await courseRes.json();
        setCourses(cd.courses || []);
      }
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    const t = setTimeout(() => {
      if (user) {
        loadConversations();
      } else {
        setLoadingList(false);
      }
    }, 0);
    return () => clearTimeout(t);
  }, [authLoading, user, loadConversations]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const openConversation = async (id: string) => {
    setActiveConvId(id);
    setLoadingMsgs(true);
    try {
      const res = await fetch(`/api/ai/conversations/${id}`, { cache: "no-store" });
      if (res.ok) {
        const d = await res.json();
        setMessages(d.messages || []);
      }
    } finally {
      setLoadingMsgs(false);
    }
  };

  const startNewChat = () => {
    setActiveConvId(null);
    setMessages([]);
    setCodeSnippet("");
    setShowCodeBox(false);
  };

  const deleteConversation = async (id: string) => {
    const res = await fetch(`/api/ai/conversations/${id}`, { method: "DELETE" });
    if (res.ok) {
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConvId === id) startNewChat();
      toast({ title: "Đã xóa cuộc trò chuyện", variant: "info" });
    }
  };

  const handleSend = async (promptOverride?: string) => {
    const text = (promptOverride ?? input).trim();
    if (!text || sending) return;

    const historySnapshot = messages.map((m) => ({ role: m.role, content: m.content }));
    const optimisticUser: UiMessage = {
      id: nextLocalId("tmp"),
      conversation_id: activeConvId ?? "new",
      role: "user",
      content: text,
      code_context: codeSnippet.trim() || null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUser]);
    setInput("");
    setSending(true);

    const selectedCourse = courses.find((c) => c.id === selectedCourseId);
    const localTutorCtx = {
      courseTitle: selectedCourse?.title ?? null,
      courseLanguage: selectedCourse?.language ?? "cpp",
      codeContext: codeSnippet.trim() || null,
      mode,
    };

    try {
      // Path 1: In-browser WebLLM (WebGPU)
      if (activeMode === "webllm") {
        try {
          const webRes = await askWebLlmTutor({
            message: text,
            history: historySnapshot,
            context: localTutorCtx,
          });
          setMessages((prev) => [
            ...prev,
            {
              id: nextLocalId("webllm"),
              conversation_id: activeConvId || "new",
              role: "assistant",
              content: webRes.reply,
              code_context: null,
              created_at: new Date().toISOString(),
              providerLabel: webRes.provider,
            },
          ]);
          setCodeSnippet("");
          setShowCodeBox(false);

          if (user) {
            fetch("/api/ai/chat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                conversationId: activeConvId,
                message: text,
                codeContext: codeSnippet.trim() || null,
                courseId: selectedCourseId || null,
                mode,
                preferredMode: "webllm",
                clientGeneratedReply: webRes.reply,
                clientProviderLabel: webRes.provider,
              }),
            })
              .then((r) => r.json())
              .then((d) => {
                if (d?.conversationId && !activeConvId) {
                  setActiveConvId(d.conversationId);
                  loadConversations();
                }
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
            message: text,
            history: historySnapshot,
            context: localTutorCtx,
          });
          setMessages((prev) => [
            ...prev,
            {
              id: nextLocalId("fb"),
              conversation_id: activeConvId || "new",
              role: "assistant",
              content: offlineReply,
              code_context: null,
              created_at: new Date().toISOString(),
              providerLabel: "Gợi ý thông minh Offline",
              fallbackNotice: reason,
            },
          ]);
          return;
        }
      }

      // Path 2: Server Provider (Gemini priority if key configured -> automatic Offline fallback)
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConvId,
          message: text,
          codeContext: codeSnippet.trim() || null,
          courseId: selectedCourseId || null,
          mode,
          preferredMode: preference === "offline" ? "offline" : "auto",
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();

      if (data.conversationId && !activeConvId) {
        setActiveConvId(data.conversationId);
        loadConversations();
      }

      if (data.fallbackUsed && data.fallbackReason) {
        reportFallbackToOffline(data.fallbackReason);
      }

      setMessages((prev) => [
        ...prev,
        {
          ...data.assistantMessage,
          providerLabel: data.provider || "Gợi ý thông minh Offline",
          fallbackNotice: data.fallbackUsed ? data.fallbackReason : null,
        },
      ]);
      setCodeSnippet("");
      setShowCodeBox(false);
    } catch {
      const reason =
        "Mất kết nối mạng tới máy chủ AI. Hệ thống đã tự động chuyển sang chế độ Gợi ý thông minh Offline cục bộ.";
      reportFallbackToOffline(reason);
      const offlineReply = generateOfflineTutorReply({
        message: text,
        history: historySnapshot,
        context: localTutorCtx,
      });
      setMessages((prev) => [
        ...prev,
        {
          id: nextLocalId("off"),
          conversation_id: activeConvId || "new",
          role: "assistant",
          content: offlineReply,
          code_context: null,
          created_at: new Date().toISOString(),
          providerLabel: "Gợi ý thông minh Offline (Cục bộ)",
          fallbackNotice: reason,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  if (authLoading || loadingList) {
    return (
      <AppShell>
        <LoadingState message="Đang khởi tạo Gia sư Lập trình AI..." />
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell>
        <Card className="max-w-lg mx-auto my-12 p-8 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500">
            <Bot className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold">Gia sư Lập trình AI CODELAB</h1>
          <p className="text-sm text-slate-500">
            Đăng nhập để lưu lịch sử trò chuyện, cá nhân hóa theo bài học và sử dụng đầy đủ 3 chế độ (Gemini, Offline thông minh, WebLLM WebGPU).
          </p>
          <Link href="/login">
            <Button>Đăng nhập ngay</Button>
          </Link>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell fullBleed>
      <div className="flex flex-1 flex-col lg:flex-row lg:h-[calc(100vh-60px)] overflow-hidden">
        {/* Conversation History Sidebar */}
        <aside className="w-full lg:w-72 shrink-0 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1424] flex flex-col">
          <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 space-y-2.5">
            <Button variant="primary" size="sm" className="w-full" onClick={startNewChat}>
              <Plus className="h-4 w-4" /> Cuộc trò chuyện mới
            </Button>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Chế độ đang dùng:</span>
              <AiModeBadgePill />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2.5 space-y-1 max-h-48 lg:max-h-none">
            {conversations.length === 0 ? (
              <p className="p-3 text-xs text-slate-500 text-center">
                Chưa có lịch sử hội thoại nào.
              </p>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`group flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs cursor-pointer transition-colors ${
                    activeConvId === conv.id
                      ? "bg-blue-600/15 text-blue-600 dark:text-blue-400 font-semibold"
                      : "hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-600 dark:text-slate-300"
                  }`}
                  onClick={() => openConversation(conv.id)}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{conv.title}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(conv.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 cursor-pointer"
                    aria-label="Xóa hội thoại"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] dark:bg-[#090e1a]">
          {/* Mode & Context Selector Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1424] px-4 py-2.5">
            <div className="flex flex-wrap items-center gap-1.5">
              {MODES.map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                      mode === m.id
                        ? "bg-blue-600 text-white shadow-xs"
                        : "border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-blue-500/40"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" /> {m.label}
                  </button>
                );
              })}
            </div>

            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-medium"
              aria-label="Ngữ cảnh khóa học"
            >
              <option value="">Tự nhận diện theo bài đang học</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  Ngữ cảnh: {c.title}
                </option>
              ))}
            </select>
          </div>

          {/* AI Provider Mode Switcher (Gemini / Offline / WebLLM) + Free Key Guide */}
          <AiModeSettingsPanel />

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {loadingMsgs ? (
              <LoadingState message="Đang tải hội thoại..." />
            ) : messages.length === 0 ? (
              <div className="max-w-2xl mx-auto my-6 space-y-6">
                <div className="text-center space-y-2">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/25">
                    <Bot className="h-6 w-6" />
                  </div>
                  <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
                    Xin chào! Tôi là Gia sư Lập trình AI của CODELAB
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Hoạt động ngay cả khi chưa có API key nhờ chế độ <strong>Offline thông minh</strong>, ưu tiên <strong>Gemini API</strong> khi có key và hỗ trợ tùy chọn <strong>WebLLM</strong> chạy cục bộ trong trình duyệt.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      title: "Học STL: std::map trong C++",
                      prompt: "Học về map trong C++: cách khai báo, đếm tần suất và lỗi hay gặp là gì?",
                    },
                    {
                      title: "So sánh 2 cấu trúc dữ liệu",
                      prompt: "So sánh map và unordered_map trong C++, khi nào nên dùng cái nào?",
                    },
                    {
                      title: "Phân tích lỗi mảng thường gặp",
                      prompt: "Tại sao khi tìm giá trị lớn nhất trong mảng toàn số âm mà khởi tạo max = 0 lại bị sai?",
                    },
                    {
                      title: "Gợi ý thuật toán & luyện tập",
                      prompt: "Giải thích tìm kiếm nhị phân (Binary Search) và lower_bound trong C++.",
                    },
                  ].map((s) => (
                    <button
                      key={s.title}
                      onClick={() => void handleSend(s.prompt)}
                      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 text-left hover:border-blue-500/50 transition-all cursor-pointer"
                    >
                      <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-1">
                        {s.title}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {s.prompt}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto space-y-4">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl p-4 space-y-2 ${
                        m.role === "user"
                          ? "bg-blue-600 text-white shadow-sm"
                          : "border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827]"
                      }`}
                    >
                      {m.role === "user" ? (
                        <div className="space-y-2 text-sm">
                          <p className="whitespace-pre-wrap">{m.content}</p>
                          {m.code_context && (
                            <pre className="overflow-x-auto rounded-xl bg-slate-950/80 p-3 font-mono text-xs text-slate-100">
                              <code>{m.code_context}</code>
                            </pre>
                          )}
                        </div>
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
                  </div>
                ))}
                {sending && (
                  <div className="flex items-center gap-2 text-xs text-blue-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {activeMode === "webllm"
                      ? "Model WebLLM đang suy luận trên WebGPU..."
                      : activeMode === "gemini"
                      ? "Google Gemini đang soạn câu trả lời..."
                      : "Đang phân tích câu hỏi & code (Chế độ Offline thông minh)..."}
                  </div>
                )}
                <div ref={endRef} />
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1424] p-3 sm:p-4">
            <div className="max-w-3xl mx-auto space-y-2.5">
              {showCodeBox && (
                <textarea
                  rows={4}
                  value={codeSnippet}
                  onChange={(e) => setCodeSnippet(e.target.value)}
                  placeholder="Dán đoạn code bạn muốn Gia sư AI phân tích lỗi (tràn số int, thiếu dấu ;, vòng lặp vô hạn...) hoặc giải thích từng dòng..."
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-950 p-3 font-mono text-xs text-slate-100 outline-none focus:border-blue-500"
                />
              )}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleSend();
                }}
                className="flex items-center gap-2"
              >
                <Button
                  type="button"
                  size="md"
                  variant={showCodeBox ? "secondary" : "outline"}
                  onClick={() => setShowCodeBox(!showCodeBox)}
                  title="Đính kèm đoạn code"
                >
                  <Code2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Đính kèm code</span>
                </Button>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Nhập câu hỏi lập trình của bạn..."
                  className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                />
                <Button type="submit" loading={sending} disabled={!input.trim()}>
                  <Send className="h-4 w-4" /> Gửi
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
