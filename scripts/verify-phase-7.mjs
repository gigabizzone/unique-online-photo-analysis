// Inspect AnalysisEntry rows + verify the reports bucket has files

import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const p = new PrismaClient();

console.log("=== AnalysisEntry rows with PDF URLs ===");
const entries = await p.analysisEntry.findMany({
  orderBy: { createdAt: "asc" },
  select: {
    publicId: true,
    analysisType: true,
    pdfStorageUrl: true,
    qrCodeUrl: true,
    emailSentAt: true,
    whatsappOpenedAt: true,
    pdfDownloadedAt: true,
  },
});
for (const e of entries) {
  console.log({
    publicId: e.publicId,
    pdf: e.pdfStorageUrl ? "✓ uploaded" : "(none)",
    qrUrl: e.qrCodeUrl ?? "(none)",
    downloadedAt: e.pdfDownloadedAt?.toISOString() ?? "(never)",
  });
}

console.log("\n=== Supabase Storage 'reports' bucket contents ===");
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);
const { data: files, error } = await supabase.storage.from("reports").list();
if (error) {
  console.log("ERROR:", error.message);
} else {
  for (const f of files) {
    console.log(`  ${f.name}  (${f.metadata?.size ?? "?"} bytes)`);
  }
}

await p.$disconnect();
