"use client";

import type { SubmissionStatus } from "@/types/codelab";

export interface CppProgressEvent {
  stage: "loading_compiler" | "compiling" | "running" | "grading";
  percent?: number;
  fromCache?: boolean;
  message: string;
}

export interface CppCompileResult {
  ok: boolean;
  wasmBytes?: Uint8Array;
  compileOutput: string;
  warnings: string;
  compileTimeMs: number;
}

export interface CppRunResult {
  status: SubmissionStatus;
  stdout: string;
  stderr: string;
  compileOutput: string;
  timeMs: number | null;
  memoryKb: number | null;
  exitCode?: number;
  outputTruncated?: boolean;
}

export const DEFAULT_EXECUTION_TIMEOUT_MS = 3000;
const COMPILE_TIMEOUT_MS = 60000;

let compilerWorker: Worker | null = null;
let compileChain: Promise<unknown> = Promise.resolve();
let nextReqId = 1;

function getCompilerWorker(): Worker {
  if (!compilerWorker) {
    compilerWorker = new Worker("/workers/cpp-compiler.worker.js", {
      type: "module",
    });
  }
  return compilerWorker;
}

function resetCompilerWorker() {
  if (compilerWorker) {
    try {
      compilerWorker.terminate();
    } catch {
      // ignore
    }
    compilerWorker = null;
  }
}

/**
 * Compiles C++17 source code into a WASI WebAssembly binary inside a persistent Web Worker.
 * Serialized so concurrent clicks never clash inside the virtual compiler filesystem.
 */
export function compileCppInBrowser(
  sourceCode: string,
  onProgress?: (event: CppProgressEvent) => void
): Promise<CppCompileResult> {
  const runCompile = () =>
    new Promise<CppCompileResult>((resolve) => {
      const worker = getCompilerWorker();
      const requestId = nextReqId++;
      let settled = false;

      const finish = (result: CppCompileResult) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        worker.removeEventListener("message", onMessage);
        worker.removeEventListener("error", onError);
        resolve(result);
      };

      const timer = setTimeout(() => {
        resetCompilerWorker();
        finish({
          ok: false,
          compileOutput: "Quá thời gian biên dịch (60s). Vui lòng thử lại.",
          warnings: "",
          compileTimeMs: COMPILE_TIMEOUT_MS,
        });
      }, COMPILE_TIMEOUT_MS);

      const onMessage = (ev: MessageEvent) => {
        const msg = ev.data;
        if (!msg || msg.requestId !== requestId) return;

        if (msg.type === "progress") {
          onProgress?.({
            stage: msg.stage,
            percent: msg.percent,
            fromCache: Boolean(msg.fromCache),
            message: msg.message,
          });
          return;
        }

        if (msg.type === "compiled") {
          if (msg.ok && msg.wasmBytes) {
            finish({
              ok: true,
              wasmBytes: new Uint8Array(msg.wasmBytes),
              compileOutput: "",
              warnings: msg.warnings || "",
              compileTimeMs: msg.compileTimeMs ?? 0,
            });
          } else {
            finish({
              ok: false,
              compileOutput: msg.compileOutput || "Biên dịch C++ thất bại.",
              warnings: "",
              compileTimeMs: msg.compileTimeMs ?? 0,
            });
          }
        }
      };

      const onError = (err: ErrorEvent) => {
        resetCompilerWorker();
        finish({
          ok: false,
          compileOutput: `Lỗi khởi tạo trình biên dịch WebAssembly: ${err.message || "Worker error"}`,
          warnings: "",
          compileTimeMs: 0,
        });
      };

      worker.addEventListener("message", onMessage);
      worker.addEventListener("error", onError);
      worker.postMessage({ type: "compile", requestId, sourceCode });
    });

  const next = compileChain.then(runCompile, runCompile);
  compileChain = next.catch(() => {});
  return next;
}

/**
 * Executes a compiled WASI WebAssembly binary inside a fresh disposable Web Worker
 * with a hard timeout (default 5s) so infinite loops never freeze the browser UI.
 */
export function executeWasmInWorker(
  wasmBytes: Uint8Array,
  stdin: string,
  timeoutMs = DEFAULT_EXECUTION_TIMEOUT_MS
): Promise<CppRunResult> {
  return new Promise((resolve) => {
    const worker = new Worker("/workers/cpp-runner.worker.js", {
      type: "module",
    });
    const requestId = nextReqId++;
    let settled = false;

    const cleanup = () => {
      clearTimeout(timer);
      try {
        worker.terminate();
      } catch {
        // ignore
      }
    };

    const finish = (result: CppRunResult) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(result);
    };

    const timer = setTimeout(() => {
      finish({
        status: "Time Limit Exceeded",
        stdout: "",
        stderr: `Quá giới hạn thời gian thực thi (${timeoutMs / 1000} giây / ${timeoutMs}ms). Chương trình đã được dừng an toàn trong Web Worker — hãy kiểm tra vòng lặp vô hạn hoặc thuật toán quá chậm.`,
        compileOutput: "",
        timeMs: timeoutMs,
        memoryKb: null,
      });
    }, timeoutMs);

    worker.onmessage = (ev: MessageEvent) => {
      const msg = ev.data;
      if (!msg || msg.requestId !== requestId || msg.type !== "result") return;
      finish({
        status: msg.status as SubmissionStatus,
        stdout: msg.stdout ?? "",
        stderr: msg.stderr ?? "",
        compileOutput: "",
        timeMs: msg.timeMs ?? null,
        memoryKb: msg.memoryKb ?? null,
        exitCode: msg.exitCode,
        outputTruncated: Boolean(msg.outputTruncated),
      });
    };

    worker.onerror = (err: ErrorEvent) => {
      finish({
        status: "Runtime Error",
        stdout: "",
        stderr: `Lỗi thực thi WebAssembly Worker: ${err.message || "Unknown runtime error"}`,
        compileOutput: "",
        timeMs: null,
        memoryKb: null,
      });
    };

    // Clone buffer so caller can reuse wasmBytes across multiple test cases!
    const bytesCopy = new Uint8Array(wasmBytes);
    worker.postMessage(
      {
        type: "run",
        requestId,
        wasmBytes: bytesCopy,
        stdin,
      },
      [bytesCopy.buffer]
    );
  });
}

/**
 * Compiles and executes a C++17 program completely inside browser Web Workers.
 */
export async function runCppInBrowser(
  sourceCode: string,
  stdin: string,
  options?: {
    timeoutMs?: number;
    onProgress?: (event: CppProgressEvent) => void;
  }
): Promise<CppRunResult> {
  const compiled = await compileCppInBrowser(sourceCode, options?.onProgress);
  if (!compiled.ok || !compiled.wasmBytes) {
    return {
      status: "Compilation Error",
      stdout: "",
      stderr: "",
      compileOutput: compiled.compileOutput,
      timeMs: null,
      memoryKb: null,
    };
  }

  options?.onProgress?.({
    stage: "running",
    percent: 100,
    message: "Đang thực thi chương trình C++ trong Web Worker...",
  });

  const runResult = await executeWasmInWorker(
    compiled.wasmBytes,
    stdin,
    options?.timeoutMs ?? DEFAULT_EXECUTION_TIMEOUT_MS
  );

  return {
    ...runResult,
    compileOutput: compiled.warnings ? "" : "",
  };
}
