# CODELAB – Interactive Coding Academy

**CODELAB** là nền tảng học lập trình trực tuyến tương tác bằng Tiếng Việt, kết hợp trải nghiệm học bài bản từ con số 0 (9 bước sư phạm cho mỗi bài học) với không gian thực hành **Monaco Editor**, hệ thống luyện giải thuật chấm tự động **Judge0 Sandbox**, **Quiz 6 dạng câu hỏi**, **Gamification xác thực phía backend**, **Gia sư Lập trình AI** cá nhân hóa và **Admin CMS Dashboard** phân quyền chặt chẽ.

---

## 1. Tính năng cốt lõi đã hoàn thiện

- **Giao diện hiện đại & Responsive**: Hỗ trợ Light Mode / Dark Mode (lưu theo trình duyệt và hồ sơ tài khoản), Lucide Icons, hiệu ứng nhẹ nhàng, thông báo Toast khi hoàn thành bài học/nhận XP/mở khóa huy hiệu, trạng thái Loading/Error/Empty rõ ràng.
- **Dashboard cá nhân dữ liệu thật 100%**: Mọi chỉ số (bài học hoàn thành, bài tập đã giải, tỷ lệ đúng, thời gian học, Learning Streak, cấp độ/XP, biểu đồ hoạt động theo Ngày / Tuần / Tháng, chủ đề Quiz còn yếu, nút **"Tiếp tục học"**) đều được tính trực tiếp từ bản ghi cơ sở dữ liệu của từng tài khoản — không dùng số liệu cố định.
- **Thư viện 4 khóa học trọng tâm**:
  - **C++ Programming (18 chương đầy đủ từ con số 0 đến OOP)**: 18 bài học tương tác chuyên sâu (đầy đủ lý thuyết, thuật ngữ chuyên ngành giải thích lần đầu, sơ đồ trực quan, ví dụ từ dễ đến khó + giải thích từng dòng code, lỗi thường gặp, thực hành viết code, gợi ý & đáp án ẩn, checkpoint quiz và tổng kết).
  - **HTML5**, **CSS3**, **JavaScript ES6+**: đầy đủ khung chương (10–12 chương/khóa) cùng các bài học tương tác chạy **Live Preview & Console Sandbox** ngay trong trình duyệt.
- **Monaco Code Editor & Chế độ Tự code tự do (`/playground` – Sandbox)**: Viết & chạy code ngay không cần chọn bài tập hay đăng nhập; hỗ trợ C++17 (`#include <bits/stdc++.h>`), HTML5, CSS3 (Live Preview) và JavaScript ES6+; quản lý nhiều tệp nháp tự lưu (`localStorage`), mẫu code nhanh, tải file mã nguồn về máy và tích hợp nút Hỏi AI.
- **Hệ thống chạy & chấm code C++17 ngay trên trình duyệt (Clang WebAssembly + Web Worker) & tùy chọn Judge0**:
  - **Mặc định hoạt động ngay không cần API key hay Docker**: Biên dịch mã C++17 chuẩn (hỗ trợ đầy đủ **`#include <bits/stdc++.h>`**, `<iostream>`, `<vector>`, `<string>`, `<algorithm>`, `<iomanip>`, `<stack>`, `<queue>`, `<unordered_map>`, `cin`/`cout`) bằng **LLVM/Clang WebAssembly (`@yowasp/clang`)** + **WASI (`@bjorn3/browser_wasi_shim`)** trong hai Web Worker độc lập, giới hạn thời gian **3 giây** và giới hạn đầu ra **1MB** chống treo trình duyệt; cache tài nguyên WASM vào Cache Storage sau lần tải đầu tiên.
  - **Chấm bài tự động 2 chế độ**: Nếu cấu hình `JUDGE0_API_URL`, hệ thống tự động ưu tiên Judge0 Sandbox; ngược lại tự động biên dịch 1 lần bằng Clang WASM, chạy lần lượt từng test case trong Web Worker, hiển thị chi tiết test công khai/ẩn, chỉ cộng XP 1 lần ở phía server và dịch lỗi biên dịch tiếng Việt + gạch đỏ dòng lỗi trong Monaco Editor.
  - Hỗ trợ đủ các trạng thái kết quả: `Accepted`, `Wrong Answer`, `Compilation Error` (kèm số dòng lỗi), `Runtime Error`, `Time Limit Exceeded`, `Memory Limit Exceeded`.
