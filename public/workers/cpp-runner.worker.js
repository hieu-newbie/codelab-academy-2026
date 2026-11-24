import {
  WASI,
  WASIProcExit,
  File,
  OpenFile,
  ConsoleStdout,
} from "/wasm/wasi/index.js";

const MAX_OUTPUT_BYTES = 1024 * 1024; // Exact 1MB output limit

class OutputLimitError extends Error {
  constructor() {
    super("OUTPUT_LIMIT_EXCEEDED");
    this.name = "OutputLimitError";
  }
}

self.onmessage = async (event) => {
  const { type, requestId, wasmBytes, stdin } = event.data || {};
  if (type !== "run") return;

  const encoder = new TextEncoder();
  const outDecoder = new TextDecoder();
  const errDecoder = new TextDecoder();

  let stdout = "";
  let stderr = "";
  let stdoutBytes = 0;
  let stderrBytes = 0;

  const stdinBytes = encoder.encode(typeof stdin === "string" ? stdin : "");

  const fds = [
    new OpenFile(new File(stdinBytes)),
    new ConsoleStdout((chunk) => {
      const remaining = MAX_OUTPUT_BYTES - stdoutBytes;
      if (remaining <= 0) {
        throw new OutputLimitError();
      }
      if (chunk.byteLength > remaining) {
        stdout += outDecoder.decode(chunk.subarray(0, remaining), { stream: true });
        stdoutBytes = MAX_OUTPUT_BYTES;
        throw new OutputLimitError();
      }
      stdoutBytes += chunk.byteLength;
      stdout += outDecoder.decode(chunk, { stream: true });
    }),
    new ConsoleStdout((chunk) => {
      const remaining = MAX_OUTPUT_BYTES - stderrBytes;
      if (remaining <= 0) {
        throw new OutputLimitError();
      }
      if (chunk.byteLength > remaining) {
        stderr += errDecoder.decode(chunk.subarray(0, remaining), { stream: true });
        stderrBytes = MAX_OUTPUT_BYTES;
        throw new OutputLimitError();
      }
      stderrBytes += chunk.byteLength;
      stderr += errDecoder.decode(chunk, { stream: true });
    }),
  ];

  const wasi = new WASI(["main.wasm"], [], fds);
  let memoryKb = null;
  const startTime = performance.now();

  try {
    const wasmModule = await WebAssembly.compile(wasmBytes);
    const instance = await WebAssembly.instantiate(wasmModule, {
      wasi_snapshot_preview1: wasi.wasiImport,
    });

    const exitCode = wasi.start(instance);
    stdout += outDecoder.decode();
    stderr += errDecoder.decode();

    const mem = instance.exports && instance.exports.memory;
    if (mem instanceof WebAssembly.Memory) {
      memoryKb = Math.round(mem.buffer.byteLength / 1024);
    }

    const timeMs = Math.max(1, Math.round(performance.now() - startTime));

    if (exitCode === 0) {
      self.postMessage({
        type: "result",
        requestId,
        status: "Accepted",
        stdout,
        stderr,
        exitCode: 0,
        timeMs,
        memoryKb,
        outputTruncated: false,
      });
    } else {
      self.postMessage({
        type: "result",
        requestId,
        status: "Runtime Error",
        stdout,
        stderr:
          stderr ||
          `Chương trình kết thúc bất thường với mã thoát (exit code): ${exitCode}`,
        exitCode,
        timeMs,
        memoryKb,
        outputTruncated: false,
      });
    }
  } catch (err) {
    stdout += outDecoder.decode();
    stderr += errDecoder.decode();
    const timeMs = Math.max(1, Math.round(performance.now() - startTime));

    if (err instanceof OutputLimitError) {
      self.postMessage({
        type: "result",
        requestId,
        status: "Runtime Error",
        stdout: stdout.slice(0, 16000) + (stdout.length > 16000 ? "\n... (đã thu gọn hiển thị đầu ra)" : ""),
        stderr:
          "Vượt quá giới hạn đầu ra 1MB (Output Limit Exceeded). Chương trình đã được dừng an toàn (kiểm tra vòng lặp in vô hạn).",
        exitCode: 137,
        timeMs,
        memoryKb,
        outputTruncated: true,
      });
      return;
    }

    if (err instanceof WASIProcExit) {
      const ok = err.code === 0;
      self.postMessage({
        type: "result",
        requestId,
        status: ok ? "Accepted" : "Runtime Error",
        stdout,
        stderr: ok
          ? stderr
          : stderr || `Chương trình thoát với mã lỗi ${err.code}`,
        exitCode: err.code,
        timeMs,
        memoryKb,
        outputTruncated: false,
      });
      return;
    }

    let friendlyErr = err && err.message ? err.message : String(err);
    if (friendlyErr.includes("divide by zero") || friendlyErr.includes("remainder by zero")) {
      friendlyErr = `Lỗi chia cho 0 (Division by zero): ${friendlyErr}`;
    } else if (friendlyErr.includes("out of bounds")) {
      friendlyErr = `Lỗi truy cập bộ nhớ ngoài giới hạn (Memory out of bounds): ${friendlyErr}`;
    } else if (friendlyErr.includes("unreachable")) {
      friendlyErr = `Lỗi thực thi nghiêm trọng (Abort / Trap / Tràn bộ nhớ hoặc ngoại lệ chưa bắt): ${friendlyErr}`;
    }

    self.postMessage({
      type: "result",
      requestId,
      status: "Runtime Error",
      stdout,
      stderr: stderr ? `${stderr}\n${friendlyErr}` : friendlyErr,
      exitCode: 1,
      timeMs,
      memoryKb,
      outputTruncated: false,
    });
  }
};
