import type { CourseLanguage, DifficultyLevel } from "@/types/codelab";

export interface SeedCourse {
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
  sort_order: number;
  sections: Array<{
    id: string;
    title: string;
    description: string;
    sort_order: number;
  }>;
}

export const SEED_COURSES: SeedCourse[] = [
  {
    id: "course-cpp",
    slug: "cpp-programming",
    title: "Lập trình C++ từ con số 0 đến Nâng cao",
    subtitle: "Nền tảng tư duy thuật toán, cấu trúc dữ liệu và lập trình hệ thống",
    language: "cpp",
    description:
      "Khóa học C++ toàn diện gồm 18 chương được thiết kế bài bản dành cho người mới bắt đầu. Bạn sẽ đi từ dòng code đầu tiên, nắm vững biến, vòng lặp, mảng, chuỗi, hàm, con trỏ, STL Vector, đệ quy cho đến thuật toán và lập trình hướng đối tượng (OOP).",
    target_audience:
      "Người mới hoàn toàn chưa từng viết code, học sinh ôn thi Tin học, sinh viên CNTT năm nhất muốn xây gốc tư duy thuật toán vững chắc.",
    learning_outcomes: [
      "Hiểu sâu cách máy tính lưu trữ dữ liệu, biên dịch và thực thi chương trình C++.",
      "Thành thạo cấu trúc điều khiển, vòng lặp, mảng 1-2 chiều, xâu ký tự và hàm.",
      "Làm chủ con trỏ, Struct, STL Vector và kỹ thuật đệ quy giải quyết bài toán phức tạp.",
      "Cài đặt các thuật toán tìm kiếm, sắp xếp, cấu trúc dữ liệu cơ bản và OOP thực tế.",
      "Đủ nền tảng tự tin chinh phục các bài luyện giải thuật trên hệ thống chấm tự động."
    ],
    difficulty: "Cơ bản",
    estimated_hours: 36,
    icon: "cpu",
    accent_color: "blue",
    sort_order: 1,
    sections: [
      { id: "sec-cpp-01", title: "Chương 1: Làm quen với lập trình C++", description: "Tổng quan về C++, quy trình biên dịch và chạy chương trình đầu tiên.", sort_order: 1 },
      { id: "sec-cpp-02", title: "Chương 2: Cấu trúc chương trình", description: "Giải phẫu một file C++ chuẩn: tiền xử lý, namespace, hàm main và ghi chú.", sort_order: 2 },
      { id: "sec-cpp-03", title: "Chương 3: Biến và kiểu dữ liệu", description: "Khai báo biến, kiểu số nguyên, số thực, ký tự, logic và hằng số.", sort_order: 3 },
      { id: "sec-cpp-04", title: "Chương 4: Nhập xuất dữ liệu", description: "Sử dụng cin, cout, định dạng số thập phân và xử lý luồng nhập chuẩn.", sort_order: 4 },
      { id: "sec-cpp-05", title: "Chương 5: Toán tử", description: "Toán tử số học, so sánh, logic, gán ghép và độ ưu tiên toán tử.", sort_order: 5 },
      { id: "sec-cpp-06", title: "Chương 6: Câu lệnh điều kiện", description: "Rẽ nhánh với if, else if, else, switch-case và toán tử ba ngôi.", sort_order: 6 },
      { id: "sec-cpp-07", title: "Chương 7: Vòng lặp for, while, do-while", description: "Tự động hóa thao tác lặp, kiểm soát break, continue và vòng lặp lồng nhau.", sort_order: 7 },
      { id: "sec-cpp-08", title: "Chương 8: Mảng một chiều", description: "Lưu trữ danh sách dữ liệu cùng kiểu, duyệt mảng, tìm max/min và tổng.", sort_order: 8 },
      { id: "sec-cpp-09", title: "Chương 9: Mảng hai chiều", description: "Biểu diễn ma trận, duyệt theo hàng/cột và bài toán đường chéo.", sort_order: 9 },
      { id: "sec-cpp-10", title: "Chương 10: Xâu ký tự và String", description: "Làm việc với std::string, getline, duyệt ký tự và xử lý văn bản.", sort_order: 10 },
      { id: "sec-cpp-11", title: "Chương 11: Hàm", description: "Chia nhỏ chương trình, tham số truyền giá trị vs tham chiếu và giá trị trả về.", sort_order: 11 },
      { id: "sec-cpp-12", title: "Chương 12: Con trỏ", description: "Địa chỉ bộ nhớ, toán tử & và *, con trỏ với mảng và tránh lỗi rò rỉ.", sort_order: 12 },
      { id: "sec-cpp-13", title: "Chương 13: Struct", description: "Tạo kiểu dữ liệu tùy chỉnh nhóm nhiều thuộc tính liên quan.", sort_order: 13 },
      { id: "sec-cpp-14", title: "Chương 14: Vector", description: "Mảng động mạnh mẽ từ thư viện chuẩn STL: push_back, size, sort.", sort_order: 14 },
      { id: "sec-cpp-15", title: "Chương 15: Đệ quy", description: "Tư duy chia để trị, điểm dừng cơ sở và phân tích cây gọi hàm.", sort_order: 15 },
      { id: "sec-cpp-16", title: "Chương 16: Thuật toán tìm kiếm và sắp xếp", description: "Tìm kiếm nhị phân, sắp xếp chọn, sắp xếp nổi bọt và std::sort.", sort_order: 16 },
      { id: "sec-cpp-17", title: "Chương 17: Cấu trúc dữ liệu cơ bản", description: "Ngăn xếp (Stack), Hàng đợi (Queue) và Danh sách liên kết.", sort_order: 17 },
      { id: "sec-cpp-18", title: "Chương 18: Lập trình hướng đối tượng", description: "Class, Object, tính đóng gói, kế thừa và đa hình trong C++.", sort_order: 18 },
    ],
  },
  {
    id: "course-html",
    slug: "html-fundamentals",
    title: "HTML5 – Xây dựng Cấu trúc Website Hiện đại",
    subtitle: "Nền tảng chuẩn ngữ nghĩa cho mọi ứng dụng web",
    language: "html",
    description:
      "Học cách tạo khung xương chuẩn mực cho website hiện đại bằng HTML5. Từ các thẻ văn bản, hình ảnh, danh sách, bảng biểu, biểu mẫu (Form) cho đến Semantic HTML tối ưu SEO và trợ năng (Accessibility).",
    target_audience:
      "Người mới bắt đầu lộ trình lập trình Web Frontend/Full-stack, sinh viên, designer muốn hiểu cấu trúc web.",
    learning_outcomes: [
      "Tự tay dựng cấu trúc tài liệu HTML5 chuẩn W3C.",
      "Sử dụng thành thạo thẻ văn bản, liên kết, hình ảnh, danh sách, bảng và biểu mẫu.",
      "Áp dụng Semantic HTML giúp website thân thiện với công cụ tìm kiếm (SEO) và trình đọc màn hình.",
      "Tích hợp đa phương tiện và hoàn thiện một trang landing page cá nhân hoàn chỉnh."
    ],
    difficulty: "Cơ bản",
    estimated_hours: 12,
    icon: "globe",
    accent_color: "orange",
    sort_order: 2,
    sections: [
      { id: "sec-html-01", title: "Chương 1: Tổng quan về HTML", description: "HTML là gì, cách trình duyệt phân tích tài liệu web.", sort_order: 1 },
      { id: "sec-html-02", title: "Chương 2: Cấu trúc trang web", description: "DOCTYPE, html, head, meta và body.", sort_order: 2 },
      { id: "sec-html-03", title: "Chương 3: Các thẻ văn bản", description: "Tiêu đề h1-h6, đoạn văn p, nhấn mạnh strong/em và trích dẫn.", sort_order: 3 },
      { id: "sec-html-04", title: "Chương 4: Liên kết và hình ảnh", description: "Thẻ a, đường dẫn tương đối/tuyệt đối và thẻ img chuẩn alt.", sort_order: 4 },
      { id: "sec-html-05", title: "Chương 5: Danh sách", description: "Danh sách không thứ tự ul, có thứ tự ol và danh sách mô tả dl.", sort_order: 5 },
      { id: "sec-html-06", title: "Chương 6: Bảng", description: "Tạo bảng dữ liệu rõ ràng với table, thead, tbody, tr, th, td.", sort_order: 6 },
      { id: "sec-html-07", title: "Chương 7: Form", description: "Thu thập dữ liệu người dùng với input, label, select, textarea và validation.", sort_order: 7 },
      { id: "sec-html-08", title: "Chương 8: Semantic HTML", description: "header, nav, main, article, section, aside và footer.", sort_order: 8 },
      { id: "sec-html-09", title: "Chương 9: Multimedia", description: "Nhúng audio, video, figure và iframe an toàn.", sort_order: 9 },
      { id: "sec-html-10", title: "Chương 10: Xây dựng website thực tế", description: "Tổng hợp kiến thức dựng trang hồ sơ lập trình viên hoàn chỉnh.", sort_order: 10 },
    ],
  },
  {
    id: "course-css",
    slug: "css-modern-layout",
    title: "CSS3 – Thiết kế Giao diện & Bố cục Chuyên nghiệp",
    subtitle: "Làm chủ Box Model, Flexbox, CSS Grid và Responsive Design",
    language: "css",
    description:
      "Biến những trang HTML thô thành giao diện chuyên nghiệp, tinh tế và tương thích mọi thiết bị. Khóa học đi sâu vào cơ chế chọn phần tử, Box Model, Flexbox, CSS Grid, Responsive và hiệu ứng chuyển động mượt mà.",
    target_audience:
      "Người đã biết cơ bản về HTML và muốn tự tay thiết kế giao diện web đẹp mắt như các sản phẩm công nghệ.",
    learning_outcomes: [
      "Hiểu rõ độ ưu tiên bộ chọn (Specificity) và cơ chế kế thừa trong CSS.",
      "Tính toán chính xác kích thước phần tử với Box Model và box-sizing.",
      "Xây dựng bố cục linh hoạt bằng Flexbox và lưới 2 chiều bằng CSS Grid.",
      "Thiết kế Responsive cho Desktop, Tablet, Mobile và tạo hiệu ứng Animation mượt mà."
    ],
    difficulty: "Cơ bản",
    estimated_hours: 18,
    icon: "palette",
    accent_color: "cyan",
    sort_order: 3,
    sections: [
      { id: "sec-css-01", title: "Chương 1: Cách liên kết CSS", description: "Inline, Internal và External Stylesheet.", sort_order: 1 },
      { id: "sec-css-02", title: "Chương 2: Bộ chọn", description: "Element, Class, ID, Attribute và Pseudo-classes.", sort_order: 2 },
      { id: "sec-css-03", title: "Chương 3: Màu sắc và font chữ", description: "HEX, RGB, HSL, biến CSS và Typography web.", sort_order: 3 },
      { id: "sec-css-04", title: "Chương 4: Margin và Padding", description: "Khoảng cách trong ngoài và hiện tượng margin collapse.", sort_order: 4 },
      { id: "sec-css-05", title: "Chương 5: Border và Box Model", description: "Mô hình hộp CSS và bí quyết box-sizing: border-box.", sort_order: 5 },
      { id: "sec-css-06", title: "Chương 6: Display", description: "block, inline, inline-block và none.", sort_order: 6 },
      { id: "sec-css-07", title: "Chương 7: Position", description: "static, relative, absolute, fixed và sticky.", sort_order: 7 },
      { id: "sec-css-08", title: "Chương 8: Flexbox", description: "Căn chỉnh một chiều cực nhanh với justify-content và align-items.", sort_order: 8 },
      { id: "sec-css-09", title: "Chương 9: CSS Grid", description: "Bố cục hai chiều hiện đại với grid-template-columns và gap.", sort_order: 9 },
      { id: "sec-css-10", title: "Chương 10: Responsive Design", description: "Media queries, đơn vị rem/vw và tư duy Mobile-First.", sort_order: 10 },
      { id: "sec-css-11", title: "Chương 11: Animation và Transition", description: "Chuyển trạng thái mượt mà với transition và @keyframes.", sort_order: 11 },
      { id: "sec-css-12", title: "Chương 12: Xây dựng giao diện hoàn chỉnh", description: "Thực hành thiết kế thẻ sản phẩm và thanh điều hướng thực tế.", sort_order: 12 },
    ],
  },
  {
    id: "course-js",
    slug: "javascript-interactive",
    title: "JavaScript Hiện đại – Lập trình Tương tác Web",
    subtitle: "Từ cú pháp ES6+ đến DOM, sự kiện và gọi API bất đồng bộ",
    language: "javascript",
    description:
      "Thổi hồn vào trang web với JavaScript hiện đại. Bạn sẽ nắm chắc nền tảng ngôn ngữ ES6+, xử lý mảng và đối tượng, tương tác DOM, lắng nghe sự kiện người dùng, làm việc với JSON và Fetch API bất đồng bộ.",
    target_audience:
      "Người học muốn phát triển ứng dụng web tương tác thực tế, chuẩn bị nền tảng để tiến lên React và Next.js.",
    learning_outcomes: [
      "Viết mã JavaScript sạch theo chuẩn hiện đại (let, const, arrow function, destructuring).",
      "Xử lý dữ liệu linh hoạt với Array methods (map, filter, reduce) và Object.",
      "Thao tác DOM, quản lý sự kiện và xây dựng thành phần giao diện tương tác.",
      "Hiểu Promise, async/await, JSON và gọi dữ liệu thật qua Fetch API."
    ],
    difficulty: "Trung cấp",
    estimated_hours: 24,
    icon: "sparkles",
    accent_color: "amber",
    sort_order: 4,
    sections: [
      { id: "sec-js-01", title: "Chương 1: Biến và kiểu dữ liệu", description: "let, const, kiểu nguyên thủy và template literal.", sort_order: 1 },
      { id: "sec-js-02", title: "Chương 2: Toán tử", description: "So sánh chặt ===, toán tử logic và nullish coalescing.", sort_order: 2 },
      { id: "sec-js-03", title: "Chương 3: Điều kiện", description: "if/else, switch và truthy/falsy trong JavaScript.", sort_order: 3 },
      { id: "sec-js-04", title: "Chương 4: Vòng lặp", description: "for, while, for...of và duyệt dữ liệu an toàn.", sort_order: 4 },
      { id: "sec-js-05", title: "Chương 5: Hàm", description: "Function declaration, Arrow function và phạm vi biến (Scope).", sort_order: 5 },
      { id: "sec-js-06", title: "Chương 6: Mảng và Object", description: "map, filter, reduce, spread và destructuring.", sort_order: 6 },
      { id: "sec-js-07", title: "Chương 7: DOM", description: "Truy vấn phần tử, cập nhật nội dung và class trên trang web.", sort_order: 7 },
      { id: "sec-js-08", title: "Chương 8: Event", description: "addEventListener, xử lý click, form submit và event bubbling.", sort_order: 8 },
      { id: "sec-js-09", title: "Chương 9: JSON", description: "JSON.stringify, JSON.parse và lưu trữ cục bộ.", sort_order: 9 },
      { id: "sec-js-10", title: "Chương 10: Asynchronous JavaScript", description: "Event Loop, Promise và cú pháp async/await.", sort_order: 10 },
      { id: "sec-js-11", title: "Chương 11: Fetch API", description: "Gọi REST API, xử lý HTTP status và trạng thái loading/lỗi.", sort_order: 11 },
      { id: "sec-js-12", title: "Chương 12: Xây dựng ứng dụng thực tế", description: "Hoàn thiện ứng dụng quản lý công việc tương tác hoàn chỉnh.", sort_order: 12 },
    ],
  },
];

