import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url) { console.error("FAIL: VITE_SUPABASE_URL not set"); process.exit(1); }
if (!anonKey) { console.error("FAIL: VITE_SUPABASE_ANON_KEY not set"); process.exit(1); }
if (!serviceKey) { console.error("FAIL: SUPABASE_SERVICE_ROLE_KEY not set"); process.exit(1); }

console.log("URL:      ", url);
console.log("Anon key: ", anonKey.slice(0, 12) + "..." + anonKey.slice(-8) + "  (" + anonKey.length + " chars)");
console.log("Svc key:  ", serviceKey.slice(0, 12) + "..." + serviceKey.slice(-8) + "  (" + serviceKey.length + " chars)");
console.log("");

async function test(label, key) {
  try {
    const client = createClient(url, key, { auth: { persistSession: false } });
    const { error } = await client.from("_health_probe").select("*").limit(1).maybeSingle();
    if (error && error.code === "42P01") {
      console.log("✅ [" + label + "] Connected  (relation-not-exists is expected — means key is valid)");
      return;
    }
    if (error && error.code) {
      console.log("⚠️  [" + label + "] PostgREST code " + error.code + ": " + error.message);
      return;
    }
    if (error) {
      console.log("❌ [" + label + "] " + error.message);
      return;
    }
    console.log("✅ [" + label + "] Connected  (query ok)");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log("❌ [" + label + "] Network/SDK error: " + msg);
  }
}

await test("ANON", anonKey);
await test("SERVICE_ROLE", serviceKey);

console.log("");
console.log("Done. If both keys show ✅ Connected, your credentials are valid.");