- **Coding Challenges (12 bài tập giải thuật đủ 11 chủ đề)**: Easy / Medium / Hard, bộ test case mẫu & test case ẩn phía server (kèm 7 test biên `long long` cho `CL-001`), lịch sử nộp bài chi tiết, tự lưu code (`localStorage`), phím tắt `Ctrl+Enter`, gợi ý & đáp án ẩn cho đến khi người dùng chủ động mở.
- **Hệ thống Quiz 6 dạng câu hỏi**: Trắc nghiệm 1 đáp án, nhiều đáp án, Đúng/Sai, Điền khuyết, Dự đoán output, Tìm lỗi code — chấm điểm tự động phía server, giải thích chi tiết từng câu, thống kê chủ đề yếu và cho phép làm lại.
- **Gia sư Lập trình AI 3 chế độ (không bắt buộc API key)**:
  - Ưu tiên **Google Gemini API** (`@google/genai`, gọi hoàn toàn phía server khi có `GEMINI_API_KEY`).
  - Tự động dùng chế độ **Gợi ý thông minh Offline** khi chưa có key hoặc khi gặp lỗi hết hạn mức (429), sai key (401/403), mất mạng — phân tích lỗi biên dịch, output sai và lỗi C++ phổ biến kèm số dòng, không lộ đáp án hoàn chỉnh.
  - Tùy chọn nâng cao **WebLLM (WebGPU)** chạy model LLM nhỏ trực tiếp trong trình duyệt (chỉ bật khi người dùng chọn, tự kiểm tra WebGPU & có thanh tiến trình tải).
- **Hỗ trợ PWA (Progressive Web App)**: Tích hợp `manifest.webmanifest`, bộ icon PNG chuẩn (`192x192`, `512x512`, `maskable`, `apple-touch-icon`), Service Worker (`/sw.js`) và nút **Tải App** cho phép cài đặt CODELAB trực tiếp lên màn hình chính Desktop / Android / iOS.
- **Gamification chống gian lận**: XP, cấp độ, chuỗi Streak, bảng xếp hạng công khai (ẩn email/thông tin nhạy cảm), và 8 huy hiệu (bao gồm *First Code*, *Bug Hunter*, *Problem Solver*, *Consistency*, *Master*) chỉ được cấp phát từ backend khi xác nhận hoàn thành hợp lệ.
- **Tài khoản & Hồ sơ cá nhân**: Đăng ký, đăng nhập, đăng xuất, quên mật khẩu, cập nhật hồ sơ, tải ảnh đại diện, đổi mật khẩu, lưu bài học & bài tập yêu thích, theo dõi lịch sử học tập.
- **Admin Dashboard (`/admin`)**: Bảo vệ bằng RBAC (`role === 'admin'`, chặn học viên bằng HTTP 403). Cho phép quản lý người dùng, thêm chương, **biên soạn & chỉnh sửa bài học trực tiếp không cần sửa code frontend**, tạo bài tập + bộ test case, thêm/xóa câu hỏi Quiz và xử lý báo lỗi người dùng.

---

## 2. Chạy dự án trên máy cục bộ (Local Quickstart)

### Yêu cầu
- **Node.js >= 22.5** (khuyến nghị **Node.js 24 LTS** — tích hợp sẵn `node:sqlite` không cần biên dịch native addon).
- `npm` >= 10.

### Cài đặt & Khởi chạy

```bash
# 1. Cài đặt thư viện
npm install

# 2. Tạo tệp biến môi trường từ mẫu
cp .env.example .env.local

# 3. Chạy máy chủ phát triển
npm run dev
```

Mở trình duyệt tại `http://localhost:3000`.

Trong chế độ local mặc định (khi chưa cấu hình Supabase), hệ thống tự động tạo cơ sở dữ liệu SQLite tại `data/codelab.db`, nạp toàn bộ giáo trình chuẩn và (nếu `ENABLE_DEMO_SEED=true`) tạo riêng các tài khoản trải nghiệm chế độ Demo:

| Vai trò | Email | Mật khẩu | Ghi chú |
|---|---|---|---|
| **Học viên Demo** | `demo@codelab.vn` | `Demo@1234` | Có sẵn tiến độ mẫu, lịch sử Quiz và biểu đồ hoạt động |
| **Quản trị viên (Admin)** | `admin@codelab.vn` | `Admin@1234` | Truy cập đầy đủ `/admin` CMS Dashboard |

