export type AiProviderMode = "gemini" | "offline" | "webllm";
export type AiModePreference = "auto" | "gemini" | "offline" | "webllm";

export type AiFallbackErrorCode =
  | "no_key"
  | "quota_exceeded"
  | "invalid_key"
  | "network_error"
  | "webgpu_unsupported"
  | "webllm_error"
  | "upstream_error";

export interface TutorContext {
  courseTitle?: string | null;
  courseLanguage?: string | null;
  lessonTitle?: string | null;
  lessonOrder?: number | null;
  exerciseTitle?: string | null;
  exerciseDifficulty?: string | null;
  problemStatement?: string | null;
  problemConstraints?: string | null;
  sampleInput?: string | null;
  sampleOutput?: string | null;
  problemHints?: string[] | null;
  codeContext?: string | null;
  stdin?: string | null;
  stdout?: string | null;
  expectedOutput?: string | null;
  executionStatus?: string | null;
  compileOutput?: string | null;
  stderr?: string | null;
  failedTestSummary?: string | null;
  mode?: "explain" | "debug" | "hint" | "generate_practice" | "general";
}

export interface TutorHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export interface TutorReplyResult {
  configured: boolean;
  providerMode: AiProviderMode;
  provider: string;
  reply: string;
  interactionId?: string | null;
  fallbackUsed?: boolean;
  fallbackReason?: string | null;
  fallbackErrorCode?: AiFallbackErrorCode | null;
  setupGuide?: string[];
}

export function getAiModeDisplayLabel(mode: AiProviderMode): string {
  switch (mode) {
    case "gemini":
      return "Gemini";
    case "webllm":
      return "Trong trình duyệt";
    default:
      return "Offline";
  }
}

export function getAiTutorSetupGuide(): string[] {
  return [
    "Truy cập Google AI Studio (https://aistudio.google.com/apikey) và bấm 'Create API key' để lấy khóa Gemini miễn phí.",
    "Mở tệp .env.local tại thư mục gốc dự án CODELAB và thêm dòng: GEMINI_API_KEY=<khóa_API_của_bạn>",
    "Khởi động lại máy chủ Next.js (npm run dev hoặc npm run start). Khóa API chỉ được gọi ở phía server, tuyệt đối không lộ ra trình duyệt.",
  ];
}

export function numberCodeLines(code: string): string {
  return code
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line, idx) => `${String(idx + 1).padStart(2, " ")} | ${line}`)
    .join("\n");
}

export function buildTutorSystemInstruction(ctx: TutorContext): string {
  const lines = [
    "Bạn là Gia sư Lập trình AI (AI Coding Tutor) chính thức của nền tảng học lập trình CODELAB.",
    "Ngôn ngữ trả lời bắt buộc: Tiếng Việt rõ ràng, thân thiện, chuẩn sư phạm, có cấu trúc Markdown dễ đọc.",
    "",
    "NGUYÊN TẮC SƯ PHẠM BẮT BUỘC:",
    "1. Đóng vai người gia sư kiên nhẫn: giải thích từ trực giác dễ hiểu, giải nghĩa thuật ngữ chuyên ngành khi xuất hiện lần đầu.",
    "2. GỢI Ý TỪNG BƯỚC — KHÔNG ĐƯA LỜI GIẢI HOÀN CHỈNH NGAY: Khi học viên hỏi bài tập hoặc sửa lỗi, hãy phân tích đề, chỉ ra đúng dòng/nguyên nhân lỗi và hướng dẫn từng bước để học viên tự sửa. Tuyệt đối KHÔNG viết sẵn toàn bộ chương trình lời giải hoàn chỉnh ngay lập tức.",
    "3. Khi có lỗi biên dịch hoặc sai kết quả (Wrong Answer / TLE / Runtime Error): giải thích TẠI SAO sai dựa trên đề bài, input, output thực tế và thông báo lỗi kèm theo, rồi đưa 2–3 bước kiểm tra cụ thể.",
    "4. Khi người học yêu cầu tạo bài tập: sinh đề bài rõ Input/Output/Ví dụ phù hợp độ khó kèm gợi ý định hướng.",
    "5. CÁ NHÂN HÓA THEO TIẾN ĐỘ HỌC:",
  ];

  if (ctx.courseTitle) {
    lines.push(`- Khóa học hiện tại: ${ctx.courseTitle} (${ctx.courseLanguage ?? ""}).`);
  }
  if (ctx.lessonTitle) {
    lines.push(
      `- Bài học hiện tại: ${ctx.lessonTitle}${ctx.lessonOrder ? ` (Chương/bài thứ ${ctx.lessonOrder})` : ""}.`
    );
    lines.push(
      "- QUAN TRỌNG: Chỉ sử dụng kiến thức từ bài học hiện tại trở về trước. Không sử dụng khái niệm nâng cao mà học viên chưa học."
    );
  }
  if (ctx.exerciseTitle) {
    lines.push(
      `- Bài tập đang làm: ${ctx.exerciseTitle}${ctx.exerciseDifficulty ? ` (Độ khó: ${ctx.exerciseDifficulty})` : ""}.`
    );
  }
  if (ctx.mode) {
    const modeNote: Record<NonNullable<TutorContext["mode"]>, string> = {
      explain: "Chế độ hiện tại: Giải thích kiến thức / giải thích từng dòng code thật dễ hiểu.",
      debug: "Chế độ hiện tại: Phân tích nguyên nhân lỗi (kèm số dòng) và gợi ý hướng sửa từng bước, không đưa đáp án hoàn chỉnh.",
      hint: "Chế độ hiện tại: Gợi ý tư duy giải bài từng bước, tuyệt đối không đưa toàn bộ lời giải ngay.",
      generate_practice: "Chế độ hiện tại: Tạo thêm bài tập thực hành hoặc câu hỏi kiểm tra nhanh.",
      general: "Chế độ hiện tại: Gia sư lập trình toàn diện, gợi ý từng bước.",
    };
    lines.push(`- ${modeNote[ctx.mode]}`);
  }

  return lines.join("\n");
}

