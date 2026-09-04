import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import {
  deleteAlbum,
  deleteAlbumPhoto,
  deletePortfolioItem,
  deleteStorageObject,
  extractStoragePath,
  getAlbum,
  getSupabaseServerClient,
  getServerEnv,
  insertAlbum,
  insertAlbumPhoto,
  insertPortfolioItem,
  listAlbumPhotos,
  listAlbums,
  listContactInquiries,
  listPortfolioItems,
  PortfolioItem,
  PortfolioItemInput,
  readSupabaseAnonKey,
  readSupabaseServiceRoleKey,
  readSupabaseUrl,
  reorderAlbumPhotos,
  reorderAlbums,
  reorderPortfolioItems,
  updateAlbum,
  updateAlbumPhoto,
  updateContactInquiryStatus,
  updatePortfolioItem,
  uploadPortfolioImage,
  type Album,
  type AlbumPhoto,
  type ContactInquiry,
} from "../lib/supabase-server";
import {
  AdminSession,
  buildClientSettableCookie,
  buildSetCookieHeader,
  isAdminRequest,
  readSessionCookie,
  signAdminSession,
  verifyAdminSession,
} from "../lib/admin-auth";

type EnvVarStatus = {
  present: boolean;
  length?: number;
  first3?: string;
  last3?: string;
};

function statusOf(value: string | undefined): EnvVarStatus {
  if (typeof value !== "string") return { present: false };
  const out: EnvVarStatus = {
    present: value.length > 0,
    length: value.length,
    first3: value.slice(0, 3),
  };
  if (value.length >= 3) {
    out.last3 = value.slice(-3);
  }
  return out;
}

export type EnvDiagnostics = {
  runtime: string;
  region?: string;
  url: EnvVarStatus;
  anonKey: EnvVarStatus;
  serviceKey: EnvVarStatus;
  urlCandidates: Record<string, boolean>;
  anonCandidates: Record<string, boolean>;
  serviceCandidates: Record<string, boolean>;
};

export function getEnvDiagnostics(): EnvDiagnostics {
  const env = getServerEnv();
  const urlCandidates: Record<string, boolean> = {
    SUPABASE_URL: typeof env["SUPABASE_URL"] === "string" && env["SUPABASE_URL"].length > 0,
    VITE_SUPABASE_URL: typeof env["VITE_SUPABASE_URL"] === "string" && env["VITE_SUPABASE_URL"].length > 0,
    PUBLIC_SUPABASE_URL: typeof env["PUBLIC_SUPABASE_URL"] === "string" && env["PUBLIC_SUPABASE_URL"].length > 0,
    NEXT_PUBLIC_SUPABASE_URL:
      typeof env["NEXT_PUBLIC_SUPABASE_URL"] === "string" && env["NEXT_PUBLIC_SUPABASE_URL"].length > 0,
    REACT_APP_SUPABASE_URL:
      typeof env["REACT_APP_SUPABASE_URL"] === "string" && env["REACT_APP_SUPABASE_URL"].length > 0,
    EXPO_PUBLIC_SUPABASE_URL:
      typeof env["EXPO_PUBLIC_SUPABASE_URL"] === "string" && env["EXPO_PUBLIC_SUPABASE_URL"].length > 0,
  };
  const anonCandidates: Record<string, boolean> = {
    SUPABASE_ANON_KEY: typeof env["SUPABASE_ANON_KEY"] === "string" && env["SUPABASE_ANON_KEY"].length > 0,
    VITE_SUPABASE_ANON_KEY:
      typeof env["VITE_SUPABASE_ANON_KEY"] === "string" && env["VITE_SUPABASE_ANON_KEY"].length > 0,
    PUBLIC_SUPABASE_ANON_KEY:
      typeof env["PUBLIC_SUPABASE_ANON_KEY"] === "string" && env["PUBLIC_SUPABASE_ANON_KEY"].length > 0,
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      typeof env["NEXT_PUBLIC_SUPABASE_ANON_KEY"] === "string" && env["NEXT_PUBLIC_SUPABASE_ANON_KEY"].length > 0,
    REACT_APP_SUPABASE_ANON_KEY:
      typeof env["REACT_APP_SUPABASE_ANON_KEY"] === "string" && env["REACT_APP_SUPABASE_ANON_KEY"].length > 0,
    EXPO_PUBLIC_SUPABASE_ANON_KEY:
      typeof env["EXPO_PUBLIC_SUPABASE_ANON_KEY"] === "string" && env["EXPO_PUBLIC_SUPABASE_ANON_KEY"].length > 0,
  };
  const serviceCandidates: Record<string, boolean> = {
    SUPABASE_SERVICE_ROLE_KEY:
      typeof env["SUPABASE_SERVICE_ROLE_KEY"] === "string" && env["SUPABASE_SERVICE_ROLE_KEY"].length > 0,
    SUPABASE_SERVICE_KEY:
      typeof env["SUPABASE_SERVICE_KEY"] === "string" && env["SUPABASE_SERVICE_KEY"].length > 0,
    VITE_SUPABASE_SERVICE_ROLE_KEY:
      typeof env["VITE_SUPABASE_SERVICE_ROLE_KEY"] === "string" && env["VITE_SUPABASE_SERVICE_ROLE_KEY"].length > 0,
    VITE_SUPABASE_SERVICE_KEY:
      typeof env["VITE_SUPABASE_SERVICE_KEY"] === "string" && env["VITE_SUPABASE_SERVICE_KEY"].length > 0,
  };
  const runtime =
    (typeof env["VERCEL_ENV"] === "string" ? `vercel:${env["VERCEL_ENV"]}` : "") ||
    (typeof env["CF_PAGES"] === "string" ? `cloudflare-pages:${env["CF_PAGES"]}` : "") ||
    (typeof env["NODE_ENV"] === "string" ? `node:${env["NODE_ENV"]}` : "node");
  const regionRaw = env["VERCEL_REGION"] ?? env["AWS_REGION"];
  const diag: EnvDiagnostics = {
    runtime,
    url: statusOf(readSupabaseUrl(env)),
    anonKey: statusOf(readSupabaseAnonKey(env)),
    serviceKey: statusOf(readSupabaseServiceRoleKey(env)),
    urlCandidates,
    anonCandidates,
    serviceCandidates,
  };
  if (typeof regionRaw === "string") {
    diag.region = regionRaw;
  }
  return diag;
}