> Bạn cũng có thể đăng ký tài khoản mới tại `/register` — mọi tài khoản mới luôn bắt đầu hoàn toàn sạch từ **0 XP, 0 bài học, 0 streak**.

---

## 3. Hướng dẫn cấu hình các dịch vụ bên ngoài (`.env.local`)

Các tính năng phụ thuộc dịch vụ bên ngoài được tách rõ ràng; nếu chưa cấu hình khóa API, hệ thống sẽ báo rõ trạng thái chưa cấu hình thay vì giả lập kết quả:

### A. Dịch vụ chạy & chấm code C++ (Judge0 Sandbox)
> *Tính năng HTML / CSS / JavaScript đã chạy trực tiếp ngay trong iframe sandbox trình duyệt mà không cần Judge0. Chạy & chấm C++ yêu cầu Judge0:*

- **Cách 1 – Self-hosted Judge0 CE (Docker, khuyến nghị cho production)**:
  ```env
  JUDGE0_API_URL=http://localhost:2358
  JUDGE0_AUTH_TOKEN=your-optional-token
  JUDGE0_CPP_LANGUAGE_ID=54
  ```
- **Cách 2 – RapidAPI Judge0 CE**:
  ```env
  JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
  JUDGE0_RAPIDAPI_KEY=your-rapidapi-key
  JUDGE0_RAPIDAPI_HOST=judge0-ce.p.rapidapi.com
  JUDGE0_CPP_LANGUAGE_ID=54
  ```

### B. Gia sư Lập trình AI (Server-side only)
- **Khuyến nghị – Google Gemini API (`@google/genai` + `gemini-4-hydrogen`)**:
  1. Tạo khóa API tại [Google AI Studio](https://aistudio.google.com/apikey).
  2. Thêm vào `.env.local`:
     ```env
     GEMINI_API_KEY=your-gemini-api-key
     GEMINI_MODEL=gemini-4-hydrogen
     ```
- **Hoặc endpoint tương thích OpenAI**:
  ```env
  AI_COMPATIBLE_API_URL=https://api.openai.com/v1/chat/completions
  AI_COMPATIBLE_API_KEY=your-key
  AI_COMPATIBLE_MODEL=gpt-4o-mini
  ```

### C. Cơ sở dữ liệu Production: Supabase PostgreSQL + Row Level Security (RLS)
1. Tạo dự án mới trên [Supabase](https://supabase.com).
2. Mở **SQL Editor** trên Supabase Dashboard và chạy toàn bộ tệp migration:
   `supabase/migrations/001_initial_schema.sql`
   Tệp này thiết lập đầy đủ 20+ bảng quan hệ, chỉ mục (indexes), trigger tự tạo hồ sơ và toàn bộ **Row Level Security (RLS)** đảm bảo:
   - Người dùng chỉ xem/sửa dữ liệu của chính mình và không thể tự chỉnh `xp`, `level` hoặc `role`.
   - Test case ẩn (`is_sample = false`) chỉ đọc được từ server service role hoặc Admin.
   - Quyền ghi nội dung khóa học/bài học/bài tập chỉ mở cho Admin.
3. Điền biến môi trường vào `.env.local` (hoặc cấu hình biến môi trường trên Vercel):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ENABLE_DEMO_SEED=false
   ```

---

## 4. Kiểm thử & Đóng gói Production

```bash
# Chạy bộ unit & integration test (crypto, quiz grader, Judge0 guard, AI Tutor, SQLite seed, gamification)
npm test

# Kiểm tra lint & build production
npm run lint
npm run build
npm run start
```

### Triển khai Production (Vercel + Supabase + Judge0)
1. Đẩy mã nguồn lên GitHub (đảm bảo `.env.local` và `data/*.db` đã được loại trừ trong `.gitignore`).
2. Import repository vào **Vercel** (hoặc chạy container Node 24 trên VPS/Cloud Run).
3. Thiết lập đầy đủ biến môi trường production:
   - `AUTH_SESSION_SECRET` (chuỗi ngẫu nhiên >= 32 ký tự)
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - `JUDGE0_API_URL` (+ `JUDGE0_AUTH_TOKEN` hoặc `JUDGE0_RAPIDAPI_KEY`)
   - `GEMINI_API_KEY` (và `GEMINI_MODEL=gemini-4-hydrogen`)
   - `ENABLE_DEMO_SEED=false`
4. Bật HTTPS bắt buộc (cookie phiên tự động bật cờ `Secure` khi `NODE_ENV=production`).
