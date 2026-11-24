"use client";

import React, { useState } from "react";
import { Plus, Save, Trash2, X } from "lucide-react";
import { useToast } from "@/components/providers";
import { Button, Card } from "@/components/ui/primitives";
import type { CourseLanguage, LessonContent } from "@/types/codelab";

interface AdminCourse {
  id: string;
  title: string;
  language: CourseLanguage;
}

interface AdminSection {
  id: string;
  course_id: string;
  title: string;
}

interface AdminLessonRow {
  id: string;
  course_id: string;
  section_id: string;
  slug: string;
  title: string;
  summary: string;
  estimated_minutes: number;
  xp_reward: number;
  language: CourseLanguage;
  content_json: string;
}

export function LessonCmsEditor({
  courses,
  sections,
  editingLesson,
  onSaved,
  onCancel,
}: {
  courses: AdminCourse[];
  sections: AdminSection[];
  editingLesson: AdminLessonRow | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const { toast } = useToast();
  const parsed: LessonContent | null = editingLesson
    ? (() => {
        try {
          return JSON.parse(editingLesson.content_json) as LessonContent;
        } catch {
          return null;
        }
      })()
    : null;

  const defaultCourseId = editingLesson?.course_id || courses[0]?.id || "";
  const courseSections = (cid: string) => sections.filter((s) => s.course_id === cid);

  const [courseId, setCourseId] = useState(defaultCourseId);
  const [sectionId, setSectionId] = useState(
    editingLesson?.section_id || courseSections(defaultCourseId)[0]?.id || ""
  );
  const [title, setTitle] = useState(editingLesson?.title || "");
  const [slug, setSlug] = useState(editingLesson?.slug || "");
  const [summary, setSummary] = useState(editingLesson?.summary || "");
  const [language, setLanguage] = useState<CourseLanguage>(editingLesson?.language || "cpp");
  const [estimatedMinutes, setEstimatedMinutes] = useState(editingLesson?.estimated_minutes || 15);
  const [xpReward, setXpReward] = useState(editingLesson?.xp_reward || 60);

  const [introduction, setIntroduction] = useState(parsed?.introduction || "");
  const [theoryHeading, setTheoryHeading] = useState(parsed?.theoryBlocks?.[0]?.heading || "1. Kiến thức cốt lõi");
  const [theoryBody, setTheoryBody] = useState(
    parsed?.theoryBlocks?.[0]?.paragraphs?.join("\n\n") || ""
  );
  const [exampleCode, setExampleCode] = useState(
    parsed?.examples?.[0]?.code || `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello CODELAB!" << endl;\n    return 0;\n}`
  );
  const [exampleOutput, setExampleOutput] = useState(parsed?.examples?.[0]?.expectedOutput || "Hello CODELAB!");
  const [practicePrompt, setPracticePrompt] = useState(parsed?.practice?.prompt || "");
  const [starterCode, setStarterCode] = useState(
    parsed?.practice?.starterCode || `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Viết code thực hành tại đây\n    return 0;\n}`
  );
  const [solutionCode, setSolutionCode] = useState(parsed?.practice?.solutionCode || "");
  const [quizQuestion, setQuizQuestion] = useState(parsed?.checkpointQuiz?.question || "");
  const [quizOptions, setQuizOptions] = useState(
    parsed?.checkpointQuiz?.options?.join("\n") || "Đáp án A\nĐáp án B\nĐáp án C\nĐáp án D"
  );
  const [quizCorrectIdx, setQuizCorrectIdx] = useState(parsed?.checkpointQuiz?.correctIndex ?? 0);
  const [quizExplanation, setQuizExplanation] = useState(parsed?.checkpointQuiz?.explanation || "");
  const [saving, setSaving] = useState(false);

  const handleCourseChange = (nextCourseId: string) => {
    setCourseId(nextCourseId);
    const matching = courseSections(nextCourseId);
    setSectionId(matching[0]?.id || "");
    const c = courses.find((x) => x.id === nextCourseId);
    if (c) setLanguage(c.language);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const nextContent: LessonContent = {
      introduction: introduction.trim() || summary.trim() || title,
      objectives: parsed?.objectives?.length
        ? parsed.objectives
        : [`Hiểu và vận dụng tốt kiến thức bài "${title}".`, "Thực hành viết và chạy code trực tiếp."],
      theoryBlocks: [
        {
          heading: theoryHeading.trim() || "1. Lý thuyết trọng tâm",
          paragraphs: theoryBody
            .split(/\n{2,}/)
            .map((p) => p.trim())
            .filter(Boolean),
          glossary: parsed?.theoryBlocks?.[0]?.glossary,
          callout: parsed?.theoryBlocks?.[0]?.callout,
        },
        ...(parsed?.theoryBlocks?.slice(1) ?? []),
      ],
      examples: [
        {
          title: parsed?.examples?.[0]?.title || "Ví dụ minh họa",
          level: parsed?.examples?.[0]?.level || "Cơ bản",
          description: parsed?.examples?.[0]?.description || "Đoạn mã minh họa cú pháp cốt lõi của bài học.",
          code: exampleCode,
          expectedOutput: exampleOutput,
          lineExplanations: parsed?.examples?.[0]?.lineExplanations || [
            { line: "Tổng quan", code: "main()", explanation: "Chạy thử trực tiếp trên Monaco Editor để quan sát kết quả." },
          ],
        },
        ...(parsed?.examples?.slice(1) ?? []),
      ],
      commonMistakes: parsed?.commonMistakes || [],
      diagram: parsed?.diagram,
      practice: {
        title: parsed?.practice?.title || `Thực hành: ${title}`,
        prompt: practicePrompt.trim() || "Hãy chỉnh sửa đoạn code mẫu và chạy thử trên trình soạn thảo.",
        starterCode,
        sampleInput: parsed?.practice?.sampleInput || "",
        expectedOutput: exampleOutput,
        hints: parsed?.practice?.hints?.length ? parsed.practice.hints : ["Đọc lại ví dụ phía trên và kiểm tra dấu chấm phẩy."],
        solutionCode: solutionCode.trim() || exampleCode,
      },
      checkpointQuiz: {
        question: quizQuestion.trim() || `Câu hỏi ôn tập nhanh về ${title}`,
        options: quizOptions
          .split("\n")
          .map((o) => o.trim())
          .filter(Boolean),
        correctIndex: quizCorrectIdx,
        explanation: quizExplanation.trim() || "Xem lại phần lý thuyết cốt lõi ở đầu bài học.",
      },
      takeaways: parsed?.takeaways?.length
        ? parsed.takeaways
        : [`Đã nắm vững kiến thức cốt lõi của bài "${title}".`],
    };

    try {
      const res = await fetch("/api/admin/lessons", {
        method: editingLesson ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingLesson?.id,
          course_id: courseId,
          section_id: sectionId,
          slug: slug.trim().toLowerCase(),
          title: title.trim(),
          summary: summary.trim(),
          estimated_minutes: Number(estimatedMinutes),
          xp_reward: Number(xpReward),
          language,
          content: nextContent,
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        toast({ title: j.error || "Không thể lưu bài học", variant: "error" });
        return;
      }
      toast({
        title: editingLesson ? "Đã cập nhật nội dung bài học!" : "Đã tạo bài học mới thành công!",
        variant: "success",
      });
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-6 border-blue-500/35">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold">
          {editingLesson ? `Biên tập bài học: ${editingLesson.title}` : "Tạo bài học mới (Không cần sửa code Frontend)"}
        </h3>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 cursor-pointer">
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block font-semibold mb-1">Khóa học</label>
            <select
              value={courseId}
              onChange={(e) => handleCourseChange(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-semibold mb-1">Chương (Section)</label>
            <select
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
            >
              {courseSections(courseId).map((s) => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-semibold mb-1">Ngôn ngữ Editor</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as CourseLanguage)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
            >
              <option value="cpp">C++</option>
              <option value="html">HTML</option>
              <option value="css">CSS</option>
              <option value="javascript">JavaScript</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <label className="block font-semibold mb-1">Tiêu đề bài học</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Con trỏ nâng cao và Cấp phát động"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Slug URL (a-z, 0-9, -)</label>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="con-tro-nang-cao"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 font-mono"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold mb-1">Phút</label>
              <input
                type="number"
                min={3}
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">XP</label>
              <input
                type="number"
                min={10}
                value={xpReward}
                onChange={(e) => setXpReward(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block font-semibold mb-1">Tóm tắt ngắn</label>
          <input
            type="text"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold mb-1">Giới thiệu bài học</label>
            <textarea
              rows={3}
              required
              value={introduction}
              onChange={(e) => setIntroduction(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Tiêu đề & Nội dung lý thuyết chính</label>
            <input
              type="text"
              value={theoryHeading}
              onChange={(e) => setTheoryHeading(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 mb-2"
            />
            <textarea
              rows={3}
              required
              value={theoryBody}
              onChange={(e) => setTheoryBody(e.target.value)}
              placeholder="Cách nhau 1 dòng trống để tách đoạn..."
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold mb-1">Code ví dụ mẫu</label>
            <textarea
              rows={5}
              value={exampleCode}
              onChange={(e) => setExampleCode(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-950 text-slate-100 p-2.5 font-mono"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Khung code thực hành (Starter Code)</label>
            <textarea
              rows={5}
              value={starterCode}
              onChange={(e) => setStarterCode(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-950 text-slate-100 p-2.5 font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block font-semibold mb-1">Đề bài thực hành</label>
            <textarea
              rows={2}
              value={practicePrompt}
              onChange={(e) => setPracticePrompt(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Output mẫu kỳ vọng</label>
            <textarea
              rows={2}
              value={exampleOutput}
              onChange={(e) => setExampleOutput(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 font-mono"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Code lời giải tham khảo</label>
            <textarea
              rows={2}
              value={solutionCode}
              onChange={(e) => setSolutionCode(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-950 text-emerald-300 p-2.5 font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
          <div>
            <label className="block font-semibold mb-1">Câu hỏi Checkpoint cuối bài</label>
            <input
              type="text"
              value={quizQuestion}
              onChange={(e) => setQuizQuestion(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Các lựa chọn (mỗi dòng 1 lựa chọn)</label>
            <textarea
              rows={3}
              value={quizOptions}
              onChange={(e) => setQuizOptions(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2"
            />
          </div>
          <div className="space-y-2">
            <div>
              <label className="block font-semibold mb-1">Chỉ số đáp án đúng (0, 1, 2, 3)</label>
              <input
                type="number"
                min={0}
                max={5}
                value={quizCorrectIdx}
                onChange={(e) => setQuizCorrectIdx(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Giải thích đáp án</label>
              <input
                type="text"
                value={quizExplanation}
                onChange={(e) => setQuizExplanation(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Hủy</Button>
          <Button type="submit" size="sm" loading={saving}>
            <Save className="h-3.5 w-3.5" /> Lưu bài học vào Cơ sở dữ liệu
          </Button>
        </div>
      </form>
    </Card>
  );
}

export function ExerciseCmsEditor({
  onSaved,
  onCancel,
}: {
  onSaved: () => void;
  onCancel: () => void;
}) {
  const { toast } = useToast();
  const [code, setCode] = useState("CL-013");
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Thuật toán");
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">("Easy");
  const [description, setDescription] = useState("");
  const [inputFormat, setInputFormat] = useState("Một dòng chứa số nguyên N.");
  const [outputFormat, setOutputFormat] = useState("In ra kết quả theo yêu cầu.");
  const [constraints, setConstraints] = useState("1 <= N <= 10^5");
  const [xpReward, setXpReward] = useState(80);
  const [starterCode, setStarterCode] = useState(`#include <iostream>\nusing namespace std;\n\nint main() {\n    return 0;\n}`);
  const [solutionCode, setSolutionCode] = useState(`#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    cout << n * 2 << "\\n";\n    return 0;\n}`);
  const [hintsText, setHintsText] = useState("Đọc dữ liệu bằng cin và kiểm tra giới hạn kiểu dữ liệu.");
  const [testCases, setTestCases] = useState<Array<{ input_data: string; expected_output: string; is_sample: boolean }>>([
    { input_data: "5", expected_output: "10", is_sample: true },
    { input_data: "20", expected_output: "40", is_sample: false },
  ]);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim(),
          slug: slug.trim().toLowerCase(),
          title: title.trim(),
          category,
          difficulty,
          description,
          input_format: inputFormat,
          output_format: outputFormat,
          constraints,
          sample_input: testCases[0]?.input_data || "",
          sample_output: testCases[0]?.expected_output || "",
          starter_code: starterCode,
          solution_code: solutionCode,
          hints: hintsText.split("\n").map((x) => x.trim()).filter(Boolean),
          xp_reward: Number(xpReward),
          test_cases: testCases,
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        toast({ title: j.error || "Không thể tạo bài tập", variant: "error" });
        return;
      }
      toast({ title: "Đã thêm bài tập và bộ Test Cases!", variant: "success" });
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-6 border-emerald-500/35">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold">Thêm bài tập giải thuật & Test Cases mới</h3>
        <button onClick={onCancel} className="cursor-pointer"><X className="h-4 w-4" /></button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block font-semibold mb-1">Mã bài</label>
            <input required value={code} onChange={(e) => setCode(e.target.value)} className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 font-mono" />
          </div>
          <div>
            <label className="block font-semibold mb-1">Slug URL</label>
            <input required value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="nhan-doi-so-nguyen" className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 font-mono" />
          </div>
          <div>
            <label className="block font-semibold mb-1">Chủ đề</label>
            <input required value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold mb-1">Độ khó</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as "Easy" | "Medium" | "Hard")} className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-2">
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">XP</label>
              <input type="number" value={xpReward} onChange={(e) => setXpReward(Number(e.target.value))} className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-2" />
            </div>
          </div>
        </div>

        <div>
          <label className="block font-semibold mb-1">Tên bài tập</label>
          <input required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2" />
        </div>
        <div>
          <label className="block font-semibold mb-1">Đề bài chi tiết</label>
          <textarea required rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block font-semibold mb-1">Định dạng Input</label>
            <input required value={inputFormat} onChange={(e) => setInputFormat(e.target.value)} className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2" />
          </div>
          <div>
            <label className="block font-semibold mb-1">Định dạng Output</label>
            <input required value={outputFormat} onChange={(e) => setOutputFormat(e.target.value)} className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2" />
          </div>
          <div>
            <label className="block font-semibold mb-1">Giới hạn</label>
            <input required value={constraints} onChange={(e) => setConstraints(e.target.value)} className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 font-mono" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold mb-1">Starter Code</label>
            <textarea rows={4} value={starterCode} onChange={(e) => setStarterCode(e.target.value)} className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-950 text-slate-100 p-2.5 font-mono" />
          </div>
          <div>
            <label className="block font-semibold mb-1">Solution Code (Tham khảo)</label>
            <textarea rows={4} value={solutionCode} onChange={(e) => setSolutionCode(e.target.value)} className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-950 text-emerald-300 p-2.5 font-mono" />
          </div>
        </div>

        <div>
          <label className="block font-semibold mb-1">Gợi ý (mỗi dòng 1 gợi ý)</label>
          <textarea rows={2} value={hintsText} onChange={(e) => setHintsText(e.target.value)} className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5" />
        </div>

        {/* Dynamic Test Cases Builder */}
        <div className="space-y-2 border-t border-slate-200 dark:border-slate-800 pt-3">
          <div className="flex items-center justify-between">
            <span className="font-bold">Bộ Test Cases ({testCases.length})</span>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() =>
                setTestCases((prev) => [...prev, { input_data: "", expected_output: "", is_sample: false }])
              }
            >
              <Plus className="h-3.5 w-3.5" /> Thêm Test Case
            </Button>
          </div>
          {testCases.map((tc, idx) => (
            <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-start rounded-xl border border-slate-200 dark:border-slate-800 p-2.5">
              <textarea
                rows={2}
                placeholder="Input stdin"
                value={tc.input_data}
                onChange={(e) =>
                  setTestCases((prev) =>
                    prev.map((item, i) => (i === idx ? { ...item, input_data: e.target.value } : item))
                  )
                }
                className="sm:col-span-5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-2 font-mono"
              />
              <textarea
                rows={2}
                required
                placeholder="Expected Output"
                value={tc.expected_output}
                onChange={(e) =>
                  setTestCases((prev) =>
                    prev.map((item, i) => (i === idx ? { ...item, expected_output: e.target.value } : item))
                  )
                }
                className="sm:col-span-5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-2 font-mono"
              />
              <div className="sm:col-span-2 flex items-center justify-between gap-2 pt-1">
                <label className="inline-flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tc.is_sample}
                    onChange={(e) =>
                      setTestCases((prev) =>
                        prev.map((item, i) => (i === idx ? { ...item, is_sample: e.target.checked } : item))
                      )
                    }
                  />
                  <span>Mẫu</span>
                </label>
                {testCases.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setTestCases((prev) => prev.filter((_, i) => i !== idx))}
                    className="text-rose-500 hover:text-rose-400 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Hủy</Button>
          <Button type="submit" size="sm" loading={saving}>
            <Save className="h-3.5 w-3.5" /> Lưu bài tập & Test Cases
          </Button>
        </div>
      </form>
    </Card>
  );
}
