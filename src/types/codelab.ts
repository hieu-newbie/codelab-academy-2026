export type UserRole = "student" | "admin";
export type ThemeMode = "dark" | "light";
export type CourseLanguage = "cpp" | "html" | "css" | "javascript";
export type DifficultyLevel = "Cơ bản" | "Trung cấp" | "Nâng cao";
export type ChallengeDifficulty = "Easy" | "Medium" | "Hard";
export type LessonStatus = "not_started" | "in_progress" | "completed";

export type SubmissionStatus =
  | "Accepted"
  | "Wrong Answer"
  | "Compilation Error"
  | "Runtime Error"
  | "Time Limit Exceeded"
  | "Memory Limit Exceeded"
  | "Not Configured";

export type QuizQuestionType =
  | "single_choice"
  | "multiple_choice"
  | "true_false"
  | "fill_blank"
  | "predict_output"
  | "find_bug";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  bio: string;
  role: UserRole;
  xp: number;
  level: number;
  theme: ThemeMode;
  preferred_language: CourseLanguage;
  total_study_minutes: number;
  bugs_fixed_count: number;
  created_at: string;
}

export interface GlossaryTerm {
  term: string;
  definition: string;
}

export interface TheoryBlock {
  heading: string;
  paragraphs: string[];
  callout?: {
    type: "tip" | "note" | "warning";
    title: string;
    content: string;
  };
  glossary?: GlossaryTerm[];
}

export interface CodeLineExplanation {
  line: string;
  code: string;
  explanation: string;
}

export interface LessonExample {
  title: string;
  level: "Cơ bản" | "Thực tế" | "Mở rộng";
  description: string;
  code: string;
  sampleInput?: string;
  expectedOutput: string;
  lineExplanations: CodeLineExplanation[];
}

export interface CommonMistake {
  title: string;
  badCode: string;
  goodCode: string;
  explanation: string;
}

export interface LessonDiagram {
  title: string;
  type: "flow" | "memory" | "box_model" | "table";
  caption: string;
  items: Array<{
    label: string;
    value: string;
    detail?: string;
    highlight?: boolean;
  }>;
}

export interface LessonPractice {
  title: string;
  prompt: string;
  starterCode: string;
  sampleInput?: string;
  expectedOutput: string;
  hints: string[];
  solutionCode: string;
}

