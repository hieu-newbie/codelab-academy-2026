import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

// Zero-dependency crisp PNG generator for CODELAB PWA icons (192x192, 512x512, maskable 512x512, apple-touch 180x180)
const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[n] = c >>> 0;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBytes = Buffer.from(type, "ascii");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBytes, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([lenBuf, typeBytes, data, crcBuf]);
}

function encodePng(width, height, rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter None
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const compressed = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    signature,
    makeChunk("IHDR", ihdr),
    makeChunk("IDAT", compressed),
    makeChunk("IEND", Buffer.alloc(0)),
  ]);
}

function distToSegment(px, py, ax, ay, bx, by) {
  const vx = bx - ax;
  const vy = by - ay;
  const wx = px - ax;
  const wy = py - ay;
  const len2 = vx * vx + vy * vy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, (wx * vx + wy * vy) / len2));
  const cx = ax + t * vx;
  const cy = ay + t * vy;
  return Math.hypot(px - cx, py - cy);
}

function roundedRectSdf(x, y, cx, cy, halfW, halfH, r) {
  const dx = Math.abs(x - cx) - (halfW - r);
  const dy = Math.abs(y - cy) - (halfH - r);
  const out = Math.hypot(Math.max(dx, 0), Math.max(dy, 0));
  const inside = Math.min(Math.max(dx, dy), 0);
  return out + inside - r;
}

function renderCodeLabIcon(size, maskable) {
  const rgba = Buffer.alloc(size * size * 4);
  const scale = maskable ? 0.68 : 0.84;
  const stroke = size * 0.044 * (maskable ? 0.86 : 1);

  // Normalized </> vector segments centered at (0.5, 0.5) with crisp separation
  const segments = [
    // Left '<'
    [0.31, 0.35, 0.16, 0.5],
    [0.16, 0.5, 0.31, 0.65],
    // Center '/'
    [0.56, 0.28, 0.44, 0.72],
    // Right '>'
    [0.69, 0.35, 0.84, 0.5],
    [0.84, 0.5, 0.69, 0.65],
  ].map(([x1, y1, x2, y2]) => [
    (0.5 + (x1 - 0.5) * scale) * size,
    (0.5 + (y1 - 0.5) * scale) * size,
    (0.5 + (x2 - 0.5) * scale) * size,
    (0.5 + (y2 - 0.5) * scale) * size,
  ]);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      const u = px / size;
      const v = py / size;

      // Diagonal rich blue -> indigo gradient (#2563eb -> #4f46e5)
      const t = Math.max(0, Math.min(1, (u * 0.65 + v * 0.85) / 1.35));
      let bgR = Math.round(37 + (79 - 37) * t);
      let bgG = Math.round(99 + (70 - 99) * t);
      let bgB = Math.round(235 + (229 - 235) * t);

      // Subtle top-left glow
      const glowDist = Math.hypot(u - 0.25, v - 0.22);
      const glow = Math.max(0, 1 - glowDist * 1.9) * 0.22;
      bgR = Math.min(255, Math.round(bgR + (125 - bgR) * glow));
      bgG = Math.min(255, Math.round(bgG + (211 - bgG) * glow));
      bgB = Math.min(255, Math.round(bgB + (252 - bgB) * glow));

      // Rounded icon shape for non-maskable icons; full-bleed square for maskable icons
      let bgAlpha = 1;
      if (!maskable) {
        const sdf = roundedRectSdf(px, py, size * 0.5, size * 0.5, size * 0.48, size * 0.48, size * 0.22);
        bgAlpha = Math.max(0, Math.min(1, 0.5 - sdf));
      }

      // Glyph '</>' anti-aliased SDF
      let minD = Infinity;
      for (const [ax, ay, bx, by] of segments) {
        const d = distToSegment(px, py, ax, ay, bx, by);
        if (d < minD) minD = d;
      }
      const glyphAlpha = Math.max(0, Math.min(1, stroke - minD + 0.8));

      // Subtle drop shadow behind glyph
      let shadowMinD = Infinity;
      for (const [ax, ay, bx, by] of segments) {
        const d = distToSegment(px, py - size * 0.015, ax, ay, bx, by);
        if (d < shadowMinD) shadowMinD = d;
      }
      const shadowAlpha = Math.max(0, Math.min(0.22, (stroke * 1.15 - shadowMinD) * 0.08));

      // Composite shadow then crisp white glyph on background
      let r = bgR * (1 - shadowAlpha) + 15 * shadowAlpha;
      let g = bgG * (1 - shadowAlpha) + 23 * shadowAlpha;
      let b = bgB * (1 - shadowAlpha) + 42 * shadowAlpha;

      r = r * (1 - glyphAlpha) + 255 * glyphAlpha;
      g = g * (1 - glyphAlpha) + 255 * glyphAlpha;
      b = b * (1 - glyphAlpha) + 255 * glyphAlpha;

      const idx = (y * size + x) * 4;
      rgba[idx] = Math.round(r);
      rgba[idx + 1] = Math.round(g);
      rgba[idx + 2] = Math.round(b);
      rgba[idx + 3] = Math.round(bgAlpha * 255);
    }
  }

  return encodePng(size, size, rgba);
}

const outDir = path.resolve(process.cwd(), "public", "icons");
fs.mkdirSync(outDir, { recursive: true });

const specs = [
  { file: "icon-192.png", size: 192, maskable: false },
  { file: "icon-512.png", size: 512, maskable: false },
  { file: "icon-maskable-512.png", size: 512, maskable: true },
  { file: "apple-touch-icon.png", size: 180, maskable: true },
];

for (const s of specs) {
  const png = renderCodeLabIcon(s.size, s.maskable);
  fs.writeFileSync(path.join(outDir, s.file), png);
  console.log(`[generate-pwa-icons] Wrote public/icons/${s.file} (${png.length} bytes)`);
}
