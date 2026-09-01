const COOKIE_NAME = "vessel_admin_sess";
const TTL_MS = 1000 * 60 * 60 * 12;
const TEXT_ENCODER = new TextEncoder();
const TEXT_DECODER = new TextDecoder();

function pickFirstEnv(keys: readonly string[], env: Record<string, string | undefined>): string | undefined {
  for (const k of keys) {
    const v = env[k];
    if (typeof v === "string" && v.length > 0) return v;
  }
  return undefined;
}

function getSigningSecret(): Uint8Array {
  const env = process.env as NodeJS.ProcessEnv & Record<string, string | undefined>;
  const explicit = env["ADMIN_SESSION_SECRET"];
  const serviceRole = pickFirstEnv(
    [
      "SUPABASE_SERVICE_ROLE_KEY",
      "SUPABASE_SERVICE_KEY",
      "VITE_SUPABASE_SERVICE_ROLE_KEY",
      "VITE_SUPABASE_SERVICE_KEY",
    ],
    env,
  );
  const fallback = serviceRole ?? env["ADMIN_PASSWORD"] ?? "vessel-dev-secret-change-me";
  const raw = (explicit ?? fallback).slice(0, 64);
  return TEXT_ENCODER.encode(raw.padEnd(32, "0"));
}

function toHex(buf: Uint8Array | ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i] ?? 0;
    out += b.toString(16).padStart(2, "0");
  }
  return out;
}

function fromHex(hex: string): Uint8Array | null {
  if (!hex || hex.length % 2 !== 0) return null;
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    const byte = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    if (Number.isNaN(byte)) return null;
    out[i] = byte;
  }
  return out;
}

function randomHex(byteCount: number): string {
  const buf = new Uint8Array(byteCount);
  globalThis.crypto.getRandomValues(buf);
  return toHex(buf);
}

function timingSafeHexEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= (a.charCodeAt(i) ?? 0) ^ (b.charCodeAt(i) ?? 0);
  }
  return diff === 0;
}

async function hmacSha256Hex(key: Uint8Array, message: Uint8Array): Promise<string> {
  const cryptoKey = await globalThis.crypto.subtle.importKey(
    "raw",
    key.buffer.slice(key.byteOffset, key.byteOffset + key.byteLength) as ArrayBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const msgBuf = message.buffer.slice(
    message.byteOffset,
    message.byteOffset + message.byteLength,
  ) as ArrayBuffer;
  const sig = await globalThis.crypto.subtle.sign("HMAC", cryptoKey, msgBuf);
  return toHex(sig);
}

export type AdminSession = {
  sub: string;
  email: string;
  iat: number;
  exp: number;
  nonce: string;
};

export async function signAdminSession(user: { id: string; email: string }): Promise<string> {
  const key = getSigningSecret();
  const now = Date.now();
  const sess: AdminSession = {
    sub: user.id,
    email: user.email,
    iat: now,
    exp: now + TTL_MS,
    nonce: randomHex(8),
  };
  const payload = TEXT_ENCODER.encode(JSON.stringify(sess));
  const payloadHex = toHex(payload);
  const sig = await hmacSha256Hex(key, payload);
  return `${payloadHex}.${sig}`;
}

export async function verifyAdminSession(token: string): Promise<AdminSession | null> {
  if (!token || !token.includes(".")) return null;
  const parts = token.split(".");
  const payloadHex = parts[0];
  const sigHex = parts[1];
  if (!payloadHex || !sigHex) return null;
  const payload = fromHex(payloadHex);
  if (!payload) return null;
  const key = getSigningSecret();
  const expected = await hmacSha256Hex(key, payload);
  if (!timingSafeHexEqual(expected, sigHex)) return null;
  try {
    const obj = JSON.parse(TEXT_DECODER.decode(payload)) as AdminSession;
    if (typeof obj !== "object" || !obj) return null;
    if (typeof obj.sub !== "string" || obj.sub.length === 0) return null;
    if (typeof obj.email !== "string" || obj.email.length === 0) return null;
    if (typeof obj.exp !== "number" || obj.exp < Date.now()) return null;
    return obj;
  } catch {
    return null;
  }
}

export function readSessionCookie(request: Request | undefined | null): string | undefined {
  if (!request) return undefined;
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return undefined;
  const pairs = cookieHeader.split(";");
  for (const pair of pairs) {
    const trimmed = pair.trim();
    if (!trimmed.startsWith(COOKIE_NAME + "=")) continue;
    const raw = trimmed.slice(COOKIE_NAME.length + 1);
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }
  return undefined;
}

export function buildSetCookieHeader(value: string | null): string {
  const v = value ? encodeURIComponent(value) : "";
  const base = `${COOKIE_NAME}=${v}; Path=/; SameSite=Lax; HttpOnly`;
  if (value) {
    const exp = new Date(Date.now() + TTL_MS).toUTCString();
    return `${base}; Expires=${exp}; Max-Age=${Math.floor(TTL_MS / 1000)}`;
  }
  return `${base}; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0`;
}

export function buildClientSettableCookie(value: string | null, secure = typeof location !== "undefined" && location.protocol === "https:"): string {
  const v = value ? encodeURIComponent(value) : "";
  const pieces = [`${COOKIE_NAME}=${v}`, "Path=/", "SameSite=Lax"];
  if (secure) pieces.push("Secure");
  if (value) {
    const exp = new Date(Date.now() + TTL_MS).toUTCString();
    pieces.push(`Expires=${exp}`, `Max-Age=${Math.floor(TTL_MS / 1000)}`);
  } else {
    pieces.push("Expires=Thu, 01 Jan 1970 00:00:00 GMT", "Max-Age=0");
  }
  return pieces.join("; ");
}

export const ADMIN_COOKIE_NAME = COOKIE_NAME;

export async function isAdminRequest(request: Request | undefined | null): Promise<boolean> {
  const token = readSessionCookie(request);
  if (!token) return false;
  const sess = await verifyAdminSession(token);
  return !!sess;
}
