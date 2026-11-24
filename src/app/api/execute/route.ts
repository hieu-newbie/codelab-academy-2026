import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { executeWithJudge0 } from "@/lib/judge0";
import { checkRateLimit } from "@/lib/rate-limit";

const executeSchema = z.object({
  language: z.enum(["cpp"]),
  sourceCode: z.string().min(1, "Mã nguồn không được để trống").max(65536),
  stdin: z.string().max(65536).optional().default(""),
});

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    const rateKey = user ? `exec:${user.id}` : `exec:${request.headers.get("x-forwarded-for") || "anon"}`;
    const rl = checkRateLimit(rateKey, 20, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Bạn đang chạy code quá nhanh. Vui lòng chờ ${rl.retryAfterSec}s.` },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = executeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Yêu cầu thực thi không hợp lệ." },
        { status: 400 }
      );
    }

    const result = await executeWithJudge0({
      sourceCode: parsed.data.sourceCode,
      stdin: parsed.data.stdin,
      cpuTimeLimitSec: 2,
      memoryLimitKb: 262144,
    });

    if (!result.configured) {
      return NextResponse.json(result, { status: 503 });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("Execute API error:", err);
    return NextResponse.json({ error: "Lỗi máy chủ khi gọi dịch vụ thực thi code." }, { status: 500 });
  }
}
