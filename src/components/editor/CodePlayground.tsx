"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { OnMount } from "@monaco-editor/react";
import {
  AlertCircle,
  Bot,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Cpu,
  Eye,
  EyeOff,
  GripHorizontal,
  Loader2,
  Play,
  RotateCcw,
  Save,
  Send,
  Terminal,
  XCircle,
} from "lucide-react";
import { useAuth, useTheme, useToast } from "@/components/providers";
import { AiModeBadgePill } from "@/components/ai/AiModeSettingsPanel";
import { Badge, Button } from "@/components/ui/primitives";
import { DEFAULT_EXECUTION_TIMEOUT_MS, runCppInBrowser } from "@/lib/cpp-wasm-runner";
import { parseClangDiagnostics } from "@/lib/cpp-diagnostics";
import type { CourseLanguage, SubmissionStatus, TestCaseResult } from "@/types/codelab";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-slate-950 text-slate-400 text-xs gap-2">
      <Loader2 className="h-4 w-4 animate-spin" /> Đang tải Monaco Editor...
    </div>
  ),
});

export interface ExecutionOutputState {
  status: SubmissionStatus | "Idle" | "Running";
  stdout: string;
  stderr: string;
  compileOutput: string;
  timeMs: number | null;
  memoryKb: number | null;
  progressMessage?: string;
  progressPercent?: number;
  progressFromCache?: boolean;
  engineLabel?: string;
  testResults?: TestCaseResult[];
}

export interface AiErrorContext {
  status: string;
  vietnameseSummary?: string;
  compileOutput?: string;
  stderr?: string;
  failedSummary?: string;
}

export interface AiExecutionContext {
  stdin: string;
  stdout: string;
  expectedOutput?: string;
  status: string;
  vietnameseSummary?: string;
  compileOutput?: string;
  stderr?: string;
  failedSummary?: string;
}

interface CodePlaygroundProps {
  code: string;
  onChange: (nextCode: string) => void;
  defaultCode: string;
  language: CourseLanguage;
  storageKey?: string;
  allowLanguageSwitch?: boolean;
  onLanguageChange?: (lang: CourseLanguage) => void;
  initialStdin?: string;
  onSave?: () => Promise<void> | void;
  saving?: boolean;
  onSubmit?: () => Promise<void> | void;
  submitting?: boolean;
  submitLabel?: string;
  onOpenAiTutor?: () => void;
  externalOutput?: ExecutionOutputState | null;
  onErrorContextChange?: (ctx: AiErrorContext | null) => void;
  onExecutionContextChange?: (ctx: AiExecutionContext) => void;
}

export function vietnameseVerdictLabel(status: SubmissionStatus | string): {
  label: string;
  shortLabel: string;
  tone: "emerald" | "rose" | "amber";
} {
  switch (status) {
    case "Accepted":
      return { label: "Đạt (Accepted)", shortLabel: "Đạt", tone: "emerald" };
    case "Wrong Answer":
      return { label: "Sai kết quả (Wrong Answer)", shortLabel: "Sai", tone: "rose" };
    case "Time Limit Exceeded":
      return { label: "Quá thời gian (TLE)", shortLabel: "Quá thời gian", tone: "amber" };
    case "Compilation Error":
      return { label: "Lỗi biên dịch", shortLabel: "Lỗi", tone: "rose" };
    case "Memory Limit Exceeded":
      return { label: "Quá bộ nhớ (MLE)", shortLabel: "Lỗi", tone: "rose" };
    default:
      return { label: "Lỗi thực thi (Runtime Error)", shortLabel: "Lỗi", tone: "rose" };
  }
}

