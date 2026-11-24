"use client";

import {
  buildTutorSystemInstruction,
  buildTutorUserPrompt,
  type TutorContext,
  type TutorHistoryMessage,
} from "@/lib/ai-tutor-shared";

export type WebLlmModelKey = "qwen-coder-1.5b" | "qwen-coder-0.5b" | "qwen-coder-3b";

export interface WebLlmModelOption {
  key: WebLlmModelKey;
  label: string;
  sizeHint: string;
  description: string;
  f16Id: string;
  f32Id: string;
}

export const WEBLLM_MODEL_OPTIONS: WebLlmModelOption[] = [
  {
    key: "qwen-coder-1.5b",
    label: "Qwen2.5-Coder 1.5B (Chuyên Code · Khuyên dùng)",
    sizeHint: "~950MB",
    description: "Model chuyên lập trình C++/JS/HTML/CSS, hỗ trợ tiếng Việt tốt, cần GPU >= 2GB VRAM.",
    f16Id: "Qwen2.5-Coder-1.5B-Instruct-q4f16_1-MLC",
    f32Id: "Qwen2.5-Coder-1.5B-Instruct-q4f32_1-MLC",
  },
  {
    key: "qwen-coder-0.5b",
    label: "Qwen2.5-Coder 0.5B (Siêu nhẹ · Tải nhanh)",
    sizeHint: "~350MB",
    description: "Model lập trình gọn nhẹ nhất cho máy cấu hình thấp, tải nhanh.",
    f16Id: "Qwen2.5-Coder-0.5B-Instruct-q4f16_1-MLC",
    f32Id: "Qwen2.5-Coder-0.5B-Instruct-q4f32_1-MLC",
  },
  {
    key: "qwen-coder-3b",
    label: "Qwen2.5-Coder 3B (Thông minh nhất)",
    sizeHint: "~1.8GB",
    description: "Suy luận thuật toán và giải thích tiếng Việt xuất sắc nhất, cần GPU >= 3GB VRAM.",
    f16Id: "Qwen2.5-Coder-3B-Instruct-q4f16_1-MLC",
    f32Id: "Qwen2.5-Coder-3B-Instruct-q4f32_1-MLC",
  },
];

export interface WebGpuCheckResult {
  supported: boolean;
  hasF16: boolean;
  reason: string;
}

interface NavigatorGpuLike {
  requestAdapter?: () => Promise<{
    features?: { has?: (feature: string) => boolean };
  } | null>;
}

export async function checkWebGpuSupport(
  navOverride?: { gpu?: NavigatorGpuLike } | null
): Promise<WebGpuCheckResult> {
  const nav =
    navOverride !== undefined
      ? navOverride
      : typeof navigator !== "undefined"
      ? (navigator as unknown as { gpu?: NavigatorGpuLike })
      : null;

  if (!nav || !nav.gpu || typeof nav.gpu.requestAdapter !== "function") {
    return {
      supported: false,
      hasF16: false,
      reason:
        "Trình duyệt hoặc thiết bị này chưa hỗ trợ WebGPU (cần Chrome/Edge 113+ bật tăng tốc phần cứng). Bạn có thể dùng ngay chế độ Offline thông minh hoặc gắn GEMINI_API_KEY miễn phí.",
    };
  }

  try {
    const adapter = await nav.gpu.requestAdapter();
    if (!adapter) {
      return {
        supported: false,
        hasF16: false,
        reason:
          "Không tìm thấy bộ xử lý đồ họa (GPU Adapter) tương thích WebGPU trên máy này (có thể do GPU cũ hoặc đã tắt Hardware Acceleration). Hãy dùng chế độ Offline thông minh hoặc Gemini API.",
      };
    }
    const hasF16 = Boolean(adapter.features?.has?.("shader-f16"));
    return {
      supported: true,
      hasF16,
      reason: hasF16
        ? "Thiết bị hỗ trợ WebGPU (có shader-f16, tối ưu tốc độ)."
        : "Thiết bị hỗ trợ WebGPU (chế độ tương thích f32).",
    };
  } catch (err) {
    return {
      supported: false,
      hasF16: false,
      reason: `Không thể khởi tạo WebGPU: ${err instanceof Error ? err.message : "Thiết bị không hỗ trợ"}.`,
    };
  }
}

export interface WebLlmLoadProgress {
  percent: number;
  text: string;
}

interface MlcEngineLike {
  chat: {
    completions: {
      create: (req: {
        messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
        temperature?: number;
        max_tokens?: number;
      }) => Promise<{ choices?: Array<{ message?: { content?: string | null } }> }>;
    };
  };
  unload?: () => Promise<void>;
}

let activeEngine: MlcEngineLike | null = null;
let activeModelId: string | null = null;
let activeModelLabel: string | null = null;
let loadingPromise: Promise<MlcEngineLike> | null = null;

