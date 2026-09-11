import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type TypedSupabaseClient = SupabaseClient | null;

let _client: TypedSupabaseClient | undefined;

export function getSupabaseBrowserClient(): TypedSupabaseClient {
  if (typeof window === "undefined") return null;
  if (_client !== undefined) return _client;

  const env = import.meta.env as Record<string, unknown>;
  const url = typeof env["VITE_SUPABASE_URL"] === "string" ? env["VITE_SUPABASE_URL"] : undefined;
  const anonKey = typeof env["VITE_SUPABASE_ANON_KEY"] === "string" ? env["VITE_SUPABASE_ANON_KEY"] : undefined;

  if (!url || !anonKey) {
    console.warn(
      "[supabase-client] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY missing. Client-side Supabase disabled.",
    );
    _client = null;
    return null;
  }

  _client = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return _client;
}
