import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cachedAdminClient: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() &&
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  );
}

export function getSupabaseAdminClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!cachedAdminClient) {
    cachedAdminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }
  return cachedAdminClient;
}

export function isJudge0Configured(): boolean {
  return Boolean(process.env.JUDGE0_API_URL?.trim());
}

export function getAiProviderStatus(): {
  configured: boolean;
  default_mode: "gemini" | "offline";
  offline_ready: boolean;
  provider: string;
} {
  if (process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_API_KEY?.trim()) {
    return {
      configured: true,
      default_mode: "gemini",
      offline_ready: true,
      provider: `Google Gemini (${process.env.GEMINI_MODEL?.trim() || "gemini-4-hydrogen"})`,
    };
  }
  if (process.env.AI_COMPATIBLE_API_URL?.trim() && process.env.AI_COMPATIBLE_API_KEY?.trim()) {
    return {
      configured: true,
      default_mode: "gemini",
      offline_ready: true,
      provider: `AI API (${process.env.AI_COMPATIBLE_MODEL?.trim() || "custom"})`,
    };
  }
  return {
    configured: false,
    default_mode: "offline",
    offline_ready: true,
    provider: "Gợi ý thông minh Offline",
  };
}

export function getSystemConfigStatus() {
  const ai = getAiProviderStatus();
  return {
    database_mode: isSupabaseConfigured() ? ("supabase" as const) : ("sqlite_local" as const),
    judge0_configured: isJudge0Configured(),
    ai_tutor_configured: ai.configured,
    ai_default_mode: ai.default_mode,
    ai_offline_ready: ai.offline_ready,
    ai_provider: ai.provider,
  };
}