function formatProgressText(rawText: string, pct: number): string {
  const lower = rawText.toLowerCase();
  if (lower.includes("from cache")) {
    return `Đang nạp model WebLLM từ bộ nhớ đệm (${pct}%)...`;
  }
  if (lower.includes("fetching") || lower.includes("download")) {
    return `Đang tải trọng số model WebLLM lần đầu (${pct}%) — sẽ tự lưu cache cho lần sau...`;
  }
  if (lower.includes("loading gpu shader") || lower.includes("compiling") || lower.includes("initializing")) {
    return `Đang khởi tạo WebGPU shader (${pct}%)...`;
  }
  if (pct >= 100 || lower.includes("finish")) {
    return "Model WebLLM trong trình duyệt đã sẵn sàng!";
  }
  return rawText ? `WebLLM (${pct}%): ${rawText}` : `Đang tải model WebLLM (${pct}%)...`;
}

export function getLoadedWebLlmInfo(): { ready: boolean; modelId: string | null; label: string | null } {
  return {
    ready: Boolean(activeEngine),
    modelId: activeModelId,
    label: activeModelLabel,
  };
}

export async function initWebLlmEngine(
  modelKey: WebLlmModelKey,
  onProgress?: (p: WebLlmLoadProgress) => void
): Promise<{ ok: boolean; modelId?: string; label?: string; error?: string; unsupported?: boolean }> {
  const gpu = await checkWebGpuSupport();
  if (!gpu.supported) {
    return { ok: false, unsupported: true, error: gpu.reason };
  }

  const option = WEBLLM_MODEL_OPTIONS.find((m) => m.key === modelKey) ?? WEBLLM_MODEL_OPTIONS[0];
  const targetModelId = gpu.hasF16 ? option.f16Id : option.f32Id;

  if (activeEngine && activeModelId === targetModelId) {
    onProgress?.({ percent: 100, text: "Model WebLLM đã sẵn sàng trong trình duyệt!" });
    return { ok: true, modelId: targetModelId, label: option.label };
  }

  if (loadingPromise) {
    try {
      await loadingPromise;
      return { ok: true, modelId: activeModelId ?? targetModelId, label: activeModelLabel ?? option.label };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : "Không thể tải model WebLLM.",
      };
    }
  }

  onProgress?.({ percent: 2, text: `Đang khởi tạo WebLLM (${option.label}, ${option.sizeHint})...` });

  loadingPromise = (async () => {
    if (activeEngine?.unload) {
      try {
        await activeEngine.unload();
      } catch {
        // ignore unload errors
      }
      activeEngine = null;
      activeModelId = null;
      activeModelLabel = null;
    }

    const webllm = await import("@mlc-ai/web-llm");
    const engine = (await webllm.CreateMLCEngine(targetModelId, {
      initProgressCallback: (report) => {
        const pct = Math.max(0, Math.min(100, Math.round((report.progress ?? 0) * 100)));
        onProgress?.({
          percent: pct,
          text: formatProgressText(report.text ?? "", pct),
        });
      },
    })) as unknown as MlcEngineLike;

    activeEngine = engine;
    activeModelId = targetModelId;
    activeModelLabel = option.label;
    onProgress?.({ percent: 100, text: `Đã sẵn sàng: ${option.label} (chạy cục bộ trên WebGPU).` });
    return engine;
  })();

  try {
    await loadingPromise;
    return { ok: true, modelId: targetModelId, label: option.label };
  } catch (err) {
    activeEngine = null;
    activeModelId = null;
    activeModelLabel = null;
    return {
      ok: false,
      error: `Không thể tải hoặc khởi chạy WebLLM (${err instanceof Error ? err.message : "lỗi WebGPU/mạng"}). Hệ thống vẫn sẵn sàng dùng chế độ Offline thông minh.`,
    };
  } finally {
    loadingPromise = null;
  }
}

export async function unloadWebLlmEngine(): Promise<void> {
  if (activeEngine?.unload) {
    try {
      await activeEngine.unload();
    } catch {
      // ignore
    }
  }
  activeEngine = null;
  activeModelId = null;
  activeModelLabel = null;
}

export async function askWebLlmTutor(params: {
  message: string;
  history: TutorHistoryMessage[];
  context: TutorContext;
}): Promise<{ reply: string; provider: string }> {
  if (!activeEngine) {
    throw new Error("Model WebLLM chưa được tải.");
  }

  const systemInstruction = buildTutorSystemInstruction(params.context);
  const userPrompt = buildTutorUserPrompt(params.message, params.context);

  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: systemInstruction },
    ...params.history.slice(-6).map((m) => ({
      role: m.role,
      content: m.content.slice(0, 1200),
    })),
    { role: "user", content: userPrompt.slice(0, 4000) },
  ];

  const completion = await activeEngine.chat.completions.create({
    messages,
    temperature: 0.35,
    max_tokens: 512,
  });

  const text = completion.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new Error("WebLLM trả về phản hồi rỗng.");
  }

  return {
    reply: text,
    provider: `WebLLM · ${activeModelLabel || activeModelId || "Trong trình duyệt"}`,
  };
}
