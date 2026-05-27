// POST /api/report/send-email
// Body: { entryId: string }
//
// Sends both the customer-facing branded email and the admin
// acknowledgement (PRD §9.6). Both include the PDF attachment.

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { sendReportEmail } from "@/lib/mailer";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { entryId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body.entryId) {
    return NextResponse.json({ error: "entryId is required" }, { status: 400 });
  }

  try {
    const result = await sendReportEmail(body.entryId);
    return NextResponse.json({
      sent: true,
      customer: result.customerSentTo,
      admin: result.adminSentTo,
    });
  } catch (err) {
    console.error("send-email failed for entry", body.entryId, err);
    const msg = err instanceof Error ? err.message : "Email send failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
