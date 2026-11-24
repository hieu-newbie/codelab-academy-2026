import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const SCRYPT_KEYLEN = 64;
let cachedSessionSecret: string | null = null;

export function generateId(prefix = ""): string {
  const uuid = crypto.randomUUID();
  return prefix ? `${prefix}_${uuid.replace(/-/g, "").slice(0, 16)}` : uuid;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
  return `scrypt:${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(":");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const [, salt, originalHex] = parts;
  const derived = crypto.scryptSync(password, salt, SCRYPT_KEYLEN);
  const original = Buffer.from(originalHex, "hex");
  if (derived.length !== original.length) return false;
  return crypto.timingSafeEqual(derived, original);
}

function getSessionSecret(): string {
  const envSecret = process.env.AUTH_SESSION_SECRET?.trim();
  if (envSecret && envSecret.length >= 16) return envSecret;
  if (cachedSessionSecret) return cachedSessionSecret;

  // Auto-generate and persist a strong 32-byte machine-local secret if env var is unset
  try {
    const dir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const secretFile = path.join(dir, ".session_secret");
    if (fs.existsSync(secretFile)) {
      const stored = fs.readFileSync(secretFile, "utf8").trim();
      if (stored.length >= 32) {
        cachedSessionSecret = stored;
        return cachedSessionSecret;
      }
    }
    const generated = crypto.randomBytes(32).toString("hex");
    fs.writeFileSync(secretFile, generated, { mode: 0o600 });
    cachedSessionSecret = generated;
    return cachedSessionSecret;
  } catch {
    cachedSessionSecret = "codelab-local-fallback-secret-key-please-set-env-var";
    return cachedSessionSecret;
  }
}

export interface SessionPayload {
  uid: string;
  role: "student" | "admin";
  exp: number;
}

export function signSessionToken(payload: Omit<SessionPayload, "exp">, ttlDays = 7): string {
  const fullPayload: SessionPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + ttlDays * 86400,
  };
  const encoded = Buffer.from(JSON.stringify(fullPayload)).toString("base64url");
  const sig = crypto
    .createHmac("sha256", getSessionSecret())
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${sig}`;
}

export function verifySessionToken(token: string | undefined | null): SessionPayload | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  const expectedSig = crypto
    .createHmac("sha256", getSessionSecret())
    .update(encoded)
    .digest("base64url");
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as SessionPayload;
    if (!parsed.uid || !parsed.exp || parsed.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
