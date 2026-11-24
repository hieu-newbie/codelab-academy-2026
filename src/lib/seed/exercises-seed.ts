import type { ChallengeDifficulty, CourseLanguage } from "@/types/codelab";

export interface SeedExercise {
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
  test_cases: Array<{
    input_data: string;
    expected_output: string;
    is_sample: boolean;
  }>;
}

export const SEED_EXERCISES: SeedExercise[] = [
  {
    id: "ex-001",
    code: "CL-001",
    slug: "tong-hai-so-nguyen-lon",
    title: "Tổng hai số nguyên lớn",
    description:
      "Cho hai số nguyên `a` và `b`. Hãy tính và in ra tổng `a + b`. Chú ý phạm vi giới hạn để không bị tràn số kiểu `int`.",
    category: "Nhập xuất dữ liệu",
    difficulty: "Easy",
    language: "cpp",
    input_format: "Một dòng duy nhất chứa hai số nguyên `a` và `b` cách nhau bởi một dấu cách.",
    output_format: "In ra một số nguyên duy nhất là giá trị `a + b`.",
    constraints: "-9×10^18 <= a, b, a + b <= 9×10^18 (nằm trong miền long long 64-bit)",
    sample_input: "1500000000 2700000000",
    sample_output: "4200000000",
    sample_explanation: "1500000000 + 2700000000 = 4200000000 (vượt giới hạn int nên bắt buộc dùng long long).",
    starter_code: `#include <iostream>
using namespace std;

int main() {
    // Đọc a, b và in ra a + b
    return 0;
}`,
    hints: [
      "Giới hạn tới ~9×10^18 vượt xa giới hạn ~2.14×10^9 của kiểu int.",
      "Hãy khai báo `long long a, b;` rồi `cin >> a >> b; cout << a + b;`."
    ],
    solution_code: `#include <iostream>
using namespace std;

int main() {
    long long a, b;
    if (cin >> a >> b) {
        cout << a + b << "\\n";
    }
    return 0;
}`,
    solution_explanation: "Sử dụng kiểu dữ liệu `long long` (64-bit, phạm vi [-9223372036854775808, 9223372036854775807]) đảm bảo xử lý chính xác cả số âm, số 0 và giá trị sát giới hạn 64-bit.",
    time_limit_ms: 1000,
    memory_limit_kb: 262144,
    xp_reward: 50,
    test_cases: [
      { input_data: "1500000000 2700000000", expected_output: "4200000000", is_sample: true },
      { input_data: "10 25", expected_output: "35", is_sample: false },
      { input_data: "0 0", expected_output: "0", is_sample: false },
      { input_data: "-1000000000000 500000000000", expected_output: "-500000000000", is_sample: false },
      { input_data: "-4000000000000000000 -5000000000000000000", expected_output: "-9000000000000000000", is_sample: false },
      { input_data: "9000000000000000000 223372036854775807", expected_output: "9223372036854775807", is_sample: false },
      { input_data: "9223372036854775807 -9223372036854775807", expected_output: "0", is_sample: false }
    ]
  },
  {
    id: "ex-002",
    code: "CL-002",
    slug: "quy-doi-giay-sang-gio-phut-giay",
    title: "Quy đổi thời gian sang HH:MM:SS",
    description:
      "Cho một số nguyên không âm `S` là tổng số giây. Hãy quy đổi `S` thành số giờ, số phút và số giây tương ứng, in ra theo định dạng `gio phut giay`.",
    category: "Biến và kiểu dữ liệu",
    difficulty: "Easy",
    language: "cpp",
    input_format: "Một số nguyên không âm `S`.",
    output_format: "Ba số nguyên `h m s` cách nhau bởi một dấu cách.",
    constraints: "0 <= S <= 10^9",
    sample_input: "3665",
    sample_output: "1 1 5",
    sample_explanation: "3665 giây = 1 giờ (3600s) + 1 phút (60s) + 5 giây.",
    starter_code: `#include <iostream>
using namespace std;

int main() {
    long long totalSeconds;
    cin >> totalSeconds;
    // Tính giờ, phút, giây và in ra
    return 0;
}`,
    hints: [
      "1 giờ = 3600 giây, 1 phút = 60 giây.",
      "gio = S / 3600; phut = (S % 3600) / 60; giay = S % 60;"
    ],
    solution_code: `#include <iostream>
using namespace std;

int main() {
    long long s;
    cin >> s;
    long long h = s / 3600;
    long long m = (s % 3600) / 60;
    long long sec = s % 60;
    cout << h << " " << m << " " << sec << "\\n";
    return 0;
}`,
    solution_explanation: "Dùng phép chia nguyên `/` và chia lấy dư `%` lần lượt tách phần giờ, phần phút còn lại và phần giây lẻ.",
    time_limit_ms: 1000,
    memory_limit_kb: 262144,
    xp_reward: 50,
    test_cases: [
      { input_data: "3665", expected_output: "1 1 5", is_sample: true },
      { input_data: "0", expected_output: "0 0 0", is_sample: false },
      { input_data: "86399", expected_output: "23 59 59", is_sample: false },
      { input_data: "7200", expected_output: "2 0 0", is_sample: false }
    ]
  },
  {
    id: "ex-003",
    code: "CL-003",
    slug: "kiem-tra-tam-giac-hop-le",
    title: "Kiểm tra loại tam giác",
    description:
      "Cho độ dài 3 cạnh nguyên dương `a, b, c`. Hãy kiểm tra xem 3 cạnh này có lập thành một tam giác hợp lệ không. Nếu không, in `INVALID`. Nếu hợp lệ:\n- In `EQUILATERAL` nếu là tam giác đều.\n- In `ISOSCELES` nếu là tam giác cân.\n- In `SCALENE` nếu là tam giác thường.",
    category: "Điều kiện",
    difficulty: "Easy",
    language: "cpp",
    input_format: "Một dòng chứa 3 số nguyên `a b c`.",
    output_format: "In ra một trong 4 chuỗi: `INVALID`, `EQUILATERAL`, `ISOSCELES`, `SCALENE`.",
    constraints: "-10^9 <= a, b, c <= 10^9",
    sample_input: "5 5 8",
    sample_output: "ISOSCELES",
    sample_explanation: "5 + 5 > 8 và có hai cạnh bằng nhau nên là tam giác cân (ISOSCELES).",
    starter_code: `#include <iostream>
using namespace std;

int main() {
    long long a, b, c;
    cin >> a >> b >> c;
    // Kiểm tra điều kiện hợp lệ và phân loại tam giác
    return 0;
}`,
    hints: [
      "Điều kiện tam giác hợp lệ: a > 0 && b > 0 && c > 0 && a + b > c && a + c > b && b + c > a.",
      "Kiểm tra tam giác đều (a == b && b == c) TRƯỚC khi kiểm tra tam giác cân."
    ],
    solution_code: `#include <iostream>
using namespace std;

int main() {
    long long a, b, c;
    cin >> a >> b >> c;
    if (a <= 0 || b <= 0 || c <= 0 || a + b <= c || a + c <= b || b + c <= a) {
        cout << "INVALID\\n";
    } else if (a == b && b == c) {
        cout << "EQUILATERAL\\n";
    } else if (a == b || b == c || a == c) {
        cout << "ISOSCELES\\n";
    } else {
        cout << "SCALENE\\n";
    }
    return 0;
}`,
    solution_explanation: "Dùng `long long` để phép cộng `a + b` không bị tràn khi a, b tới 10^9. Kiểm tra lần lượt từ điều kiện chặt nhất (đều) tới lỏng hơn (cân, thường).",
    time_limit_ms: 1000,
    memory_limit_kb: 262144,
    xp_reward: 60,
    test_cases: [
      { input_data: "5 5 8", expected_output: "ISOSCELES", is_sample: true },
      { input_data: "6 6 6", expected_output: "EQUILATERAL", is_sample: false },
      { input_data: "3 4 5", expected_output: "SCALENE", is_sample: false },
      { input_data: "1 2 3", expected_output: "INVALID", is_sample: false },
      { input_data: "-2 5 5", expected_output: "INVALID", is_sample: false }
    ]
  },
  {
    id: "ex-004",
    code: "CL-004",
    slug: "tong-chu-so-cua-so-nguyen",
    title: "Tổng các chữ số của số nguyên N",
    description:
      "Cho số nguyên không âm `N`. Hãy tính tổng tất cả các chữ số trong biểu diễn thập phân của `N`.",
    category: "Vòng lặp",
    difficulty: "Easy",
    language: "cpp",
    input_format: "Một số nguyên không âm `N`.",
    output_format: "Một số nguyên duy nhất là tổng các chữ số của `N`.",
    constraints: "0 <= N <= 10^18",
    sample_input: "98765",
    sample_output: "35",
    sample_explanation: "9 + 8 + 7 + 6 + 5 = 35.",
    starter_code: `#include <iostream>
using namespace std;

int main() {
    long long n;
    cin >> n;
    // Dùng vòng lặp while tách từng chữ số
    return 0;
}`,
    hints: [
      "Khi n > 0, chữ số cuối là n % 10, sau đó bỏ chữ số cuối bằng n /= 10.",
      "Cộng dồn vào biến sum khởi tạo bằng 0 (nếu n == 0 thì vòng while không chạy và in đúng 0)."
    ],
    solution_code: `#include <iostream>
using namespace std;

int main() {
    long long n;
    cin >> n;
    int sum = 0;
    while (n > 0) {
        sum += (int)(n % 10);
        n /= 10;
    }
    cout << sum << "\\n";
    return 0;
}`,
    solution_explanation: "Vòng lặp chạy tối đa 19 lần với số tới 10^18, độ phức tạp O(log10 N).",
    time_limit_ms: 1000,
    memory_limit_kb: 262144,
    xp_reward: 60,
    test_cases: [
      { input_data: "98765", expected_output: "35", is_sample: true },
      { input_data: "0", expected_output: "0", is_sample: false },
      { input_data: "1000000000000000000", expected_output: "1", is_sample: false },
      { input_data: "999999999", expected_output: "81", is_sample: false }
    ]
  },
  {
    id: "ex-005",
    code: "CL-005",
    slug: "tim-phan-tu-lon-thu-hai",
    title: "Tìm giá trị lớn thứ hai khác biệt trong mảng",
    description:
      "Cho mảng gồm `n` số nguyên. Hãy tìm giá trị LỚN THỨ HAI KHÁC BIỆT trong mảng (tức là giá trị lớn nhất nhỏ hơn hẳn giá trị lớn nhất của mảng). Nếu không tồn tại (ví dụ tất cả phần tử bằng nhau), in ra `-1`.",
    category: "Mảng",
    difficulty: "Easy",
    language: "cpp",
    input_format: "Dòng 1: số nguyên dương `n`. Dòng 2: `n` số nguyên cách nhau bởi dấu cách.",
    output_format: "Giá trị lớn thứ hai khác biệt hoặc `-1` nếu không tồn tại.",
    constraints: "1 <= n <= 10^5, -10^9 <= a[i] <= 10^9",
    sample_input: "6\n10 25 25 18 7 20",
    sample_output: "20",
    sample_explanation: "Giá trị lớn nhất là 25 (xuất hiện 2 lần). Giá trị lớn nhất nhỏ hơn hẳn 25 là 20.",
    starter_code: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<long long> a(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    // Tìm giá trị lớn thứ hai khác biệt
    return 0;
}`,
    hints: [
      "Duyệt 1 lần để tìm `max1` (giá trị lớn nhất toàn mảng).",
      "Duyệt lần 2 tìm phần tử lớn nhất trong số các phần tử thỏa `a[i] < max1`. Dùng biến boolean `found` để kiểm tra có tồn tại không (tránh nhầm nếu đáp án thật là -1)."
    ],
    solution_code: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<long long> a(n);
    for (int i = 0; i < n; i++) cin >> a[i];

    long long max1 = a[0];
    for (int i = 1; i < n; i++) {
        if (a[i] > max1) max1 = a[i];
    }

    bool found = false;
    long long max2 = 0;
    for (int i = 0; i < n; i++) {
        if (a[i] < max1) {
            if (!found || a[i] > max2) {
                max2 = a[i];
                found = true;
            }
        }
    }
    if (!found) cout << -1 << "\\n";
    else cout << max2 << "\\n";
    return 0;
}`,
    solution_explanation: "Chỉ cần 2 lượt duyệt tuyến tính O(N) và bộ nhớ O(N) (hoặc O(1) nếu xử lý trực tiếp khi đọc), xử lý đúng kể cả mảng toàn số âm hoặc trùng lặp max.",
    time_limit_ms: 1000,
    memory_limit_kb: 262144,
    xp_reward: 75,
    test_cases: [
      { input_data: "6\n10 25 25 18 7 20", expected_output: "20", is_sample: true },
      { input_data: "4\n5 5 5 5", expected_output: "-1", is_sample: false },
      { input_data: "4\n-10 -3 -5 -3", expected_output: "-5", is_sample: false },
      { input_data: "1\n42", expected_output: "-1", is_sample: false }
    ]
  },
  {
    id: "ex-006",
    code: "CL-006",
    slug: "kiem-tra-chuoi-anagram",
    title: "Kiểm tra hai chuỗi Hoán vị (Anagram)",
    description:
      "Cho hai chuỗi `s` và `t` chỉ gồm các chữ cái tiếng Anh viết thường (`a-z`). Hai chuỗi được gọi là Anagram (hoán vị của nhau) nếu chúng chứa cùng tập ký tự với cùng tần suất xuất hiện. In `YES` nếu là Anagram, ngược lại in `NO`.",
    category: "Chuỗi",
    difficulty: "Easy",
    language: "cpp",
    input_format: "Hai dòng, lần lượt là chuỗi `s` và chuỗi `t`.",
    output_format: "In `YES` hoặc `NO`.",
    constraints: "1 <= |s|, |t| <= 10^5",
    sample_input: "listen\nsilent",
    sample_output: "YES",
    sample_explanation: "Cả hai chuỗi đều có đúng 1 chữ e, i, l, n, s, t.",
    starter_code: `#include <iostream>
#include <string>
using namespace std;

int main() {
    string s, t;
    cin >> s >> t;
    // Đếm tần suất 26 chữ cái hoặc sắp xếp hai chuỗi
    return 0;
}`,
    hints: [
      "Nếu s.size() != t.size() thì chắc chắn in NO ngay lập tức.",
      "Tạo mảng `int cnt[26] = {0};` tăng `cnt[c - 'a']++` với chuỗi s và giảm `cnt[c - 'a']--` với chuỗi t. Nếu tất cả đều bằng 0 thì là YES."
    ],
    solution_code: `#include <iostream>
#include <string>
using namespace std;

int main() {
    string s, t;
    cin >> s >> t;
    if (s.size() != t.size()) {
        cout << "NO\\n";
        return 0;
    }
    int cnt[26] = {0};
    for (char c : s) cnt[c - 'a']++;
    for (char c : t) cnt[c - 'a']--;
    for (int i = 0; i < 26; i++) {
        if (cnt[i] != 0) {
            cout << "NO\\n";
            return 0;
        }
    }
    cout << "YES\\n";
    return 0;
}`,
    solution_explanation: "Đếm tần suất trên bảng chữ cái 26 ký tự cho độ phức tạp tối ưu O(N) về thời gian và O(1) bộ nhớ phụ.",
    time_limit_ms: 1000,
    memory_limit_kb: 262144,
    xp_reward: 75,
    test_cases: [
      { input_data: "listen\nsilent", expected_output: "YES", is_sample: true },
      { input_data: "codelab\nlabcode", expected_output: "YES", is_sample: false },
      { input_data: "hello\nworld", expected_output: "NO", is_sample: false },
      { input_data: "aab\nabb", expected_output: "NO", is_sample: false }
    ]
  },
  {
    id: "ex-007",
    code: "CL-007",
    slug: "dem-so-nguyen-to-trong-doan",
    title: "Đếm số nguyên tố trong đoạn [L, R]",
    description:
      "Cho hai số nguyên `L` và `R`. Viết hàm kiểm tra số nguyên tố và đếm xem có bao nhiêu số nguyên tố nằm trong đoạn `[L, R]`.",
    category: "Hàm",
    difficulty: "Easy",
    language: "cpp",
    input_format: "Một dòng chứa hai số nguyên `L` và `R`.",
    output_format: "Một số nguyên duy nhất là số lượng số nguyên tố trong `[L, R]`.",
    constraints: "1 <= L <= R <= 10^5",
    sample_input: "10 20",
    sample_output: "4",
    sample_explanation: "Các số nguyên tố trong [10, 20] là 11, 13, 17, 19 (4 số).",
    starter_code: `#include <iostream>
using namespace std;

bool isPrime(int n) {
    // Hoàn thiện hàm kiểm tra số nguyên tố
    return false;
}

int main() {
    int l, r;
    cin >> l >> r;
    int count = 0;
    for (int x = l; x <= r; x++) {
        if (isPrime(x)) count++;
    }
    cout << count << "\\n";
    return 0;
}`,
    hints: [
      "Số nguyên tố phải >= 2.",
      "Kiểm tra chia hết cho các ước từ 2 đến căn bậc hai của n: `for (int i = 2; 1LL * i * i <= n; i++)`."
    ],
    solution_code: `#include <iostream>
using namespace std;

bool isPrime(int n) {
    if (n < 2) return false;
    for (int i = 2; 1LL * i * i <= n; i++) {
        if (n % i == 0) return false;
    }
    return true;
}

int main() {
    int l, r;
    cin >> l >> r;
    int count = 0;
    for (int x = l; x <= r; x++) {
        if (isPrime(x)) count++;
    }
    cout << count << "\\n";
    return 0;
}`,
    solution_explanation: "Mỗi số kiểm tra trong O(√R), tổng thời gian ~10^5 × 316 phép toán — chạy rất nhanh dưới 0.05 giây.",
    time_limit_ms: 1000,
    memory_limit_kb: 262144,
    xp_reward: 80,
    test_cases: [
      { input_data: "10 20", expected_output: "4", is_sample: true },
      { input_data: "1 10", expected_output: "4", is_sample: false },
      { input_data: "1 1", expected_output: "0", is_sample: false },
      { input_data: "1 100", expected_output: "25", is_sample: false }
    ]
  },
  {
    id: "ex-008",
    code: "CL-008",
    slug: "xep-hang-sinh-vien-struct",
    title: "Xếp hạng danh sách học viên theo điểm & tên",
    description:
      "Cho danh sách `n` học viên, mỗi học viên gồm tên (không dấu cách) và điểm nguyên `score`. Hãy sắp xếp danh sách theo điểm GIẢM DẦN; nếu hai học viên bằng điểm thì xếp theo tên TĂNG DẦN theo thứ tự từ điển, rồi in ra từng dòng `ten diem`.",
    category: "Struct",
    difficulty: "Medium",
    language: "cpp",
    input_format: "Dòng 1: `n`. `n` dòng tiếp theo, mỗi dòng gồm `ten` và `diem`.",
    output_format: "`n` dòng đã sắp xếp theo yêu cầu.",
    constraints: "1 <= n <= 10^4, 0 <= diem <= 1000",
    sample_input: "4\nMinh 90\nAn 95\nBinh 90\nChi 85",
    sample_output: "An 95\nBinh 90\nMinh 90\nChi 85",
    sample_explanation: "An cao điểm nhất (95). Binh và Minh cùng 90 điểm nhưng 'Binh' đứng trước 'Minh' theo thứ tự từ điển.",
    starter_code: `#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
using namespace std;

struct Student {
    string name;
    int score;
};

int main() {
    int n;
    cin >> n;
    vector<Student> list(n);
    for (int i = 0; i < n; i++) cin >> list[i].name >> list[i].score;
    // Viết comparator cho sort và in kết quả
    return 0;
}`,
    hints: [
      "Trong comparator `(const Student &a, const Student &b)`: nếu `a.score != b.score` trả về `a.score > b.score`.",
      "Nếu bằng điểm, trả về `a.name < b.name`."
    ],
    solution_code: `#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
using namespace std;

struct Student {
    string name;
    int score;
};

int main() {
    int n;
    cin >> n;
    vector<Student> list(n);
    for (int i = 0; i < n; i++) cin >> list[i].name >> list[i].score;

    sort(list.begin(), list.end(), [](const Student &a, const Student &b) {
        if (a.score != b.score) return a.score > b.score;
        return a.name < b.name;
    });

    for (const auto &s : list) {
        cout << s.name << " " << s.score << "\\n";
    }
    return 0;
}`,
    solution_explanation: "Sử dụng `struct` kết hợp lambda comparator tùy chỉnh cho `std::sort`, đạt độ phức tạp O(N log N).",
    time_limit_ms: 1000,
    memory_limit_kb: 262144,
    xp_reward: 100,
    test_cases: [
      { input_data: "4\nMinh 90\nAn 95\nBinh 90\nChi 85", expected_output: "An 95\nBinh 90\nMinh 90\nChi 85", is_sample: true },
      { input_data: "3\nZed 50\nAlpha 50\nBeta 50", expected_output: "Alpha 50\nBeta 50\nZed 50", is_sample: false },
      { input_data: "2\nLan 100\nHuy 80", expected_output: "Lan 100\nHuy 80", is_sample: false }
    ]
  },
  {
    id: "ex-009",
    code: "CL-009",
    slug: "hai-so-co-tong-bang-target",
    title: "Two Sum – Tìm cặp chỉ số có tổng bằng K",
    description:
      "Cho mảng gồm `n` số nguyên `a[0..n-1]` và số nguyên `K`. Hãy tìm cặp chỉ số `(i, j)` với `0 <= i < j < n` sao cho `a[i] + a[j] == K`. Dữ liệu đảm bảo có duy nhất một cặp thỏa mãn. In ra `i j`.",
    category: "Vector",
    difficulty: "Medium",
    language: "cpp",
    input_format: "Dòng 1: `n` và `K`. Dòng 2: `n` số nguyên.",
    output_format: "Hai chỉ số `i j` (0-based) cách nhau một dấu cách.",
    constraints: "2 <= n <= 10^5, -10^9 <= a[i], K <= 10^9",
    sample_input: "4 9\n2 7 11 15",
    sample_output: "0 1",
    sample_explanation: "a[0] + a[1] = 2 + 7 = 9.",
    starter_code: `#include <iostream>
#include <vector>
#include <unordered_map>
using namespace std;

int main() {
    int n;
    long long k;
    cin >> n >> k;
    vector<long long> a(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    // Dùng unordered_map để tìm trong O(N)
    return 0;
}`,
    hints: [
      "Nếu dùng 2 vòng for lồng nhau sẽ mất O(N²) và bị TLE khi n = 10^5.",
      "Duyệt `i` từ `0` đến `n - 1`, tìm phần bù `need = k - a[i]` trong `unordered_map<long long, int> pos`. Nếu đã thấy thì in `pos[need] << ' ' << i`!"
    ],
    solution_code: `#include <iostream>
#include <vector>
#include <unordered_map>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    long long k;
    cin >> n >> k;
    vector<long long> a(n);
    for (int i = 0; i < n; i++) cin >> a[i];

    unordered_map<long long, int> seen;
    for (int i = 0; i < n; i++) {
        long long need = k - a[i];
        auto it = seen.find(need);
        if (it != seen.end()) {
            cout << it->second << " " << i << "\\n";
            return 0;
        }
        seen[a[i]] = i;
    }
    return 0;
}`,
    solution_explanation: "Bảng băm `unordered_map` lưu chỉ số các phần tử đã đi qua giúp tra cứu phần bù `k - a[i]` trong trung bình O(1), tổng thời gian O(N).",
    time_limit_ms: 1000,
    memory_limit_kb: 262144,
    xp_reward: 110,
    test_cases: [
      { input_data: "4 9\n2 7 11 15", expected_output: "0 1", is_sample: true },
      { input_data: "3 6\n3 2 4", expected_output: "1 2", is_sample: false },
      { input_data: "2 6\n3 3", expected_output: "0 1", is_sample: false },
      { input_data: "5 -1\n10 -4 7 3 -9", expected_output: "1 3", is_sample: false }
    ]
  },
  {
    id: "ex-010",
    code: "CL-010",
    slug: "day-con-lien-tiep-tong-lon-nhat",
    title: "Dãy con liên tiếp có tổng lớn nhất (Kadane)",
    description:
      "Cho mảng gồm `n` số nguyên (có thể gồm cả số âm và số dương). Hãy tìm tổng lớn nhất của một dãy con liên tiếp khác rỗng bất kỳ trong mảng.",
    category: "Thuật toán",
    difficulty: "Medium",
    language: "cpp",
    input_format: "Dòng 1: `n`. Dòng 2: `n` số nguyên.",
    output_format: "Một số nguyên duy nhất là tổng dãy con liên tiếp lớn nhất.",
    constraints: "1 <= n <= 2×10^5, -10^9 <= a[i] <= 10^9",
    sample_input: "9\n-2 1 -3 4 -1 2 1 -5 4",
    sample_output: "6",
    sample_explanation: "Dãy con liên tiếp [4, -1, 2, 1] có tổng lớn nhất bằng 6.",
    starter_code: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<long long> a(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    // Cài đặt thuật toán Kadane O(N)
    return 0;
}`,
    hints: [
      "Tại mỗi vị trí `i`, tổng lớn nhất kết thúc đúng tại `i` là `curr = max(a[i], curr + a[i])`.",
      "Cập nhật đáp án toàn cục `best = max(best, curr)`. Khởi tạo cả `curr` và `best` bằng `a[0]` để xử lý đúng mảng toàn số âm."
    ],
    solution_code: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<long long> a(n);
    for (int i = 0; i < n; i++) cin >> a[i];

    long long curr = a[0], best = a[0];
    for (int i = 1; i < n; i++) {
        curr = max(a[i], curr + a[i]);
        best = max(best, curr);
    }
    cout << best << "\\n";
    return 0;
}`,
    solution_explanation: "Thuật toán Kadane (quy hoạch động cơ bản) giải quyết gọn gàng trong O(N) thời gian và O(1) bộ nhớ phụ.",
    time_limit_ms: 1000,
    memory_limit_kb: 262144,
    xp_reward: 120,
    test_cases: [
      { input_data: "9\n-2 1 -3 4 -1 2 1 -5 4", expected_output: "6", is_sample: true },
      { input_data: "3\n-5 -2 -9", expected_output: "-2", is_sample: false },
      { input_data: "5\n1 2 3 4 5", expected_output: "15", is_sample: false },
      { input_data: "1\n-100", expected_output: "-100", is_sample: false }
    ]
  },
  {
    id: "ex-011",
    code: "CL-011",
    slug: "kiem-tra-ngoac-can-bang-da-loai",
    title: "Kiểm tra chuỗi ngoặc cân bằng ()[]{}",
    description:
      "Cho một chuỗi `s` chỉ gồm 6 ký tự `(`, `)`, `[`, `]`, `{`, `}`. Hãy kiểm tra xem chuỗi ngoặc có hợp lệ hay không (mọi ngoặc mở phải được đóng bởi đúng loại ngoặc tương ứng và theo đúng thứ tự lồng nhau). In `VALID` hoặc `INVALID`.",
    category: "Cấu trúc dữ liệu",
    difficulty: "Medium",
    language: "cpp",
    input_format: "Một dòng chứa chuỗi ngoặc `s`.",
    output_format: "In `VALID` nếu hợp lệ, ngược lại `INVALID`.",
    constraints: "1 <= |s| <= 10^5",
    sample_input: "({[]})",
    sample_output: "VALID",
    sample_explanation: "Các cặp ngoặc đóng mở đúng thứ tự lồng nhau.",
    starter_code: `#include <iostream>
#include <stack>
#include <string>
using namespace std;

int main() {
    string s;
    cin >> s;
    // Dùng stack<char> kiểm tra tính cân bằng
    return 0;
}`,
    hints: [
      "Gặp ngoặc mở '(', '[', '{' thì đẩy vào stack.",
      "Gặp ngoặc đóng thì nếu stack rỗng hoặc đỉnh stack không khớp cặp tương ứng -> trả về INVALID. Cuối cùng stack phải rỗng."
    ],
    solution_code: `#include <iostream>
#include <stack>
#include <string>
using namespace std;

int main() {
    string s;
    cin >> s;
    stack<char> st;
    for (char c : s) {
        if (c == '(' || c == '[' || c == '{') {
            st.push(c);
        } else {
            if (st.empty()) {
                cout << "INVALID\\n";
                return 0;
            }
            char top = st.top();
            if ((c == ')' && top != '(') ||
                (c == ']' && top != '[') ||
                (c == '}' && top != '{')) {
                cout << "INVALID\\n";
                return 0;
            }
            st.pop();
        }
    }
    cout << (st.empty() ? "VALID" : "INVALID") << "\\n";
    return 0;
}`,
    solution_explanation: "Mỗi ký tự đẩy và rút khỏi Stack đúng 1 lần nên độ phức tạp đạt O(N).",
    time_limit_ms: 1000,
    memory_limit_kb: 262144,
    xp_reward: 110,
    test_cases: [
      { input_data: "({[]})", expected_output: "VALID", is_sample: true },
      { input_data: "([)]", expected_output: "INVALID", is_sample: false },
      { input_data: "()[]{}", expected_output: "VALID", is_sample: false },
      { input_data: "(((", expected_output: "INVALID", is_sample: false }
    ]
  },
  {
    id: "ex-012",
    code: "CL-012",
    slug: "day-con-tang-dai-nhat-lis",
    title: "Dãy con tăng nghiêm ngặt dài nhất (LIS)",
    description:
      "Cho mảng gồm `n` số nguyên. Hãy tìm độ dài của dãy con tăng nghiêm ngặt dài nhất (các phần tử không nhất thiết liên tiếp nhưng phải giữ nguyên thứ tự trước sau và thỏa `a[i1] < a[i2] < ... < a[ik]`).",
    category: "Thuật toán",
    difficulty: "Hard",
    language: "cpp",
    input_format: "Dòng 1: `n`. Dòng 2: `n` số nguyên.",
    output_format: "Một số nguyên duy nhất là độ dài LIS.",
    constraints: "1 <= n <= 10^5, -10^9 <= a[i] <= 10^9",
    sample_input: "8\n10 9 2 5 3 7 101 18",
    sample_output: "4",
    sample_explanation: "Một dãy con tăng dài nhất là [2, 3, 7, 101] có độ dài 4.",
    starter_code: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<long long> a(n);
    for (int i = 0; i < n; i++) cin >> a[i];
    // Tối ưu O(N log N) bằng mảng tails + lower_bound
    return 0;
}`,
    hints: [
      "Thuật toán quy hoạch động O(N²) sẽ bị TLE khi n = 10^5.",
      "Duy trì `vector<long long> tails` luôn tăng dần: với mỗi `x`, tìm `it = lower_bound(tails.begin(), tails.end(), x)`. Nếu `it == tails.end()` thì `push_back(x)`, ngược lại gán `*it = x`. Kết quả là `tails.size()`."
    ],
    solution_code: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<long long> tails;
    for (int i = 0; i < n; i++) {
        long long x;
        cin >> x;
        auto it = lower_bound(tails.begin(), tails.end(), x);
        if (it == tails.end()) tails.push_back(x);
        else *it = x;
    }
    cout << tails.size() << "\\n";
    return 0;
}`,
    solution_explanation: "Kỹ thuật Patience Sorting với `std::lower_bound` duy trì phần tử kết thúc nhỏ nhất cho từng độ dài dãy tăng, đạt O(N log N).",
    time_limit_ms: 1000,
    memory_limit_kb: 262144,
    xp_reward: 180,
    test_cases: [
      { input_data: "8\n10 9 2 5 3 7 101 18", expected_output: "4", is_sample: true },
      { input_data: "5\n5 4 3 2 1", expected_output: "1", is_sample: false },
      { input_data: "6\n0 1 0 3 2 3", expected_output: "4", is_sample: false },
      { input_data: "5\n7 7 7 7 7", expected_output: "1", is_sample: false }
    ]
  }
];
