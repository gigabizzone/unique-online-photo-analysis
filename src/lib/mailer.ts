// Nodemailer over Hostinger SMTP. PRD §9.6.
//
// Two functions:
//   - sendTestEmail(toEmail) — for the /settings page test button
//   - sendReportEmail(entryId) — for the chakra-report Send Email button
//
// Both reuse a singleton transporter that auths against Hostinger SMTP
// using env vars (SMTP_HOST/PORT/USER/PASS). For local dev we use the
// values in .env.local; on Hostinger production they live in the hPanel
// Node.js environment-variables panel.

import nodemailer, { type Transporter } from "nodemailer";

import { prisma } from "@/lib/db";
import { downloadReportPdf } from "@/lib/supabase-storage";
import { SOCIAL_LINKS } from "@/constants/branding";
import { getBranding } from "@/lib/branding";

let _transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (_transporter) return _transporter;
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? "465");
  const secure = (process.env.SMTP_SECURE ?? "true") === "true";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  // TEMPORARY diagnostic (safe — logs NO secret, only the password LENGTH) to
  // trace the live "535 auth failed": shows what the running server actually
  // loaded. Expect passLen=13 for the correct password. Remove after fixing.
  console.log(
    `[smtp-diag] host=${host ?? "MISSING"} port=${port} secure=${secure} user=${user ?? "MISSING"} passLen=${(pass ?? "").length}`
  );
  if (!host || !user || !pass) {
    throw new Error(
      "SMTP credentials are not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env.local (or Hostinger env panel in prod)."
    );
  }
  _transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
  return _transporter;
}

const FROM =
  process.env.EMAIL_FROM ||
  `Aura Photo Science <${process.env.SMTP_USER ?? "info@auraphotoscience.com"}>`;

// ADMIN_EMAIL is the BUSINESS inbox that receives admin acknowledgement
// emails (and where customer replies / bounces land). It is NOT the same
// as the admin LOGIN email — that one (mike2548@gmail.com) is just used
// by NextAuth credentials. Default to the SMTP_USER mailbox so admin
// notifications land alongside the rest of the business mail.
const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL ??
  process.env.SMTP_USER ??
  "info@auraphotoscience.com";

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

// ───────────────────────────────────────────────────────────
// Test email — used by /settings "Send test email" button
// ───────────────────────────────────────────────────────────
export async function sendTestEmail(toEmail?: string): Promise<void> {
  const transporter = getTransporter();
  const to = toEmail ?? ADMIN_EMAIL;
  const branding = await getBranding();
  await transporter.sendMail({
    from: FROM,
    to,
    subject: `[Test] ${branding.brand} SMTP check`,
    text:
      `If you can read this, Hostinger SMTP is wired up correctly.\n\n` +
      `Sent at ${new Date().toISOString()} from ${APP_URL}.`,
    html:
      `<div style="font-family:Helvetica,Arial,sans-serif;font-size:14px;color:#1F1B2E;">
        <p>If you can read this, Hostinger SMTP is wired up correctly.</p>
        <p style="color:#6B6680;">Sent at ${new Date().toISOString()} from ${APP_URL}.</p>
       </div>`,
  });
}

