import type { CourseLanguage, LessonContent } from "@/types/codelab";

export interface SeedLesson {
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
  content: LessonContent;
}

export const CPP_LESSONS_PART1: SeedLesson[] = [
  // =========================================================================
  // BÀI 1: LÀM QUEN VỚI LẬP TRÌNH C++
  // =========================================================================
  {
    id: "lesson-cpp-01",
    section_id: "sec-cpp-01",
    course_id: "course-cpp",
    slug: "lam-quen-voi-lap-trinh-cpp",
    title: "Làm quen với lập trình C++ và chương trình đầu tiên",
    summary: "Hiểu C++ là gì, quy trình trình biên dịch biến mã nguồn thành chương trình chạy được và viết dòng code Hello CODELAB đầu tiên.",
    estimated_minutes: 15,
    xp_reward: 50,
    sort_order: 1,
    language: "cpp",
    content: {
      introduction:
        "Chào mừng bạn đến với thế giới lập trình! C++ là một trong những ngôn ngữ lập trình mạnh mẽ và bền bỉ nhất lịch sử công nghệ — đứng sau trình duyệt web, công cụ game (Unreal Engine), hệ điều hành, hệ thống giao dịch tốc độ cao và hầu hết các kỳ thi lập trình thuật toán. Trong bài học đầu tiên này, bạn không cần kiến thức nền trước đó: chúng ta sẽ cùng hiểu cách máy tính 'đọc' code và tự tay chạy chương trình C++ đầu tiên.",
      objectives: [
        "Hiểu vai trò của ngôn ngữ lập trình và lý do nên bắt đầu tư duy thuật toán với C++.",
        "Nắm được 4 bước từ mã nguồn (Source Code) đến kết quả chạy trên màn hình.",
        "Tự viết, chỉnh sửa và hiểu trọn vẹn chương trình in thông điệp ra màn hình."
      ],
      theoryBlocks: [
        {
          heading: "1. Máy tính hiểu ngôn ngữ nào?",
          paragraphs: [
            "Bên trong bộ vi xử lý (CPU), máy tính thực chất chỉ hiểu mã máy gồm các dãy số 0 và 1. Con người rất khó viết trực tiếp hàng triệu bit 0 và 1 để tạo ra một ứng dụng. Vì vậy, các ngôn ngữ lập trình bậc cao như C++ ra đời để chúng ta viết chỉ dẫn bằng các từ khóa gần gũi với tiếng Anh.",
            "Tuy nhiên, máy tính không thể chạy thẳng file chữ `.cpp` của bạn. Cần có một phần mềm đặc biệt gọi là Trình biên dịch (Compiler — ví dụ GCC / g++) để kiểm tra lỗi cú pháp và dịch toàn bộ mã nguồn C++ sang mã máy thực thi siêu nhanh."
          ],
          glossary: [
            { term: "Mã nguồn (Source Code)", definition: "Tập hợp các câu lệnh do lập trình viên viết bằng ngôn ngữ lập trình (ví dụ file main.cpp)." },
            { term: "Trình biên dịch (Compiler)", definition: "Công cụ kiểm tra cú pháp và dịch mã nguồn C++ sang mã máy mà CPU có thể thực thi trực tiếp." },
            { term: "Cú pháp (Syntax)", definition: "Bộ quy tắc chính tả và ngữ pháp bắt buộc của một ngôn ngữ lập trình (ví dụ dấu chấm phẩy ; cuối mỗi lệnh)." }
          ],
          callout: {
            type: "tip",
            title: "Tại sao C++ chạy cực nhanh?",
            content: "Vì C++ được biên dịch trực tiếp thành mã máy trước khi chạy, nên chương trình C++ thường nhanh hơn gấp nhiều lần so với các ngôn ngữ thông dịch từng dòng. Đó là lý do C++ là lựa chọn số 1 cho lập trình thi đấu và thuật toán."
          }
        },
        {
          heading: "2. Chương trình C++ tối giản nhất trông như thế nào?",
          paragraphs: [
            "Mọi chương trình C++ đều cần một điểm xuất phát duy nhất mang tên hàm `main()`. Khi hệ thống bấm chạy, CPU luôn tìm tới `main()` đầu tiên và thực hiện lần lượt từng lệnh từ trên xuống dưới.",
            "Để in chữ ra màn hình, ta nạp thư viện nhập xuất chuẩn `<iostream>` rồi dùng đối tượng `cout` (viết tắt của Character Output) kết hợp toán tử đẩy dữ liệu `<<`."
          ],
          glossary: [
            { term: "Thư viện (Library)", definition: "Tập hợp các công cụ có sẵn do ngôn ngữ cung cấp để bạn tái sử dụng thay vì tự viết lại từ đầu (ví dụ <iostream> cho nhập/xuất)." },
            { term: "cout", definition: "Luồng xuất chuẩn (Console Output) dùng để hiển thị văn bản hoặc số liệu ra màn hình kết quả." }
          ]
        }
      ],
      diagram: {
        title: "Quy trình biến mã nguồn C++ thành kết quả thực thi",
        type: "flow",
        caption: "Nếu có lỗi cú pháp ở bước 2 (Compilation Error), chương trình sẽ dừng ngay và báo dòng lỗi trước khi chạy.",
        items: [
          { label: "Bước 1: Viết mã nguồn", value: "main.cpp", detail: "Bạn viết code trong Monaco Editor" },
          { label: "Bước 2: Biên dịch (g++)", value: "Kiểm tra & dịch", detail: "Kiểm tra dấu ;, ngoặc {}, tên biến", highlight: true },
          { label: "Bước 3: Thực thi", value: "Chạy trong Sandbox", detail: "Đọc dữ liệu vào (stdin) nếu có" },
          { label: "Bước 4: Kết quả", value: "stdout", detail: "Hiển thị văn bản ra khung Output" }
        ]
      },
      examples: [
        {
          title: "Ví dụ 1: Lời chào đầu tiên",
          level: "Cơ bản",
          description: "Chương trình kinh điển in một dòng văn bản chào mừng ra màn hình.",
          code: `#include <iostream>
using namespace std;

int main() {
    cout << "Xin chao CODELAB!" << endl;
    return 0;
}`,
          expectedOutput: "Xin chao CODELAB!",
          lineExplanations: [
            { line: "Dòng 1", code: "#include <iostream>", explanation: "Khai báo sử dụng thư viện nhập/xuất chuẩn để có lệnh cout và cin." },
            { line: "Dòng 2", code: "using namespace std;", explanation: "Cho phép viết ngắn gọn cout, endl thay vì phải gõ std::cout, std::endl mỗi lần." },
            { line: "Dòng 4", code: "int main() {", explanation: "Khai báo hàm chính — nơi chương trình bắt đầu chạy. Dấu { mở thân hàm." },
            { line: "Dòng 5", code: 'cout << "Xin chao CODELAB!" << endl;', explanation: "In chuỗi văn bản trong dấu ngoặc kép ra màn hình, rồi xuống dòng bằng endl." },
            { line: "Dòng 6", code: "return 0;", explanation: "Báo cho hệ điều hành biết chương trình đã kết thúc thành công (mã lỗi = 0)." }
          ]
        },
        {
          title: "Ví dụ 2: In hồ sơ nhiều dòng có định dạng",
          level: "Thực tế",
          description: "Kết hợp nhiều lệnh cout và ký tự xuống dòng \\n để trình bày thông tin rõ ràng.",
          code: `#include <iostream>
using namespace std;

int main() {
    cout << "=== HO SO HOC VIEN ===" << "\\n";
    cout << "Ngon ngu: C++17" << "\\n";
    cout << "Muc tieu: Chinh phuc 18 chuong!" << "\\n";
    return 0;
}`,
          expectedOutput: "=== HO SO HOC VIEN ===\nNgon ngu: C++17\nMuc tieu: Chinh phuc 18 chuong!",
          lineExplanations: [
            { line: "Dòng 5", code: 'cout << "=== HO SO HOC VIEN ===" << "\\n";', explanation: 'Ký tự "\\n" giúp xuống dòng nhanh hơn endl vì không ép xóa bộ đệm mỗi dòng.' },
            { line: "Dòng 6-7", code: "cout << ...", explanation: "Mỗi lệnh kết thúc bằng dấu chấm phẩy ; và thực thi tuần tự từ trên xuống." }
          ]
        }
      ],
      commonMistakes: [
        {
          title: "Quên dấu chấm phẩy (;) ở cuối câu lệnh",
          badCode: `int main() {
    cout << "Hello"
    return 0;
}`,
          goodCode: `int main() {
    cout << "Hello";
    return 0;
}`,
          explanation: "Trong C++, dấu chấm phẩy ; đóng vai trò như dấu chấm kết thúc câu. Thiếu ; sẽ gây lỗi biên dịch (Compilation Error: expected ';' before 'return')."
        },
        {
          title: "Nhầm chiều mũi tên của cout (dùng >> thay vì <<)",
          badCode: `cout >> "Xin chao";`,
          goodCode: `cout << "Xin chao";`,
          explanation: "Hãy hình dung mũi tên << chỉ hướng dữ liệu chảy TỪ chuỗi văn bản ĐI VÀO màn hình (cout). Ngược lại, cin mới dùng >>."
        }
      ],
      practice: {
        title: "Thực hành: In thẻ giới thiệu bản thân",
        prompt: "Hãy chỉnh sửa đoạn code bên phải để in ra chính xác 2 dòng:\nDòng 1: Toi bat dau hoc C++ tai CODELAB\nDòng 2: San sang chinh phuc thuat toan!",
        starterCode: `#include <iostream>
using namespace std;

int main() {
    // Hãy sửa nội dung trong dấu ngoặc kép và thêm dòng thứ 2
    cout << "Hello World" << endl;
    return 0;
}`,
        expectedOutput: "Toi bat dau hoc C++ tai CODELAB\nSan sang chinh phuc thuat toan!",
        hints: [
          "Giữ nguyên cấu trúc #include <iostream>, using namespace std; và int main().",
          "Dùng 2 câu lệnh cout liên tiếp, mỗi câu kết thúc bằng << endl; hoặc << \"\\n\";."
        ],
        solutionCode: `#include <iostream>
using namespace std;

int main() {
    cout << "Toi bat dau hoc C++ tai CODELAB" << endl;
    cout << "San sang chinh phuc thuat toan!" << endl;
    return 0;
}`
      },
      checkpointQuiz: {
        question: "Điểm bắt đầu thực thi bắt buộc của mọi chương trình C++ là gì?",
        options: [
          "Thư viện #include <iostream>",
          "Hàm main()",
          "Lệnh cout đầu tiên trong file",
          "Dòng using namespace std;"
        ],
        correctIndex: 1,
        explanation: "Hệ điều hành luôn gọi hàm main() đầu tiên khi khởi chạy chương trình C++. Không có hàm main(), trình liên kết sẽ báo lỗi."
      },
      takeaways: [
        "C++ là ngôn ngữ biên dịch có tốc độ thực thi rất cao, phù hợp học nền tảng và giải thuật.",
        "Luôn nạp #include <iostream> khi cần dùng cout/cin.",
        "Mọi câu lệnh C++ đều phải kết thúc bằng dấu chấm phẩy ; và nằm bên trong hàm main()."
      ]
    }
  },

  // =========================================================================
  // BÀI 2: CẤU TRÚC CHƯƠNG TRÌNH
  // =========================================================================
  {
    id: "lesson-cpp-02",
    section_id: "sec-cpp-02",
    course_id: "course-cpp",
    slug: "cau-truc-chuong-trinh-cpp",
    title: "Cấu trúc chương trình C++, Namespace và Comment",
    summary: "Hiểu tường tận từng thành phần cấu tạo một file C++: chỉ thị tiền xử lý, không gian tên, khối lệnh {} và cách viết chú thích chuyên nghiệp.",
    estimated_minutes: 15,
    xp_reward: 50,
    sort_order: 1,
    language: "cpp",
    content: {
      introduction:
        "Khi đọc một file C++ của lập trình viên chuyên nghiệp, bạn sẽ thấy các dòng bắt đầu bằng `#`, những khối ngoặc nhọn `{}`, ký hiệu `//` hay `/* ... */`. Hiểu rõ cấu trúc chuẩn giúp bạn tổ chức mã nguồn sạch sẽ, đọc hiểu tài liệu dễ dàng và tránh hàng loạt lỗi cú pháp sơ đẳng.",
      objectives: [
        "Phân biệt 4 khu vực chính trong một chương trình C++ chuẩn.",
        "Hiểu mục đích của không gian tên (namespace) và khi nào nên dùng std::.",
        "Biết cách viết chú thích (comment) một dòng và nhiều dòng để giải thích ý định code."
      ],
      theoryBlocks: [
        {
          heading: "1. Giải phẫu 4 tầng của một file C++",
          paragraphs: [
            "Một chương trình C++ điển hình gồm 4 phần rõ ràng: (1) Chỉ thị tiền xử lý `#include` để nạp thư viện; (2) Khai báo `namespace` hoặc hằng số toàn cục; (3) Các hàm phụ trợ (nếu có); và (4) Hàm `main()` chứa khối lệnh chính nằm trong cặp dấu ngoặc nhọn `{ ... }`.",
            "Cặp dấu ngoặc nhọn `{}` xác định một Khối lệnh (Block / Scope). Mọi dấu mở `{` bắt buộc phải có đúng một dấu đóng `}` tương ứng, và phần code bên trong nên được thụt lề (indent) 4 dấu cách để mắt người dễ quan sát cấu trúc lồng nhau."
          ],
          glossary: [
            { term: "Chỉ thị tiền xử lý (Preprocessor Directive)", definition: "Các dòng bắt đầu bằng dấu # (như #include), được xử lý trước khi trình biên dịch dịch code chính." },
            { term: "Namespace (Không gian tên)", definition: "Cơ chế gom nhóm tên hàm/biến để tránh trùng tên giữa các thư viện khác nhau. Thư viện chuẩn C++ nằm trong namespace std." },
            { term: "Comment (Chú thích)", definition: "Đoạn ghi chú dành cho con người đọc; trình biên dịch sẽ hoàn toàn bỏ qua chúng khi biên dịch." }
          ]
        },
        {
          heading: "2. Phân biệt chú thích 1 dòng và nhiều dòng",
          paragraphs: [
            "Dùng `//` cho chú thích ngắn trên một dòng (mọi thứ phía sau `//` trên cùng dòng đó bị bỏ qua). Dùng `/* ... */` khi bạn muốn viết mô tả nhiều dòng ở đầu file hoặc tạm vô hiệu hóa một đoạn code để kiểm tra lỗi.",
            "C++ phân biệt chữ HOA và chữ thường (Case-sensitive): `main`, `Main`, và `MAIN` là ba cái tên hoàn toàn khác nhau!"
          ],
          callout: {
            type: "note",
            title: "Quy ước viết Comment tốt",
            content: "Đừng comment lại điều hiển nhiên (như '// in ra a'). Hãy comment LÝ DO tại sao bạn làm bước đó hoặc công thức nghiệp vụ đằng sau đoạn code."
          }
        }
      ],
      diagram: {
        title: "Cấu trúc 4 phần của một tệp nguồn .cpp",
        type: "flow",
        caption: "Trình biên dịch đọc file theo thứ tự từ trên xuống dưới.",
        items: [
          { label: "1. Tiền xử lý", value: "#include <iostream>", detail: "Nạp thư viện cần dùng" },
          { label: "2. Không gian tên", value: "using namespace std;", detail: "Mở khóa tên chuẩn std::" },
          { label: "3. Thân hàm main", value: "int main() { ... }", detail: "Khối lệnh thực thi chính", highlight: true },
          { label: "4. Mã thoát", value: "return 0;", detail: "Kết thúc an toàn" }
        ]
      },
      examples: [
        {
          title: "Ví dụ 1: Dùng std:: trực tiếp không cần using namespace",
          level: "Cơ bản",
          description: "Cách viết an toàn tuyệt đối thường dùng trong các dự án phần mềm lớn.",
          code: `#include <iostream>

/*
 * Chuong trinh minh hoa cau truc chuan C++
 * Khong dung using namespace std de tranh xung dot ten
 */
int main() {
    // In thong bao kem xuong dong bang \\n
    std::cout << "Cau truc C++ chuan muc!\\n";
    return 0;
}`,
          expectedOutput: "Cau truc C++ chuan muc!",
          lineExplanations: [
            { line: "Dòng 3-6", code: "/* ... */", explanation: "Chú thích nhiều dòng mô tả tổng quan mục đích của chương trình." },
            { line: "Dòng 9", code: "std::cout", explanation: "Toán tử :: truy cập trực tiếp cout nằm bên trong không gian tên std." }
          ]
        },
        {
          title: "Ví dụ 2: Ghép nhiều giá trị trên một dòng cout",
          level: "Thực tế",
          description: "Có thể nối chuỗi liên tiếp nhiều toán tử << trong cùng một câu lệnh cout.",
          code: `#include <iostream>
using namespace std;

int main() {
    cout << "Khoa hoc: " << "C++ Programming" << "\\n";
    cout << "Tong so chuong: " << 18 << " chuong" << endl;
    return 0;
}`,
          expectedOutput: "Khoa hoc: C++ Programming\nTong so chuong: 18 chuong",
          lineExplanations: [
            { line: "Dòng 5", code: 'cout << "Khoa hoc: " << "C++ Programming" << "\\n";', explanation: "Chaining (nối chuỗi) toán tử << giúp in liền mạch chữ và số." },
            { line: "Dòng 6", code: "<< 18 <<", explanation: "cout tự động nhận diện số nguyên 18 mà không cần đặt trong ngoặc kép." }
          ]
        }
      ],
      commonMistakes: [
        {
          title: "Viết hoa sai tên hàm main hoặc từ khóa",
          badCode: `int Main() {
    Cout << "Loi!";
    return 0;
}`,
          goodCode: `int main() {
    cout << "Chinh xac!";
    return 0;
}`,
          explanation: "C++ phân biệt hoa thường nghiêm ngặt. Cả `main`, `int`, `cout`, `return` đều phải viết thường hoàn toàn."
        },
        {
          title: "Thiếu dấu đóng ngoặc nhọn }",
          badCode: `int main() {
    cout << "Test";
    return 0;`,
          goodCode: `int main() {
    cout << "Test";
    return 0;
}`,
          explanation: "Mọi khối lệnh mở bằng `{` đều phải đóng bằng `}`. Trình soạn thảo Monaco trên CODELAB tự động đóng ngoặc giúp bạn hạn chế lỗi này."
        }
      ],
      practice: {
        title: "Thực hành: Sửa cấu trúc chương trình bị lỗi",
        prompt: "Đoạn code bên phải đang có 3 lỗi cấu trúc/chú thích. Hãy sửa để chương trình biên dịch thành công và in ra:\nCODELAB\nVersion 2026",
        starterCode: `#include <iostream>
using namespace std;

int Main() {
    /* Dong chu thich chua dong
    cout << "CODELAB" << "\\n";
    cout << "Version " << 2026 << endl
    return 0;
}`,
        expectedOutput: "CODELAB\nVersion 2026",
        hints: [
          "Kiểm tra tên hàm Main() -> phải viết thường thành main().",
          "Chú thích mở bằng /* cần có */ hoặc đổi sang //.",
          "Kiểm tra dấu chấm phẩy ; cuối dòng cout thứ hai."
        ],
        solutionCode: `#include <iostream>
using namespace std;

int main() {
    // Dong chu thich da sua
    cout << "CODELAB" << "\\n";
    cout << "Version " << 2026 << endl;
    return 0;
}`
      },
      checkpointQuiz: {
        question: "Đoạn chú thích nào sau đây hợp lệ trong C++?",
        options: [
          "# Day la chu thich",
          "// Day la chu thich",
          "-- Day la chu thich",
          "<!-- Day la chu thich -->"
        ],
        correctIndex: 1,
        explanation: "Trong C++, chú thích 1 dòng dùng `//` và chú thích nhiều dòng dùng `/* ... */`. Dấu `#` dùng cho chỉ thị tiền xử lý (như #include)."
      },
      takeaways: [
        "C++ phân biệt chữ HOA và chữ thường ở mọi từ khóa và tên hàm.",
        "Cặp ngoặc nhọn {} định nghĩa phạm vi một khối lệnh.",
        "Sử dụng // hoặc /* ... */ để giải thích logic quan trọng, giúp bản thân và đồng đội dễ bảo trì."
      ]
    }
  },

  // =========================================================================
  // BÀI 3: BIẾN VÀ KIỂU DỮ LIỆU
  // =========================================================================
  {
    id: "lesson-cpp-03",
    section_id: "sec-cpp-03",
    course_id: "course-cpp",
    slug: "bien-va-kieu-du-lieu",
    title: "Biến, Hằng số và các Kiểu dữ liệu cơ bản",
    summary: "Hiểu cách bộ nhớ RAM lưu trữ giá trị qua biến, lựa chọn đúng kiểu dữ liệu (int, long long, double, char, bool, string) và phòng tránh tràn số.",
    estimated_minutes: 20,
    xp_reward: 60,
    sort_order: 1,
    language: "cpp",
    content: {
      introduction:
        "Để chương trình có thể ghi nhớ điểm số người chơi, tên học viên hay kết quả phép tính, ta cần đến Biến (Variable). Hãy tưởng tượng RAM như một tủ đựng đồ gồm hàng tỷ chiếc hộp: mỗi biến là một chiếc hộp được dán nhãn tên rõ ràng và chỉ chứa đúng một loại đồ vật nhất định gọi là Kiểu dữ liệu (Data Type).",
      objectives: [
        "Khai báo và khởi tạo biến đúng cú pháp và quy tắc đặt tên chuẩn.",
        "Chọn chính xác giữa int, long long, double, char, bool và string cho từng bài toán.",
        "Nhận biết hiện tượng tràn số (Integer Overflow) và cách dùng hằng số const."
      ],
      theoryBlocks: [
        {
          heading: "1. Biến là gì và quy tắc đặt tên?",
          paragraphs: [
            "Cú pháp khai báo biến trong C++ là: `<kiểu_dữ_liệu> <tên_biến> = <giá_trị_ban_đầu>;`. Ví dụ: `int tuoi = 18;`. Vì C++ là ngôn ngữ kiểu tĩnh (statically typed), bạn phải cho trình biên dịch biết rõ kiểu dữ liệu trước khi sử dụng biến.",
            "Tên biến chỉ được chứa chữ cái, chữ số và dấu gạch dưới `_`; KHÔNG được bắt đầu bằng chữ số, KHÔNG chứa khoảng trắng và KHÔNG trùng từ khóa của C++ (như `int`, `return`, `if`)."
          ],
          glossary: [
            { term: "Biến (Variable)", definition: "Vùng nhớ có tên trong RAM dùng để lưu trữ dữ liệu có thể thay đổi trong quá trình chương trình chạy." },
            { term: "Kiểu dữ liệu (Data Type)", definition: "Quy định kích thước bộ nhớ (bao nhiêu byte) và loại giá trị mà biến có thể chứa." },
            { term: "Tràn số (Overflow)", definition: "Lỗi xảy ra khi giá trị tính toán vượt quá giới hạn tối đa mà kiểu dữ liệu lưu được, khiến số bị quay vòng sang số âm bất ngờ." }
          ]
        },
        {
          heading: "2. 6 kiểu dữ liệu cốt lõi cần thuộc lòng",
          paragraphs: [
            "`int` (4 byte): lưu số nguyên từ khoảng -2 tỷ đến +2 tỷ (-2×10⁹ đến 2×10⁹). Dùng cho đếm số lượng, tuổi, chỉ số mảng.",
            "`long long` (8 byte): lưu số nguyên rất lớn lên tới ±9×10¹⁸. Cực kỳ quan trọng trong giải thuật khi tích 2 số nguyên lớn vượt 2 tỷ!",
            "`double` (8 byte): lưu số thực có phần thập phân với độ chính xác khoảng 15 chữ số (nên ưu tiên `double` thay vì `float`).",
            "`char` (1 byte): lưu ĐÚNG MỘT ký tự đặt trong dấu nháy đơn, ví dụ `'A'`, `'9'`. `bool` (1 byte): chỉ nhận `true` (đúng/1) hoặc `false` (sai/0). `string`: lưu chuỗi nhiều ký tự đặt trong nháy kép (cần `#include <string>`)."
          ],
          callout: {
            type: "warning",
            title: "Bẫy kinh điển: Dùng int cho kết quả vượt 2 tỷ",
            content: "Nếu a = 100000 và b = 100000, tích a * b = 10^10 đã vượt giới hạn kiểu int (~2.14×10^9). Hãy luôn dùng long long khi dữ liệu đề bài lên đến 10^9!"
          }
        },
        {
          heading: "3. Hằng số (const)",
          paragraphs: [
            "Nếu một giá trị không bao giờ được phép thay đổi trong suốt chương trình (ví dụ số PI = 3.14159 hoặc điểm tối đa = 100), hãy thêm từ khóa `const` phía trước: `const double PI = 3.14159;`. Mọi thao tác gán lại giá trị cho hằng số sẽ bị trình biên dịch chặn ngay lập tức."
          ]
        }
      ],
      diagram: {
        title: "Bảng so sánh kích thước và miền giá trị các kiểu cơ bản",
        type: "table",
        caption: "Chọn đúng kiểu dữ liệu giúp vừa tiết kiệm bộ nhớ vừa không bao giờ bị tràn số.",
        items: [
          { label: "int", value: "4 bytes", detail: "-2.14×10⁹ → 2.14×10⁹ (số nguyên thông thường)" },
          { label: "long long", value: "8 bytes", detail: "-9.22×10¹⁸ → 9.22×10¹⁸ (số nguyên lớn)", highlight: true },
          { label: "double", value: "8 bytes", detail: "Số thập phân độ chính xác cao (~15 chữ số)" },
          { label: "char", value: "1 byte", detail: "1 ký tự ASCII trong nháy đơn: 'A', 'z', '0'" },
          { label: "bool", value: "1 byte", detail: "Giá trị đúng/sai: true (1) hoặc false (0)" }
        ]
      },
      examples: [
        {
          title: "Ví dụ 1: Khai báo hồ sơ sinh viên với đầy đủ kiểu dữ liệu",
          level: "Cơ bản",
          description: "Minh họa cách khai báo và in các kiểu string, int, double, char, bool.",
          code: `#include <iostream>
#include <string>
using namespace std;

int main() {
    string hoTen = "Nguyen Minh Anh";
    int namSinh = 2006;
    double diemTB = 8.75;
    char xepLoai = 'A';
    bool daTotNghiep = false;

    cout << "Ho ten: " << hoTen << "\\n";
    cout << "Nam sinh: " << namSinh << "\\n";
    cout << "Diem TB: " << diemTB << " | Hang: " << xepLoai << "\\n";
    cout << "Tot nghiep: " << daTotNghiep << "\\n";
    return 0;
}`,
          expectedOutput: "Ho ten: Nguyen Minh Anh\nNam sinh: 2006\nDiem TB: 8.75 | Hang: A\nTot nghiep: 0",
          lineExplanations: [
            { line: "Dòng 2", code: "#include <string>", explanation: "Nạp thư viện để sử dụng kiểu chuỗi ký tự string." },
            { line: "Dòng 9", code: "char xepLoai = 'A';", explanation: "Kiểu char dùng dấu nháy ĐƠN ' ' thay vì nháy kép." },
            { line: "Dòng 15", code: "cout << daTotNghiep", explanation: "Mặc định cout in false là 0 và true là 1." }
          ]
        },
        {
          title: "Ví dụ 2: Tính chu vi & diện tích hình tròn dùng const",
          level: "Thực tế",
          description: "Sử dụng hằng số PI và kiểu double cho tính toán hình học chính xác.",
          code: `#include <iostream>
using namespace std;

int main() {
    const double PI = 3.14159;
    double banKinh = 5.0;
    double dienTich = PI * banKinh * banKinh;

    cout << "Ban kinh: " << banKinh << "\\n";
    cout << "Dien tich: " << dienTich << "\\n";
    return 0;
}`,
          expectedOutput: "Ban kinh: 5\nDien tich: 78.5397",
          lineExplanations: [
            { line: "Dòng 5", code: "const double PI = 3.14159;", explanation: "Từ khóa const bảo vệ hằng số PI không bị vô tình sửa đổi." },
            { line: "Dòng 7", code: "double dienTich = ...", explanation: "Kết quả biểu thức thực được lưu nguyên vẹn vào biến double." }
          ]
        }
      ],
      commonMistakes: [
        {
          title: "Dùng biến chưa khởi tạo (Giá trị rác - Garbage Value)",
          badCode: `int tong;
cout << tong; // In ra so ngau nhien ky la trong RAM!`,
          goodCode: `int tong = 0;
cout << tong; // Luon la 0`,
          explanation: "Biến cục bộ trong C++ không tự động mang giá trị 0. Hãy luôn gán giá trị khởi tạo ngay khi khai báo."
        },
        {
          title: "Nhầm dấu nháy đơn và nháy kép cho char/string",
          badCode: `char kyTu = "A"; // Loi bien dich!`,
          goodCode: `char kyTu = 'A';`,
          explanation: '`"A"` là một chuỗi ký tự (có thêm ký tự kết thúc `\\0`), còn `\'A\'` mới là một ký tự `char` duy nhất.'
        }
      ],
      practice: {
        title: "Thực hành: Quản lý kho hàng tránh tràn số",
        prompt: "Một kho chứa `soLuong = 200000` sản phẩm, mỗi sản phẩm có giá `donGia = 50000` đồng. Hãy khai báo biến với kiểu dữ liệu phù hợp để tính và in ra `Tong gia tri: 10000000000` mà không bị tràn số!",
        starterCode: `#include <iostream>
using namespace std;

int main() {
    // Sửa kiểu dữ liệu bên dưới để tránh tràn số int
    int soLuong = 200000;
    int donGia = 50000;
    int tongGiaTri = soLuong * donGia;
    cout << "Tong gia tri: " << tongGiaTri << endl;
    return 0;
}`,
        expectedOutput: "Tong gia tri: 10000000000",
        hints: [
          "200000 * 50000 = 10,000,000,000 (10 tỷ), lớn hơn giới hạn của int (~2.14 tỷ).",
          "Đổi cả soLuong, donGia và tongGiaTri sang kiểu long long."
        ],
        solutionCode: `#include <iostream>
using namespace std;

int main() {
    long long soLuong = 200000;
    long long donGia = 50000;
    long long tongGiaTri = soLuong * donGia;
    cout << "Tong gia tri: " << tongGiaTri << endl;
    return 0;
}`
      },
      checkpointQuiz: {
        question: "Cần lưu tổng dân số thế giới (~8,200,000,000 người). Kiểu dữ liệu nào dưới đây an toàn nhất?",
        options: ["short", "int", "long long", "char"],
        correctIndex: 2,
        explanation: "Kiểu int tối đa chỉ lưu được khoảng 2.14 tỷ (2,147,483,647). Với 8.2 tỷ, bạn bắt buộc phải dùng `long long` (tối đa ~9.22×10^18)."
      },
      takeaways: [
        "Luôn khởi tạo giá trị cho biến ngay khi khai báo để tránh giá trị rác.",
        "Dùng `long long` thay cho `int` bất cứ khi nào kết quả có thể vượt quá 2 tỷ.",
        "Dùng `const` cho những giá trị cố định không đổi trong chương trình."
      ]
    }
  },

  // =========================================================================
  // BÀI 4: NHẬP XUẤT DỮ LIỆU
  // =========================================================================
  {
    id: "lesson-cpp-04",
    section_id: "sec-cpp-04",
    course_id: "course-cpp",
    slug: "nhap-xuat-du-lieu",
    title: "Nhập xuất dữ liệu với cin, cout và định dạng số",
    summary: "Đọc dữ liệu từ bàn phím/stdin bằng cin, getline, định dạng số thập phân bằng iomanip và hiểu cách hệ thống chấm bài truyền Input.",
    estimated_minutes: 18,
    xp_reward: 60,
    sort_order: 1,
    language: "cpp",
    content: {
      introduction:
        "Một chương trình hữu ích phải biết tương tác với dữ liệu đầu vào thay vì chỉ in ra những con số cố định. Trong C++, `cin` giúp đọc dữ liệu từ luồng vào chuẩn (`stdin`) — chính là ô Input khi bạn luyện tập và cũng là cách máy chấm bài tự động nạp bộ test vào chương trình của bạn.",
      objectives: [
        "Đọc nhiều biến liên tiếp bằng toán tử trích xuất `cin >>`.",
        "Hiểu cách làm tròn và in đúng số chữ số sau dấu phẩy bằng `fixed << setprecision(k)`.",
        "Biết cách đọc chuỗi có chứa dấu cách bằng `getline` và xử lý lỗi trôi lệnh."
      ],
      theoryBlocks: [
        {
          heading: "1. Cơ chế hoạt động của cin",
          paragraphs: [
            "Toán tử `>>` của `cin` tự động bỏ qua các khoảng trắng (dấu cách, Tab, Enter) rồi đọc giá trị tiếp theo vào biến. Bạn có thể đọc nhiều biến trên cùng một dòng lệnh: `cin >> a >> b;` — dù người dùng nhập `10 20` trên 1 dòng hay nhập trên 2 dòng khác nhau, `cin` đều đọc chính xác!",
            "Lưu ý quan trọng khi làm bài trên hệ thống chấm tự động (như CODELAB / LeetCode / Codeforces): KHÔNG in ra các câu nhắc như `cout << \"Nhap a: \";`, vì hệ thống so sánh từng ký tự của `stdout` với đáp án mẫu!"
          ],
          glossary: [
            { term: "stdin (Standard Input)", definition: "Luồng dữ liệu đầu vào tiêu chuẩn (bàn phím hoặc tệp test case mà hệ thống chấm bài truyền vào)." },
            { term: "iomanip", definition: "Thư viện chuẩn của C++ chuyên dùng định dạng đầu ra như độ rộng cột và số chữ số thập phân (setprecision)." }
          ],
          callout: {
            type: "warning",
            title: "Lưu ý vàng khi làm bài tập chấm tự động",
            content: "Chỉ in ra ĐÚNG kết quả mà đề bài yêu cầu. Nếu đề yêu cầu in tổng `30` mà bạn in `Tong la: 30`, máy chấm sẽ báo Wrong Answer!"
          }
        },
        {
          heading: "2. Định dạng số thực với fixed và setprecision",
          paragraphs: [
            "Mặc định, `cout` chỉ hiển thị tối đa 6 chữ số có nghĩa cho số thực. Khi đề bài yêu cầu 'in ra chính xác 2 chữ số sau dấu phẩy', bạn nạp `#include <iomanip>` và viết `cout << fixed << setprecision(2) << giaTri;`."
          ]
        }
      ],
      diagram: {
        title: "Luồng dữ liệu qua stdin → Chương trình → stdout",
        type: "flow",
        caption: "cin đọc từng token ngăn cách bởi khoảng trắng từ bộ đệm stdin.",
        items: [
          { label: "Ô Input (stdin)", value: "12 35", detail: "Dữ liệu đầu vào truyền vào chương trình" },
          { label: "cin >> a >> b", value: "a = 12, b = 35", detail: "Tự động tách theo dấu cách / xuống dòng", highlight: true },
          { label: "Xử lý tính toán", value: "tong = a + b", detail: "CPU thực hiện phép toán = 47" },
          { label: "cout << tong", value: "47", detail: "Xuất sạch kết quả ra stdout" }
        ]
      },
      examples: [
        {
          title: "Ví dụ 1: Nhập 2 số nguyên và tính tổng, hiệu",
          level: "Cơ bản",
          description: "Đọc đồng thời 2 số từ stdin và xuất kết quả ra 2 dòng riêng biệt.",
          code: `#include <iostream>
using namespace std;

int main() {
    long long a, b;
    cin >> a >> b;
    cout << "Tong: " << a + b << "\\n";
    cout << "Hieu: " << a - b << "\\n";
    return 0;
}`,
          sampleInput: "15 7",
          expectedOutput: "Tong: 22\nHieu: 8",
          lineExplanations: [
            { line: "Dòng 6", code: "cin >> a >> b;", explanation: "Đọc số đầu tiên vào a (15), bỏ qua dấu cách rồi đọc số thứ hai vào b (7)." },
            { line: "Dòng 7-8", code: "cout << ... << a + b", explanation: "Có thể viết trực tiếp biểu thức tính toán bên trong lệnh cout." }
          ]
        },
        {
          title: "Ví dụ 2: Tính điểm trung bình làm tròn 2 chữ số thập phân",
          level: "Thực tế",
          description: "Kết hợp iomanip để luôn hiển thị đúng 2 chữ số thập phân (kể cả số .00).",
          code: `#include <iostream>
#include <iomanip>
using namespace std;

int main() {
    double toan, ly, hoa;
    cin >> toan >> ly >> hoa;
    double tb = (toan + ly + hoa) / 3.0;
    cout << fixed << setprecision(2) << tb << "\\n";
    return 0;
}`,
          sampleInput: "8.5 9.0 7.75",
          expectedOutput: "8.42",
          lineExplanations: [
            { line: "Dòng 2", code: "#include <iomanip>", explanation: "Bắt buộc phải nạp thư viện này để dùng setprecision." },
            { line: "Dòng 8", code: "/ 3.0", explanation: "Chia cho 3.0 để đảm bảo phép chia số thực." },
            { line: "Dòng 9", code: "fixed << setprecision(2)", explanation: "Cố định đúng 2 chữ số sau dấu chấm thập phân." }
          ]
        }
      ],
      commonMistakes: [
        {
          title: "Dùng cin >> để đọc họ tên có dấu cách",
          badCode: `string hoTen;
cin >> hoTen; // Nhap "Tran Van A" chi doc duoc "Tran"!`,
          goodCode: `string hoTen;
getline(cin, hoTen); // Doc tron ven ca dong "Tran Van A"`,
          explanation: "`cin >>` dừng ngay khi gặp dấu cách đầu tiên. Để đọc cả dòng có khoảng trắng, hãy dùng `getline(cin, tenBien)`. Nếu trước đó có dùng `cin >>`, nhớ gọi `cin.ignore();` để xóa ký tự Enter còn sót."
        }
      ],
      practice: {
        title: "Thực hành: Quy đổi nhiệt độ Celsius sang Fahrenheit",
        prompt: "Nhập một số thực `C` từ ô Input (stdin). Tính nhiệt độ Fahrenheit theo công thức `F = C * 9.0 / 5.0 + 32` và in ra làm tròn chính xác 2 chữ số thập phân.",
        starterCode: `#include <iostream>
#include <iomanip>
using namespace std;

int main() {
    double c;
    cin >> c;
    // Viết công thức tính f và in ra 2 chữ số thập phân
    return 0;
}`,
        sampleInput: "37",
        expectedOutput: "98.60",
        hints: [
          "Công thức: double f = c * 9.0 / 5.0 + 32.0;",
          "In ra bằng: cout << fixed << setprecision(2) << f << endl;"
        ],
        solutionCode: `#include <iostream>
#include <iomanip>
using namespace std;

int main() {
    double c;
    cin >> c;
    double f = c * 9.0 / 5.0 + 32.0;
    cout << fixed << setprecision(2) << f << endl;
    return 0;
}`
      },
      checkpointQuiz: {
        question: "Nếu dữ liệu đầu vào là `25 40` và code chạy `int x, y; cin >> x >> y;`, giá trị của `y` là bao nhiêu?",
        options: ["25", "40", "2540", "Báo lỗi vì có dấu cách"],
        correctIndex: 1,
        explanation: "Toán tử `>>` tự động phân tách dữ liệu theo khoảng trắng, nên `x = 25` và `y = 40`."
      },
      takeaways: [
        "Dùng `cin >>` để đọc số/từ tách bởi khoảng trắng, và `getline(cin, s)` để đọc cả dòng văn bản.",
        "Dùng `#include <iomanip>` với `fixed << setprecision(k)` khi cần làm tròn số thập phân.",
        "Khi giải bài chấm tự động, không in lời nhắc thừa như 'Nhap n:' ra stdout."
      ]
    }
  },

  // =========================================================================
  // BÀI 5: TOÁN TỬ
  // =========================================================================
  {
    id: "lesson-cpp-05",
    section_id: "sec-cpp-05",
    course_id: "course-cpp",
    slug: "toan-tu-trong-cpp",
    title: "Toán tử số học, chia lấy dư, so sánh và logic",
    summary: "Làm chủ phép chia nguyên vs chia thực, phép chia lấy dư %, toán tử tăng giảm ++/--, so sánh và kết hợp điều kiện logic &&, ||, !.",
    estimated_minutes: 20,
    xp_reward: 60,
    sort_order: 1,
    language: "cpp",
    content: {
      introduction:
        "Toán tử là công cụ giúp chương trình tính toán và ra quyết định. Có một điểm cực kỳ thú vị trong C++ khiến gần như 100% người mới từng bất ngờ: tại sao `5 / 2` lại bằng `2` chứ không phải `2.5`? Bài học này sẽ giải mã rõ ràng tất cả các nhóm toán tử cốt lõi.",
      objectives: [
        "Phân biệt phép chia nguyên (integer division) và phép chia thực (floating-point division).",
        "Ứng dụng phép chia lấy dư `%` trong tách chữ số, kiểm tra chẵn/lẻ và quy đổi thời gian.",
        "Sử dụng thành thạo toán tử so sánh (`==`, `!=`, `<=`, `>=`) và toán tử logic (`&&`, `||`, `!`)."
      ],
      theoryBlocks: [
        {
          heading: "1. Toán tử số học và bí mật của phép chia /",
          paragraphs: [
            "C++ có 5 toán tử số học cơ bản: `+` (cộng), `-` (trừ), `*` (nhân), `/` (chia), và `%` (chia lấy phần dư — chỉ áp dụng cho số nguyên).",
            "QUY TẮC QUAN TRỌNG: Nếu cả hai toán hạng của phép `/` đều là số nguyên (ví dụ `7 / 2`), C++ sẽ thực hiện **chia lấy phần nguyên** và cắt bỏ hoàn toàn phần thập phân → kết quả là `3`! Muốn có `3.5`, ít nhất một vế phải là số thực, ví dụ `7.0 / 2` hoặc `(double)a / b`."
          ],
          glossary: [
            { term: "Ép kiểu (Type Casting)", definition: "Chuyển đổi tạm thời một giá trị sang kiểu dữ liệu khác, ví dụ `(double)a` hoặc `static_cast<double>(a)`." },
            { term: "Toán tử Modulo (%)", definition: "Trả về phần dư của phép chia nguyên. Ví dụ `17 % 5 = 2`, `10 % 2 = 0`." }
          ]
        },
        {
          heading: "2. Toán tử gán ghép, so sánh và logic",
          paragraphs: [
            "Thay vì viết `x = x + 5;`, bạn có thể viết gọn `x += 5;`. Tương tự với `-=`, `*=`, `/=`, `%=`. Đặc biệt `x++` giúp tăng `x` thêm 1 đơn vị.",
            "Toán tử so sánh trả về `true` (1) hoặc `false` (0): bằng nhau là `==` (HAI dấu bằng, khác với phép gán một dấu `=`), khác nhau là `!=`, lớn/nhỏ hơn `>`, `<`, `>=`, `<=`.",
            "Toán tử logic kết hợp nhiều điều kiện: `&&` (VÀ — đúng khi cả 2 vế cùng đúng), `||` (HOẶC — đúng khi ít nhất 1 vế đúng), `!` (PHỦ ĐỊNH — đảo ngược đúng thành sai)."
          ],
          callout: {
            type: "tip",
            title: "Mẹo dùng ngoặc tròn () khi viết biểu thức dài",
            content: "Thay vì cố ghi nhớ toàn bộ bảng độ ưu tiên toán tử, hãy chủ động dùng cặp dấu ngoặc tròn `(...)` để biểu thức vừa rõ ràng cho người đọc vừa đảm bảo đúng thứ tự tính toán!"
          }
        }
      ],
      diagram: {
        title: "Bảng chân trị toán tử Logic (A && B, A || B)",
        type: "table",
        caption: "Nắm chắc bảng này là nền tảng cho mọi câu lệnh rẽ nhánh if-else ở chương sau.",
        items: [
          { label: "true && true", value: "true (1)", detail: "Cả hai điều kiện đều thỏa mãn", highlight: true },
          { label: "true && false", value: "false (0)", detail: "Chỉ cần 1 vế sai → && sai" },
          { label: "true || false", value: "true (1)", detail: "Chỉ cần 1 vế đúng → || đúng", highlight: true },
          { label: "false || false", value: "false (0)", detail: "Cả hai cùng sai → || sai" },
          { label: "!true", value: "false (0)", detail: "Đảo ngược giá trị logic" }
        ]
      },
      examples: [
        {
          title: "Ví dụ 1: Tách chữ số hàng chục và hàng đơn vị bằng / và %",
          level: "Cơ bản",
          description: "Kỹ thuật dùng chia nguyên và chia lấy dư rất hay gặp trong lập trình.",
          code: `#include <iostream>
using namespace std;

int main() {
    int n = 74;
    int hangChuc = n / 10;     // 74 / 10 = 7
    int hangDonVi = n % 10;    // 74 % 10 = 4

    cout << "Hang chuc: " << hangChuc << "\\n";
    cout << "Hang don vi: " << hangDonVi << "\\n";
    cout << "Tong hai chu so: " << hangChuc + hangDonVi << "\\n";
    return 0;
}`,
          expectedOutput: "Hang chuc: 7\nHang don vi: 4\nTong hai chu so: 11",
          lineExplanations: [
            { line: "Dòng 6", code: "n / 10", explanation: "Chia nguyên cho 10 loại bỏ chữ số cuối, còn lại hàng chục = 7." },
            { line: "Dòng 7", code: "n % 10", explanation: "Lấy phần dư khi chia cho 10 luôn thu được chữ số hàng đơn vị = 4." }
          ]
        },
        {
          title: "Ví dụ 2: Quy đổi số giây thành Giờ : Phút : Giây",
          level: "Thực tế",
          description: "Ứng dụng kết hợp / và % để xử lý thời gian.",
          code: `#include <iostream>
using namespace std;

int main() {
    int tongGiay;
    cin >> tongGiay;
    int gio = tongGiay / 3600;
    int phut = (tongGiay % 3600) / 60;
    int giay = tongGiay % 60;

    cout << gio << "h " << phut << "m " << giay << "s\\n";
    return 0;
}`,
          sampleInput: "3665",
          expectedOutput: "1h 1m 5s",
          lineExplanations: [
            { line: "Dòng 7", code: "tongGiay / 3600", explanation: "1 giờ có 3600 giây nên chia nguyên cho 3600 ra số giờ." },
            { line: "Dòng 8", code: "(tongGiay % 3600) / 60", explanation: "Phần dư sau khi trừ số giờ chia tiếp cho 60 để ra số phút." },
            { line: "Dòng 9", code: "tongGiay % 60", explanation: "Số giây lẻ còn lại sau khi đã quy ra phút." }
          ]
        }
      ],
      commonMistakes: [
        {
          title: "Nhầm phép chia nguyên khi tính trung bình",
          badCode: `int a = 5, b = 2;
double tb = (a + b) / 2; // Kết quả ra 3.0 thay vì 3.5!`,
          goodCode: `int a = 5, b = 2;
double tb = (a + b) / 2.0; // Kết quả chính xác 3.5`,
          explanation: "`(a + b)` là `int` (7) chia `2` cũng là `int`, nên phép chia thực hiện xong ra `3` RỒI mới ép sang `double` thành `3.0`!"
        },
        {
          title: "Viết biểu thức khoảng kiểu toán học `1 <= x <= 10`",
          badCode: `bool hopLe = (1 <= x <= 10); // SAI logic trong C++!`,
          goodCode: `bool hopLe = (1 <= x && x <= 10);`,
          explanation: "C++ đánh giá `(1 <= x)` thành `0` hoặc `1`, rồi đem `0`/`1` so sánh tiếp `<= 10` (luôn đúng!). Luôn tách thành hai điều kiện nối bằng `&&`."
        }
      ],
      practice: {
        title: "Thực hành: Tính tổng 3 chữ số của một số nguyên",
        prompt: "Nhập một số nguyên dương có đúng 3 chữ số `n` (ví dụ `485`). Hãy dùng `/` và `%` để tính và in ra tổng 3 chữ số của `n` (với `485` thì in ra `17`).",
        starterCode: `#include <iostream>
using namespace std;

int main() {
    int n;
    cin >> n;
    // Tách trăm, chục, đơn vị rồi in tổng
    return 0;
}`,
        sampleInput: "485",
        expectedOutput: "17",
        hints: [
          "Chữ số hàng trăm: n / 100",
          "Chữ số hàng chục: (n / 10) % 10",
          "Chữ số hàng đơn vị: n % 10"
        ],
        solutionCode: `#include <iostream>
using namespace std;

int main() {
    int n;
    cin >> n;
    int tram = n / 100;
    int chuc = (n / 10) % 10;
    int donVi = n % 10;
    cout << tram + chuc + donVi << endl;
    return 0;
}`
      },
      checkpointQuiz: {
        question: "Giá trị của biểu thức `17 / 5 + 17 % 5` trong C++ là bao nhiêu?",
        options: ["5.4", "5", "6", "7"],
        correctIndex: 1,
        explanation: "`17 / 5` là phép chia nguyên nên bằng `3`. `17 % 5` là phần dư nên bằng `2`. Tổng `3 + 2 = 5`."
      },
      takeaways: [
        "Hai số nguyên chia nhau bằng `/` luôn bỏ phần thập phân; hãy dùng `2.0` hoặc `(double)` khi cần chia thực.",
        "Phép `%` cực kỳ hữu ích để kiểm tra chia hết (`n % k == 0`) và tách chữ số.",
        "Không viết `a < x < b`, hãy luôn viết `a < x && x < b`."
      ]
    }
  },

  // =========================================================================
  // BÀI 6: CÂU LỆNH ĐIỀU KIỆN
  // =========================================================================
  {
    id: "lesson-cpp-06",
    section_id: "sec-cpp-06",
    course_id: "course-cpp",
    slug: "cau-lenh-dieu-kien",
    title: "Câu lệnh rẽ nhánh if, else if, else và switch-case",
    summary: "Giúp chương trình biết ra quyết định thông minh theo từng tình huống đầu vào bằng cấu trúc rẽ nhánh và toán tử ba ngôi.",
    estimated_minutes: 20,
    xp_reward: 65,
    sort_order: 1,
    language: "cpp",
    content: {
      introduction:
        "Cho tới lúc này, các chương trình của bạn đều chạy thẳng một mạch từ trên xuống dưới. Nhưng trong đời thực, phần mềm luôn phải ra quyết định: nếu mật khẩu đúng thì cho đăng nhập, nếu sai thì báo lỗi; nếu điểm >= 8.0 thì xếp loại Giỏi... Câu lệnh điều kiện chính là 'bộ não' giúp chương trình rẽ nhánh theo logic.",
      objectives: [
        "Viết thành thạo cấu trúc `if`, `if - else`, và chuỗi `if - else if - else`.",
        "Hiểu khi nào nên dùng `switch-case` và vai trò sống còn của câu lệnh `break`.",
        "Ứng dụng toán tử ba ngôi `? :` để rút gọn các phép gán điều kiện đơn giản."
      ],
      theoryBlocks: [
        {
          heading: "1. Cấu trúc if – else if – else",
          paragraphs: [
            "Chương trình kiểm tra điều kiện trong ngoặc tròn `if (điều_kiện)`. Nếu kết quả là `true`, khối lệnh ngay sau `if` sẽ chạy và bỏ qua toàn bộ các nhánh `else if` / `else` phía dưới.",
            "Nếu điều kiện `if` sai, chương trình kiểm tra lần lượt từng nhánh `else if`. Nếu tất cả đều sai, nhánh `else` cuối cùng (nếu có) sẽ được thực thi như phương án dự phòng."
          ],
          glossary: [
            { term: "Rẽ nhánh (Branching)", definition: "Cơ chế cho phép chương trình chọn một trong nhiều luồng lệnh khác nhau dựa trên kết quả đúng/sai của điều kiện." },
            { term: "Fall-through", definition: "Hiện tượng trong switch-case khi quên lệnh break, khiến chương trình chạy tràn xuống các case kế tiếp." }
          ]
        },
        {
          heading: "2. Switch-Case và Toán tử ba ngôi",
          paragraphs: [
            "Khi bạn cần so sánh một biến số nguyên hoặc ký tự (`int`, `char`) với nhiều giá trị rời rạc cố định (như chọn menu 1..4, hoặc ngày trong tuần 2..8), `switch-case` giúp code gọn gàng và dễ đọc hơn nhiều nhánh `else if`.",
            "Toán tử ba ngôi có cú pháp: `điều_kiện ? giá_trị_nếu_đúng : giá_trị_nếu_sai`. Ví dụ: `string ketQua = (diem >= 5) ? \"Dat\" : \"Truot\";`."
          ],
          callout: {
            type: "warning",
            title: "Luôn cẩn thận lỗi dùng nhầm = thay cho ==",
            content: "Viết `if (x = 5)` là phép GÁN 5 cho x (luôn đúng vì 5 khác 0!), KHÔNG phải so sánh x có bằng 5 không! Luôn kiểm tra kỹ hai dấu bằng `==`."
          }
        }
      ],
      diagram: {
        title: "Sơ đồ rẽ nhánh xếp loại học lực",
        type: "flow",
        caption: "Thứ tự kiểm tra từ cao xuống thấp đảm bảo mỗi mốc điểm chỉ rơi vào đúng một nhánh.",
        items: [
          { label: "diem >= 8.0 ?", value: "Đúng → Gioi", detail: "Dừng, bỏ qua các nhánh dưới", highlight: true },
          { label: "diem >= 6.5 ?", value: "Đúng → Kha", detail: "Chạy khi diem < 8.0" },
          { label: "diem >= 5.0 ?", value: "Đúng → Trung binh", detail: "Chạy khi diem < 6.5" },
          { label: "else (còn lại)", value: "Yeu", detail: "Khi tất cả điều kiện trên đều sai" }
        ]
      },
      examples: [
        {
          title: "Ví dụ 1: Kiểm tra năm nhuận (Leap Year)",
          level: "Thực tế",
          description: "Một năm là năm nhuận nếu chia hết cho 400, HOẶC (chia hết cho 4 VÀ không chia hết cho 100).",
          code: `#include <iostream>
using namespace std;

int main() {
    int nam;
    cin >> nam;

    if ((nam % 400 == 0) || (nam % 4 == 0 && nam % 100 != 0)) {
        cout << "Nam nhuan\\n";
    } else {
        cout << "Khong phai nam nhuan\\n";
    }
    return 0;
}`,
          sampleInput: "2024",
          expectedOutput: "Nam nhuan",
          lineExplanations: [
            { line: "Dòng 8", code: "(nam % 400 == 0) || (nam % 4 == 0 && nam % 100 != 0)", explanation: "Kết hợp chính xác điều kiện năm nhuận theo lịch Dương." },
            { line: "Dòng 10", code: "} else {", explanation: "Nhánh chạy khi điều kiện ở dòng 8 trả về false." }
          ]
        },
        {
          title: "Ví dụ 2: Máy tính bỏ túi mini dùng switch-case",
          level: "Cơ bản",
          description: "Chọn phép toán dựa theo ký tự toán tử nhập vào.",
          code: `#include <iostream>
using namespace std;

int main() {
    int a, b;
    char op;
    cin >> a >> op >> b;

    switch (op) {
        case '+': cout << a + b << "\\n"; break;
        case '-': cout << a - b << "\\n"; break;
        case '*': cout << a * b << "\\n"; break;
        case '/':
            if (b == 0) cout << "Loi chia cho 0\\n";
            else cout << a / b << "\\n";
            break;
        default:
            cout << "Toan tu khong hop le\\n";
    }
    return 0;
}`,
          sampleInput: "12 * 5",
          expectedOutput: "60",
          lineExplanations: [
            { line: "Dòng 10", code: "case '+': ... break;", explanation: "break giúp thoát ngay khỏi switch sau khi xử lý xong phép cộng." },
            { line: "Dòng 17", code: "default:", explanation: "Bắt mọi trường hợp ký tự lạ không nằm trong 4 phép toán trên." }
          ]
        }
      ],
      commonMistakes: [
        {
          title: "Đặt dấu chấm phẩy ngay sau if (...);",
          badCode: `if (x > 0); {
    cout << "Duong"; // Luon chay du x am!
}`,
          goodCode: `if (x > 0) {
    cout << "Duong";
}`,
          explanation: "Dấu `;` ngay sau `if (x > 0)` kết thúc câu lệnh if bằng một lệnh rỗng, khiến khối `{ cout << ... }` phía sau luôn được thực thi bất kể điều kiện."
        },
        {
          title: "Quên break trong switch-case",
          badCode: `switch (n) {
    case 1: cout << "Mot";
    case 2: cout << "Hai"; // Nếu n = 1 sẽ in "MotHai"!
}`,
          goodCode: `switch (n) {
    case 1: cout << "Mot"; break;
    case 2: cout << "Hai"; break;
}`,
          explanation: "Thiếu `break` gây hiệu ứng tràn (fall-through) chạy tiếp các nhánh bên dưới."
        }
      ],
      practice: {
        title: "Thực hành: Xếp loại điểm thi",
        prompt: "Nhập một điểm số thực `d` (0 <= d <= 10). In ra:\n- `Gioi` nếu d >= 8.0\n- `Kha` nếu 6.5 <= d < 8.0\n- `Trung binh` nếu 5.0 <= d < 6.5\n- `Yeu` nếu d < 5.0",
        starterCode: `#include <iostream>
using namespace std;

int main() {
    double d;
    cin >> d;
    // Viết cấu trúc if - else if - else tại đây
    return 0;
}`,
        sampleInput: "7.5",
        expectedOutput: "Kha",
        hints: [
          "Kiểm tra từ mốc cao nhất xuống thấp nhất: d >= 8.0, rồi else if (d >= 6.5), rồi else if (d >= 5.0), cuối cùng else.",
          "Chú ý viết đúng chính tả không dấu như đề yêu cầu: Gioi, Kha, Trung binh, Yeu."
        ],
        solutionCode: `#include <iostream>
using namespace std;

int main() {
    double d;
    cin >> d;
    if (d >= 8.0) cout << "Gioi\\n";
    else if (d >= 6.5) cout << "Kha\\n";
    else if (d >= 5.0) cout << "Trung binh\\n";
    else cout << "Yeu\\n";
    return 0;
}`
      },
      checkpointQuiz: {
        question: "Với `int x = 10;`, đoạn code sau in ra gì?",
        codeSnippet: `if (x > 5) cout << "A";
else if (x > 8) cout << "B";
else cout << "C";`,
        options: ["A", "AB", "B", "ABC"],
        correctIndex: 0,
        explanation: "Vì nhánh đầu `x > 5` đã ĐÚNG nên chương trình in `A` và bỏ qua toàn bộ các nhánh `else if` và `else` phía sau."
      },
      takeaways: [
        "Luôn dùng `==` để so sánh bằng, không bao giờ nhầm với `=`.",
        "Chuỗi `if - else if - else` đảm bảo tối đa chỉ 1 nhánh được thực thi.",
        "Nhớ thêm `break;` ở cuối mỗi `case` trong `switch`."
      ]
    }
  },

  // =========================================================================
  // BÀI 7: VÒNG LẶP FOR, WHILE, DO-WHILE
  // =========================================================================
  {
    id: "lesson-cpp-07",
    section_id: "sec-cpp-07",
    course_id: "course-cpp",
    slug: "vong-lap-for-while-do-while",
    title: "Vòng lặp for, while, do-while và điều khiển luồng",
    summary: "Tự động hóa hàng triệu phép tính chỉ bằng vài dòng code với for, while, do-while, break, continue và phòng tránh vòng lặp vô hạn.",
    estimated_minutes: 25,
    xp_reward: 70,
    sort_order: 1,
    language: "cpp",
    content: {
      introduction:
        "Sức mạnh thật sự của máy tính nằm ở khả năng lặp đi lặp lại một công việc hàng trăm triệu lần mỗi giây mà không hề mệt mỏi. Thay vì viết 1000 dòng `cout`, vòng lặp giúp bạn giải quyết gọn gàng chỉ trong 3 dòng code!",
      objectives: [
        "Phân biệt rõ tình huống dùng `for`, `while` và `do-while`.",
        "Sử dụng `break` để thoát vòng lặp sớm và `continue` để bỏ qua lượt hiện tại.",
        "Viết vòng lặp lồng nhau (nested loop) và phòng tránh lỗi vòng lặp vô hạn (Time Limit Exceeded)."
      ],
      theoryBlocks: [
        {
          heading: "1. Vòng lặp for — Khi đã biết trước số lần lặp",
          paragraphs: [
            "Cú pháp: `for (khởi_tạo; điều_kiện; bước_nhảy) { thân_vòng_lặp; }`. Ví dụ: `for (int i = 1; i <= n; i++)` chạy `i` lần lượt từ 1 đến n.",
            "Trình tự thực hiện: (1) Chạy `khởi_tạo` đúng 1 lần duy nhất → (2) Kiểm tra `điều_kiện`; nếu sai thì dừng → (3) Thực thi thân vòng lặp → (4) Thực hiện `bước_nhảy` → quay lại bước (2)."
          ],
          glossary: [
            { term: "Biến đếm (Loop Counter)", definition: "Biến thường đặt tên là i, j, k dùng để theo dõi lượt lặp hiện tại." },
            { term: "Vòng lặp vô hạn (Infinite Loop)", definition: "Vòng lặp mà điều kiện dừng không bao giờ trở thành false, khiến chương trình treo mãi đến khi bị ngắt (TLE)." }
          ]
        },
        {
          heading: "2. Vòng lặp while và do-while — Khi lặp theo điều kiện",
          paragraphs: [
            "`while (điều_kiện)` kiểm tra điều kiện TRƯỚC rồi mới chạy thân vòng lặp. Rất lý tưởng khi chưa biết trước số bước, ví dụ tách từng chữ số của một số nguyên cho đến khi `n == 0`.",
            "`do { ... } while (điều_kiện);` chạy thân vòng lặp ÍT NHẤT 1 LẦN trước khi kiểm tra điều kiện (lưu ý có dấu `;` sau `while`)."
          ]
        },
        {
          heading: "3. break và continue",
          paragraphs: [
            "`break;` kết thúc NGAY LẬP TỨC vòng lặp chứa nó (rất hữu ích khi đã tìm thấy đáp án hoặc phát hiện một số không phải số nguyên tố).",
            "`continue;` bỏ qua phần lệnh còn lại của lượt hiện tại và nhảy thẳng sang lượt lặp tiếp theo."
          ],
          callout: {
            type: "tip",
            title: "Tư duy tính tổng tích lũy (Accumulator)",
            content: "Khi tính tổng `1 + 2 + ... + n`, hãy khai báo `long long sum = 0;` BÊN NGOÀI vòng lặp, sau đó cộng dồn `sum += i;` bên trong vòng lặp."
          }
        }
      ],
      diagram: {
        title: "Chu trình vận hành của for (int i = 1; i <= 3; i++)",
        type: "flow",
        caption: "Khi i tăng lên 4, điều kiện i <= 3 sai nên vòng lặp thoát.",
        items: [
          { label: "Khởi tạo", value: "i = 1", detail: "Chạy duy nhất 1 lần lúc bắt đầu" },
          { label: "Lượt 1", value: "1 <= 3 (Đúng)", detail: "Chạy thân lệnh → i++ thành 2", highlight: true },
          { label: "Lượt 2-3", value: "i = 2, i = 3", detail: "Chạy thân lệnh → i++ thành 4" },
          { label: "Kết thúc", value: "4 <= 3 (Sai)", detail: "Thoát khỏi vòng lặp an toàn" }
        ]
      },
      examples: [
        {
          title: "Ví dụ 1: Tính tổng các số chẵn từ 1 đến N bằng for",
          level: "Cơ bản",
          description: "Tăng bước nhảy `i += 2` để chỉ duyệt qua các số chẵn, nhanh gấp đôi.",
          code: `#include <iostream>
using namespace std;

int main() {
    int n;
    cin >> n;
    long long tong = 0;

    for (int i = 2; i <= n; i += 2) {
        tong += i;
    }
    cout << tong << "\\n";
    return 0;
}`,
          sampleInput: "10",
          expectedOutput: "30",
          lineExplanations: [
            { line: "Dòng 7", code: "long long tong = 0;", explanation: "Khởi tạo biến tích lũy bằng 0 và dùng long long để tránh tràn số khi n lớn." },
            { line: "Dòng 9", code: "for (int i = 2; i <= n; i += 2)", explanation: "i chạy qua 2, 4, 6, 8, 10 → tổng = 30." }
          ]
        },
        {
          title: "Ví dụ 2: Đếm số chữ số của số nguyên dương N bằng while",
          level: "Thực tế",
          description: "Không biết trước N có bao nhiêu chữ số nên `while (n > 0)` là lựa chọn hoàn hảo.",
          code: `#include <iostream>
using namespace std;

int main() {
    long long n;
    cin >> n;
    if (n == 0) {
        cout << 1 << "\\n";
        return 0;
    }
    int dem = 0;
    while (n > 0) {
        dem++;
        n /= 10; // Bỏ chữ số cuối cùng
    }
    cout << dem << "\\n";
    return 0;
}`,
          sampleInput: "20265",
          expectedOutput: "5",
          lineExplanations: [
            { line: "Dòng 12", code: "while (n > 0)", explanation: "Lặp cho đến khi chia hết tất cả các chữ số (n về 0)." },
            { line: "Dòng 14", code: "n /= 10;", explanation: "Bước thay đổi điều kiện sống còn! Quên dòng này sẽ gây vòng lặp vô hạn." }
          ]
        }
      ],
      commonMistakes: [
        {
          title: "Quên cập nhật biến điều kiện trong vòng lặp while",
          badCode: `int i = 1;
while (i <= 5) {
    cout << i << " ";
    // Quên i++ -> chạy vô hạn -> Time Limit Exceeded!
}`,
          goodCode: `int i = 1;
while (i <= 5) {
    cout << i << " ";
    i++;
}`,
          explanation: "Trong vòng lặp `while`, bạn phải tự đảm bảo biến điều kiện tiến dần về điểm dừng ở mỗi lượt."
        },
        {
          title: "Lỗi lệch một đơn vị (Off-by-one: `<` vs `<=`)",
          badCode: `// Muốn tính tổng 1..n nhưng viết i < n -> thiếu mất n!
for (int i = 1; i < n; i++) tong += i;`,
          goodCode: `for (int i = 1; i <= n; i++) tong += i;`,
          explanation: "Luôn kiểm tra kỹ biên trái và biên phải (bắt đầu từ 0 hay 1, kết thúc `< n` hay `<= n`)."
        }
      ],
      practice: {
        title: "Thực hành: Tính giai thừa N!",
        prompt: "Nhập số nguyên `n` (0 <= n <= 20). Tính và in ra `n! = 1 * 2 * ... * n` (quy ước `0! = 1`). Nhớ dùng kiểu `long long` vì `20!` rất lớn!",
        starterCode: `#include <iostream>
using namespace std;

int main() {
    int n;
    cin >> n;
    long long giaiThua = 1;
    // Viết vòng lặp for từ 1 đến n nhân dồn vào giaiThua
    cout << giaiThua << endl;
    return 0;
}`,
        sampleInput: "5",
        expectedOutput: "120",
        hints: [
          "Khởi tạo long long giaiThua = 1 (không phải 0, vì nhân với 0 luôn bằng 0!).",
          "Dùng vòng lặp for (int i = 1; i <= n; i++) giaiThua *= i;"
        ],
        solutionCode: `#include <iostream>
using namespace std;

int main() {
    int n;
    cin >> n;
    long long giaiThua = 1;
    for (int i = 1; i <= n; i++) {
        giaiThua *= i;
    }
    cout << giaiThua << endl;
    return 0;
}`
      },
      checkpointQuiz: {
        question: "Vòng lặp nào sau đây luôn thực thi thân vòng lặp ÍT NHẤT 1 lần ngay cả khi điều kiện sai ngay từ đầu?",
        options: ["for", "while", "do-while", "if-else"],
        correctIndex: 2,
        explanation: "`do-while` thực thi khối lệnh bên trong trước, sau đó mới kiểm tra biểu thức điều kiện ở cuối."
      },
      takeaways: [
        "Dùng `for` khi biết rõ khoảng chạy/số lần lặp; dùng `while` khi lặp tới khi thỏa điều kiện dừng.",
        "Luôn đảm bảo biến kiểm soát thay đổi để tránh lỗi lặp vô hạn (TLE).",
        "Kiểm tra biên `<` và `<=` cẩn thận để tránh lỗi lệch 1 đơn vị."
      ]
    }
  },

  // =========================================================================
  // BÀI 8: MẢNG MỘT CHIỀU
  // =========================================================================
  {
    id: "lesson-cpp-08",
    section_id: "sec-cpp-08",
    course_id: "course-cpp",
    slug: "mang-mot-chieu",
    title: "Mảng một chiều – Lưu trữ và xử lý dãy dữ liệu",
    summary: "Hiểu cấu trúc bộ nhớ liên tiếp của mảng, chỉ số bắt đầu từ 0, kỹ thuật duyệt mảng, tìm max/min và phòng lỗi truy cập ngoài biên.",
    estimated_minutes: 25,
    xp_reward: 75,
    sort_order: 1,
    language: "cpp",
    content: {
      introduction:
        "Giả sử bạn cần lưu điểm thi của 1000 học viên để tính trung bình và tìm người cao điểm nhất. Chắc chắn không ai đi khai báo 1000 biến `d1, d2, ..., d1000`! Mảng một chiều (1D Array) cho phép bạn gom hàng nghìn phần tử cùng kiểu dữ liệu dưới một cái tên duy nhất và truy cập tức thì qua chỉ số.",
      objectives: [
        "Khai báo, nhập, xuất và duyệt mảng một chiều bằng vòng lặp `for`.",
        "Hiểu rõ chỉ số mảng trong C++ đánh số từ `0` đến `n - 1`.",
        "Cài đặt các thuật toán kinh điển trên mảng: tính tổng, tìm phần tử lớn nhất/nhỏ nhất, đếm phần tử thỏa điều kiện."
      ],
      theoryBlocks: [
        {
          heading: "1. Khai báo và chỉ số mảng (0-based indexing)",
          paragraphs: [
            "Cú pháp khai báo mảng tĩnh: `<kiểu_dữ_liệu> <tên_mảng>[<kích_thước>];`. Ví dụ: `int a[100];` cấp phát 100 ô nhớ `int` nằm liền kề nhau trong RAM.",
            "Phần tử đầu tiên nằm ở vị trí `a[0]`, phần tử thứ hai là `a[1]`, ..., và phần tử cuối cùng của mảng `n` phần tử là `a[n - 1]`. Không bao giờ có `a[n]` trong mảng kích thước `n`!"
          ],
          glossary: [
            { term: "Chỉ số (Index)", definition: "Số thứ tự xác định vị trí một phần tử trong mảng, bắt đầu từ 0." },
            { term: "Out of Bounds", definition: "Lỗi truy cập chỉ số âm (như a[-1]) hoặc vượt quá kích thước mảng (a[n]), dễ gây Runtime Error hoặc kết quả sai khó hiểu." }
          ]
        },
        {
          heading: "2. Kỹ thuật tìm Max/Min chuẩn xác",
          paragraphs: [
            "Sai lầm phổ biến nhất của người mới khi tìm giá trị lớn nhất là đặt `int maxVal = 0;`. Nếu mảng toàn số âm (ví dụ `-5, -2, -9`), kết quả sẽ sai bét là `0`!",
            "Cách đúng tuyệt đối: luôn gán `int maxVal = a[0];` rồi duyệt từ `i = 1` đến `n - 1`; nếu `a[i] > maxVal` thì cập nhật `maxVal = a[i];`."
          ],
          callout: {
            type: "note",
            title: "Kích thước mảng an toàn",
            content: "Trong C++ chuẩn, kích thước mảng tĩnh nên là hằng số (ví dụ `const int MAXN = 100005; int a[MAXN];`) hoặc dùng `vector<int>` (học ở Chương 14) khi cần co giãn linh hoạt."
          }
        }
      ],
      diagram: {
        title: "Cách mảng int a[5] = {12, 7, 25, 4, 18} nằm trong bộ nhớ RAM",
        type: "memory",
        caption: "Mọi phần tử nằm liên tiếp nhau, cho phép truy cập a[i] tức thì trong O(1).",
        items: [
          { label: "a[0]", value: "12", detail: "Phần tử đầu tiên" },
          { label: "a[1]", value: "7", detail: "Chỉ số 1" },
          { label: "a[2]", value: "25", detail: "Giá trị lớn nhất (maxVal)", highlight: true },
          { label: "a[3]", value: "4", detail: "Giá trị nhỏ nhất" },
          { label: "a[4]", value: "18", detail: "Phần tử cuối (n - 1)" }
        ]
      },
      examples: [
        {
          title: "Ví dụ 1: Nhập mảng n số nguyên, tính tổng và tìm giá trị lớn nhất",
          level: "Cơ bản",
          description: "Mẫu code tiêu chuẩn cho hầu hết bài tập mảng một chiều.",
          code: `#include <iostream>
using namespace std;

int main() {
    int n;
    cin >> n;
    int a[1005];

    for (int i = 0; i < n; i++) {
        cin >> a[i];
    }

    long long tong = 0;
    int maxVal = a[0];
    for (int i = 0; i < n; i++) {
        tong += a[i];
        if (a[i] > maxVal) maxVal = a[i];
    }

    cout << "Tong: " << tong << "\\n";
    cout << "Max: " << maxVal << "\\n";
    return 0;
}`,
          sampleInput: "5\n-10 -3 -25 -1 -8",
          expectedOutput: "Tong: -47\nMax: -1",
          lineExplanations: [
            { line: "Dòng 9-11", code: "for (int i = 0; i < n; i++) cin >> a[i];", explanation: "Nhập lần lượt n phần tử từ chỉ số 0 đến n - 1." },
            { line: "Dòng 14", code: "int maxVal = a[0];", explanation: "Khởi tạo bằng phần tử đầu tiên giúp hoạt động chính xác kể cả khi toàn bộ mảng là số âm!" }
          ]
        },
        {
          title: "Ví dụ 2: In mảng theo thứ tự đảo ngược",
          level: "Thực tế",
          description: "Duyệt ngược từ chỉ số `n - 1` giảm dần về `0`.",
          code: `#include <iostream>
using namespace std;

int main() {
    int n;
    cin >> n;
    int a[1005];
    for (int i = 0; i < n; i++) cin >> a[i];

    for (int i = n - 1; i >= 0; i--) {
        cout << a[i] << (i > 0 ? " " : "");
    }
    cout << "\\n";
    return 0;
}`,
          sampleInput: "4\n10 20 30 40",
          expectedOutput: "40 30 20 10",
          lineExplanations: [
            { line: "Dòng 10", code: "for (int i = n - 1; i >= 0; i--)", explanation: "Bắt đầu tại n - 1 (phần tử cuối) và dừng sau khi in xong a[0]." },
            { line: "Dòng 11", code: '(i > 0 ? " " : "")', explanation: "Chỉ in dấu cách giữa các số, không thừa dấu cách cuối dòng." }
          ]
        }
      ],
      commonMistakes: [
        {
          title: "Truy cập a[n] thay vì dừng ở a[n - 1]",
          badCode: `int a[5];
for (int i = 0; i <= 5; i++) cin >> a[i]; // Lỗi ghi đè ngoài mảng!`,
          goodCode: `int a[5];
for (int i = 0; i < 5; i++) cin >> a[i];`,
          explanation: "Mảng 5 phần tử chỉ có các chỉ số 0, 1, 2, 3, 4. Dùng `i <= 5` sẽ ghi đè sang vùng nhớ của biến khác!"
        },
        {
          title: "Khởi tạo max = 0 khi mảng có số âm",
          badCode: `int maxVal = 0; // Sai nếu mảng là {-5, -2, -9}!`,
          goodCode: `int maxVal = a[0];`,
          explanation: "Luôn lấy phần tử đầu tiên `a[0]` làm mốc so sánh ban đầu."
        }
      ],
      practice: {
        title: "Thực hành: Đếm số phần tử lớn hơn giá trị trung bình",
        prompt: "Nhập số nguyên dương `n` (n <= 1000) và `n` số nguyên. Đếm xem có bao nhiêu phần tử trong mảng có giá trị lớn hơn hẳn trung bình cộng của cả mảng.",
        starterCode: `#include <iostream>
using namespace std;

int main() {
    int n;
    cin >> n;
    int a[1005];
    long long tong = 0;
    for (int i = 0; i < n; i++) {
        cin >> a[i];
        tong += a[i];
    }
    // Tính trung bình (kiểu double) và đếm số phần tử > tb
    return 0;
}`,
        sampleInput: "5\n2 4 6 8 10",
        expectedOutput: "2",
        hints: [
          "Trung bình: double tb = (double)tong / n;",
          "Duyệt lại mảng, nếu a[i] > tb thì tăng biến dem++."
        ],
        solutionCode: `#include <iostream>
using namespace std;

int main() {
    int n;
    cin >> n;
    int a[1005];
    long long tong = 0;
    for (int i = 0; i < n; i++) {
        cin >> a[i];
        tong += a[i];
    }
    double tb = (double)tong / n;
    int dem = 0;
    for (int i = 0; i < n; i++) {
        if (a[i] > tb) dem++;
    }
    cout << dem << endl;
    return 0;
}`
      },
      checkpointQuiz: {
        question: "Với khai báo `int a[6] = {10, 20, 30, 40, 50, 60};`, phần tử `a[4]` có giá trị bao nhiêu?",
        options: ["40", "50", "60", "Lỗi ngoài biên"],
        correctIndex: 1,
        explanation: "Đếm từ chỉ số 0: a[0]=10, a[1]=20, a[2]=30, a[3]=40, a[4]=50."
      },
      takeaways: [
        "Mảng n phần tử luôn có chỉ số hợp lệ từ `0` đến `n - 1`.",
        "Luôn đặt `maxVal = a[0]` và `minVal = a[0]` thay vì 0.",
        "Không bao giờ truy cập chỉ số âm hoặc `>= kích_thước_mảng`."
      ]
    }
  },

  // =========================================================================
  // BÀI 9: MẢNG HAI CHIỀU
  // =========================================================================
  {
    id: "lesson-cpp-09",
    section_id: "sec-cpp-09",
    course_id: "course-cpp",
    slug: "mang-hai-chieu",
    title: "Mảng hai chiều và xử lý Ma trận",
    summary: "Biểu diễn bảng dữ liệu hàng-cột, bàn cờ và lưới bản đồ bằng mảng 2 chiều, duyệt bằng vòng lặp lồng nhau và tính tổng đường chéo.",
    estimated_minutes: 25,
    xp_reward: 75,
    sort_order: 1,
    language: "cpp",
    content: {
      introduction:
        "Bàn cờ vua 8×8, bảng điểm học sinh gồm nhiều dòng và nhiều môn học, hay một bức ảnh kỹ thuật số gồm hàng triệu điểm ảnh — tất cả đều có cấu trúc hai chiều (hàng và cột). Trong C++, ta mô hình hóa chúng cực kỳ tự nhiên bằng Mảng hai chiều (2D Array / Matrix).",
      objectives: [
        "Khai báo và truy cập phần tử `a[hang][cot]` của mảng hai chiều.",
        "Sử dụng cặp vòng lặp `for` lồng nhau để nhập, xuất, tính tổng hàng và tổng cột.",
        "Xác định quy luật đường chéo chính (`i == j`) và đường chéo phụ (`i + j == n - 1`) trên ma trận vuông."
      ],
      theoryBlocks: [
        {
          heading: "1. Bản chất của mảng hai chiều",
          paragraphs: [
            "Mảng hai chiều thực chất là 'mảng của các mảng một chiều'. Khai báo `int mat[3][4];` tạo ra một bảng gồm 3 hàng (chỉ số `0..2`) và 4 cột (chỉ số `0..3`).",
            "Quy ước bất di bất dịch: chỉ số ĐẦU TIÊN luôn là **HÀNG (row)**, chỉ số THỨ HAI luôn là **CỘT (column)**. Phần tử ở hàng `i`, cột `j` được truy cập là `mat[i][j]`."
          ],
          glossary: [
            { term: "Ma trận vuông (Square Matrix)", definition: "Ma trận có số hàng bằng số cột (n × n)." },
            { term: "Đường chéo chính (Main Diagonal)", definition: "Tập hợp các ô từ góc trên-trái xuống dưới-phải, thỏa điều kiện chỉ số hàng bằng chỉ số cột (i == j)." }
          ]
        },
        {
          heading: "2. Duyệt theo hàng vs Duyệt theo cột",
          paragraphs: [
            "Để duyệt từng hàng: vòng lặp ngoài chạy `i` từ `0` đến `rows - 1`, vòng lặp trong chạy `j` từ `0` đến `cols - 1`.",
            "Để tính tổng từng cột `j`: đảo vòng lặp ngoài chạy `j` từ `0` đến `cols - 1`, vòng lặp trong chạy `i` từ `0` đến `rows - 1` và cộng dồn `mat[i][j]`."
          ],
          callout: {
            type: "tip",
            title: "Mẹo nhớ nhanh hai đường chéo ma trận vuông n×n",
            content: "Đường chéo chính: `i == j` (ví dụ (0,0), (1,1), (2,2)). Đường chéo phụ: `i + j == n - 1` (ví dụ với n=3: (0,2), (1,1), (2,0))."
          }
        }
      ],
      diagram: {
        title: "Tọa độ ô [hàng][cột] trong ma trận vuông 3×3",
        type: "table",
        caption: "Các ô đánh dấu nổi bật tạo thành đường chéo chính (i == j).",
        items: [
          { label: "Hàng 0", value: "[0][0]   [0][1]   [0][2]", detail: "Chéo chính: [0][0] | Chéo phụ: [0][2]", highlight: true },
          { label: "Hàng 1", value: "[1][0]   [1][1]   [1][2]", detail: "Tâm ma trận [1][1] thuộc cả 2 đường chéo", highlight: true },
          { label: "Hàng 2", value: "[2][0]   [2][1]   [2][2]", detail: "Chéo phụ: [2][0] | Chéo chính: [2][2]", highlight: true }
        ]
      },
      examples: [
        {
          title: "Ví dụ 1: Nhập ma trận M×N và tính tổng từng hàng",
          level: "Cơ bản",
          description: "Đọc bảng số liệu và tính tổng điểm riêng của từng dòng.",
          code: `#include <iostream>
using namespace std;

int main() {
    int m, n;
    cin >> m >> n;
    int a[105][105];

    for (int i = 0; i < m; i++) {
        for (int j = 0; j < n; j++) {
            cin >> a[i][j];
        }
    }

    for (int i = 0; i < m; i++) {
        int tongHang = 0;
        for (int j = 0; j < n; j++) {
            tongHang += a[i][j];
        }
        cout << "Hang " << i << ": " << tongHang << "\\n";
    }
    return 0;
}`,
          sampleInput: "2 3\n1 2 3\n4 5 6",
          expectedOutput: "Hang 0: 6\nHang 1: 15",
          lineExplanations: [
            { line: "Dòng 9-13", code: "for i ... for j ... cin >> a[i][j];", explanation: "Vòng lặp lồng nhau đọc trọn vẹn từng hàng từ trái sang phải." },
            { line: "Dòng 16", code: "int tongHang = 0;", explanation: "Đặt biến tongHang BÊN TRONG vòng for hàng i để mỗi hàng mới đều reset về 0!" }
          ]
        },
        {
          title: "Ví dụ 2: Tính tổng đường chéo chính ma trận vuông N×N",
          level: "Thực tế",
          description: "Chỉ cần 1 vòng lặp O(N) sau khi nhập xong ma trận.",
          code: `#include <iostream>
using namespace std;

int main() {
    int n;
    cin >> n;
    int a[105][105];
    for (int i = 0; i < n; i++)
        for (int j = 0; j < n; j++)
            cin >> a[i][j];

    long long tongCheoChinh = 0;
    for (int i = 0; i < n; i++) {
        tongCheoChinh += a[i][i];
    }
    cout << tongCheoChinh << "\\n";
    return 0;
}`,
          sampleInput: "3\n1 2 3\n4 5 6\n7 8 9",
          expectedOutput: "15",
          lineExplanations: [
            { line: "Dòng 14", code: "tongCheoChinh += a[i][i];", explanation: "Vì hàng bằng cột, ta truy cập trực tiếp a[i][i] (1 + 5 + 9 = 15)." }
          ]
        }
      ],
      commonMistakes: [
        {
          title: "Quên reset biến tổng khi sang hàng mới",
          badCode: `int tongHang = 0; // Đặt NGOÀI vòng for i -> cộng dồn cả các hàng trước!
for (int i = 0; i < m; i++) {
    for (int j = 0; j < n; j++) tongHang += a[i][j];
    cout << tongHang << "\\n";
}`,
          goodCode: `for (int i = 0; i < m; i++) {
    int tongHang = 0; // Reset về 0 cho mỗi hàng
    for (int j = 0; j < n; j++) tongHang += a[i][j];
    cout << tongHang << "\\n";
}`,
          explanation: "Biến tổng cục bộ cho từng hàng phải được khởi tạo lại bằng 0 mỗi khi bắt đầu duyệt một hàng mới."
        },
        {
          title: "Đảo lộn chỉ số hàng (m) và cột (n) với ma trận không vuông",
          badCode: `// Với ma trận 2 hàng 5 cột mà truy cập a[j][i] sẽ vượt biên hàng!`,
          goodCode: `// Luôn nhất quán: i chạy theo số hàng (0..m-1), j chạy theo số cột (0..n-1), truy cập a[i][j].`,
          explanation: "Khi m khác n, nhầm thứ tự `[i][j]` thành `[j][i]` sẽ gây lỗi truy cập ngoài biên."
        }
      ],
      practice: {
        title: "Thực hành: Tìm phần tử lớn nhất trong ma trận",
        prompt: "Nhập 2 số nguyên dương `m, n` (<= 100) và ma trận `m × n` số nguyên. Tìm và in ra giá trị lớn nhất có mặt trong toàn bộ ma trận.",
        starterCode: `#include <iostream>
using namespace std;

int main() {
    int m, n;
    cin >> m >> n;
    int a[105][105];
    for (int i = 0; i < m; i++) {
        for (int j = 0; j < n; j++) {
            cin >> a[i][j];
        }
    }
    // Khởi tạo maxVal = a[0][0] và duyệt tìm phần tử lớn nhất
    return 0;
}`,
        sampleInput: "2 3\n-5 12 4\n9 27 -1",
        expectedOutput: "27",
        hints: [
          "Đặt int maxVal = a[0][0];",
          "Duyệt 2 vòng for lồng nhau, nếu a[i][j] > maxVal thì gán maxVal = a[i][j]."
        ],
        solutionCode: `#include <iostream>
using namespace std;

int main() {
    int m, n;
    cin >> m >> n;
    int a[105][105];
    for (int i = 0; i < m; i++) {
        for (int j = 0; j < n; j++) {
            cin >> a[i][j];
        }
    }
    int maxVal = a[0][0];
    for (int i = 0; i < m; i++) {
        for (int j = 0; j < n; j++) {
            if (a[i][j] > maxVal) maxVal = a[i][j];
        }
    }
    cout << maxVal << endl;
    return 0;
}`
      },
      checkpointQuiz: {
        question: "Trong ma trận vuông kích thước `4 × 4` (chỉ số 0..3), ô nào sau đây nằm trên ĐƯỜNG CHÉO PHỤ?",
        options: ["a[0][0]", "a[1][2]", "a[2][2]", "a[3][3]"],
        correctIndex: 1,
        explanation: "Đường chéo phụ thỏa mãn `i + j == n - 1`. Với n = 4 thì `i + j == 3`. Ô `a[1][2]` có `1 + 2 = 3` nên nằm trên đường chéo phụ!"
      },
      takeaways: [
        "Mảng 2 chiều luôn theo thứ tự `a[hàng][cột]`.",
        "Đặt biến tích lũy từng hàng bên trong vòng lặp hàng để tự động reset về 0.",
        "Đường chéo chính: `i == j`; đường chéo phụ: `i + j == n - 1`."
      ]
    }
  },

  // =========================================================================
  // BÀI 10: XÂU KÝ TỰ VÀ STRING
  // =========================================================================
  {
    id: "lesson-cpp-10",
    section_id: "sec-cpp-10",
    course_id: "course-cpp",
    slug: "xau-ky-tu-va-string",
    title: "Xâu ký tự và làm chủ std::string trong C++",
    summary: "Xử lý văn bản linh hoạt với std::string: độ dài, nối chuỗi, duyệt ký tự, bảng mã ASCII, chuẩn hóa chữ hoa/thường và kiểm tra đối xứng.",
    estimated_minutes: 25,
    xp_reward: 80,
    sort_order: 1,
    language: "cpp",
    content: {
      introduction:
        "Từ tên người dùng, mật khẩu, địa chỉ email cho đến dữ liệu JSON đều là xâu ký tự (String). Thay vì phải quản lý mảng ký tự `char[]` dễ tràn bộ nhớ như ngôn ngữ C cổ điển, C++ cung cấp lớp `std::string` cực kỳ hiện đại, tự co giãn kích thước và hỗ trợ hàng loạt thao tác tiện lợi.",
      objectives: [
        "Sử dụng thành thạo `length()`/`size()`, phép nối `+`, so sánh `==`, trích chuỗi con `substr()` và tìm kiếm `find()`.",
        "Hiểu bảng mã ASCII để chuyển đổi chữ hoa ↔ chữ thường và chữ số ký tự ↔ giá trị số.",
        "Xử lý chuẩn lỗi trôi lệnh khi kết hợp `cin >>` với `getline(cin, s)`."
      ],
      theoryBlocks: [
        {
          heading: "1. Các thao tác thiết yếu của std::string",
          paragraphs: [
            "Để dùng `string`, hãy thêm `#include <string>`. Bạn có thể coi một `string s` giống như một mảng các ký tự `char`: truy cập ký tự đầu là `s[0]`, ký tự cuối là `s[s.length() - 1]`.",
            "Các phương thức hay dùng nhất: `s.size()` hoặc `s.length()` (độ dài xâu), `s1 + s2` (nối xâu), `s.substr(pos, len)` (cắt chuỗi con dài `len` từ vị trí `pos`), `s.push_back(c)` (thêm 1 ký tự vào cuối)."
          ],
          glossary: [
            { term: "Bảng mã ASCII", definition: "Bảng ánh xạ mỗi ký tự sang một số nguyên: '0'..'9' là 48..57, 'A'..'Z' là 65..90, 'a'..'z' là 97..122." },
            { term: "Xâu đối xứng (Palindrome)", definition: "Xâu đọc xuôi và đọc ngược đều giống hệt nhau (ví dụ 'radar', 'abba', '12321')." }
          ]
        },
        {
          heading: "2. Phép toán ký tự với mã ASCII",
          paragraphs: [
            "Vì ký tự chữ cái liên tiếp nhau trong bảng ASCII, ta có thể kiểm tra rất gọn: `if (c >= 'a' && c <= 'z')` là chữ thường; để đổi sang chữ hoa chỉ cần `c = c - 32` (hoặc dùng hàm chuẩn `toupper(c)` trong `<cctype>`).",
            "Đặc biệt, muốn đổi ký tự số `'7'` thành số nguyên `7`, hãy viết `int digit = c - '0';`!"
          ],
          callout: {
            type: "warning",
            title: "Khắc phục triệt để lỗi trôi lệnh getline()",
            content: "Khi đọc một số `cin >> n;` rồi ngay sau đó gọi `getline(cin, s);`, phím Enter sau số `n` còn nằm trong bộ đệm khiến `getline` đọc phải chuỗi rỗng! Hãy luôn đặt `cin.ignore();` (hoặc `getline(cin >> ws, s);`) ở giữa."
          }
        }
      ],
      diagram: {
        title: "Cấu trúc chỉ số và mã ASCII của chuỗi \"Code\"",
        type: "memory",
        caption: "s.length() = 4; mỗi phần tử s[i] là một biến char có thể đọc và sửa trực tiếp.",
        items: [
          { label: "s[0]", value: "'C'", detail: "ASCII = 67 (chữ hoa)" },
          { label: "s[1]", value: "'o'", detail: "ASCII = 111 (chữ thường)" },
          { label: "s[2]", value: "'d'", detail: "ASCII = 100" },
          { label: "s[3]", value: "'e'", detail: "ASCII = 101 | s.back()", highlight: true }
        ]
      },
      examples: [
        {
          title: "Ví dụ 1: Đếm nguyên âm và chuyển cả chuỗi sang IN HOA",
          level: "Cơ bản",
          description: "Duyệt từng ký tự trong string bằng chỉ số hoặc range-based for.",
          code: `#include <iostream>
#include <string>
using namespace std;

int main() {
    string s;
    getline(cin, s);
    int nguyenAm = 0;

    for (int i = 0; i < (int)s.size(); i++) {
        if (s[i] >= 'a' && s[i] <= 'z') {
            s[i] = s[i] - 32; // Đổi sang chữ hoa
        }
        char c = s[i];
        if (c == 'A' || c == 'E' || c == 'I' || c == 'O' || c == 'U') {
            nguyenAm++;
        }
    }
    cout << s << "\\n";
    cout << "So nguyen am: " << nguyenAm << "\\n";
    return 0;
}`,
          sampleInput: "Hello CodeLab",
          expectedOutput: "HELLO CODELAB\nSo nguyen am: 5",
          lineExplanations: [
            { line: "Dòng 7", code: "getline(cin, s);", explanation: "Đọc toàn bộ dòng văn bản kể cả dấu cách giữa Hello và CodeLab." },
            { line: "Dòng 10", code: "(int)s.size()", explanation: "s.size() trả về số không âm (size_t), ép sang int để so sánh an toàn với biến i." },
            { line: "Dòng 12", code: "s[i] = s[i] - 32;", explanation: "Khoảng cách giữa chữ thường và chữ hoa trong ASCII luôn là 32 ('a' - 'A' = 32)." }
          ]
        },
        {
          title: "Ví dụ 2: Kiểm tra xâu đối xứng (Palindrome)",
          level: "Thực tế",
          description: "Kỹ thuật hai con trỏ (left và right) so sánh đối xứng từ hai đầu vào giữa.",
          code: `#include <iostream>
#include <string>
using namespace std;

int main() {
    string s;
    cin >> s;
    bool doiXung = true;
    int left = 0, right = (int)s.size() - 1;

    while (left < right) {
        if (s[left] != s[right]) {
            doiXung = false;
            break;
        }
        left++;
        right--;
    }
    cout << (doiXung ? "YES" : "NO") << "\\n";
    return 0;
}`,
          sampleInput: "level",
          expectedOutput: "YES",
          lineExplanations: [
            { line: "Dòng 9", code: "left = 0, right = s.size() - 1", explanation: "Hai vị trí xuất phát từ đầu và cuối chuỗi." },
            { line: "Dòng 12-15", code: "if (s[left] != s[right])", explanation: "Chỉ cần phát hiện 1 cặp khác nhau, ta khẳng định ngay là không đối xứng và break sớm." }
          ]
        }
      ],
      commonMistakes: [
        {
          title: "Quên xử lý bộ đệm khi dùng getline sau cin >>",
          badCode: `int tuoi;
string ten;
cin >> tuoi;
getline(cin, ten); // ten bị rỗng ""!`,
          goodCode: `int tuoi;
string ten;
cin >> tuoi;
cin.ignore();
getline(cin, ten);`,
          explanation: "`cin >> tuoi` để lại ký tự xuống dòng `'\\n'` trong luồng vào. Gọi `cin.ignore()` sẽ bỏ qua ký tự thừa đó trước khi `getline` đọc dòng tên."
        }
      ],
      practice: {
        title: "Thực hành: Tính tổng các chữ số xuất hiện trong một chuỗi",
        prompt: "Nhập một chuỗi `s` không chứa dấu cách (ví dụ `c0d3l4b2026`). Hãy duyệt qua chuỗi và tính tổng giá trị các ký tự chữ số (`'0'..'9'`) có trong `s` (với ví dụ trên: 0+3+4+2+0+2+6 = `17`).",
        starterCode: `#include <iostream>
#include <string>
using namespace std;

int main() {
    string s;
    cin >> s;
    int tong = 0;
    // Duyệt từng ký tự, nếu từ '0' đến '9' thì cộng (c - '0') vào tong
    cout << tong << endl;
    return 0;
}`,
        sampleInput: "c0d3l4b2026",
        expectedOutput: "17",
        hints: [
          "Kiểm tra ký tự chữ số: if (s[i] >= '0' && s[i] <= '9')",
          "Chuyển ký tự chữ số sang giá trị số: tong += (s[i] - '0');"
        ],
        solutionCode: `#include <iostream>
#include <string>
using namespace std;

int main() {
    string s;
    cin >> s;
    int tong = 0;
    for (int i = 0; i < (int)s.size(); i++) {
        if (s[i] >= '0' && s[i] <= '9') {
            tong += (s[i] - '0');
        }
    }
    cout << tong << endl;
    return 0;
}`
      },
      checkpointQuiz: {
        question: "Giá trị nguyên của biểu thức `'5' - '0'` trong C++ là bao nhiêu?",
        options: ["53", "5", "48", "Lỗi biên dịch không thể trừ hai ký tự"],
        correctIndex: 1,
        explanation: "Trong bảng mã ASCII, `'5'` có mã 53 và `'0'` có mã 48, nên `'5' - '0' = 53 - 48 = 5`."
      },
      takeaways: [
        "Ưu tiên `std::string` thay cho mảng `char[]` vì an toàn và tiện lợi hơn nhiều.",
        "Dùng `c - '0'` để chuyển ký tự số sang giá trị nguyên, và `c - 32` (hoặc `toupper`) để chuyển chữ thường sang hoa.",
        "Luôn gọi `cin.ignore()` (hoặc `cin >> ws`) trước `getline()` nếu trước đó vừa dùng `cin >>`."
      ]
    }
  }
];