function buildHtmlPreviewDoc(code: string, lang: CourseLanguage, runId: string): string {
  if (lang === "html") {
    return `<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"><style>body{margin:0;padding:12px;font-family:system-ui,-apple-system,sans-serif;}</style></head><body>${code}</body></html>`;
  }
  if (lang === "css") {
    return `<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"><style>${code}</style></head><body>
      <div class="course-card">
        <span class="badge">CODELAB CSS Live</span>
        <h3>Thẻ khóa học tương tác</h3>
        <p>Chỉnh sửa CSS bên trái và bấm Chạy thử để quan sát Box Model, Flexbox và màu sắc thay đổi tức thì!</p>
      </div>
    </body></html>`;
  }
  const safeCode = JSON.stringify(code);
  return `<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"></head><body><script>
    (function() {
      const runId = ${JSON.stringify(runId)};
      const logs = [];
      const errors = [];
      const fmt = (v) => {
        if (typeof v === 'string') return v;
        try { return JSON.stringify(v); } catch { return String(v); }
      };
      console.log = (...args) => logs.push(args.map(fmt).join(' '));
      console.info = (...args) => logs.push(args.map(fmt).join(' '));
      console.warn = (...args) => logs.push('[WARN] ' + args.map(fmt).join(' '));
      console.error = (...args) => errors.push(args.map(fmt).join(' '));
      const start = performance.now();
      try {
        const fn = new Function(${safeCode});
        fn();
        const elapsed = Math.round(performance.now() - start);
        parent.postMessage({ type: 'codelab-js-run', runId, ok: true, stdout: logs.join('\\n'), stderr: errors.join('\\n'), timeMs: elapsed }, '*');
      } catch (err) {
        const elapsed = Math.round(performance.now() - start);
        parent.postMessage({ type: 'codelab-js-run', runId, ok: false, stdout: logs.join('\\n'), stderr: (err && err.message) ? err.message : String(err), timeMs: elapsed }, '*');
      }
    })();
  </script></body></html>`;
}

