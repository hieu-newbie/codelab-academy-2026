"use client";

import React, { useEffect, useState } from "react";
import {
  Code2,
  Download,
  FileCode2,
  FolderOpen,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useToast } from "@/components/providers";
import {
  CodePlayground,
  type AiErrorContext,
  type AiExecutionContext,
} from "@/components/editor/CodePlayground";
import { AiTutorDrawer } from "@/components/ai/AiTutorDrawer";
import { Badge, Button } from "@/components/ui/primitives";
import { languageBadgeClasses, languageLabel } from "@/lib/utils";
import type { CourseLanguage } from "@/types/codelab";

interface SandboxFile {
  id: string;
  name: string;
  language: CourseLanguage;
  code: string;
  stdin: string;
  updatedAt: string;
}

interface SandboxTemplate {
  id: string;
  title: string;
  language: CourseLanguage;
  fileName: string;
  stdin: string;
  code: string;
}

const SANDBOX_TEMPLATES: SandboxTemplate[] = [
  {
    id: "cpp-basic",
    title: "C++17 cơ bản (<bits/stdc++.h>)",
    language: "cpp",
    fileName: "main.cpp",
    stdin: "15 27",
    code: `#include <bits/stdc++.h>
using namespace std;

int main() {
    long long a, b;
    if (cin >> a >> b) {
        cout << "Tong a + b = " << (a + b) << "\\n";
    } else {
        cout << "Xin chao CODELAB Sandbox!\\n";
    }
    return 0;
}`,
  },
  {
    id: "cpp-map",
    title: "C++17 · Đếm tần suất với std::map",
    language: "cpp",
    fileName: "map_demo.cpp",
    stdin: "6\ncpp map stl cpp map cpp",
    code: `#include <bits/stdc++.h>
using namespace std;

int main() {
    int n;
    if (!(cin >> n)) return 0;
    map<string, int> freq;
    for (int i = 0; i < n; i++) {
        string word;
        cin >> word;
        freq[word]++;
    }
    for (auto &[k, v] : freq) {
        cout << k << ": " << v << " lan\\n";
    }
    return 0;
}`,
  },
  {
    id: "cpp-vector-sort",
    title: "C++17 · Vector & std::sort",
    language: "cpp",
    fileName: "sort_demo.cpp",
    stdin: "5\n42 -7 19 0 8",
    code: `#include <bits/stdc++.h>
using namespace std;

int main() {
    int n;
    if (!(cin >> n)) return 0;
    vector<long long> a(n);
    for (int i = 0; i < n; i++) cin >> a[i];

    sort(a.begin(), a.end());
    long long sum = accumulate(a.begin(), a.end(), 0LL);

    cout << "Mang tang dan: ";
    for (long long x : a) cout << x << " ";
    cout << "\\nMin = " << a.front() << ", Max = " << a.back() << ", Tong = " << sum << "\\n";
    return 0;
}`,
  },
  {
    id: "cpp-prime",
    title: "C++17 · Kiểm tra số nguyên tố",
    language: "cpp",
    fileName: "prime.cpp",
    stdin: "29",
    code: `#include <bits/stdc++.h>
using namespace std;

bool isPrime(long long n) {
    if (n < 2) return false;
    for (long long i = 2; i * i <= n; i++) {
        if (n % i == 0) return false;
    }
    return true;
}

int main() {
    long long n;
    if (cin >> n) {
        cout << n << (isPrime(n) ? " la so nguyen to\\n" : " khong phai so nguyen to\\n");
    }
    return 0;
}`,
  },
  {
    id: "html-card",
    title: "HTML5 · Trang Profile tương tác",
    language: "html",
    fileName: "profile.html",
    stdin: "",
    code: `<div style="max-width:420px;margin:16px auto;padding:20px;border-radius:16px;background:linear-gradient(135deg,#1e3a8a,#312e81);color:#fff;font-family:system-ui,sans-serif;box-shadow:0 12px 30px rgba(15,23,42,.25)">
  <span style="display:inline-block;padding:4px 10px;border-radius:999px;background:rgba(255,255,255,.16);font-size:12px;font-weight:700">CODELAB Sandbox</span>
  <h2 style="margin:12px 0 6px;font-size:22px">Xin chào! Mình đang tự code HTML5</h2>
  <p style="margin:0 0 14px;color:#cbd5e1;font-size:14px;line-height:1.5">Chỉnh sửa trực tiếp nội dung hoặc CSS bên trên rồi bấm <strong>Run</strong> để xem kết quả tức thì!</p>
  <button onclick="alert('Chạy JavaScript ngay trong Live Preview!')" style="background:#38bdf8;color:#0f172a;border:0;padding:8px 14px;border-radius:10px;font-weight:700;cursor:pointer">Thử bấm nút</button>
</div>`,
  },
  {
    id: "css-modern",
    title: "CSS3 · Thẻ khóa học & hiệu ứng Hover",
    language: "css",
    fileName: "styles.css",
    stdin: "",
    code: `body {
  background: #0f172a;
  color: #f8fafc;
  display: flex;
  justify-content: center;
  padding: 24px;
}

.course-card {
  max-width: 400px;
  padding: 22px;
  border-radius: 18px;
  background: linear-gradient(135deg, #1d4ed8, #4f46e5);
  box-shadow: 0 14px 32px rgba(37, 99, 235, 0.35);
  transition: transform 0.2s ease;
}

.course-card:hover {
  transform: translateY(-4px);
}

.badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  font-size: 12px;
  font-weight: 700;
}`,
  },
  {
    id: "js-array",
    title: "JavaScript ES6+ · map / filter / reduce",
    language: "javascript",
    fileName: "app.js",
    stdin: "",
    code: `const students = [
  { name: "An", score: 92 },
  { name: "Binh", score: 68 },
  { name: "Chi", score: 85 },
  { name: "Dung", score: 96 },
];

const passed = students.filter((s) => s.score >= 80);
const avg = passed.reduce((sum, s) => sum + s.score, 0) / passed.length;

console.log("Danh sach dat >= 80:", passed.map((s) => s.name));
console.log("Diem trung binh nhom gioi:", avg.toFixed(1));`,
  },
];

