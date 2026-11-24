const CACHE_NAME = "codelab-clang-wasm-v22-0-0";

// Intercept fetches to /wasm/clang/* inside the worker to persist large WASM/tar assets
// in browser Cache Storage so subsequent page loads start instantaneously from disk cache.
const nativeFetch = self.fetch.bind(self);
let cachedHits = 0;

self.fetch = async (input, init) => {
  const urlStr = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  const isClangAsset = urlStr.includes("/wasm/clang/");

  if (!isClangAsset || typeof caches === "undefined") {
    return nativeFetch(input, init);
  }

  try {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(urlStr);
    if (cached) {
      cachedHits += 1;
      return cached;
    }

    const networkRes = await nativeFetch(input, init);
    if (networkRes.ok) {
      // Cache asynchronously without blocking streaming progress
      cache.put(urlStr, networkRes.clone()).catch(() => {});
    }
    return networkRes;
  } catch {
    return nativeFetch(input, init);
  }
};

let clangCommandsPromise = null;
function loadClangCommands() {
  if (!clangCommandsPromise) {
    clangCommandsPromise = import("/wasm/clang/bundle.js").then((mod) => mod.commands);
  }
  return clangCommandsPromise;
}

const textDecoder = new TextDecoder();

// Virtual <bits/stdc++.h> header for competitive programming (C++17 / libc++ WASI compatible)
const BITS_STDCPP_HEADER = [
  "#ifndef _CODELAB_BITS_STDCPP_H",
  "#define _CODELAB_BITS_STDCPP_H",
  "#include <cassert>",
  "#include <cctype>",
  "#include <cerrno>",
  "#include <cfloat>",
  "#include <climits>",
  "#include <cmath>",
  "#include <cstddef>",
  "#include <cstdint>",
  "#include <cstdio>",
  "#include <cstdlib>",
  "#include <cstring>",
  "#include <ctime>",
  "#include <algorithm>",
  "#include <array>",
  "#include <bitset>",
  "#include <chrono>",
  "#include <complex>",
  "#include <deque>",
  "#include <forward_list>",
  "#include <functional>",
  "#include <iomanip>",
  "#include <ios>",
  "#include <iosfwd>",
  "#include <iostream>",
  "#include <istream>",
  "#include <iterator>",
  "#include <limits>",
  "#include <list>",
  "#include <map>",
  "#include <memory>",
  "#include <numeric>",
  "#include <optional>",
  "#include <ostream>",
  "#include <queue>",
  "#include <random>",
  "#include <set>",
  "#include <sstream>",
  "#include <stack>",
  "#include <string>",
  "#include <string_view>",
  "#include <tuple>",
  "#include <type_traits>",
  "#include <unordered_map>",
  "#include <unordered_set>",
  "#include <utility>",
  "#include <valarray>",
  "#include <variant>",
  "#include <vector>",
  "#endif",
  "",
].join("\n");

function stripAnsi(str) {
  return str.replace(/\x1b\[[0-9;]*m/g, "");
}

let isWarm = false;

self.onmessage = async (event) => {
  const { type, requestId, sourceCode } = event.data || {};
  if (type !== "compile") return;

  const startTime = performance.now();
  let stderrText = "";
  let stdoutText = "";
  let lastPercent = -1;
  const hitsBefore = cachedHits;

  try {
    if (!isWarm) {
      self.postMessage({
        type: "progress",
        requestId,
        stage: "loading_compiler",
        percent: 3,
        fromCache: false,
        message: "Đang khởi tạo trình biên dịch Clang WASM...",
      });
    } else {
      self.postMessage({
        type: "progress",
        requestId,
        stage: "compiling",
        percent: 65,
        fromCache: true,
        message: "Đang biên dịch mã nguồn C++17...",
      });
    }

    const commands = await loadClangCommands();

    const outFiles = await commands["clang++"](
      [
        "-std=c++17",
        "-O1",
        "-fno-exceptions",
        "-fno-color-diagnostics",
        "-I.",
        "main.cpp",
        "-o",
        "main.wasm",
      ],
      {
        "main.cpp": sourceCode,
        bits: {
          "stdc++.h": BITS_STDCPP_HEADER,
        },
      },
      {
        stdout: (bytes) => {
          if (bytes) stdoutText += textDecoder.decode(bytes, { stream: true });
        },
        stderr: (bytes) => {
          if (bytes) stderrText += textDecoder.decode(bytes, { stream: true });
        },
        fetchProgress: ({ doneLength, totalLength }) => {
          if (!totalLength) return;
          const pct = Math.min(99, Math.round((doneLength / totalLength) * 100));
          if (pct !== lastPercent) {
            lastPercent = pct;
            const doneMb = (doneLength / (1024 * 1024)).toFixed(1);
            const totalMb = (totalLength / (1024 * 1024)).toFixed(1);
            const loadedFromCache = cachedHits > hitsBefore;
            self.postMessage({
              type: "progress",
              requestId,
              stage: "loading_compiler",
              percent: pct,
              fromCache: loadedFromCache,
              message: loadedFromCache
                ? `Đang nạp trình biên dịch từ bộ nhớ đệm (${pct}%)...`
                : `Đang tải trình biên dịch Clang WASM: ${doneMb}/${totalMb} MB (${pct}%) — chỉ tải lần đầu...`,
            });
          }
        },
      }
    );

    isWarm = true;
    stderrText += textDecoder.decode();
    stdoutText += textDecoder.decode();

    const wasmBytes = outFiles && outFiles["main.wasm"];
    const compileTimeMs = Math.max(1, Math.round(performance.now() - startTime));

    if (!(wasmBytes instanceof Uint8Array) || wasmBytes.byteLength === 0) {
      self.postMessage({
        type: "compiled",
        requestId,
        ok: false,
        compileOutput:
          stripAnsi(stderrText || stdoutText).trim() ||
          "Biên dịch thất bại: không tạo được tệp thực thi WebAssembly.",
        compileTimeMs,
      });
      return;
    }

    const copy = new Uint8Array(wasmBytes);
    self.postMessage(
      {
        type: "compiled",
        requestId,
        ok: true,
        wasmBytes: copy,
        warnings: stripAnsi(stderrText).trim(),
        compileTimeMs,
      },
      [copy.buffer]
    );
  } catch (err) {
    isWarm = true;
    stderrText += textDecoder.decode();
    stdoutText += textDecoder.decode();
    const compileTimeMs = Math.max(1, Math.round(performance.now() - startTime));
    const diagnostic =
      stripAnsi(stderrText || stdoutText).trim() ||
      (err && err.message ? err.message : "Lỗi biên dịch không xác định.");

    self.postMessage({
      type: "compiled",
      requestId,
      ok: false,
      compileOutput: diagnostic,
      compileTimeMs,
    });
  }
};
