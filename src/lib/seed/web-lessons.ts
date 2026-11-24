import type { SeedLesson } from "./cpp-lessons-part1";

export const WEB_LESSONS: SeedLesson[] = [
  // =========================================================================
  // HTML LESSONS
  // =========================================================================
  {
    id: "lesson-html-01",
    section_id: "sec-html-01",
    course_id: "course-html",
    slug: "tong-quan-html-va-the-co-ban",
    title: "Tổng quan về HTML5 và các thẻ cấu trúc văn bản",
    summary: "Hiểu cách trình duyệt dựng trang web từ cây thẻ HTML và tự tay tạo trang hồ sơ đầu tiên xem trực tiếp ngay trong trình duyệt.",
    estimated_minutes: 15,
    xp_reward: 50,
    sort_order: 1,
    language: "html",
    content: {
      introduction:
        "Mọi website bạn truy cập mỗi ngày — từ YouTube, GitHub cho tới CODELAB — đều bắt đầu bằng HTML (HyperText Markup Language). HTML đóng vai trò như bộ khung xương định nghĩa đâu là tiêu đề, đâu là đoạn văn, danh sách hay nút bấm. Tin tuyệt vời là trên CODELAB, bạn có thể viết HTML và xem giao diện hiển thị TRỰC TIẾP ngay bên cạnh!",
      objectives: [
        "Hiểu cú pháp thẻ mở `<tag>`, nội dung, thẻ đóng `</tag>` và thuộc tính (attribute).",
        "Sử dụng đúng thứ bậc tiêu đề `<h1>` đến `<h6>`, đoạn văn `<p>` và nhấn mạnh `<strong>`.",
        "Tạo trang giới thiệu cá nhân hiển thị tức thì trong khung Live Preview."
      ],
      theoryBlocks: [
        {
          heading: "1. Giải phẫu một phần tử HTML",
          paragraphs: [
            "Một phần tử HTML thường gồm thẻ mở (ví dụ `<h1 class=\"title\">`), nội dung bên trong và thẻ đóng (`</h1>`). Một số thẻ đặc biệt như `<img>`, `<br>`, `<hr>` là thẻ tự đóng không có nội dung bên trong.",
            "Thứ bậc tiêu đề rất quan trọng cho SEO và người khiếm thị: mỗi trang chỉ nên có ĐÚNG MỘT thẻ `<h1>` cho tiêu đề chính nhất, sau đó phân cấp xuống `<h2>`, `<h3>`."
          ],
          glossary: [
            { term: "HTML (HyperText Markup Language)", definition: "Ngôn ngữ đánh dấu siêu văn bản quy định cấu trúc và ngữ nghĩa nội dung của trang web." },
            { term: "Thuộc tính (Attribute)", definition: "Thông tin bổ sung viết bên trong thẻ mở theo dạng `tên=\"giá trị\"` (ví dụ `href`, `src`, `alt`)." }
          ]
        }
      ],
      examples: [
        {
          title: "Ví dụ: Thẻ hồ sơ lập trình viên bằng HTML thuần",
          level: "Cơ bản",
          description: "Kết hợp tiêu đề, đoạn văn, danh sách không thứ tự và liên kết.",
          code: `<section style="font-family: system-ui; padding: 20px; color: #0f172a;">
  <h1>Xin chào, mình là Học viên CODELAB!</h1>
  <p>Mình đang chinh phục lộ trình <strong>Full-stack Web</strong> từ con số 0.</p>
  <h2>Kỹ năng đang học:</h2>
  <ul>
    <li>HTML5 chuẩn ngữ nghĩa</li>
    <li>CSS3 Flexbox & Grid</li>
    <li>JavaScript hiện đại</li>
  </ul>
</section>`,
          expectedOutput: "Hiển thị tiêu đề lớn, đoạn văn in đậm và danh sách 3 mục ngay trong khung Preview.",
          lineExplanations: [
            { line: "Dòng 2", code: "<h1>...</h1>", explanation: "Tiêu đề cấp 1 quan trọng nhất của trang." },
            { line: "Dòng 3", code: "<strong>Full-stack Web</strong>", explanation: "Nhấn mạnh tầm quan trọng ngữ nghĩa (mặc định hiển thị in đậm)." },
            { line: "Dòng 5-9", code: "<ul><li>...</li></ul>", explanation: "Danh sách không đánh số thứ tự (Unordered List) chứa các mục <li>." }
          ]
        }
      ],
      commonMistakes: [
        {
          title: "Quên đóng thẻ khiến định dạng tràn xuống cả trang",
          badCode: `<p>Đoạn văn <strong>in đậm nhưng quên đóng thẻ
<p>Đoạn văn tiếp theo bị đậm theo luôn!</p>`,
          goodCode: `<p>Đoạn văn <strong>in đậm chuẩn xác</strong>.</p>
<p>Đoạn văn tiếp theo bình thường.</p>`,
          explanation: "Luôn đóng thẻ theo thứ tự mở sau đóng trước (lồng nhau gọn gàng)."
        }
      ],
      practice: {
        title: "Thực hành: Dựng thẻ giới thiệu khóa học",
        prompt: "Hãy viết mã HTML hiển thị một tiêu đề `<h1>` mang tên bạn, một đoạn `<p>` giới thiệu mục tiêu học lập trình và một danh sách `<ul>` gồm ít nhất 3 mục tiêu cụ thể. Bấm Run để xem kết quả hiển thị ngay!",
        starterCode: `<div style="font-family: system-ui; padding: 24px; line-height: 1.6;">
  <h1>Hồ sơ của tôi</h1>
  <p>Chỉnh sửa đoạn giới thiệu tại đây...</p>
  <ul>
    <li>Mục tiêu 1</li>
  </ul>
</div>`,
        expectedOutput: "Hiển thị đầy đủ h1, p và danh sách ul trong khung Live Preview.",
        hints: ["Thêm thêm 2 thẻ <li> vào trong cặp thẻ <ul>...</ul> rồi bấm Run."],
        solutionCode: `<div style="font-family: system-ui; padding: 24px; line-height: 1.6;">
  <h1>Nguyễn Văn An</h1>
  <p>Mình đang rèn luyện lập trình web thực chiến tại <strong>CODELAB</strong>.</p>
  <ul>
    <li>Làm chủ HTML5 & Semantic Web</li>
    <li>Thiết kế giao diện Responsive bằng CSS3</li>
    <li>Xây dựng ứng dụng tương tác với JavaScript</li>
  </ul>
</div>`
      },
      checkpointQuiz: {
        question: "Thẻ HTML nào đại diện cho tiêu đề quan trọng nhất trên một trang web?",
        options: ["<head>", "<title>", "<h1>", "<header>"],
        correctIndex: 2,
        explanation: "`<h1>` là tiêu đề cấp cao nhất hiển thị nội dung chính cho người dùng và bộ máy tìm kiếm."
      },
      takeaways: [
        "HTML định nghĩa cấu trúc và ngữ nghĩa nội dung web.",
        "Luôn đóng thẻ đầy đủ và dùng đúng cấp bậc `h1` → `h2` → `h3`."
      ]
    }
  },
  {
    id: "lesson-html-02",
    section_id: "sec-html-07",
    course_id: "course-html",
    slug: "form-va-semantic-html",
    title: "Biểu mẫu (Form) và Semantic HTML chuẩn SEO",
    summary: "Tạo biểu mẫu đăng ký có validation native với label, input, button và cấu trúc trang chuẩn ngữ nghĩa bằng header, main, article, footer.",
    estimated_minutes: 20,
    xp_reward: 65,
    sort_order: 1,
    language: "html",
    content: {
      introduction:
        "Thay vì dùng hàng trăm thẻ `<div>` vô nghĩa, HTML5 mang đến các thẻ Semantic (ngữ nghĩa) như `<header>`, `<nav>`, `<main>`, `<article>`, `<footer>` cùng hệ thống `<form>` có kiểm tra dữ liệu tích hợp sẵn ngay trên trình duyệt.",
      objectives: [
        "Gắn kết đúng `<label for=\"...\">` với `<input id=\"...\">` để tăng khả năng tiếp cận.",
        "Sử dụng các kiểu input hiện đại (`email`, `password`, `number`) kèm `required`.",
        "Tổ chức bố cục bằng Semantic HTML thay vì lạm dụng `<div>`."
      ],
      theoryBlocks: [
        {
          heading: "1. Sức mạnh của Semantic HTML và Form Accessibility",
          paragraphs: [
            "Khi bạn gắn `<label for=\"email\">` khớp với `<input id=\"email\" type=\"email\" required>`, người dùng bấm vào chữ nhãn cũng tự động focus vào ô nhập, đồng thời trình đọc màn hình đọc chính xác trường dữ liệu.",
            "Semantic HTML giúp công cụ tìm kiếm (Google) hiểu rõ đâu là thanh điều hướng `<nav>`, đâu là nội dung trọng tâm `<main>` và bài viết `<article>`."
          ],
          glossary: [
            { term: "Semantic HTML", definition: "Việc sử dụng các thẻ HTML có tên mô tả đúng vai trò nội dung của nó như header, main, section, article, footer." }
          ]
        }
      ],
      examples: [
        {
          title: "Ví dụ: Form đăng ký nhận bản tin CODELAB",
          level: "Thực tế",
          description: "Biểu mẫu hoàn chỉnh với kiểm tra định dạng email tự động.",
          code: `<main style="font-family: system-ui; max-width: 420px; margin: 20px auto; padding: 20px; border: 1px solid #cbd5e1; border-radius: 12px;">
  <header>
    <h2 style="margin: 0 0 8px;">Đăng ký lớp C++ miễn phí</h2>
    <p style="color: #475569; margin: 0 0 16px;">Nhận lộ trình học chi tiết qua email.</p>
  </header>
  <form onsubmit="event.preventDefault(); alert('Đã gửi đăng ký thành công!');">
    <div style="margin-bottom: 12px;">
      <label for="fullname" style="display:block; font-weight:600; margin-bottom:4px;">Họ và tên</label>
      <input id="fullname" type="text" required placeholder="Nguyễn Minh Quân" style="width:100%; padding:8px; border:1px solid #94a3b8; border-radius:6px;" />
    </div>
    <div style="margin-bottom: 12px;">
      <label for="email" style="display:block; font-weight:600; margin-bottom:4px;">Email</label>
      <input id="email" type="email" required placeholder="ban@codelab.vn" style="width:100%; padding:8px; border:1px solid #94a3b8; border-radius:6px;" />
    </div>
    <button type="submit" style="background:#2563eb; color:#fff; border:none; padding:10px 16px; border-radius:8px; font-weight:600; cursor:pointer;">Đăng ký ngay</button>
  </form>
</main>`,
          expectedOutput: "Hiển thị Form đăng ký gọn đẹp có kiểm tra bắt buộc nhập họ tên và email hợp lệ.",
          lineExplanations: [
            { line: "Dòng 8-9", code: '<label for="fullname"> + <input id="fullname">', explanation: "Liên kết chặt label với input bằng cặp for/id." },
            { line: "Dòng 13", code: 'type="email" required', explanation: "Trình duyệt tự động kiểm tra có ký tự @ và không được bỏ trống." }
          ]
        }
      ],
      commonMistakes: [
        {
          title: "Dùng placeholder thay thế hoàn toàn thẻ label",
          badCode: `<input type="email" placeholder="Email">`,
          goodCode: `<label for="email">Email</label>\n<input id="email" type="email" placeholder="ban@example.com">`,
          explanation: "Placeholder biến mất ngay khi người dùng gõ chữ, khiến họ quên trường đó là gì và gây khó khăn cho trợ năng."
        }
      ],
      practice: {
        title: "Thực hành: Thêm trường chọn khóa học bằng thẻ <select>",
        prompt: "Bổ sung một nhãn `<label for=\"course\">` và thẻ `<select id=\"course\">` với 3 lựa chọn `<option>`: C++, HTML/CSS, JavaScript vào biểu mẫu bên dưới.",
        starterCode: `<main style="font-family: system-ui; padding: 20px; max-width: 400px;">
  <h2>Khảo sát học viên</h2>
  <form>
    <label for="name" style="display:block; margin-bottom:4px;">Tên của bạn:</label>
    <input id="name" type="text" required style="width:100%; padding:8px; margin-bottom:12px;" />
    <!-- Thêm label và select chọn khóa học tại đây -->
    <button type="submit" style="padding:8px 16px; background:#059669; color:white; border:none; border-radius:6px;">Gửi</button>
  </form>
</main>`,
        expectedOutput: "Hiển thị form có ô nhập tên và hộp chọn select 3 khóa học.",
        hints: ["Dùng <select id=\"course\"><option>C++</option><option>HTML/CSS</option><option>JavaScript</option></select>"],
        solutionCode: `<main style="font-family: system-ui; padding: 20px; max-width: 400px;">
  <h2>Khảo sát học viên</h2>
  <form>
    <label for="name" style="display:block; margin-bottom:4px;">Tên của bạn:</label>
    <input id="name" type="text" required style="width:100%; padding:8px; margin-bottom:12px;" />
    <label for="course" style="display:block; margin-bottom:4px;">Khóa học quan tâm:</label>
    <select id="course" style="width:100%; padding:8px; margin-bottom:12px;">
      <option value="cpp">C++ Programming</option>
      <option value="web">HTML & CSS</option>
      <option value="js">JavaScript</option>
    </select>
    <button type="submit" style="padding:8px 16px; background:#059669; color:white; border:none; border-radius:6px;">Gửi</button>
  </form>
</main>`
      },
      checkpointQuiz: {
        question: "Thuộc tính nào trên thẻ `<label>` dùng để liên kết với `id` của thẻ `<input>`?",
        options: ["name", "for", "target", "bind"],
        correctIndex: 1,
        explanation: "Thuộc tính `for` trên `<label>` khớp với `id` của `<input>`."
      },
      takeaways: [
        "Semantic HTML giúp trang web sạch, dễ bảo trì, tối ưu SEO và thân thiện trợ năng.",
        "Luôn đi kèm `<label for>` cho mọi ô `<input>` trong biểu mẫu."
      ]
    }
  },

  // =========================================================================
  // CSS LESSONS
  // =========================================================================
  {
    id: "lesson-css-01",
    section_id: "sec-css-05",
    course_id: "course-css",
    slug: "box-model-va-box-sizing",
    title: "CSS Box Model, Margin, Padding và box-sizing: border-box",
    summary: "Hiểu bí mật khiến mọi phần tử trên web đều là những chiếc hộp chữ nhật và tránh vỡ giao diện nhờ border-box.",
    estimated_minutes: 20,
    xp_reward: 65,
    sort_order: 1,
    language: "css",
    content: {
      introduction:
        "Mọi thứ bạn nhìn thấy trên trình duyệt — một nút bấm, một bức ảnh hay một dòng chữ — đều được CSS coi là một chiếc hộp gồm 4 lớp đồng tâm: Content (nội dung) → Padding (đệm trong) → Border (viền) → Margin (lề ngoài). Làm chủ Box Model là bước ngoặt để bạn kiểm soát giao diện chính xác đến từng pixel!",
      objectives: [
        "Phân biệt rạch ròi vai trò của `padding` (đệm trong) và `margin` (khoảng cách ngoài).",
        "Hiểu tại sao `box-sizing: border-box` được mọi lập trình viên Frontend bật mặc định.",
        "Tự tay tạo thẻ khóa học có đổ bóng, bo góc và khoảng thở cân đối."
      ],
      theoryBlocks: [
        {
          heading: "1. 4 lớp của CSS Box Model",
          paragraphs: [
            "Từ trong ra ngoài: **Content** là nơi chữ/ảnh hiển thị; **Padding** tạo khoảng trống giữa nội dung và đường viền (mang màu nền của hộp); **Border** là đường viền bao quanh; và **Margin** là khoảng trống trong suốt đẩy các phần tử khác ra xa.",
            "Mặc định trình duyệt dùng `content-box`: nếu bạn đặt `width: 300px; padding: 20px; border: 2px;`, chiều rộng thật phình ra thành `344px`! Chỉ cần thêm `box-sizing: border-box;`, tổng chiều rộng LUÔN giữ đúng `300px` đã đặt."
          ],
          glossary: [
            { term: "box-sizing: border-box", definition: "Chế độ tính kích thước bao gồm cả padding và border nằm gọn trong width/height đã khai báo." }
          ]
        }
      ],
      diagram: {
        title: "4 tầng của CSS Box Model từ trong ra ngoài",
        type: "box_model",
        caption: "Khi bật border-box, width bao trọn Content + Padding + Border.",
        items: [
          { label: "1. Content", value: "Nội dung văn bản / hình ảnh", detail: "Lớp trong cùng" },
          { label: "2. Padding", value: "Khoảng đệm bên trong viền", detail: "Hưởng màu background của phần tử", highlight: true },
          { label: "3. Border", value: "Đường viền bao bọc", detail: "Ví dụ: 1px solid #e2e8f0" },
          { label: "4. Margin", value: "Khoảng đẩy ra ngoài", detail: "Ngăn cách với các phần tử lân cận" }
        ]
      },
      examples: [
        {
          title: "Ví dụ: Thiết kế Card khóa học chuẩn Box Model",
          level: "Thực tế",
          description: "Quan sát hiệu ứng rõ nét của padding, border, border-radius và box-shadow.",
          code: `/* CSS áp dụng trực tiếp vào khung preview bên phải */
* {
  box-sizing: border-box;
}
body {
  font-family: system-ui, sans-serif;
  background: #f1f5f9;
  padding: 24px;
}
.course-card {
  width: 320px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.08);
}
.badge {
  display: inline-block;
  background: #dbeafe;
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 999px;
  margin-bottom: 12px;
}
.course-card h3 {
  margin: 0 0 8px;
  color: #0f172a;
}
.course-card p {
  margin: 0;
  color: #475569;
  font-size: 14px;
}`,
          expectedOutput: "Hiển thị một thẻ khóa học bo tròn trắng tinh tế có badge xanh và khoảng đệm thoáng mắt.",
          lineExplanations: [
            { line: "Dòng 2-4", code: "* { box-sizing: border-box; }", explanation: "Áp dụng border-box cho mọi phần tử giúp kích thước không bao giờ bị phình bất ngờ." },
            { line: "Dòng 15", code: "padding: 20px;", explanation: "Tạo khoảng thở đều 4 phía bên trong thẻ." }
          ]
        }
      ],
      commonMistakes: [
        {
          title: "Dùng margin thay vì padding khi muốn tăng kích thước vùng bấm nút",
          badCode: `.btn { margin: 16px; } /* Chỉ đẩy nút ra xa, nền nút không to lên! */`,
          goodCode: `.btn { padding: 12px 24px; } /* Vùng bấm rộng rãi, dễ thao tác */`,
          explanation: "Muốn khoảng trống nằm TRONG màu nền và đường viền → dùng `padding`. Muốn tạo khoảng cách NGOÀI viền → dùng `margin`."
        }
      ],
      practice: {
        title: "Thực hành: Tùy chỉnh giao diện thẻ .course-card",
        prompt: "Hãy tùy biến CSS trong trình soạn thảo để `.course-card` có nền tối `#0f172a`, chữ trắng `#f8fafc`, viền xanh `#3b82f6` dày `2px` và `padding: 24px`. Bấm Run để kiểm tra ngay trong Live Preview!",
        starterCode: `* { box-sizing: border-box; }
body { font-family: system-ui; background: #e2e8f0; padding: 24px; }

.course-card {
  width: 320px;
  background: #ffffff;
  color: #0f172a;
  border: 1px solid #cbd5e1;
  border-radius: 16px;
  padding: 16px;
}
.badge {
  display: inline-block;
  background: #2563eb;
  color: white;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  margin-bottom: 10px;
}`,
        expectedOutput: "Hiển thị thẻ khóa học Dark Card viền xanh dương sắc nét.",
        hints: ["Sửa background: #0f172a; color: #f8fafc; border: 2px solid #3b82f6; padding: 24px;"],
        solutionCode: `* { box-sizing: border-box; }
body { font-family: system-ui; background: #020617; padding: 24px; }

.course-card {
  width: 320px;
  background: #0f172a;
  color: #f8fafc;
  border: 2px solid #3b82f6;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 12px 30px rgba(37, 99, 235, 0.25);
}
.badge {
  display: inline-block;
  background: #2563eb;
  color: white;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  margin-bottom: 10px;
}`
      },
      checkpointQuiz: {
        question: "Một hộp có `width: 200px; padding: 20px; border: 5px solid black; box-sizing: border-box;`. Tổng chiều rộng thực tế hiển thị là bao nhiêu?",
        options: ["200px", "240px", "250px", "225px"],
        correctIndex: 0,
        explanation: "Vì có `box-sizing: border-box`, cả padding và border đều được tính gộp vào bên trong `width: 200px`."
      },
      takeaways: [
        "Luôn bắt đầu file CSS với `* { box-sizing: border-box; }`.",
        "Padding tạo không gian bên trong viền; Margin tạo khoảng cách bên ngoài viền."
      ]
    }
  },
  {
    id: "lesson-css-02",
    section_id: "sec-css-08",
    course_id: "course-css",
    slug: "flexbox-bo-cuc-linh-hoat",
    title: "CSS Flexbox – Căn giữa và Dựng thanh điều hướng siêu tốc",
    summary: "Làm chủ display: flex, justify-content, align-items và gap để căn chỉnh bố cục ngang/dọc chuyên nghiệp chỉ trong 3 dòng CSS.",
    estimated_minutes: 20,
    xp_reward: 70,
    sort_order: 1,
    language: "css",
    content: {
      introduction:
        "Trước kia, căn giữa một phần tử theo cả chiều ngang lẫn chiều dọc từng là nỗi ám ảnh của lập trình viên web. Với CSS Flexbox, bạn chỉ cần đúng 3 thuộc tính là dựng được thanh Navbar, hàng thẻ khóa học và căn giữa hoàn hảo trên mọi kích thước màn hình!",
      objectives: [
        "Hiểu khái niệm Trục chính (Main Axis) và Trục phụ (Cross Axis).",
        "Thành thạo `justify-content`, `align-items`, `flex-wrap` và `gap`."
      ],
      theoryBlocks: [
        {
          heading: "1. Quy tắc vàng của Flexbox",
          paragraphs: [
            "Khi đặt `display: flex;` lên phần tử CHA (Flex Container), tất cả con trực tiếp bên trong tự động xếp thành một hàng ngang (`flex-direction: row`).",
            "`justify-content` căn chỉnh dọc theo **trục chính** (mặc định chiều ngang: `space-between`, `center`, `flex-end`). `align-items` căn chỉnh dọc theo **trục phụ** (mặc định chiều dọc: `center`, `stretch`). Dùng `gap: 16px;` để tạo khoảng cách đều giữa các mục mà không cần hack margin!"
          ],
          glossary: [
            { term: "Flex Container", definition: "Phần tử cha được gắn `display: flex`, có nhiệm vụ điều khiển bố cục các con trực tiếp bên trong." }
          ]
        }
      ],
      examples: [
        {
          title: "Ví dụ: Thanh điều hướng hiện đại bằng Flexbox",
          level: "Thực tế",
          description: "Đẩy Logo sang trái và Menu sang phải tự động bằng `justify-content: space-between`.",
          code: `body { font-family: system-ui; margin: 0; padding: 16px; background: #0f172a; }
.course-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  background: #1e293b;
  color: #f8fafc;
  padding: 16px 24px;
  border-radius: 12px;
  border: 1px solid #334155;
}
.badge {
  background: #3b82f6;
  color: white;
  padding: 6px 14px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 13px;
}`,
          expectedOutput: "Các phần tử bên trong thẻ xếp ngang hàng, căn giữa dọc và tách đều hai bên.",
          lineExplanations: [
            { line: "Dòng 3-6", code: "display: flex; justify-content: space-between; align-items: center;", explanation: "Bộ ba kinh điển cho mọi thanh tiêu đề và hàng công cụ." }
          ]
        }
      ],
      commonMistakes: [
        {
          title: "Gắn display: flex lên phần tử CON thay vì phần tử CHA",
          badCode: `.item { display: flex; justify-content: space-between; }`,
          goodCode: `.container { display: flex; justify-content: space-between; }`,
          explanation: "Thuộc tính Flexbox điều phối bố cục luôn đặt ở phần tử CHA bao bọc danh sách con."
        }
      ],
      practice: {
        title: "Thực hành: Chuyển hướng Flex sang cột dọc và căn giữa",
        prompt: "Sửa `.course-card` bên phải dùng `display: flex`, `flex-direction: column`, `align-items: center`, `text-align: center` và `gap: 12px` để mọi thành phần xếp dọc cân đối chính giữa.",
        starterCode: `body { font-family: system-ui; padding: 24px; background: #f8fafc; }
.course-card {
  background: white;
  border: 1px solid #cbd5e1;
  border-radius: 14px;
  padding: 24px;
  /* Thêm thuộc tính Flexbox tại đây */
}
.badge {
  background: #0ea5e9;
  color: white;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
}`,
        expectedOutput: "Toàn bộ nội dung thẻ xếp thành 1 cột dọc nằm chính giữa.",
        hints: ["display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px;"],
        solutionCode: `body { font-family: system-ui; padding: 24px; background: #f8fafc; }
.course-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 12px;
  background: white;
  border: 1px solid #cbd5e1;
  border-radius: 14px;
  padding: 24px;
}
.badge {
  background: #0ea5e9;
  color: white;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
}`
      },
      checkpointQuiz: {
        question: "Thuộc tính nào trong Flexbox giúp tạo khoảng cách đều giữa các phần tử con mà không ảnh hưởng mép ngoài?",
        options: ["spacing", "gap", "padding", "border-spacing"],
        correctIndex: 1,
        explanation: "`gap` chèn khoảng cách sạch sẽ chỉ giữa các phần tử con bên trong Flex hoặc Grid container."
      },
      takeaways: [
        "Gắn `display: flex` vào phần tử cha.",
        "Kết hợp `justify-content`, `align-items` và `gap` cho hầu hết nhu cầu dàn trang 1 chiều."
      ]
    }
  },

  // =========================================================================
  // JAVASCRIPT LESSONS
  // =========================================================================
  {
    id: "lesson-js-01",
    section_id: "sec-js-01",
    course_id: "course-js",
    slug: "bien-kieu-du-lieu-va-ham-es6",
    title: "JavaScript Hiện đại: const, let, Arrow Function và Template Literal",
    summary: "Viết mã JavaScript chạy ngay trong trình duyệt theo chuẩn ES6+, hiểu sự khác biệt giữa const/let và so sánh chặt ===.",
    estimated_minutes: 20,
    xp_reward: 65,
    sort_order: 1,
    language: "javascript",
    content: {
      introduction:
        "Nếu HTML là khung xương và CSS là trang phục, thì JavaScript chính là hệ thần kinh giúp website phản hồi tức thì mọi cú click, tính toán dữ liệu và giao tiếp với máy chủ. Bạn có thể chạy JavaScript thực tế ngay trong Sandbox trình duyệt trên CODELAB và xem kết quả `console.log` tức thì!",
      objectives: [
        "Luôn dùng `const` mặc định và `let` khi cần gán lại giá trị (tạm biệt `var`).",
        "Dùng Template Literal (`` `Xin chào ${ten}` ``) và Arrow Function gọn gàng.",
        "Tránh lỗi ép kiểu ngầm bằng toán tử so sánh chặt `===`."
      ],
      theoryBlocks: [
        {
          heading: "1. const, let và so sánh chặt ===",
          paragraphs: [
            "Trong JavaScript hiện đại, hãy ưu tiên `const` cho mọi biến không gán lại; chỉ dùng `let` khi giá trị thực sự thay đổi (như biến đếm vòng lặp). Tránh dùng `var` vì phạm vi hàm dễ gây rò rỉ lỗi.",
            "Luôn dùng `===` và `!==` thay vì `==`: trong JS, `\"5\" == 5` trả về `true` (vì tự ép kiểu), nhưng `\"5\" === 5` trả về `false` vì khác kiểu dữ liệu!"
          ],
          glossary: [
            { term: "Arrow Function", definition: "Cú pháp hàm mũi tên ngắn gọn ra mắt từ ES6: `const tong = (a, b) => a + b;`." },
            { term: "Template Literal", definition: "Chuỗi đặt trong dấu backtick `` ` `` cho phép nội suy biểu thức trực tiếp bằng `${...}`." }
          ]
        }
      ],
      examples: [
        {
          title: "Ví dụ: Tính XP và xếp hạng học viên bằng Arrow Function",
          level: "Thực tế",
          description: "Khai báo hàm mũi tên và in báo cáo sinh động bằng template literal.",
          code: `const hocVien = "Lan Anh";
let xp = 320;
const tinhCapDo = (diemXP) => Math.floor(diemXP / 100) + 1;

xp += 150;
console.log(\`Học viên: \${hocVien}\`);
console.log(\`Tổng XP: \${xp} -> Cấp độ hiện tại: Level \${tinhCapDo(xp)}\`);`,
          expectedOutput: "Học viên: Lan Anh\nTổng XP: 470 -> Cấp độ hiện tại: Level 5",
          lineExplanations: [
            { line: "Dòng 3", code: "const tinhCapDo = (diemXP) => ...", explanation: "Hàm mũi tên 1 dòng tự động return giá trị biểu thức." },
            { line: "Dòng 7", code: "`... ${tinhCapDo(xp)}`", explanation: "Nội suy trực tiếp kết quả gọi hàm ngay bên trong chuỗi." }
          ]
        }
      ],
      commonMistakes: [
        {
          title: "Dùng == thay vì === gây lỗi so sánh chuỗi và số",
          badCode: `if ("0" == 0) console.log("Bằng nhau?!"); // In ra true!`,
          goodCode: `if ("0" === 0) console.log("Không chạy vì khác kiểu");`,
          explanation: "Luôn sử dụng `===` và `!==` trong 99.9% trường hợp."
        }
      ],
      practice: {
        title: "Thực hành: Viết Arrow Function tính giá sau giảm giá",
        prompt: "Viết hàm mũi tên `tinhGia(giaGoc, phanTramGiam)` trả về giá cuối cùng sau khi giảm. Gọi thử với `tinhGia(500000, 20)` và dùng `console.log` in ra `400000`.",
        starterCode: `const tinhGia = (giaGoc, phanTramGiam) => {
  // Viết công thức tính giá sau khi giảm
};

console.log(tinhGia(500000, 20));`,
        expectedOutput: "400000",
        hints: ["return giaGoc * (1 - phanTramGiam / 100);"],
        solutionCode: `const tinhGia = (giaGoc, phanTramGiam) => {
  return giaGoc * (1 - phanTramGiam / 100);
};

console.log(tinhGia(500000, 20));`
      },
      checkpointQuiz: {
        question: "Biểu thức `\"10\" === 10` trong JavaScript trả về kết quả nào?",
        options: ["true", "false", "undefined", "NaN"],
        correctIndex: 1,
        explanation: "Toán tử `===` kiểm tra cả giá trị lẫn kiểu dữ liệu. `\"10\"` là string còn `10` là number nên trả về `false`."
      },
      takeaways: [
        "Mặc định dùng `const`, chỉ dùng `let` khi cần gán lại.",
        "Luôn dùng `===` để so sánh chính xác cả giá trị và kiểu dữ liệu."
      ]
    }
  },
  {
    id: "lesson-js-02",
    section_id: "sec-js-06",
    course_id: "course-js",
    slug: "mang-object-map-filter-reduce",
    title: "Xử lý Dữ liệu chuyên nghiệp với Array map, filter, reduce",
    summary: "Làm chủ bộ ba phương thức mảng quan trọng nhất trong lập trình Web hiện đại & React để lọc, biến đổi và tổng hợp danh sách Object.",
    estimated_minutes: 25,
    xp_reward: 80,
    sort_order: 1,
    language: "javascript",
    content: {
      introduction:
        "Khi xây dựng ứng dụng web thực tế (như danh sách khóa học, giỏ hàng, bảng xếp hạng), 90% dữ liệu từ API trả về là một **Mảng các Object**. Thay vì viết những vòng lặp `for` rườm rà dễ thay đổi nhầm mảng gốc, bộ ba `filter`, `map`, `reduce` giúp xử lý dữ liệu theo phong cách hàm (Functional Programming) cực sạch và ngắn gọn!",
      objectives: [
        "Dùng `.filter()` để lọc ra các phần tử thỏa điều kiện.",
        "Dùng `.map()` để biến đổi từng phần tử sang dạng mới mà không làm hỏng mảng gốc.",
        "Dùng `.reduce()` để cộng dồn tổng điểm, tổng tiền hoặc gom nhóm dữ liệu."
      ],
      theoryBlocks: [
        {
          heading: "1. Bộ ba bất biến (Immutable Array Methods)",
          paragraphs: [
            "Điểm chung tuyệt vời của `filter` và `map` là chúng KHÔNG sửa mảng ban đầu mà luôn trả về một mảng mới tinh — cực kỳ quan trọng khi bạn học React sau này.",
            "Bạn có thể nối chuỗi (chaining) chúng mượt mà: `students.filter(s => s.score >= 8).map(s => s.name)`."
          ],
          glossary: [
            { term: "Tính bất biến (Immutability)", definition: "Không sửa trực tiếp dữ liệu cũ mà tạo ra bản sao mới chứa thay đổi, giúp tránh bug ngoài ý muốn." }
          ]
        }
      ],
      examples: [
        {
          title: "Ví dụ: Thống kê học viên đạt loại Giỏi và tổng XP",
          level: "Thực tế",
          description: "Kết hợp filter, map và reduce trên mảng đối tượng.",
          code: `const learners = [
  { name: "Minh", score: 9.2, xp: 450 },
  { name: "Huy", score: 6.5, xp: 180 },
  { name: "Linh", score: 8.8, xp: 520 },
  { name: "Khanh", score: 9.5, xp: 610 }
];

const topNames = learners
  .filter((item) => item.score >= 8.5)
  .map((item) => item.name);

const totalXp = learners.reduce((sum, item) => sum + item.xp, 0);

console.log("Học viên xuất sắc:", topNames.join(", "));
console.log("Tổng XP cả lớp:", totalXp);`,
          expectedOutput: "Học viên xuất sắc: Minh, Linh, Khanh\nTổng XP cả lớp: 1760",
          lineExplanations: [
            { line: "Dòng 9", code: ".filter((item) => item.score >= 8.5)", explanation: "Giữ lại các học viên có điểm từ 8.5 trở lên." },
            { line: "Dòng 10", code: ".map((item) => item.name)", explanation: "Rút trích riêng tên từ từng object đã lọc." },
            { line: "Dòng 12", code: ".reduce((sum, item) => sum + item.xp, 0)", explanation: "Cộng dồn XP bắt đầu từ giá trị khởi tạo 0." }
          ]
        }
      ],
      commonMistakes: [
        {
          title: "Quên giá trị khởi tạo `0` trong reduce()",
          badCode: `const total = items.reduce((sum, item) => sum + item.price); // Trả về "[object Object]100"!`,
          goodCode: `const total = items.reduce((sum, item) => sum + item.price, 0);`,
          explanation: "Khi mảng chứa Object, bắt buộc phải truyền giá trị khởi tạo `0` ở tham số thứ 2 của `reduce`."
        }
      ],
      practice: {
        title: "Thực hành: Tính tổng giá trị đơn hàng hợp lệ",
        prompt: "Cho mảng `orders` gồm các đơn hàng có `paid` (true/false) và `amount`. Hãy lọc những đơn đã thanh toán (`paid === true`) và dùng `reduce` tính tổng tiền, rồi `console.log` ra kết quả `450`.",
        starterCode: `const orders = [
  { id: 1, paid: true, amount: 200 },
  { id: 2, paid: false, amount: 150 },
  { id: 3, paid: true, amount: 250 }
];

// Lọc đơn đã thanh toán và tính tổng amount
const revenue = 0;
console.log(revenue);`,
        expectedOutput: "450",
        hints: ["const revenue = orders.filter(o => o.paid).reduce((sum, o) => sum + o.amount, 0);"],
        solutionCode: `const orders = [
  { id: 1, paid: true, amount: 200 },
  { id: 2, paid: false, amount: 150 },
  { id: 3, paid: true, amount: 250 }
];

const revenue = orders
  .filter((o) => o.paid)
  .reduce((sum, o) => sum + o.amount, 0);

console.log(revenue);`
      },
      checkpointQuiz: {
        question: "Phương thức mảng nào trả về một mảng mới có CÙNG ĐỘ DÀI với mảng gốc sau khi biến đổi từng phần tử?",
        options: ["filter()", "map()", "reduce()", "find()"],
        correctIndex: 1,
        explanation: "`map()` ánh xạ 1-1 từng phần tử sang giá trị mới nên mảng kết quả luôn có cùng độ dài với mảng ban đầu."
      },
      takeaways: [
        "`filter` giữ phần tử thỏa điều kiện; `map` biến đổi từng phần tử; `reduce` gộp thành một giá trị duy nhất.",
        "Luôn truyền giá trị khởi tạo cho `reduce` khi làm việc với mảng Object."
      ]
    }
  }
];
