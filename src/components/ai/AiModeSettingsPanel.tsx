"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Cloud,
  Cpu,
  ExternalLink,
  KeyRound,
  Loader2,
  Power,
  Sparkles,
  WifiOff,
  X,
} from "lucide-react";
import { useAiMode } from "@/components/ai/AiModeProvider";
import { Badge, Button } from "@/components/ui/primitives";
import { getAiModeDisplayLabel, getAiTutorSetupGuide } from "@/lib/ai-tutor-shared";
import { WEBLLM_MODEL_OPTIONS, type WebLlmModelKey } from "@/lib/webllm-tutor";

interface AiModeSettingsPanelProps {
  compact?: boolean;
}

export function AiModeBadgePill({ className = "" }: { className?: string }) {
  const { activeMode } = useAiMode();
  const label = getAiModeDisplayLabel(activeMode);
  const style =
    activeMode === "gemini"
      ? "border-emerald-500/35 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
      : activeMode === "webllm"
      ? "border-purple-500/35 bg-purple-500/15 text-purple-700 dark:text-purple-300"
      : "border-cyan-500/35 bg-cyan-500/15 text-cyan-700 dark:text-cyan-300";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold leading-none ${style} ${className}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          activeMode === "gemini"
            ? "bg-emerald-500"
            : activeMode === "webllm"
            ? "bg-purple-500"
            : "bg-cyan-500"
        }`}
      />
      {label}
    </span>
  );
}

export function AiModeSettingsPanel({ compact = false }: AiModeSettingsPanelProps) {
  const {
    activeMode,
    serverGeminiConfigured,
    webGpu,
    webLlmStatus,
    webLlmProgress,
    webLlmModelKey,
    webLlmError,
    fallbackNotice,
    setPreference,
    setWebLlmModelKey,
    checkWebGpu,
    enableWebLlm,
    disableWebLlm,
    clearFallbackNotice,
  } = useAiMode();

  const [showKeyGuide, setShowKeyGuide] = useState(false);
  const [showWebLlmPanel, setShowWebLlmPanel] = useState(false);

  const handleSelectGemini = () => {
    setShowWebLlmPanel(false);
    if (!serverGeminiConfigured) {
      setShowKeyGuide(true);
      setPreference("auto");
      return;
    }
    setShowKeyGuide(false);
    clearFallbackNotice();
    setPreference("auto");
  };

  const handleSelectOffline = () => {
    setShowWebLlmPanel(false);
    setPreference("offline");
  };

  const handleSelectWebLlm = async () => {
    setShowKeyGuide(false);
    setShowWebLlmPanel(true);
    if (!webGpu.checked) {
      await checkWebGpu();
    }
    if (webLlmStatus === "ready") {
      setPreference("webllm");
    }
  };

  const setupSteps = getAiTutorSetupGuide();

  return (
    <div className={`border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/70 ${compact ? "px-4 py-2.5" : "p-3.5"} space-y-2.5 text-xs`}>
      {/* Mode switcher pills */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold text-slate-500 mr-0.5">Chế độ:</span>
          <button
            type="button"
            onClick={handleSelectGemini}
            className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
              activeMode === "gemini"
                ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-emerald-500/40"
            }`}
            title={
              serverGeminiConfigured
                ? "Dùng Google Gemini API phía server"
                : "Chưa có GEMINI_API_KEY — bấm xem hướng dẫn thêm key miễn phí"
            }
          >
            <Cloud className="h-3 w-3" />
            Gemini
            {!serverGeminiConfigured && <span className="text-[10px] opacity-70">(chưa có key)</span>}
          </button>

          <button
            type="button"
            onClick={handleSelectOffline}
            className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
              activeMode === "offline"
                ? "border-cyan-500/40 bg-cyan-500/15 text-cyan-700 dark:text-cyan-300"
                : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-cyan-500/40"
            }`}
            title="Phân tích lỗi biên dịch, output sai và lỗi C++ phổ biến không cần API key"
          >
            <WifiOff className="h-3 w-3" />
            Offline
          </button>

          <button
            type="button"
            onClick={handleSelectWebLlm}
            className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
              activeMode === "webllm" || showWebLlmPanel
                ? "border-purple-500/40 bg-purple-500/15 text-purple-700 dark:text-purple-300"
                : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-purple-500/40"
            }`}
            title="Tùy chọn nâng cao: chạy model LLM nhỏ trực tiếp trên WebGPU trình duyệt"
          >
            <Cpu className="h-3 w-3" />
            Trong trình duyệt
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowKeyGuide((v) => !v)}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
        >
          <KeyRound className="h-3 w-3" />
          {showKeyGuide ? "Ẩn hướng dẫn key" : "Thêm key Gemini miễn phí"}
        </button>
      </div>

      {/* Clear mode hint when running Offline without Gemini API key */}
      {activeMode === "offline" && !serverGeminiConfigured && !showWebLlmPanel && !showKeyGuide && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
          Đang dùng <strong>Offline thông minh</strong> (40+ chủ đề C++/Web & sửa lỗi tức thì). Muốn AI suy luận tự do mọi đề bài? Bấm{" "}
          <button
            type="button"
            onClick={() => void handleSelectWebLlm()}
            className="font-semibold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
          >
            Trong trình duyệt (Qwen2.5-Coder miễn phí)
          </button>{" "}
          hoặc{" "}
          <button
            type="button"
            onClick={() => setShowKeyGuide(true)}
            className="font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            gắn GEMINI_API_KEY miễn phí
          </button>
          .
        </p>
      )}

      {/* Automatic fallback notice banner (Quota / Invalid Key / Network Error / WebLLM failure) */}
      {fallbackNotice && (
        <div className="flex items-start justify-between gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-2.5 text-[11px] text-amber-800 dark:text-amber-200">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
            <p className="leading-relaxed">{fallbackNotice}</p>
          </div>
          <button
            type="button"
            onClick={clearFallbackNotice}
            className="text-amber-600 dark:text-amber-300 hover:opacity-75 cursor-pointer"
            aria-label="Đóng cảnh báo chuyển chế độ"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Short Google AI Studio free key setup guide */}
      {showKeyGuide && (
        <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-3 space-y-2 text-[11px]">
          <div className="flex items-center justify-between gap-2">
            <p className="font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Cách thêm GEMINI_API_KEY miễn phí (Google AI Studio)
            </p>
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Mở AI Studio <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-slate-700 dark:text-slate-300 leading-relaxed">
            {setupSteps.map((s, idx) => (
              <li key={idx}>{s}</li>
            ))}
          </ol>
          <p className="text-[10px] text-slate-500">
            Trong lúc chưa có key, chế độ <strong>Offline thông minh</strong> vẫn hoạt động tức thì để phân tích lỗi và gợi ý từng bước!
          </p>
        </div>
      )}

      {/* Advanced In-Browser WebLLM (WebGPU) Panel — Opt-in ONLY */}
      {showWebLlmPanel && (
        <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-3 space-y-2.5 text-[11px]">
          <div className="flex items-center justify-between gap-2">
            <p className="font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5" />
              Model AI chạy trong trình duyệt (WebLLM · WebGPU)
            </p>
            <Badge
              className={
                webLlmStatus === "ready"
                  ? "border-emerald-500/35 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                  : webGpu.checked && !webGpu.supported
                  ? "border-rose-500/35 bg-rose-500/15 text-rose-600 dark:text-rose-300"
                  : "border-purple-500/35 bg-purple-500/15 text-purple-700 dark:text-purple-300"
              }
            >
              {webLlmStatus === "ready"
                ? "Đang bật"
                : webLlmStatus === "downloading"
                ? `Đang tải ${webLlmProgress.percent}%`
                : webGpu.checked && !webGpu.supported
                ? "Không có WebGPU"
                : "Tùy chọn nâng cao"}
            </Badge>
          </div>

          {/* WebGPU capability check result */}
          {webGpu.checked && !webGpu.supported ? (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-rose-700 dark:text-rose-300 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Máy hoặc trình duyệt này chưa hỗ trợ WebGPU</p>
                <p className="leading-relaxed">{webGpu.reason}</p>
              </div>
            </div>
          ) : (
            <>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Chạy trực tiếp một model LLM nhỏ ngay trên GPU máy bạn — không cần API key và không gửi code ra ngoài. Model chỉ được tải về (và lưu cache) khi bạn chủ động bấm nút bên dưới.
              </p>

              {webGpu.checked && webGpu.supported && (
                <p className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> {webGpu.reason}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={webLlmModelKey}
                  disabled={webLlmStatus === "downloading" || webLlmStatus === "checking"}
                  onChange={(e) => setWebLlmModelKey(e.target.value as WebLlmModelKey)}
                  className="flex-1 min-w-[180px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-1.5 text-[11px] font-medium"
                  aria-label="Chọn model WebLLM"
                >
                  {WEBLLM_MODEL_OPTIONS.map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      {opt.label} ({opt.sizeHint})
                    </option>
                  ))}
                </select>

                {webLlmStatus === "ready" ? (
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => setPreference("webllm")}
                      disabled={activeMode === "webllm"}
                    >
                      {activeMode === "webllm" ? "Đang sử dụng" : "Dùng model này"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={disableWebLlm} title="Tắt model & giải phóng VRAM">
                      <Power className="h-3.5 w-3.5" /> Tắt
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="primary"
                    loading={webLlmStatus === "downloading" || webLlmStatus === "checking"}
                    onClick={() => void enableWebLlm()}
                  >
                    Tải & Bật WebLLM
                  </Button>
                )}
              </div>

              {/* First-load download progress bar */}
              {(webLlmStatus === "downloading" || webLlmStatus === "checking") && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between gap-2 text-purple-700 dark:text-purple-300 font-semibold">
                    <span className="flex items-center gap-1.5 truncate">
                      <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                      {webLlmProgress.text || "Đang tải model WebLLM..."}
                    </span>
                    <span className="font-mono shrink-0">{webLlmProgress.percent}%</span>
                  </div>
                  <div
                    role="progressbar"
                    aria-label="Tiến trình tải model WebLLM"
                    aria-valuenow={webLlmProgress.percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
                  >
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-purple-600 to-indigo-500 transition-all duration-200"
                      style={{ width: `${Math.max(3, Math.min(100, webLlmProgress.percent))}%` }}
                    />
                  </div>
                </div>
              )}

              {webLlmError && (
                <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2 text-rose-700 dark:text-rose-300">
                  {webLlmError}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
