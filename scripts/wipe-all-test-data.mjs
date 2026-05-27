// DESTRUCTIVE: wipes all customer + analysis-entry data + their PDFs in
// Supabase Storage. Used once before handover to clear Kiran's smoke-test
// data so Mukesh starts on a clean slate.
//
// What it deletes:
//   - Every row in AnalysisEntry
//   - Every row in Customer
//   - Every Counter row (so the next publicId starts at APS-{YYYY}-{TYPE}-00001)
//   - Every PDF in the Supabase Storage 'reports' bucket
//
// What it preserves:
//   - Admin (your login stays)
//   - Settings (your branding stays)
//
// Safety: defaults to DRY RUN. Pass --yes to actually delete.
//
//   Dry run (preview):  npx dotenv -e .env.local -- node scripts/wipe-all-test-data.mjs
//   Real wipe:          npx dotenv -e .env.local -- node scripts/wipe-all-test-data.mjs --yes
//
// IMPORTANT: this connects to whatever DATABASE_URL points at. In this
// project the local .env.local IS the production Supabase, so running
// this from your laptop will wipe live data. Make sure that's what you want.

import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const CONFIRM_FLAG = "--yes";
const dryRun = !process.argv.includes(CONFIRM_FLAG);

const p = new PrismaClient();
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

console.log("");
console.log("─".repeat(60));
console.log(dryRun ? "  DRY RUN — nothing will be deleted" : "  REAL WIPE — data will be deleted");
console.log("─".repeat(60));
console.log("");

const customers = await p.customer.findMany({
  select: { id: true, firstName: true, lastName: true, email: true },
});
const entries = await p.analysisEntry.findMany({
  select: { publicId: true, analysisType: true, pdfStorageUrl: true },
});
const counters = await p.counter.findMany({
  select: { key: true, value: true },
});

const { data: files, error: listErr } = await supabase.storage.from("reports").list();
if (listErr) {
  console.error("Failed to list Storage bucket:", listErr.message);
  await p.$disconnect();
  process.exit(1);
}
const pdfFiles = (files ?? []).filter((f) => f.name.endsWith(".pdf"));

console.log(`Customers:        ${customers.length}`);
for (const c of customers) {
  console.log(`  - ${c.firstName} ${c.lastName} <${c.email}>`);
}
console.log("");
console.log(`Analysis entries: ${entries.length}`);
for (const e of entries) {
  console.log(`  - ${e.publicId} (${e.analysisType})${e.pdfStorageUrl ? " [has PDF]" : ""}`);
}
console.log("");
console.log(`Counter rows:     ${counters.length}`);
for (const c of counters) {
  console.log(`  - ${c.key} = ${c.value}`);
}
console.log("");
console.log(`PDFs in Storage:  ${pdfFiles.length}`);
for (const f of pdfFiles) {
  console.log(`  - ${f.name}`);
}
console.log("");

if (customers.length + entries.length + counters.length + pdfFiles.length === 0) {
  console.log("Database + Storage already empty. Nothing to do.");
  await p.$disconnect();
  process.exit(0);
}

if (dryRun) {
  console.log("─".repeat(60));
  console.log("  This was a DRY RUN. No changes were made.");
  console.log("  To actually delete the above, re-run with --yes:");
  console.log("    npx dotenv -e .env.local -- node scripts/wipe-all-test-data.mjs --yes");
  console.log("─".repeat(60));
  await p.$disconnect();
  process.exit(0);
}

// Real wipe path below ─────────────────────────────────────────────────

console.log("Deleting…");

// Order matters: entries reference customers via foreign key.
const delEntries = await p.analysisEntry.deleteMany({});
console.log(`  ✓ AnalysisEntry: ${delEntries.count} row(s) deleted`);

const delCustomers = await p.customer.deleteMany({});
console.log(`  ✓ Customer:      ${delCustomers.count} row(s) deleted`);

const delCounters = await p.counter.deleteMany({});
console.log(`  ✓ Counter:       ${delCounters.count} row(s) deleted (next entry will be …-00001)`);

if (pdfFiles.length > 0) {
  const names = pdfFiles.map((f) => f.name);
  const { error: rmErr } = await supabase.storage.from("reports").remove(names);
  if (rmErr) {
    console.log(`  ⚠ Storage:       failed — ${rmErr.message}`);
    console.log("    Delete manually: Supabase Dashboard → Storage → reports bucket");
  } else {
    console.log(`  ✓ Storage:       ${names.length} PDF(s) deleted`);
  }
}

console.log("");
console.log("Done. Admin login + Settings (branding) are untouched.");
await p.$disconnect();