function describeMissingAuth(d: EnvDiagnostics): string {
  const parts: string[] = [];
  if (!d.url.present) {
    const set = Object.entries(d.urlCandidates)
      .filter(([, v]) => v)
      .map(([k]) => k);
    parts.push(
      `SUPABASE_URL is missing (no candidate found; tried ${Object.keys(d.urlCandidates).join(", ")}). ${
        set.length ? ` (debug: unexpected — setCandidates: ${set.join(",")})` : ""
      }`,
    );
  }
  if (!d.anonKey.present) {
    parts.push(
      `SUPABASE_ANON_KEY is missing (no candidate found; tried ${Object.keys(d.anonCandidates).join(", ")}). This is required for admin sign-in even if you don't use client auth anywhere.`,
    );
  }
  return parts.join(" ");
}

function getSupabaseAuthClient(): ReturnType<typeof createClient> | null {
  const env = getServerEnv();
  const url = readSupabaseUrl(env);
  const anonKey = readSupabaseAnonKey(env);
  if (!url || !anonKey) {
    const diag = getEnvDiagnostics();
    console.warn("[-_admin] Supabase auth client unavailable.", JSON.stringify(diag, null, 2));
    return null;
  }
  try {
    return createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  } catch (err) {
    console.error("[-_admin] Failed to create Supabase auth client:", err);
    return null;
  }
}

function authNotConfigured(): UnauthResult {
  const diag = getEnvDiagnostics();
  const specific = describeMissingAuth(diag);
  const detail = specific
    ? ` ${specific} | runtime=${diag.runtime}${diag.region ? ` region=${diag.region}` : ""} | urlFound=${diag.url.present} anonFound=${diag.anonKey.present} svcFound=${diag.serviceKey.present}`
    : ` runtime=${diag.runtime}`;
  return {
    ok: false,
    code: "SERVER",
    message: `Supabase Auth is not configured on this server.${detail}`,
    diagnostics: diag,
  };
}

type H3LikeEvent = {
  node?: { res?: { setHeader?(name: string, value: string | string[]): void } };
  context?: { h3?: { event?: unknown } };
  appendResponseHeader?: (name: string, value: string) => void;
};

type AdminContext = { request?: Request; event?: H3LikeEvent };

function isH3LikeEvent(obj: unknown): obj is H3LikeEvent {
  if (!obj || typeof obj !== "object") return false;
  const o = obj as H3LikeEvent;
  return typeof o.appendResponseHeader === "function" || typeof o.node?.res?.setHeader === "function";
}

function findH3EventInTree(obj: unknown, depth = 0, seen = new WeakSet<object>()): H3LikeEvent | undefined {
  if (!obj || typeof obj !== "object") return undefined;
  if (depth > 8) return undefined;
  const o = obj as object;
  if (seen.has(o)) return undefined;
  seen.add(o);
  if (isH3LikeEvent(o)) return o;
  const keys = Object.keys(o);
  for (const k of keys) {
    const child = (o as Record<string, unknown>)[k];
    const hit = findH3EventInTree(child, depth + 1, seen);
    if (hit) return hit;
  }
  return undefined;
}

function extractEvent(ctx: AdminContext | undefined): H3LikeEvent | undefined {
  if (!ctx) return undefined;
  return (ctx as unknown as { event?: H3LikeEvent }).event;
}

function attachSetCookie(eventOrArgs: unknown, value: string | null): string {
  const header = buildSetCookieHeader(value);
  const event: H3LikeEvent | undefined = isH3LikeEvent(eventOrArgs)
    ? eventOrArgs
    : findH3EventInTree(eventOrArgs);
  if (event) {
    if (typeof event.appendResponseHeader === "function") {
      try {
        event.appendResponseHeader("set-cookie", header);
      } catch (err) {
        console.warn("[-_admin] attachSetCookie via appendResponseHeader failed:", err);
      }
    }
    const res = event?.node?.res;
    if (res && typeof res.setHeader === "function") {
      try {
        res.setHeader("set-cookie", header);
      } catch (err) {
        console.warn("[-_admin] attachSetCookie via node.res.setHeader failed:", err);
      }
    }
  }
  return header;
}

type UnauthResult = {
  ok: false;
  code: "AUTH" | "VALIDATION" | "SERVER";
  message: string;
  diagnostics?: EnvDiagnostics;
};
type Success<T> = { ok: true } & T;

type ContextShape = {
  request?: Request;
  event?: H3LikeEvent;
  context?: unknown;
  [k: string]: unknown;
};

type NodeReqLike = {
  headers?: { cookie?: string } | { [k: string]: string | string[] | undefined };
  [k: string]: unknown;
};

type HasHeaders = {
  headers?:
    | { get?: (name: string) => string | null | undefined }
    | { [k: string]: string | string[] | undefined }
    | NodeReqLike["headers"];
};

