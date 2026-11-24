import { GoogleGenAI } from "@google/genai";
import {
  buildTutorSystemInstruction,
  buildTutorUserPrompt,
  getAiTutorSetupGuide,
  type AiFallbackErrorCode,
  type AiModePreference,
  type TutorContext,
  type TutorHistoryMessage,
  type TutorReplyResult,
} from "@/lib/ai-tutor-shared";
import { generateOfflineTutorReply } from "@/lib/offline-tutor";

export {
  buildTutorSystemInstruction,
  buildTutorUserPrompt,
  getAiTutorSetupGuide,
  type AiFallbackErrorCode,
  type AiModePreference,
  type TutorContext,
  type TutorHistoryMessage,
  type TutorReplyResult,
};

export interface ClassifiedAiError {
  code: AiFallbackErrorCode;
  userMessage: string;
}

/**
 * Classifies Gemini / upstream API errors into clear Vietnamese fallback notices
 * covering quota exceeded (429), invalid key (401/403), network/timeout errors, and upstream failures.
 */
export function classifyAiApiError(err: unknown): ClassifiedAiError {
  const anyErr = err as { status?: number; code?: string | number; message?: string; cause?: { code?: string; message?: string } } | null;
  const status = typeof anyErr?.status === "number" ? anyErr.status : Number(anyErr?.code);
  const rawMessage = `${anyErr?.message ?? String(err ?? "")} ${anyErr?.cause?.code ?? ""} ${anyErr?.cause?.message ?? ""}`;
  const msg = rawMessage.toLowerCase();

  if (
    status === 429 ||
    /resource_exhausted|quota|rate[\s_-]*limit|too many requests|429/.test(msg)
  ) {
    return {
      code: "quota_exceeded",
      userMessage:
        "Gemini API đã hết hạn mức miễn phí hoặc vượt giới hạn tần suất (Quota / HTTP 429). Hệ thống đã tự động chuyển sang chế độ Gợi ý thông minh Offline để bạn tiếp tục học không bị gián đoạn.",
    };
  }

  if (
    status === 401 ||
    status === 403 ||
    /api[_\s-]*key[_\s-]*invalid|invalid[_\s-]*api[_\s-]*key|permission_denied|unauthenticated|unauthorized|forbidden|401|403/.test(
      msg
    )
  ) {
    return {
      code: "invalid_key",
      userMessage:
        "Khóa GEMINI_API_KEY không hợp lệ hoặc bị từ chối quyền truy cập (HTTP 401/403). Hãy kiểm tra lại key trong .env.local — hệ thống đã tự động chuyển sang chế độ Gợi ý thông minh Offline.",
    };
  }

  if (
    /econnrefused|enotfound|etimedout|econnreset|fetch failed|network|timeout|aborted|abort|offline|socket/.test(
      msg
    )
  ) {
    return {
      code: "network_error",
      userMessage:
        "Mất kết nối mạng hoặc không thể kết nối tới máy chủ Gemini API. Hệ thống đã tự động chuyển sang chế độ Gợi ý thông minh Offline.",
    };
  }

  return {
    code: "upstream_error",
    userMessage:
      "Gemini API đang tạm thời gặp sự cố phản hồi. Hệ thống đã tự động chuyển sang chế độ Gợi ý thông minh Offline.",
  };
}

export interface GeminiClientLike {
  generate: (params: {
    apiKey: string;
    model: string;
    systemInstruction: string;
    input: string;
    previousInteractionId?: string | null;
    timeoutMs: number;
  }) => Promise<{ text: string; interactionId: string | null }>;
}

const defaultGeminiRunner: GeminiClientLike = {
  async generate({ apiKey, model, systemInstruction, input, previousInteractionId, timeoutMs }) {
    const ai = new GoogleGenAI({ apiKey });
    let timer: ReturnType<typeof setTimeout> | null = null;
    try {
      const callPromise = ai.interactions.create({
        model,
        system_instruction: systemInstruction,
        input,
        ...(previousInteractionId ? { previous_interaction_id: previousInteractionId } : {}),
      });
      const timeoutPromise = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("Gemini API request timeout (ETIMEDOUT)")), timeoutMs);
      });
      const interaction = await Promise.race([callPromise, timeoutPromise]);
      const text = interaction.output_text?.trim() || "";
      if (!text) {
        throw new Error("Empty response from Gemini API");
      }
      return {
        text,
        interactionId: interaction.id ?? null,
      };
    } finally {
      if (timer) clearTimeout(timer);
    }
  },
};

