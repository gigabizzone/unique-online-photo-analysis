// One-off cleanup: delete the smoke-test customer + their analysis entries.
// These were created by Claude's automated tests during Phases 6-8 with the
// fake email phase7.pdftest@example.com, which is RFC-reserved and gets
// rejected by every real mail server (Hostinger / MailChannels included).
//
// Safe to re-run: idempotent. Only touches rows tied to phase7.pdftest@example.com.

import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const p = new PrismaClient();
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

// Any customer whose email ends in @example.com is one of Claude's fakes.
// (example.com is RFC-reserved and rejected by real mail servers.)
const fakeCustomers = await p.customer.findMany({
  where: { email: { endsWith: "@example.com" } },
});

if (fakeCustomers.length === 0) {
  console.log("No @example.com customers found — already clean.");
  await p.$disconnect();
  process.exit(0);
}

const fakeCustomerIds = fakeCustomers.map((c) => c.id);

const entries = await p.analysisEntry.findMany({
  where: { customerId: { in: fakeCustomerIds } },
  select: { publicId: true, pdfStorageUrl: true },
});

console.log(`Smoke-test customers to delete (${fakeCustomers.length}):`);
for (const c of fakeCustomers) {
  console.log(`  - ${c.firstName} ${c.lastName} <${c.email}>`);
}
console.log(`Linked analysis entries (${entries.length}):`);
for (const e of entries) {
  console.log(`  - ${e.publicId}${e.pdfStorageUrl ? " (has PDF in Storage)" : ""}`);
}

const deletedEntries = await p.analysisEntry.deleteMany({
  where: { customerId: { in: fakeCustomerIds } },
});
const deletedCustomers = await p.customer.deleteMany({
  where: { id: { in: fakeCustomerIds } },
});

console.log("");
console.log(`✓ Deleted ${deletedEntries.count} analysis entries`);
console.log(`✓ Deleted ${deletedCustomers.count} customers`);

// Also purge the Storage objects so they don't sit around orphaned.
const pdfPaths = entries
  .filter((e) => e.pdfStorageUrl)
  .map((e) => `${e.publicId}.pdf`);
if (pdfPaths.length > 0) {
  const { error } = await supabase.storage.from("reports").remove(pdfPaths);
  if (error) {
    console.log("");
    console.log("⚠ Storage cleanup failed:", error.message);
    console.log("  Delete manually: Supabase Dashboard → Storage → reports bucket →");
    for (const path of pdfPaths) console.log(`    - ${path}`);
  } else {
    console.log(`✓ Deleted ${pdfPaths.length} PDF(s) from Storage`);
  }
}

await p.$disconnect();