function cookieFromHeaders(headers: unknown): string | undefined {
  if (!headers) return undefined;
  const h = headers as HasHeaders["headers"] & HasHeaders;
  if (typeof (h as { get?: unknown }).get === "function") {
    const v = (h as { get: (n: string) => string | null | undefined }).get("cookie");
    if (typeof v === "string" && v.length > 0) return v;
  }
  const obj = h as Record<string, string | string[] | undefined> | undefined;
  if (obj && typeof obj === "object") {
    const c = obj["cookie"];
    if (typeof c === "string") return c;
    if (Array.isArray(c)) return c.join("; ");
  }
  return undefined;
}

function findRequestLike(obj: unknown, depth = 0, seen = new WeakSet<object>()): Request | undefined {
  if (!obj || typeof obj !== "object") return undefined;
  if (depth > 6) return undefined;
  const o = obj as object;
  if (seen.has(o)) return undefined;
  seen.add(o);
  if (typeof (o as { headers?: unknown }).headers === "object") {
    const c = cookieFromHeaders((o as { headers?: unknown }).headers);
    if (typeof c === "string") return o as Request;
  }
  for (const key of Object.keys(o)) {
    const child = (o as Record<string, unknown>)[key];
    const r = findRequestLike(child, depth + 1, seen);
    if (r) return r;
  }
  return undefined;
}

function extractCookieFromAnywhere(ctxRaw: unknown): string | undefined {
  const ctx = ctxRaw as ContextShape | undefined;
  const argsObj = ctxRaw as
    | { context?: unknown; data?: unknown; request?: Request; headers?: unknown }
    | undefined;

  if (argsObj && Object.prototype.hasOwnProperty.call(argsObj, "headers")) {
    const c = cookieFromHeaders(argsObj.headers);
    if (c) return c;
  }

  if (ctx?.request && typeof ctx.request === "object") {
    const c = cookieFromHeaders((ctx.request as { headers?: unknown }).headers);
    if (c) return c;
  }

  if (argsObj?.request && typeof argsObj.request === "object") {
    const c = cookieFromHeaders((argsObj.request as { headers?: unknown }).headers);
    if (c) return c;
  }

  const ctxInner = argsObj?.context;
  if (ctxInner && typeof ctxInner === "object") {
    const innerAsCtx = ctxInner as ContextShape & { headers?: unknown };
    if (Object.prototype.hasOwnProperty.call(innerAsCtx, "headers")) {
      const c = cookieFromHeaders(innerAsCtx.headers);
      if (c) return c;
    }
    if (innerAsCtx.request) {
      const c = cookieFromHeaders((innerAsCtx.request as { headers?: unknown }).headers);
      if (c) return c;
    }
  }

  const event = ctx?.event ?? (ctxInner as { event?: H3LikeEvent } | undefined)?.event;
  if (event) {
    const nodeReq = (
      event as unknown as {
        node?: { req?: NodeReqLike };
        context?: { h3?: { event?: { node?: { req?: NodeReqLike } } } };
      }
    )?.node?.req;
    const headersObj = nodeReq?.headers;
    if (headersObj) {
      const c = cookieFromHeaders(headersObj);
      if (c) return c;
    }
    const h3NodeReq = (
      event as unknown as {
        context?: { h3?: { event?: { node?: { req?: NodeReqLike } } } };
      }
    )?.context?.h3?.event?.node?.req;
    const h2 = h3NodeReq?.headers;
    if (h2) {
      const c = cookieFromHeaders(h2);
      if (c) return c;
    }
  }

  const deepReq = findRequestLike(argsObj ?? ctx);
  if (deepReq) {
    const c = cookieFromHeaders((deepReq as { headers?: unknown }).headers);
    if (c) return c;
  }

  return undefined;
}

function describeCtxKeys(obj: unknown): string {
  if (!obj || typeof obj !== "object") return "null";
  const top = Object.keys(obj as object);
  const ctxKeys =
    (obj as { context?: object }).context && typeof (obj as { context?: object }).context === "object"
      ? Object.keys((obj as { context: object }).context)
      : undefined;
  return ctxKeys ? `top:${JSON.stringify(top)} ctx:${JSON.stringify(ctxKeys)}` : JSON.stringify(top);
}

function debugAuth(label: string, argsRaw: unknown) {
  const cookie = extractCookieFromAnywhere(argsRaw);
  const hasOurCookie = cookie ? /vessel_admin_sess=/.test(cookie) : false;
  console.log(
    `[auth-debug] ${label} keys=${describeCtxKeys(argsRaw)} hasCookie=${hasOurCookie} cookie=${(cookie ?? "").slice(0, 120)}${(cookie ?? "").length > 120 ? "…" : ""}`,
  );
}

type AuthCheckResult =
  | { ok: true }
  | { ok: false; phase: "cookie" | "session_key" | "invalid"; detail: string };

async function performAuthCheck(argsRaw: unknown): Promise<AuthCheckResult> {
  const cookie = extractCookieFromAnywhere(argsRaw);
  if (!cookie) {
    return {
      ok: false,
      phase: "cookie",
      detail: `No Cookie header was found on the server context. Keys inspected: ${describeCtxKeys(argsRaw)}`,
    };
  }
  const match = cookie.match(/(?:^|;\s*)vessel_admin_sess=([^;]+)/);
  const rawVal = match ? match[1] : undefined;
  if (!rawVal) {
    const names = cookie
      .split(";")
      .map((p) => p.trim().split("=")[0])
      .filter(Boolean)
      .slice(0, 8);
    return {
      ok: false,
      phase: "session_key",
      detail: `Cookie header present but vessel_admin_sess= was not among the first ${names.length} cookies: [${names.join(", ")}]. Cookie=${cookie.slice(0, 160)}${cookie.length > 160 ? "…" : ""}`,
    };
  }
  let token: string;
  try {
    token = decodeURIComponent(rawVal);
  } catch {
    token = rawVal;
  }
  const sess = await verifyAdminSession(token);
  if (!sess) {
    return {
      ok: false,
      phase: "invalid",
      detail: `Admin cookie was found but the HMAC signature failed to verify or the session is expired. Token length=${token.length}. Make sure env vars (ADMIN_SESSION_SECRET / SUPABASE_SERVICE_ROLE_KEY) did not change between the sign-in response and this request.`,
    };
  }
  return { ok: true };
}

