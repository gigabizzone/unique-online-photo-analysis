// Delete Supabase Storage objects in the 'reports' bucket that no longer
// have a matching AnalysisEntry row in the database. Safe to re-run.

import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const p = new PrismaClient();
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

const { data: files, error } = await supabase.storage.from("reports").list();
if (error) {
  console.error("Failed to list bucket:", error.message);
  process.exit(1);
}

const entries = await p.analysisEntry.findMany({
  select: { publicId: true },
});
const validNames = new Set(entries.map((e) => `${e.publicId}.pdf`));

const orphans = (files ?? [])
  .filter((f) => f.name.endsWith(".pdf") && !validNames.has(f.name))
  .map((f) => f.name);

console.log(`Total files in 'reports' bucket: ${files?.length ?? 0}`);
console.log(`Orphans (no DB row):             ${orphans.length}`);

if (orphans.length === 0) {
  console.log("Nothing to delete.");
} else {
  for (const name of orphans) console.log(`  - ${name}`);
  const { error: rmErr } = await supabase.storage.from("reports").remove(orphans);
  if (rmErr) {
    console.error("Delete failed:", rmErr.message);
    process.exit(2);
  }
  console.log(`✓ Removed ${orphans.length} orphan PDF(s) from Storage.`);
}

await p.$disconnect();
