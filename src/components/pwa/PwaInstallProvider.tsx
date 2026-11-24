"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { CheckCircle2, Download, MonitorSmartphone, Share, Smartphone, X } from "lucide-react";
import { useToast } from "@/components/providers";
import { Badge, Button, Card } from "@/components/ui/primitives";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

interface PwaContextValue {
  canPromptInstall: boolean;
  isInstalled: boolean;
  isIos: boolean;
  swReady: boolean;
  openInstallAction: () => Promise<void>;
}

const PwaContext = createContext<PwaContextValue | null>(null);

export function PwaInstallProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [swReady, setSwReady] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia?.("(display-mode: standalone)")?.matches ||
      Boolean((window.navigator as unknown as { standalone?: boolean }).standalone);
    const ua = window.navigator.userAgent || "";
    const iosDevice = /iPhone|iPad|iPod/i.test(ua);

    const frame = requestAnimationFrame(() => {
      setIsInstalled(standalone);
      setIsIos(iosDevice);
    });

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const onAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setGuideOpen(false);
      toast({
        title: "Đã cài đặt ứng dụng CODELAB!",
        description: "Bạn có thể mở CODELAB trực tiếp như ứng dụng gốc từ màn hình chính.",
        variant: "success",
      });
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onAppInstalled);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then(() => navigator.serviceWorker.ready)
        .then(() => setSwReady(true))
        .catch(() => {});
    }

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, [toast]);

  const openInstallAction = useCallback(async () => {
    if (isInstalled) {
      toast({
        title: "CODELAB đang chạy ở chế độ App (PWA)",
        variant: "info",
      });
      return;
    }

    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          setDeferredPrompt(null);
        }
        return;
      } catch {
        // Fall through to clean manual guide modal
      }
    }

    setGuideOpen(true);
  }, [deferredPrompt, isInstalled, toast]);

  return (
    <PwaContext.Provider
      value={{
        canPromptInstall: Boolean(deferredPrompt),
        isInstalled,
        isIos,
        swReady,
        openInstallAction,
      }}
    >
      {children}

      {/* PWA Install Guide Modal (when native beforeinstallprompt isn't available yet or on iOS Safari) */}
      {guideOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={() => setGuideOpen(false)} />
          <Card className="relative z-10 w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md">
                  <MonitorSmartphone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Cài đặt ứng dụng CODELAB (PWA)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Mở nhanh từ màn hình chính · Không cần kho ứng dụng
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setGuideOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                aria-label="Đóng hướng dẫn cài đặt PWA"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3 w-3" /> Web App Manifest sẵn sàng
              </Badge>
              <Badge
                className={
                  swReady
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                }
              >
                <CheckCircle2 className="h-3 w-3" /> {swReady ? "Service Worker đang hoạt động" : "Đang kích hoạt Service Worker"}
              </Badge>
            </div>

            {isIos ? (
              <div className="rounded-xl border border-blue-500/25 bg-blue-500/5 p-3.5 text-xs space-y-2">
                <p className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                  <Smartphone className="h-4 w-4" /> Hướng dẫn trên iPhone / iPad (Safari):
                </p>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-700 dark:text-slate-300 leading-relaxed">
                  <li>
                    Bấm biểu tượng <strong className="inline-flex items-center gap-0.5"><Share className="h-3 w-3" /> Chia sẻ (Share)</strong> ở thanh dưới của Safari.
                  </li>
                  <li>Cuộn xuống và chọn <strong>&quot;Thêm vào MH chính&quot; (Add to Home Screen)</strong>.</li>
                  <li>Bấm <strong>Thêm</strong> — biểu tượng CODELAB sẽ xuất hiện như ứng dụng gốc!</li>
                </ol>
              </div>
            ) : (
              <div className="rounded-xl border border-blue-500/25 bg-blue-500/5 p-3.5 text-xs space-y-2">
                <p className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                  <Download className="h-4 w-4" /> Hướng dẫn cài đặt trên Chrome / Edge / Android:
                </p>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-700 dark:text-slate-300 leading-relaxed">
                  <li>
                    Trên máy tính: bấm biểu tượng <strong>Cài đặt ứng dụng</strong> ở góc phải thanh địa chỉ URL (hoặc mở menu <strong>⋮ → Truyền, lưu và chia sẻ → Cài đặt CODELAB</strong>).
                  </li>
                  <li>
                    Trên điện thoại Android: mở menu <strong>⋮ → Cài đặt ứng dụng / Thêm vào màn hình chính</strong>.
                  </li>
                  <li>
                    Bấm <strong>Cài đặt</strong> để mở CODELAB toàn màn hình kèm bộ nhớ đệm Clang WASM & Gia sư Offline.
                  </li>
                </ol>
              </div>
            )}

            <div className="flex justify-end">
              <Button size="sm" variant="primary" onClick={() => setGuideOpen(false)}>
                Đã hiểu
              </Button>
            </div>
          </Card>
        </div>
      )}
    </PwaContext.Provider>
  );
}

export function usePwaInstall() {
  const ctx = useContext(PwaContext);
  if (!ctx) throw new Error("usePwaInstall must be used inside PwaInstallProvider");
  return ctx;
}

export function PwaInstallButton({ compact = false }: { compact?: boolean }) {
  const { isInstalled, canPromptInstall, openInstallAction } = usePwaInstall();

  if (isInstalled) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => void openInstallAction()}
      className="inline-flex items-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 px-2.5 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
      title={
        canPromptInstall
          ? "Cài đặt ứng dụng CODELAB (PWA) về máy"
          : "Hướng dẫn tải & cài đặt ứng dụng CODELAB (PWA)"
      }
    >
      <Download className="h-3.5 w-3.5 shrink-0" />
      <span className={compact ? "hidden sm:inline" : ""}>Tải App</span>
    </button>
  );
}