export async function isAdminFromCtx(argsRaw: unknown): Promise<boolean> {
  return (await performAuthCheck(argsRaw)).ok;
}

type SyncAuthPhase = "cookie" | "session_key" | "unknown";

function syncAuthPhase(argsRaw: unknown): { phase: SyncAuthPhase; detail: string } {
  const cookie = extractCookieFromAnywhere(argsRaw);
  if (!cookie) {
    return {
      phase: "cookie",
      detail: `No Cookie header was found on the server context. Keys inspected: ${describeCtxKeys(argsRaw)}`,
    };
  }
  const match = cookie.match(/(?:^|;\s*)vessel_admin_sess=([^;]+)/);
  const rawVal = match ? match[1] : undefined;
  if (!rawVal) {
    const names = cookie
      .split(";")
      .map((p) => p.trim().split("=")[0])
      .filter(Boolean)
      .slice(0, 8);
    return {
      phase: "session_key",
      detail: `Cookie header present but vessel_admin_sess= was not among the first ${names.length} cookies: [${names.join(", ")}]. Cookie=${cookie.slice(0, 160)}${cookie.length > 160 ? "…" : ""}`,
    };
  }
  return {
    phase: "unknown",
    detail: `Admin cookie vessel_admin_sess= is present (raw token length=${rawVal.length}). If auth still fails, the HMAC signature does not match or the session is expired. This happens if SUPABASE_SERVICE_ROLE_KEY / ADMIN_SESSION_SECRET env values were not set consistently between sign-in and this request, or if 12 hours passed since the last sign-in.`,
  };
}

async function unauth(label: string, argsRaw: unknown): Promise<UnauthResult> {
  debugAuth(`unauth:${label}`, argsRaw);
  void label;
  const diag = getEnvDiagnostics();
  const full = await performAuthCheck(argsRaw);
  if (full.ok === false) {
    const phaseText = ({
      cookie: "[No Cookie header on server]",
      session_key: "[Cookie present, but missing our session key]",
      invalid: "[Session signature invalid or expired]",
    } as const)[full.phase];
    return {
      ok: false as const,
      code: "AUTH" as const,
      message: `Not authorised. ${phaseText} — ${full.detail} | runtime=${diag.runtime}${diag.region ? ` region=${diag.region}` : ""} urlSet=${diag.url.present} anonSet=${diag.anonKey.present} svcRoleSet=${diag.serviceKey.present}`,
      diagnostics: diag,
    };
  }
  const sync = syncAuthPhase(argsRaw);
  const phaseText = ({
    cookie: "[No Cookie header on server]",
    session_key: "[Cookie present, but missing our session key]",
    unknown: "[Session present but auth gate still failed]",
  } as const)[sync.phase];
  return {
    ok: false as const,
    code: "AUTH" as const,
    message: `Not authorised. ${phaseText} — ${sync.detail} | runtime=${diag.runtime}${diag.region ? ` region=${diag.region}` : ""} urlSet=${diag.url.present} anonSet=${diag.anonKey.present} svcRoleSet=${diag.serviceKey.present}`,
    diagnostics: diag,
  };
}

// ---------------- Admin auth (Supabase) ----------------

const SignInSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address.").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(400),
});

const SignUpSchema = SignInSchema.extend({
  fullName: z.string().trim().min(2, "Please enter your name").max(120).optional(),
});

export const adminLogin = createServerFn({ method: "POST" })
  .validator((body: unknown) => SignInSchema.safeParse(body))
  .handler(async (args) => {
    const parseResult = (args?.data ?? undefined) as ReturnType<typeof SignInSchema.safeParse> | undefined;

    if (!parseResult || !parseResult.success) {
      const firstIssue = parseResult?.error?.issues?.at?.(0);
      const msg = firstIssue?.message ?? "Invalid request.";
      return { ok: false, code: "VALIDATION" as const, message: msg };
    }
    const authClient = getSupabaseAuthClient();
    if (!authClient) return authNotConfigured();

    const { data, error } = await authClient.auth.signInWithPassword({
      email: parseResult.data.email,
      password: parseResult.data.password,
    });

    if (error || !data.user) {
      const message =
        error?.message?.toLowerCase?.()?.includes("invalid") ||
        error?.message?.toLowerCase?.()?.includes("credentials")
          ? "Invalid email or password."
          : error?.message ?? "Sign in failed.";
      return { ok: false, code: "AUTH" as const, message };
    }

    const userEmail = data.user.email ?? parseResult.data.email;
    const token = await signAdminSession({ id: data.user.id, email: userEmail });
    attachSetCookie(args, token);
    const clientCookie = buildClientSettableCookie(token);

    return { ok: true as const, email: userEmail, cookie: clientCookie };
  });

