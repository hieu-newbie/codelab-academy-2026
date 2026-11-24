import type { TutorContext, TutorHistoryMessage } from "@/lib/ai-tutor-shared";
import { CLASSIC_PROBLEM_TOPICS } from "@/lib/offline-classic-problems";

export interface KnowledgeTopic {
  id: string;
  title: string;
  category: "C++ Cơ bản" | "C++ STL" | "Thuật toán" | "HTML" | "CSS" | "JavaScript" | "Lộ trình";
  language?: "cpp" | "html" | "css" | "javascript";
  /** High-priority exact phrases/tokens (matched against accent-stripped lowercase text) */
  primaryTerms: string[];
  /** Secondary supporting keywords */
  secondaryTerms?: string[];
  /** Negative patterns on normalized text to block Vietnamese homonym false positives (e.g., "biến ... thành" ≠ variable) */
  negativePatterns?: RegExp[];
  /** Optional priority boost for specific algorithmic problem statements over generic grammar topics */
  specificityBoost?: number;
  /** Short intuition & core definition in Vietnamese */
  summary: string;
  /** Bullet points of key operations / rules / complexity */
  keyPoints: string[];
  /** Concise runnable example */
  exampleLang?: string;
  exampleCode?: string;
  /** Common beginner pitfalls */
  mistakes: string[];
  /** Mini practice prompt / next step */
  practice: {
    prompt: string;
    hint: string;
    quiz?: string;
  };
}

export function stripVietnameseAccents(input: string): string {
  return input
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_+#&<>:.\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function matchesTerm(normalizedText: string, term: string): boolean {
  const normTerm = stripVietnameseAccents(term);
  if (!normTerm) return false;
  // For terms with special symbols (like ++, &, <<, ==, <bits/stdc++.h>), substring check works cleanly
  if (/[^a-z0-9_\s]/.test(normTerm)) {
    return normalizedText.includes(normTerm);
  }
  const re = new RegExp(`(?:^|\\s|[^a-z0-9_])${escapeRegExp(normTerm)}(?:$|\\s|[^a-z0-9_])`);
  return re.test(normalizedText);
}

