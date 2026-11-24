"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "@/components/providers";
import type { AiModePreference, AiProviderMode } from "@/lib/ai-tutor-shared";
import {
  checkWebGpuSupport,
  getLoadedWebLlmInfo,
  initWebLlmEngine,
  unloadWebLlmEngine,
  type WebGpuCheckResult,
  type WebLlmLoadProgress,
  type WebLlmModelKey,
} from "@/lib/webllm-tutor";

export type WebLlmStatus = "idle" | "checking" | "downloading" | "ready" | "error";

interface AiModeContextValue {
  /** Effective provider mode displayed on "Hỏi AI" button and headers */
  activeMode: AiProviderMode;
  /** User-selected mode preference */
  preference: AiModePreference;
  /** Whether server has GEMINI_API_KEY / external AI key configured */
  serverGeminiConfigured: boolean;
  serverProviderLabel: string;
  /** WebGPU capability check result */
  webGpu: WebGpuCheckResult & { checked: boolean };
  /** WebLLM loading state */
  webLlmStatus: WebLlmStatus;
  webLlmProgress: WebLlmLoadProgress;
  webLlmModelKey: WebLlmModelKey;
  webLlmError: string | null;
  /** Latest automatic fallback notice (e.g. quota exceeded / invalid key / network drop) */
  fallbackNotice: string | null;
  setPreference: (next: AiModePreference) => void;
  setWebLlmModelKey: (next: WebLlmModelKey) => void;
  checkWebGpu: () => Promise<WebGpuCheckResult>;
  enableWebLlm: (modelOverride?: WebLlmModelKey) => Promise<boolean>;
  disableWebLlm: () => Promise<void>;
  reportFallbackToOffline: (reason: string) => void;
  clearFallbackNotice: () => void;
}

const AiModeContext = createContext<AiModeContextValue | null>(null);

const PREF_STORAGE_KEY = "codelab:ai_mode_preference";

export function AiModeProvider({ children }: { children: React.ReactNode }) {
  const { systemStatus } = useAuth();
  const serverGeminiConfigured = Boolean(systemStatus?.ai_tutor_configured);
  const serverProviderLabel = systemStatus?.ai_provider || "Gợi ý thông minh Offline";

  const [preference, setPreferenceState] = useState<AiModePreference>("auto");
  const [webGpu, setWebGpu] = useState<WebGpuCheckResult & { checked: boolean }>({
    checked: false,
    supported: false,
    hasF16: false,
    reason: "Chưa kiểm tra WebGPU.",
  });
  const [webLlmStatus, setWebLlmStatus] = useState<WebLlmStatus>(() =>
    getLoadedWebLlmInfo().ready ? "ready" : "idle"
  );
  const [webLlmProgress, setWebLlmProgress] = useState<WebLlmLoadProgress>({
    percent: getLoadedWebLlmInfo().ready ? 100 : 0,
    text: getLoadedWebLlmInfo().ready ? "Model WebLLM đã sẵn sàng!" : "",
  });
  const [webLlmModelKey, setWebLlmModelKey] = useState<WebLlmModelKey>("qwen-coder-1.5b");
  const [webLlmError, setWebLlmError] = useState<string | null>(null);
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);

  // Restore saved preference (never auto-load WebLLM weights without explicit user click!)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PREF_STORAGE_KEY);
      if (saved === "offline" || saved === "auto" || saved === "gemini") {
        const id = requestAnimationFrame(() => setPreferenceState(saved));
        return () => cancelAnimationFrame(id);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const setPreference = useCallback((next: AiModePreference) => {
    setPreferenceState(next);
    if (next !== "offline") {
      setFallbackNotice(null);
    }
    try {
      if (next !== "webllm") {
        localStorage.setItem(PREF_STORAGE_KEY, next);
      }
    } catch {
      // ignore
    }
  }, []);

  const runWebGpuCheck = useCallback(async () => {
    const result = await checkWebGpuSupport();
    setWebGpu({ checked: true, ...result });
    return result;
  }, []);

  const enableWebLlm = useCallback(
    async (modelOverride?: WebLlmModelKey) => {
      const chosenKey = modelOverride ?? webLlmModelKey;
      setWebLlmModelKey(chosenKey);
      setWebLlmError(null);
      setFallbackNotice(null);
      setWebLlmStatus("checking");
      setWebLlmProgress({ percent: 0, text: "Đang kiểm tra khả năng hỗ trợ WebGPU của trình duyệt..." });

      const gpu = await runWebGpuCheck();
      if (!gpu.supported) {
        setWebLlmStatus("error");
        setWebLlmError(gpu.reason);
        setPreferenceState("offline");
        return false;
      }

      setWebLlmStatus("downloading");
      const res = await initWebLlmEngine(chosenKey, (p) => {
        setWebLlmProgress(p);
      });

      if (!res.ok) {
        setWebLlmStatus("error");
        setWebLlmError(res.error || "Không thể khởi chạy model WebLLM trong trình duyệt.");
        setPreferenceState("offline");
        return false;
      }

      setWebLlmStatus("ready");
      setPreferenceState("webllm");
      return true;
    },
    [webLlmModelKey, runWebGpuCheck]
  );

  const disableWebLlm = useCallback(async () => {
    await unloadWebLlmEngine();
    setWebLlmStatus("idle");
    setWebLlmProgress({ percent: 0, text: "" });
    setWebLlmError(null);
    setPreferenceState("auto");
  }, []);

  const reportFallbackToOffline = useCallback((reason: string) => {
    setFallbackNotice(reason);
    setPreferenceState("offline");
  }, []);

  const clearFallbackNotice = useCallback(() => {
    setFallbackNotice(null);
  }, []);

  // Compute effective display mode for "Hỏi AI" button & headers
  let activeMode: AiProviderMode;
  if (preference === "webllm" && webLlmStatus === "ready") {
    activeMode = "webllm";
  } else if (preference === "offline" || fallbackNotice) {
    activeMode = "offline";
  } else if (serverGeminiConfigured) {
    activeMode = "gemini";
  } else {
    activeMode = "offline";
  }

  return (
    <AiModeContext.Provider
      value={{
        activeMode,
        preference,
        serverGeminiConfigured,
        serverProviderLabel,
        webGpu,
        webLlmStatus,
        webLlmProgress,
        webLlmModelKey,
        webLlmError,
        fallbackNotice,
        setPreference,
        setWebLlmModelKey,
        checkWebGpu: runWebGpuCheck,
        enableWebLlm,
        disableWebLlm,
        reportFallbackToOffline,
        clearFallbackNotice,
      }}
    >
      {children}
    </AiModeContext.Provider>
  );
}

export function useAiMode() {
  const ctx = useContext(AiModeContext);
  if (!ctx) throw new Error("useAiMode must be used inside AiModeProvider");
  return ctx;
}