export const adminSignUp = createServerFn({ method: "POST" })
  .validator((body: unknown) => SignUpSchema.safeParse(body))
  .handler(async (args) => {
    const parseResult = (args?.data ?? undefined) as ReturnType<typeof SignUpSchema.safeParse> | undefined;

    if (!parseResult || !parseResult.success) {
      const firstIssue = parseResult?.error?.issues?.at?.(0);
      const msg = firstIssue?.message ?? "Invalid request.";
      return { ok: false, code: "VALIDATION" as const, message: msg };
    }

    const serverClient = getSupabaseServerClient();
    if (!serverClient) return authNotConfigured();

    const createOpts: {
      email: string;
      password: string;
      email_confirm: boolean;
      user_metadata?: { full_name: string };
    } = {
      email: parseResult.data.email,
      password: parseResult.data.password,
      email_confirm: true,
    };
    if (parseResult.data.fullName) {
      createOpts.user_metadata = { full_name: parseResult.data.fullName };
    }
    const { data, error } = await serverClient.auth.admin.createUser(createOpts);

    if (error || !data.user) {
      return {
        ok: false,
        code: "AUTH" as const,
        message: error?.message ?? "Failed to create account.",
      };
    }

    const userEmail = data.user.email ?? parseResult.data.email;
    const token = await signAdminSession({ id: data.user.id, email: userEmail });
    attachSetCookie(args, token);
    const clientCookie = buildClientSettableCookie(token);

    return { ok: true as const, email: userEmail, cookie: clientCookie };
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(async (args) => {
  attachSetCookie(args, null);
  const clientCookie = buildClientSettableCookie(null);
  return { ok: true as const, cookie: clientCookie };
});

export const adminMe = createServerFn({ method: "GET" }).handler(async (args) => {
  debugAuth("adminMe", args);
  const check = await performAuthCheck(args);
  if (check.ok === false) return { ok: false };
  const sess = await (async () => {
    const cookie = extractCookieFromAnywhere(args);
    if (!cookie) return null;
    const match = cookie.match(/(?:^|;\s*)vessel_admin_sess=([^;]+)/);
    const rawVal = match ? match[1] : undefined;
    if (!rawVal) return null;
    let token: string;
    try {
      token = decodeURIComponent(rawVal);
    } catch {
      token = rawVal;
    }
    return verifyAdminSession(token);
  })();
  if (!sess) return { ok: false };
  return { ok: true as const, email: sess.email };
});

// ---------------- Portfolio CRUD ----------------

const PORTFOLIO_CATEGORIES = [
  "Weddings",
  "Pre-Weddings",
  "Baby & Kids",
  "Products",
  "Corporate",
  "Events",
] as const;

const PortfolioItemSchema = z.object({
  category: z.string().trim().min(2).max(60),
  title: z.string().trim().min(2).max(120),
  location: z.string().trim().min(2).max(160),
  image_url: z.string().trim().min(1).max(1000),
  alt: z.string().trim().max(300).default(""),
  sort_order: z.number().int().min(0).optional(),
});

export const listPortfolio = createServerFn({ method: "GET" }).handler(async (args) => {
  debugAuth("listPortfolio", args);
  const authed = await isAdminFromCtx(args);
  if (!authed) return await unauth("listPortfolio", args);
  const result = await listPortfolioItems();
  if ("error" in result) {
    return { ok: false as const, code: "SERVER" as const, message: result.error };
  }
  return { ok: true as const, items: result.items as PortfolioItem[] };
});

export const createPortfolioItem = createServerFn({ method: "POST" })
  .validator((body: unknown) => PortfolioItemSchema.safeParse(body))
  .handler(async (args) => {
    debugAuth("createPortfolioItem", args);
    const authed = await isAdminFromCtx(args);
    if (!authed) return await unauth("createPortfolioItem", args);
    const parse = (args?.data ?? undefined) as ReturnType<typeof PortfolioItemSchema.safeParse> | undefined;
    if (!parse || !parse.success) {
      return { ok: false as const, code: "VALIDATION" as const, message: "Invalid inputs." };
    }
    const payload = parse.data;
    const existing = await listPortfolioItems();
    const nextSort =
      "items" in existing && existing.items.length
        ? Math.max(...existing.items.map((i) => i.sort_order ?? 0)) + 1
        : 0;
    const res = await insertPortfolioItem({
      category: payload.category,
      title: payload.title,
      location: payload.location,
      image_url: payload.image_url,
      alt: payload.alt,
      sort_order: typeof payload.sort_order === "number" ? payload.sort_order : nextSort,
    });
    if ("error" in res) return { ok: false as const, code: "SERVER" as const, message: res.error };
    return { ok: true as const, id: res.id };
  });

const PatchSchema = PortfolioItemSchema.partial().extend({ id: z.string().min(1).max(64) });

export const updatePortfolio = createServerFn({ method: "POST" })
  .validator((body: unknown) => PatchSchema.safeParse(body))
  .handler(async (args) => {
    debugAuth("updatePortfolio", args);
    const authed = await isAdminFromCtx(args);
    if (!authed) return await unauth("updatePortfolio", args);
    const parse = (args?.data ?? undefined) as ReturnType<typeof PatchSchema.safeParse> | undefined;
    if (!parse || !parse.success) {
      return { ok: false as const, code: "VALIDATION" as const, message: "Invalid inputs." };
    }
    const { id, ...rest } = parse.data;
    void PORTFOLIO_CATEGORIES;
    const patch: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(rest)) {
      if (v !== undefined) patch[k] = v;
    }
    const res = await updatePortfolioItem(id, patch as Partial<PortfolioItemInput>);
    if ("error" in res) return { ok: false as const, code: "SERVER" as const, message: res.error };
    return { ok: true as const };
  });

const ReorderSchema = z.object({ ids: z.array(z.string().min(1)).max(500) });

export const reorderPortfolio = createServerFn({ method: "POST" })
  .validator((body: unknown) => ReorderSchema.safeParse(body))
  .handler(async (args) => {
    debugAuth("reorderPortfolio", args);
    const authed = await isAdminFromCtx(args);
    if (!authed) return await unauth("reorderPortfolio", args);
    const parse = (args?.data ?? undefined) as ReturnType<typeof ReorderSchema.safeParse> | undefined;
    if (!parse || !parse.success) {
      return { ok: false as const, code: "VALIDATION" as const, message: "Invalid payload." };
    }
    const res = await reorderPortfolioItems(parse.data.ids);
    if ("error" in res) return { ok: false as const, code: "SERVER" as const, message: res.error };
    return { ok: true as const };
  });

const DeleteSchema = z.object({ id: z.string().min(1).max(64) });

export const deletePortfolio = createServerFn({ method: "POST" })
  .validator((body: unknown) => DeleteSchema.safeParse(body))
  .handler(async (args) => {
    debugAuth("deletePortfolio", args);
    const authed = await isAdminFromCtx(args);
    if (!authed) return await unauth("deletePortfolio", args);
    const parse = (args?.data ?? undefined) as ReturnType<typeof DeleteSchema.safeParse> | undefined;
    if (!parse || !parse.success) {
      return { ok: false as const, code: "VALIDATION" as const, message: "Invalid payload." };
    }
    const id = parse.data.id;
    const list = await listPortfolioItems();
    if ("items" in list) {
      const target = list.items.find((i) => i.id === id);
      if (target && target.image_url) {
        const match = target.image_url.match(/\/storage\/v1\/object\/public\/[^/]+\/([^?]+)/);
        const path = match ? decodeURIComponent(match[1] ?? "") : "";
        if (path) await deleteStorageObject(path);
      }
    }
    const res = await deletePortfolioItem(id);
    if ("error" in res) return { ok: false as const, code: "SERVER" as const, message: res.error };
    return { ok: true as const };
  });

// ---------------- Image upload ----------------

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

const UploadSchema = z.object({
  filename: z.string().min(1).max(200),
  contentType: z.string().min(3).max(100),
  bytes: z.instanceof(Uint8Array).refine((b) => b.length > 0 && b.length <= MAX_UPLOAD_BYTES, {
    message: `File must be 1 byte to 10 MB.`,
  }),
});

export const uploadPortfolioImageFn = createServerFn({ method: "POST" })
  .validator((body: unknown) => UploadSchema.safeParse(body))
  .handler(async (args) => {
    debugAuth("uploadPortfolioImageFn", args);
    const authed = await isAdminFromCtx(args);
    if (!authed) return await unauth("uploadPortfolioImageFn", args);
    const parse = (args?.data ?? undefined) as ReturnType<typeof UploadSchema.safeParse> | undefined;
    if (!parse || !parse.success) {
      return { ok: false as const, code: "VALIDATION" as const, message: "Bad file upload request." };
    }
    if (!ACCEPTED.includes(parse.data.contentType)) {
      return { ok: false as const, code: "VALIDATION" as const, message: "Unsupported image type (JPG, PNG, WebP, GIF, AVIF only.)" };
    }
    const res = await uploadPortfolioImage(parse.data);
    if ("error" in res) return { ok: false as const, code: "SERVER" as const, message: res.error };
    return { ok: true as const, url: res.url, path: res.path };
  });

// ---------------- Albums CRUD (Admin) ----------------

const AlbumSchema = z.object({
  category: z.string().trim().min(2).max(60),
  title: z.string().trim().min(2).max(160),
  location: z.string().trim().min(2).max(200),
  cover_image_url: z.string().trim().max(1000).default(""),
  description: z.string().trim().max(5000).default(""),
  sort_order: z.number().int().min(0).optional(),
});

const AlbumIdSchema = z.object({ album_id: z.string().min(1).max(64) });
const IdSchema = z.object({ id: z.string().min(1).max(64) });
const ReorderAlbumsSchema = z.object({ ids: z.array(z.string().min(1)).max(500) });
const ReorderPhotosSchema = z.object({ ids: z.array(z.string().min(1)).max(2000) });

export const listAlbumsAdmin = createServerFn({ method: "GET" }).handler(async (args) => {
  debugAuth("listAlbumsAdmin", args);
  const authed = await isAdminFromCtx(args);
  if (!authed) return await unauth("listAlbumsAdmin", args);
  const result = await listAlbums();
  if ("error" in result) return { ok: false as const, code: "SERVER" as const, message: result.error };
  return { ok: true as const, albums: result.albums as Album[] };
});

export const listPhotosForAlbum = createServerFn({ method: "POST" })
  .validator((body: unknown) => AlbumIdSchema.safeParse(body))
  .handler(async (args) => {
    debugAuth("listPhotosForAlbum", args);
    const authed = await isAdminFromCtx(args);
    if (!authed) return await unauth("listPhotosForAlbum", args);
    const parse = (args?.data ?? undefined) as ReturnType<typeof AlbumIdSchema.safeParse> | undefined;
    if (!parse || !parse.success) return { ok: false as const, code: "VALIDATION" as const, message: "Missing album id." };
    const r = await listAlbumPhotos(parse.data.album_id);
    if ("error" in r) return { ok: false as const, code: "SERVER" as const, message: r.error };
    return { ok: true as const, photos: r.photos as AlbumPhoto[] };
  });

export const createAlbum = createServerFn({ method: "POST" })
  .validator((body: unknown) => AlbumSchema.safeParse(body))
  .handler(async (args) => {
    debugAuth("createAlbum", args);
    const authed = await isAdminFromCtx(args);
    if (!authed) return await unauth("createAlbum", args);
    const parse = (args?.data ?? undefined) as ReturnType<typeof AlbumSchema.safeParse> | undefined;
    if (!parse || !parse.success) return { ok: false as const, code: "VALIDATION" as const, message: "Invalid inputs." };
    const existing = await listAlbums();
    const nextSort =
      "albums" in existing && existing.albums.length
        ? Math.max(...existing.albums.map((i) => i.sort_order ?? 0)) + 1
        : 0;
    const payload = parse.data;
    const res = await insertAlbum({
      category: payload.category,
      title: payload.title,
      location: payload.location,
      cover_image_url: payload.cover_image_url,
      description: payload.description,
      sort_order: typeof payload.sort_order === "number" ? payload.sort_order : nextSort,
    });
    if ("error" in res) return { ok: false as const, code: "SERVER" as const, message: res.error };
    return { ok: true as const, id: res.id };
  });

const AlbumPatchSchema = AlbumSchema.partial().extend({ id: z.string().min(1).max(64) });

export const updateAlbumAdmin = createServerFn({ method: "POST" })
  .validator((body: unknown) => AlbumPatchSchema.safeParse(body))
  .handler(async (args) => {
    debugAuth("updateAlbumAdmin", args);
    const authed = await isAdminFromCtx(args);
    if (!authed) return await unauth("updateAlbumAdmin", args);
    const parse = (args?.data ?? undefined) as ReturnType<typeof AlbumPatchSchema.safeParse> | undefined;
    if (!parse || !parse.success) return { ok: false as const, code: "VALIDATION" as const, message: "Invalid inputs." };
    const { id, ...rest } = parse.data;
    const patch: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(rest)) if (v !== undefined) patch[k] = v;
    const res = await updateAlbum(id, patch as unknown as Parameters<typeof updateAlbum>[1]);
    if ("error" in res) return { ok: false as const, code: "SERVER" as const, message: res.error };
    return { ok: true as const };
  });

