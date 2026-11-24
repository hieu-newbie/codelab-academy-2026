import type { KnowledgeTopic } from "@/lib/offline-knowledge-base";

/**
 * 16 classic Vietnamese C++ programming problems & foundational CS algorithms
 * frequently asked by beginners, students, and competitive programming learners.
 */
export const CLASSIC_PROBLEM_TOPICS: KnowledgeTopic[] = [
  {
    id: "base-conversion-binary",
    title: "Chuyển đổi số nguyên sang Nhị phân (Base 2) & Hệ cơ số (8 / 16)",
    category: "Thuật toán",
    language: "cpp",
    specificityBoost: 25,
    primaryTerms: [
      "so nhi phan",
      "sang nhi phan",
      "thanh so nhi phan",
      "thanh nhi phan",
      "he nhi phan",
      "he co so",
      "doi co so",
      "chuyen co so",
      "thap phan sang nhi phan",
      "nhi phan sang thap phan",
      "decimal to binary",
      "binary to decimal",
      "thap luc phan",
      "bat phan",
      "he 16",
      "he 2",
    ],
    secondaryTerms: ["nhi phan", "chia 2", "lay du", "hex"],
    negativePatterns: [/tim\s+kiem\s+nhi\s+phan/, /cay\s+nhi\s+phan/, /luy\s+thua\s+nhi\s+phan/, /sinh\s+(xau\s+)?nhi\s+phan/],
    summary:
      "Để chuyển một số nguyên hệ thập phân (cơ số 10) sang **hệ nhị phân (cơ số 2)**, ta liên tục **chia lấy dư cho 2** (`n % 2`) rồi **chia nguyên cho 2** (`n /= 2`) cho đến khi `n == 0`, sau đó **đảo ngược** chuỗi các số dư thu được!",
    keyPoints: [
      "**Trường hợp biên quan trọng `n == 0`:** Phải trả về ngay `\"0\"` (nếu không xử lý riêng, vòng `while (n > 0)` sẽ không chạy và in ra chuỗi rỗng!).",
      "**Xử lý số âm:** Lưu cờ `bool isNeg = (n < 0)`, đổi dấu bằng `unsigned long long` (hoặc `abs`) rồi thêm dấu `'-'` phía trước khi in.",
      "**Tổng quát cho mọi hệ cơ số `B` (2, 8, 16):** Dùng bảng ký tự `const string DIGITS = \"0123456789ABCDEF\";` và lấy `DIGITS[n % B]`.",
      "**Đổi ngược từ Nhị phân → Thập phân:** Duyệt từng ký tự `c` trong chuỗi: `ans = ans * 2 + (c - '0');`.",
    ],
    exampleLang: "cpp",
    exampleCode: `#include <bits/stdc++.h>
using namespace std;

string toBinary(long long n) {
    if (n == 0) return "0";
    bool neg = n < 0;
    unsigned long long x = neg ? -(unsigned long long)n : (unsigned long long)n;

    string bin = "";
    while (x > 0) {
        bin.push_back(char('0' + (x % 2))); // lay bit cuoi
        x /= 2;                             // chia doi
    }
    reverse(bin.begin(), bin.end());        // dao nguoc chuoi bit
    return neg ? ("-" + bin) : bin;
}

int main() {
    long long n;
    if (cin >> n) {
        cout << toBinary(n) << "\\n";
    }
    return 0;
}`,
    mistakes: [
      "**Quên trường hợp `n = 0`:** Vòng lặp `while (n > 0)` bỏ qua và không in gì.",
      "**Quên đảo ngược thứ tự số dư:** Bit đầu tiên lấy ra từ `n % 2` là bit thấp nhất (nằm bên phải cùng), nên phải `reverse` hoặc dùng `stack`.",
      "**Dùng số `int` để chứa kết quả nhị phân:** Ví dụ `100000` ở hệ 2 có 17 chữ số (vượt `int`!), luôn lưu kết quả nhị phân bằng `string` hoặc `vector<int>`!",
    ],
    practice: {
      prompt: "Mở mục **Tự code (Sandbox)**, dán đoạn code trên chạy thử với `0`, `13` (`1101`), `42` (`101010`), rồi thử nâng cấp thành hàm `toBase(long long n, int base)` hỗ trợ hệ 16 (`0-9, A-F`)!",
      hint: "Thay số `2` bằng `base` và dùng `const string DIGITS = \"0123456789ABCDEF\"; bin.push_back(DIGITS[x % base]);`.",
      quiz: "Số `13` ở hệ thập phân đổi sang hệ nhị phân là bao nhiêu?",
    },
  },
  {
    id: "reverse-palindrome-number",
    title: "Đảo ngược số nguyên & Kiểm tra số đối xứng (Số thuận nghịch)",
    category: "Thuật toán",
    language: "cpp",
    specificityBoost: 22,
    primaryTerms: [
      "dao nguoc so",
      "lat nguoc so",
      "so doi xung",
      "so thuan nghich",
      "palindrome number",
      "kiem tra so doi xung",
    ],
    secondaryTerms: ["doi xung", "thuan nghich", "dao so"],
    summary:
      "Để đảo ngược một số nguyên không âm `n`, ta lặp tách chữ số cuối `n % 10` rồi ghép vào số đảo ngược bằng công thức **`rev = rev * 10 + n % 10`**. Số `n` là **số đối xứng (thuận nghịch)** khi `n >= 0` và `rev == n`.",
    keyPoints: [
      "Luôn **lưu bản sao `long long orig = n;`** trước vòng lặp `while (n > 0)` vì vòng lặp sẽ làm `n` giảm về `0`.",
      "Dùng `long long` cho `rev` để tránh tràn số `int` khi đảo các số 10 chữ số (ví dụ `1999999999` đảo lại vượt `INT_MAX`).",
      "Mọi số âm (như `-121`) đều không phải số đối xứng vì có dấu `'-'` ở đầu.",
    ],
    exampleLang: "cpp",
    exampleCode: `#include <bits/stdc++.h>
using namespace std;

int main() {
    long long n;
    if (!(cin >> n)) return 0;
    long long orig = n, rev = 0;
    while (n > 0) {
        rev = rev * 10 + (n % 10);
        n /= 10;
    }
    cout << "So dao nguoc: " << rev << "\\n";
    cout << (orig >= 0 && orig == rev ? "La so doi xung\\n" : "Khong doi xung\\n");
    return 0;
}`,
    mistakes: [
      "So sánh `if (n == rev)` sau vòng lặp thay vì `if (orig == rev)` — sau vòng lặp `n` đã bằng `0`!",
    ],
    practice: {
      prompt: "Liệt kê tất cả các số thuận nghịch có 3 chữ số (từ `100` đến `999`).",
      hint: "Viết hàm `bool isPalindrome(long long x)` rồi duyệt `for (int i = 100; i <= 999; i++)`.",
    },
  },
  {
    id: "special-numbers",
    title: "Số chính phương, Số hoàn hảo & Số Armstrong",
    category: "Thuật toán",
    language: "cpp",
    specificityBoost: 22,
    primaryTerms: [
      "so chinh phuong",
      "chinh phuong",
      "so hoan hao",
      "perfect number",
      "so armstrong",
      "armstrong",
      "tong cac uoc",
      "dem uoc",
    ],
    secondaryTerms: ["uoc so", "can bac hai", "sqrt"],
    summary:
      "Ba bài toán số học kinh điển giúp rèn kỹ năng duyệt ước `O(√N)` và tránh sai số số thực `double`.",
    keyPoints: [
      "**Số chính phương (`n = k²`):** Kiểm tra `n >= 0`, tính `long long r = llround(sqrt((long double)n));` rồi kiểm tra chính xác `r * r == n`.",
      "**Số hoàn hảo (tổng các ước thực sự bằng chính nó, ví dụ `6 = 1+2+3`, `28`):** Duyệt `i` từ `2` tới `i * i <= n`; nếu `n % i == 0` cộng `i` và nếu `i != n / i` thì cộng thêm `n / i` (chú ý khởi tạo `sum = 1` và loại `n <= 1`).",
      "**Số Armstrong (ví dụ `153 = 1³ + 5³ + 3³`):** Đếm số chữ số `k`, sau đó cộng từng lũy thừa nguyên `d^k` bằng vòng lặp (tránh `pow()` số thực bị lệch 1 đơn vị!).",
    ],
    exampleLang: "cpp",
    exampleCode: `#include <bits/stdc++.h>
using namespace std;

bool isPerfectSquare(long long n) {
    if (n < 0) return false;
    long long r = llround(sqrt((long double)n));
    return r * r == n;
}

bool isPerfectNumber(long long n) {
    if (n <= 1) return false;
    long long sum = 1;
    for (long long i = 2; i * i <= n; i++) {
        if (n % i == 0) {
            sum += i;
            if (i != n / i) sum += n / i;
        }
    }
    return sum == n;
}

int main() {
    cout << "36 chinh phuong? " << isPerfectSquare(36) << "\\n";
    cout << "28 hoan hao? " << isPerfectNumber(28) << "\\n";
    return 0;
}`,
    mistakes: [
      "**Cộng trùng ước khi `n` là số chính phương:** Với `n = 36, i = 6`, nếu không kiểm tra `if (i != n / i)` bạn sẽ cộng số `6` hai lần!",
      "**Dùng `pow(d, k)` cho số nguyên:** `pow` trả về `double`, đôi khi `pow(5, 3)` cho `124.999999` ép sang `int` thành `124`! Hãy viết hàm nhân nguyên nhỏ.",
    ],
    practice: {
      prompt: "Viết chương trình đếm xem có bao nhiêu số chính phương trong đoạn `[L, R]` với `1 <= L <= R <= 10¹²` trong `O(1)`.",
      hint: "Số lượng số chính phương `<= X` là `floor(sqrt(X))` → đáp án trên `[L, R]` là `cnt(R) - cnt(L - 1)`!",
    },
  },
  {
    id: "quadratic-equation",
    title: "Giải phương trình bậc 1 & bậc 2 (ax² + bx + c = 0)",
    category: "Thuật toán",
    language: "cpp",
    specificityBoost: 22,
    primaryTerms: [
      "phuong trinh bac 2",
      "phuong trinh bac hai",
      "phuong trinh bac 1",
      "giai phuong trinh",
      "delta",
      "nghiem kep",
    ],
    secondaryTerms: ["ax^2", "vo nghiem", "vo so nghiem"],
    summary:
      "Giải phương trình bậc 2 `ax² + bx + c = 0` cần xét đầy đủ cả trường hợp suy biến **`a == 0`** (trở thành phương trình bậc 1) trước khi tính `Δ = b² - 4ac`.",
    keyPoints: [
      "**Trường hợp `a == 0`:** Nếu `b == 0` và `c == 0` → vô số nghiệm; nếu `b == 0` và `c != 0` → vô nghiệm; nếu `b != 0` → 1 nghiệm `x = -c / b`.",
      "**Trường hợp `a != 0`:** Tính `delta = b * b - 4 * a * c`.",
      "`delta < 0`: vô nghiệm thực; `delta == 0`: nghiệm kép `x = -b / (2 * a)`; `delta > 0`: 2 nghiệm phân biệt `(-b ± sqrt(delta)) / (2 * a)`.",
    ],
    exampleLang: "cpp",
    exampleCode: `#include <bits/stdc++.h>
using namespace std;

int main() {
    double a, b, c;
    if (!(cin >> a >> b >> c)) return 0;
    cout << fixed << setprecision(2);
    if (a == 0) {
        if (b == 0) cout << (c == 0 ? "Vo so nghiem\\n" : "Vo nghiem\\n");
        else cout << "x = " << -c / b << "\\n";
    } else {
        double d = b * b - 4 * a * c;
        if (d < 0) cout << "Vo nghiem\\n";
        else if (d == 0) cout << "Nghiem kep x = " << -b / (2 * a) << "\\n";
        else cout << "x1 = " << (-b - sqrt(d)) / (2 * a)
                  << ", x2 = " << (-b + sqrt(d)) / (2 * a) << "\\n";
    }
    return 0;
}`,
    mistakes: [
      "Quên xét `a == 0` dẫn tới chia cho `0` (`-b / (2 * a)` cho `nan` hoặc `inf`)!",
      "Viết `-b + sqrt(d) / 2 * a` thiếu cặp ngoặc `(...) / (2 * a)` làm sai thứ tự phép toán.",
    ],
    practice: {
      prompt: "Chạy thử code trên trong **Sandbox** với 4 bộ test: `(0, 0, 0)`, `(0, 2, -6)`, `(1, -2, 1)`, `(1, -5, 6)`.",
      hint: "Kiểm tra kết quả với `(1, -5, 6)` phải ra đúng `2.00` và `3.00`.",
    },
  },
  {
    id: "triangle-geometry",
    title: "Kiểm tra loại Tam giác & Tính diện tích (Heron)",
    category: "Thuật toán",
    language: "cpp",
    specificityBoost: 22,
    primaryTerms: [
      "tam giac",
      "kiem tra tam giac",
      "loai tam giac",
      "tam giac vuong",
      "tam giac can",
      "tam giac deu",
      "heron",
      "dien tich tam giac",
    ],
    secondaryTerms: ["chu vi", "pythagore"],
    negativePatterns: [/tam\s+giac\s+sao/, /tam\s+giac\s+pascal/],
    summary:
      "Ba cạnh `a, b, c` tạo thành tam giác hợp lệ khi và chỉ khi cả ba đều **dương** và tổng hai cạnh bất kỳ **lớn hơn hẳn** cạnh còn lại.",
    keyPoints: [
      "**Điều kiện hợp lệ:** `a > 0 && b > 0 && c > 0 && a + b > c && a + c > b && b + c > a`.",
      "**Phân loại ưu tiên từ hẹp đến rộng:** (1) Đều (`a == b && b == c`), (2) Vuông cân, (3) Vuông (`a*a + b*b == c*c` sau khi sắp xếp `a <= b <= c`), (4) Cân (`a == b || b == c || a == c`), (5) Thường.",
      "**Diện tích Heron:** nửa chu vi `p = (a + b + c) / 2.0`, `S = sqrt(p * (p - a) * (p - b) * (p - c))`.",
    ],
    exampleLang: "cpp",
    exampleCode: `#include <bits/stdc++.h>
using namespace std;

int main() {
    long long a, b, c;
    if (!(cin >> a >> b >> c)) return 0;
    vector<long long> s = {a, b, c};
    sort(s.begin(), s.end());
    if (s[0] <= 0 || s[0] + s[1] <= s[2]) {
        cout << "Khong phai tam giac\\n";
    } else if (s[0] == s[2]) {
        cout << "Tam giac deu\\n";
    } else if (s[0] * s[0] + s[1] * s[1] == s[2] * s[2]) {
        cout << "Tam giac vuong\\n";
    } else if (s[0] == s[1] || s[1] == s[2]) {
        cout << "Tam giac can\\n";
    } else {
        cout << "Tam giac thuong\\n";
    }
    return 0;
}`,
    mistakes: [
      "Kiểm tra `Tam giac can` trước `Tam giac deu` làm tam giác đều `(5, 5, 5)` bị phân loại nhầm thành tam giác cân!",
      "Dùng `int` khi tính `a * a + b * b` khiến số lớn bị tràn — hãy dùng `long long`.",
    ],
    practice: {
      prompt: "Mở bài **CL-003 (Kiểm tra loại tam giác)** trong mục **Luyện tập Code** để tự nộp bài và kiểm tra toàn bộ 5 test cases!",
      hint: "Sắp xếp 3 cạnh tăng dần trước giúp điều kiện tam giác chỉ còn đúng 1 dòng `s[0] + s[1] > s[2]`!",
    },
  },
  {
    id: "digit-manipulation",
    title: "Tách chữ số, Đếm chữ số & Tính tổng chữ số của số nguyên N",
    category: "Thuật toán",
    language: "cpp",
    specificityBoost: 22,
    primaryTerms: [
      "tach chu so",
      "dem chu so",
      "tong chu so",
      "tong cac chu so",
      "chu so lon nhat",
      "chu so chan",
      "tich chu so",
    ],
    secondaryTerms: ["chu so", "n % 10", "n /= 10"],
    summary:
      "Mọi bài toán xử lý từng chữ số của số nguyên `N` đều dựa trên cặp phép toán: **`n % 10`** (lấy chữ số hàng đơn vị) và **`n /= 10`** (bỏ chữ số hàng đơn vị).",
    keyPoints: [
      "**Xử lý trường hợp biên `n == 0`:** Số `0` có **1 chữ số** (chữ số `0`), tổng chữ số bằng `0` — dùng `do { ... } while (n > 0);` giúp xử lý `n = 0` tự động!",
      "**Số cực lớn (> `10¹⁸`):** Đọc `N` dưới dạng `string s` rồi duyệt `for (char c : s) { int d = c - '0'; ... }` — không bao giờ bị tràn số!",
    ],
    exampleLang: "cpp",
    exampleCode: `#include <bits/stdc++.h>
using namespace std;

int main() {
    long long n;
    if (!(cin >> n)) return 0;
    n = abs(n);
    int countDigits = 0, sumDigits = 0, maxDigit = 0;
    do {
        int d = n % 10;
        countDigits++;
        sumDigits += d;
        maxDigit = max(maxDigit, d);
        n /= 10;
    } while (n > 0);
    cout << "So chu so: " << countDigits << ", Tong: " << sumDigits << ", Max: " << maxDigit << "\\n";
    return 0;
}`,
    mistakes: [
      "Dùng `while (n > 0)` khi đếm chữ số nên nhập `0` lại in ra `0 chữ số` thay vì `1`!",
      "Quên `n = abs(n)` khi input có thể là số âm.",
    ],
    practice: {
      prompt: "Đếm xem trong số nguyên `N` (`0 <= N <= 10¹⁸`) có bao nhiêu chữ số là số nguyên tố (`2, 3, 5, 7`).",
      hint: "Trong vòng lặp tách chữ số, kiểm tra `if (d == 2 || d == 3 || d == 5 || d == 7) cnt++;`.",
    },
  },
  {
    id: "pattern-loops",
    title: "Vẽ hình bằng vòng lặp lồng nhau (Tam giác sao *, Bảng cửu chương)",
    category: "C++ Cơ bản",
    language: "cpp",
    specificityBoost: 22,
    primaryTerms: [
      "tam giac sao",
      "in hinh sao",
      "ve hinh",
      "hinh chu nhat",
      "kim tu thap",
      "bang cuu chuong",
      "vong lap long nhau",
    ],
    secondaryTerms: ["in dau sao", "dau *"],
    summary:
      "Các bài in hình học (tam giác vuông, tam giác cân, hình chữ nhật rỗng, bảng cửu chương) dùng **vòng lặp ngoài duyệt từng hàng `i`** và **vòng lặp trong in các ký tự trên hàng `i`**.",
    keyPoints: [
      "**Quy tắc tìm công thức cho hàng `i` (từ `1` đến `n`):** Liệt kê bảng `(hàng i -> số dấu cách -> số dấu *)` với `n = 4` trước khi gõ code!",
      "Với **tam giác cân cao `n`:** hàng `i` có `(n - i)` khoảng trắng đứng trước và `(2 * i - 1)` dấu `*`.",
      "Nhớ in `cout << \"\\n\";` ở cuối mỗi hàng `i`.",
    ],
    exampleLang: "cpp",
    exampleCode: `#include <bits/stdc++.h>
using namespace std;

int main() {
    int n = 5;
    for (int i = 1; i <= n; i++) {
        for (int sp = 1; sp <= n - i; sp++) cout << ' ';
        for (int st = 1; st <= 2 * i - 1; st++) cout << '*';
        cout << "\\n";
    }
    return 0;
}`,
    mistakes: [
      "Quên in `\"\\n\"` sau vòng lặp trong khiến tất cả dấu `*` dính liền trên 1 dòng.",
    ],
    practice: {
      prompt: "Viết chương trình in hình chữ nhật rỗng kích thước `R × C` (chỉ in `*` ở viền, bên trong in dấu cách).",
      hint: "Tại ô `(i, j)`: in `'*'` nếu `i == 1 || i == R || j == 1 || j == C`, ngược lại in `' '`.",
    },
  },
  {
    id: "time-calendar",
    title: "Quy đổi Giây → HH:MM:SS, Năm nhuận & Số ngày trong tháng",
    category: "C++ Cơ bản",
    language: "cpp",
    specificityBoost: 22,
    primaryTerms: [
      "doi giay",
      "quy doi giay",
      "gio phut giay",
      "hh:mm:ss",
      "nam nhuan",
      "so ngay trong thang",
    ],
    secondaryTerms: ["3600", "thang 2"],
    summary:
      "Các bài xử lý thời gian và lịch giúp luyện phép chia nguyên `/`, chia lấy dư `%` và nhánh điều kiện `if/else`.",
    keyPoints: [
      "**Đổi `S` giây sang `h m s`:** `h = S / 3600; m = (S % 3600) / 60; s = S % 60;`.",
      "**Kiểm tra năm nhuận:** `(y % 400 == 0) || (y % 4 == 0 && y % 100 != 0)` (năm `2000` nhuận, năm `1900` KHÔNG nhuận!).",
      "**Số ngày trong tháng:** Tháng 1,3,5,7,8,10,12 có 31 ngày; 4,6,9,11 có 30 ngày; tháng 2 có 29 ngày nếu năm nhuận, ngược lại 28 ngày.",
    ],
    exampleLang: "cpp",
    exampleCode: `#include <bits/stdc++.h>
using namespace std;

int main() {
    long long S = 3665;
    long long h = S / 3600;
    long long m = (S % 3600) / 60;
    long long s = S % 60;
    cout << h << " " << m << " " << s << "\\n"; // 1 1 5
    return 0;
}`,
    mistakes: [
      "Tính `m = S / 60` thay vì `(S % 3600) / 60` làm số phút vượt quá `59`!",
      "Chỉ kiểm tra `y % 4 == 0` mà quên loại trừ năm tròn thế kỷ như `1900`, `2100`.",
    ],
    practice: {
      prompt: "Mở bài **CL-002 (Quy đổi thời gian sang HH:MM:SS)** trong mục **Luyện tập Code** để nộp thử và nhận XP!",
      hint: "Dùng `long long` để xử lý cả những giá trị `S` rất lớn.",
    },
  },
  {
    id: "array-operations",
    title: "Thao tác Mảng/Vector: Chèn, Xóa, Đảo ngược & Trộn 2 mảng",
    category: "Thuật toán",
    language: "cpp",
    specificityBoost: 22,
    primaryTerms: [
      "chen phan tu",
      "xoa phan tu",
      "dao nguoc mang",
      "tron 2 mang",
      "tron hai mang",
      "tim kiem tuyen tinh",
      "linear search",
      "lon thu hai",
    ],
    secondaryTerms: ["insert", "erase", "reverse"],
    summary:
      "Các thao tác chỉnh sửa mảng phổ biến (chèn/xóa tại vị trí `pos`, đảo ngược mảng, trộn 2 mảng đã sắp xếp) đều có cách viết cực sạch với `vector` và STL.",
    keyPoints: [
      "**Chèn tại vị trí `pos`:** `a.insert(a.begin() + pos, val);` (độ phức tạp `O(N)` do dịch các phần tử phía sau).",
      "**Xóa tại vị trí `pos`:** `a.erase(a.begin() + pos);` (`O(N)`).",
      "**Đảo ngược mảng:** `reverse(a.begin(), a.end());` (hoặc tự hoán đổi `swap(a[l++], a[r--])`).",
      "**Trộn 2 mảng đã sắp xếp trong `O(N + M)`:** Dùng 2 chỉ số `i, j`, mỗi bước chọn phần tử nhỏ hơn giữa `a[i]` và `b[j]`.",
    ],
    exampleLang: "cpp",
    exampleCode: `#include <bits/stdc++.h>
using namespace std;

int main() {
    vector<int> a = {10, 20, 30, 40};
    a.insert(a.begin() + 2, 25); // {10, 20, 25, 30, 40}
    a.erase(a.begin() + 1);      // {10, 25, 30, 40}
    reverse(a.begin(), a.end()); // {40, 30, 25, 10}
    for (int x : a) cout << x << " ";
    return 0;
}`,
    mistakes: [
      "Xóa phần tử trong vòng lặp tăng `i++` khiến phần tử kế tiếp bị bỏ sót! Khi xóa, giữ nguyên `i` hoặc duyệt ngược từ cuối về đầu.",
    ],
    practice: {
      prompt: "Viết hàm trộn 2 `vector<int>` đã sắp xếp tăng dần thành 1 `vector` mới cũng tăng dần mà KHÔNG gọi `sort()`.",
      hint: "Dùng `while (i < a.size() && j < b.size())` đẩy số nhỏ hơn vào kết quả, sau đó đẩy nốt phần dư của mảng còn lại.",
    },
  },
  {
    id: "string-normalize-anagram",
    title: "Chuẩn hóa chuỗi / họ tên, Đếm từ & Kiểm tra Hoán vị (Anagram)",
    category: "Thuật toán",
    language: "cpp",
    specificityBoost: 22,
    primaryTerms: [
      "chuan hoa ho ten",
      "chuan hoa chuoi",
      "dem tu",
      "dem nguyen am",
      "anagram",
      "hoan vi chuoi",
      "dao nguoc chuoi",
      "chuyen chu hoa",
      "chuyen chu thuong",
    ],
    secondaryTerms: ["stringstream", "toupper", "tolower"],
    summary:
      "Kết hợp `stringstream` (tự loại bỏ mọi khoảng trắng thừa) cùng `tolower`/`toupper` giải quyết gọn gàng hầu hết các bài chuẩn hóa văn bản và xử lý chuỗi trong C++.",
    keyPoints: [
      "**Chuẩn hóa họ tên:** Đọc cả dòng bằng `getline(cin, s)`, tách từng từ bằng `stringstream ss(s)`, viết hoa chữ cái đầu `toupper(w[0])` và viết thường các chữ còn lại.",
      "**Kiểm tra Hoán vị (Anagram) của 2 chuỗi:** Hai chuỗi là hoán vị của nhau khi có cùng độ dài và cùng tần suất từng ký tự (dùng mảng đếm `int cnt[256] = {}` `O(N)` hoặc `sort` cả hai chuỗi `O(N log N)`).",
    ],
    exampleLang: "cpp",
    exampleCode: `#include <bits/stdc++.h>
using namespace std;

string normalizeName(const string &raw) {
    stringstream ss(raw);
    string w, res;
    while (ss >> w) {
        for (char &c : w) c = char(tolower((unsigned char)c));
        w[0] = char(toupper((unsigned char)w[0]));
        if (!res.empty()) res += ' ';
        res += w;
    }
    return res;
}

int main() {
    cout << normalizeName("   nGuYeN   mInH   kHoI  ") << "\\n"; // Nguyen Minh Khoi
    return 0;
}`,
    mistakes: [
      "Truyền trực tiếp `char` (có thể âm với ký tự mở rộng) vào `tolower(c)` mà không ép `(unsigned char)c`.",
    ],
    practice: {
      prompt: "Mở bài **CL-006 (Kiểm tra hai chuỗi Hoán vị — Anagram)** trong mục **Luyện tập Code** để luyện tập và nhận XP!",
      hint: "Dùng mảng đếm tần suất 26 chữ cái: cộng `+1` với chuỗi 1, trừ `-1` với chuỗi 2, rồi kiểm tra tất cả đều bằng `0`.",
    },
  },
  {
    id: "backtracking-generate",
    title: "Quay lui (Backtracking): Sinh xâu nhị phân, Hoán vị & Tổ hợp",
    category: "Thuật toán",
    language: "cpp",
    specificityBoost: 24,
    primaryTerms: [
      "sinh nhi phan",
      "xau nhi phan",
      "sinh hoan vi",
      "quay lui",
      "backtracking",
      "n-queens",
      "n quan hau",
      "sinh to hop",
    ],
    secondaryTerms: ["next_permutation", "thu tat ca"],
    summary:
      "**Quay lui (Backtracking)** thử lần lượt từng lựa chọn khả dĩ ở vị trí `i`, gọi đệ quy sang vị trí `i + 1`, rồi **hoàn trả trạng thái (unmark)** để thử nhánh khác.",
    keyPoints: [
      "**Khung chung của mọi hàm Quay lui:** (1) Nếu `i == n` → in/ghi nhận nghiệm rồi `return`; (2) Duyệt mọi ứng viên `v` hợp lệ → đánh dấu chọn `v` → gọi `Try(i + 1)` → bỏ đánh dấu `v`.",
      "**Mẹo sinh hoán vị nhanh trong C++ STL:** Sắp xếp mảng tăng dần rồi lặp `do { ... } while (next_permutation(a.begin(), a.end()));`!",
    ],
    exampleLang: "cpp",
    exampleCode: `#include <bits/stdc++.h>
using namespace std;

int n = 3;
string cur;

void genBinary(int i) {
    if (i == n) { cout << cur << "\\n"; return; }
    for (char bit : {'0', '1'}) {
        cur.push_back(bit);
        genBinary(i + 1);
        cur.pop_back(); // quay lui
    }
}

int main() {
    genBinary(0); // in 8 xau nhi phan do dai 3
    return 0;
}`,
    mistakes: [
      "Quên bước **hoàn trả trạng thái** (`used[v] = false;` hoặc `cur.pop_back();`) sau lời gọi đệ quy khiến các nhánh sau bị mất dữ liệu!",
    ],
    practice: {
      prompt: "Sửa hàm `genBinary` trên để chỉ in các xâu nhị phân độ dài `N` **không có hai số `1` đứng cạnh nhau**.",
      hint: "Trước khi đẩy `'1'`, kiểm tra `if (cur.empty() || cur.back() != '1')`!",
    },
  },
  {
    id: "bigint-string",
    title: "Cộng / Trừ / Nhân số nguyên cực lớn (BigInt bằng string)",
    category: "Thuật toán",
    language: "cpp",
    specificityBoost: 24,
    primaryTerms: [
      "so cuc lon",
      "so nguyen cuc lon",
      "bigint",
      "big int",
      "cong hai chuoi so",
      "cong so lon",
      "nhan so lon",
      "1000 chu so",
    ],
    secondaryTerms: ["nho carry", "chuoi so"],
    summary:
      "Khi số nguyên có hàng trăm hoặc hàng nghìn chữ số (vượt xa `long long` 19 chữ số), ta lưu số dưới dạng **`string`** và cộng/nhân từng chữ số từ phải sang trái giống phép tính đặt dọc ở tiểu học!",
    keyPoints: [
      "**Cộng hai số lớn không âm:** Duyệt ngược từ cuối `a` và `b`, cộng `sum = da + db + carry`, lấy `sum % 10` ghép vào kết quả, cập nhật `carry = sum / 10`.",
      "Đừng quên kiểm tra `while (carry > 0)` sau khi duyệt hết cả hai chuỗi, rồi `reverse` chuỗi kết quả!",
    ],
    exampleLang: "cpp",
    exampleCode: `#include <bits/stdc++.h>
using namespace std;

string addBigInt(const string &a, const string &b) {
    int i = (int)a.size() - 1, j = (int)b.size() - 1, carry = 0;
    string res;
    while (i >= 0 || j >= 0 || carry > 0) {
        int s = carry;
        if (i >= 0) s += a[i--] - '0';
        if (j >= 0) s += b[j--] - '0';
        res.push_back(char('0' + (s % 10)));
        carry = s / 10;
    }
    reverse(res.begin(), res.end());
    return res;
}

int main() {
    cout << addBigInt("999999999999999999999", "1") << "\\n";
    return 0;
}`,
    mistakes: [
      "Quên cộng `carry` dư cuối cùng (ví dụ `\"999\" + \"1\"` ra `\"000\"` thay vì `\"1000\"`).",
    ],
    practice: {
      prompt: "Mở rộng chương trình để tính số Fibonacci thứ `200` bằng hàm `addBigInt` trên!",
      hint: "Dùng hai chuỗi `f0 = \"0\", f1 = \"1\"` rồi lặp `200` lần `f2 = addBigInt(f0, f1)`.",
    },
  },
  {
    id: "series-combinatorics",
    title: "Tính tổng dãy số (1+2+...+n, 1/i) & Tổ hợp C(n, k)",
    category: "Thuật toán",
    language: "cpp",
    specificityBoost: 20,
    primaryTerms: [
      "tong tu 1 den n",
      "tong day so",
      "to hop",
      "nck",
      "tam giac pascal",
      "cap so cong",
    ],
    secondaryTerms: ["c(n, k)", "1/n", "cong thuc gauss"],
    summary:
      "Nhiều bài tính tổng dãy số có công thức `O(1)` siêu nhanh giúp tránh TLE khi `N = 10⁹`, đồng thời cần đặc biệt cẩn thận chia nguyên khi tính tổng phân số!",
    keyPoints: [
      "**Tổng `1 + 2 + ... + n`:** Công thức Gauss `n * (n + 1) / 2` (dùng `long long`, nếu `n` chẵn chia 2 trước để giảm nguy cơ tràn số!).",
      "**Tổng phân số `1 + 1/2 + ... + 1/n`:** Phải viết **`1.0 / i`** (KHÔNG viết `1 / i` vì chia nguyên cho `0` với mọi `i >= 2`!).",
      "**Tổ hợp `C(n, k)`:** Hoặc dùng Tam giác Pascal `C[i][j] = C[i-1][j-1] + C[i-1][j]` (`O(N²)`), hoặc nhân chia xen kẽ `res = res * (n - i + 1) / i` (`O(k)`).",
    ],
    exampleLang: "cpp",
    exampleCode: `#include <bits/stdc++.h>
using namespace std;

long long nCk(int n, int k) {
    if (k < 0 || k > n) return 0;
    k = min(k, n - k);
    long long res = 1;
    for (int i = 1; i <= k; i++) {
        res = res * (n - k + i) / i;
    }
    return res;
}

int main() {
    long long n = 100000;
    cout << "Tong 1..n = " << n * (n + 1) / 2 << "\\n";
    cout << "C(10, 3) = " << nCk(10, 3) << "\\n"; // 120
    return 0;
}`,
    mistakes: [
      "Viết `double s = 0; s += 1 / i;` — vì `1` và `i` đều là `int`, `1 / 2 == 0`! Phải là `1.0 / i`.",
    ],
    practice: {
      prompt: "Tính tổng `S = 1/1 + 1/2 + ... + 1/N` làm tròn 4 chữ số thập phân.",
      hint: "Dùng `double s = 0; for (int i = 1; i <= n; i++) s += 1.0 / i;` và `fixed << setprecision(4)`.",
    },
  },
  {
    id: "linked-list-tree",
    title: "Danh sách liên kết (Linked List) & Cây nhị phân (Binary Tree / BST)",
    category: "Thuật toán",
    language: "cpp",
    specificityBoost: 24,
    primaryTerms: [
      "danh sach lien ket",
      "linked list",
      "cay nhi phan",
      "binary tree",
      "bst",
      "duyet cay",
      "preorder",
      "inorder",
      "postorder",
    ],
    secondaryTerms: ["node", "head", "root", "left right"],
    summary:
      "**Danh sách liên kết** nối các `Node` bằng con trỏ `next` (chèn/xóa đầu `O(1)`). **Cây nhị phân** gồm mỗi `Node` có con trái `left` và con phải `right` — đặc biệt duyệt **Inorder (Trái → Gốc → Phải)** trên BST luôn cho dãy tăng dần!",
    keyPoints: [
      "**Cấu trúc Node Linked List:** `struct Node { int val; Node *next; };`.",
      "**3 cách duyệt cây nhị phân (`O(N)`):** Preorder (`Gốc → Trái → Phải`), Inorder (`Trái → Gốc → Phải`), Postorder (`Trái → Phải → Gốc`).",
      "**Tính chiều cao cây bằng đệ quy:** `height(u) = u ? 1 + max(height(u->left), height(u->right)) : 0;`.",
    ],
    exampleLang: "cpp",
    exampleCode: `#include <bits/stdc++.h>
using namespace std;

struct Node {
    int val;
    Node *left = nullptr, *right = nullptr;
    Node(int v) : val(v) {}
};

void inorder(Node *u) {
    if (!u) return;
    inorder(u->left);
    cout << u->val << " ";
    inorder(u->right);
}

int main() {
    Node *root = new Node(10);
    root->left = new Node(5);
    root->right = new Node(15);
    inorder(root); // 5 10 15
    return 0;
}`,
    mistakes: [
      "Quên kiểm tra `if (!u) return;` trước khi truy cập `u->left` / `u->val` dẫn tới crash (null pointer dereference).",
    ],
    practice: {
      prompt: "Viết thêm hàm `int sumTree(Node *u)` tính tổng tất cả giá trị các nút trong cây nhị phân trên.",
      hint: "Nếu `!u` trả về `0`; ngược lại trả về `u->val + sumTree(u->left) + sumTree(u->right)`.",
    },
  },
  {
    id: "file-io-cpp",
    title: "Đọc & Ghi tệp (File I/O) trong C++ (freopen, ifstream, ofstream)",
    category: "C++ Cơ bản",
    language: "cpp",
    specificityBoost: 22,
    primaryTerms: [
      "doc file",
      "ghi file",
      "doc ghi file",
      "freopen",
      "ifstream",
      "ofstream",
      "fstream",
      "tep tin",
    ],
    secondaryTerms: ["input.inp", "output.out"],
    summary:
      "Trong các kỳ thi HSG C++, bạn thường cần đọc từ file `.INP` và ghi ra `.OUT`. Cách gọn nhất là dùng **`freopen`** (giữ nguyên mọi lệnh `cin`/`cout`!) hoặc dùng luồng **`ifstream`/`ofstream`**.",
    keyPoints: [
      "**Cách thi HSG siêu gọn (`freopen`):** `freopen(\"BAI1.INP\", \"r\", stdin); freopen(\"BAI1.OUT\", \"w\", stdout);` đặt ngay đầu `main()`.",
      "**Cách dùng `ifstream` / `ofstream`:** `ifstream fin(\"in.txt\"); ofstream fout(\"out.txt\");` rồi dùng `fin >> x; fout << x;`.",
      "**Lưu ý trên CODELAB Sandbox:** Trình chấm online đọc trực tiếp từ `stdin`/`stdout`, nên khi chạy trên web bạn **không** cần gọi `freopen`.",
    ],
    exampleLang: "cpp",
    exampleCode: `#include <bits/stdc++.h>
using namespace std;

int main() {
    // Khi thi HSG tren may co file BAI1.INP / BAI1.OUT:
    // freopen("BAI1.INP", "r", stdin);
    // freopen("BAI1.OUT", "w", stdout);
    long long a, b;
    if (cin >> a >> b) cout << a + b << "\\n";
    return 0;
}`,
    mistakes: [
      "Quên bỏ/comment `freopen` khi nộp lên hệ thống chấm bài dùng `stdin`/`stdout` chuẩn.",
    ],
    practice: {
      prompt: "Thử đọc nhiều dòng từ `cin` đến hết file (EOF) bằng vòng lặp `while (cin >> x)` trong Sandbox.",
      hint: "Vòng lặp `while (cin >> x)` tự động dừng sạch sẽ khi hết dữ liệu trong khung Input (stdin).",
    },
  },
  {
    id: "bitwise-ops",
    title: "Phép toán thao tác Bit (Bitwise & bitset) trong C++",
    category: "Thuật toán",
    language: "cpp",
    specificityBoost: 22,
    primaryTerms: [
      "bitwise",
      "thao tac bit",
      "phep toan bit",
      "xor",
      "dich bit",
      "bitset",
      "luy thua cua 2",
      "dem bit 1",
    ],
    secondaryTerms: ["bitmask", "1 << k", "popcount"],
    summary:
      "Các phép toán bit (`&` AND, `|` OR, `^` XOR, `<<` dịch trái, `>>` dịch phải) chạy ở tốc độ phần cứng CPU `O(1)` và cực hữu ích cho tối ưu tốc độ, kiểm tra chẵn/lẻ và quy hoạch động trạng thái (Bitmask DP).",
    keyPoints: [
      "**Kiểm tra bit thứ `k` của `n`:** `(n >> k) & 1`.",
      "**Bật bit thứ `k`:** `n | (1LL << k)`; **Tắt bit `k`:** `n & ~(1LL << k)`; **Đảo bit `k`:** `n ^ (1LL << k)`.",
      "**Kiểm tra lũy thừa của 2 (`n > 0`):** `(n & (n - 1)) == 0`!",
      "**Đếm số bit 1:** `__builtin_popcountll(n)` hoặc `bitset<64>(n).count()`.",
    ],
    exampleLang: "cpp",
    exampleCode: `#include <bits/stdc++.h>
using namespace std;

int main() {
    long long n = 42;
    cout << "Dang nhi phan 8-bit: " << bitset<8>(n) << "\\n";
    cout << "So bit 1: " << bitset<64>(n).count() << "\\n";
    cout << "16 la luy thua cua 2? " << ((16 & 15) == 0 ? "Co" : "Khong") << "\\n";
    return 0;
}`,
    mistakes: [
      "**Tràn số với `1 << k` khi `k >= 31`:** Số `1` mặc định là `int` 32-bit! Luôn viết **`1LL << k`** khi dịch quá 30 bit.",
      "**Quên ngoặc quanh phép toán bit:** Độ ưu tiên của `&`, `|`, `^` THẤP HƠN `==`! Luôn viết `(n & 1) == 0`, KHÔNG viết `n & 1 == 0`!",
    ],
    practice: {
      prompt: "Cho mảng trong đó mọi số đều xuất hiện đúng 2 lần, chỉ duy nhất 1 số xuất hiện 1 lần. Tìm số đó trong `O(N)` thời gian và `O(1)` bộ nhớ!",
      hint: "Tính XOR của tất cả phần tử (`ans ^= x`): vì `a ^ a == 0` và `0 ^ b == b`, các cặp trùng tự triệt tiêu hết!",
    },
  },
];