export async function askAiCodingTutor(params: {
  message: string;
  history: TutorHistoryMessage[];
  context: TutorContext;
  previousInteractionId?: string | null;
  preferredMode?: AiModePreference;
  geminiRunner?: GeminiClientLike;
}): Promise<TutorReplyResult> {
  const preferredMode = params.preferredMode ?? "auto";
  const geminiKey = process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_API_KEY?.trim();
  const compatUrl = process.env.AI_COMPATIBLE_API_URL?.trim();
  const compatKey = process.env.AI_COMPATIBLE_API_KEY?.trim();

  // Explicit offline mode requested by user -> skip external API calls immediately
  if (preferredMode === "offline") {
    return {
      configured: Boolean(geminiKey || (compatUrl && compatKey)),
      providerMode: "offline",
      provider: "Gợi ý thông minh Offline",
      reply: generateOfflineTutorReply({ message: params.message, history: params.history, context: params.context }),
      interactionId: null,
      fallbackUsed: false,
      fallbackReason: null,
      fallbackErrorCode: null,
      setupGuide: geminiKey ? undefined : getAiTutorSetupGuide(),
    };
  }

  const systemInstruction = buildTutorSystemInstruction(params.context);
  const userPrompt = buildTutorUserPrompt(params.message, params.context);

  // Priority (a): Google Gemini API strictly on server (GEMINI_API_KEY in .env.local)
  if (geminiKey) {
    const model = process.env.GEMINI_MODEL?.trim() || "gemini-4-hydrogen";
    const runner = params.geminiRunner ?? defaultGeminiRunner;

    let fullInput = userPrompt;
    if (!params.previousInteractionId && params.history.length > 0) {
      const recentTranscript = params.history
        .slice(-8)
        .map((m) => `${m.role === "user" ? "Học viên" : "Gia sư AI"}: ${m.content}`)
        .join("\n\n");
      fullInput = `Lịch sử hội thoại gần đây:\n${recentTranscript}\n\nCâu hỏi mới của học viên:\n${userPrompt}`;
    }

    try {
      const result = await runner.generate({
        apiKey: geminiKey,
        model,
        systemInstruction,
        input: fullInput,
        previousInteractionId: params.previousInteractionId,
        timeoutMs: 22_000,
      });

      return {
        configured: true,
        providerMode: "gemini",
        provider: `Google Gemini (${model})`,
        reply: result.text,
        interactionId: result.interactionId,
        fallbackUsed: false,
        fallbackReason: null,
        fallbackErrorCode: null,
      };
    } catch (err) {
      // Automatic fallback to Smart Offline Tutor on quota/key/network/upstream errors!
      const classified = classifyAiApiError(err);
      return {
        configured: true,
        providerMode: "offline",
        provider: "Gợi ý thông minh Offline (Tự động dự phòng)",
        reply: generateOfflineTutorReply({ message: params.message, history: params.history, context: params.context }),
        interactionId: null,
        fallbackUsed: true,
        fallbackReason: classified.userMessage,
        fallbackErrorCode: classified.code,
        setupGuide: classified.code === "invalid_key" ? getAiTutorSetupGuide() : undefined,
      };
    }
  }

  // Optional secondary server API if explicitly configured
  if (compatUrl && compatKey) {
    const model = process.env.AI_COMPATIBLE_MODEL?.trim() || "gpt-4o-mini";
    const messages = [
      { role: "system", content: systemInstruction },
      ...params.history.slice(-10).map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: userPrompt },
    ];

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 22_000);
      const res = await fetch(compatUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${compatKey}`,
        },
        body: JSON.stringify({ model, messages, temperature: 0.4 }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        const err = new Error(`AI API HTTP ${res.status}: ${txt.slice(0, 200)}`) as Error & { status?: number };
        err.status = res.status;
        throw err;
      }

      const json = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const reply = json.choices?.[0]?.message?.content?.trim();
      if (!reply) throw new Error("Empty response from AI API");

      return {
        configured: true,
        providerMode: "gemini",
        provider: `AI API (${model})`,
        reply,
        interactionId: null,
        fallbackUsed: false,
        fallbackReason: null,
        fallbackErrorCode: null,
      };
    } catch (err) {
      const classified = classifyAiApiError(err);
      return {
        configured: true,
        providerMode: "offline",
        provider: "Gợi ý thông minh Offline (Tự động dự phòng)",
        reply: generateOfflineTutorReply({ message: params.message, history: params.history, context: params.context }),
        interactionId: null,
        fallbackUsed: true,
        fallbackReason: classified.userMessage,
        fallbackErrorCode: classified.code,
      };
    }
  }

  // Priority (b): No API key configured -> Smart Offline Tutor works immediately out of the box!
  return {
    configured: false,
    providerMode: "offline",
    provider: "Gợi ý thông minh Offline",
    reply: generateOfflineTutorReply({ message: params.message, context: params.context }),
    interactionId: null,
    fallbackUsed: false,
    fallbackReason: null,
    fallbackErrorCode: "no_key",
    setupGuide: getAiTutorSetupGuide(),
  };
}