export const reorderAlbumsAdmin = createServerFn({ method: "POST" })
  .validator((body: unknown) => ReorderAlbumsSchema.safeParse(body))
  .handler(async (args) => {
    debugAuth("reorderAlbumsAdmin", args);
    const authed = await isAdminFromCtx(args);
    if (!authed) return await unauth("reorderAlbumsAdmin", args);
    const parse = (args?.data ?? undefined) as ReturnType<typeof ReorderAlbumsSchema.safeParse> | undefined;
    if (!parse || !parse.success) return { ok: false as const, code: "VALIDATION" as const, message: "Invalid payload." };
    const res = await reorderAlbums(parse.data.ids);
    if ("error" in res) return { ok: false as const, code: "SERVER" as const, message: res.error };
    return { ok: true as const };
  });

export const deleteAlbumAdmin = createServerFn({ method: "POST" })
  .validator((body: unknown) => IdSchema.safeParse(body))
  .handler(async (args) => {
    debugAuth("deleteAlbumAdmin", args);
    const authed = await isAdminFromCtx(args);
    if (!authed) return await unauth("deleteAlbumAdmin", args);
    const parse = (args?.data ?? undefined) as ReturnType<typeof IdSchema.safeParse> | undefined;
    if (!parse || !parse.success) return { ok: false as const, code: "VALIDATION" as const, message: "Invalid payload." };
    const id = parse.data.id;
    const photosRes = await listAlbumPhotos(id);
    if ("photos" in photosRes) {
      for (const p of photosRes.photos) {
        const path = extractStoragePath(p.image_url);
        if (path) await deleteStorageObject(path);
      }
    }
    const albumRes = await getAlbum(id);
    if ("album" in albumRes && albumRes.album.cover_image_url) {
      const coverPath = extractStoragePath(albumRes.album.cover_image_url);
      if (coverPath) await deleteStorageObject(coverPath);
    }
    const res = await deleteAlbum(id);
    if ("error" in res) return { ok: false as const, code: "SERVER" as const, message: res.error };
    return { ok: true as const };
  });