export function CodePlayground({
  code,
  onChange,
  defaultCode,
  language,
  storageKey,
  allowLanguageSwitch = false,
  onLanguageChange,
  initialStdin = "",
  onSave,
  saving = false,
  onSubmit,
  submitting = false,
  submitLabel = "Nộp bài chấm điểm",
  onOpenAiTutor,
  externalOutput = null,
  onErrorContextChange,
  onExecutionContextChange,
}: CodePlaygroundProps) {
  const { systemStatus } = useAuth();
  const { theme } = useTheme();
  const { toast } = useToast();

  const [stdin, setStdin] = useState(initialStdin);
  const [prevInitialStdin, setPrevInitialStdin] = useState(initialStdin);
  if (prevInitialStdin !== initialStdin) {
    setPrevInitialStdin(initialStdin);
    setStdin(initialStdin);
  }
  const [fontSize, setFontSize] = useState(14);
  const [copied, setCopied] = useState(false);
  const [autoSavedAt, setAutoSavedAt] = useState<string | null>(null);
  const [bottomTab, setBottomTab] = useState<"input" | "output" | "preview">(
    language === "html" || language === "css" ? "preview" : "output"
  );
  const [bottomHeight, setBottomHeight] = useState(255);
  const [output, setOutput] = useState<ExecutionOutputState>({
    status: "Idle",
    stdout: "",
    stderr: "",
    compileOutput: "",
    timeMs: null,
    memoryKb: null,
  });
  const [prevExternalOutput, setPrevExternalOutput] = useState<ExecutionOutputState | null>(null);
  if (externalOutput && externalOutput !== prevExternalOutput) {
    setPrevExternalOutput(externalOutput);
    setOutput(externalOutput);
    setBottomTab("output");
  }
  const [previewDoc, setPreviewDoc] = useState<string>(() =>
    language === "html" || language === "css" ? buildHtmlPreviewDoc(code, language, "init") : ""
  );
  const [jsRunId, setJsRunId] = useState<string>("");

  const activeRunIdRef = useRef<string>("");
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const monacoRef = useRef<Parameters<OnMount>[1] | null>(null);
  const errorDecorationsRef = useRef<string[]>([]);
  const handleRunRef = useRef<() => void>(() => {});
  const onErrorContextChangeRef = useRef(onErrorContextChange);
  const onExecutionContextChangeRef = useRef(onExecutionContextChange);

  useEffect(() => {
    onErrorContextChangeRef.current = onErrorContextChange;
    onExecutionContextChangeRef.current = onExecutionContextChange;
  }, [onErrorContextChange, onExecutionContextChange]);

  const useJudge0 = Boolean(systemStatus?.judge0_configured);

  const parsedDiagnostics = useMemo(
    () => (output.compileOutput ? parseClangDiagnostics(output.compileOutput) : null),
    [output.compileOutput]
  );

  // Sync Monaco red error squiggles & line highlights whenever compiler diagnostics update
  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;
    const model = editor.getModel();
    if (!model) return;

    if (!parsedDiagnostics || parsedDiagnostics.markers.length === 0) {
      monaco.editor.setModelMarkers(model, "codelab-clang", []);
      errorDecorationsRef.current = editor.deltaDecorations(errorDecorationsRef.current, []);
      return;
    }

    const lineCount = model.getLineCount();
    const monacoMarkers = parsedDiagnostics.markers.map((m) => {
      const safeLine = Math.min(Math.max(1, m.line), lineCount);
      const maxCol = model.getLineMaxColumn(safeLine);
      const startCol = Math.min(Math.max(1, m.column), maxCol);
      return {
        startLineNumber: safeLine,
        startColumn: startCol,
        endLineNumber: safeLine,
        endColumn: Math.max(startCol + 1, maxCol),
        message: `${m.vietnameseMessage}\n(Chi tiết: ${m.originalMessage})`,
        severity:
          m.severity === "warning"
            ? monaco.MarkerSeverity.Warning
            : monaco.MarkerSeverity.Error,
      };
    });

    monaco.editor.setModelMarkers(model, "codelab-clang", monacoMarkers);

    const errorLines = Array.from(
      new Set(
        parsedDiagnostics.markers
          .filter((m) => m.severity === "error")
          .map((m) => Math.min(Math.max(1, m.line), lineCount))
      )
    );

    errorDecorationsRef.current = editor.deltaDecorations(
      errorDecorationsRef.current,
      errorLines.map((line) => ({
        range: new monaco.Range(line, 1, line, 1),
        options: {
          isWholeLine: true,
          className: "codelab-error-line",
          linesDecorationsClassName: "codelab-error-gutter",
        },
      }))
    );

    if (errorLines[0]) {
      editor.revealLineInCenter(errorLines[0]);
    }
  }, [parsedDiagnostics]);

  // Clear Monaco error markers when user edits the code
  const clearEditorMarkers = useCallback(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;
    const model = editor.getModel();
    if (model) {
      monaco.editor.setModelMarkers(model, "codelab-clang", []);
    }
    errorDecorationsRef.current = editor.deltaDecorations(errorDecorationsRef.current, []);
  }, []);

  // Report latest active execution & error context (input, output, errors) to parent for "Hỏi AI"
  useEffect(() => {
    const failedSample = output.testResults?.find((t) => t.status !== "Accepted" && t.isSample);
    const anySample = output.testResults?.find((t) => t.isSample);
    const failedSummary = failedSample
      ? `Test mẫu #${failedSample.testCaseIndex} (${failedSample.status}): Input="${failedSample.input}", Mong đợi="${failedSample.expectedOutput}", Thực tế="${failedSample.actualOutput}"`
      : output.testResults?.length && output.status !== "Accepted"
      ? `${output.testResults.filter((t) => t.status === "Accepted").length}/${output.testResults.length} test đạt (${output.status})`
      : undefined;

    if (onExecutionContextChangeRef.current) {
      const effectiveStdin = failedSample?.input ?? anySample?.input ?? stdin;
      const effectiveStdout = failedSample?.actualOutput ?? anySample?.actualOutput ?? output.stdout;
      const effectiveExpected = failedSample?.expectedOutput ?? anySample?.expectedOutput;
      onExecutionContextChangeRef.current({
        stdin: effectiveStdin,
        stdout: effectiveStdout,
        expectedOutput: effectiveExpected,
        status: output.status,
        vietnameseSummary: parsedDiagnostics?.vietnameseSummary || undefined,
        compileOutput: output.compileOutput || undefined,
        stderr: output.stderr || undefined,
        failedSummary,
      });
    }

    if (!onErrorContextChangeRef.current) return;
    if (
      output.status === "Idle" ||
      output.status === "Running" ||
      output.status === "Accepted"
    ) {
      onErrorContextChangeRef.current(null);
      return;
    }

    onErrorContextChangeRef.current({
      status: output.status,
      vietnameseSummary: parsedDiagnostics?.vietnameseSummary || undefined,
      compileOutput: output.compileOutput || undefined,
      stderr: output.stderr || undefined,
      failedSummary,
    });
  }, [output, stdin, parsedDiagnostics]);

  // Auto-save code per lesson/challenge in localStorage (debounced 400ms)
  useEffect(() => {
    if (!storageKey || !code) return;
    const timer = setTimeout(() => {
      try {
        if (code === defaultCode) {
          localStorage.removeItem(storageKey);
          setAutoSavedAt(null);
          return;
        }
        localStorage.setItem(storageKey, code);
        setAutoSavedAt(
          new Date().toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })
        );
      } catch {
        // ignore storage quota errors
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [code, defaultCode, storageKey]);

  // Listen to JS sandbox iframe messages
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const payload = event.data;
      if (!payload || payload.type !== "codelab-js-run") return;
      if (payload.runId !== activeRunIdRef.current) return;
      setOutput({
        status: payload.ok ? "Accepted" : "Runtime Error",
        stdout: payload.stdout || (payload.ok ? "(Chương trình chạy xong, không có console.log)" : ""),
        stderr: payload.stderr || "",
        compileOutput: "",
        timeMs: payload.timeMs ?? 1,
        memoryKb: null,
      });
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  // Resizable vertical drag between Monaco Editor and Output Panel
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!draggingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const nextHeight = Math.max(140, Math.min(rect.height - 180, rect.bottom - e.clientY));
      setBottomHeight(nextHeight);
    };
    const onUp = () => {
      draggingRef.current = false;
      document.body.style.cursor = "";
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  const handleRun = useCallback(async () => {
    if (output.status === "Running") return;

    if (language === "html" || language === "css") {
      const runId = `${Date.now()}`;
      setPreviewDoc(buildHtmlPreviewDoc(code, language, runId));
      setBottomTab("preview");
      setOutput({
        status: "Accepted",
        stdout: `Đã cập nhật Live Preview (${language.toUpperCase()}) trong trình duyệt.`,
        stderr: "",
        compileOutput: "",
        timeMs: 1,
        memoryKb: null,
      });
      return;
    }

    if (language === "javascript") {
      const runId = `${Date.now()}-${Math.random()}`;
      activeRunIdRef.current = runId;
      setJsRunId(runId);
      setBottomTab("output");
      setOutput({
        status: "Running",
        stdout: "",
        stderr: "",
        compileOutput: "",
        timeMs: null,
        memoryKb: null,
        progressMessage: "Đang thực thi JavaScript trong Sandbox...",
      });
      setPreviewDoc(buildHtmlPreviewDoc(code, "javascript", runId));
      return;
    }

    // C++ execution: Priority Judge0 if configured; default instant browser Clang WebAssembly Worker (3s timeout, 1MB output cap)!
    clearEditorMarkers();
    setBottomTab("output");
    setOutput({
      status: "Running",
      stdout: "",
      stderr: "",
      compileOutput: "",
      timeMs: null,
      memoryKb: null,
      progressMessage: useJudge0
        ? "Đang biên dịch & chạy trên Judge0 Sandbox..."
        : "Đang khởi tạo trình biên dịch Clang WASM...",
      progressPercent: useJudge0 ? undefined : 5,
    });

    if (useJudge0) {
      try {
        const res = await fetch("/api/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            language: "cpp",
            sourceCode: code,
            stdin,
          }),
        });
        const data = await res.json();
        if (res.ok && data.configured !== false) {
          setOutput({
            status: data.status,
            stdout: data.stdout || "",
            stderr: data.stderr || "",
            compileOutput: data.compileOutput || "",
            timeMs: data.timeMs ?? null,
            memoryKb: data.memoryKb ?? null,
            engineLabel: "Judge0",
          });
          return;
        }
      } catch {
        // Fallback seamlessly to browser WASM compiler
      }
    }

    try {
      const wasmResult = await runCppInBrowser(code, stdin, {
        timeoutMs: DEFAULT_EXECUTION_TIMEOUT_MS,
        onProgress: (ev) => {
          setOutput((prev) => ({
            ...prev,
            status: "Running",
            progressMessage: ev.message,
            progressPercent: ev.percent,
            progressFromCache: ev.fromCache,
          }));
        },
      });
      setOutput({
        status: wasmResult.status,
        stdout: wasmResult.stdout,
        stderr: wasmResult.stderr,
        compileOutput: wasmResult.compileOutput,
        timeMs: wasmResult.timeMs,
        memoryKb: wasmResult.memoryKb,
        engineLabel: "Clang WASM",
      });
    } catch (err) {
      setOutput({
        status: "Runtime Error",
        stdout: "",
        stderr: `Không thể khởi chạy trình biên dịch WebAssembly: ${err instanceof Error ? err.message : "Lỗi trình duyệt"}`,
        compileOutput: "",
        timeMs: null,
        memoryKb: null,
        engineLabel: "Clang WASM",
      });
    }
  }, [code, language, stdin, useJudge0, output.status, clearEditorMarkers]);

  useEffect(() => {
    handleRunRef.current = () => {
      void handleRun();
    };
  }, [handleRun]);

  // Global Ctrl+Enter / Cmd+Enter shortcut when focus is inside the playground container
  const handleContainerKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleRunRef.current();
    }
  };

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      handleRunRef.current();
    });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast({ title: "Đã sao chép mã nguồn", variant: "info" });
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast({ title: "Không thể sao chép vào clipboard", variant: "error" });
    }
  };

  const handleReset = () => {
    onChange(defaultCode);
    clearEditorMarkers();
    if (storageKey) {
      try {
        localStorage.removeItem(storageKey);
      } catch {
        // ignore
      }
    }
    toast({ title: "Đã khôi phục mã nguồn mẫu", variant: "info" });
  };

  const monacoLang = language === "cpp" ? "cpp" : language;

  return (
    <div
      ref={containerRef}
      onKeyDown={handleContainerKeyDown}
      className="flex h-full min-h-[540px] lg:min-h-0 flex-col overflow-hidden bg-white dark:bg-[#0d1424]"
    >
      {/* Editor Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#11192e] px-3 py-2 shrink-0">
        <div className="flex items-center gap-2 shrink-0">
          {allowLanguageSwitch && onLanguageChange ? (
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value as CourseLanguage)}
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs font-semibold whitespace-nowrap shrink-0"
              aria-label="Chọn ngôn ngữ lập trình"
            >
              <option value="cpp">C++17 (WASM)</option>
              <option value="html">HTML5</option>
              <option value="css">CSS3</option>
              <option value="javascript">JavaScript (ES6+)</option>
            </select>
          ) : (
            <Badge className="border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono whitespace-nowrap">
              {language === "cpp"
                ? "C++17 · main.cpp"
                : language === "html"
                ? "HTML5 · index.html"
                : language === "css"
                ? "CSS3 · styles.css"
                : "JavaScript · app.js"}
            </Badge>
          )}

          <select
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="hidden sm:block w-[78px] shrink-0 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap"
            aria-label="Cỡ chữ trình soạn thảo"
          >
            <option value={13}>13px</option>
            <option value={14}>14px</option>
            <option value={16}>16px</option>
          </select>

          {autoSavedAt && (
            <span
              className="hidden xl:inline-block text-[10px] text-slate-400 font-mono"
              title="Mã nguồn được tự động lưu cục bộ trong trình duyệt"
            >
              Tự lưu {autoSavedAt}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Button size="sm" variant="ghost" onClick={handleReset} title="Khôi phục code mặc định">
            <RotateCcw className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Reset</span>
          </Button>
          <Button size="sm" variant="ghost" onClick={handleCopy} title="Sao chép code">
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">Copy</span>
          </Button>
          {onSave && (
            <Button size="sm" variant="secondary" onClick={onSave} loading={saving}>
              <Save className="h-3.5 w-3.5" /> Lưu
            </Button>
          )}
          {onOpenAiTutor && (
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenAiTutor}
              title="Hỏi Gia sư AI (tự động gửi kèm đề bài, code, input, output và lỗi)"
            >
              <Bot className="h-3.5 w-3.5 text-blue-500" />
              <span>Hỏi AI</span>
              <AiModeBadgePill />
            </Button>
          )}
          <Button
            size="sm"
            variant="success"
            onClick={handleRun}
            loading={output.status === "Running"}
            title="Chạy code (Phím tắt: Ctrl + Enter)"
          >
            <Play className="h-3.5 w-3.5 fill-current" /> Run
            <kbd className="hidden xl:inline-block ml-0.5 rounded bg-emerald-700/60 px-1 py-0.5 text-[10px] font-mono font-normal text-emerald-100">
              Ctrl+↵
            </kbd>
          </Button>
          {onSubmit && (
            <Button size="sm" variant="primary" onClick={onSubmit} loading={submitting}>
              <Send className="h-3.5 w-3.5" /> {submitLabel}
            </Button>
          )}
        </div>
      </div>

      {/* Monaco Editor Pane */}
      <div className="relative flex-1 min-h-[220px] overflow-hidden">
        <MonacoEditor
          height="100%"
          language={monacoLang}
          theme={theme === "dark" ? "vs-dark" : "light"}
          value={code}
          onMount={handleEditorMount}
          onChange={(val) => {
            onChange(val ?? "");
            clearEditorMarkers();
          }}
          options={{
            fontSize,
            fontFamily: "var(--font-jetbrains), 'JetBrains Mono', monospace",
            minimap: { enabled: false },
            lineNumbers: "on",
            automaticLayout: true,
            tabSize: 4,
            insertSpaces: true,
            autoIndent: "full",
            autoClosingBrackets: "always",
            autoClosingQuotes: "always",
            quickSuggestions: true,
            scrollBeyondLastLine: false,
            padding: { top: 12, bottom: 12 },
            wordWrap: "on",
          }}
        />
      </div>

      {/* Resizable Divider */}
      <div
        onPointerDown={() => {
          draggingRef.current = true;
          document.body.style.cursor = "row-resize";
        }}
        className="flex h-2.5 cursor-row-resize items-center justify-center border-y border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 hover:bg-blue-500/20 transition-colors shrink-0"
        title="Kéo để thay đổi kích thước khung Output"
      >
        <GripHorizontal className="h-3.5 w-3.5 text-slate-400" />
      </div>

      {/* Bottom I/O & Live Preview Panel */}
      <div style={{ height: bottomHeight }} className="flex flex-col shrink-0 bg-slate-50 dark:bg-[#090f1d]">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-3 py-1.5">
          <div className="flex items-center gap-1">
            {language === "cpp" && (
              <button
                onClick={() => setBottomTab("input")}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold cursor-pointer ${
                  bottomTab === "input"
                    ? "bg-blue-600/15 text-blue-600 dark:text-blue-400"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Input (stdin)
              </button>
            )}
            <button
              onClick={() => setBottomTab("output")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold cursor-pointer ${
                bottomTab === "output"
                  ? "bg-blue-600/15 text-blue-600 dark:text-blue-400"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Terminal className="h-3.5 w-3.5" /> Output
            </button>
            {(language === "html" || language === "css") && (
              <button
                onClick={() => setBottomTab("preview")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold cursor-pointer ${
                  bottomTab === "preview"
                    ? "bg-blue-600/15 text-blue-600 dark:text-blue-400"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <Eye className="h-3.5 w-3.5" /> Live Preview
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs">
            {language === "cpp" && output.status === "Idle" && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-slate-400">
                <Cpu className="h-3 w-3 text-emerald-500" />
                {useJudge0 ? "Judge0 Sandbox" : "Clang WASM · Timeout 3s · Max 1MB"}
              </span>
            )}
            {output.status !== "Idle" && (
              <StatusPill
                status={output.status}
                timeMs={output.timeMs}
                memoryKb={output.memoryKb}
                engineLabel={output.engineLabel}
              />
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto p-3">
          {bottomTab === "input" && language === "cpp" && (
            <div className="h-full flex flex-col">
              <p className="text-[11px] text-slate-500 mb-1.5">
                Nhập dữ liệu đầu vào (stdin) truyền trực tiếp vào <code className="font-mono">cin</code> khi bấm Run (hoặc <kbd className="font-mono">Ctrl+Enter</kbd>):
              </p>
              <textarea
                value={stdin}
                onChange={(e) => setStdin(e.target.value)}
                placeholder="Ví dụ:\n3 5"
                className="flex-1 w-full resize-none rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2.5 font-mono text-xs outline-none focus:border-blue-500"
              />
            </div>
          )}

          {bottomTab === "output" && (
            <div className="space-y-3 font-mono text-xs">
              {output.status === "Idle" && (
                <p className="font-sans text-slate-500">
                  Bấm nút <strong>Run</strong> (hoặc nhấn <kbd className="rounded border border-slate-300 dark:border-slate-700 px-1.5 py-0.5 font-mono text-[11px]">Ctrl + Enter</kbd>) để biên dịch và thực thi mã nguồn trực tiếp ngay trong trình duyệt.
                </p>
              )}

              {/* First-time WASM Loader & Progress Bar */}
              {output.status === "Running" && (
                <div className="font-sans rounded-xl border border-blue-500/25 bg-blue-500/5 p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between gap-2 text-blue-600 dark:text-blue-400 font-semibold text-xs">
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                      {output.progressMessage || "Đang biên dịch và thực thi mã nguồn..."}
                    </span>
                    {typeof output.progressPercent === "number" && (
                      <span className="font-mono">{output.progressPercent}%</span>
                    )}
                  </div>
                  {typeof output.progressPercent === "number" && (
                    <div
                      role="progressbar"
                      aria-valuenow={output.progressPercent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
                    >
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-200"
                        style={{ width: `${Math.max(4, Math.min(100, output.progressPercent))}%` }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Vietnamese Compiler Diagnostics + Raw Clang Trace */}
              {output.compileOutput && (
                <div className="space-y-2.5">
                  {parsedDiagnostics?.vietnameseSummary && (
                    <div className="font-sans rounded-xl border border-rose-500/40 bg-rose-500/10 p-3.5 space-y-1.5">
                      <p className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        Giải thích lỗi biên dịch (đã đánh dấu đỏ trong trình soạn thảo)
                      </p>
                      <div className="whitespace-pre-wrap text-xs text-rose-800 dark:text-rose-200 leading-relaxed">
                        {parsedDiagnostics.vietnameseSummary}
                      </div>
                    </div>
                  )}
                  <details className="rounded-xl border border-rose-500/25 bg-slate-950/90 p-3 text-rose-300" open>
                    <summary className="font-sans text-[11px] font-bold uppercase text-rose-400 cursor-pointer select-none">
                      Chi tiết trình biên dịch Clang (Compilation Error)
                    </summary>
                    <pre className="mt-2 whitespace-pre-wrap text-[11px] leading-relaxed">
                      {output.compileOutput}
                    </pre>
                  </details>
                </div>
              )}

              {/* Runtime / TLE / Output Limit Error */}
              {output.stderr && (
                <div>
                  <p className="font-sans text-[11px] font-bold uppercase text-rose-500 mb-1">
                    {output.status === "Time Limit Exceeded"
                      ? "Quá giới hạn thời gian (Time Limit Exceeded – 3 giây)"
                      : "Lỗi thực thi (Runtime Error / stderr)"}
                  </p>
                  <pre className="whitespace-pre-wrap rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-rose-600 dark:text-rose-300 leading-relaxed">
                    {output.stderr}
                  </pre>
                </div>
              )}

              {/* Detailed Per-Test-Case Grading Table */}
              {output.testResults && output.testResults.length > 0 && !output.compileOutput && (
                <div className="font-sans space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Kết quả chi tiết từng Test Case ({output.testResults.filter((t) => t.status === "Accepted").length}/{output.testResults.length} Đạt)
                  </p>
                  <div className="space-y-2">
                    {output.testResults.map((tr) => {
                      const v = vietnameseVerdictLabel(tr.status);
                      const badgeCls =
                        v.tone === "emerald"
                          ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : v.tone === "amber"
                          ? "border-amber-500/30 bg-amber-500/15 text-amber-600 dark:text-amber-400"
                          : "border-rose-500/30 bg-rose-500/15 text-rose-600 dark:text-rose-400";
                      return (
                        <div
                          key={tr.testCaseIndex}
                          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/90 p-3 space-y-2"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-xs font-bold">
                              <span>Test #{tr.testCaseIndex}</span>
                              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                                {tr.isSample ? (
                                  <><Eye className="h-3 w-3" /> Công khai</>
                                ) : (
                                  <><EyeOff className="h-3 w-3" /> Test ẩn</>
                                )}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {typeof tr.timeMs === "number" && (
                                <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-500">
                                  <Clock className="h-3 w-3" /> {tr.timeMs}ms
                                </span>
                              )}
                              <Badge className={badgeCls}>{v.shortLabel}</Badge>
                            </div>
                          </div>

                          {tr.isSample && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 font-mono text-[11px]">
                              <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-2">
                                <p className="font-sans text-[10px] font-bold text-slate-500 mb-0.5">Input</p>
                                <pre className="whitespace-pre-wrap break-all">{tr.input ?? ""}</pre>
                              </div>
                              <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-2">
                                <p className="font-sans text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mb-0.5">
                                  Output mong đợi
                                </p>
                                <pre className="whitespace-pre-wrap break-all">{tr.expectedOutput ?? ""}</pre>
                              </div>
                              <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-2">
                                <p className="font-sans text-[10px] font-bold text-blue-600 dark:text-blue-400 mb-0.5">
                                  Output thực tế
                                </p>
                                <pre className="whitespace-pre-wrap break-all">{tr.actualOutput ?? "(rỗng)"}</pre>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Standard Run stdout */}
              {output.status !== "Idle" &&
                output.status !== "Running" &&
                !output.compileOutput &&
                (!output.testResults || output.testResults.length === 0) && (
                  <div>
                    <p className="font-sans text-[11px] font-bold uppercase text-emerald-600 dark:text-emerald-400 mb-1">
                      Kết quả đầu ra (stdout)
                    </p>
                    <pre className="whitespace-pre-wrap rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3 text-slate-900 dark:text-emerald-300 min-h-[42px]">
                      {output.stdout || "(Chương trình chạy thành công, không có đầu ra stdout)"}
                    </pre>
                  </div>
                )}
            </div>
          )}

          {bottomTab === "preview" && (language === "html" || language === "css") && (
            <iframe
              title="CODELAB Live Preview Sandbox"
              sandbox="allow-scripts"
              srcDoc={previewDoc}
              className="h-full w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white"
            />
          )}

          {language === "javascript" && previewDoc && (
            <iframe
              key={jsRunId}
              title="CODELAB JS Sandbox"
              sandbox="allow-scripts"
              srcDoc={previewDoc}
              className="hidden"
            />
          )}
        </div>
      </div>
    </div>
  );
}

function StatusPill({
  status,
  timeMs,
  memoryKb,
  engineLabel,
}: {
  status: ExecutionOutputState["status"];
  timeMs: number | null;
  memoryKb: number | null;
  engineLabel?: string;
}) {
  if (status === "Running") {
    return (
      <Badge className="border-blue-500/30 bg-blue-500/10 text-blue-500">
        <Loader2 className="h-3 w-3 animate-spin" /> Đang chạy
      </Badge>
    );
  }
  const v = vietnameseVerdictLabel(status);
  if (v.tone === "emerald") {
    return (
      <div className="flex items-center gap-2">
        <Badge className="border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-3 w-3" /> {v.label}
        </Badge>
        {timeMs !== null && <span className="font-mono text-[11px] text-slate-500">{timeMs}ms</span>}
        {memoryKb !== null && (
          <span className="font-mono text-[11px] text-slate-500">{(memoryKb / 1024).toFixed(1)}MB</span>
        )}
        {engineLabel && (
          <span className="hidden md:inline font-mono text-[10px] text-slate-400">{engineLabel}</span>
        )}
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <Badge
        className={
          v.tone === "amber"
            ? "border-amber-500/30 bg-amber-500/15 text-amber-600 dark:text-amber-400"
            : "border-rose-500/30 bg-rose-500/15 text-rose-600 dark:text-rose-400"
        }
      >
        <XCircle className="h-3 w-3" /> {v.label}
      </Badge>
      {timeMs !== null && <span className="font-mono text-[11px] text-slate-500">{timeMs}ms</span>}
    </div>
  );
}
