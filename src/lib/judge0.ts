import type { SubmissionStatus } from "@/types/codelab";

export interface Judge0ExecutionRequest {
  sourceCode: string;
  stdin?: string;
  languageId?: number;
  cpuTimeLimitSec?: number;
  memoryLimitKb?: number;
}

export interface Judge0ExecutionResult {
  configured: boolean;
  status: SubmissionStatus;
  stdout: string;
  stderr: string;
  compileOutput: string;
  timeMs: number | null;
  memoryKb: number | null;
  message?: string;
  setupGuide?: string[];
}

export function normalizeOutput(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/g, ""))
    .join("\n")
    .replace(/\n+$/g, "");
}

export function outputsMatch(actual: string, expected: string): boolean {
  return normalizeOutput(actual) === normalizeOutput(expected);
}

function toBase64(value: string): string {
  return Buffer.from(value, "utf8").toString("base64");
}

function fromBase64(value: string | null | undefined): string {
  if (!value) return "";
  try {
    return Buffer.from(value, "base64").toString("utf8");
  } catch {
    return value;
  }
}

export function mapJudge0Status(
  statusId: number,
  memoryKb: number | null,
  memoryLimitKb: number
): SubmissionStatus {
  if (memoryKb !== null && memoryKb > memoryLimitKb) {
    return "Memory Limit Exceeded";
  }
  switch (statusId) {
    case 3:
      return "Accepted";
    case 4:
      return "Wrong Answer";
    case 5:
      return "Time Limit Exceeded";
    case 6:
      return "Compilation Error";
    case 7:
    case 8:
    case 9:
    case 10:
    case 11:
    case 12:
      return "Runtime Error";
    case 13:
      return "Runtime Error";
    default:
      return "Runtime Error";
  }
}

export function getJudge0SetupGuide(): string[] {
  return [
    "Mở tệp .env.local (tạo từ .env.example) ở thư mục gốc dự án.",
    "Cách 1 (Self-hosted Docker): Chạy Judge0 CE bằng Docker rồi đặt JUDGE0_API_URL=http://localhost:2358 (và JUDGE0_AUTH_TOKEN nếu có).",
    "Cách 2 (RapidAPI): Đăng ký Judge0 CE trên RapidAPI rồi đặt JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com và JUDGE0_RAPIDAPI_KEY=<your-key>.",
    "Khởi động lại máy chủ Next.js (npm run dev). CODELAB sẽ tự động biên dịch và chấm mã C++ thật trong môi trường sandbox cách ly!"
  ];
}

/**
 * Executes C++ code strictly via an external isolated Judge0 Sandbox.
 * NEVER executes untrusted user C++ code directly on the main application server.
 * NEVER fakes or simulates a grading verdict when Judge0 is not configured.
 */
export async function executeWithJudge0(
  req: Judge0ExecutionRequest
): Promise<Judge0ExecutionResult> {
  const baseUrl = process.env.JUDGE0_API_URL?.trim().replace(/\/+$/, "");

  if (!baseUrl) {
    return {
      configured: false,
      status: "Not Configured",
      stdout: "",
      stderr: "",
      compileOutput: "",
      timeMs: null,
      memoryKb: null,
      message:
        "Dịch vụ sandbox thực thi C++ (Judge0) chưa được cấu hình. Vì lý do bảo mật, CODELAB không thực thi mã C++ người dùng trực tiếp trên máy chủ web và không giả lập kết quả chấm bài.",
      setupGuide: getJudge0SetupGuide(),
    };
  }

  const languageId = req.languageId ?? Number(process.env.JUDGE0_CPP_LANGUAGE_ID || "54");
  const cpuTimeLimit = Math.min(Math.max(req.cpuTimeLimitSec ?? 2, 0.5), 5);
  const memoryLimit = Math.min(Math.max(req.memoryLimitKb ?? 262144, 65536), 512000);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (process.env.JUDGE0_AUTH_TOKEN?.trim()) {
    headers["X-Auth-Token"] = process.env.JUDGE0_AUTH_TOKEN.trim();
  }
  if (process.env.JUDGE0_RAPIDAPI_KEY?.trim()) {
    headers["X-RapidAPI-Key"] = process.env.JUDGE0_RAPIDAPI_KEY.trim();
    headers["X-RapidAPI-Host"] =
      process.env.JUDGE0_RAPIDAPI_HOST?.trim() || "judge0-ce.p.rapidapi.com";
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(
      `${baseUrl}/submissions?base64_encoded=true&wait=true`,
      {
        method: "POST",
        headers,
        signal: controller.signal,
        body: JSON.stringify({
          source_code: toBase64(req.sourceCode),
          language_id: languageId,
          stdin: toBase64(req.stdin ?? ""),
          cpu_time_limit: cpuTimeLimit,
          wall_time_limit: cpuTimeLimit + 3,
          memory_limit: memoryLimit,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      return {
        configured: true,
        status: "Runtime Error",
        stdout: "",
        stderr: `Judge0 API trả về mã lỗi HTTP ${response.status}: ${errorText.slice(0, 300)}`,
        compileOutput: "",
        timeMs: null,
        memoryKb: null,
      };
    }

    const data = (await response.json()) as {
      stdout?: string | null;
      stderr?: string | null;
      compile_output?: string | null;
      message?: string | null;
      time?: string | null;
      memory?: number | null;
      status?: { id: number; description: string };
    };

    const stdout = fromBase64(data.stdout);
    const stderr = fromBase64(data.stderr) || fromBase64(data.message);
    const compileOutput = fromBase64(data.compile_output);
    const timeMs = data.time ? Math.round(parseFloat(data.time) * 1000) : null;
    const memoryKb = typeof data.memory === "number" ? data.memory : null;
    const statusId = data.status?.id ?? 13;

    const status = mapJudge0Status(statusId, memoryKb, memoryLimit);

    return {
      configured: true,
      status,
      stdout,
      stderr,
      compileOutput,
      timeMs,
      memoryKb,
    };
  } catch (err) {
    const isAbort = err instanceof Error && err.name === "AbortError";
    return {
      configured: true,
      status: isAbort ? "Time Limit Exceeded" : "Runtime Error",
      stdout: "",
      stderr: isAbort
        ? "Quá thời gian kết nối đến máy chủ Judge0 (15s)."
        : `Không thể kết nối tới Judge0 tại ${baseUrl}: ${err instanceof Error ? err.message : "Lỗi mạng"}`,
      compileOutput: "",
      timeMs: null,
      memoryKb: null,
    };
  } finally {
    clearTimeout(timeout);
  }
}