export const OFFLINE_KNOWLEDGE_BASE: KnowledgeTopic[] = [
  // ===================== C++ STL =====================
  {
    id: "stl-map",
    title: "std::map trong C++ (Ánh xạ Key → Value có sắp xếp)",
    category: "C++ STL",
    language: "cpp",
    primaryTerms: ["map", "std::map", "anh xa", "tu dien", "key value", "dem tan suat"],
    secondaryTerms: ["stl", "cay do den", "red black", "first", "second", "mp"],
    summary:
      "`std::map<K, V>` là cấu trúc dữ liệu lưu các cặp **(khóa `key` → giá trị `value`)**, trong đó mỗi `key` là **duy nhất** và luôn được **tự động sắp xếp tăng dần** theo `key` (nhờ cây nhị phân cân bằng Red-Black Tree).",
    keyPoints: [
      "**Độ phức tạp:** Thêm, sửa, xóa, tìm kiếm đều là `O(log N)` — rất nhanh và ổn định, không bị hack test như hash table.",
      "**Khai báo:** `map<string, int> mp;` hoặc `map<long long, int> cnt;` (có sẵn trong `#include <bits/stdc++.h>` hoặc `#include <map>`).",
      "**Thao tác hay dùng nhất:** `mp[k] = v;` (gán/cập nhật), `mp[k]++;` (đếm số lần xuất hiện của `k`), `mp.count(k)` hoặc `mp.find(k) != mp.end()` (kiểm tra tồn tại), `mp.erase(k)` (xóa khóa `k`), `mp.size()`.",
      "**Cách duyệt gọn nhất (C++17):** `for (auto &[k, v] : mp)` sẽ duyệt tự động theo thứ tự `k` tăng dần.",
    ],
    exampleLang: "cpp",
    exampleCode: `#include <bits/stdc++.h>
using namespace std;

int main() {
    vector<string> words = {"cpp", "map", "cpp", "stl", "map", "cpp"};
    map<string, int> freq;

    for (const string &w : words) {
        freq[w]++; // tự khởi tạo 0 nếu chưa có rồi cộng thêm 1
    }

    // Tự động in theo thứ tự từ điển: cpp -> map -> stl
    for (auto &[key, count] : freq) {
        cout << key << ": " << count << "\\n";
    }

    if (freq.count("python")) {
        cout << "Co python\\n";
    }
    return 0;
}`,
    mistakes: [
      "**Bẫy `if (mp[x] == 0)`:** Truy cập `mp[x]` khi `x` chưa tồn tại sẽ **tự động chèn** cặp `(x, 0)` vào map, làm tăng `mp.size()` và tốn bộ nhớ! Hãy dùng `mp.count(x)` hoặc `mp.find(x) != mp.end()` để kiểm tra tồn tại.",
      "**Xóa phần tử khi đang duyệt bằng `for (auto &p : mp)`:** Gọi `mp.erase(p.first)` ngay trong vòng range-for sẽ gây lỗi bộ nhớ (invalid iterator). Hãy dùng vòng lặp iterator `it = mp.erase(it);`.",
      "**Nhầm với `Array.map()` của JavaScript:** Trong C++, `std::map` là từ điển (Key-Value), còn trong JS `arr.map()` là hàm biến đổi từng phần tử mảng.",
    ],
    practice: {
      prompt: "Nhập `N` số nguyên (có thể tới `10^18` hoặc số âm). Hãy dùng `map<long long, int>` để đếm số lần xuất hiện của từng số khác nhau và in ra theo thứ tự tăng dần.",
      hint: "Đọc từng số `x`, tăng `cnt[x]++`, cuối cùng duyệt `for (auto &[val, c] : cnt)` để in `val` và `c`. Bạn có thể mở trang **Tự code (Sandbox)** để chạy thử ngay!",
      quiz: "Nếu `map<int, int> mp;` đang rỗng, sau dòng `if (mp[5] == 1) {}`, giá trị của `mp.size()` là `0` hay `1`?",
    },
  },
  {
    id: "stl-unordered-map",
    title: "std::unordered_map trong C++ (Bảng băm Hash Table)",
    category: "C++ STL",
    language: "cpp",
    primaryTerms: ["unordered_map", "unordered map", "hash map", "hashmap", "bang bam", "hash table"],
    secondaryTerms: ["map", "o(1)", "two sum", "stl"],
    summary:
      "`std::unordered_map<K, V>` cũng lưu cặp **(key → value)** giống `map`, nhưng cài đặt bằng **bảng băm (Hash Table)** nên **không sắp xếp key**, đổi lại tốc độ tra cứu trung bình đạt **`O(1)`**.",
    keyPoints: [
      "**Khi nào chọn `unordered_map`?** Khi cần tra cứu cực nhanh (như bài *Two Sum* `O(N)` hoặc đếm tần suất chuỗi) và **không cần** in key theo thứ tự tăng dần.",
      "**Khi nào nên dùng `map` thay thế?** Khi cần key có thứ tự (`lower_bound`, lấy key nhỏ nhất/lớn nhất) hoặc key là kiểu phức tạp như `pair<int,int>` (vì `unordered_map` không có hàm băm mặc định cho `pair`).",
      "**Lưu ý hiệu năng:** Nên gọi `mp.reserve(n)` khi biết trước số lượng phần tử để giảm rehash.",
    ],
    exampleLang: "cpp",
    exampleCode: `#include <bits/stdc++.h>
using namespace std;

int main() {
    unordered_map<string, int> score;
    score["An"] = 95;
    score["Binh"] = 88;

    if (score.find("An") != score.end()) {
        cout << "Diem cua An: " << score["An"] << "\\n";
    }
    return 0;
}`,
    mistakes: [
      "Quên rằng thứ tự duyệt của `unordered_map` là **ngẫu nhiên**, không theo thứ tự chèn vào hay tăng dần.",
      "Dùng `unordered_map<pair<int,int>, int>` sẽ báo lỗi biên dịch vì C++ không tự tạo `std::hash` cho `pair` (hãy dùng `map` hoặc tự viết custom hash).",
    ],
    practice: {
      prompt: "Cho mảng `N` phần tử và số `K`. Dùng `unordered_map` kiểm tra xem có hai phần tử ở hai vị trí khác nhau có tổng bằng `K` không trong `O(N)`.",
      hint: "Với mỗi `x = a[i]`, kiểm tra xem `K - x` đã nằm trong `unordered_map` chưa **trước** khi lưu `x` vào map.",
    },
  },
  {
    id: "stl-set",
    title: "std::set, multiset & unordered_set trong C++",
    category: "C++ STL",
    language: "cpp",
    primaryTerms: ["set", "std::set", "multiset", "unordered_set", "tap hop", "phan tu duy nhat", "loai trung"],
    secondaryTerms: ["stl", "insert", "erase", "lower_bound"],
    summary:
      "`std::set<T>` là tập hợp lưu các phần tử **không trùng lặp** và **tự động sắp xếp tăng dần** (`O(log N)` cho thêm/xóa/tìm). Nếu cần cho phép trùng lặp, dùng `multiset<T>`; nếu không cần thứ tự và muốn nhanh `O(1)` trung bình, dùng `unordered_set<T>`.",
    keyPoints: [
      "**Thao tác chính:** `s.insert(x)`, `s.erase(x)`, `s.count(x)`, `s.find(x)`, `s.empty()`, `s.size()`.",
      "**Lấy phần tử nhỏ nhất / lớn nhất:** `*s.begin()` là nhỏ nhất, `*s.rbegin()` là lớn nhất (nhớ kiểm tra `!s.empty()` trước!).",
      "**Tìm nhanh phần tử `>= x`:** dùng `s.lower_bound(x)` (chạy `O(log N)`, ĐỪNG dùng `std::lower_bound(s.begin(), s.end(), x)` vì sẽ chậm `O(N)`!).",
    ],
    exampleLang: "cpp",
    exampleCode: `#include <bits/stdc++.h>
using namespace std;

int main() {
    set<int> s = {5, 2, 8, 2, 5, 1};
    cout << "So phan tu khac nhau: " << s.size() << "\\n"; // 4
    for (int x : s) cout << x << " "; // 1 2 5 8
    cout << "\\nMin = " << *s.begin() << ", Max = " << *s.rbegin() << "\\n";
    return 0;
}`,
    mistakes: [
      "**Bẫy kinh điển của `multiset`:** `ms.erase(x)` sẽ xóa **tất cả** bản sao của `x`! Nếu chỉ muốn xóa đúng 1 bản sao, hãy viết: `auto it = ms.find(x); if (it != ms.end()) ms.erase(it);`.",
      "Truy cập `s[0]` sẽ lỗi biên dịch vì `set` không hỗ trợ chỉ số ngẫu nhiên như `vector`.",
    ],
    practice: {
      prompt: "Nhập danh sách `N` số nguyên, đếm xem có bao nhiêu giá trị khác nhau và tìm giá trị nhỏ thứ hai trong tập đó.",
      hint: "Đưa tất cả số vào `set<long long>`. Nếu `s.size() >= 2`, dùng `auto it = s.begin(); ++it; cout << *it;`.",
    },
  },
  {
    id: "stl-vector",
    title: "std::vector trong C++ (Mảng động)",
    category: "C++ STL",
    language: "cpp",
    primaryTerms: ["vector", "std::vector", "mang dong", "push_back", "emplace_back"],
    secondaryTerms: ["stl", "resize", "clear", "mang"],
    summary:
      "`std::vector<T>` là **mảng động** tự co giãn kích thước khi bạn thêm hoặc bớt phần tử, an toàn và tiện lợi hơn mảng tĩnh C-style rất nhiều.",
    keyPoints: [
      "**Khởi tạo phổ biến:** `vector<int> a;` (rỗng), `vector<int> a(n, 0);` (`n` phần tử đều bằng `0`), `vector<vector<int>> grid(r, vector<int>(c, 0));` (mảng 2 chiều).",
      "**Thao tác cơ bản:** `a.push_back(x)` (`O(1)` amortized), `a.pop_back()`, `a.size()`, `a.empty()`, `a.front()`, `a.back()`, `a.clear()`.",
      "**Sắp xếp:** `sort(a.begin(), a.end());` (tăng dần) hoặc `sort(a.rbegin(), a.rend());` (giảm dần).",
    ],
    exampleLang: "cpp",
    exampleCode: `#include <bits/stdc++.h>
using namespace std;

int main() {
    vector<int> a = {4, 1, 7, 2};
    a.push_back(9);
    sort(a.begin(), a.end());
    for (int x : a) cout << x << " ";
    return 0;
}`,
    mistakes: [
      "**Truy cập `a[i]` khi `a` đang rỗng:** Phải khai báo kích thước `vector<int> a(n);` trước khi `cin >> a[i]`, hoặc đọc vào biến tạm `x` rồi `a.push_back(x)`.",
      "**Bẫy `a.size() - 1` khi vector rỗng:** `.size()` trả về kiểu không dấu (`size_t`), nên `0 - 1` tràn thành số cực lớn! Hãy viết `(int)a.size() - 1`.",
    ],
    practice: {
      prompt: "Đọc `N` số vào `vector<long long>`, lọc ra các số chẵn vào một `vector` mới rồi sắp xếp giảm dần.",
      hint: "Dùng `push_back` khi `x % 2 == 0`, sau đó dùng `sort(even.rbegin(), even.rend())`.",
    },
  },
  {
    id: "stl-stack",
    title: "std::stack trong C++ (Ngăn xếp LIFO)",
    category: "C++ STL",
    language: "cpp",
    primaryTerms: ["stack", "std::stack", "ngan xep", "lifo"],
    secondaryTerms: ["ngoac dung", "push", "pop", "top", "stl"],
    summary:
      "`std::stack<T>` hoạt động theo nguyên tắc **LIFO (Last In, First Out — vào sau ra trước)**, giống chồng đĩa: bạn chỉ thêm và lấy ở đúng đỉnh trên cùng.",
    keyPoints: [
      "**Thao tác đều `O(1)`:** `st.push(x)` (đẩy vào đỉnh), `st.top()` (xem đỉnh), `st.pop()` (bỏ đỉnh — không trả về giá trị!), `st.empty()`, `st.size()`.",
      "**Ứng dụng kinh điển:** Kiểm tra dãy ngoặc hợp lệ `()[]{}`, khử đệ quy (DFS), bài toán tìm phần tử lớn hơn gần nhất bên trái/phải (Monotonic Stack), tính biểu thức hậu tố.",
    ],
    exampleLang: "cpp",
    exampleCode: `#include <bits/stdc++.h>
using namespace std;

int main() {
    stack<char> st;
    string s = "(()())";
    bool ok = true;
    for (char c : s) {
        if (c == '(') st.push(c);
        else {
            if (st.empty()) { ok = false; break; }
            st.pop();
        }
    }
    cout << (ok && st.empty() ? "Hop le" : "Khong hop le") << "\\n";
    return 0;
}`,
    mistakes: [
      "Gọi `st.top()` hoặc `st.pop()` khi `st.empty() == true` sẽ gây **Runtime Error** ngay lập tức!",
      "Nhầm `int x = st.pop();` — trong C++, `pop()` trả về `void`, bạn phải lấy `st.top()` trước rồi mới `st.pop()`.",
    ],
    practice: {
      prompt: "Mở rộng ví dụ trên để kiểm tra chuỗi gồm cả 3 loại ngoặc `()`, `[]`, `{}` có hợp lệ hay không.",
      hint: "Khi gặp ngoặc đóng, kiểm tra `!st.empty()` và `st.top()` có phải đúng ngoặc mở tương ứng không.",
    },
  },
  {
    id: "stl-queue",
    title: "std::queue & std::deque trong C++ (Hàng đợi FIFO)",
    category: "C++ STL",
    language: "cpp",
    primaryTerms: ["queue", "std::queue", "deque", "hang doi", "fifo"],
    secondaryTerms: ["bfs", "front", "back", "push", "pop", "stl"],
    summary:
      "`std::queue<T>` hoạt động theo nguyên tắc **FIFO (First In, First Out — vào trước ra trước)** như xếp hàng mua vé. `std::deque<T>` là hàng đợi hai đầu cho phép thêm/xóa `O(1)` ở cả đầu và cuối.",
    keyPoints: [
      "**Thao tác `queue` (`O(1)`):** `q.push(x)` (vào cuối), `q.front()` (xem đầu), `q.back()` (xem cuối), `q.pop()` (ra khỏi đầu), `q.empty()`.",
      "**Thao tác `deque` (`O(1)`):** `push_front`, `push_back`, `pop_front`, `pop_back`, và hỗ trợ truy cập `dq[i]`!",
      "**Ứng dụng:** Duyệt đồ thị theo chiều rộng (**BFS**), trượt cửa sổ tìm min/max đoạn `K` phần tử (Monotonic Deque).",
    ],
    exampleLang: "cpp",
    exampleCode: `#include <bits/stdc++.h>
using namespace std;

int main() {
    queue<string> q;
    q.push("Khach 1");
    q.push("Khach 2");
    while (!q.empty()) {
        cout << "Phuc vu: " << q.front() << "\\n";
        q.pop();
    }
    return 0;
}`,
    mistakes: [
      "Gọi `q.front()` hoặc `q.pop()` khi hàng đợi rỗng.",
      "Nhầm `q.top()` của `stack`/`priority_queue` với `q.front()` của `queue`.",
    ],
    practice: {
      prompt: "Dùng `queue<int>` mô phỏng bài toán sinh tất cả số nhị phân từ `1` đến `N`.",
      hint: "Bắt đầu đẩy `\"1\"` vào `queue<string>`, mỗi bước lấy `s = q.front()`, in `s`, rồi đẩy tiếp `s + \"0\"` và `s + \"1\"`.",
    },
  },
  {
    id: "stl-priority-queue",
    title: "std::priority_queue trong C++ (Hàng đợi ưu tiên / Heap)",
    category: "C++ STL",
    language: "cpp",
    primaryTerms: ["priority_queue", "priority queue", "hang doi uu tien", "heap", "min heap", "max heap"],
    secondaryTerms: ["dijkstra", "top", "greater", "stl"],
    summary:
      "`std::priority_queue<T>` luôn giữ phần tử **có độ ưu tiên cao nhất ở đỉnh (`top()`)** nhờ cấu trúc cây nhị phân Heap (`O(log N)` cho thêm/xóa, `O(1)` để xem đỉnh).",
    keyPoints: [
      "**Mặc định là Max-Heap:** `priority_queue<int> pq;` → `pq.top()` luôn là phần tử **lớn nhất**.",
      "**Cách tạo Min-Heap (lấy nhỏ nhất):** `priority_queue<int, vector<int>, greater<int>> minPq;`",
      "**Ứng dụng phổ biến:** Thuật toán Dijkstra tìm đường đi ngắn nhất, nối dây chi phí nhỏ nhất (Huffman), tìm `K` phần tử lớn nhất.",
    ],
    exampleLang: "cpp",
    exampleCode: `#include <bits/stdc++.h>
using namespace std;

int main() {
    priority_queue<int, vector<int>, greater<int>> minPq;
    for (int x : {15, 4, 9, 2}) minPq.push(x);
    while (!minPq.empty()) {
        cout << minPq.top() << " "; // 2 4 9 15
        minPq.pop();
    }
    return 0;
}`,
    mistakes: [
      "Viết thiếu `vector<int>` ở giữa khi khai báo Min-Heap (phải đủ 3 tham số template: `<T, vector<T>, greater<T>>`).",
      "Thử duyệt `for (int x : pq)` — `priority_queue` không có iterator, chỉ lấy từng phần tử qua `top()` + `pop()`.",
    ],
    practice: {
      prompt: "Cho `N` sợi dây có độ dài khác nhau; mỗi lần nối 2 sợi dây tốn chi phí bằng tổng độ dài của chúng. Hãy tìm tổng chi phí nhỏ nhất để nối thành 1 sợi.",
      hint: "Dùng Min-Heap, mỗi bước rút 2 sợi ngắn nhất `a, b`, cộng `a + b` vào đáp án rồi đẩy `a + b` lại vào heap cho tới khi còn 1 sợi.",
    },
  },
  {
    id: "stl-pair-tuple",
    title: "std::pair & std::tuple trong C++",
    category: "C++ STL",
    language: "cpp",
    primaryTerms: ["pair", "std::pair", "tuple", "make_pair", "first second"],
    secondaryTerms: ["stl", "structured binding"],
    summary:
      "`pair<A, B>` gộp nhanh 2 giá trị thành một cặp (`.first` và `.second`), còn `tuple<A, B, C...>` gộp từ 3 giá trị trở lên — cực kỳ tiện khi lưu tọa độ `(x, y)` hoặc `(điểm, tên)`.",
    keyPoints: [
      "**Tự động so sánh theo thứ tự từ điển:** So sánh `.first` trước, nếu bằng nhau mới so sánh `.second` → dùng `sort(v.begin(), v.end())` trên `vector<pair<int,int>>` không cần viết hàm so sánh!",
      "**C++17 Structured Binding:** `auto [x, y] = p;` giúp code cực gọn và dễ đọc.",
    ],
    exampleLang: "cpp",
    exampleCode: `#include <bits/stdc++.h>
using namespace std;

int main() {
    vector<pair<int, string>> students = {{85, "Binh"}, {95, "An"}, {85, "Chi"}};
    sort(students.begin(), students.end());
    for (auto &[score, name] : students) {
        cout << name << ": " << score << "\\n";
    }
    return 0;
}`,
    mistakes: [
      "Nhầm `.first()` có dấu ngoặc — `first` và `second` là **biến thành viên** (không có ngoặc `()`).",
    ],
    practice: {
      prompt: "Lưu `N` tọa độ `(x, y)` vào `vector<pair<int,int>>` và sắp xếp tăng dần theo `x`, nếu `x` bằng nhau thì giảm dần theo `y`.",
      hint: "Hoặc viết hàm `cmp`, hoặc mẹo nhanh: lưu `{x, -y}` rồi sort bình thường!",
    },
  },

  // ===================== C++ FUNDAMENTALS =====================
  {
    id: "cpp-intro",
    title: "Cấu trúc chương trình C++17 & #include <bits/stdc++.h>",
    category: "C++ Cơ bản",
    language: "cpp",
    primaryTerms: ["bits/stdc++.h", "bits/stdc++", "cau truc chuong trinh", "using namespace std", "iostream", "bat dau c++", "hoc c++"],
    secondaryTerms: ["include", "int main", "return 0"],
    summary:
      "Mỗi chương trình C++ bắt đầu thực thi từ hàm `int main()`. Trên CODELAB, trình biên dịch Clang WASM hỗ trợ sẵn **`#include <bits/stdc++.h>`** giúp bạn dùng mọi thư viện STL phổ biến chỉ với 1 dòng `#include`.",
    keyPoints: [
      "`#include <bits/stdc++.h>` nạp sẵn `iostream`, `vector`, `string`, `algorithm`, `map`, `set`, `queue`, `stack`, `cmath`, `iomanip`...",
      "`using namespace std;` cho phép viết gọn `cin`, `cout`, `vector` thay vì `std::cin`, `std::cout`.",
      "`return 0;` ở cuối `main()` báo cho hệ điều hành chương trình đã kết thúc thành công (không lỗi).",
    ],
    exampleLang: "cpp",
    exampleCode: `#include <bits/stdc++.h>
using namespace std;

int main() {
    cout << "Xin chao CODELAB!\\n";
    return 0;
}`,
    mistakes: [
      "Quên dấu chấm phẩy `;` ở cuối câu lệnh hoặc quên đóng ngoặc nhọn `}`.",
      "Viết sai chữ hoa/thường: C++ phân biệt `Main()` với `main()`, `Cout` với `cout`.",
    ],
    practice: {
      prompt: "Mở mục **Tự code (Sandbox)**, viết chương trình in tên, mục tiêu học lập trình của bạn và kết quả phép tính `2026 * 2`.",
      hint: "Dùng `cout << ... << \"\\n\";` và nhấn `Ctrl + Enter` để chạy ngay!",
    },
  },
  {
    id: "variables-types",
    title: "Biến, Kiểu dữ liệu & Chống tràn số (int vs long long)",
    category: "C++ Cơ bản",
    language: "cpp",
    primaryTerms: [
      "khai bao bien",
      "bien trong c++",
      "bien la gi",
      "kieu du lieu",
      "long long",
      "tran so",
      "overflow",
      "double",
      "float",
      "kieu char",
      "kieu bool",
      "kieu int",
      "int va long long",
      "int vs long long",
    ],
    secondaryTerms: ["64-bit", "32-bit", "so thuc", "int_max", "llong_max"],
    negativePatterns: [/bien\s+.+\s+thanh/, /bien\s+doi/, /nhi\s+phan/, /thap\s+phan/, /he\s+co\s+so/],
    summary:
      "Chọn đúng kiểu dữ liệu ngay từ đầu giúp chương trình không bị **tràn số (Integer Overflow)** hay mất độ chính xác thập phân.",
    keyPoints: [
      "`int` (32-bit): từ `-2.14 × 10⁹` đến `+2.14 × 10⁹` (`INT_MAX = 2,147,483,647`).",
      "`long long` (64-bit): từ `-9.22 × 10¹⁸` đến `+9.22 × 10¹⁸` — **hãy dùng `long long`** khi đề có giới hạn `>= 10⁹` hoặc khi nhân/cộng dồn nhiều số!",
      "`double` (64-bit): lưu số thực chính xác ~15–17 chữ số (luôn ưu tiên `double` hơn `float`).",
      "`bool` (`true`/`false`), `char` (1 ký tự như `'A'`, `'0'`), `string` (chuỗi văn bản).",
    ],
    exampleLang: "cpp",
    exampleCode: `#include <bits/stdc++.h>
using namespace std;

int main() {
    long long a = 1500000000LL;
    long long b = 2700000000LL;
    cout << "Tong 64-bit: " << a + b << "\\n"; // 4200000000 (khong bi tran!)
    cout << fixed << setprecision(2) << (double)7 / 2 << "\\n"; // 3.50
    return 0;
}`,
    mistakes: [
      "**Tràn số ẩn khi nhân 2 biến `int`:** `long long res = a * b;` vẫn bị tràn nếu `a, b` là `int`! Phải viết `1LL * a * b` hoặc khai báo `a, b` là `long long`.",
      "**Biến cục bộ chưa khởi tạo:** `int sum;` trong `main()` chứa giá trị rác, luôn gán `int sum = 0;` trước khi `sum += ...`.",
    ],
    practice: {
      prompt: "Thử tính `100000 * 100000` bằng `int` rồi đổi sang `long long` trong Sandbox để thấy rõ sự khác biệt.",
      hint: "Với `int`, kết quả sẽ bị tràn sang một con số kỳ lạ; với `long long`, kết quả chính xác là `10000000000`.",
    },
  },
  {
    id: "io-cin-cout",
    title: "Nhập xuất dữ liệu (cin, cout, getline & setprecision)",
    category: "C++ Cơ bản",
    language: "cpp",
    primaryTerms: ["cin", "cout", "getline", "nhap xuat", "setprecision", "fixed", "sync_with_stdio", "cin.ignore"],
    secondaryTerms: ["stdin", "stdout", "endl", "in so thap phan"],
    summary:
      "`cin >>` đọc dữ liệu theo từng từ/số (bỏ qua khoảng trắng), `getline(cin, s)` đọc **cả một dòng có dấu cách**, còn `cout <<` in kết quả ra màn hình.",
    keyPoints: [
      "**Mẹo nhớ chiều mũi tên:** `cin >> x` (dữ liệu đi *vào* `x`), `cout << x` (dữ liệu đi *ra* màn hình).",
      "**In số thực `k` chữ số sau dấu phẩy:** `cout << fixed << setprecision(k) << val;`.",
      "**Tăng tốc I/O cho bài N lớn (`>= 10⁵`):** thêm `ios::sync_with_stdio(false); cin.tie(nullptr);` và dùng `\"\\n\"` thay cho `endl`.",
    ],
    exampleLang: "cpp",
    exampleCode: `#include <bits/stdc++.h>
using namespace std;

int main() {
    int age;
    string fullName;
    cin >> age;
    cin.ignore(); // xoa ky tu '\\n' con sot lai sau cin >>
    getline(cin, fullName);
    cout << fullName << " (" << age << " tuoi)\\n";
    return 0;
}`,
    mistakes: [
      "**Trộn `cin >>` với `getline` mà quên `cin.ignore()`** làm `getline` đọc phải chuỗi rỗng!",
      "**In chữ nhắc như `cout << \"Nhap n: \";` khi nộp bài chấm tự động** khiến hệ thống chấm báo `Wrong Answer`.",
    ],
    practice: {
      prompt: "Đọc một dòng chứa họ tên có dấu cách và 3 điểm số thực, sau đó in ra điểm trung bình làm tròn 2 chữ số thập phân.",
      hint: "Dùng `getline(cin, name)` đọc tên trước, sau đó `cin >> a >> b >> c` và in bằng `fixed << setprecision(2)`.",
    },
  },
  {
    id: "conditionals",
    title: "Câu lệnh điều kiện (if / else if / else & switch)",
    category: "C++ Cơ bản",
    language: "cpp",
    primaryTerms: ["if", "else", "switch", "dieu kien", "re nhanh", "toan tu 3 ngoi"],
    secondaryTerms: ["case", "break", "default", "tam giac"],
    summary:
      "Câu lệnh điều kiện giúp chương trình chọn nhánh thực thi phù hợp tùy theo biểu thức đúng (`true`) hay sai (`false`).",
    keyPoints: [
      "Dùng `if / else if / else` khi điều kiện là khoảng giá trị hoặc biểu thức logic phức tạp (`&&` VÀ, `||` HOẶC, `!` PHỦ ĐỊNH).",
      "Dùng `switch (x)` khi so sánh một biến nguyên/ký tự với nhiều giá trị cố định (`case 1:`, nhớ có `break;` ở cuối mỗi case!).",
      "Toán tử 3 ngôi gọn: `int m = (a > b) ? a : b;`.",
    ],
    exampleLang: "cpp",
    exampleCode: `#include <bits/stdc++.h>
using namespace std;

int main() {
    int score = 82;
    if (score >= 85) cout << "Gioi\\n";
    else if (score >= 70) cout << "Kha\\n";
    else if (score >= 50) cout << "Trung binh\\n";
    else cout << "Can co gang\\n";
    return 0;
}`,
    mistakes: [
      "**Dùng 1 dấu `=` thay vì `==` trong `if (a = 5)`:** đây là phép gán, không phải so sánh!",
      "**Quên `break;` trong `switch`** làm chương trình chạy xuyên xuống các `case` bên dưới (fall-through).",
      "**Viết `if (1 <= x <= 10)` trong C++ là SAI!** Phải tách thành `if (x >= 1 && x <= 10)`.",
    ],
    practice: {
      prompt: "Nhập một năm `Y`, kiểm tra xem `Y` có phải năm nhuận hay không (chia hết cho 400, hoặc chia hết cho 4 nhưng không chia hết cho 100).",
      hint: "Biểu thức điều kiện: `(y % 400 == 0) || (y % 4 == 0 && y % 100 != 0)`.",
    },
  },
  {
    id: "loops",
    title: "Vòng lặp trong C++ (for, while, do-while)",
    category: "C++ Cơ bản",
    language: "cpp",
    primaryTerms: ["vong lap", "for", "while", "do-while", "do while", "vong lap vo han", "break", "continue"],
    secondaryTerms: ["range for", "vong lap for", "vong lap while"],
    summary:
      "Vòng lặp giúp lặp đi lặp lại một khối lệnh mà không phải viết trùng code: **`for`** khi biết trước số lần lặp, **`while`** khi lặp theo điều kiện dừng, **`do-while`** khi muốn chạy ít nhất 1 lần.",
    keyPoints: [
      "`for (int i = 0; i < n; i++)` chạy chính xác `n` lần với `i = 0, 1, ..., n - 1`.",
      "`while (n > 0) { ... n /= 10; }` cực hay dùng để tách chữ số của một số nguyên.",
      "`break` thoát hẳn khỏi vòng lặp ngay lập tức; `continue` bỏ qua phần còn lại của lượt hiện tại để sang lượt tiếp theo.",
    ],
    exampleLang: "cpp",
    exampleCode: `#include <bits/stdc++.h>
using namespace std;

int main() {
    long long n = 2026, digitSum = 0;
    while (n > 0) {
        digitSum += n % 10; // lay chu so cuoi
        n /= 10;            // bo chu so cuoi (tranh lap vo han!)
    }
    cout << "Tong chu so = " << digitSum << "\\n"; // 10
    return 0;
}`,
    mistakes: [
      "**Vòng lặp vô hạn:** Quên cập nhật biến điều kiện trong `while`, hoặc đặt nhầm dấu `;` ngay sau `for (...);`.",
      "**Lỗi Off-by-one:** Nhầm `< n` với `<= n` làm chạy thừa hoặc thiếu 1 lượt.",
    ],
    practice: {
      prompt: "Nhập `N`, dùng vòng lặp `for` tính tổng các số chia hết cho 3 hoặc 5 trong đoạn `[1, N]`.",
      hint: "Dùng kiểu `long long` cho biến tổng `sum = 0`, kiểm tra `if (i % 3 == 0 || i % 5 == 0) sum += i;`.",
    },
  },
  {
    id: "array-1d",
    title: "Mảng 1 chiều trong C++ & Lỗi khởi tạo max = 0",
    category: "C++ Cơ bản",
    language: "cpp",
    primaryTerms: ["mang 1 chieu", "mang mot chieu", "mang so", "array", "max = 0", "lon nhat trong mang", "nho nhat trong mang", "khai bao mang"],
    secondaryTerms: ["chi so mang", "phan tu", "so am"],
    negativePatterns: [/mang\s+lai/, /mat\s+mang/],
    summary:
      "Mảng 1 chiều lưu một dãy liên tiếp các phần tử cùng kiểu dữ liệu, đánh chỉ số bắt đầu từ **`0` đến `n - 1`**.",
    keyPoints: [
      "**Truy cập phần tử `O(1)`:** `a[0]` là phần tử đầu tiên, `a[n - 1]` là phần tử cuối cùng.",
      "**Tìm Max/Min đúng với cả số âm:** Luôn khởi tạo `maxVal = a[0]` (hoặc `LLONG_MIN`) thay vì `0`!",
      "Trong C++ hiện đại, bạn có thể dùng `vector<int> a(n)` thay cho mảng tĩnh `int a[1000]` để linh hoạt kích thước.",
    ],
    exampleLang: "cpp",
    exampleCode: `#include <bits/stdc++.h>
using namespace std;

int main() {
    vector<int> a = {-10, -3, -7, -25};
    int maxVal = a[0]; // KHONG dat maxVal = 0 vi mang toan so am!
    for (int i = 1; i < (int)a.size(); i++) {
        if (a[i] > maxVal) maxVal = a[i];
    }
    cout << "Max = " << maxVal << "\\n"; // -3
    return 0;
}`,
    mistakes: [
      "**Khởi tạo `max = 0` với mảng toàn số âm:** Mọi phần tử đều `< 0` nên kết quả sai ra `0`!",
      "**Truy cập ngoài biên `a[n]`:** Gây lỗi bộ nhớ khó tìm (Undefined Behavior).",
    ],
    practice: {
      prompt: "Tìm phần tử **lớn thứ hai khác biệt** trong một mảng số nguyên (có thể chứa số âm và phần tử trùng lặp).",
      hint: "Duy trì hai biến `firstMax` và `secondMax` (có cờ kiểm tra tồn tại) trong 1 vòng lặp `O(N)`.",
    },
  },
  {
    id: "array-2d",
    title: "Mảng 2 chiều (Ma trận) trong C++",
    category: "C++ Cơ bản",
    language: "cpp",
    primaryTerms: ["mang 2 chieu", "mang hai chieu", "ma tran", "matrix", "bang 2d"],
    secondaryTerms: ["hang cot", "duong cheo"],
    summary:
      "Mảng 2 chiều là bảng gồm `R` hàng và `C` cột (`a[i][j]` là phần tử ở hàng `i`, cột `j`), thường dùng biểu diễn ma trận, bảng cờ hoặc bản đồ lưới.",
    keyPoints: [
      "**Khai báo linh hoạt:** `vector<vector<int>> a(R, vector<int>(C, 0));`",
      "**Duyệt 2 vòng lặp lồng nhau:** vòng ngoài duyệt hàng `i = 0..R-1`, vòng trong duyệt cột `j = 0..C-1`.",
      "**Mẹo 4 hướng kề trên lưới:** `int dx[] = {-1, 1, 0, 0}; int dy[] = {0, 0, -1, 1};` giúp duyệt 4 ô trên/dưới/trái/phải cực gọn.",
    ],
    exampleLang: "cpp",
    exampleCode: `#include <bits/stdc++.h>
using namespace std;

int main() {
    vector<vector<int>> m = {{1, 2, 3}, {4, 5, 6}, {7, 8, 9}};
    int diagSum = 0;
    for (int i = 0; i < 3; i++) diagSum += m[i][i]; // duong cheo chinh
    cout << "Tong duong cheo chinh = " << diagSum << "\\n"; // 15
    return 0;
}`,
    mistakes: [
      "Nhầm thứ tự `[cột][hàng]` thay vì `[hàng][cột]` dẫn tới vượt biên khi `R != C`.",
    ],
    practice: {
      prompt: "Nhập ma trận `R × C`, tính tổng từng hàng và tìm hàng có tổng lớn nhất.",
      hint: "Reset `long long rowSum = 0;` ở đầu mỗi vòng lặp hàng `i`.",
    },
  },
  {
    id: "string-cpp",
    title: "Xâu ký tự (std::string) trong C++",
    category: "C++ Cơ bản",
    language: "cpp",
    primaryTerms: ["string", "xau", "chuoi", "xau ky tu", "palindrome", "doi xung", "substr", "stringstream"],
    secondaryTerms: ["tolower", "toupper", "stoi", "to_string", "anagram"],
    summary:
      "`std::string` là kiểu chuỗi hiện đại của C++ hỗ trợ nối chuỗi (`+`), so sánh (`==`, `<`), cắt chuỗi (`substr`), đảo ngược (`reverse`) và biến đổi ký tự rất tiện lợi.",
    keyPoints: [
      "**Thao tác hay dùng:** `s.size()`, `s.substr(pos, len)`, `s.find(\"abc\") != string::npos`, `s.push_back(c)`, `reverse(s.begin(), s.end())`.",
      "**Chuyển đổi số ↔ chuỗi:** `to_string(123)` → `\"123\"`; `stoll(\"123456789012\")` → `long long`.",
      "**Tách từ bằng `stringstream`:** `stringstream ss(line); while (ss >> word) { ... }`.",
      "**Chuyển ký tự chữ số sang số:** `int d = ch - '0';` (vì mã ASCII của `'0'` là `48`).",
    ],
    exampleLang: "cpp",
    exampleCode: `#include <bits/stdc++.h>
using namespace std;

int main() {
    string s = "madam";
    string rev = s;
    reverse(rev.begin(), rev.end());
    cout << (s == rev ? "Chuoi doi xung" : "Khong doi xung") << "\\n";
    return 0;
}`,
    mistakes: [
      "Lấy `ch - 0` thay vì `ch - '0'` khi đổi ký tự `'5'` thành số `5` (`'5'` có mã ASCII `53`).",
      "Dùng `s = s + c;` trong vòng lặp dài có thể chậm `O(N²)`; hãy dùng `s += c;` hoặc `s.push_back(c);` (`O(1)` amortized).",
    ],
    practice: {
      prompt: "Nhập một câu gồm nhiều từ, đếm số từ và in ra từ dài nhất trong câu.",
      hint: "Dùng `getline(cin, line)` rồi tách từng từ bằng `stringstream ss(line)`.",
    },
  },
  {
    id: "functions-ref",
    title: "Hàm, Truyền tham trị vs Truyền tham chiếu (&) trong C++",
    category: "C++ Cơ bản",
    language: "cpp",
    primaryTerms: ["ham", "function", "tham tri", "tham chieu", "truyen tham chieu", "void", "return"],
    secondaryTerms: ["&", "const &", "swap"],
    summary:
      "Hàm giúp chia chương trình lớn thành các khối nhỏ tái sử dụng được. Hiểu rõ **tham trị** (bản sao) và **tham chiếu `&`** (thao tác trực tiếp biến gốc) là nền tảng cực quan trọng trong C++.",
    keyPoints: [
      "**Truyền tham trị (`int x`):** Hàm nhận *bản sao* của biến gốc — thay đổi trong hàm không ảnh hưởng bên ngoài.",
      "**Truyền tham chiếu (`int &x`):** Hàm trỏ trực tiếp tới ô nhớ biến gốc — thay đổi trong hàm sẽ cập nhật ngay biến gốc (ví dụ hàm `swap(a, b)`).",
      "**Tối ưu tốc độ với `const vector<int> &a`:** Truyền `vector`/`string` lớn vào hàm luôn nên thêm `&` (hoặc `const &`) để không tốn thời gian sao chép toàn bộ mảng!",
    ],
    exampleLang: "cpp",
    exampleCode: `#include <bits/stdc++.h>
using namespace std;

void tangThamTri(int x) { x += 10; }
void tangThamChieu(int &x) { x += 10; }

int main() {
    int a = 5;
    tangThamTri(a);   // a van la 5
    tangThamChieu(a); // a thanh 15
    cout << a << "\\n";
    return 0;
}`,
    mistakes: [
      "Quên lệnh `return` ở một nhánh `if/else` trong hàm khác `void`.",
      "Truyền `vector<int> a` không có `&` vào hàm đệ quy khiến chương trình bị **TLE** do copy cả vector ở mỗi lần gọi!",
    ],
    practice: {
      prompt: "Viết hàm `void hoanDoi(long long &a, long long &b)` tự hoán đổi 2 số mà không dùng `std::swap`.",
      hint: "Dùng biến trung gian `long long tmp = a; a = b; b = tmp;`.",
    },
  },
  {
    id: "pointers",
    title: "Con trỏ (Pointer) & Địa chỉ bộ nhớ trong C++",
    category: "C++ Cơ bản",
    language: "cpp",
    primaryTerms: ["con tro", "pointer", "nullptr", "dia chi", "new", "delete", "bo nho dong"],
    secondaryTerms: ["*", "&", "dereference", "smart pointer"],
    summary:
      "**Con trỏ (`int *p`)** là biến đặc biệt dùng để lưu **địa chỉ ô nhớ** của một biến khác thay vì lưu trực tiếp giá trị.",
    keyPoints: [
      "`&x` lấy **địa chỉ** của biến `x`; `*p` lấy **giá trị** nằm tại địa chỉ mà `p` đang trỏ tới (dereference).",
      "Luôn khởi tạo con trỏ chưa dùng bằng `nullptr` (đừng để con trỏ rác / wild pointer!).",
      "Trong C++ hiện đại, ưu tiên dùng tham chiếu `&`, `vector`, và con trỏ thông minh (`unique_ptr`, `shared_ptr`) thay vì `new`/`delete` thủ công để tránh rò rỉ bộ nhớ (memory leak).",
    ],
    exampleLang: "cpp",
    exampleCode: `#include <bits/stdc++.h>
using namespace std;

int main() {
    int x = 42;
    int *p = &x;
    *p = 100; // thay doi truc tiep gia tri cua x thong qua con tro p
    cout << "x = " << x << ", *p = " << *p << "\\n";
    return 0;
}`,
    mistakes: [
      "**Dereference `nullptr` (`*p` khi `p == nullptr`):** Gây crash ngay lập tức (Segmentation Fault / Runtime Error).",
      "Nhầm dấu `*` khi khai báo (`int *p`) với toán tử giải tham chiếu (`*p = 10`).",
    ],
    practice: {
      prompt: "Khai báo 2 biến `a = 10, b = 20`, dùng 1 con trỏ `int *ptr` lần lượt trỏ tới `a` và `b` để nhân đôi giá trị cả hai biến.",
      hint: "Gán `ptr = &a; *ptr *= 2;` rồi `ptr = &b; *ptr *= 2;`.",
    },
  },
  {
    id: "struct-oop",
    title: "Struct & Lập trình hướng đối tượng (OOP: Class, Kế thừa, Đa hình)",
    category: "C++ Cơ bản",
    language: "cpp",
    primaryTerms: ["struct", "class", "oop", "huong doi tuong", "ke thua", "da hinh", "dong goi", "constructor"],
    secondaryTerms: ["public", "private", "object", "method", "virtual"],
    summary:
      "`struct` và `class` cho phép gom nhiều thuộc tính liên quan (như `name`, `score`, `id` của một học viên) thành một kiểu dữ liệu tùy chỉnh kèm các hàm xử lý đi kèm.",
    keyPoints: [
      "**Khác biệt duy nhất giữa `struct` và `class`:** Mặc định thành viên của `struct` là `public`, còn của `class` là `private`.",
      "**4 tính chất OOP:** Đóng gói (Encapsulation — `private`/`public`), Kế thừa (Inheritance — `class B : public A`), Đa hình (Polymorphism — `virtual` / `override`), Trừu tượng (Abstraction).",
      "**Sắp xếp mảng `struct`:** Viết hàm so sánh `bool cmp(const Student &a, const Student &b)` hoặc lambda truyền vào `sort()`.",
    ],
    exampleLang: "cpp",
    exampleCode: `#include <bits/stdc++.h>
using namespace std;

struct Student {
    string name;
    double gpa;
};

int main() {
    vector<Student> list = {{"Binh", 3.4}, {"An", 3.9}, {"Chi", 3.9}};
    sort(list.begin(), list.end(), [](const Student &a, const Student &b) {
        if (a.gpa != b.gpa) return a.gpa > b.gpa; // GPA giam dan
        return a.name < b.name;                   // cung GPA -> ten tang dan
    });
    for (const auto &s : list) cout << s.name << " - " << s.gpa << "\\n";
    return 0;
}`,
    mistakes: [
      "Quên dấu chấm phẩy `;` ngay sau dấu `}` đóng của `struct` hoặc `class`!",
      "Trong hàm `cmp(a, b)` của `std::sort`, dùng `>=` hoặc `<=` thay vì `>` / `<` (vi phạm Strict Weak Ordering, gây crash với mảng lớn!).",
    ],
    practice: {
      prompt: "Tạo `struct Book { string title; int price; };`, nhập `N` cuốn sách và sắp xếp theo giá tăng dần.",
      hint: "Dùng `sort` với lambda `[](const Book &a, const Book &b) { return a.price < b.price; }`.",
    },
  },

  // ===================== ALGORITHMS =====================
  {
    id: "recursion",
    title: "Đệ quy (Recursion) trong C++",
    category: "Thuật toán",
    language: "cpp",
    primaryTerms: ["de quy", "recursion", "fibonacci", "giai thua", "stack overflow", "quay lui", "backtracking"],
    secondaryTerms: ["base case", "dieu kien dung", "nho hoa", "memoization"],
    summary:
      "**Đệ quy** là kỹ thuật một hàm tự gọi lại chính nó với bài toán con nhỏ hơn. Mọi hàm đệ quy đúng đều BẮT BUỘC có 2 phần: **Điều kiện dừng (Base Case)** và **Bước thu nhỏ bài toán (Recursive Step)**.",
    keyPoints: [
      "**Base case:** Trường hợp nhỏ nhất trả kết quả ngay (ví dụ `n <= 1` trả `1`) để dừng chuỗi gọi hàm.",
      "**Cảnh báo hiệu năng:** Đệ quy thuần `fib(n) = fib(n-1) + fib(n-2)` chậm `O(2^N)` vì tính lặp lại hàng triệu lần! Dùng **nhớ hóa (Memoization)** hoặc vòng lặp DP sẽ giảm xuống `O(N)`.",
      "**Tránh tràn Stack:** Không gọi đệ quy quá sâu (`> 10⁵` tầng) và luôn truyền mảng/vector bằng tham chiếu `&`.",
    ],
    exampleLang: "cpp",
    exampleCode: `#include <bits/stdc++.h>
using namespace std;

long long factorial(int n) {
    if (n <= 1) return 1;      // Dieu kien dung
    return n * factorial(n - 1); // Thu nho bai toan
}

int main() {
    cout << "5! = " << factorial(5) << "\\n"; // 120
    return 0;
}`,
    mistakes: [
      "Thiếu hoặc viết sai điều kiện dừng dẫn tới đệ quy vô tận → **Stack Overflow / Runtime Error**.",
      "Tính `n!` với `n > 20` bằng `long long` sẽ bị tràn số (`20! ≈ 2.43 × 10¹⁸`).",
    ],
    practice: {
      prompt: "Viết hàm đệ quy tính tổng chữ số của số nguyên dương `n` (không dùng vòng lặp).",
      hint: "Base case: `if (n < 10) return n;`, bước đệ quy: `return (n % 10) + digitSum(n / 10);`.",
    },
  },
  {
    id: "sorting",
    title: "Thuật toán Sắp xếp & std::sort trong C++",
    category: "Thuật toán",
    language: "cpp",
    primaryTerms: ["sap xep", "sort", "std::sort", "bubble sort", "merge sort", "quick sort", "comparator"],
    secondaryTerms: ["giam dan", "tang dan", "greater", "o(n log n)"],
    summary:
      "Sắp xếp giúp đưa dữ liệu về trật tự tăng/giảm dần để dễ tìm kiếm nhị phân, tham lam hoặc gom nhóm. Trong thực tế C++, **`std::sort`** chạy `O(N log N)` rất nhanh.",
    keyPoints: [
      "**Tăng dần:** `sort(a.begin(), a.end());`",
      "**Giảm dần:** `sort(a.begin(), a.end(), greater<int>());` hoặc `sort(a.rbegin(), a.rend());`.",
      "**Tùy biến tiêu chí (Comparator):** Truyền hàm/lambda trả về `true` khi `a` nên đứng **trước** `b` (luôn dùng `<` hoặc `>`, KHÔNG dùng `<=`/`>=`).",
      "**So sánh thuật toán cơ bản:** Bubble/Selection/Insertion Sort (`O(N²)`, dễ hiểu cho mảng nhỏ `N <= 2000`) vs Merge/Quick/IntroSort (`O(N log N)`, chạy mượt `N = 10⁶`).",
    ],
    exampleLang: "cpp",
    exampleCode: `#include <bits/stdc++.h>
using namespace std;

int main() {
    vector<int> a = {-5, 2, -1, 4, -3};
    // Sap xep theo gia tri tuyet doi tang dan
    sort(a.begin(), a.end(), [](int x, int y) {
        return abs(x) < abs(y);
    });
    for (int x : a) cout << x << " "; // -1 2 -3 4 -5
    return 0;
}`,
    mistakes: [
      "Viết `return x <= y;` trong comparator của `std::sort` — khi có nhiều phần tử bằng nhau sẽ gây crash!",
      "Sắp xếp mảng tĩnh `int a[n]` mà viết sai cận cuối: phải là `sort(a, a + n)` (không phải `a + n - 1`).",
    ],
    practice: {
      prompt: "Sắp xếp một mảng số nguyên sao cho tất cả số chẵn đứng trước (tăng dần), số lẻ đứng sau (giảm dần).",
      hint: "Trong comparator: nếu tính chẵn lẻ khác nhau thì số chẵn đứng trước (`x % 2 == 0`); nếu cùng chẵn thì `x < y`, cùng lẻ thì `x > y`.",
    },
  },
  {
    id: "binary-search",
    title: "Tìm kiếm nhị phân (Binary Search) & lower_bound / upper_bound",
    category: "Thuật toán",
    language: "cpp",
    primaryTerms: ["tim kiem nhi phan", "binary search", "lower_bound", "upper_bound", "chat nhi phan"],
    secondaryTerms: ["o(log n)", "mid", "sap xep"],
    summary:
      "**Tìm kiếm nhị phân** chia đôi không gian tìm kiếm ở mỗi bước để tìm phần tử trong **`O(log N)`** (chỉ ~20 bước cho mảng 1 triệu phần tử!). Điều kiện tiên quyết: mảng phải **đã được sắp xếp** (hoặc hàm điều kiện đơn điệu).",
    keyPoints: [
      "**Tính `mid` chống tràn số:** luôn viết `int mid = l + (r - l) / 2;` thay vì `(l + r) / 2`.",
      "**STL có sẵn:** `lower_bound(a.begin(), a.end(), x)` trả về vị trí đầu tiên `>= x`; `upper_bound(...)` trả về vị trí đầu tiên `> x`.",
      "**Đếm số lần xuất hiện của `x` trong mảng đã sắp xếp:** `upper_bound(...) - lower_bound(...)` chỉ tốn `O(log N)`!",
    ],
    exampleLang: "cpp",
    exampleCode: `#include <bits/stdc++.h>
using namespace std;

int main() {
    vector<int> a = {1, 3, 5, 7, 9, 11};
    int target = 7, l = 0, r = (int)a.size() - 1, ans = -1;
    while (l <= r) {
        int mid = l + (r - l) / 2;
        if (a[mid] == target) { ans = mid; break; }
        else if (a[mid] < target) l = mid + 1;
        else r = mid - 1;
    }
    cout << "Vi tri tim thay: " << ans << "\\n"; // 3
    return 0;
}`,
    mistakes: [
      "Quên sắp xếp mảng trước khi áp dụng tìm kiếm nhị phân.",
      "Cập nhật `l = mid` hoặc `r = mid` không cẩn thận dẫn đến vòng lặp vô hạn khi `r - l == 1`.",
    ],
    practice: {
      prompt: "Cho mảng đã sắp xếp có phần tử trùng lặp, hãy tìm vị trí xuất hiện **đầu tiên** và **cuối cùng** của giá trị `X`.",
      hint: "Dùng `lower_bound` cho vị trí đầu tiên và `upper_bound - 1` cho vị trí cuối cùng (kiểm tra xem `a[pos] == X`).",
    },
  },
  {
    id: "prime-sieve",
    title: "Số nguyên tố & Sàng Eratosthenes",
    category: "Thuật toán",
    language: "cpp",
    primaryTerms: ["so nguyen to", "nguyen to", "prime", "sang eratosthenes", "sang nguyen to", "sieve"],
    secondaryTerms: ["uoc so", "can bac hai", "thua so nguyen to"],
    summary:
      "Số nguyên tố là số nguyên `>= 2` chỉ chia hết cho `1` và chính nó. Kiểm tra 1 số dùng vòng lặp tới `√N` (`O(√N)`), còn tìm mọi số nguyên tố `<= N` dùng **Sàng Eratosthenes (`O(N log log N)`)**.",
    keyPoints: [
      "**Kiểm tra 1 số `n`:** Nếu `n < 2` là `false`; duyệt `i = 2` đến `i * i <= n` (dùng `long long i` hoặc `i <= n / i` để tránh tràn số!).",
      "**Sàng Eratosthenes:** Đánh dấu `isPrime[0] = isPrime[1] = false`, với mỗi `p` còn là nguyên tố thì gạch toàn bộ bội `p*p, p*p + p, ... <= N`.",
    ],
    exampleLang: "cpp",
    exampleCode: `#include <bits/stdc++.h>
using namespace std;

bool isPrime(long long n) {
    if (n < 2) return false;
    for (long long i = 2; i * i <= n; i++) {
        if (n % i == 0) return false;
    }
    return true;
}

int main() {
    for (int x : {1, 2, 17, 25})
        cout << x << ": " << (isPrime(x) ? "NT" : "Khong") << "\\n";
    return 0;
}`,
    mistakes: [
      "Quên loại `n < 2` (số `0`, `1` và số âm KHÔNG phải số nguyên tố!).",
      "Dùng `int i; i * i <= n` khi `n` gần `2×10⁹` làm `i * i` bị tràn `int`! Hãy dùng `long long i`.",
    ],
    practice: {
      prompt: "Đếm số lượng số nguyên tố trong đoạn `[L, R]` với `1 <= L <= R <= 10⁶`.",
      hint: "Dùng Sàng Eratosthenes 1 lần tới `R`, sau đó đếm các số `isPrime[x] == true` từ `L` đến `R`.",
    },
  },
  {
    id: "gcd-lcm-math",
    title: "ƯCLN (GCD Euclid), BCNN (LCM) & Lũy thừa nhị phân",
    category: "Thuật toán",
    language: "cpp",
    primaryTerms: ["ucln", "bcnn", "gcd", "lcm", "euclid", "luy thua nhi phan", "modulo", "chia lay du"],
    secondaryTerms: ["toan hoc", "std::gcd", "powmod"],
    summary:
      "Thuật toán **Euclid** tìm Ước chung lớn nhất `gcd(a, b)` cực nhanh chỉ trong `O(log(min(a, b)))`, và trong C++17 bạn còn có sẵn `std::gcd(a, b)` và `std::lcm(a, b)`!",
    keyPoints: [
      "**Thuật toán Euclid:** `while (b != 0) { long long r = a % b; a = b; b = r; } return a;`",
      "**Tính BCNN chống tràn số:** Luôn chia trước rồi mới nhân: `lcm = (a / gcd(a, b)) * b` (KHÔNG viết `a * b / gcd(a, b)`!).",
      "**Lũy thừa nhị phân `(a^b) % mod`:** Chỉ tốn `O(log b)` bằng cách bình phương `a` và chia đôi `b` mỗi bước.",
    ],
    exampleLang: "cpp",
    exampleCode: `#include <bits/stdc++.h>
using namespace std;

int main() {
    long long a = 24, b = 36;
    long long g = std::gcd(a, b);
    long long l = (a / g) * b;
    cout << "UCLN = " << g << ", BCNN = " << l << "\\n"; // 12, 72
    return 0;
}`,
    mistakes: [
      "Tính `a * b / gcd(a, b)` khi `a, b ≈ 10¹²` khiến `a * b` tràn `long long` ngay cả khi BCNN vẫn nằm gọn trong `long long`.",
    ],
    practice: {
      prompt: "Rút gọn phân số `a / b` về tối giản bằng `std::gcd`.",
      hint: "Chia cả tử `a` và mẫu `b` cho `g = std::gcd(abs(a), abs(b))`.",
    },
  },
  {
    id: "prefix-sum",
    title: "Mảng cộng dồn (Prefix Sum) — Truy vấn tổng đoạn O(1)",
    category: "Thuật toán",
    language: "cpp",
    primaryTerms: ["prefix sum", "mang cong don", "tong doan", "truy van tong"],
    secondaryTerms: ["[l, r]", "o(1)", "cong don"],
    summary:
      "**Prefix Sum** tiền xử lý mảng `pref[i]` = tổng `i` phần tử đầu tiên (`O(N)`), sau đó mọi truy vấn tính tổng đoạn `[L, R]` đều trả lời ngay lập tức trong **`O(1)`**!",
    keyPoints: [
      "**Công thức (đánh chỉ số từ 1):** `pref[0] = 0; pref[i] = pref[i - 1] + a[i];`",
      "**Tổng từ vị trí `L` đến `R` (1-indexed):** `sum(L, R) = pref[R] - pref[L - 1]`.",
      "Giúp hạ độ phức tạp từ `O(N × Q)` (bị TLE) xuống **`O(N + Q)`**.",
    ],
    exampleLang: "cpp",
    exampleCode: `#include <bits/stdc++.h>
using namespace std;

int main() {
    vector<long long> a = {0, 3, 2, 5, 1, 4}; // 1-indexed
    vector<long long> pref(a.size(), 0);
    for (int i = 1; i < (int)a.size(); i++) pref[i] = pref[i - 1] + a[i];
    // Tong doan [2, 4] = 2 + 5 + 1 = 8
    cout << pref[4] - pref[1] << "\\n";
    return 0;
}`,
    mistakes: [
      "Dùng `int` cho mảng `pref` thay vì `long long` (dù từng phần tử `a[i]` nhỏ, tổng `10⁵` phần tử vẫn dễ tràn `int`!).",
    ],
    practice: {
      prompt: "Cho mảng `N` số và `Q` truy vấn `[L, R]`, in ra tổng đoạn tương ứng cho mỗi truy vấn.",
      hint: "Tạo `vector<long long> pref(n + 1, 0)` rồi mỗi truy vấn in `pref[r] - pref[l - 1]`.",
    },
  },
  {
    id: "two-pointers",
    title: "Kỹ thuật Hai con trỏ (Two Pointers) & Cửa sổ trượt (Sliding Window)",
    category: "Thuật toán",
    language: "cpp",
    primaryTerms: ["hai con tro", "two pointers", "two pointer", "sliding window", "cua so truot", "two sum"],
    secondaryTerms: ["day con", "o(n)"],
    summary:
      "**Hai con trỏ** dùng 2 chỉ số `l` và `r` di chuyển đơn điệu trên mảng/chuỗi để giảm 2 vòng lặp lồng nhau `O(N²)` xuống chỉ còn **`O(N)`**.",
    keyPoints: [
      "**Dạng 1 (Ngược chiều `l = 0, r = n - 1`):** Tìm cặp có tổng bằng `K` trên mảng đã sắp xếp, kiểm tra chuỗi đối xứng.",
      "**Dạng 2 (Cùng chiều — Sliding Window):** Mở rộng `r` để thêm phần tử, co `l` khi điều kiện bị vi phạm — rất mạnh cho bài *đoạn con dài nhất/ngắn nhất có tổng <= S* hoặc *chuỗi con không lặp ký tự*.",
      "**Bài Two Sum mảng chưa sắp xếp:** Dùng `unordered_map` lưu `(giá trị -> chỉ số)` để tra `K - a[i]` trong `O(1)`!",
    ],
    exampleLang: "cpp",
    exampleCode: `#include <bits/stdc++.h>
using namespace std;

int main() {
    vector<int> a = {2, 1, 5, 1, 3, 2};
    int S = 7, l = 0, sum = 0, bestLen = 0;
    for (int r = 0; r < (int)a.size(); r++) {
        sum += a[r];
        while (sum > S) sum -= a[l++];
        bestLen = max(bestLen, r - l + 1);
    }
    cout << "Doan dai nhat tong <= 7: " << bestLen << "\\n"; // 3 ([1,5,1] hoac [1,3,2])
    return 0;
}`,
    mistakes: [
      "Áp dụng Sliding Window co `l` khi mảng có **số âm** (tổng không còn đơn điệu khi co/mở cửa sổ — khi có số âm hãy dùng Prefix Sum + `map`!).",
    ],
    practice: {
      prompt: "Tìm độ dài đoạn con liên tiếp ngắn nhất có tổng `>= S` trên mảng các số nguyên dương.",
      hint: "Mở rộng `r`, chừng nào `sum >= S` thì cập nhật `ans = min(ans, r - l + 1)` rồi trừ `a[l++]`.",
    },
  },
  {
    id: "kadane-subarray",
    title: "Thuật toán Kadane — Dãy con liên tiếp có tổng lớn nhất",
    category: "Thuật toán",
    language: "cpp",
    primaryTerms: ["kadane", "day con lien tiep", "tong lon nhat", "maximum subarray"],
    secondaryTerms: ["subarray", "doan con", "o(n)"],
    summary:
      "**Thuật toán Kadane** tìm tổng lớn nhất của một đoạn con liên tiếp (khác rỗng) trong đúng **`O(N)`** thời gian và `O(1)` bộ nhớ.",
    keyPoints: [
      "Tại mỗi phần tử `x = a[i]`, ta có 2 lựa chọn: **bắt đầu đoạn mới** từ `x`, hoặc **nối tiếp** vào đoạn kết thúc tại `i - 1` (`cur = max(x, cur + x)`).",
      "Cập nhật đáp án toàn cục `best = max(best, cur)` sau mỗi bước.",
      "Khởi tạo `cur = best = a[0]` giúp xử lý hoàn hảo cả trường hợp mảng toàn số âm!",
    ],
    exampleLang: "cpp",
    exampleCode: `#include <bits/stdc++.h>
using namespace std;

int main() {
    vector<long long> a = {-2, 1, -3, 4, -1, 2, 1, -5, 4};
    long long cur = a[0], best = a[0];
    for (int i = 1; i < (int)a.size(); i++) {
        cur = max(a[i], cur + a[i]);
        best = max(best, cur);
    }
    cout << "Max subarray sum = " << best << "\\n"; // 6 ([4,-1,2,1])
    return 0;
}`,
    mistakes: [
      "Đặt `best = 0` khiến mảng toàn số âm trả về `0` thay vì số âm lớn nhất.",
    ],
    practice: {
      prompt: "Thử mở rộng Kadane để in ra luôn chỉ số bắt đầu `L` và kết thúc `R` của đoạn con lớn nhất.",
      hint: "Lưu thêm biến `tempStart`: mỗi khi `a[i] > cur + a[i]` thì cập nhật `tempStart = i`.",
    },
  },
  {
    id: "dp-intro",
    title: "Quy hoạch động (Dynamic Programming — DP)",
    category: "Thuật toán",
    language: "cpp",
    primaryTerms: ["quy hoach dong", "dp", "dynamic programming", "cai tui", "knapsack", "lis", "day con tang dai nhat"],
    secondaryTerms: ["trang thai", "chuyen trang thai", "memoization", "bai toan con"],
    summary:
      "**Quy hoạch động (DP)** giải bài toán lớn bằng cách chia thành các bài toán con gối nhau và **lưu lại kết quả** vào mảng `dp[]` để không bao giờ phải tính lại.",
    keyPoints: [
      "**4 bước thiết kế mọi bài DP:** (1) Định nghĩa ý nghĩa trạng thái `dp[i]`, (2) Tìm trường hợp cơ sở (base case), (3) Viết công thức chuyển trạng thái, (4) Xác định thứ tự tính và vị trí đáp án.",
      "**Ví dụ kinh điển cho người mới:** Đếm cách leo cầu thang (`dp[i] = dp[i-1] + dp[i-2]`), Đổi tiền ít tờ nhất (`dp[s] = min(dp[s - c] + 1)`), Cái túi 0/1 Knapsack, Dãy con tăng dài nhất (LIS).",
    ],
    exampleLang: "cpp",
    exampleCode: `#include <bits/stdc++.h>
using namespace std;

int main() {
    // So cach leo n bac thang, moi buoc 1 hoac 2 bac
    int n = 10;
    vector<long long> dp(n + 1, 0);
    dp[0] = 1; dp[1] = 1;
    for (int i = 2; i <= n; i++) dp[i] = dp[i - 1] + dp[i - 2];
    cout << "So cach leo " << n << " bac: " << dp[n] << "\\n"; // 89
    return 0;
}`,
    mistakes: [
      "Bỏ qua bước **định nghĩa rõ `dp[i]` đại diện cho cái gì** bằng lời trước khi viết công thức.",
      "Trong 0/1 Knapsack tối ưu mảng 1 chiều `dp[w]`, duyệt `w` từ nhỏ tới lớn thay vì **từ lớn về nhỏ** (sẽ vô tình dùng 1 món đồ nhiều lần!).",
    ],
    practice: {
      prompt: "Cho các mệnh giá xu `{1, 3, 4}` và số tiền `S`. Tìm số lượng đồng xu ít nhất để tạo đúng tổng `S`.",
      hint: "Đặt `dp[s]` = số xu ít nhất tạo tổng `s` (khởi tạo `INF`, `dp[0] = 0`). Với mỗi `s`, thử `dp[s] = min(dp[s], dp[s - coin] + 1)`.",
    },
  },
  {
    id: "greedy",
    title: "Thuật toán Tham lam (Greedy)",
    category: "Thuật toán",
    language: "cpp",
    primaryTerms: ["tham lam", "greedy"],
    secondaryTerms: ["chon lich", "toi uu cuc bo", "sap xep"],
    summary:
      "**Thuật toán Tham lam (Greedy)** luôn đưa ra quyết định **tốt nhất tại thời điểm hiện tại** với kỳ vọng dẫn đến kết quả tối ưu toàn cục (thường kết hợp với `sort` hoặc `priority_queue`).",
    keyPoints: [
      "**Bài toán kinh điển:** Chọn nhiều cuộc họp không trùng nhau nhất (luôn sắp xếp theo **thời điểm kết thúc tăng dần**!), Nối dây min-heap, Sắp xếp công việc.",
      "**Lưu ý quan trọng:** Tham lam KHÔNG phải lúc nào cũng đúng (ví dụ đổi xu `{1, 3, 4}` cho tổng `6`: tham lam lấy `4+1+1` = 3 xu, trong khi DP lấy `3+3` = 2 xu!). Luôn thử phản ví dụ trước khi cài Greedy.",
    ],
    exampleLang: "cpp",
    exampleCode: `#include <bits/stdc++.h>
using namespace std;

int main() {
    // Chon nhieu cuoc hop (start, end) khong chong cheo nhat
    vector<pair<int,int>> a = {{1, 4}, {3, 5}, {0, 6}, {5, 7}, {8, 9}};
    sort(a.begin(), a.end(), [](auto &x, auto &y){ return x.second < y.second; });
    int cnt = 0, lastEnd = -1;
    for (auto &[s, e] : a) {
        if (s >= lastEnd) { cnt++; lastEnd = e; }
    }
    cout << "Toi da: " << cnt << " cuoc hop\\n"; // 3
    return 0;
}`,
    mistakes: [
      "Sắp xếp bài chọn lịch theo thời gian bắt đầu hoặc độ dài ngắn nhất thay vì **thời điểm kết thúc sớm nhất**.",
    ],
    practice: {
      prompt: "Cho `N` món đồ có giá khác nhau và ngân sách `B`. Hãy mua được nhiều món đồ nhất có thể.",
      hint: "Sắp xếp giá tăng dần rồi mua lần lượt từ món rẻ nhất cho đến khi hết tiền!",
    },
  },
  {
    id: "graph-bfs-dfs",
    title: "Đồ thị: Danh sách kề, BFS & DFS trong C++",
    category: "Thuật toán",
    language: "cpp",
    primaryTerms: ["do thi", "graph", "bfs", "dfs", "duyet chieu rong", "duyet chieu sau", "danh sach ke", "dijkstra"],
    secondaryTerms: ["dinh do thi", "canh do thi", "thanh phan lien thong", "duong di ngan nhat"],
    summary:
      "Đồ thị gồm các **đỉnh (vertices)** và **cạnh (edges)**, thường lưu bằng **danh sách kề** `vector<vector<int>> adj(n + 1)`. **BFS** (dùng `queue`) tìm đường đi ngắn nhất không trọng số; **DFS** (đệ quy/stack) dùng kiểm tra liên thông, chu trình và duyệt cây.",
    keyPoints: [
      "**Độ phức tạp cả BFS và DFS:** `O(V + E)` (số đỉnh + số cạnh).",
      "**Khi nào dùng BFS?** Tìm số bước ít nhất từ ô/đỉnh `A` tới `B` trên đồ thị không trọng số hoặc mê cung lưới.",
      "**Khi nào dùng DFS?** Đếm số thành phần liên thông, tìm chu trình, sắp xếp Topo, duyệt cây.",
    ],
    exampleLang: "cpp",
    exampleCode: `#include <bits/stdc++.h>
using namespace std;

int main() {
    int n = 4;
    vector<vector<int>> adj(n + 1);
    adj[1] = {2, 3}; adj[2] = {1, 4}; adj[3] = {1}; adj[4] = {2};

    vector<int> dist(n + 1, -1);
    queue<int> q;
    dist[1] = 0; q.push(1);
    while (!q.empty()) {
        int u = q.front(); q.pop();
        for (int v : adj[u]) {
            if (dist[v] == -1) {
                dist[v] = dist[u] + 1;
                q.push(v);
            }
        }
    }
    cout << "Khoang cach 1 -> 4: " << dist[4] << "\\n"; // 2
    return 0;
}`,
    mistakes: [
      "Quên đánh dấu `visited[v] = true` ngay **lúc đẩy vào queue** trong BFS (nếu đợi lúc lấy ra mới đánh dấu, cùng 1 đỉnh bị đẩy vào queue nhiều lần gây TLE/MLE!).",
    ],
    practice: {
      prompt: "Cho đồ thị vô hướng `N` đỉnh, `M` cạnh. Hãy đếm xem đồ thị có bao nhiêu thành phần liên thông.",
      hint: "Duyệt `u = 1..N`: nếu `!vis[u]`, tăng `components++` và gọi `dfs(u)` (hoặc `bfs(u)`) để thăm toàn bộ vùng đó.",
    },
  },
  {
    id: "big-o-complexity",
    title: "Độ phức tạp thuật toán (Big-O) & Cách tránh TLE",
    category: "Thuật toán",
    language: "cpp",
    primaryTerms: ["big o", "big-o", "do phuc tap", "tle", "qua thoi gian", "toi uu", "o(n)", "o(n^2)", "o(log n)"],
    secondaryTerms: ["thoi gian chay", "10^5", "10^6"],
    summary:
      "**Ký hiệu Big-O** đánh giá tốc độ tăng số phép toán của thuật toán theo kích thước dữ liệu `N`. Quy tắc vàng trong C++: máy tính chạy được khoảng **`10⁸` phép toán cơ bản mỗi giây**.",
    keyPoints: [
      "`N <= 20`: có thể dùng quay lui / đệ quy `O(2^N)`.",
      "`N <= 2,000`: thuật toán `O(N²)` (2 vòng lặp lồng nhau) vẫn chạy tốt.",
      "`N <= 200,000 (2×10⁵)`: BẮT BUỘC dùng `O(N log N)` (`sort`, `map`, `set`, tìm kiếm nhị phân) hoặc `O(N)` (Prefix Sum, 2 con trỏ, `unordered_map`).",
      "`N <= 10¹⁸`: phải dùng công thức `O(1)` hoặc `O(log N)` (chặt nhị phân, lũy thừa nhị phân).",
    ],
    mistakes: [
      "Dùng 2 vòng lặp lồng nhau `O(N²)` khi đề cho `N = 10⁵` (`10¹⁰` phép toán → chắc chắn TLE!).",
    ],
    practice: {
      prompt: "Nếu một bài toán cho `N = 100,000` và giới hạn `1 giây`, bạn nên chọn thuật toán độ phức tạp tối đa là bao nhiêu?",
      hint: "Với `N = 10⁵`, `O(N²)` mất `10¹⁰` bước (TLE), còn `O(N log N)` chỉ khoảng `1.7 × 10⁶` bước (rất nhanh!).",
    },
  },

  // ===================== WEB: HTML / CSS / JAVASCRIPT =====================
  {
    id: "html-basics",
    title: "HTML5 Cơ bản & Semantic HTML",
    category: "HTML",
    language: "html",
    primaryTerms: ["html", "html5", "semantic", "the html", "the van ban", "lien ket", "hinh anh", "form", "table", "bang html"],
    secondaryTerms: ["header", "main", "section", "article", "input", "div", "span"],
    summary:
      "**HTML5** tạo nên bộ khung cấu trúc cho mọi trang web. Sử dụng **Semantic HTML** (`<header>`, `<nav>`, `<main>`, `<article>`, `<footer>`) giúp website chuẩn SEO, dễ bảo trì và thân thiện với người dùng đọc màn hình (accessibility).",
    keyPoints: [
      "**Thẻ cấu trúc chuẩn:** `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>` thay vì lạm dụng toàn `<div>`.",
      "**Liên kết & Hình ảnh:** `<a href=\"...\">` và `<img src=\"...\" alt=\"Mô tả ảnh\">` (luôn điền `alt`!).",
      "**Form chuẩn:** luôn ghép `<label for=\"id\">` với `<input id=\"id\" type=\"...\" required>`.",
    ],
    exampleLang: "html",
    exampleCode: `<article class="card">
  <h2>Học HTML5 cùng CODELAB</h2>
  <p>Thử chỉnh sửa đoạn HTML này ngay trong chế độ <strong>Tự code (Sandbox)</strong>!</p>
  <a href="https://codelab.vn">Khám phá thêm</a>
</article>`,
    mistakes: [
      "Quên thẻ đóng (như `</div>`, `</p>`) làm vỡ toàn bộ bố cục trang.",
      "Dùng nhiều thẻ `<h1>` tùy tiện thay vì 1 `<h1>` tiêu đề chính rồi phân cấp `<h2>`, `<h3>`.",
    ],
    practice: {
      prompt: "Mở **Tự code (Sandbox)** chọn ngôn ngữ **HTML5**, tạo một thẻ giới thiệu bản thân gồm ảnh đại diện, tiêu đề `<h1>`, danh sách sở thích `<ul>` và nút liên hệ.",
      hint: "Nhấn **Run** để xem giao diện Live Preview hiển thị ngay bên dưới!",
    },
  },
  {
    id: "css-flexbox",
    title: "CSS Flexbox — Căn chỉnh bố cục 1 chiều linh hoạt",
    category: "CSS",
    language: "css",
    primaryTerms: ["flexbox", "display flex", "justify-content", "align-items", "can giua", "flex"],
    secondaryTerms: ["flex-direction", "flex-wrap", "css gap"],
    summary:
      "**CSS Flexbox (`display: flex`)** là công cụ mạnh nhất để sắp xếp và căn chỉnh các phần tử theo **1 chiều** (hàng ngang hoặc cột dọc), đặc biệt là căn giữa hoàn hảo cả ngang lẫn dọc.",
    keyPoints: [
      "**Trục chính (`justify-content`):** `flex-start`, `center`, `space-between`, `space-around`, `flex-end`.",
      "**Trục vuông góc (`align-items`):** `center`, `stretch`, `flex-start`, `flex-end`.",
      "**Khoảng cách đều giữa các phần tử:** dùng `gap: 16px;` thay vì phải cộng trừ `margin` phức tạp!",
      "**Tự xuống dòng khi hẹp màn hình:** thêm `flex-wrap: wrap;`.",
    ],
    exampleLang: "css",
    exampleCode: `.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 12px 20px;
}`,
    mistakes: [
      "Quên đặt `display: flex;` trên **thẻ cha (container)** mà lại đặt `justify-content` trên thẻ con!",
      "Khi đổi `flex-direction: column;`, trục chính biến thành dọc nên `justify-content` căn dọc còn `align-items` căn ngang.",
    ],
    practice: {
      prompt: "Mở **Sandbox** chọn CSS3, căn giữa hoàn hảo một thẻ `.course-card` và tạo khoảng cách đẹp bằng `gap`.",
      hint: "Đặt `display: flex; justify-content: center; align-items: center;` trên container cha.",
    },
  },
  {
    id: "css-grid",
    title: "CSS Grid — Bố cục lưới 2 chiều (Hàng & Cột)",
    category: "CSS",
    language: "css",
    primaryTerms: ["css grid", "grid", "display grid", "grid-template-columns"],
    secondaryTerms: ["css", "responsive", "auto-fit", "minmax", "fr"],
    summary:
      "**CSS Grid (`display: grid`)** thiết kế bố cục **2 chiều** (cả hàng và cột cùng lúc) — cực kỳ lý tưởng cho Dashboard, thư viện khóa học dạng thẻ và giao diện Responsive hiện đại.",
    keyPoints: [
      "**Đơn vị `fr`:** chia đều phần không gian còn lại (ví dụ `grid-template-columns: 1fr 2fr;`).",
      "**Công thức Responsive 1 dòng không cần Media Query:** `grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));`.",
      "**Khi nào dùng Flexbox vs Grid?** Flexbox cho 1 hàng/1 cột (navbar, nút bấm), Grid cho lưới nhiều hàng nhiều cột (trang danh sách thẻ, layout tổng thể).",
    ],
    exampleLang: "css",
    exampleCode: `.course-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
}`,
    mistakes: [
      "Đặt kích thước cố định `px` quá lớn trong `minmax(500px, 1fr)` làm tràn ngang trên màn hình điện thoại.",
    ],
    practice: {
      prompt: "Tạo một lưới 3 cột đều nhau trên desktop và tự co về 1 cột trên màn hình hẹp bằng `repeat(auto-fit, minmax(...))`.",
      hint: "Thử `minmax(220px, 1fr)` kết hợp `gap: 16px;`.",
    },
  },
  {
    id: "css-box-model",
    title: "CSS Box Model, Position, Responsive & Animation",
    category: "CSS",
    language: "css",
    primaryTerms: ["css", "box model", "margin", "padding", "border", "position", "responsive", "media query", "animation", "transition"],
    secondaryTerms: ["box-sizing", "relative", "absolute", "fixed", "sticky", "selector"],
    summary:
      "Mọi phần tử trên trang web đều là một chiếc hộp (**Box Model**) gồm 4 lớp từ trong ra ngoài: **Content → Padding → Border → Margin**.",
    keyPoints: [
      "**`padding`** là khoảng cách *bên trong* viền; **`margin`** là khoảng cách *bên ngoài* giữa các hộp.",
      "**Luôn dùng `box-sizing: border-box;`:** để `width` đã bao gồm cả `padding` và `border`, không bị phình vỡ layout.",
      "**`position: absolute`** căn theo thẻ cha gần nhất có `position: relative` (nếu không có sẽ căn theo toàn trang!).",
      "**Hiệu ứng mượt:** dùng `transition: transform 0.2s ease;` khi hover thay vì nhảy đột ngột.",
    ],
    exampleLang: "css",
    exampleCode: `* { box-sizing: border-box; }
.course-card {
  padding: 20px;
  border: 1px solid #334155;
  border-radius: 14px;
  transition: transform 0.2s ease;
}
.course-card:hover { transform: translateY(-4px); }`,
    mistakes: [
      "Nhầm lẫn giữa `padding` (khoảng đệm bên trong có ăn màu nền) và `margin` (khoảng cách bên ngoài trong suốt).",
    ],
    practice: {
      prompt: "Thử chỉnh `padding`, `border-radius` và hiệu ứng `:hover` trong Sandbox CSS3 để quan sát Box Model thay đổi trực tiếp.",
      hint: "Đổi `box-shadow` và `transform: translateY(-4px)` trên `.course-card:hover`.",
    },
  },
  {
    id: "js-basics",
    title: "JavaScript Cơ bản (let / const, ===, Arrow Function)",
    category: "JavaScript",
    language: "javascript",
    primaryTerms: ["javascript", "js", "let", "const", "var", "arrow function", "==="],
    secondaryTerms: ["es6", "ham js", "bien js", "closure"],
    summary:
      "JavaScript hiện đại (ES6+) dùng **`const`** cho giá trị không gán lại và **`let`** cho biến thay đổi (tránh dùng `var` vì dễ gây lỗi phạm vi block).",
    keyPoints: [
      "**Luôn dùng `===` và `!==`** thay vì `==` (vì `\"5\" == 5` là `true`, còn `\"5\" === 5` là `false` — an toàn hơn nhiều!).",
      "**Arrow Function gọn gàng:** `const add = (a, b) => a + b;`.",
      "**Template Literal:** dùng dấu backtick `` `Xin chào ${name}` `` để nhúng biến vào chuỗi.",
    ],
    exampleLang: "javascript",
    exampleCode: `const name = "CODELAB";
let level = 1;
level += 1;
const greet = (n, lv) => \`Chào \${n} — Cấp \${lv}!\`;
console.log(greet(name, level));`,
    mistakes: [
      "Cố gán lại biến `const x = 1; x = 2;` (sẽ báo `TypeError: Assignment to constant variable`).",
      "Dùng `==` dẫn đến các so sánh ngầm kỳ lạ như `0 == \"\"` → `true`.",
    ],
    practice: {
      prompt: "Mở **Sandbox** chọn **JavaScript**, viết arrow function kiểm tra số chẵn/lẻ và in kết quả bằng `console.log`.",
      hint: "Dùng `const isEven = (n) => n % 2 === 0;`.",
    },
  },
  {
    id: "js-array-object",
    title: "JavaScript Array (map / filter / reduce), Object & JSON",
    category: "JavaScript",
    language: "javascript",
    primaryTerms: ["array map", "filter", "reduce", "object", "json", "destructuring", "spread"],
    secondaryTerms: ["javascript", "js", "mang js", "map filter"],
    summary:
      "Bộ ba **`.map()`**, **`.filter()`**, **`.reduce()`** giúp xử lý mảng trong JavaScript cực gọn theo phong cách hàm (immutable — không phá mảng gốc).",
    keyPoints: [
      "`.map(fn)`: biến đổi từng phần tử sang mảng mới cùng độ dài.",
      "`.filter(fn)`: giữ lại các phần tử thỏa mãn điều kiện trả về `true`.",
      "`.reduce((acc, cur) => ..., init)`: gom toàn bộ mảng về 1 giá trị (tổng, thống kê, object).",
      "`JSON.stringify(obj)` chuyển Object thành chuỗi JSON; `JSON.parse(str)` chuyển chuỗi JSON ngược về Object.",
    ],
    exampleLang: "javascript",
    exampleCode: `const scores = [55, 80, 92, 40, 88];
const passed = scores.filter((s) => s >= 70);       // [80, 92, 88]
const bonus = passed.map((s) => s + 5);             // [85, 97, 93]
const total = bonus.reduce((acc, s) => acc + s, 0); // 275
console.log({ passed, bonus, total });`,
    mistakes: [
      "Quên `return` khi mở cặp ngoặc nhọn `{ ... }` trong `.map(x => { x * 2 })` → mảng kết quả toàn `undefined`!",
      "Quên truyền giá trị khởi đầu `0` trong `.reduce((a, b) => a + b, 0)` khi mảng có thể rỗng.",
    ],
    practice: {
      prompt: "Cho mảng object học viên `[{ name, score }]`, lọc học viên `score >= 80` rồi lấy danh sách tên bằng `.filter().map()`.",
      hint: "`students.filter(s => s.score >= 80).map(s => s.name)`.",
    },
  },
  {
    id: "js-dom-event",
    title: "DOM & Sự kiện (Event) trong JavaScript",
    category: "JavaScript",
    language: "javascript",
    primaryTerms: ["dom", "event", "addeventlistener", "queryselector", "su kien", "click"],
    secondaryTerms: ["javascript", "preventdefault", "textcontent", "innerhtml"],
    summary:
      "**DOM (Document Object Model)** là cây đại diện cho toàn bộ thẻ HTML để JavaScript đọc, sửa nội dung, thay đổi CSS và lắng nghe thao tác người dùng qua **Event**.",
    keyPoints: [
      "**Tìm phần tử:** `document.querySelector(\".btn\")` (phần tử đầu tiên), `document.querySelectorAll(\".item\")` (danh sách).",
      "**Lắng nghe sự kiện:** `btn.addEventListener(\"click\", (e) => { ... });`.",
      "**Bảo mật:** ưu tiên dùng `el.textContent` thay vì `el.innerHTML` khi hiển thị chữ người dùng nhập để tránh lỗi XSS.",
    ],
    exampleLang: "javascript",
    exampleCode: `const btn = document.querySelector("#like-btn");
let likes = 0;
btn?.addEventListener("click", () => {
  likes += 1;
  btn.textContent = \`Đã thích (\${likes})\`;
});`,
    mistakes: [
      "Gọi hàm ngay lúc đăng ký sự kiện `btn.addEventListener(\"click\", handleClick())` thay vì truyền tham chiếu hàm `handleClick`!",
      "Quên `e.preventDefault()` trong sự kiện `submit` của `<form>` làm trang tự reload.",
    ],
    practice: {
      prompt: "Tạo một bộ đếm tăng/giảm số lượng bằng HTML + JS event `click`.",
      hint: "Gắn 2 nút `+` và `-` với `addEventListener(\"click\", ...)` để cập nhật `countEl.textContent`.",
    },
  },
  {
    id: "js-async-fetch",
    title: "Asynchronous JavaScript: Promise, async/await & Fetch API",
    category: "JavaScript",
    language: "javascript",
    primaryTerms: ["async", "await", "promise", "fetch", "fetch api", "bat dong bo", "api"],
    secondaryTerms: ["javascript", "try catch", "json", "then"],
    summary:
      "JavaScript chạy đơn luồng, nên các tác vụ chờ mạng (gọi API, đọc file) dùng **Promise** và cú pháp **`async / await`** để không làm đứng giao diện.",
    keyPoints: [
      "`await` chỉ dùng được bên trong hàm đánh dấu `async`.",
      "`fetch(url)` **không tự ném lỗi** khi HTTP trả về `404` hoặc `500` — luôn kiểm tra `if (!res.ok) throw new Error(...)`!",
      "Luôn bọc `await` trong `try { ... } catch (err) { ... }` để xử lý mất mạng hoặc lỗi server sạch sẽ.",
    ],
    exampleLang: "javascript",
    exampleCode: `async function loadUser(id) {
  try {
    const res = await fetch(\`/api/users/\${id}\`);
    if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
    const data = await res.json();
    console.log(data);
  } catch (err) {
    console.error("Lỗi tải dữ liệu:", err.message);
  }
}`,
    mistakes: [
      "Quên `await` trước `res.json()` khiến biến nhận về là `Promise { <pending> }` thay vì dữ liệu thật!",
    ],
    practice: {
      prompt: "Viết một hàm `async` gọi song song 2 API cùng lúc bằng `Promise.all([fetch(a), fetch(b)])`.",
      hint: "`const [r1, r2] = await Promise.all([fetch(url1), fetch(url2)]);` giúp nhanh gấp đôi so với `await` tuần tự.",
    },
  },

  // ===================== LEARNING ROADMAP & GREETING =====================
  {
    id: "roadmap-beginner",
    title: "Lộ trình học lập trình từ con số 0 trên CODELAB",
    category: "Lộ trình",
    primaryTerms: ["lo trinh", "nguoi moi", "bat dau tu dau", "nen hoc ngon ngu nao", "hoc lap trinh nhu the nao", "tu con so 0"],
    secondaryTerms: ["khoa hoc", "moi bat dau", "c++ hay js"],
    summary:
      "Nếu bạn bắt đầu từ con số 0, bí quyết là **học lý thuyết ngắn + gõ code chạy ngay mỗi ngày** thay vì chỉ đọc hoặc xem video thụ động.",
    keyPoints: [
      "**Nhánh 1 — Nền tảng tư duy & Giải thuật (Khuyên bắt đầu):** Học **C++ Programming** (Chương 1 → 7: Biến, I/O, Điều kiện, Vòng lặp → Chương 8 → 14: Mảng, Chuỗi, Hàm, `vector`, `map`/`set`) kết hợp giải dần 12 bài ở **Luyện tập Code**.",
      "**Nhánh 2 — Làm Website trực quan:** Học theo thứ tự **HTML5 → CSS3 (Flexbox/Grid) → JavaScript (DOM & Fetch API)** và thử nghiệm tự do ở mục **Tự code (Sandbox)**.",
      "**Mẹo giữ phong độ:** Mỗi ngày hoàn thành 1 bài học hoặc 1 bài tập + làm Quiz để hệ thống tự chỉ ra chủ đề còn yếu.",
    ],
    mistakes: [
      "Chỉ đọc code mẫu mà không tự gõ lại và chỉnh sửa thử trên Editor.",
      "Nhảy thẳng vào thuật toán khó (DP/Đồ thị) khi chưa vững vòng lặp, mảng và kiểu dữ liệu `long long`.",
    ],
    practice: {
      prompt: "Bạn muốn bắt đầu ngay với **C++ giải thuật** hay **HTML/CSS/JS làm web**? Hãy nhắn tên chủ đề bạn muốn tìm hiểu (ví dụ: `học về map`, `vòng lặp for`, `flexbox`)!",
      hint: "Bạn cũng có thể vào thẳng mục **Tự code (Sandbox)** trên thanh menu bên trái để tự viết và chạy code ngay không cần chọn bài tập.",
    },
  },
  {
    id: "greeting-help",
    title: "Gia sư Lập trình CODELAB có thể giúp gì cho bạn?",
    category: "Lộ trình",
    primaryTerms: ["xin chao", "chao ban", "hello", "hi", "ban lam duoc gi", "giup gi", "huong dan su dung"],
    secondaryTerms: ["tro giup", "help"],
    summary:
      "Chào bạn! Ngay cả ở chế độ **Offline thông minh** (không cần API key), mình đã được huấn luyện hơn **40+ chuyên đề & bài toán lập trình kinh điển** về C++, STL, Thuật toán, HTML, CSS và JavaScript.",
    keyPoints: [
      "**Hỏi kiến thức & bài toán kinh điển:** ví dụ *\"học về map\"*, *\"đổi số nguyên sang số nhị phân\"*, *\"kiểm tra số nguyên tố\"*, *\"giải phương trình bậc 2\"*, *\"đệ quy là gì\"*, *\"CSS Flexbox\"*, *\"async/await\"*...",
      "**So sánh 2 khái niệm:** ví dụ *\"so sánh map và unordered_map\"*, *\"so sánh stack và queue\"*, *\"so sánh Flexbox và Grid\"*.",
      "**Tìm lỗi & Gợi ý sửa code:** bấm nút **Đính kèm code** (hoặc bấm **Hỏi AI** ngay trong bài tập / Sandbox) để mình chỉ rõ dòng lỗi và gợi ý từng bước.",
      "**AI suy luận tự do 100% miễn phí:** Bấm chế độ **Trong trình duyệt** (chạy model **Qwen2.5-Coder** cục bộ trên GPU của bạn) hoặc gắn **`GEMINI_API_KEY`** miễn phí từ Google AI Studio!",
    ],
    mistakes: [],
    practice: {
      prompt: "Hãy thử gõ ngay một chủ đề bạn đang quan tâm — ví dụ: **`đổi số nguyên sang nhị phân`**, **`học về map`**, hoặc **`so sánh vector và set`**!",
      hint: "Bạn cũng có thể vào mục **Tự code (Sandbox)** để tự viết và chạy thử C++ (`<bits/stdc++.h>`), HTML, CSS, JS ngay mà không cần bài tập.",
    },
  },
  ...CLASSIC_PROBLEM_TOPICS,
];

