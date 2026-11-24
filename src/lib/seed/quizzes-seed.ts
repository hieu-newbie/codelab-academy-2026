import type { DifficultyLevel, QuizQuestionType } from "@/types/codelab";

export interface SeedQuizQuestion {
  id: string;
  question_type: QuizQuestionType;
  prompt: string;
  code_snippet: string | null;
  options: string[];
  correct_answer: string | string[];
  explanation: string;
  topic_tag: string;
  points: number;
  sort_order: number;
}

export interface SeedQuiz {
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
  questions: SeedQuizQuestion[];
}

export const SEED_QUIZZES: SeedQuiz[] = [
  {
    id: "quiz-cpp-basics",
    course_id: "course-cpp",
    section_id: "sec-cpp-05",
    slug: "kiem-tra-nen-tang-cpp",
    title: "Kiểm tra tổng hợp C++ Chương 1–5 (Nền tảng & Toán tử)",
    description:
      "Đánh giá toàn diện kiến thức về cấu trúc chương trình, biến, kiểu dữ liệu, nhập xuất và toán tử với đầy đủ 6 dạng câu hỏi tương tác.",
    topic: "C++ Cơ bản",
    difficulty: "Cơ bản",
    time_limit_minutes: 15,
    pass_score_percent: 70,
    xp_reward: 80,
    questions: [
      {
        id: "qq-cpp-1",
        question_type: "single_choice",
        prompt: "Kiểu dữ liệu nào an toàn nhất để lưu tích của hai số nguyên dương có thể lên tới 10^9?",
        code_snippet: null,
        options: ["int", "short", "long long", "char"],
        correct_answer: "long long",
        explanation: "Tích hai số 10^9 lên tới 10^18, vượt xa giới hạn ~2.14×10^9 của kiểu `int`. Kiểu `long long` lưu được tới ~9.22×10^18.",
        topic_tag: "Biến & Kiểu dữ liệu",
        points: 10,
        sort_order: 1
      },
      {
        id: "qq-cpp-2",
        question_type: "multiple_choice",
        prompt: "Chọn TẤT CẢ các tên biến HỢP LỆ trong ngôn ngữ lập trình C++:",
        code_snippet: null,
        options: ["diem_toan", "2hocVien", "_count", "int", "tongGiaTri"],
        correct_answer: ["diem_toan", "_count", "tongGiaTri"],
        explanation: "Tên biến không được bắt đầu bằng chữ số (`2hocVien` sai) và không được trùng từ khóa (`int` sai). Các tên còn lại đều hợp lệ.",
        topic_tag: "Biến & Kiểu dữ liệu",
        points: 15,
        sort_order: 2
      },
      {
        id: "qq-cpp-3",
        question_type: "true_false",
        prompt: "Phát biểu sau Đúng hay Sai: Trong C++, biểu thức `7 / 2` trả về giá trị `3.5`.",
        code_snippet: null,
        options: ["Đúng", "Sai"],
        correct_answer: "Sai",
        explanation: "Sai! Vì cả `7` và `2` đều là số nguyên `int`, C++ thực hiện phép chia lấy phần nguyên nên `7 / 2` bằng `3`. Muốn ra `3.5` phải viết `7.0 / 2`.",
        topic_tag: "Toán tử",
        points: 10,
        sort_order: 3
      },
      {
        id: "qq-cpp-4",
        question_type: "fill_blank",
        prompt: "Điền tên thư viện chuẩn cần nạp để sử dụng `fixed << setprecision(2)` trong C++ (chỉ điền tên thư viện, không gồm dấu <>):",
        code_snippet: `#include <iostream>\n#include <________>\nusing namespace std;`,
        options: [],
        correct_answer: "iomanip",
        explanation: "Thư viện `<iomanip>` (Input/Output Manipulators) cung cấp `setprecision`, `setw` để định dạng đầu ra.",
        topic_tag: "Nhập xuất dữ liệu",
        points: 15,
        sort_order: 4
      },
      {
        id: "qq-cpp-5",
        question_type: "predict_output",
        prompt: "Dự đoán chính xác kết quả in ra màn hình của đoạn chương trình C++ sau:",
        code_snippet: `int a = 19, b = 4;\ncout << a / b << " " << a % b;`,
        options: ["4.75 3", "4 3", "5 1", "4 4"],
        correct_answer: "4 3",
        explanation: "19 chia nguyên cho 4 được thương là `4` và số dư `19 % 4 = 3`, nên màn hình in `4 3`.",
        topic_tag: "Toán tử",
        points: 15,
        sort_order: 5
      },
      {
        id: "qq-cpp-6",
        question_type: "find_bug",
        prompt: "Đoạn code dưới đây có lỗi biên dịch ở dòng nào?",
        code_snippet: `1: #include <iostream>\n2: using namespace std;\n3: int main() {\n4:     int x = 10\n5:     cout << x << endl;\n6:     return 0;\n7: }`,
        options: [
          "Dòng 1 thiếu dấu chấm phẩy",
          "Dòng 4 thiếu dấu chấm phẩy ; cuối lệnh khai báo biến",
          "Dòng 5 dùng sai chiều toán tử <<",
          "Dòng 6 phải viết return 1;"
        ],
        correct_answer: "Dòng 4 thiếu dấu chấm phẩy ; cuối lệnh khai báo biến",
        explanation: "Dòng 4 viết `int x = 10` bị thiếu dấu `;` kết thúc câu lệnh, gây Compilation Error.",
        topic_tag: "Cấu trúc chương trình",
        points: 15,
        sort_order: 6
      }
    ]
  },
  {
    id: "quiz-cpp-control-arrays",
    course_id: "course-cpp",
    section_id: "sec-cpp-10",
    slug: "kiem-tra-vong-lap-mang-chuoi",
    title: "Kiểm tra Chương 6–10: Rẽ nhánh, Vòng lặp, Mảng & String",
    description:
      "Thử thách tư duy theo dõi vòng lặp, phát hiện lỗi truy cập ngoài biên mảng và xử lý xâu ký tự ASCII.",
    topic: "Điều khiển, Mảng & Chuỗi",
    difficulty: "Trung cấp",
    time_limit_minutes: 20,
    pass_score_percent: 70,
    xp_reward: 100,
    questions: [
      {
        id: "qq-arr-1",
        question_type: "predict_output",
        prompt: "Đoạn code sau in ra kết quả nào?",
        code_snippet: `int s = 0;\nfor (int i = 1; i <= 5; i++) {\n    if (i == 3) continue;\n    s += i;\n}\ncout << s;`,
        options: ["15", "12", "3", "6"],
        correct_answer: "12",
        explanation: "Khi `i == 3`, lệnh `continue` bỏ qua bước cộng `3`. Tổng các số còn lại: `1 + 2 + 4 + 5 = 12`.",
        topic_tag: "Vòng lặp",
        points: 15,
        sort_order: 1
      },
      {
        id: "qq-arr-2",
        question_type: "find_bug",
        prompt: "Tìm lỗi logic nghiêm trọng trong hàm tìm phần tử lớn nhất của mảng dưới đây:",
        code_snippet: `int timMax(int a[], int n) {\n    int best = 0;\n    for (int i = 0; i < n; i++) {\n        if (a[i] > best) best = a[i];\n    }\n    return best;\n}`,
        options: [
          "Vòng lặp phải chạy tới i <= n",
          "Khởi tạo best = 0 sẽ trả về kết quả sai khi toàn bộ mảng là số âm",
          "Không thể so sánh a[i] > best bằng kiểu int",
          "Hàm không có lệnh return"
        ],
        correct_answer: "Khởi tạo best = 0 sẽ trả về kết quả sai khi toàn bộ mảng là số âm",
        explanation: "Nếu mảng là `{-10, -4, -7}`, `best = 0` không bao giờ bị thay thế và hàm trả về `0` (không nằm trong mảng!). Đúng phải là `int best = a[0];`.",
        topic_tag: "Mảng một chiều",
        points: 20,
        sort_order: 2
      },
      {
        id: "qq-arr-3",
        question_type: "multiple_choice",
        prompt: "Chọn các câu lệnh HỢP LỆ và AN TOÀN khi mảng `int a[5];` có 5 phần tử:",
        code_snippet: null,
        options: ["a[0] = 10;", "a[4] = 20;", "a[5] = 30;", "a[-1] = 0;"],
        correct_answer: ["a[0] = 10;", "a[4] = 20;"],
        explanation: "Mảng kích thước 5 có chỉ số hợp lệ từ 0 đến 4. Truy cập `a[5]` hoặc `a[-1]` đều là lỗi Out of Bounds.",
        topic_tag: "Mảng một chiều",
        points: 15,
        sort_order: 3
      },
      {
        id: "qq-arr-4",
        question_type: "fill_blank",
        prompt: "Điền tên hàm cần gọi trước `getline(cin, s)` để xóa ký tự Enter thừa sau khi vừa đọc số bằng `cin >> n;`:",
        code_snippet: `int n;\ncin >> n;\ncin.________();\nstring s;\ngetline(cin, s);`,
        options: [],
        correct_answer: "ignore",
        explanation: "`cin.ignore()` loại bỏ ký tự `'\\n'` còn nằm trong bộ đệm đầu vào giúp `getline` không bị trôi lệnh.",
        topic_tag: "Xâu ký tự",
        points: 15,
        sort_order: 4
      },
      {
        id: "qq-arr-5",
        question_type: "true_false",
        prompt: "Đúng hay Sai: Trên ma trận vuông kích thước `n × n` (chỉ số 0..n-1), mọi ô thuộc đường chéo phụ đều thỏa `i + j == n - 1`.",
        code_snippet: null,
        options: ["Đúng", "Sai"],
        correct_answer: "Đúng",
        explanation: "Chính xác! Ví dụ ma trận 3×3: đường chéo phụ gồm (0,2), (1,1), (2,0) đều có tổng hàng + cột = 2 = n - 1.",
        topic_tag: "Mảng hai chiều",
        points: 15,
        sort_order: 5
      }
    ]
  },
  {
    id: "quiz-cpp-advanced",
    course_id: "course-cpp",
    section_id: "sec-cpp-16",
    slug: "kiem-tra-ham-con-tro-stl-thuat-toan",
    title: "Kiểm tra Chương 11–18: Hàm, Con trỏ, STL & Thuật toán",
    description:
      "Củng cố kiến thức nâng cao về tham chiếu, con trỏ, STL Vector/Stack/Queue, độ phức tạp Big-O và OOP.",
    topic: "C++ Nâng cao & Thuật toán",
    difficulty: "Nâng cao",
    time_limit_minutes: 20,
    pass_score_percent: 70,
    xp_reward: 120,
    questions: [
      {
        id: "qq-adv-1",
        question_type: "predict_output",
        prompt: "Kết quả in ra của đoạn chương trình sử dụng tham chiếu `&` dưới đây là gì?",
        code_snippet: `void update(int a, int &b) {\n    a += 10;\n    b += 10;\n}\nint main() {\n    int x = 5, y = 5;\n    update(x, y);\n    cout << x << " " << y;\n}`,
        options: ["5 5", "15 15", "5 15", "15 5"],
        correct_answer: "5 15",
        explanation: "`a` truyền tham trị nên `x` giữ nguyên `5`; `b` truyền tham chiếu (`&`) nên `y` bị tăng lên `15`.",
        topic_tag: "Hàm & Tham chiếu",
        points: 20,
        sort_order: 1
      },
      {
        id: "qq-adv-2",
        question_type: "single_choice",
        prompt: "Độ phức tạp thời gian của `std::sort` trên `vector<int>` kích thước N là gì?",
        code_snippet: null,
        options: ["O(N)", "O(N log N)", "O(N²)", "O(log N)"],
        correct_answer: "O(N log N)",
        explanation: "`std::sort` trong C++ (Introsort) đảm bảo độ phức tạp trường hợp xấu nhất O(N log N).",
        topic_tag: "Thuật toán",
        points: 15,
        sort_order: 2
      },
      {
        id: "qq-adv-3",
        question_type: "find_bug",
        prompt: "Hàm đệ quy dưới đây bị lỗi gì khi chạy với `n = 5`?",
        code_snippet: `int sumTo(int n) {\n    return n + sumTo(n - 1);\n}`,
        options: [
          "Thiếu điểm dừng cơ sở (Base Case) dẫn đến Stack Overflow",
          "C++ không hỗ trợ hàm tự gọi chính nó",
          "Thiếu từ khóa static trước int",
          "Sai toán tử cộng"
        ],
        correct_answer: "Thiếu điểm dừng cơ sở (Base Case) dẫn đến Stack Overflow",
        explanation: "Không có `if (n <= 0) return 0;`, hàm gọi vô tận xuống số âm cho đến khi tràn ngăn xếp.",
        topic_tag: "Đệ quy",
        points: 20,
        sort_order: 3
      },
      {
        id: "qq-adv-4",
        question_type: "true_false",
        prompt: "Đúng hay Sai: Cấu trúc dữ liệu `std::stack` lấy phần tử ra theo thứ tự LIFO (Vào sau – Ra trước).",
        code_snippet: null,
        options: ["Đúng", "Sai"],
        correct_answer: "Đúng",
        explanation: "Đúng! Stack hoạt động theo cơ chế chồng đĩa: phần tử `push` sau cùng ở trên đỉnh (`top`) sẽ được `pop` đầu tiên.",
        topic_tag: "Cấu trúc dữ liệu",
        points: 15,
        sort_order: 4
      }
    ]
  },
  {
    id: "quiz-web-frontend",
    course_id: "course-js",
    section_id: "sec-js-06",
    slug: "kiem-tra-html-css-javascript",
    title: "Kiểm tra Web Frontend: HTML5, CSS Box Model & JavaScript ES6",
    description:
      "Đánh giá nhanh khả năng dựng cấu trúc Semantic HTML, tính kích thước CSS Box Model và xử lý mảng JavaScript hiện đại.",
    topic: "Web Frontend",
    difficulty: "Cơ bản",
    time_limit_minutes: 15,
    pass_score_percent: 70,
    xp_reward: 85,
    questions: [
      {
        id: "qq-web-1",
        question_type: "single_choice",
        prompt: "Giá trị nào của `box-sizing` giúp `padding` và `border` nằm gọn trong `width` đã khai báo?",
        code_snippet: null,
        options: ["content-box", "border-box", "padding-box", "flex-box"],
        correct_answer: "border-box",
        explanation: "`box-sizing: border-box` giữ tổng chiều rộng phần tử đúng bằng giá trị `width` bất kể padding hay border.",
        topic_tag: "CSS Box Model",
        points: 15,
        sort_order: 1
      },
      {
        id: "qq-web-2",
        question_type: "predict_output",
        prompt: "Đoạn JavaScript sau in ra kết quả nào?",
        code_snippet: `const nums = [1, 2, 3, 4];\nconst res = nums.filter(x => x % 2 === 0).map(x => x * 10);\nconsole.log(res.join("-"));`,
        options: ["10-20-30-40", "20-40", "2-4", "10-30"],
        correct_answer: "20-40",
        explanation: "`filter` giữ lại các số chẵn `[2, 4]`, sau đó `map` nhân 10 thành `[20, 40]` và `join('-')` ra `\"20-40\"`.",
        topic_tag: "JavaScript Array",
        points: 20,
        sort_order: 2
      },
      {
        id: "qq-web-3",
        question_type: "multiple_choice",
        prompt: "Chọn TẤT CẢ các thẻ là Semantic HTML5 (thẻ mang ngữ nghĩa cấu trúc trang):",
        code_snippet: null,
        options: ["<header>", "<div>", "<main>", "<span>", "<article>"],
        correct_answer: ["<header>", "<main>", "<article>"],
        explanation: "`<header>`, `<main>`, `<article>` là thẻ ngữ nghĩa rõ ràng; `<div>` và `<span>` là thẻ chứa trung tính không mang ngữ nghĩa.",
        topic_tag: "Semantic HTML",
        points: 15,
        sort_order: 3
      },
      {
        id: "qq-web-4",
        question_type: "fill_blank",
        prompt: "Điền toán tử so sánh CHẶT (kiểm tra cả giá trị lẫn kiểu dữ liệu) trong JavaScript:",
        code_snippet: `if (score ___ 100) { console.log("Tuyet doi!"); }`,
        options: [],
        correct_answer: "===",
        explanation: "Toán tử `===` (ba dấu bằng) so sánh chặt cả giá trị lẫn kiểu dữ liệu, tránh lỗi ép kiểu ngầm của `==`.",
        topic_tag: "JavaScript Cơ bản",
        points: 15,
        sort_order: 4
      }
    ]
  }
];
