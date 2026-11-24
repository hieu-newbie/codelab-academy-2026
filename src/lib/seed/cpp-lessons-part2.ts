import type { SeedLesson } from "./cpp-lessons-part1";

export const CPP_LESSONS_PART2: SeedLesson[] = [
  // =========================================================================
  // BÀI 11: HÀM
  // =========================================================================
  {
    id: "lesson-cpp-11",
    section_id: "sec-cpp-11",
    course_id: "course-cpp",
    slug: "ham-trong-cpp",
    title: "Hàm (Function) – Truyền tham trị và tham chiếu",
    summary: "Tổ chức code gọn gàng, tái sử dụng logic với hàm, phân biệt truyền giá trị (pass-by-value) vs truyền tham chiếu (&) và phạm vi biến.",
    estimated_minutes: 25,
    xp_reward: 80,
    sort_order: 1,
    language: "cpp",
    content: {
      introduction:
        "Khi chương trình dài hàng trăm dòng, dồn tất cả vào `main()` sẽ biến code thành một mớ rối rắm rất khó tìm lỗi. Hàm (Function) giúp chia bài toán lớn thành từng 'cỗ máy nhỏ' độc lập: mỗi hàm làm tốt ĐÚNG MỘT nhiệm vụ và có thể gọi lại ở bất cứ đâu.",
      objectives: [
        "Định nghĩa hàm có kiểu trả về (`int`, `bool`, `double`) và hàm không trả về (`void`).",
        "Hiểu sâu sự khác biệt giữa truyền tham trị (bản sao) và truyền tham chiếu (`&` – sửa trực tiếp biến gốc).",
        "Áp dụng chia hàm trong bài toán kiểm tra số nguyên tố và hoán đổi giá trị."
      ],
      theoryBlocks: [
        {
          heading: "1. Cấu trúc một hàm và nguyên lý đóng gói",
          paragraphs: [
            "Cú pháp: `<kiểu_trả_về> <tên_hàm>(<danh_sách_tham_số>) { ... return <kết_quả>; }`. Ví dụ: `bool laSoNguyenTo(int n)` nhận vào một số nguyên `n` và trả về `true`/`false`.",
            "Nếu hàm chỉ thực hiện hành động (như in bảng menu hay sắp xếp mảng) mà không cần trả về giá trị, dùng kiểu `void`."
          ],
          glossary: [
            { term: "Tham số (Parameter)", definition: "Biến đầu vào khai báo trong ngoặc tròn của định nghĩa hàm." },
            { term: "Truyền tham trị (Pass by Value)", definition: "Hàm nhận một BẢN SAO của biến; sửa bên trong hàm KHÔNG làm thay đổi biến gốc bên ngoài." },
            { term: "Truyền tham chiếu (Pass by Reference)", definition: "Thêm dấu & trước tên tham số (`int &x`); hàm thao tác trực tiếp lên biến gốc." }
          ]
        },
        {
          heading: "2. Khi nào dùng dấu & (Tham chiếu)?",
          paragraphs: [
            "Dùng `&` trong 2 tình huống: (1) Bạn MUỐN hàm thay đổi trực tiếp giá trị biến gốc (ví dụ hàm `hoanDoi(int &a, int &b)`), hoặc (2) Bạn truyền dữ liệu lớn như `const string &s` hay `const vector<int> &v` để tránh tốn thời gian sao chép toàn bộ mảng!"
          ],
          callout: {
            type: "tip",
            title: "Quy tắc đặt hàm",
            content: "Trong C++, hãy định nghĩa hàm PHÍA TRÊN `main()` (hoặc khai báo nguyên mẫu prototype phía trên) để trình biên dịch biết sự tồn tại của hàm khi `main()` gọi đến nó."
          }
        }
      ],
      diagram: {
        title: "So sánh Truyền tham trị vs Truyền tham chiếu",
        type: "table",
        caption: "Thêm duy nhất ký tự & tạo ra khác biệt hoàn toàn về hành vi bộ nhớ.",
        items: [
          { label: "void tang(int x)", value: "Tạo bản sao mới", detail: "Biến gốc ngoài main() GIỮ NGUYÊN" },
          { label: "void tang(int &x)", value: "Trỏ thẳng biến gốc", detail: "Biến gốc ngoài main() BỊ THAY ĐỔI", highlight: true },
          { label: "const string &s", value: "Đọc trực tiếp, cấm sửa", detail: "Tốc độ O(1), không tốn RAM sao chép", highlight: true }
        ]
      },
      examples: [
        {
          title: "Ví dụ 1: Hàm kiểm tra số nguyên tố tối ưu O(√N)",
          level: "Thực tế",
          description: "Tách logic kiểm tra số nguyên tố thành hàm bool riêng biệt để gọi lại cho cả một khoảng số.",
          code: `#include <iostream>
using namespace std;

bool laNguyenTo(int n) {
    if (n < 2) return false;
    for (int i = 2; 1LL * i * i <= n; i++) {
        if (n % i == 0) return false;
    }
    return true;
}

int main() {
    int n;
    cin >> n;
    for (int x = 2; x <= n; x++) {
        if (laNguyenTo(x)) cout << x << " ";
    }
    cout << "\\n";
    return 0;
}`,
          sampleInput: "15",
          expectedOutput: "2 3 5 7 11 13",
          lineExplanations: [
            { line: "Dòng 4", code: "bool laNguyenTo(int n)", explanation: "Hàm trả về true nếu n là số nguyên tố, ngược lại false." },
            { line: "Dòng 6", code: "1LL * i * i <= n", explanation: "Chỉ cần kiểm tra ước tới căn bậc hai của n; nhân 1LL tránh tràn int khi i lớn." }
          ]
        },
        {
          title: "Ví dụ 2: Hàm hoán đổi hai số bằng tham chiếu &",
          level: "Cơ bản",
          description: "Minh họa tác dụng trực tiếp của dấu `&`.",
          code: `#include <iostream>
using namespace std;

void hoanDoi(int &a, int &b) {
    int tam = a;
    a = b;
    b = tam;
}

int main() {
    int x = 10, y = 25;
    hoanDoi(x, y);
    cout << x << " " << y << "\\n";
    return 0;
}`,
          expectedOutput: "25 10",
          lineExplanations: [
            { line: "Dòng 4", code: "void hoanDoi(int &a, int &b)", explanation: "Nhờ dấu &, mọi thay đổi trên a và b cập nhật thẳng vào x và y của main()." }
          ]
        }
      ],
      commonMistakes: [
        {
          title: "Quên dấu & khi viết hàm đổi chỗ",
          badCode: `void hoanDoi(int a, int b) {
    int t = a; a = b; b = t; // Chỉ đổi chỗ bản sao!
}`,
          goodCode: `void hoanDoi(int &a, int &b) {
    int t = a; a = b; b = t;
}`,
          explanation: "Không có dấu `&`, biến `x, y` ngoài `main()` sẽ giữ nguyên như chưa hề gọi hàm."
        }
      ],
      practice: {
        title: "Thực hành: Viết hàm tìm Ước chung lớn nhất (UCLN)",
        prompt: "Hoàn thiện hàm `long long ucln(long long a, long long b)` sử dụng thuật toán Euclid (`while (b != 0)`) và in ra ước chung lớn nhất của 2 số nguyên dương nhập vào.",
        starterCode: `#include <iostream>
using namespace std;

long long ucln(long long a, long long b) {
    // Cài đặt thuật toán Euclid tại đây
    return 1;
}

int main() {
    long long a, b;
    cin >> a >> b;
    cout << ucln(a, b) << endl;
    return 0;
}`,
        sampleInput: "48 18",
        expectedOutput: "6",
        hints: [
          "Trong vòng lặp while (b != 0): tính long long r = a % b; gán a = b; b = r;",
          "Khi b == 0, trả về a."
        ],
        solutionCode: `#include <iostream>
using namespace std;

long long ucln(long long a, long long b) {
    while (b != 0) {
        long long r = a % b;
        a = b;
        b = r;
    }
    return a;
}

int main() {
    long long a, b;
    cin >> a >> b;
    cout << ucln(a, b) << endl;
    return 0;
}`
      },
      checkpointQuiz: {
        question: "Ký tự nào đặt trước tên tham số để hàm có thể thay đổi trực tiếp giá trị biến truyền vào từ ngoài hàm?",
        options: ["*", "&", "#", "%"],
        correctIndex: 1,
        explanation: "Dấu `&` đánh dấu truyền tham chiếu (pass-by-reference) trong C++."
      },
      takeaways: [
        "Mỗi hàm nên giải quyết gọn gàng một nhiệm vụ duy nhất để dễ kiểm thử và tái sử dụng.",
        "Dùng `&` khi cần thay đổi biến gốc hoặc tránh sao chép dữ liệu lớn (`const T&`).",
        "Hàm phải được khai báo trước vị trí nó được gọi."
      ]
    }
  },

  // =========================================================================
  // BÀI 12: CON TRỎ
  // =========================================================================
  {
    id: "lesson-cpp-12",
    section_id: "sec-cpp-12",
    course_id: "course-cpp",
    slug: "con-tro-trong-cpp",
    title: "Con trỏ (Pointer) và Quản lý Địa chỉ Bộ nhớ",
    summary: "Giải mã khái niệm 'khó nhằn' nhất của C++ một cách trực quan: địa chỉ bộ nhớ (&), giải tham chiếu (*), nullptr và mối liên hệ giữa con trỏ với mảng.",
    estimated_minutes: 30,
    xp_reward: 90,
    sort_order: 1,
    language: "cpp",
    content: {
      introduction:
        "Nhiều người mới thường e ngại khi nghe tới Con trỏ (Pointer), nhưng thực chất ý tưởng lại vô cùng đời thường: nếu một biến là một NGÔI NHÀ chứa đồ đạc (giá trị), thì con trỏ đơn giản là một TỜ GIẤY GHI ĐỊA CHỈ của ngôi nhà đó!",
      objectives: [
        "Phân biệt toán tử lấy địa chỉ `&x` và toán tử giải tham chiếu `*p`.",
        "Khởi tạo con trỏ an toàn với `nullptr` và kiểm tra trước khi sử dụng.",
        "Hiểu mối liên hệ mật thiết giữa tên mảng và con trỏ tới phần tử đầu tiên."
      ],
      theoryBlocks: [
        {
          heading: "1. Địa chỉ bộ nhớ (&) và Biến con trỏ (*)",
          paragraphs: [
            "Mỗi biến khi tạo ra đều chiếm một ô nhớ có địa chỉ thập lục phân duy nhất trong RAM (ví dụ `0x7ffee4`). Để xem địa chỉ của biến `x`, ta dùng toán tử `&x`.",
            "Con trỏ là biến đặc biệt dùng để lưu địa chỉ của biến khác: `int *p = &x;`. Lúc này `p` chứa địa chỉ của `x`, còn `*p` (giải tham chiếu — dereference) cho phép đọc hoặc ghi trực tiếp giá trị nằm bên trong ô nhớ đó!"
          ],
          glossary: [
            { term: "Con trỏ (Pointer)", definition: "Biến lưu trữ địa chỉ bộ nhớ của một biến hoặc vùng nhớ khác." },
            { term: "Giải tham chiếu (Dereference - *p)", definition: "Thao tác đi theo địa chỉ mà con trỏ p nắm giữ để truy cập giá trị thật tại ô nhớ đó." },
            { term: "nullptr", definition: "Giá trị con trỏ rỗng chuẩn C++11, biểu thị con trỏ hiện không trỏ vào bất kỳ vùng nhớ hợp lệ nào." }
          ],
          callout: {
            type: "warning",
            title: "Tuyệt đối không giải tham chiếu nullptr hoặc con trỏ chưa khởi tạo!",
            content: "Gọi `*p` khi `p == nullptr` hoặc `p` chưa được gán địa chỉ sẽ gây lỗi Segmentation Fault (Runtime Error) làm sập chương trình ngay lập tức."
          }
        }
      ],
      diagram: {
        title: "Minh họa mối quan hệ giữa biến x và con trỏ p = &x",
        type: "memory",
        caption: "Thay đổi *p = 99 sẽ thay đổi trực tiếp giá trị bên trong ô nhớ của x!",
        items: [
          { label: "Biến int x", value: "42 → 99", detail: "Địa chỉ trong RAM: 0x104" },
          { label: "Con trỏ int *p", value: "0x104", detail: "Lưu địa chỉ của x (&x)", highlight: true },
          { label: "Biểu thức *p", value: "Truy cập x", detail: "Đọc/ghi trực tiếp vào ô 0x104" }
        ]
      },
      examples: [
        {
          title: "Ví dụ 1: Đọc và thay đổi giá trị biến thông qua con trỏ",
          level: "Cơ bản",
          description: "Quan sát sự thay đổi đồng bộ giữa biến gốc và con trỏ trỏ tới nó.",
          code: `#include <iostream>
using namespace std;

int main() {
    int diem = 70;
    int *ptr = &diem;

    cout << "Gia tri ban dau: " << diem << "\\n";
    *ptr = 95; // Sua gia tri qua con tro
    cout << "Sau khi doi *ptr: " << diem << "\\n";
    return 0;
}`,
          expectedOutput: "Gia tri ban dau: 70\nSau khi doi *ptr: 95",
          lineExplanations: [
            { line: "Dòng 6", code: "int *ptr = &diem;", explanation: "ptr nhận địa chỉ bộ nhớ của biến diem." },
            { line: "Dòng 9", code: "*ptr = 95;", explanation: "Ghi số 95 vào đúng ô nhớ mà ptr đang trỏ tới -> diem trở thành 95." }
          ]
        },
        {
          title: "Ví dụ 2: Duyệt mảng bằng số học con trỏ",
          level: "Thực tế",
          description: "Tên mảng `a` thực chất là con trỏ trỏ tới phần tử `a[0]`, và `*(p + i)` tương đương `a[i]`.",
          code: `#include <iostream>
using namespace std;

int main() {
    int a[4] = {10, 20, 30, 40};
    int *p = a; // Trỏ tới &a[0]
    int tong = 0;

    for (int i = 0; i < 4; i++) {
        tong += *(p + i);
    }
    cout << "Tong mang: " << tong << "\\n";
    return 0;
}`,
          expectedOutput: "Tong mang: 100",
          lineExplanations: [
            { line: "Dòng 6", code: "int *p = a;", explanation: "Tên mảng tự động phân rã thành địa chỉ phần tử đầu tiên." },
            { line: "Dòng 10", code: "*(p + i)", explanation: "Dịch sang phần tử int thứ i rồi lấy giá trị." }
          ]
        }
      ],
      commonMistakes: [
        {
          title: "Khai báo con trỏ trôi nổi (Wild Pointer) chưa khởi tạo",
          badCode: `int *p;
*p = 10; // NGUY HIEM: ghi đè vào địa chỉ ngẫu nhiên!`,
          goodCode: `int x = 0;
int *p = &x;
if (p != nullptr) *p = 10;`,
          explanation: "Luôn khởi tạo con trỏ bằng một địa chỉ hợp lệ hoặc `nullptr`."
        }
      ],
      practice: {
        title: "Thực hành: Tăng gấp đôi giá trị bằng hàm nhận con trỏ",
        prompt: "Hoàn thiện hàm `void nhanDoi(int *p)` nhận vào con trỏ trỏ tới một số nguyên và nhân đôi giá trị tại địa chỉ đó (nhớ kiểm tra `p != nullptr`).",
        starterCode: `#include <iostream>
using namespace std;

void nhanDoi(int *p) {
    // Kiểm tra p != nullptr rồi nhân đôi *p
}

int main() {
    int n;
    cin >> n;
    nhanDoi(&n);
    cout << n << endl;
    return 0;
}`,
        sampleInput: "21",
        expectedOutput: "42",
        hints: [
          "if (p != nullptr) { *p = (*p) * 2; }"
        ],
        solutionCode: `#include <iostream>
using namespace std;

void nhanDoi(int *p) {
    if (p != nullptr) {
        *p = (*p) * 2;
    }
}

int main() {
    int n;
    cin >> n;
    nhanDoi(&n);
    cout << n << endl;
    return 0;
}`
      },
      checkpointQuiz: {
        question: "Với `int a = 5; int *p = &a; *p = 12;`, giá trị của `a` sau đó là bao nhiêu?",
        options: ["5", "12", "Địa chỉ của a", "Lỗi biên dịch"],
        correctIndex: 1,
        explanation: "`p` trỏ trực tiếp vào ô nhớ của `a`, nên `*p = 12` cập nhật trực tiếp `a` thành `12`."
      },
      takeaways: [
        "`&x` lấy địa chỉ của biến `x`; `*p` truy cập giá trị tại địa chỉ con trỏ `p` đang giữ.",
        "Luôn khởi tạo con trỏ bằng địa chỉ hợp lệ hoặc `nullptr`.",
        "Trong C++ hiện đại, hãy ưu tiên tham chiếu `&` và `vector` trước khi phải dùng con trỏ thô."
      ]
    }
  },

  // =========================================================================
  // BÀI 13: STRUCT
  // =========================================================================
  {
    id: "lesson-cpp-13",
    section_id: "sec-cpp-13",
    course_id: "course-cpp",
    slug: "struct-trong-cpp",
    title: "Struct – Xây dựng Kiểu dữ liệu Tùy chỉnh",
    summary: "Gom nhóm nhiều thuộc tính liên quan (như Sinh viên, Tọa độ, Sản phẩm) vào một cấu trúc dữ liệu mạch lạc dễ mở rộng.",
    estimated_minutes: 20,
    xp_reward: 80,
    sort_order: 1,
    language: "cpp",
    content: {
      introduction:
        "Mỗi sinh viên có mã số, họ tên và điểm GPA; mỗi điểm trên mặt phẳng có hoành độ `x` và tung độ `y`. Thay vì quản lý 3 mảng rời rạc dễ lệch dữ liệu, `struct` cho phép bạn tự định nghĩa một kiểu dữ liệu mới đóng gói trọn vẹn đối tượng thực tế!",
      objectives: [
        "Định nghĩa một `struct` chuẩn C++ (chú ý dấu chấm phẩy `;` sau dấu đóng `}`).",
        "Truy cập và cập nhật trường dữ liệu bằng toán tử dấu chấm `.`.",
        "Kết hợp mảng `struct` để tìm kiếm hoặc xếp hạng đối tượng."
      ],
      theoryBlocks: [
        {
          heading: "1. Định nghĩa và sử dụng Struct",
          paragraphs: [
            "Một `struct` giống như bản thiết kế (blueprint) gom nhiều biến khác kiểu lại với nhau. Sau khi định nghĩa `struct SinhVien { string ten; double gpa; };`, bạn có thể khai báo biến `SinhVien sv1;` giống hệt như `int` hay `string`.",
            "Bạn thậm chí có thể viết các hàm thành viên bên trong `struct` để đối tượng tự tính toán thông tin của riêng nó!"
          ],
          glossary: [
            { term: "Trường dữ liệu (Field / Member)", definition: "Các biến con khai báo bên trong một struct." },
            { term: "Toán tử dấu chấm (.)", definition: "Dùng để truy cập trường dữ liệu của một biến struct, ví dụ `sv.gpa`." }
          ]
        }
      ],
      examples: [
        {
          title: "Ví dụ: Quản lý danh sách sinh viên và tìm thủ khoa",
          level: "Thực tế",
          description: "Lưu mảng các SinhVien và tìm người có điểm GPA cao nhất.",
          code: `#include <iostream>
#include <string>
using namespace std;

struct SinhVien {
    string ten;
    double gpa;
};

int main() {
    int n;
    cin >> n;
    SinhVien ds[105];
    for (int i = 0; i < n; i++) {
        cin >> ds[i].ten >> ds[i].gpa;
    }
    SinhVien thuKhoa = ds[0];
    for (int i = 1; i < n; i++) {
        if (ds[i].gpa > thuKhoa.gpa) thuKhoa = ds[i];
    }
    cout << thuKhoa.ten << " " << thuKhoa.gpa << "\\n";
    return 0;
}`,
          sampleInput: "3\nAn 3.4\nBinh 3.9\nChi 3.7",
          expectedOutput: "Binh 3.9",
          lineExplanations: [
            { line: "Dòng 5-8", code: "struct SinhVien { ... };", explanation: "Tạo kiểu dữ liệu mới có 2 trường ten và gpa. Đừng quên dấu ; ở cuối!" },
            { line: "Dòng 19", code: "thuKhoa = ds[i];", explanation: "Struct hỗ trợ gán trực tiếp toàn bộ thuộc tính chỉ bằng 1 dấu =." }
          ]
        }
      ],
      commonMistakes: [
        {
          title: "Quên dấu chấm phẩy `;` sau dấu `}` của định nghĩa struct",
          badCode: `struct Diem {
    int x, y;
} // Lỗi biên dịch!`,
          goodCode: `struct Diem {
    int x, y;
};`,
          explanation: "Khác với hàm, định nghĩa `struct` và `class` trong C++ BẮT BUỘC kết thúc bằng dấu `;`."
        }
      ],
      practice: {
        title: "Thực hành: Tính khoảng cách bình phương giữa 2 điểm 2D",
        prompt: "Định nghĩa `struct Point { long long x, y; };`, nhập tọa độ 2 điểm A và B, sau đó in ra bình phương khoảng cách `(xA - xB)^2 + (yA - yB)^2`.",
        starterCode: `#include <iostream>
using namespace std;

struct Point {
    long long x, y;
};

int main() {
    Point a, b;
    cin >> a.x >> a.y >> b.x >> b.y;
    // Tính dx, dy và in ra dx*dx + dy*dy
    return 0;
}`,
        sampleInput: "1 2 4 6",
        expectedOutput: "25",
        hints: ["long long dx = a.x - b.x, dy = a.y - b.y; cout << dx*dx + dy*dy;"],
        solutionCode: `#include <iostream>
using namespace std;

struct Point {
    long long x, y;
};

int main() {
    Point a, b;
    cin >> a.x >> a.y >> b.x >> b.y;
    long long dx = a.x - b.x;
    long long dy = a.y - b.y;
    cout << dx * dx + dy * dy << endl;
    return 0;
}`
      },
      checkpointQuiz: {
        question: "Cho `struct Book { string title; int pages; }; Book b;`. Cách truy cập số trang nào đúng?",
        options: ["b->pages", "b.pages", "Book.pages", "pages(b)"],
        correctIndex: 1,
        explanation: "Với biến struct trực tiếp (không phải con trỏ), dùng toán tử dấu chấm `b.pages`."
      },
      takeaways: [
        "Struct giúp gom các thuộc tính liên quan thành một kiểu dữ liệu rõ nghĩa.",
        "Luôn đặt dấu `;` ngay sau dấu đóng ngoặc `}` của định nghĩa struct."
      ]
    }
  },

  // =========================================================================
  // BÀI 14: VECTOR
  // =========================================================================
  {
    id: "lesson-cpp-14",
    section_id: "sec-cpp-14",
    course_id: "course-cpp",
    slug: "stl-vector-trong-cpp",
    title: "STL Vector – Mảng động mạnh mẽ trong C++ hiện đại",
    summary: "Tạm biệt nỗi lo tràn kích thước mảng tĩnh với std::vector: push_back, size, duyệt range-based for và kết hợp std::sort.",
    estimated_minutes: 20,
    xp_reward: 85,
    sort_order: 1,
    language: "cpp",
    content: {
      introduction:
        "Trong C++ hiện đại và lập trình thi đấu, `std::vector` là cấu trúc dữ liệu được sử dụng nhiều nhất! Nó hội tụ toàn bộ tốc độ truy cập `O(1)` của mảng truyền thống, cộng thêm khả năng tự động mở rộng kích thước, tự giải phóng bộ nhớ và tương thích hoàn hảo với thư viện thuật toán `<algorithm>`.",
      objectives: [
        "Khai báo, thêm phần tử (`push_back`), xóa cuối (`pop_back`) và lấy kích thước (`size()`).",
        "Duyệt `vector` gọn gàng với vòng lặp `for (int x : v)`.",
        "Sắp xếp `vector` chỉ bằng một dòng `sort(v.begin(), v.end())`."
      ],
      theoryBlocks: [
        {
          heading: "1. Vì sao lập trình viên C++ ưu tiên vector?",
          paragraphs: [
            "Khác với mảng tĩnh `int a[1000]` phải đoán trước kích thước cố định, `vector<int> v(n)` cấp phát vừa khít `n` phần tử (thậm chí tự khởi tạo toàn bộ bằng 0!). Khi gọi `v.push_back(x)`, vector tự động giãn vùng nhớ nếu đầy.",
            "Cần nạp `#include <vector>` (và `#include <algorithm>` nếu dùng `sort`, `reverse`, `min_element`)."
          ],
          glossary: [
            { term: "STL (Standard Template Library)", definition: "Thư viện khuôn mẫu chuẩn của C++ cung cấp sẵn cấu trúc dữ liệu (vector, stack, queue, map) và thuật toán (sort, binary_search)." }
          ]
        }
      ],
      examples: [
        {
          title: "Ví dụ: Lọc các số dương và sắp xếp tăng dần bằng vector",
          level: "Thực tế",
          description: "Thêm động phần tử thỏa điều kiện bằng push_back rồi sort.",
          code: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> duong;

    for (int i = 0; i < n; i++) {
        int x;
        cin >> x;
        if (x > 0) duong.push_back(x);
    }

    sort(duong.begin(), duong.end());
    for (int x : duong) cout << x << " ";
    cout << "\\n";
    return 0;
}`,
          sampleInput: "6\n5 -2 9 0 1 -7",
          expectedOutput: "1 5 9",
          lineExplanations: [
            { line: "Dòng 14", code: "duong.push_back(x);", explanation: "Chỉ đẩy các số dương vào vector mà không cần biết trước có bao nhiêu số dương." },
            { line: "Dòng 17", code: "sort(duong.begin(), duong.end());", explanation: "Sắp xếp tăng dần với độ phức tạp O(N log N)." }
          ]
        }
      ],
      commonMistakes: [
        {
          title: "Truy cập v[i] trên vector rỗng chưa cấp phát kích thước",
          badCode: `vector<int> v;
cin >> v[0]; // Lỗi Runtime Error vì v.size() == 0!`,
          goodCode: `vector<int> v(n); // Hoặc dùng v.push_back(x)
cin >> v[0];`,
          explanation: "Chỉ truy cập `v[i]` khi `i < v.size()`. Nếu vector đang rỗng, phải khởi tạo kích thước `vector<int> v(n)` hoặc dùng `push_back`."
        }
      ],
      practice: {
        title: "Thực hành: Tìm phần tử lớn thứ hai bằng vector và sort",
        prompt: "Nhập `n` (2 <= n <= 10^5) và `n` số nguyên đôi một khác nhau. Dùng `vector<int>` và `sort` để in ra phần tử lớn thứ hai.",
        starterCode: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> v(n);
    for (int i = 0; i < n; i++) cin >> v[i];
    // Sắp xếp v và in ra v[n - 2]
    return 0;
}`,
        sampleInput: "5\n10 4 25 8 19",
        expectedOutput: "19",
        hints: ["sort(v.begin(), v.end()); cout << v[n - 2] << endl;"],
        solutionCode: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> v(n);
    for (int i = 0; i < n; i++) cin >> v[i];
    sort(v.begin(), v.end());
    cout << v[n - 2] << endl;
    return 0;
}`
      },
      checkpointQuiz: {
        question: "Phương thức nào thêm một phần tử mới vào cuối `std::vector`?",
        options: ["append()", "add()", "push_back()", "insert_end()"],
        correctIndex: 2,
        explanation: "`v.push_back(val)` thêm phần tử vào cuối vector với độ phức tạp trung bình O(1)."
      },
      takeaways: [
        "`vector<T>` thay thế hoàn hảo mảng tĩnh nhờ tự co giãn và tự giải phóng bộ nhớ.",
        "Luôn truyền `const vector<int> &v` vào hàm để đạt hiệu năng tối ưu."
      ]
    }
  },

  // =========================================================================
  // BÀI 15: ĐỆ QUY
  // =========================================================================
  {
    id: "lesson-cpp-15",
    section_id: "sec-cpp-15",
    course_id: "course-cpp",
    slug: "de-quy-trong-cpp",
    title: "Đệ quy (Recursion) – Tư duy Chia để trị",
    summary: "Hiểu bản chất hàm tự gọi lại chính mình, vai trò sống còn của điểm dừng cơ sở (Base Case) và cách ngăn tràn ngăn xếp (Stack Overflow).",
    estimated_minutes: 25,
    xp_reward: 90,
    sort_order: 1,
    language: "cpp",
    content: {
      introduction:
        "Đệ quy là kỹ thuật một hàm tự gọi lại chính nó để giải một phiên bản nhỏ hơn của cùng bài toán. Đây là chìa khóa mở cánh cửa vào hàng loạt thuật toán đỉnh cao như Quicksort, Mergesort, Duyệt cây (Tree), Quy hoạch động và Quay lui (Backtracking).",
      objectives: [
        "Xác định 2 thành phần bắt buộc của mọi hàm đệ quy: Điểm dừng cơ sở (Base Case) và Công thức truy hồi (Recursive Step).",
        "Theo dõi ngăn xếp gọi hàm (Call Stack) từng bước.",
        "Biết nhận diện khi nào đệ quy ngây thơ bị chậm (như Fibonacci lặp lại) và hướng tối ưu."
      ],
      theoryBlocks: [
        {
          heading: "1. Hai quy tắc vàng khi viết hàm đệ quy",
          paragraphs: [
            "Quy tắc 1 — **Base Case (Trường hợp cơ sở)**: Điều kiện dừng đơn giản nhất mà hàm trả về kết quả ngay không cần gọi đệ quy nữa (ví dụ `0! = 1`). Thiếu Base Case sẽ dẫn tới tràn bộ nhớ Stack Overflow!",
            "Quy tắc 2 — **Tiến gần tới Base Case**: Mỗi lần gọi lại chính mình, tham số phải nhỏ dần/tiến gần về điểm dừng (ví dụ `n` giảm xuống `n - 1`)."
          ],
          glossary: [
            { term: "Call Stack (Ngăn xếp lời gọi)", definition: "Vùng nhớ hệ thống lưu trạng thái của từng lời gọi hàm đang chờ hoàn tất." },
            { term: "Stack Overflow", definition: "Lỗi Runtime Error xảy ra khi đệ quy gọi sâu quá giới hạn bộ nhớ ngăn xếp." }
          ]
        }
      ],
      examples: [
        {
          title: "Ví dụ: Tính giai thừa và tổng chữ số bằng đệ quy",
          level: "Cơ bản",
          description: "Tách n! = n * (n - 1)! với điểm dừng n <= 1 trả về 1.",
          code: `#include <iostream>
using namespace std;

long long giaiThua(int n) {
    if (n <= 1) return 1; // Base case
    return n * giaiThua(n - 1);
}

int tongChuSo(long long n) {
    if (n < 10) return (int)n; // Base case
    return (int)(n % 10) + tongChuSo(n / 10);
}

int main() {
    cout << "5! = " << giaiThua(5) << "\\n";
    cout << "Tong chu so 2026 = " << tongChuSo(2026) << "\\n";
    return 0;
}`,
          expectedOutput: "5! = 120\nTong chu so 2026 = 10",
          lineExplanations: [
            { line: "Dòng 5", code: "if (n <= 1) return 1;", explanation: "Điểm dừng ngăn hàm gọi xuống số âm vô tận." },
            { line: "Dòng 11", code: "(n % 10) + tongChuSo(n / 10)", explanation: "Lấy chữ số cuối cộng với tổng các chữ số còn lại." }
          ]
        }
      ],
      commonMistakes: [
        {
          title: "Thiếu Base Case hoặc điều kiện dừng không bao giờ đạt được",
          badCode: `int f(int n) {
    return n * f(n - 1); // Tràn Stack ngay lập tức!
}`,
          goodCode: `int f(int n) {
    if (n <= 1) return 1;
    return n * f(n - 1);
}`,
          explanation: "Luôn viết Base Case ở ngay những dòng đầu tiên của hàm đệ quy."
        }
      ],
      practice: {
        title: "Thực hành: Tính lũy thừa nhanh a^b bằng đệ quy chia để trị",
        prompt: "Nhập 2 số nguyên `a, b` (0 <= b <= 30). Viết hàm đệ quy `long long power(long long a, int b)` tính `a^b` theo công thức chia đôi: nếu `b == 0` trả về 1; đặt `half = power(a, b/2)`; nếu `b` chẵn trả `half * half`, lẻ trả `half * half * a`.",
        starterCode: `#include <iostream>
using namespace std;

long long power(long long a, int b) {
    if (b == 0) return 1;
    // Hoàn thiện đệ quy chia đôi O(log b)
    return 1;
}

int main() {
    long long a;
    int b;
    cin >> a >> b;
    cout << power(a, b) << endl;
    return 0;
}`,
        sampleInput: "2 10",
        expectedOutput: "1024",
        hints: ["long long half = power(a, b / 2); if (b % 2 == 0) return half * half; return half * half * a;"],
        solutionCode: `#include <iostream>
using namespace std;

long long power(long long a, int b) {
    if (b == 0) return 1;
    long long half = power(a, b / 2);
    if (b % 2 == 0) return half * half;
    return half * half * a;
}

int main() {
    long long a;
    int b;
    cin >> a >> b;
    cout << power(a, b) << endl;
    return 0;
}`
      },
      checkpointQuiz: {
        question: "Thành phần nào BẮT BUỘC phải có để một hàm đệ quy không bị lặp vô hạn gây Stack Overflow?",
        options: ["Vòng lặp for", "Điểm dừng cơ sở (Base Case)", "Biến toàn cục", "Con trỏ nullptr"],
        correctIndex: 1,
        explanation: "Base Case xác định trường hợp nhỏ nhất trả kết quả trực tiếp để chấm dứt chuỗi gọi đệ quy."
      },
      takeaways: [
        "Mọi hàm đệ quy đều gồm 2 phần: Base Case (điểm dừng) và bước quy về bài toán nhỏ hơn.",
        "Chia để trị (như lũy thừa nhanh O(log N)) biến đệ quy thành công cụ tăng tốc đột phá."
      ]
    }
  },

  // =========================================================================
  // BÀI 16: THUẬT TOÁN TÌM KIẾM VÀ SẮP XẾP
  // =========================================================================
  {
    id: "lesson-cpp-16",
    section_id: "sec-cpp-16",
    course_id: "course-cpp",
    slug: "thuat-toan-tim-kiem-va-sap-xep",
    title: "Thuật toán Tìm kiếm Nhị phân và Sắp xếp",
    summary: "Phân tích độ phức tạp Big-O, cài đặt Tìm kiếm nhị phân O(log N), Selection Sort và tùy biến bộ so sánh cho std::sort.",
    estimated_minutes: 30,
    xp_reward: 95,
    sort_order: 1,
    language: "cpp",
    content: {
      introduction:
        "Tìm một cái tên trong danh bạ 1 triệu người: nếu dò từng trang từ đầu (Tìm kiếm tuyến tính O(N)) mất tối đa 1 triệu bước, nhưng nếu mở giữa cuốn sách rồi bỏ nửa không chứa tên cần tìm (Tìm kiếm nhị phân O(log N)), bạn chỉ mất tối đa 20 bước! Đó là vẻ đẹp của Thuật toán.",
      objectives: [
        "Hiểu trực giác độ phức tạp thời gian O(1), O(log N), O(N), O(N log N) và O(N²).",
        "Cài đặt chính xác Tìm kiếm nhị phân (Binary Search) không bị lặp vô hạn.",
        "Tùy biến tiêu chí sắp xếp bằng hàm comparator trong `std::sort`."
      ],
      theoryBlocks: [
        {
          heading: "1. Tìm kiếm nhị phân (Binary Search)",
          paragraphs: [
            "Điều kiện tiên quyết: mảng PHẢI ĐƯỢC SẮP XẾP TĂNG DẦN (hoặc giảm dần). Ta duy trì đoạn tìm kiếm `[left, right]` và lấy điểm giữa `mid = left + (right - left) / 2` (tránh tràn số so với `(left + right) / 2`).",
            "So sánh `a[mid]` với `target`: nếu bằng thì tìm thấy; nếu `a[mid] < target` thì bỏ toàn bộ nửa trái (`left = mid + 1`); ngược lại bỏ nửa phải (`right = mid - 1`)."
          ],
          glossary: [
            { term: "Big-O Notation", definition: "Ký hiệu mô tả tốc độ tăng thời gian chạy của thuật toán khi kích thước dữ liệu đầu vào N tăng lớn." }
          ]
        }
      ],
      examples: [
        {
          title: "Ví dụ: Tìm kiếm nhị phân trả về vị trí phần tử cần tìm",
          level: "Thực tế",
          description: "Tìm `x` trong mảng đã sắp xếp, trả về chỉ số hoặc `-1` nếu không có.",
          code: `#include <iostream>
#include <vector>
using namespace std;

int binarySearch(const vector<int> &a, int target) {
    int l = 0, r = (int)a.size() - 1;
    while (l <= r) {
        int mid = l + (r - l) / 2;
        if (a[mid] == target) return mid;
        if (a[mid] < target) l = mid + 1;
        else r = mid - 1;
    }
    return -1;
}

int main() {
    vector<int> a = {2, 5, 8, 12, 16, 23, 38, 56};
    cout << "Vi tri cua 23: " << binarySearch(a, 23) << "\\n";
    cout << "Vi tri cua 15: " << binarySearch(a, 15) << "\\n";
    return 0;
}`,
          expectedOutput: "Vi tri cua 23: 5\nVi tri cua 15: -1",
          lineExplanations: [
            { line: "Dòng 8", code: "int mid = l + (r - l) / 2;", explanation: "Công thức tính chỉ số giữa an toàn không bao giờ bị tràn int." },
            { line: "Dòng 10-11", code: "l = mid + 1; / r = mid - 1;", explanation: "Mỗi bước loại bỏ chính xác một nửa không gian tìm kiếm." }
          ]
        }
      ],
      commonMistakes: [
        {
          title: "Áp dụng Tìm kiếm nhị phân trên mảng CHƯA sắp xếp",
          badCode: `// Mảng {9, 1, 5, 2} chưa sắp xếp -> binarySearch sẽ trả sai kết quả!`,
          goodCode: `sort(a.begin(), a.end()); // Đảm bảo mảng có thứ tự trước khi binarySearch`,
          explanation: "Tính đơn điệu (đã sắp xếp) là điều kiện bắt buộc để loại bỏ một nửa mảng."
        }
      ],
      practice: {
        title: "Thực hành: Sắp xếp mảng giảm dần",
        prompt: "Nhập `n` và `n` số nguyên. Sử dụng `std::sort` cùng hàm so sánh để in mảng theo thứ tự GIẢM DẦN.",
        starterCode: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    // Sắp xếp giảm dần bằng greater<int>() hoặc lambda [](int x, int y){ return x > y; }
    for (int x : a) cout << x << " ";
    return 0;
}`,
        sampleInput: "5\n3 9 1 7 4",
        expectedOutput: "9 7 4 3 1",
        hints: ["sort(a.begin(), a.end(), greater<int>());"],
        solutionCode: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    sort(a.begin(), a.end(), greater<int>());
    for (int i = 0; i < n; i++) cout << a[i] << (i + 1 < n ? " " : "");
    cout << endl;
    return 0;
}`
      },
      checkpointQuiz: {
        question: "Độ phức tạp thời gian của thuật toán Tìm kiếm nhị phân trên mảng đã sắp xếp gồm N phần tử là gì?",
        options: ["O(1)", "O(log N)", "O(N)", "O(N²)"],
        correctIndex: 1,
        explanation: "Mỗi bước chia đôi số phần tử còn lại nên tối đa chỉ cần khoảng log₂(N) bước."
      },
      takeaways: [
        "Tìm kiếm nhị phân chạy cực nhanh O(log N) nhưng yêu cầu dữ liệu đã sắp xếp.",
        "`std::sort` trong C++ có độ phức tạp O(N log N) và dễ dàng tùy biến thứ tự bằng comparator."
      ]
    }
  },

  // =========================================================================
  // BÀI 17: CẤU TRÚC DỮ LIỆU CƠ BẢN
  // =========================================================================
  {
    id: "lesson-cpp-17",
    section_id: "sec-cpp-17",
    course_id: "course-cpp",
    slug: "cau-truc-du-lieu-co-ban",
    title: "Cấu trúc dữ liệu cơ bản: Stack và Queue",
    summary: "Làm chủ nguyên lý LIFO của Ngăn xếp (Stack) và FIFO của Hàng đợi (Queue) qua bài toán kiểm tra dấu ngoặc hợp lệ.",
    estimated_minutes: 25,
    xp_reward: 95,
    sort_order: 1,
    language: "cpp",
    content: {
      introduction:
        "Nút Undo (Ctrl+Z) hoạt động theo nguyên tắc 'thao tác mới nhất được hoàn tác đầu tiên' — đó chính là Stack (Ngăn xếp). Còn hàng người chờ thanh toán ở quầy thu ngân 'ai đến trước phục vụ trước' — đó là Queue (Hàng đợi). Cả hai đều có sẵn cực tiện trong STL C++!",
      objectives: [
        "Hiểu và vận dụng `std::stack` (LIFO: push, pop, top, empty).",
        "Hiểu và vận dụng `std::queue` (FIFO: push, pop, front, empty).",
        "Giải bài toán kinh điển kiểm tra chuỗi ngoặc cân bằng `()[]{}` bằng Stack."
      ],
      theoryBlocks: [
        {
          heading: "1. LIFO (Stack) vs FIFO (Queue)",
          paragraphs: [
            "**Stack (`#include <stack>`)**: Vào sau ra trước (Last-In First-Out). Cả thao tác đẩy vào (`push`) và lấy ra (`pop` / `top`) đều diễn ra ở đỉnh ngăn xếp trong O(1).",
            "**Queue (`#include <queue>`)**: Vào trước ra trước (First-In First-Out). Đẩy vào cuối hàng (`push`), lấy ra ở đầu hàng (`front` / `pop`) trong O(1)."
          ],
          glossary: [
            { term: "LIFO", definition: "Last-In, First-Out — Phần tử đưa vào cuối cùng sẽ được lấy ra đầu tiên." },
            { term: "FIFO", definition: "First-In, First-Out — Phần tử đưa vào đầu tiên sẽ được lấy ra đầu tiên." }
          ]
        }
      ],
      examples: [
        {
          title: "Ví dụ: Kiểm tra dãy ngoặc đơn hợp lệ bằng std::stack",
          level: "Thực tế",
          description: "Gặp '(' thì đẩy vào stack; gặp ')' thì kiểm tra và rút '(' tương ứng ở đỉnh.",
          code: `#include <iostream>
#include <stack>
#include <string>
using namespace std;

bool ngoacHopLe(const string &s) {
    stack<char> st;
    for (char c : s) {
        if (c == '(') st.push(c);
        else if (c == ')') {
            if (st.empty()) return false;
            st.pop();
        }
    }
    return st.empty();
}

int main() {
    string s;
    cin >> s;
    cout << (ngoacHopLe(s) ? "HOP LE" : "KHONG HOP LE") << "\\n";
    return 0;
}`,
          sampleInput: "(()())",
          expectedOutput: "HOP LE",
          lineExplanations: [
            { line: "Dòng 11", code: "if (st.empty()) return false;", explanation: "Luôn kiểm tra st.empty() TRƯỚC khi gọi st.pop() hoặc st.top() để tránh Runtime Error!" }
          ]
        }
      ],
      commonMistakes: [
        {
          title: "Gọi st.top() hoặc st.pop() khi stack đang rỗng",
          badCode: `stack<int> st;
int x = st.top(); // Crash ngay lập tức!`,
          goodCode: `if (!st.empty()) {
    int x = st.top();
    st.pop();
}`,
          explanation: "Luôn bảo vệ bằng điều kiện `if (!st.empty())` trước khi truy cập phần tử đỉnh/đầu."
        }
      ],
      practice: {
        title: "Thực hành: Đảo ngược chuỗi ký tự bằng std::stack",
        prompt: "Nhập một chuỗi `s` không dấu cách. Đẩy từng ký tự vào `stack<char>`, sau đó lần lượt lấy `top()` và `pop()` để in ra chuỗi đảo ngược.",
        starterCode: `#include <iostream>
#include <stack>
#include <string>
using namespace std;

int main() {
    string s;
    cin >> s;
    stack<char> st;
    // Đẩy vào stack và lấy ra in ngược lại
    return 0;
}`,
        sampleInput: "CODELAB",
        expectedOutput: "BALEDOC",
        hints: ["for (char c : s) st.push(c); while (!st.empty()) { cout << st.top(); st.pop(); }"],
        solutionCode: `#include <iostream>
#include <stack>
#include <string>
using namespace std;

int main() {
    string s;
    cin >> s;
    stack<char> st;
    for (char c : s) st.push(c);
    while (!st.empty()) {
        cout << st.top();
        st.pop();
    }
    cout << endl;
    return 0;
}`
      },
      checkpointQuiz: {
        question: "Cấu trúc dữ liệu nào hoạt động theo nguyên tắc Vào trước – Ra trước (FIFO)?",
        options: ["Stack", "Queue", "Binary Tree", "Heap"],
        correctIndex: 1,
        explanation: "Queue (Hàng đợi) hoạt động theo nguyên tắc FIFO: phần tử vào đầu tiên sẽ rời hàng đầu tiên."
      },
      takeaways: [
        "Stack tuân thủ LIFO (dùng cho Undo, duyệt biểu thức, kiểm tra dấu ngoặc, DFS).",
        "Queue tuân thủ FIFO (dùng cho hàng đợi tác vụ, tìm đường ngắn nhất BFS).",
        "Luôn kiểm tra `!empty()` trước khi gọi `top()`, `front()` hoặc `pop()`."
      ]
    }
  },

  // =========================================================================
  // BÀI 18: LẬP TRÌNH HƯỚNG ĐỐI TƯỢNG (OOP)
  // =========================================================================
  {
    id: "lesson-cpp-18",
    section_id: "sec-cpp-18",
    course_id: "course-cpp",
    slug: "lap-trinh-huong-doi-tuong-oop",
    title: "Lập trình Hướng đối tượng (OOP) – Class, Đóng gói & Kế thừa",
    summary: "Hoàn thiện chặng cuối C++ với Class, Constructor, tính đóng gói (private/public), kế thừa và phương thức ảo đa hình.",
    estimated_minutes: 30,
    xp_reward: 100,
    sort_order: 1,
    language: "cpp",
    content: {
      introduction:
        "Chúc mừng bạn đã đi tới chương 18! Lập trình hướng đối tượng (OOP) là phương pháp thiết kế phần mềm quy mô lớn bằng cách mô hình hóa thế giới thực thành các Đối tượng (Object) sở hữu cả dữ liệu lẫn hành vi, giúp mã nguồn dễ bảo vệ, tái sử dụng và mở rộng hàng chục năm.",
      objectives: [
        "Phân biệt Class (lớp thiết kế) và Object (thực thể cụ thể).",
        "Bảo vệ dữ liệu bằng phạm vi truy cập `private` và giao diện `public` (Tính đóng gói – Encapsulation).",
        "Sử dụng Constructor để khởi tạo đối tượng hợp lệ ngay khi sinh ra và áp dụng Kế thừa (Inheritance)."
      ],
      theoryBlocks: [
        {
          heading: "1. 4 trụ cột của OOP trong C++",
          paragraphs: [
            "**Đóng gói (Encapsulation)**: Ẩn dữ liệu nhạy cảm (ví dụ `soDu` tài khoản ngân hàng) trong `private`, chỉ cho phép thay đổi thông qua các phương thức `public` có kiểm tra hợp lệ (`napTien`, `rutTien`).",
            "**Kế thừa (Inheritance)**: Lớp con (`class HocVienVip : public HocVien`) thừa hưởng toàn bộ thuộc tính và phương thức của lớp cha để tránh lặp code.",
            "**Đa hình (Polymorphism)** & **Trừu tượng (Abstraction)**: Cho phép gọi cùng một tên phương thức (`virtual`) nhưng mỗi lớp con thể hiện hành vi riêng."
          ],
          glossary: [
            { term: "Constructor (Hàm tạo)", definition: "Phương thức đặc biệt trùng tên với class, tự động chạy ngay khi tạo một đối tượng mới để khởi tạo trạng thái ban đầu." }
          ]
        }
      ],
      examples: [
        {
          title: "Ví dụ: Lớp TaiKhoan với tính đóng gói an toàn",
          level: "Thực tế",
          description: "Ngăn rút vượt quá số dư bằng cách ẩn thuộc tính `soDu` trong `private`.",
          code: `#include <iostream>
#include <string>
using namespace std;

class TaiKhoan {
private:
    string chuSoHuu;
    long long soDu;

public:
    TaiKhoan(string ten, long long banDau) : chuSoHuu(ten), soDu(banDau) {}

    void napTien(long long soTien) {
        if (soTien > 0) soDu += soTien;
    }

    bool rutTien(long long soTien) {
        if (soTien > 0 && soTien <= soDu) {
            soDu -= soTien;
            return true;
        }
        return false;
    }

    void inThongTin() const {
        cout << chuSoHuu << " - So du: " << soDu << "\\n";
    }
};

int main() {
    TaiKhoan tk("Minh Quan", 500000);
    tk.napTien(200000);
    tk.rutTien(150000);
    tk.inThongTin();
    return 0;
}`,
          expectedOutput: "Minh Quan - So du: 550000",
          lineExplanations: [
            { line: "Dòng 6-8", code: "private: ...", explanation: "Code bên ngoài không thể tự ý gán `tk.soDu = -99999`." },
            { line: "Dòng 11", code: "TaiKhoan(string ten, long long banDau)", explanation: "Constructor khởi tạo đối tượng với danh sách khởi tạo chuẩn C++." }
          ]
        }
      ],
      commonMistakes: [
        {
          title: "Để toàn bộ thuộc tính ở chế độ public làm mất tính đóng gói",
          badCode: `class Bank { public: long long balance; }; // Ai cũng sửa tùy tiện được`,
          goodCode: `class Bank { private: long long balance; public: void deposit(long long v); };`,
          explanation: "Luôn giấu dữ liệu trạng thái trong `private` và kiểm tra tính hợp lệ qua các phương thức `public`."
        }
      ],
      practice: {
        title: "Thực hành: Xây dựng lớp HinhChuNhat",
        prompt: "Hoàn thiện lớp `HinhChuNhat` với 2 thuộc tính `private` là `rong, cao`, constructor khởi tạo và 2 phương thức `public`: `chuVi()` và `dienTich()`. Nhập `rong, cao` và in ra chu vi, diện tích cách nhau 1 dấu cách.",
        starterCode: `#include <iostream>
using namespace std;

class HinhChuNhat {
private:
    double rong, cao;
public:
    HinhChuNhat(double r, double c) : rong(r), cao(c) {}
    // Viết hàm chuVi() và dienTich()
};

int main() {
    double r, c;
    cin >> r >> c;
    HinhChuNhat hcn(r, c);
    // In chuVi() và dienTich()
    return 0;
}`,
        sampleInput: "4 6",
        expectedOutput: "20 24",
        hints: ["double chuVi() const { return 2 * (rong + cao); }", "double dienTich() const { return rong * cao; }"],
        solutionCode: `#include <iostream>
using namespace std;

class HinhChuNhat {
private:
    double rong, cao;
public:
    HinhChuNhat(double r, double c) : rong(r), cao(c) {}
    double chuVi() const { return 2 * (rong + cao); }
    double dienTich() const { return rong * cao; }
};

int main() {
    double r, c;
    cin >> r >> c;
    HinhChuNhat hcn(r, c);
    cout << hcn.chuVi() << " " << hcn.dienTich() << endl;
    return 0;
}`
      },
      checkpointQuiz: {
        question: "Trong C++, phạm vi truy cập mặc định của các thành viên trong `class` là gì?",
        options: ["public", "private", "protected", "static"],
        correctIndex: 1,
        explanation: "Khác với `struct` (mặc định là `public`), các thành viên trong `class` mặc định là `private` để nhấn mạnh tính đóng gói."
      },
      takeaways: [
        "OOP tổ chức hệ thống lớn thành các lớp và đối tượng trực quan, dễ mở rộng.",
        "Đóng gói bảo vệ dữ liệu trong `private`, chỉ mở thao tác hợp lệ qua `public`.",
        "Bạn đã hoàn thành trọn vẹn 18 chương C++! Hãy sang mục Coding Challenges để thực chiến."
      ]
    }
  }
];
