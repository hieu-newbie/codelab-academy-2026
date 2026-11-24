import { parseClangDiagnostics } from "@/lib/cpp-diagnostics";
import type { TutorContext, TutorHistoryMessage } from "@/lib/ai-tutor-shared";
import {
  answerKnowledgeQueryOffline,
  matchOfflineTopics,
  stripVietnameseAccents,
} from "@/lib/offline-knowledge-base";

export interface OfflineFinding {
  category:
    | "compile_error"
    | "int_overflow"
    | "missing_semicolon"
    | "undeclared_or_header"
    | "missing_return"
    | "infinite_loop"
    | "type_or_comparison"
    | "uninitialized_var"
    | "io_mistake"
    | "array_bounds"
    | "output_mismatch";
  line?: number;
  title: string;
  explanation: string;
  hint: string;
}

function normalizeForCompare(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((l) => l.replace(/[ \t]+$/g, ""))
    .join("\n")
    .replace(/\n+$/g, "");
}

function stripInlineComment(line: string): string {
  let inString = false;
  let inChar = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    const prev = i > 0 ? line[i - 1] : "";
    if (ch === '"' && !inChar && prev !== "\\") inString = !inString;
    if (ch === "'" && !inString && prev !== "\\") inChar = !inChar;
    if (!inString && !inChar && ch === "/" && line[i + 1] === "/") {
      return line.slice(0, i);
    }
  }
  return line;
}

function hasLargeConstraintOrInput(ctx: TutorContext): boolean {
  const constraintBlob = `${ctx.problemConstraints ?? ""} ${ctx.problemStatement ?? ""} ${ctx.exerciseTitle ?? ""}`;
  if (/10\^?(9|10|11|12|13|14|15|16|17|18)|long\s+long|64-?bit|2\s*×\s*10\^9|nguyên lớn/i.test(constraintBlob)) {
    return true;
  }
  const numSource = `${ctx.stdin ?? ""} ${ctx.sampleInput ?? ""} ${ctx.expectedOutput ?? ""} ${ctx.sampleOutput ?? ""}`;
  const bigNums = numSource.match(/-?\d{10,}/g);
  if (bigNums) {
    for (const raw of bigNums) {
      try {
        const val = BigInt(raw);
        if (val > BigInt(2_000_000_000) || val < BigInt(-2_000_000_000)) {
          return true;
        }
      } catch {
        // ignore invalid bigint
      }
    }
  }
  return false;
}

