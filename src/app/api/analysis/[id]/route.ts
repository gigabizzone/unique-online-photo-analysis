// DELETE /api/analysis/[id]
//
// Hard-deletes an AnalysisEntry row + its Supabase Storage PDF (if any).
// Used by the History page "Delete" row action. Customer rows are NOT
// touched — they may have other entries.

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const entry = await prisma.analysisEntry.findUnique({
    where: { id: params.id },
    select: { id: true, publicId: true, pdfStorageUrl: true },
  });
  if (!entry) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  // Delete the row first; if Storage cleanup fails we'll have an orphan
  // PDF, which the existing scripts/cleanup-orphan-storage.mjs handles.
  await prisma.analysisEntry.delete({ where: { id: entry.id } });

  // Best-effort Storage cleanup.
  if (entry.pdfStorageUrl) {
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const secret = process.env.SUPABASE_SECRET_KEY;
      if (url && secret) {
        const supabase = createClient(url, secret, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        await supabase.storage
          .from("reports")
          .remove([`${entry.publicId}.pdf`]);
      }
    } catch (err) {
      // Non-fatal — DB row is gone.
      console.error("Storage cleanup after delete failed:", err);
    }
  }

  return NextResponse.json({ deleted: entry.publicId });
}