// ---------------- Album Photos CRUD (Admin) ----------------

const AlbumPhotoSchema = z.object({
  album_id: z.string().min(1).max(64),
  image_url: z.string().trim().min(1).max(1000),
  alt: z.string().trim().max(500).default(""),
  caption: z.string().trim().max(1000).default(""),
  sort_order: z.number().int().min(0).optional(),
});

export const addAlbumPhoto = createServerFn({ method: "POST" })
  .validator((body: unknown) => AlbumPhotoSchema.safeParse(body))
  .handler(async (args) => {
    debugAuth("addAlbumPhoto", args);
    const authed = await isAdminFromCtx(args);
    if (!authed) return await unauth("addAlbumPhoto", args);
    const parse = (args?.data ?? undefined) as ReturnType<typeof AlbumPhotoSchema.safeParse> | undefined;
    if (!parse || !parse.success) return { ok: false as const, code: "VALIDATION" as const, message: "Invalid inputs." };
    const payload = parse.data;
    const existing = await listAlbumPhotos(payload.album_id);
    const nextSort =
      "photos" in existing && existing.photos.length
        ? Math.max(...existing.photos.map((i) => i.sort_order ?? 0)) + 1
        : 0;
    const res = await insertAlbumPhoto({
      album_id: payload.album_id,
      image_url: payload.image_url,
      alt: payload.alt,
      caption: payload.caption,
      sort_order: typeof payload.sort_order === "number" ? payload.sort_order : nextSort,
    });
    if ("error" in res) return { ok: false as const, code: "SERVER" as const, message: res.error };
    return { ok: true as const, id: res.id };
  });

const PhotoPatchSchema = AlbumPhotoSchema.partial()
  .extend({ id: z.string().min(1).max(64) })
  .omit({ album_id: true });