// ───────────────────────────────────────────────────────────
// Report email — used after Generate Report on a chakra entry
// PRD §9.6: customer email + admin ack, both with PDF attached
// ───────────────────────────────────────────────────────────
function brandedHtml(opts: {
  greeting: string;
  bodyHtml: string;
  reportId: string;
  publicReportUrl: string;
  appName: string;
  sloganEn: string;
  tagline: string;
  legalDisclaimer: string;
}): string {
  const socialBlock = SOCIAL_LINKS.map(
    (s) =>
      `<a href="${s.url}" style="color:#D4A24C;text-decoration:none;margin:0 6px;">${s.handle}</a>`
  ).join("·");
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:linear-gradient(180deg,#0B0420,#1A0B3D);font-family:Helvetica,Arial,sans-serif;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;">
          <tr><td style="padding:32px 32px 16px 32px;text-align:center;">
            <div style="font-size:22px;font-weight:700;color:#1F1B2E;letter-spacing:0.4px;">${opts.appName}</div>
            <div style="font-size:12px;color:#6B6680;font-style:italic;margin-top:4px;">${opts.sloganEn}</div>
            <div style="font-size:11px;color:#D4A24C;font-weight:700;letter-spacing:1px;margin-top:14px;">${opts.tagline}</div>
          </td></tr>
          <tr><td style="padding:0 32px;">
            <p style="font-size:14px;color:#1F1B2E;line-height:1.5;">${opts.greeting}</p>
            ${opts.bodyHtml}
            <p style="font-size:13px;color:#1F1B2E;margin-top:24px;">
              View this report anytime here:<br>
              <a href="${opts.publicReportUrl}" style="color:#8E44AD;word-break:break-all;">${opts.publicReportUrl}</a>
            </p>
            <p style="font-size:12px;color:#6B6680;margin-top:24px;">
              Report ID: <code style="background:#F8F7FB;padding:2px 6px;border-radius:3px;">${opts.reportId}</code>
            </p>
          </td></tr>
          <tr><td style="padding:24px 32px 32px 32px;border-top:1px solid #E5E1EC;text-align:center;">
            <div style="font-size:10px;color:#6B6680;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Connect with us</div>
            <div style="font-size:12px;">${socialBlock}</div>
            <div style="font-size:10px;color:#6B6680;margin-top:16px;font-style:italic;">${opts.legalDisclaimer}</div>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

const ANALYSIS_TYPE_LABEL: Record<string, string> = {
  CHAKRA: "7 Chakra Analysis",
  PLANETS: "9 Planets Analysis",
  ELEMENTS: "Elements Analysis",
  LIFE_CHALLENGES: "Life Challenges Analysis",
  OVERALL: "Free Basic Aura Check",
  WEARABLES: "Wearable Items Analysis",
};

export interface SendReportResult {
  customerSentTo: string;
  adminSentTo: string;
}

export async function sendReportEmail(
  entryId: string
): Promise<SendReportResult> {
  const transporter = getTransporter();

  const entry = await prisma.analysisEntry.findUnique({
    where: { id: entryId },
    include: { customer: true },
  });
  if (!entry) {
    throw new Error(`No AnalysisEntry with id ${entryId}`);
  }
  if (!entry.pdfStorageUrl) {
    throw new Error(
      `Entry ${entry.publicId} has no PDF yet. Generate one first via POST /api/report/generate.`
    );
  }

  const pdfBuffer = await downloadReportPdf(entry.publicId);
  if (!pdfBuffer) {
    throw new Error(
      `PDF for ${entry.publicId} was not found in Storage (was the bucket cleared?).`
    );
  }

  const typeLabel = ANALYSIS_TYPE_LABEL[entry.analysisType] ?? entry.analysisType;
  const customerFullName = `${entry.customer.firstName} ${entry.customer.lastName}`;
  const publicReportUrl = `${APP_URL.replace(/\/$/, "")}/report/${entry.publicId}`;
  const filenameLastName = entry.customer.lastName.replace(/[^A-Za-z0-9_-]/g, "");
  const ymd = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const filename = `APS_${entry.publicId}_${filenameLastName}_${ymd}.pdf`;
  const branding = await getBranding();

  // ── 1. Customer-facing email
  const customerHtml = brandedHtml({
    greeting: `Namaste ${entry.customer.firstName},`,
    bodyHtml: `<p style="font-size:14px;color:#1F1B2E;line-height:1.5;">
      Your <strong>${typeLabel}</strong> from ${branding.brand} is ready.
      The PDF is attached to this email.
    </p>`,
    reportId: entry.publicId,
    publicReportUrl,
    appName: branding.appName,
    sloganEn: branding.sloganEn,
    tagline: branding.tagline,
    legalDisclaimer: branding.legalDisclaimer,
  });

  await transporter.sendMail({
    from: FROM,
    to: entry.customer.email,
    subject: `Your ${typeLabel} Report — ${branding.brand}`,
    html: customerHtml,
    attachments: [
      {
        filename,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });

  // ── 2. Admin acknowledgement
  await transporter.sendMail({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `Report Sent: ${customerFullName} — ${typeLabel}`,
    text:
      `Report ${entry.publicId} (${typeLabel}) was sent.\n\n` +
      `Customer: ${customerFullName}\n` +
      `Email:    ${entry.customer.email}\n` +
      `WhatsApp: ${entry.customer.whatsapp}\n` +
      `Sent:     ${new Date().toISOString()}\n\n` +
      `Public link: ${publicReportUrl}\n`,
    attachments: [
      {
        filename,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });

  // ── 3. Stamp timestamps
  await prisma.analysisEntry.update({
    where: { id: entry.id },
    data: {
      emailSentAt: new Date(),
      adminAckSentAt: new Date(),
    },
  });

  return {
    customerSentTo: entry.customer.email,
    adminSentTo: ADMIN_EMAIL,
  };
}