export interface LessonCheckpointQuiz {
  question: string;
  codeSnippet?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface LessonContent {
  introduction: string;
  objectives: string[];
  theoryBlocks: TheoryBlock[];
  examples: LessonExample[];
  commonMistakes: CommonMistake[];
  diagram?: LessonDiagram;
  practice: LessonPractice;
  checkpointQuiz: LessonCheckpointQuiz;
  takeaways: string[];
}

export interface CourseRecord {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  language: CourseLanguage;
  description: string;
  target_audience: string;
  learning_outcomes: string[];
  difficulty: DifficultyLevel;
  estimated_hours: number;
  icon: string;
  accent_color: string;
  is_published: boolean;
  sort_order: number;
  section_count?: number;
  lesson_count?: number;
  completed_lessons?: number;
  progress_percent?: number;
  enrolled?: boolean;
}

export interface CourseSectionRecord {
  id: string;
  course_id: string;
  title: string;
  description: string;
  sort_order: number;
  lessons?: LessonSummary[];
}

export interface LessonSummary {
  id: string;
  section_id: string;
  course_id: string;
  slug: string;
  title: string;
  summary: string;
  estimated_minutes: number;
  xp_reward: number;
  sort_order: number;
  language: CourseLanguage;
  status?: LessonStatus;
  bookmarked?: boolean;
}

export interface LessonDetail extends LessonSummary {
  content: LessonContent;
  saved_code: string | null;
  checkpoint_passed: boolean;
  time_spent_seconds: number;
  course_slug?: string;
  course_title?: string;
  section_title?: string;
}

export interface TestCaseRecord {
  id: string;
  exercise_id: string;
  input_data: string;
  expected_output: string;
  is_sample: boolean;
  sort_order: number;
}

export interface ExerciseRecord {
  id: string;
  code: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  difficulty: ChallengeDifficulty;
  language: CourseLanguage;
  input_format: string;
  output_format: string;
  constraints: string;
  sample_input: string;
  sample_output: string;
  sample_explanation: string;
  starter_code: string;
  hints: string[];
  solution_code: string;
  solution_explanation: string;
  time_limit_ms: number;
  memory_limit_kb: number;
  xp_reward: number;
  is_published: boolean;
  solved?: boolean;
  attempts_count?: number;
  bookmarked?: boolean;
  test_cases?: TestCaseRecord[];
}

export interface TestCaseResult {
  testCaseIndex: number;
  isSample: boolean;
  status: SubmissionStatus;
  input?: string;
  expectedOutput?: string;
  actualOutput?: string;
  stderr?: string;
  timeMs?: number;
  memoryKb?: number;
}

export interface SubmissionRecord {
  id: string;
  user_id: string;
  exercise_id: string;
  exercise_title?: string;
  exercise_code?: string;
  language: string;
  source_code: string;
  status: SubmissionStatus;
  passed_tests: number;
  total_tests: number;
  execution_time_ms: number | null;
  memory_used_kb: number | null;
  compiler_output: string | null;
  stderr: string | null;
  stdout: string | null;
  test_results: TestCaseResult[];
  xp_awarded: number;
  created_at: string;
}

export interface QuizQuestionRecord {
  id: string;
  quiz_id: string;
  question_type: QuizQuestionType;
  prompt: string;
  code_snippet: string | null;
  options: string[];
  correct_answer?: string | string[];
  explanation?: string;
  topic_tag: string;
  points: number;
  sort_order: number;
}

export interface QuizRecord {
  id: string;
  course_id: string;
  section_id: string | null;
  slug: string;
  title: string;
  description: string;
  topic: string;
  difficulty: DifficultyLevel;
  time_limit_minutes: number;
  pass_score_percent: number;
  xp_reward: number;
  course_title?: string;
  question_count?: number;
  best_percentage?: number | null;
  attempts_count?: number;
}

export interface QuizAttemptRecord {
  id: string;
  user_id: string;
  quiz_id: string;
  quiz_title?: string;
  score: number;
  max_score: number;
  percentage: number;
  passed: boolean;
  weak_topics: string[];
  xp_awarded: number;
  duration_seconds: number;
  created_at: string;
}

export interface AchievementRecord {
  id: string;
  code: string;
  title: string;
  description: string;
  icon: string;
  xp_bonus: number;
  condition_type: string;
  condition_value: number;
  unlocked?: boolean;
  unlocked_at?: string | null;
}

export interface DailyActivityPoint {
  date: string;
  label: string;
  lessons_completed: number;
  exercises_solved: number;
  quizzes_completed: number;
  xp_earned: number;
  study_minutes: number;
}

export interface DashboardData {
  profile: UserProfile;
  streak: {
    current_streak: number;
    longest_streak: number;
    last_active_date: string | null;
  };
  stats: {
    completed_lessons: number;
    total_lessons: number;
    solved_exercises: number;
    total_submissions: number;
    accepted_submissions: number;
    accuracy_rate: number;
    total_study_minutes: number;
    quizzes_passed: number;
  };
  enrolled_courses: CourseRecord[];
  in_progress_lessons: Array<{
    lesson_id: string;
    lesson_slug: string;
    lesson_title: string;
    course_slug: string;
    course_title: string;
    language: CourseLanguage;
    updated_at: string;
  }>;
  continue_lesson: {
    lesson_slug: string;
    lesson_title: string;
    course_slug: string;
    course_title: string;
    section_title: string;
    language: CourseLanguage;
  } | null;
  recommended_lessons: Array<{
    lesson_id: string;
    lesson_slug: string;
    lesson_title: string;
    course_slug: string;
    course_title: string;
    estimated_minutes: number;
    xp_reward: number;
    language: CourseLanguage;
  }>;
  achievements: AchievementRecord[];
  activity_daily: DailyActivityPoint[];
  activity_weekly: DailyActivityPoint[];
  activity_monthly: DailyActivityPoint[];
  weak_topics: Array<{ topic: string; misses: number }>;
  system_status: {
    database_mode: "supabase" | "sqlite_local";
    judge0_configured: boolean;
    ai_tutor_configured: boolean;
    ai_provider: string | null;
  };
}

export interface AiConversationRecord {
  id: string;
  user_id: string;
  title: string;
  course_id: string | null;
  lesson_id: string | null;
  exercise_id: string | null;
  course_title?: string | null;
  lesson_title?: string | null;
  exercise_title?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AiMessageRecord {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  code_context: string | null;
  created_at: string;
}

export interface BugReportRecord {
  id: string;
  user_id: string;
  reporter_name?: string;
  reporter_email?: string;
  target_type: "lesson" | "exercise" | "quiz" | "system";
  target_id: string;
  target_title: string;
  description: string;
  status: "open" | "in_review" | "resolved";
  admin_note: string | null;
  created_at: string;
  updated_at: string;
}
