import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function copyDirFiles(srcDir, destDir, filterFn) {
  if (!fs.existsSync(srcDir)) {
    console.warn(`[sync-wasm-assets] Missing source directory: ${srcDir}`);
    return;
  }
  fs.mkdirSync(destDir, { recursive: true });
  for (const name of fs.readdirSync(srcDir)) {
    if (filterFn && !filterFn(name)) continue;
    const src = path.join(srcDir, name);
    const dest = path.join(destDir, name);
    const stat = fs.statSync(src);
    if (!stat.isFile()) continue;

    // Skip copying if identical size & mtime already synced
    if (fs.existsSync(dest)) {
      const destStat = fs.statSync(dest);
      if (destStat.size === stat.size) continue;
    }
    fs.copyFileSync(src, dest);
  }
}

copyDirFiles(
  path.join(root, "node_modules", "@yowasp", "clang", "gen"),
  path.join(root, "public", "wasm", "clang"),
  (name) => name.endsWith(".js") || name.endsWith(".wasm") || name.endsWith(".tar")
);

copyDirFiles(
  path.join(root, "node_modules", "@bjorn3", "browser_wasi_shim", "dist"),
  path.join(root, "public", "wasm", "wasi"),
  (name) => name.endsWith(".js")
);

console.log("[sync-wasm-assets] Synced Clang WASM & WASI shim into public/wasm/");