export const SEED_ACHIEVEMENTS = [
  {
    id: "ach-first-code",
    code: "first_code",
    title: "First Code",
    description: "Chạy thành công chương trình hoặc hoàn thành bài học thực hành đầu tiên trên CODELAB.",
    icon: "terminal",
    xp_bonus: 50,
    condition_type: "lessons_completed",
    condition_value: 1,
  },
  {
    id: "ach-bug-hunter",
    code: "bug_hunter",
    title: "Bug Hunter",
    description: "Sửa thành công 10 lỗi trong quá trình nộp bài hoặc kiểm tra tìm lỗi code.",
    icon: "bug",
    xp_bonus: 150,
    condition_type: "bugs_fixed",
    condition_value: 10,
  },
  {
    id: "ach-problem-solver",
    code: "problem_solver",
    title: "Problem Solver",
    description: "Giải thành công 50 bài tập lập trình (Accepted) trên hệ thống Coding Challenges.",
    icon: "trophy",
    xp_bonus: 400,
    condition_type: "exercises_solved",
    condition_value: 50,
  },
  {
    id: "ach-consistency",
    code: "consistency",
    title: "Consistency",
    description: "Duy trì chuỗi học tập liên tiếp suốt 7 ngày không gián đoạn.",
    icon: "flame",
    xp_bonus: 200,
    condition_type: "streak_days",
    condition_value: 7,
  },
  {
    id: "ach-master",
    code: "master",
    title: "Master",
    description: "Hoàn thành 100% toàn bộ bài học của ít nhất một khóa học.",
    icon: "crown",
    xp_bonus: 500,
    condition_type: "courses_completed",
    condition_value: 1,
  },
  {
    id: "ach-quiz-ace",
    code: "quiz_ace",
    title: "Quiz Ace",
    description: "Đạt điểm tối thiểu 90% trong một bài kiểm tra kiến thức chương.",
    icon: "award",
    xp_bonus: 100,
    condition_type: "quiz_high_score",
    condition_value: 90,
  },
  {
    id: "ach-dedicated",
    code: "dedicated_learner",
    title: "Chiến binh chăm chỉ",
    description: "Hoàn thành 5 bài học tương tác để hình thành thói quen lập trình mỗi ngày.",
    icon: "zap",
    xp_bonus: 120,
    condition_type: "lessons_completed",
    condition_value: 5,
  },
  {
    id: "ach-challenger",
    code: "first_accepted",
    title: "Khởi động giải thuật",
    description: "Đạt trạng thái Accepted đầu tiên trong khu vực Coding Challenges.",
    icon: "check-circle-2",
    xp_bonus: 80,
    condition_type: "exercises_solved",
    condition_value: 1,
  },
];