const STORAGE_FILES_KEY = "codelab:sandbox:files:v1";
const STORAGE_ACTIVE_KEY = "codelab:sandbox:active:v1";

function extensionForLanguage(lang: CourseLanguage): string {
  switch (lang) {
    case "cpp":
      return "cpp";
    case "html":
      return "html";
    case "css":
      return "css";
    default:
      return "js";
  }
}

function createInitialFiles(): SandboxFile[] {
  const starter = SANDBOX_TEMPLATES[0];
  return [
    {
      id: "sandbox-default-cpp",
      name: starter.fileName,
      language: starter.language,
      code: starter.code,
      stdin: starter.stdin,
      updatedAt: new Date().toISOString(),
    },
  ];
}

export default function FreeformPlaygroundPage() {
  const { toast } = useToast();

  const [files, setFiles] = useState<SandboxFile[]>(() => createInitialFiles());
  const [activeId, setActiveId] = useState<string>("sandbox-default-cpp");
  const [hydrated, setHydrated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [aiOpen, setAiOpen] = useState(false);
  const [errorContext, setErrorContext] = useState<AiErrorContext | null>(null);
  const [executionContext, setExecutionContext] = useState<AiExecutionContext | null>(null);

  // New file modal/inline state
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newLang, setNewLang] = useState<CourseLanguage>("cpp");

  // Restore saved scratchpad files from localStorage once on mount
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const raw = localStorage.getItem(STORAGE_FILES_KEY);
        const savedActive = localStorage.getItem(STORAGE_ACTIVE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as SandboxFile[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            setFiles(parsed);
            if (savedActive && parsed.some((f) => f.id === savedActive)) {
              setActiveId(savedActive);
            } else {
              setActiveId(parsed[0].id);
            }
          }
        }
      } catch {
        // ignore storage errors
      }
      setHydrated(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  // Persist scratchpad files automatically to localStorage
  useEffect(() => {
    if (!hydrated) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_FILES_KEY, JSON.stringify(files));
        localStorage.setItem(STORAGE_ACTIVE_KEY, activeId);
      } catch {
        // ignore quota errors
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [files, activeId, hydrated]);

  const activeFile = files.find((f) => f.id === activeId) ?? files[0];

  const updateActiveFile = (patch: Partial<SandboxFile>) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === activeFile.id ? { ...f, ...patch, updatedAt: new Date().toISOString() } : f
      )
    );
  };

  const handleLanguageChange = (nextLang: CourseLanguage) => {
    const template = SANDBOX_TEMPLATES.find((t) => t.language === nextLang);
    const baseName = activeFile.name.replace(/\.[^.]+$/, "");
    const nextFileName = `${baseName}.${extensionForLanguage(nextLang)}`;
    const isUntouchedStarter = SANDBOX_TEMPLATES.some((t) => t.code.trim() === activeFile.code.trim());
    updateActiveFile({
      language: nextLang,
      name: nextFileName,
      ...(isUntouchedStarter && template ? { code: template.code, stdin: template.stdin } : {}),
    });
  };

  const handleCreateFile = (e: React.FormEvent) => {
    e.preventDefault();
    const ext = extensionForLanguage(newLang);
    const cleaned = newName.trim() || `untitled_${files.length + 1}`;
    const finalName = cleaned.includes(".") ? cleaned : `${cleaned}.${ext}`;
    const tpl = SANDBOX_TEMPLATES.find((t) => t.language === newLang) ?? SANDBOX_TEMPLATES[0];
    const id = `sb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const created: SandboxFile = {
      id,
      name: finalName,
      language: newLang,
      code: tpl.code,
      stdin: tpl.stdin,
      updatedAt: new Date().toISOString(),
    };
    setFiles((prev) => [created, ...prev]);
    setActiveId(id);
    setNewName("");
    setCreating(false);
    toast({ title: `Đã tạo tệp ${finalName}`, variant: "success" });
  };

  const handleDeleteFile = (id: string) => {
    if (files.length <= 1) {
      toast({ title: "Cần giữ lại ít nhất 1 tệp trong Sandbox", variant: "info" });
      return;
    }
    const remaining = files.filter((f) => f.id !== id);
    setFiles(remaining);
    if (activeId === id) {
      setActiveId(remaining[0].id);
    }
    toast({ title: "Đã xóa tệp nháp", variant: "info" });
  };

  const handleApplyTemplate = (tpl: SandboxTemplate) => {
    updateActiveFile({
      language: tpl.language,
      code: tpl.code,
      stdin: tpl.stdin,
    });
    toast({ title: `Đã nạp mẫu: ${tpl.title}`, variant: "info" });
  };

  const handleDownloadFile = () => {
    const blob = new Blob([activeFile.code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = activeFile.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast({ title: `Đã tải xuống ${activeFile.name}`, variant: "success" });
  };

  const defaultTemplateForLang =
    SANDBOX_TEMPLATES.find((t) => t.language === activeFile.language)?.code ?? SANDBOX_TEMPLATES[0].code;

  return (
    <AppShell fullBleed>
      {/* Sandbox Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1424] px-3 sm:px-4 py-2 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-blue-500/40 cursor-pointer shrink-0"
            title={sidebarOpen ? "Ẩn thanh tệp & mẫu code" : "Mở thanh tệp & mẫu code"}
            aria-label="Bật/tắt thanh tệp Sandbox"
          >
            {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <Code2 className="h-4 w-4 text-blue-500 shrink-0" />
            <h1 className="text-sm font-bold text-slate-900 dark:text-white truncate">
              Tự code tự do (Sandbox)
            </h1>
            <Badge className="hidden sm:inline-flex border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              Không cần bài tập · Chạy trực tiếp
            </Badge>
            <Badge className={languageBadgeClasses(activeFile.language)}>
              {activeFile.name}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button size="sm" variant="outline" onClick={handleDownloadFile} title="Tải tệp mã nguồn về máy">
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Tải file</span>
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => {
              setSidebarOpen(true);
              setCreating(true);
            }}
          >
            <Plus className="h-3.5 w-3.5" /> File mới
          </Button>
        </div>
      </div>

      {/* Main Sandbox Body */}
      <div className="flex flex-1 min-h-0 flex-col lg:flex-row overflow-hidden">
        {/* Collapsible Scratchpad Files & Templates Sidebar */}
        {sidebarOpen && (
          <aside className="w-full lg:w-68 shrink-0 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-[#0b1120] flex flex-col max-h-64 lg:max-h-none overflow-hidden">
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {/* New file quick form */}
              {creating && (
                <form
                  onSubmit={handleCreateFile}
                  className="rounded-xl border border-blue-500/35 bg-white dark:bg-slate-900 p-3 space-y-2 shadow-xs"
                >
                  <p className="text-xs font-bold text-blue-600 dark:text-blue-400">Tạo tệp tự code mới</p>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Ví dụ: test_map.cpp"
                    autoFocus
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 text-xs outline-none focus:border-blue-500"
                  />
                  <select
                    value={newLang}
                    onChange={(e) => setNewLang(e.target.value as CourseLanguage)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 text-xs font-semibold"
                    aria-label="Ngôn ngữ tệp mới"
                  >
                    <option value="cpp">C++17 (Clang WASM · bits/stdc++.h)</option>
                    <option value="html">HTML5 (Live Preview)</option>
                    <option value="css">CSS3 (Live Preview)</option>
                    <option value="javascript">JavaScript (ES6+ Console)</option>
                  </select>
                  <div className="flex items-center justify-end gap-1.5">
                    <Button type="button" size="sm" variant="ghost" onClick={() => setCreating(false)}>
                      Hủy
                    </Button>
                    <Button type="submit" size="sm" variant="primary">
                      Tạo
                    </Button>
                  </div>
                </form>
              )}

              {/* User local files */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <FolderOpen className="h-3.5 w-3.5" /> Tệp của tôi ({files.length})
                  </span>
                </div>
                <div className="space-y-1">
                  {files.map((file) => {
                    const isActive = file.id === activeFile.id;
                    return (
                      <div
                        key={file.id}
                        onClick={() => setActiveId(file.id)}
                        className={`group flex items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-xs cursor-pointer transition-colors ${
                          isActive
                            ? "bg-blue-600/15 text-blue-700 dark:text-blue-300 font-bold border border-blue-500/25"
                            : "hover:bg-slate-200/60 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-300 border border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileCode2 className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate font-mono">{file.name}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[10px] font-sans opacity-70 uppercase">
                            {languageLabel(file.language)}
                          </span>
                          {files.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteFile(file.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 p-0.5 cursor-pointer"
                              aria-label={`Xóa tệp ${file.name}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Starter templates */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                <p className="px-1 text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Mẫu thử nhanh
                </p>
                <div className="space-y-1">
                  {SANDBOX_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => handleApplyTemplate(tpl)}
                      className="w-full rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/70 px-2.5 py-2 text-left text-xs hover:border-blue-500/50 transition-colors cursor-pointer"
                    >
                      <p className="font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                        {tpl.title}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5 font-mono">{tpl.fileName}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 p-2.5 text-[10px] text-slate-500 leading-relaxed">
              Mọi tệp tự lưu tự động trên trình duyệt. C++17 hỗ trợ sẵn{" "}
              <code className="font-mono text-blue-500">#include &lt;bits/stdc++.h&gt;</code>, nhấn{" "}
              <kbd className="font-mono">Ctrl+Enter</kbd> để chạy ngay!
            </div>
          </aside>
        )}

        {/* Full CodePlayground Editor + Input/Output/Live Preview */}
        <div className="flex-1 min-w-0 min-h-[560px] lg:min-h-0 overflow-hidden">
          <CodePlayground
            key={activeFile.id}
            code={activeFile.code}
            onChange={(nextCode) => updateActiveFile({ code: nextCode })}
            defaultCode={defaultTemplateForLang}
            language={activeFile.language}
            allowLanguageSwitch
            onLanguageChange={handleLanguageChange}
            initialStdin={activeFile.stdin}
            onOpenAiTutor={() => setAiOpen(true)}
            onErrorContextChange={setErrorContext}
            onExecutionContextChange={(ctx) => {
              setExecutionContext(ctx);
              if (ctx.stdin !== activeFile.stdin) {
                updateActiveFile({ stdin: ctx.stdin });
              }
            }}
          />
        </div>
      </div>

      {/* Contextual AI Tutor Drawer for Sandbox */}
      <AiTutorDrawer
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        language={activeFile.language}
        contextTitle={`Sandbox Tự code · ${activeFile.name}`}
        currentCode={activeFile.code}
        executionContext={executionContext}
        errorContext={errorContext}
      />
    </AppShell>
  );
}
