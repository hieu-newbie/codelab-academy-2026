import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db/sqlite";
import { generateId } from "@/lib/crypto";
import { askAiCodingTutor } from "@/lib/ai-tutor";
import { checkRateLimit } from "@/lib/rate-limit";

const chatSchema = z.object({
  conversationId: z.string().nullable().optional(),
  message: z.string().trim().min(1, "Vui lòng nhập câu hỏi").max(6000),
  codeContext: z.string().max(25000).nullable().optional(),
  stdin: z.string().max(10000).nullable().optional(),
  stdout: z.string().max(20000).nullable().optional(),
  expectedOutput: z.string().max(10000).nullable().optional(),
  executionStatus: z.string().max(80).nullable().optional(),
  compileOutput: z.string().max(20000).nullable().optional(),
  stderr: z.string().max(10000).nullable().optional(),
  failedTestSummary: z.string().max(4000).nullable().optional(),
  problemStatement: z.string().max(8000).nullable().optional(),
  problemConstraints: z.string().max(1000).nullable().optional(),
  courseId: z.string().nullable().optional(),
  lessonId: z.string().nullable().optional(),
  exerciseId: z.string().nullable().optional(),
  mode: z.enum(["explain", "debug", "hint", "generate_practice", "general"]).optional().default("general"),
  preferredMode: z.enum(["auto", "gemini", "offline", "webllm"]).optional().default("auto"),
  // Allows saving locally-generated WebLLM assistant turns into user's conversation history
  clientGeneratedReply: z.string().max(25000).nullable().optional(),
  clientProviderLabel: z.string().max(120).nullable().optional(),
});

