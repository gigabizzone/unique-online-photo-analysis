// POST /api/settings/test-email
//
// Sends a plain transactional email to ADMIN_EMAIL so the admin can
// verify Hostinger SMTP works without going through the full report
// flow. Used by /settings "Send test email" button (Phase 8).

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { sendTestEmail } from "@/lib/mailer";

export const runtime = "nodejs";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await sendTestEmail();
    return NextResponse.json({
      sent: true,
      to: process.env.ADMIN_EMAIL ?? "mike2548@gmail.com",
    });
  } catch (err) {
    console.error("Test email failed:", err);
    const msg = err instanceof Error ? err.message : "Test email failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