export const updateAlbumPhotoAdmin = createServerFn({ method: "POST" })
  .validator((body: unknown) => PhotoPatchSchema.safeParse(body))
  .handler(async (args) => {
    debugAuth("updateAlbumPhotoAdmin", args);
    const authed = await isAdminFromCtx(args);
    if (!authed) return await unauth("updateAlbumPhotoAdmin", args);
    const parse = (args?.data ?? undefined) as ReturnType<typeof PhotoPatchSchema.safeParse> | undefined;
    if (!parse || !parse.success) return { ok: false as const, code: "VALIDATION" as const, message: "Invalid inputs." };
    const { id, ...rest } = parse.data;
    const patch: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(rest)) if (v !== undefined) patch[k] = v;
    const res = await updateAlbumPhoto(id, patch as unknown as Parameters<typeof updateAlbumPhoto>[1]);
    if ("error" in res) return { ok: false as const, code: "SERVER" as const, message: res.error };
    return { ok: true as const };
  });

export const reorderAlbumPhotosAdmin = createServerFn({ method: "POST" })
  .validator((body: unknown) => ReorderPhotosSchema.safeParse(body))
  .handler(async (args) => {
    debugAuth("reorderAlbumPhotosAdmin", args);
    const authed = await isAdminFromCtx(args);
    if (!authed) return await unauth("reorderAlbumPhotosAdmin", args);
    const parse = (args?.data ?? undefined) as ReturnType<typeof ReorderPhotosSchema.safeParse> | undefined;
    if (!parse || !parse.success) return { ok: false as const, code: "VALIDATION" as const, message: "Invalid payload." };
    const res = await reorderAlbumPhotos(parse.data.ids);
    if ("error" in res) return { ok: false as const, code: "SERVER" as const, message: res.error };
    return { ok: true as const };
  });

export const deleteAlbumPhotoAdmin = createServerFn({ method: "POST" })
  .validator((body: unknown) => IdSchema.safeParse(body))
  .handler(async (args) => {
    debugAuth("deleteAlbumPhotoAdmin", args);
    const authed = await isAdminFromCtx(args);
    if (!authed) return await unauth("deleteAlbumPhotoAdmin", args);
    const parse = (args?.data ?? undefined) as ReturnType<typeof IdSchema.safeParse> | undefined;
    if (!parse || !parse.success) return { ok: false as const, code: "VALIDATION" as const, message: "Invalid payload." };
    const id = parse.data.id;
    const anyClient = getSupabaseServerClient();
    if (anyClient) {
      const c = anyClient as unknown as {
        from(t: string): {
          select(c: string): {
            eq(k: string, v: unknown): Promise<{
              data: { image_url: string }[] | null;
              error: unknown;
            }>;
          };
        };
      };
      try {
        const { data } = await c
          .from("album_photos")
          .select("image_url")
          .eq("id", id);
        if (Array.isArray(data) && data[0]) {
          const path = extractStoragePath(data[0].image_url);
          if (path) await deleteStorageObject(path);
        }
      } catch {
        /* ignore */
      }
    }
    const res = await deleteAlbumPhoto(id);
    if ("error" in res) return { ok: false as const, code: "SERVER" as const, message: res.error };
    return { ok: true as const };
  });

// ---------------- Enquiries CRUD (Admin) ----------------

const STANDARD_ENQUIRY_STATUSES = ["new", "contacted", "archived"] as const;

const ListEnquiriesSchema = z.object({
  status: z.string().trim().min(1).max(40).optional(),
  service: z.string().trim().min(1).max(120).optional(),
});

const UpdateEnquiryStatusSchema = z.object({
  id: z.string().min(1).max(64),
  status: z.enum(STANDARD_ENQUIRY_STATUSES).or(z.string().trim().min(1).max(40)),
});

export const listEnquiriesAdmin = createServerFn({ method: "POST" })
  .validator((body: unknown) => ListEnquiriesSchema.safeParse(body))
  .handler(async (args) => {
    debugAuth("listEnquiriesAdmin", args);
    const authed = await isAdminFromCtx(args);
    if (!authed) return await unauth("listEnquiriesAdmin", args);
    const parse = (args?.data ?? undefined) as ReturnType<typeof ListEnquiriesSchema.safeParse> | undefined;
    if (!parse || !parse.success) return { ok: false as const, code: "VALIDATION" as const, message: "Invalid filter payload." };
    const filters: { status?: string; service?: string } = {};
    if (parse.data.status && parse.data.status.length > 0) filters.status = parse.data.status;
    if (parse.data.service && parse.data.service.length > 0) filters.service = parse.data.service;
    const result = await listContactInquiries(filters);
    if ("error" in result) return { ok: false as const, code: "SERVER" as const, message: result.error };
    return { ok: true as const, inquiries: result.inquiries as ContactInquiry[] };
  });

export const updateEnquiryStatusAdmin = createServerFn({ method: "POST" })
  .validator((body: unknown) => UpdateEnquiryStatusSchema.safeParse(body))
  .handler(async (args) => {
    debugAuth("updateEnquiryStatusAdmin", args);
    const authed = await isAdminFromCtx(args);
    if (!authed) return await unauth("updateEnquiryStatusAdmin", args);
    const parse = (args?.data ?? undefined) as ReturnType<typeof UpdateEnquiryStatusSchema.safeParse> | undefined;
    if (!parse || !parse.success) return { ok: false as const, code: "VALIDATION" as const, message: "Invalid enquiry status payload." };
    const res = await updateContactInquiryStatus(parse.data.id, parse.data.status);
    if ("error" in res) return { ok: false as const, code: "SERVER" as const, message: res.error };
    return { ok: true as const };
  });

