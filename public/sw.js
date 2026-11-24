const SHELL_CACHE = "codelab-pwa-shell-v1";
const PRECACHE_URLS = [
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith("codelab-pwa-shell-") && k !== SHELL_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Never intercept API calls or large Clang WASM worker assets (handled by dedicated WASM cache)
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/wasm/")) {
    return;
  }

  // Static Next.js build assets & icons: cache-first with background refresh
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.webmanifest"
  ) {
    event.respondWith(
      caches.open(SHELL_CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        const networkPromise = fetch(req)
          .then((res) => {
            if (res.ok) cache.put(req, res.clone()).catch(() => {});
            return res;
          })
          .catch(() => null);
        return cached || (await networkPromise) || new Response("", { status: 504 });
      })
    );
    return;
  }

  // HTML page navigations: network-first, fallback to cache or clean offline page
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(SHELL_CACHE).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          if (cached) return cached;
          return new Response(
            `<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CODELAB · Đang ngoại tuyến</title><style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#090e1a;color:#f8fafc;font-family:system-ui,sans-serif;padding:24px}.card{max-width:420px;background:#0d1424;border:1px solid #1e293b;border-radius:16px;padding:28px;text-align:center}h1{font-size:20px;margin:0 0 10px}p{font-size:14px;color:#94a3b8;line-height:1.6;margin:0 0 18px}button{background:#2563eb;color:#fff;border:0;border-radius:10px;padding:10px 18px;font-weight:700;cursor:pointer}</style></head><body><div class="card"><h1>CODELAB đang ngoại tuyến</h1><p>Kết nối mạng hiện bị gián đoạn. Vui lòng kết nối lại Internet rồi bấm tải lại trang để tiếp tục học.</p><button onclick="location.reload()">Thử tải lại</button></div></body></html>`,
            { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
          );
        })
    );
  }
});