export async function POST(request: Request) {
  const { user, errorResponse } = await requireUser();
  if (errorResponse || !user) return errorResponse;

  const rl = checkRateLimit(`ai:${user.id}`, 30, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Bạn đang gửi yêu cầu tới Gia sư AI quá nhanh. Vui lòng thử lại sau ${rl.retryAfterSec}s.` },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Yêu cầu gửi AI Tutor không hợp lệ." },
      { status: 400 }
    );
  }

  const db = getDb();
  const now = new Date().toISOString();

  // Resolve or create conversation owned strictly by user
  let conversationId = parsed.data.conversationId ?? null;
  let lastInteractionId: string | null = null;
  let courseId = parsed.data.courseId ?? null;
  let lessonId = parsed.data.lessonId ?? null;
  let exerciseId = parsed.data.exerciseId ?? null;

  if (conversationId) {
    const existing = db
      .prepare("SELECT * FROM ai_conversations WHERE id = ? AND user_id = ?")
      .get(conversationId, user.id) as
      | {
          id: string;
          course_id: string | null;
          lesson_id: string | null;
          exercise_id: string | null;
          last_interaction_id: string | null;
        }
      | undefined;

    if (!existing) {
      return NextResponse.json({ error: "Không tìm thấy cuộc trò chuyện hợp lệ." }, { status: 404 });
    }
    lastInteractionId = existing.last_interaction_id;
    courseId = courseId ?? existing.course_id;
    lessonId = lessonId ?? existing.lesson_id;
    exerciseId = exerciseId ?? existing.exercise_id;
  } else {
    conversationId = generateId("conv");
    const autoTitle = parsed.data.message.slice(0, 60) + (parsed.data.message.length > 60 ? "..." : "");
    db.prepare(`
      INSERT INTO ai_conversations (id, user_id, title, course_id, lesson_id, exercise_id, last_interaction_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?)
    `).run(conversationId, user.id, autoTitle, courseId, lessonId, exerciseId, now, now);
  }

  // Personalization + full problem statement lookup from database (never leaking solution_code!)
  let courseTitle: string | null = null;
  let courseLanguage: string | null = null;
  let lessonTitle: string | null = null;
  let lessonOrder: number | null = null;
  let exerciseTitle: string | null = null;
  let exerciseDifficulty: string | null = null;
  let problemStatement: string | null = parsed.data.problemStatement ?? null;
  let problemConstraints: string | null = parsed.data.problemConstraints ?? null;
  let sampleInput: string | null = null;
  let sampleOutput: string | null = null;
  let problemHints: string[] | null = null;

  if (!lessonId && !exerciseId) {
    const activeLesson = db.prepare(`
      SELECT l.id, l.course_id
      FROM lesson_progress lp
      JOIN lessons l ON l.id = lp.lesson_id
      WHERE lp.user_id = ?
      ORDER BY lp.updated_at DESC
      LIMIT 1
    `).get(user.id) as { id: string; course_id: string } | undefined;
    if (activeLesson) {
      lessonId = activeLesson.id;
      courseId = courseId ?? activeLesson.course_id;
    }
  }

  if (lessonId) {
    const l = db.prepare(`
      SELECT l.title, l.language, l.content_json, c.title as course_title, cs.sort_order as section_order
      FROM lessons l
      JOIN courses c ON c.id = l.course_id
      JOIN course_sections cs ON cs.id = l.section_id
      WHERE l.id = ? OR l.slug = ?
    `).get(lessonId, lessonId) as
      | { title: string; language: string; content_json: string; course_title: string; section_order: number }
      | undefined;
    if (l) {
      lessonTitle = l.title;
      courseTitle = l.course_title;
      courseLanguage = l.language;
      lessonOrder = l.section_order;
      try {
        const parsedContent = JSON.parse(l.content_json) as {
          practice?: {
            title?: string;
            prompt?: string;
            sampleInput?: string;
            expectedOutput?: string;
            hints?: string[];
          };
        };
        if (parsedContent.practice) {
          problemStatement = problemStatement ?? parsedContent.practice.prompt ?? null;
          sampleInput = parsedContent.practice.sampleInput ?? null;
          sampleOutput = parsedContent.practice.expectedOutput ?? null;
          problemHints = parsedContent.practice.hints ?? null;
        }
      } catch {
        // ignore malformed json
      }
    }
  } else if (courseId) {
    const c = db.prepare("SELECT title, language FROM courses WHERE id = ? OR slug = ?").get(courseId, courseId) as
      | { title: string; language: string }
      | undefined;
    if (c) {
      courseTitle = c.title;
      courseLanguage = c.language;
    }
  }

  if (exerciseId) {
    const ex = db
      .prepare(
        "SELECT title, difficulty, language, description, input_format, output_format, constraints, sample_input, sample_output, hints_json FROM exercises WHERE id = ? OR slug = ?"
      )
      .get(exerciseId, exerciseId) as
      | {
          title: string;
          difficulty: string;
          language: string;
          description: string;
          input_format: string;
          output_format: string;
          constraints: string;
          sample_input: string;
          sample_output: string;
          hints_json: string;
        }
      | undefined;
    if (ex) {
      exerciseTitle = ex.title;
      exerciseDifficulty = ex.difficulty;
      courseLanguage = courseLanguage ?? ex.language;
      problemStatement =
        problemStatement ??
        `${ex.description}\nInput: ${ex.input_format}\nOutput: ${ex.output_format}`;
      problemConstraints = problemConstraints ?? ex.constraints;
      sampleInput = ex.sample_input;
      sampleOutput = ex.sample_output;
      try {
        problemHints = JSON.parse(ex.hints_json || "[]");
      } catch {
        problemHints = null;
      }
    }
  }

  const history = db
    .prepare("SELECT role, content FROM ai_messages WHERE conversation_id = ? ORDER BY created_at ASC")
    .all(conversationId) as Array<{ role: "user" | "assistant"; content: string }>;

  // Save user message first
  const userMsgId = generateId("msg");
  db.prepare(`
    INSERT INTO ai_messages (id, conversation_id, role, content, code_context, created_at)
    VALUES (?, ?, 'user', ?, ?, ?)
  `).run(userMsgId, conversationId, parsed.data.message, parsed.data.codeContext ?? null, now);

  // If browser WebLLM already generated the reply locally, just persist it cleanly into conversation history
  if (parsed.data.clientGeneratedReply?.trim()) {
    const replyNow = new Date().toISOString();
    const assistantMsgId = generateId("msg");
    db.prepare(`
      INSERT INTO ai_messages (id, conversation_id, role, content, code_context, created_at)
      VALUES (?, ?, 'assistant', ?, NULL, ?)
    `).run(assistantMsgId, conversationId, parsed.data.clientGeneratedReply.trim(), replyNow);

    db.prepare("UPDATE ai_conversations SET updated_at = ? WHERE id = ?").run(replyNow, conversationId);

    return NextResponse.json({
      configured: true,
      conversationId,
      providerMode: "webllm",
      provider: parsed.data.clientProviderLabel || "WebLLM (Trong trình duyệt)",
      fallbackUsed: false,
      fallbackReason: null,
      userMessage: {
        id: userMsgId,
        conversation_id: conversationId,
        role: "user",
        content: parsed.data.message,
        code_context: parsed.data.codeContext ?? null,
        created_at: now,
      },
      assistantMessage: {
        id: assistantMsgId,
        conversation_id: conversationId,
        role: "assistant",
        content: parsed.data.clientGeneratedReply.trim(),
        code_context: null,
        created_at: replyNow,
      },
    });
  }

  const aiResult = await askAiCodingTutor({
    message: parsed.data.message,
    history,
    previousInteractionId: lastInteractionId,
    preferredMode: parsed.data.preferredMode,
    context: {
      courseTitle,
      courseLanguage,
      lessonTitle,
      lessonOrder,
      exerciseTitle,
      exerciseDifficulty,
      problemStatement,
      problemConstraints,
      sampleInput,
      sampleOutput,
      problemHints,
      codeContext: parsed.data.codeContext ?? null,
      stdin: parsed.data.stdin ?? null,
      stdout: parsed.data.stdout ?? null,
      expectedOutput: parsed.data.expectedOutput ?? sampleOutput ?? null,
      executionStatus: parsed.data.executionStatus ?? null,
      compileOutput: parsed.data.compileOutput ?? null,
      stderr: parsed.data.stderr ?? null,
      failedTestSummary: parsed.data.failedTestSummary ?? null,
      mode: parsed.data.mode,
    },
  });

  const replyNow = new Date().toISOString();
  const assistantMsgId = generateId("msg");
  db.prepare(`
    INSERT INTO ai_messages (id, conversation_id, role, content, code_context, created_at)
    VALUES (?, ?, 'assistant', ?, NULL, ?)
  `).run(assistantMsgId, conversationId, aiResult.reply, replyNow);

  db.prepare(`
    UPDATE ai_conversations
    SET last_interaction_id = COALESCE(?, last_interaction_id), updated_at = ?
    WHERE id = ?
  `).run(aiResult.interactionId ?? null, replyNow, conversationId);

  return NextResponse.json({
    configured: aiResult.configured,
    conversationId,
    providerMode: aiResult.providerMode,
    provider: aiResult.provider,
    fallbackUsed: Boolean(aiResult.fallbackUsed),
    fallbackReason: aiResult.fallbackReason ?? null,
    fallbackErrorCode: aiResult.fallbackErrorCode ?? null,
    setupGuide: aiResult.setupGuide,
    userMessage: {
      id: userMsgId,
      conversation_id: conversationId,
      role: "user",
      content: parsed.data.message,
      code_context: parsed.data.codeContext ?? null,
      created_at: now,
    },
    assistantMessage: {
      id: assistantMsgId,
      conversation_id: conversationId,
      role: "assistant",
      content: aiResult.reply,
      code_context: null,
      created_at: replyNow,
    },
  });
}
