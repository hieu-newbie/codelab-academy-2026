export interface CppEditorMarker {
  line: number;
  column: number;
  endColumn: number;
  severity: "error" | "warning";
  vietnameseMessage: string;
  originalMessage: string;
}

export interface ParsedCppDiagnostics {
  markers: CppEditorMarker[];
  vietnameseSummary: string;
  rawOutput: string;
}

const DIAGNOSTIC_REGEX =
  /^(?:.*\/)?main\.cpp:(\d+):(\d+):\s+(fatal error|error|warning):\s+(.+)$/;

export function translateClangMessageToVietnamese(msg: string): string {
  const m = msg.trim();

  if (/expected ';'/.test(m)) {
    return "Thiếu dấu chấm phẩy ';' ở cuối câu lệnh hoặc khai báo.";
  }

  const undeclared = m.match(/use of undeclared identifier '([^']+)'/);
  if (undeclared) {
    return `Biến, hàm hoặc định danh '${undeclared[1]}' chưa được khai báo (kiểm tra lỗi chính tả, viết hoa/thường hoặc thiếu #include / using namespace std;).`;
  }

  const fileNotFound = m.match(/'([^']+)' file not found/);
  if (fileNotFound) {
    return `Không tìm thấy thư viện '${fileNotFound[1]}'. Hãy kiểm tra lại tên tệp trong chỉ thị #include.`;
  }

  if (/expected '\}'|expected '\)'|expected '\]'/.test(m)) {
    return `Thiếu dấu đóng ngoặc tương ứng (${m}). Hãy kiểm tra cặp ngoặc {}, () hoặc [].`;
  }

  if (/invalid operands to binary expression/.test(m)) {
    return "Phép toán không hợp lệ giữa hai kiểu dữ liệu (rất hay gặp khi nhầm chiều mũi tên << của cout với >> của cin).";
  }

  const redef = m.match(/redefinition of '([^']+)'/);
  if (redef) {
    return `Tên '${redef[1]}' đã được khai báo trùng trước đó trong cùng phạm vi.`;
  }

  if (/no matching function for call to/.test(m)) {
    return "Gọi hàm sai số lượng tham số hoặc không khớp kiểu dữ liệu tham số.";
  }

  if (/cannot initialize|assigning to .* from incompatible type|no viable conversion/.test(m)) {
    return "Không thể gán hoặc khởi tạo vì không tương thích kiểu dữ liệu.";
  }

  if (/non-void function does not return a value/.test(m)) {
    return "Hàm có kiểu trả về nhưng còn nhánh chưa có lệnh return.";
  }

  if (/unknown type name '([^']+)'/.test(m)) {
    const typeName = m.match(/unknown type name '([^']+)'/)?.[1] || "";
    return `Không nhận diện được kiểu dữ liệu '${typeName}' (kiểm tra chính tả hoặc thiếu #include).`;
  }

  if (/expected expression/.test(m)) {
    return "Thiếu biểu thức hợp lệ (có thể thừa toán tử, thiếu toán hạng hoặc sai cú pháp).";
  }

  if (/expected unqualified-id/.test(m)) {
    return "Cú pháp khai báo không hợp lệ tại vị trí này (kiểm tra dấu ngoặc hoặc từ khóa phía trên).";
  }

  if (/cannot use 'try' with exceptions disabled|cannot use 'throw' with exceptions disabled/.test(m)) {
    return "Trình biên dịch WebAssembly hiện tắt cơ chế ngoại lệ C++ (try/catch/throw). Hãy xử lý điều kiện bằng if/else.";
  }

  if (/undefined symbol|undefined reference/.test(m)) {
    return "Lỗi liên kết: hàm được gọi nhưng chưa có phần thân cài đặt (hoặc thiếu hàm main()).";
  }

  return `Lỗi biên dịch: ${m}`;
}

export function parseClangDiagnostics(rawOutput: string): ParsedCppDiagnostics {
  const cleaned = rawOutput.replace(/\x1b\[[0-9;]*m/g, "").trim();
  if (!cleaned) {
    return { markers: [], vietnameseSummary: "", rawOutput: "" };
  }

  const lines = cleaned.split(/\r?\n/);
  const markers: CppEditorMarker[] = [];

  for (const rawLine of lines) {
    const match = rawLine.match(DIAGNOSTIC_REGEX);
    if (!match) continue;
    const lineNum = Math.max(1, Number(match[1]));
    const colNum = Math.max(1, Number(match[2]));
    const sev = match[3] === "warning" ? "warning" : "error";
    const originalMessage = match[4].trim();
    const vietnameseMessage = translateClangMessageToVietnamese(originalMessage);

    markers.push({
      line: lineNum,
      column: colNum,
      endColumn: colNum + 12,
      severity: sev,
      vietnameseMessage,
      originalMessage,
    });
  }

  const errorMarkers = markers.filter((x) => x.severity === "error");
  const primaryList = errorMarkers.length > 0 ? errorMarkers : markers;

  const vietnameseSummary =
    primaryList.length > 0
      ? primaryList
          .slice(0, 6)
          .map(
            (m) =>
              `• Dòng ${m.line}, cột ${m.column}: ${m.vietnameseMessage}`
          )
          .join("\n")
      : `Không thể biên dịch mã nguồn C++. Chi tiết từ Clang:\n${cleaned.slice(0, 400)}`;

  return {
    markers,
    vietnameseSummary,
    rawOutput: cleaned,
  };
}
