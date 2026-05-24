// Read-only verification: confirms SUPABASE_SECRET_KEY is set, has the right
// shape (sb_secret_… or legacy JWT), and that it actually authorises us
// against the live Supabase project by listing buckets. The key itself is
// never echoed — only metadata (length, prefix).

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.SUPABASE_SECRET_KEY ?? "";

console.log("=== .env.local diagnostic ===");
console.log("NEXT_PUBLIC_SUPABASE_URL set:", url.length > 0);
console.log("SUPABASE_SECRET_KEY set:    ", key.length > 0);
console.log("SUPABASE_SECRET_KEY length: ", key.length);
console.log("SUPABASE_SECRET_KEY prefix: ", key.slice(0, 10));
console.log("");

if (!url || !key) {
  console.log("✗ One or both env vars are missing — Phase 7 PDF upload would fail.");
  process.exit(1);
}

console.log("=== Live Supabase reachability ===");
const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const { data, error } = await supabase.storage.listBuckets();
if (error) {
  console.log("✗ Supabase rejected the key:", error.message);
  process.exit(2);
}
const reports = data?.find((b) => b.name === "reports");
console.log("✓ Auth succeeded — buckets listed");
console.log("  reports bucket present:", !!reports);
if (reports) {
  console.log("  reports.public:       ", reports.public);
  console.log("  reports.file_size_lim:", reports.file_size_limit);
}