const VIETNAMESE_STOP_WORDS = new Set([
  "cua", "bai", "code", "viet", "cho", "toi", "minh", "ban", "voi", "trong",
  "khi", "nao", "nhu", "the", "lam", "sao", "cach", "hoc", "tim", "kiem",
  "tra", "tinh", "thanh", "sang", "bien", "nguyen", "nhung", "mot", "hai",
  "cac", "hay", "giup", "giai", "thich", "duoc", "khong", "phai", "dung",
  "cai", "nay", "kia", "van", "rat", "nhieu", "hon", "nhat", "va", "hoac",
]);

export interface TopicMatch {
  topic: KnowledgeTopic;
  score: number;
}

export function matchOfflineTopics(query: string, ctx?: TutorContext): TopicMatch[] {
  const norm = stripVietnameseAccents(query);
  if (!norm) return [];

  const scored: TopicMatch[] = [];

  for (const topic of OFFLINE_KNOWLEDGE_BASE) {
    // Skip topics explicitly blocked by homonym negative patterns (e.g., "biến ... thành" ≠ variable)
    if (topic.negativePatterns?.some((re) => re.test(norm))) {
      continue;
    }

    let score = 0;
    let primaryHits = 0;

    for (const term of topic.primaryTerms) {
      if (matchesTerm(norm, term)) {
        primaryHits += 1;
        // Multi-word or longer specific phrases (e.g. "thanh so nhi phan", "unordered_map") outrank short generic tokens!
        score += 14 + Math.min(18, term.length);
      }
    }

    for (const term of topic.secondaryTerms ?? []) {
      if (matchesTerm(norm, term)) {
        score += 5;
      }
    }

    // Lightly boost rare meaningful (non-stopword) words from topic title
    const titleNorm = stripVietnameseAccents(topic.title);
    const queryWords = norm
      .split(" ")
      .filter((w) => w.length >= 3 && !VIETNAMESE_STOP_WORDS.has(w));
    for (const w of queryWords) {
      if (matchesTerm(titleNorm, w)) {
        score += 2;
      }
    }

    if (primaryHits > 0 || score >= 12) {
      if (primaryHits > 0 && topic.specificityBoost) {
        score += topic.specificityBoost;
      }
      // Context language disambiguation (e.g., "map" in JS course vs C++ course)
      if (ctx?.courseLanguage && topic.language) {
        if (ctx.courseLanguage === topic.language) {
          score += 5;
        }
      }
      // Explicit language mentions override default context
      if (/\b(js|javascript)\b/.test(norm) && topic.language === "javascript") score += 10;
      if (/\b(c\+\+|cpp|stl)\b/.test(norm) && topic.language === "cpp") score += 8;
      if (/\bcss\b/.test(norm) && topic.language === "css") score += 8;
      if (/\bhtml\b/.test(norm) && topic.language === "html") score += 8;

      scored.push({ topic, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored;
}

function isComparisonQuery(norm: string): boolean {
  return /\b(so sanh|khac gi|khac nhau|phan biet|vs|hay la|nen dung)\b/.test(norm);
}

function isFollowUpExamplesQuery(norm: string): boolean {
  return /\b(vi du|demo|code mau|cach dung|cach khai bao|cach duyet)\b/.test(norm);
}

function isFollowUpMistakesQuery(norm: string): boolean {
  return /\b(loi thuong gap|bay|luu y|canh bao|sai lam)\b/.test(norm);
}

function isPracticeRequest(norm: string, mode?: TutorContext["mode"]): boolean {
  return mode === "generate_practice" || /\b(tao bai tap|sinh bai tap|cho bai tap|bai tap ve|quiz|luyen tap)\b/.test(norm);
}

function recoverTopicFromHistory(history?: TutorHistoryMessage[], ctx?: TutorContext): KnowledgeTopic | null {
  if (!history || history.length === 0) return null;
  // Prioritize recent user messages first, then assistant headings, to keep topic tracking laser-accurate
  const recent = history.slice(-6).reverse();
  for (const msg of recent) {
    if (msg.role === "user") {
      const matches = matchOfflineTopics(msg.content, ctx);
      if (matches.length > 0 && matches[0].topic.id !== "greeting-help") {
        return matches[0].topic;
      }
    }
  }
  for (const msg of recent) {
    if (msg.role === "assistant") {
      const firstLine = msg.content.split("\n")[0] ?? "";
      const matches = matchOfflineTopics(firstLine, ctx);
      if (matches.length > 0 && matches[0].topic.id !== "greeting-help") {
        return matches[0].topic;
      }
    }
  }
  return null;
}

function formatComparisonReply(a: KnowledgeTopic, b: KnowledgeTopic): string {
  const lines: string[] = [
    `### So sánh: ${a.title} vs ${b.title}`,
    "",
    `**1. ${a.title}**`,
    a.summary,
    ...a.keyPoints.slice(0, 2).map((p) => `- ${p}`),
    "",
    `**2. ${b.title}**`,
    b.summary,
    ...b.keyPoints.slice(0, 2).map((p) => `- ${p}`),
    "",
    "**Lưu ý tránh nhầm lẫn:**",
    ...(a.mistakes[0] ? [`- Với **${a.title.split(" ")[0]}**: ${a.mistakes[0]}`] : []),
    ...(b.mistakes[0] ? [`- Với **${b.title.split(" ")[0]}**: ${b.mistakes[0]}`] : []),
    "",
    "Bạn muốn xem ví dụ cụ thể hoặc làm thử 1 bài tập ứng dụng cho phần nào trong 2 phần trên?",
  ];
  return lines.join("\n");
}

function formatTopicReply(
  topic: KnowledgeTopic,
  normQuery: string,
  mode?: TutorContext["mode"]
): string {
  // Specialized practice mode for matched topic
  if (isPracticeRequest(normQuery, mode)) {
    const lines = [
      `### Bài tập thực hành chủ đề: ${topic.title}`,
      "",
      `**Đề bài luyện tập:** ${topic.practice.prompt}`,
      "",
      `**Gợi ý từng bước (chưa đưa đáp án hoàn chỉnh):**`,
      `- ${topic.practice.hint}`,
    ];
    if (topic.mistakes[0]) {
      lines.push(`- **Lỗi cần tránh:** ${topic.mistakes[0]}`);
    }
    if (topic.practice.quiz) {
      lines.push("", `**Câu hỏi tư duy nhanh:** ${topic.practice.quiz}`);
    }
    lines.push("", "Bạn có thể mở mục **Tự code (Sandbox)** để tự viết và chạy thử ngay!");
    return lines.join("\n");
  }

  // Specialized mistakes follow-up
  if (isFollowUpMistakesQuery(normQuery) && topic.mistakes.length > 0) {
    return [
      `### Những lỗi phổ biến nhất khi dùng ${topic.title}`,
      "",
      ...topic.mistakes.map((m, i) => `${i + 1}. ${m}`),
      "",
      `**Mẹo kiểm tra nhanh:** ${topic.practice.hint}`,
    ].join("\n");
  }

  // Specialized code example follow-up
  if (isFollowUpExamplesQuery(normQuery) && topic.exampleCode) {
    return [
      `### Ví dụ minh họa thực tế: ${topic.title}`,
      "",
      topic.summary,
      "",
      `\`\`\`${topic.exampleLang || "cpp"}\n${topic.exampleCode}\n\`\`\``,
      "",
      "**Điểm cần nhớ trong ví dụ trên:**",
      ...topic.keyPoints.slice(0, 3).map((p) => `- ${p}`),
      "",
      `**Thử thách nhỏ:** ${topic.practice.prompt}`,
    ].join("\n");
  }

  // Full structured pedagogical explanation
  const lines: string[] = [
    `### ${topic.title}`,
    "",
    topic.summary,
    "",
    "**Kiến thức & thao tác trọng tâm:**",
    ...topic.keyPoints.map((p) => `- ${p}`),
  ];

  if (topic.exampleCode) {
    lines.push(
      "",
      "**Ví dụ ngắn gọn (chạy được ngay trên Sandbox CODELAB):**",
      `\`\`\`${topic.exampleLang || "cpp"}\n${topic.exampleCode}\n\`\`\``
    );
  }

  if (topic.mistakes.length > 0) {
    lines.push("", "**Lỗi người mới hay gặp:**", ...topic.mistakes.map((m) => `- ${m}`));
  }

  lines.push(
    "",
    `**Thực hành ngay:** ${topic.practice.prompt}`,
    `> *Gợi ý:* ${topic.practice.hint}`
  );

  if (topic.practice.quiz) {
    lines.push("", `**Câu hỏi kiểm tra nhanh:** ${topic.practice.quiz}`);
  }

  // Helpful cross-note when user simply typed "map" (could be C++ std::map or JS Array.map)
  if (topic.id === "stl-map" && !/\b(c\+\+|cpp|stl|unordered)\b/.test(normQuery)) {
    lines.push(
      "",
      "*Lưu ý:* Nếu ý bạn là hàm `.map()` trên mảng trong JavaScript, hãy nhắn **`JS array map`** để mình giải thích riêng phần đó nhé!"
    );
  }

  return lines.join("\n");
}

/**
 * Answers conceptual, comparison, follow-up, and practice-generation questions
 * using the 25+ topic Vietnamese knowledge base without ever falling into an unrelated loop.
 */
export function answerKnowledgeQueryOffline(params: {
  message: string;
  history?: TutorHistoryMessage[];
  context: TutorContext;
}): string {
  const { message, history, context } = params;
  const norm = stripVietnameseAccents(message);
  const matches = matchOfflineTopics(message, context);

  // 1) Side-by-side comparison if user asks "so sánh X và Y" and >= 2 distinct topics match
  if (isComparisonQuery(norm) && matches.length >= 2) {
    return formatComparisonReply(matches[0].topic, matches[1].topic);
  }

  // 2) Direct topic match
  if (matches.length > 0) {
    return formatTopicReply(matches[0].topic, norm, context.mode);
  }

  // 3) Conversation-aware follow-up (e.g., "cho ví dụ", "lỗi hay gặp", "cho bài tập thêm", "giải thích kỹ hơn")
  const prevTopic = recoverTopicFromHistory(history, context);
  if (prevTopic) {
    if (isPracticeRequest(norm, context.mode)) {
      return formatTopicReply(prevTopic, "tao bai tap", "generate_practice");
    }
    if (isFollowUpMistakesQuery(norm)) {
      return formatTopicReply(prevTopic, "loi thuong gap", context.mode);
    }
    if (isFollowUpExamplesQuery(norm)) {
      return formatTopicReply(prevTopic, "vi du", context.mode);
    }
    if (/\b(ky hon|chi tiet|tiep|them|giai thich lai|chua hieu)\b/.test(norm)) {
      return [
        `### Đào sâu thêm về: ${prevTopic.title}`,
        "",
        ...prevTopic.keyPoints.map((p) => `- ${p}`),
        ...(prevTopic.mistakes.length > 0
          ? ["", "**Các lỗi dễ mắc phải:**", ...prevTopic.mistakes.map((m) => `- ${m}`)]
          : []),
        "",
        `**Bài luyện tập áp dụng:** ${prevTopic.practice.prompt}`,
        `> *Gợi ý:* ${prevTopic.practice.hint}`,
      ].join("\n");
    }
  }

  // 4) Exercise-specific hint when user is inside an exercise without mentioning another topic
  if (context.exerciseTitle || context.problemConstraints || (context.problemHints && context.problemHints.length > 0)) {
    const lines = [
      `### Định hướng cho bài: ${context.exerciseTitle || context.lessonTitle || "Bài tập hiện tại"}`,
      "",
    ];
    if (context.problemConstraints) {
      lines.push(`- **Giới hạn quan trọng:** \`${context.problemConstraints}\` — kiểm tra kỹ kiểu dữ liệu trước khi code.`);
    }
    if (context.problemHints && context.problemHints.length > 0) {
      lines.push(`- **Gợi ý cốt lõi:** ${context.problemHints[0]}`);
    }
    lines.push(
      "- Hãy bấm **Đính kèm code** hoặc dán đoạn code bạn đang viết để mình kiểm tra từng dòng lỗi (tràn số, thiếu `;`, sai vòng lặp, sai output) giúp bạn!"
    );
    return lines.join("\n");
  }

  // 5) Honest, contextual guidance when topic is outside offline KB (never repeats unrelated Input/Output boilerplate!)
  return [
    `### Mình chưa có bài giảng chuyên sâu ngoại tuyến cho câu hỏi: *"${message.trim().slice(0, 100)}"*`,
    "",
    "Hiện tại bạn đang dùng chế độ **Offline thông minh** (không dùng API cloud). Trong chế độ này, mình hỗ trợ rất tốt các nội dung sau:",
    "- **C++ & STL:** `map`, `unordered_map`, `set`, `vector`, `stack`, `queue`, `priority_queue`, `pair`, `string`, `con trỏ`, `struct/OOP`, `tham trị & tham chiếu`, `tràn số long long`, `<bits/stdc++.h>`.",
    "- **Thuật toán:** `đệ quy`, `sắp xếp sort`, `tìm kiếm nhị phân`, `số nguyên tố / sàng Eratosthenes`, `UCLN/BCNN`, `prefix sum`, `hai con trỏ / sliding window`, `Kadane`, `quy hoạch động DP`, `tham lam`, `BFS/DFS`, `Big-O`.",
    "- **Web:** `HTML5 Semantic`, `CSS Flexbox`, `CSS Grid`, `Box Model`, `JavaScript map/filter/reduce`, `DOM & Event`, `async/await & Fetch API`.",
    "- **Sửa lỗi code trực tiếp:** Bấm nút **Đính kèm code** bên dưới rồi dán đoạn code của bạn để mình chỉ chính xác dòng lỗi!",
    "",
    "> *Mẹo:* Nếu bạn muốn hỏi đáp tự do mọi chủ đề phức tạp hơn, hãy bấm **\"Thêm key Gemini miễn phí\"** ở thanh trên (lấy từ Google AI Studio trong 1 phút) hoặc bật chế độ **Trong trình duyệt (WebLLM)**.",
  ].join("\n");
}
