import type { QuizQuestionType } from "@/types/codelab";

export interface GradableQuestion {
  id: string;
  question_type: QuizQuestionType;
  prompt: string;
  correct_answer: string | string[];
  explanation: string;
  topic_tag: string;
  points: number;
}

export interface GradedQuestionResult {
  question_id: string;
  is_correct: boolean;
  earned_points: number;
  max_points: number;
  user_answer: string | string[] | null;
  correct_answer: string | string[];
  explanation: string;
  topic_tag: string;
}

export interface QuizGradeSummary {
  score: number;
  max_score: number;
  percentage: number;
  passed: boolean;
  weak_topics: string[];
  results: GradedQuestionResult[];
}

function normalizeAnswerString(val: string): string {
  return val.trim().replace(/\s+/g, " ").toLowerCase();
}

export function gradeQuizAttempt(
  questions: GradableQuestion[],
  submittedAnswers: Record<string, string | string[]>,
  passScorePercent: number
): QuizGradeSummary {
  let score = 0;
  let maxScore = 0;
  const weakTopicSet = new Set<string>();
  const results: GradedQuestionResult[] = [];

  for (const q of questions) {
    maxScore += q.points;
    const rawUserAns = submittedAnswers[q.id] ?? null;
    let isCorrect = false;

    if (q.question_type === "multiple_choice") {
      const expectedArr = Array.isArray(q.correct_answer)
        ? q.correct_answer.map(normalizeAnswerString).sort()
        : [normalizeAnswerString(q.correct_answer)];
      const actualArr = Array.isArray(rawUserAns)
        ? rawUserAns.map(normalizeAnswerString).sort()
        : typeof rawUserAns === "string" && rawUserAns
        ? [normalizeAnswerString(rawUserAns)]
        : [];
      isCorrect =
        expectedArr.length === actualArr.length &&
        expectedArr.every((v, idx) => v === actualArr[idx]);
    } else {
      const expectedStr = Array.isArray(q.correct_answer)
        ? q.correct_answer[0] ?? ""
        : q.correct_answer;
      const actualStr = Array.isArray(rawUserAns)
        ? rawUserAns[0] ?? ""
        : rawUserAns ?? "";
      isCorrect = normalizeAnswerString(actualStr) === normalizeAnswerString(expectedStr);
    }

    const earned = isCorrect ? q.points : 0;
    score += earned;
    if (!isCorrect && q.topic_tag) {
      weakTopicSet.add(q.topic_tag);
    }

    results.push({
      question_id: q.id,
      is_correct: isCorrect,
      earned_points: earned,
      max_points: q.points,
      user_answer: rawUserAns,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      topic_tag: q.topic_tag,
    });
  }

  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const passed = percentage >= passScorePercent;

  return {
    score,
    max_score: maxScore,
    percentage,
    passed,
    weak_topics: Array.from(weakTopicSet),
    results,
  };
}