function analyzeOutputMismatch(ctx: TutorContext): OfflineFinding | null {
  const actualRaw = ctx.stdout ?? "";
  const expectedRaw = ctx.expectedOutput ?? "";
  const isWrongAnswer =
    ctx.executionStatus === "Wrong Answer" ||
    Boolean(ctx.failedTestSummary) ||
    (Boolean(expectedRaw.trim()) &&
      Boolean(ctx.executionStatus) &&
      ctx.executionStatus !== "Idle" &&
      ctx.executionStatus !== "Compilation Error" &&
      normalizeForCompare(actualRaw) !== normalizeForCompare(expectedRaw));

  if (!isWrongAnswer) return null;

  const actual = normalizeForCompare(actualRaw);
  const expected = normalizeForCompare(expectedRaw);

  if (!expected) {
    return {
      category: "output_mismatch",
      title: "Kết quả chưa khớp ở một hoặc nhiều test ẩn",
      explanation:
        "Chương trình của bạn chạy đúng trên test mẫu nhưng chưa đúng với các trường hợp biên trong test ẩn (ví dụ: số âm, số 0, giá trị rất lớn hoặc mảng ít phần tử).",
      hint: "Hãy tự thử chạy với các input biên trong khung Input (stdin): `0 0`, số âm lớn, hoặc giá trị sát giới hạn đề bài để xem output có bất thường không.",
    };
  }

  if (!actual) {
    return {
      category: "output_mismatch",
      title: "Chương trình không in ra dữ liệu nào (Output rỗng)",
      explanation: `Output mong đợi là \`${expected.slice(0, 80)}\`, nhưng chương trình của bạn lại không in ra gì.`,
      hint: "Kiểm tra xem bạn đã có câu lệnh `cout << ...` chưa, hoặc có câu lệnh `if`/`return` nào làm chương trình thoát sớm trước khi in hay không.",
    };
  }

  // Check overflow signature: expected positive large number, actual negative
  const expNum = /^-?\d+$/.test(expected) ? BigInt(expected) : null;
  const actNum = /^-?\d+$/.test(actual) ? BigInt(actual) : null;
  if (expNum !== null && actNum !== null) {
    if ((expNum > BigInt(2_147_483_647) || expNum < BigInt(-2_147_483_648)) && expNum !== actNum) {
      return {
        category: "int_overflow",
        title: "Nghi ngờ tràn số 32-bit (Integer Overflow) khi so sánh output",
        explanation: `Output mong đợi là \`${expected}\` (vượt phạm vi \`int\` tối đa ~2.14 tỷ), còn chương trình in ra \`${actual}\`${
          actNum < BigInt(0) && expNum > BigInt(0) ? " — thậm chí bị lật sang số âm, đây là dấu hiệu kinh điển của tràn số `int`" : ""
        }.`,
        hint: "Hãy rà lại tất cả biến đầu vào, biến trung gian và biểu thức phép tính để chuyển sang kiểu số nguyên 64-bit (`long long`).",
      };
    }

    const diff = expNum > actNum ? expNum - actNum : actNum - expNum;
    if (diff === BigInt(1)) {
      return {
        category: "output_mismatch",
        title: "Kết quả lệch đúng 1 đơn vị (lỗi Off-by-one)",
        explanation: `Output thực tế là \`${actual}\`, lệch đúng 1 đơn vị so với output mong đợi \`${expected}\`.`,
        hint: "Kiểm tra lại điều kiện dừng vòng lặp (`<` hay `<=`), giá trị khởi tạo ban đầu (`0` hay `1`), hoặc chỉ số phần tử đầu/cuối.",
      };
    }

    if (actNum === -expNum && expNum !== BigInt(0)) {
      return {
        category: "output_mismatch",
        title: "Kết quả bị ngược dấu (+/-)",
        explanation: `Output thực tế là \`${actual}\` đang ngược dấu so với output mong đợi \`${expected}\`.`,
        hint: "Kiểm tra lại thứ tự phép trừ hoặc điều kiện dấu âm/dương trong công thức tính của bạn.",
      };
    }
  }

  // Check prompt text printed accidentally ("Nhap a: 8" vs "8")
  if (actual.includes(expected) && actual.length > expected.length + 2) {
    return {
      category: "output_mismatch",
      title: "In thừa chữ hướng dẫn hoặc ký tự ngoài yêu cầu",
      explanation: `Output thực tế (\`${actual.slice(0, 80)}\`) có chứa kết quả \`${expected.slice(
        0,
        40
      )}\` nhưng bị thừa chữ/ký tự đi kèm.`,
      hint: "Khi chấm bài tự động, KHÔNG in các câu nhắc như `Nhap a:` hay `Ket qua la:`. Chỉ in đúng giá trị đáp án theo định dạng đề yêu cầu.",
    };
  }

  // Case or whitespace difference
  if (actual.toLowerCase() === expected.toLowerCase()) {
    return {
      category: "output_mismatch",
      title: "Sai chữ hoa / chữ thường trong output",
      explanation: `Output thực tế là \`${actual}\` nhưng đề bài yêu cầu chính xác \`${expected}\`.`,
      hint: "C++ và hệ thống chấm bài phân biệt chữ hoa/thường (`YES` khác `Yes` và `yes`). Hãy sửa lại đúng chữ hoa/thường theo yêu cầu đề.",
    };
  }

  if (actual.replace(/\s+/g, "") === expected.replace(/\s+/g, "")) {
    return {
      category: "output_mismatch",
      title: "Sai khoảng trắng hoặc xuống dòng giữa các giá trị in ra",
      explanation: `Các giá trị bạn in ra có vẻ giống đáp án nhưng thiếu/thừa dấu cách hoặc xuống dòng (thực tế: \`${actual.slice(
        0,
        60
      )}\`, mong đợi: \`${expected.slice(0, 60)}\`).`,
      hint: "Kiểm tra lại dấu cách `\" \"` hoặc `\"\\n\"` giữa các biến khi dùng `cout << ...`.",
    };
  }

  const actualLines = actual.split("\n");
  const expectedLines = expected.split("\n");
  if (actualLines.length !== expectedLines.length) {
    return {
      category: "output_mismatch",
      title: `Số dòng in ra không khớp (in ${actualLines.length} dòng, mong đợi ${expectedLines.length} dòng)`,
      explanation: `Chương trình in ra ${actualLines.length} dòng trong khi test yêu cầu ${expectedLines.length} dòng.`,
      hint: "Kiểm tra xem bạn có đặt `cout` nhầm vào trong/ngoài vòng lặp hoặc thiếu/thừa ký tự xuống dòng `\"\\n\"` hay không.",
    };
  }

  return {
    category: "output_mismatch",
    title: "Output thực tế chưa khớp với output mong đợi",
    explanation: `Với input hiện tại, chương trình in ra \`${actual.slice(0, 80)}\` nhưng output mong đợi là \`${expected.slice(
      0,
      80
    )}\`.`,
    hint: "Hãy thử tự chạy tay (trace) từng dòng code với đúng dữ liệu mẫu để xem giá trị biến thay đổi khác với công thức ở bước nào.",
  };
}