export function buildTutorUserPrompt(message: string, ctx: TutorContext): string {
  const parts: string[] = [message.trim()];

  if (ctx.exerciseTitle || ctx.problemStatement || ctx.problemConstraints) {
    const problemLines: string[] = ["--- NGỮ CẢNH ĐỀ BÀI ---"];
    if (ctx.exerciseTitle) problemLines.push(`Tên bài: ${ctx.exerciseTitle}`);
    if (ctx.problemStatement) problemLines.push(`Mô tả: ${ctx.problemStatement}`);
    if (ctx.problemConstraints) problemLines.push(`Giới hạn: ${ctx.problemConstraints}`);
    if (ctx.sampleInput) problemLines.push(`Input mẫu: ${ctx.sampleInput}`);
    if (ctx.sampleOutput) problemLines.push(`Output mẫu: ${ctx.sampleOutput}`);
    parts.push(problemLines.join("\n"));
  }

  if (ctx.codeContext?.trim()) {
    parts.push(
      `--- CODE HIỆN TẠI CỦA HỌC VIÊN (có số dòng) ---\n\`\`\`${ctx.courseLanguage || "cpp"}\n${numberCodeLines(
        ctx.codeContext.trim()
      )}\n\`\`\``
    );
  }

  const runtimeLines: string[] = [];
  if (ctx.stdin?.trim()) runtimeLines.push(`Input (stdin):\n${ctx.stdin.trim()}`);
  if (ctx.stdout?.trim()) runtimeLines.push(`Output thực tế (stdout):\n${ctx.stdout.trim()}`);
  if (ctx.expectedOutput?.trim()) runtimeLines.push(`Output mong đợi (test công khai):\n${ctx.expectedOutput.trim()}`);
  if (ctx.executionStatus && ctx.executionStatus !== "Idle") {
    runtimeLines.push(`Trạng thái chạy/chấm: ${ctx.executionStatus}`);
  }
  if (ctx.compileOutput?.trim()) {
    runtimeLines.push(`Lỗi biên dịch:\n${ctx.compileOutput.trim()}`);
  }
  if (ctx.stderr?.trim()) {
    runtimeLines.push(`Lỗi thực thi (stderr):\n${ctx.stderr.trim()}`);
  }
  if (ctx.failedTestSummary?.trim()) {
    runtimeLines.push(`Chi tiết test sai:\n${ctx.failedTestSummary.trim()}`);
  }

  if (runtimeLines.length > 0) {
    parts.push(`--- KẾT QUẢ CHẠY & LỖI GẦN NHẤT ---\n${runtimeLines.join("\n\n")}`);
  }

  return parts.join("\n\n");
}