export function analyzeCppCodeStatically(code: string, ctx: TutorContext): OfflineFinding[] {
  const findings: OfflineFinding[] = [];
  const rawLines = code.replace(/\r\n/g, "\n").split("\n");
  const cleanLines = rawLines.map(stripInlineComment);
  const fullClean = cleanLines.join("\n");
  const seenKeys = new Set<string>();

  const pushUnique = (f: OfflineFinding) => {
    const key = `${f.category}:${f.line ?? 0}:${f.title}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      findings.push(f);
    }
  };

  // 1) Parse Clang compiler diagnostics first (exact line + column!)
  if (ctx.compileOutput?.trim()) {
    const parsed = parseClangDiagnostics(ctx.compileOutput);
    for (const m of parsed.markers.filter((x) => x.severity === "error").slice(0, 5)) {
      let category: OfflineFinding["category"] = "compile_error";
      let hint = "Đọc lại dòng code bị đánh dấu và dòng ngay phía trên nó để kiểm tra cú pháp C++.";

      if (/expected ';'/.test(m.originalMessage)) {
        category = "missing_semicolon";
        hint = `Kiểm tra cuối dòng ${m.line} (hoặc cuối dòng ${Math.max(1, m.line - 1)}) xem có quên dấu chấm phẩy \`;\` không.`;
      } else if (/use of undeclared identifier/.test(m.originalMessage)) {
        category = "undeclared_or_header";
        hint =
          "Kiểm tra tên biến đã được khai báo trước khi dùng chưa, có viết sai chính tả/hoa-thường không, hoặc đã có `#include` / `using namespace std;` chưa.";
      } else if (/file not found/.test(m.originalMessage)) {
        category = "undeclared_or_header";
        hint = "Kiểm tra lại chính tả tên thư viện chuẩn trong `#include <...>` (ví dụ: `<iostream>`, `<vector>`, `<algorithm>`).";
      } else if (/invalid operands to binary expression/.test(m.originalMessage)) {
        category = "io_mistake";
        hint = "Kiểm tra chiều toán tử luồng (`cin >>` dùng dấu `>>`, còn `cout <<` dùng dấu `<<`) và kiểu dữ liệu hai vế phép toán.";
      } else if (/non-void function does not return/.test(m.originalMessage)) {
        category = "missing_return";
        hint = "Đảm bảo mọi nhánh `if / else` trong hàm đều kết thúc bằng lệnh `return` có kiểu khớp với khai báo hàm.";
      } else if (/cannot initialize|incompatible type|no viable conversion/.test(m.originalMessage)) {
        category = "type_or_comparison";
        hint = "Kiểm tra lại kiểu dữ liệu của biến và giá trị đang gán (ví dụ: không thể gán chuỗi vào biến `int` mà không chuyển kiểu).";
      }

      pushUnique({
        category,
        line: m.line,
        title: `Lỗi biên dịch tại dòng ${m.line}, cột ${m.column}`,
        explanation: m.vietnameseMessage,
        hint,
      });
    }
  }

  // 2) Infinite loop & timeout/output-limit checks
  for (let i = 0; i < cleanLines.length; i++) {
    const line = cleanLines[i];
    const trimmed = line.trim();
    const lineNo = i + 1;

    if (/\bwhile\s*\(\s*(true|1)\s*\)|\bfor\s*\(\s*;\s*;\s*\)/.test(trimmed)) {
      const lookahead = cleanLines.slice(i, Math.min(cleanLines.length, i + 20)).join("\n");
      if (!/\b(break|return)\b/.test(lookahead)) {
        pushUnique({
          category: "infinite_loop",
          line: lineNo,
          title: `Vòng lặp vô hạn tại dòng ${lineNo}`,
          explanation:
            "Vòng lặp có điều kiện luôn đúng (`while(true)` / `while(1)` / `for(;;)`) nhưng bên trong không thấy câu lệnh dừng (`break` hoặc `return`).",
          hint: "Hãy thay điều kiện lặp bằng điều kiện dừng cụ thể hoặc bổ sung nhánh `if (...) break;` để vòng lặp kết thúc được.",
        });
      }
    }

    // Stray semicolon after while(...) or for(...)
    if (/^\s*(while|for)\s*\([^)]*\)\s*;\s*$/.test(trimmed) && !/^\s*do\b/.test(cleanLines[i - 1] ?? "")) {
      pushUnique({
        category: "infinite_loop",
        line: lineNo,
        title: `Dư dấu chấm phẩy ';' ngay sau câu lệnh vòng lặp ở dòng ${lineNo}`,
        explanation:
          "Dấu `;` ngay sau `while(...)` hoặc `for(...)` làm thân vòng lặp bị rỗng, dễ gây vòng lặp vô hạn hoặc khối `{ ... }` phía dưới chỉ chạy 1 lần.",
        hint: `Hãy xóa dấu \`;\` ở cuối dòng ${lineNo} để khối lệnh bên dưới thực sự nằm trong vòng lặp.`,
      });
    }

    // Wrong direction loop: for (int i = ...; i >= 0; i++)
    if (/\bfor\s*\([^;]*;\s*([a-zA-Z_]\w*)\s*>=?\s*0\s*;\s*\1\s*\+\+|\bfor\s*\([^;]*;\s*([a-zA-Z_]\w*)\s*>=?\s*0\s*;\s*\+\+\2/.test(trimmed)) {
      pushUnique({
        category: "infinite_loop",
        line: lineNo,
        title: `Hướng tăng/giảm biến lặp có nguy cơ lặp vô hạn ở dòng ${lineNo}`,
        explanation: "Điều kiện dừng kiểm tra biến `>= 0` nhưng biến lặp lại đang tăng (`++`) thay vì giảm (`--`).",
        hint: "Kiểm tra lại xem biến lặp cần giảm (`i--`) hay điều kiện dừng cần đổi sang `i < n`.",
      });
    }

    // Simple while(var > 0) where var never appears modified in following lines
    const simpleWhile = trimmed.match(/^while\s*\(\s*([a-zA-Z_]\w*)\s*(>|>=|!=)\s*0\s*\)/);
    if (simpleWhile) {
      const varName = simpleWhile[1];
      const bodySnippet = cleanLines.slice(i + 1, Math.min(cleanLines.length, i + 18)).join("\n");
      const modRegex = new RegExp(`\\b${varName}\\s*(--|\\+\\+|-=|\\+=|\\/=|\\*=|=)|(--|\\+\\+)\\s*${varName}\\b|cin\\s*>>[^;]*\\b${varName}\\b`);
      if (bodySnippet.trim() && !modRegex.test(bodySnippet)) {
        pushUnique({
          category: "infinite_loop",
          line: lineNo,
          title: `Biến điều kiện \`${varName}\` không thay đổi trong vòng lặp while ở dòng ${lineNo}`,
          explanation: `Vòng lặp kiểm tra \`${varName}\` nhưng không thấy dòng lệnh nào cập nhật giá trị của \`${varName}\` bên trong vòng lặp.`,
          hint: `Đảm bảo bên trong vòng lặp có bước làm thay đổi \`${varName}\` (ví dụ giảm \`${varName}\` hoặc chia \`${varName} /= 10\`) để tiến tới điều kiện dừng.`,
        });
      }
    }
  }

  if (ctx.executionStatus === "Time Limit Exceeded" && !findings.some((f) => f.category === "infinite_loop")) {
    pushUnique({
      category: "infinite_loop",
      title: "Chương trình vượt quá thời gian chạy (TLE — 3 giây)",
      explanation:
        "Code chạy quá 3 giây, thường do vòng lặp không bao giờ dừng hoặc độ phức tạp thuật toán quá lớn (ví dụ hai vòng lặp lồng nhau O(N²) khi N lớn).",
      hint: "Kiểm tra điều kiện dừng của mọi vòng lặp `while`/`for` và ước lượng số phép toán khi dữ liệu đạt giới hạn tối đa.",
    });
  }

  if (ctx.stderr && /1MB|Output Limit/i.test(ctx.stderr) && !findings.some((f) => f.category === "infinite_loop")) {
    pushUnique({
      category: "infinite_loop",
      title: "In dữ liệu quá giới hạn 1MB (nghi ngờ in trong vòng lặp vô hạn)",
      explanation: "Chương trình liên tục gọi `cout` vượt quá giới hạn 1MB và đã bị dừng an toàn.",
      hint: "Kiểm tra vòng lặp chứa câu lệnh `cout`: điều kiện dừng đã đạt được chưa, hoặc có đặt `cout` nhầm vào trong vòng lặp không?",
    });
  }

  // 3) Integer overflow detection (int when long long needed)
  const needs64Bit = hasLargeConstraintOrInput(ctx);
  for (let i = 0; i < cleanLines.length; i++) {
    const trimmed = cleanLines[i].trim();
    const lineNo = i + 1;
    // Match `int a, b;` or `int sum = 0;` but NOT `int main` or `long long`
    if (
      /\bint\s+[a-zA-Z_]\w*/.test(trimmed) &&
      !/\bint\s+main\s*\(/.test(trimmed) &&
      !/\blong\s+long\b/.test(trimmed)
    ) {
      if (needs64Bit) {
        pushUnique({
          category: "int_overflow",
          line: lineNo,
          title: `Nguy cơ tràn số kiểu \`int\` tại dòng ${lineNo}`,
          explanation:
            "Kiểu `int` (32-bit) chỉ lưu được tối đa `2,147,483,647` (~2.14 × 10⁹). Với giới hạn bài toán này, phép cộng/nhân trên `int` sẽ bị tràn số và ra kết quả sai (thậm chí thành số âm).",
          hint: `Hãy kiểm tra dòng ${lineNo} và cân nhắc đổi kiểu dữ liệu sang kiểu số nguyên 64-bit (\`long long\`, lưu được tới ~9.22 × 10¹⁸).`,
        });
        break;
      }
    }
  }

  // 4) Wrong stream direction (cin << or cout >>) & cin + getline trap
  let cinLine: number | null = null;
  let hasCinIgnore = /\bcin\.ignore\s*\(|\bws\b/.test(fullClean);
  for (let i = 0; i < cleanLines.length; i++) {
    const trimmed = cleanLines[i].trim();
    const lineNo = i + 1;
    if (/\bcin\s*<</.test(trimmed)) {
      pushUnique({
        category: "io_mistake",
        line: lineNo,
        title: `Dùng ngược toán tử cho \`cin\` tại dòng ${lineNo}`,
        explanation: "`cin` đọc dữ liệu vào biến nên phải dùng mũi tên hướng về biến (`>>`), không phải `<<`.",
        hint: `Sửa \`cin <<\` thành \`cin >>\` tại dòng ${lineNo}.`,
      });
    }
    if (/\bcout\s*>>/.test(trimmed)) {
      pushUnique({
        category: "io_mistake",
        line: lineNo,
        title: `Dùng ngược toán tử cho \`cout\` tại dòng ${lineNo}`,
        explanation: "`cout` đẩy dữ liệu ra màn hình nên phải dùng mũi tên `<<`, không phải `>>`.",
        hint: `Sửa \`cout >>\` thành \`cout <<\` tại dòng ${lineNo}.`,
      });
    }
    if (/\bcin\s*>>/.test(trimmed) && cinLine === null) cinLine = lineNo;
    if (/\bgetline\s*\(\s*cin/.test(trimmed) && cinLine !== null && lineNo > cinLine && !hasCinIgnore) {
      hasCinIgnore = true;
      pushUnique({
        category: "io_mistake",
        line: lineNo,
        title: `Trộn \`cin >>\` và \`getline(cin, ...)\` tại dòng ${lineNo}`,
        explanation:
          "`cin >>` để lại ký tự xuống dòng `'\\n'` trong bộ đệm nhập, khiến lệnh `getline` ngay sau đó đọc phải một chuỗi rỗng.",
        hint: `Trước dòng ${lineNo}, hãy xóa ký tự xuống dòng còn sót lại (ví dụ dùng \`cin.ignore()\` hoặc \`cin >> ws\`).`,
      });
    }
  }

  // 5) Assignment '=' inside if/while condition, unsigned .size()-1 trap, int division, float ==
  for (let i = 0; i < cleanLines.length; i++) {
    const trimmed = cleanLines[i].trim();
    const lineNo = i + 1;

    // Single = inside if (...) or while (...)
    const condMatch = trimmed.match(/\b(if|while)\s*\(([^)]+)\)/);
    if (condMatch) {
      const condExpr = condMatch[2];
      // Check for single '=' not part of ==, !=, <=, >=
      if (/(?<![=!<>])=(?!=)/.test(condExpr)) {
        pushUnique({
          category: "type_or_comparison",
          line: lineNo,
          title: `Dùng nhầm toán tử gán \`=\` thay vì so sánh \`==\` ở dòng ${lineNo}`,
          explanation: `Trong điều kiện \`${condMatch[1]}(...)\`, dấu \`=\` là phép gán giá trị chứ không phải so sánh bằng.`,
          hint: `Kiểm tra lại dòng ${lineNo}: nếu bạn muốn so sánh hai giá trị bằng nhau, hãy dùng hai dấu bằng \`==\`.`,
        });
      }
    }

    // Comparing signed int with unsigned .size() - 1
    if (/\.size\(\)\s*-\s*1/.test(trimmed)) {
      pushUnique({
        category: "type_or_comparison",
        line: lineNo,
        title: `Cẩn thận so sánh với \`.size() - 1\` (kiểu không dấu) tại dòng ${lineNo}`,
        explanation:
          "Phương thức `.size()` trả về kiểu `size_t` (không dấu). Nếu vector/string rỗng (`size() == 0`), biểu thức `size() - 1` sẽ tràn ngược thành số cực lớn (`18446744073709551615`).",
        hint: `Hãy ép kiểu sang số có dấu (ví dụ \`(int)v.size() - 1\`) hoặc viết lại điều kiện dạng \`i + 1 < v.size()\` tại dòng ${lineNo}.`,
      });
    }

    // Float/double direct equality check
    if (/\b(double|float)\b/.test(fullClean) && /\bif\s*\([^)]*==[^)]*\./.test(trimmed)) {
      pushUnique({
        category: "type_or_comparison",
        line: lineNo,
        title: `So sánh trực tiếp số thực bằng \`==\` tại dòng ${lineNo}`,
        explanation: "Số thực (`float`/`double`) có sai số biểu diễn nhị phân nhỏ nên so sánh `==` dễ trả về `false` ngoài ý muốn.",
        hint: "Khi so sánh hai số thực, hãy kiểm tra hiệu tuyệt đối nhỏ hơn một ngưỡng epsilon rất nhỏ (ví dụ `fabs(a - b) < 1e-9`).",
      });
    }

    // Integer division assigned to double/float: double x = a / b;
    if (/\b(double|float)\s+[a-zA-Z_]\w*\s*=\s*[a-zA-Z_]\w*\s*\/\s*[a-zA-Z_]\w*\s*;/.test(trimmed)) {
      pushUnique({
        category: "type_or_comparison",
        line: lineNo,
        title: `Nguy cơ chia nguyên làm mất phần thập phân tại dòng ${lineNo}`,
        explanation: "Trong C++, nếu cả tử số và mẫu số đều là số nguyên (`int`/`long long`), phép chia `/` sẽ cắt bỏ phần thập phân trước khi gán sang `double`.",
        hint: `Nếu cần kết quả số thực tại dòng ${lineNo}, hãy ép kiểu ít nhất một vế sang \`double\` (ví dụ \`(double)a / b\` hoặc \`1.0 * a / b\`).`,
      });
    }
  }

  // 6) Static missing semicolon check (helpful if user asks before clicking Run!)
  if (!ctx.compileOutput?.trim()) {
    for (let i = 0; i < cleanLines.length; i++) {
      const trimmed = cleanLines[i].trim();
      const nextTrimmed = (cleanLines[i + 1] ?? "").trim();
      const lineNo = i + 1;
      if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("//") || trimmed.startsWith("/*")) continue;
      if (/[;{}:\),\\]$/.test(trimmed)) continue;
      if (/^(if|else|for|while|switch|struct|class|namespace|public|private|protected)\b/.test(trimmed)) continue;
      if (/^(<<|>>|\+|\-|\*|\/|\?|&&|\|\||\{)/.test(nextTrimmed)) continue;
      if (/^(return\b|cout\b|cin\b|int\b|long\b|double\b|float\b|string\b|bool\b|char\b|vector\b|using\b)/.test(trimmed)) {
        if (!/\)\s*$/.test(trimmed)) {
          pushUnique({
            category: "missing_semicolon",
            line: lineNo,
            title: `Nghi ngờ thiếu dấu chấm phẩy ';' ở cuối dòng ${lineNo}`,
            explanation: `Câu lệnh \`${trimmed.slice(0, 60)}\` kết thúc mà chưa có dấu \`;\`.`,
            hint: `Kiểm tra cuối dòng ${lineNo} và thêm dấu \`;\` nếu đây là một câu lệnh hoàn chỉnh.`,
          });
        }
      }
    }
  }

  // 7) Missing standard headers or using namespace std
  const missingHeaders: Array<{ symbol: RegExp; header: string; label: string }> = [
    { symbol: /\b(cin|cout|cerr)\b/, header: "iostream", label: "`cin`/`cout`" },
    { symbol: /\bvector\s*</, header: "vector", label: "`vector`" },
    { symbol: /\b(sort|reverse|lower_bound|upper_bound)\s*\(/, header: "algorithm", label: "`sort`/thuật toán STL" },
    { symbol: /\b(sqrt|pow|fabs|ceil|floor)\s*\(/, header: "cmath", label: "hàm toán học (`sqrt`/`pow`)" },
    { symbol: /\b(setprecision|setw)\s*\(/, header: "iomanip", label: "`setprecision`" },
  ];
  for (const req of missingHeaders) {
    if (
      req.symbol.test(fullClean) &&
      !new RegExp(`#include\\s*<\\s*(${req.header}|bits/stdc\\+\\+\\.h)\\s*>`).test(fullClean)
    ) {
      pushUnique({
        category: "undeclared_or_header",
        line: 1,
        title: `Có thể đang thiếu thư viện \`#include <${req.header}>\``,
        explanation: `Code của bạn sử dụng ${req.label} nhưng chưa thấy khai báo \`#include <${req.header}>\` ở đầu chương trình.`,
        hint: `Thêm \`#include <${req.header}>\` vào phần đầu tệp nguồn.`,
      });
    }
  }
  if (
    /\b(cin|cout|string|vector)\b/.test(fullClean) &&
    !/using\s+namespace\s+std\s*;/.test(fullClean) &&
    !/\bstd::(cin|cout|string|vector)\b/.test(fullClean)
  ) {
    pushUnique({
      category: "undeclared_or_header",
      line: 2,
      title: "Chưa khai báo không gian tên `std`",
      explanation: "Bạn dùng `cin`/`cout`/`string`/`vector` nhưng chưa có `using namespace std;` hoặc tiền tố `std::`.",
      hint: "Thêm `using namespace std;` ở đầu file (sau các `#include`) hoặc viết đầy đủ `std::cin`, `std::cout`.",
    });
  }

  // 8) Missing return in non-void functions (including helper functions)
  const fnRegex = /^\s*(int|long\s+long|double|float|bool|string|char)\s+([a-zA-Z_]\w*)\s*\([^;]*\)\s*\{/;
  for (let i = 0; i < cleanLines.length; i++) {
    const m = cleanLines[i].match(fnRegex);
    if (!m) continue;
    const retType = m[1];
    const fnName = m[2];
    const lineNo = i + 1;
    // Walk braces to find function end
    let depth = 0;
    let endIdx = i;
    for (let j = i; j < cleanLines.length; j++) {
      for (const ch of cleanLines[j]) {
        if (ch === "{") depth++;
        else if (ch === "}") depth--;
      }
      endIdx = j;
      if (depth <= 0) break;
    }
    const fnBody = cleanLines.slice(i, endIdx + 1).join("\n");
    if (!/\breturn\b/.test(fnBody)) {
      pushUnique({
        category: "missing_return",
        line: lineNo,
        title:
          fnName === "main"
            ? `Hàm \`main()\` ở dòng ${lineNo} chưa có \`return 0;\``
            : `Hàm \`${fnName}()\` kiểu \`${retType}\` ở dòng ${lineNo} đang thiếu lệnh \`return\``,
        explanation:
          fnName === "main"
            ? "Dù chuẩn C++ cho phép ngầm trả về 0 ở `main()`, người mới nên luôn viết rõ `return 0;` ở cuối để rõ luồng kết thúc."
            : `Hàm \`${fnName}\` khai báo trả về kiểu \`${retType}\` nhưng không có lệnh \`return\` nào trong thân hàm — gây lỗi biên dịch hoặc hành vi không xác định (Undefined Behavior).`,
        hint:
          fnName === "main"
            ? "Thêm `return 0;` trước dấu `}` đóng của hàm `main()`."
            : `Kiểm tra lại hàm \`${fnName}\` (từ dòng ${lineNo} đến dòng ${endIdx + 1}) và trả về giá trị đúng kiểu \`${retType}\`.`,
      });
    }
  }

  // 9) Uninitialized accumulator variable (`int sum;` then `sum +=`)
  for (let i = 0; i < cleanLines.length; i++) {
    const lineNo = i + 1;
    const uninit = cleanLines[i].match(/^\s*(?:int|long\s+long|double|float)\s+([a-zA-Z_]\w*)\s*;\s*$/);
    if (uninit) {
      const varName = uninit[1];
      const rest = cleanLines.slice(i + 1).join("\n");
      const usedBeforeAssign = new RegExp(`\\b${varName}\\s*(\\+=|-=|\\*=|\\+\\+)`).test(rest);
      const assignedPlain = new RegExp(`\\b${varName}\\s*=[^=]|cin\\s*>>[^;]*\\b${varName}\\b`).test(rest);
      if (usedBeforeAssign && !assignedPlain) {
        pushUnique({
          category: "uninitialized_var",
          line: lineNo,
          title: `Biến \`${varName}\` ở dòng ${lineNo} chưa được khởi tạo giá trị ban đầu`,
          explanation: `Trong C++, biến cục bộ \`${varName}\` không tự động bằng 0 mà chứa "giá trị rác" trong bộ nhớ. Khi cộng dồn (\`${varName} += ...\`), kết quả sẽ sai ngẫu nhiên.`,
          hint: `Hãy gán giá trị khởi đầu rõ ràng ngay tại dòng ${lineNo} (ví dụ \`= 0;\` cho tổng hoặc \`= 1;\` cho tích).`,
        });
      }
    }
  }

  // 10) Off-by-one loop bound with 0-indexed vector/array (`i <= v.size()`)
  for (let i = 0; i < cleanLines.length; i++) {
    const trimmed = cleanLines[i].trim();
    const lineNo = i + 1;
    if (/\bfor\s*\([^;]*=\s*0\s*;[^;]*<=\s*[a-zA-Z_]\w*\.size\(\)/.test(trimmed)) {
      pushUnique({
        category: "array_bounds",
        line: lineNo,
        title: `Nguy cơ truy cập vượt quá chỉ số mảng/vector tại dòng ${lineNo}`,
        explanation: "Mảng/vector trong C++ đánh chỉ số từ `0` đến `size() - 1`. Điều kiện `i <= v.size()` sẽ truy cập phần tử ngoài biên ở vòng cuối.",
        hint: `Đổi điều kiện \`<=\` thành \`<\` tại dòng ${lineNo}.`,
      });
    }
  }

  // 11) Output mismatch analysis
  const mismatch = analyzeOutputMismatch(ctx);
  if (mismatch) {
    pushUnique(mismatch);
  }

  return findings;
}

function buildOfflineExplainReply(code: string, findings: OfflineFinding[], ctx: TutorContext): string {
  const rawLines = code.replace(/\r\n/g, "\n").split("\n");
  const summaryBullets: string[] = [];

  for (let i = 0; i < rawLines.length; i++) {
    const t = stripInlineComment(rawLines[i]).trim();
    const ln = i + 1;
    if (!t) continue;
    if (t.startsWith("#include")) {
      summaryBullets.push(`- **Dòng ${ln}** (\`${t}\`): Khai báo thư viện chuẩn để dùng các lệnh nhập xuất / cấu trúc dữ liệu.`);
    } else if (/^using\s+namespace\s+std/.test(t)) {
      summaryBullets.push(`- **Dòng ${ln}**: Cho phép viết gọn \`cin\`, \`cout\` thay vì \`std::cin\`, \`std::cout\`.`);
    } else if (/^int\s+main\s*\(/.test(t)) {
      summaryBullets.push(`- **Dòng ${ln}**: Điểm bắt đầu thực thi của mọi chương trình C++.`);
    } else if (/\bcin\s*>>/.test(t)) {
      summaryBullets.push(`- **Dòng ${ln}** (\`${t.slice(0, 50)}\`): Đọc dữ liệu đầu vào từ luồng nhập chuẩn (stdin).`);
    } else if (/\bcout\s*<</.test(t)) {
      summaryBullets.push(`- **Dòng ${ln}** (\`${t.slice(0, 50)}\`): In kết quả ra màn hình (stdout).`);
    } else if (/^(for|while)\s*\(/.test(t)) {
      summaryBullets.push(`- **Dòng ${ln}** (\`${t.slice(0, 50)}\`): Vòng lặp thực hiện lặp lại khối lệnh theo điều kiện.`);
    } else if (/^(if|else\s+if)\s*\(/.test(t)) {
      summaryBullets.push(`- **Dòng ${ln}** (\`${t.slice(0, 50)}\`): Câu lệnh rẽ nhánh kiểm tra điều kiện logic.`);
    } else if (/^(int|long\s+long|double|float|string|bool|char|vector)\b/.test(t)) {
      summaryBullets.push(`- **Dòng ${ln}** (\`${t.slice(0, 50)}\`): Khai báo biến / cấu trúc dữ liệu để lưu trữ giá trị.`);
    }
    if (summaryBullets.length >= 8) break;
  }

  const out: string[] = [
    "### Giải thích cấu trúc code của bạn (Chế độ Offline thông minh)",
    "",
    ...(summaryBullets.length > 0
      ? summaryBullets
      : ["- Đoạn code hiện tại còn khá ngắn. Hãy thử viết phần nhập dữ liệu (`cin`) và xử lý chính rồi chạy thử!"]),
  ];

  if (findings.length > 0) {
    out.push("", "### Điểm cần lưu ý phát hiện trong code:");
    for (const f of findings.slice(0, 3)) {
      out.push(`- **${f.title}**: ${f.explanation}`);
      out.push(`  - *Hướng kiểm tra:* ${f.hint}`);
    }
  } else if (ctx.problemConstraints) {
    out.push("", `**Gợi ý kiểm tra thêm:** Đối chiếu kiểu dữ liệu các biến của bạn với giới hạn đề bài (\`${ctx.problemConstraints}\`).`);
  }

  return out.join("\n");
}

function isAskingAboutCurrentCode(message: string, ctx: TutorContext): boolean {
  const norm = stripVietnameseAccents(message);
  if (
    /\b(code cua toi|doan code|bai cua toi|loi vua gap|sai o dau|tai sao sai|tim loi|sua loi|ra so am|wrong answer|bi loi|khong chay|chay sai|tle|kiem tra loi|ra soat|giai thich tung dong)\b/.test(
      norm
    )
  ) {
    return true;
  }
  if (
    ctx.compileOutput?.trim() ||
    ctx.executionStatus === "Wrong Answer" ||
    ctx.executionStatus === "Time Limit Exceeded" ||
    ctx.executionStatus === "Runtime Error"
  ) {
    // Only prioritize code debugging if the user isn't explicitly asking to learn an unrelated concept
    const topicHits = matchOfflineTopics(message, ctx);
    if (topicHits.length > 0 && /\b(hoc ve|la gi|so sanh|khac gi|tao bai tap|sinh bai tap)\b/.test(norm)) {
      return false;
    }
    return true;
  }
  return false;
}

/**
 * Pure, deterministic smart offline coding tutor (works on BOTH server and client with zero API key).
 * Combines 25+ Vietnamese CS/C++/STL/Web knowledge topics + conversation context + static C++ bug analysis.
 * Never dumps a complete graded exercise solution; points out exact error lines and step-by-step fix directions.
 */
export function generateOfflineTutorReply(params: {
  message: string;
  history?: TutorHistoryMessage[];
  context: TutorContext;
}): string {
  const { message, history, context } = params;
  const code = context.codeContext?.trim() ?? "";
  const isCpp = !context.courseLanguage || context.courseLanguage === "cpp";

  // 1) If user has no code attached, OR is explicitly asking about a CS/programming topic (e.g. "học về map", "so sánh stack và queue")
  // rather than debugging their editor code -> answer directly from the trained Vietnamese knowledge base!
  if (!code) {
    return answerKnowledgeQueryOffline({ message, history, context });
  }

  const askingOwnCode = isAskingAboutCurrentCode(message, context);
  const topicMatches = matchOfflineTopics(message, context);
  if (!askingOwnCode && topicMatches.length > 0 && context.mode !== "debug") {
    return answerKnowledgeQueryOffline({ message, history, context });
  }

  const findings = isCpp ? analyzeCppCodeStatically(code, context) : [];

  // 2) If user explicitly asks to explain their own code and there's no hard compile/runtime error
  const askingExplainOwnCode =
    context.mode === "explain" &&
    askingOwnCode &&
    !context.compileOutput?.trim() &&
    context.executionStatus !== "Wrong Answer" &&
    context.executionStatus !== "Time Limit Exceeded" &&
    context.executionStatus !== "Runtime Error";

  if (askingExplainOwnCode) {
    return buildOfflineExplainReply(code, findings, context);
  }

  if (findings.length === 0) {
    // If user asked a concept question while code happened to be in editor, answer the concept!
    if (topicMatches.length > 0) {
      return answerKnowledgeQueryOffline({ message, history, context });
    }

    const lines: string[] = ["### Phân tích code hiện tại (Chế độ Offline thông minh)", ""];
    if (context.executionStatus === "Accepted") {
      lines.push(
        "Đoạn code hiện tại của bạn đã chạy/đạt kết quả tốt và chưa phát hiện lỗi cú pháp hay lỗi biên phổ biến nào!"
      );
      lines.push(
        "- **Gợi ý kiểm tra thêm:** Hãy thử thêm các test biên (`0`, số âm, dữ liệu lớn nhất theo đề bài) và đảm bảo tên biến đặt rõ nghĩa."
      );
      return lines.join("\n");
    }

    // No static bug matched yet -> provide structured problem-guided debugging steps (NO full solution!)
    lines.push(
      "Mình chưa phát hiện lỗi cú pháp phổ biến nào trong đoạn code hiện tại. Hãy kiểm tra logic theo từng bước sau:"
    );
    if (context.problemConstraints) {
      lines.push(`1. **Kiểm tra giới hạn đề bài:** \`${context.problemConstraints}\` — kiểu dữ liệu đã đủ rộng chưa?`);
    } else {
      lines.push("1. **Kiểm tra kiểu dữ liệu & khởi tạo:** Mọi biến tích lũy (tổng/đếm/min/max) đã được gán giá trị khởi đầu đúng chưa?");
    }
    lines.push(
      "2. **Chạy thử với Input mẫu (`Ctrl+Enter`):** Quan sát Output thực tế có trùng khớp từng ký tự, dấu cách và xuống dòng với Output mẫu không.",
      "3. **Tự tạo test nhỏ để kiểm tra công thức:** In tạm giá trị các biến trung gian (hoặc nhẩm tay trên giấy) để tìm bước tính lệch đầu tiên."
    );
    if (context.problemHints && context.problemHints.length > 0) {
      lines.push(`4. **Gợi ý tư duy của bài:** ${context.problemHints[0]}`);
    }
    return lines.join("\n");
  }

  const lines: string[] = [
    `### Phân tích lỗi & gợi ý sửa từng bước (Chế độ Offline thông minh)`,
    "",
    `Mình phát hiện **${findings.length} vấn đề** cần chú ý trong đoạn code hiện tại (mình chỉ gợi ý hướng sửa để bạn tự hoàn thiện, không đưa sẵn đáp án hoàn chỉnh):`,
    "",
  ];

  const rawCodeLines = code.replace(/\r\n/g, "\n").split("\n");
  findings.slice(0, 5).forEach((f, idx) => {
    lines.push(`**${idx + 1}. ${f.title}**`);
    if (f.line && rawCodeLines[f.line - 1] !== undefined) {
      lines.push(`> Dòng ${f.line}: \`${rawCodeLines[f.line - 1].trim()}\``);
    }
    lines.push(`- **Nguyên nhân:** ${f.explanation}`);
    lines.push(`- **Hướng sửa gợi ý:** ${f.hint}`);
    lines.push("");
  });

  if (context.problemHints && context.problemHints.length > 0 && context.mode === "hint") {
    lines.push(`**Gợi ý thêm cho đề bài:** ${context.problemHints[0]}`, "");
  }

  lines.push(
    "**Bước tiếp theo:** Hãy sửa lần lượt từ mục #1, nhấn **`Ctrl + Enter`** để chạy thử lại với `Input (stdin)`, sau đó kiểm tra lại kết quả!"
  );

  return lines.join("\n");
}
