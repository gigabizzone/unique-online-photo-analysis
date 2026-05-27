"use client";

// Minimal /settings page — just the SMTP test button for Phase 8.
// Phase 12 expands this into the full Settings page (edit slogans,
// change password, etc.) per PRD §10.3.

import { useState } from "react";
import { Mail, Loader2, CheckCircle2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

type TestState =
  | { status: "idle" }
  | { status: "sending" }
  | { status: "sent"; to: string }
  | { status: "error"; message: string };

export default function SettingsPage() {
  const [test, setTest] = useState<TestState>({ status: "idle" });

  async function handleSendTest() {
    setTest({ status: "sending" });
    try {
      const res = await fetch("/api/settings/test-email", { method: "POST" });
      const body = await res.json();
      if (!res.ok) {
        setTest({
          status: "error",
          message: body.error ?? `HTTP ${res.status}`,
        });
        return;
      }
      setTest({ status: "sent", to: body.to });
    } catch (e) {
      setTest({
        status: "error",
        message: e instanceof Error ? e.message : "Network error",
      });
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 space-y-8">
      <header>
        <h1 className="text-2xl sm:text-3xl font-semibold text-white">
          Settings
        </h1>
        <p className="mt-1 text-sm text-white/60">
          Edit branding, change password, and verify integrations. (Full
          settings UI arrives in Phase 12.)
        </p>
      </header>

      {/* SMTP test card */}
      <section className="rounded-xl bg-white text-foreground p-5 sm:p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <Mail className="h-5 w-5 text-aps-gold shrink-0 mt-0.5" />
          <div className="flex-1">
            <h2 className="text-base font-semibold">SMTP — Email delivery</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Hostinger SMTP is configured via the SMTP_* env vars. Click below
              to send a test message to the admin inbox.
            </p>
          </div>
        </div>

        <div className="mt-4">
          <Button
            onClick={handleSendTest}
            disabled={test.status === "sending"}
            variant="gold"
          >
            {test.status === "sending" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Sending…
              </>
            ) : (
              "Send test email"
            )}
          </Button>
        </div>

        {test.status === "sent" && (
          <div
            role="status"
            className="mt-4 rounded-md border border-emerald-400/40 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 flex items-start gap-2"
          >
            <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              Test email sent to <strong>{test.to}</strong>. Check the inbox
              (and spam folder).
            </div>
          </div>
        )}

        {test.status === "error" && (
          <div
            role="alert"
            className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive flex items-start gap-2"
          >
            <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              <div className="font-medium">Send failed</div>
              <div className="mt-0.5 break-all">{test.message}</div>
            </div>
          </div>
        )}
      </section>

      <p className="text-xs text-white/40 text-center">
        Phase 12 will add: edit slogans + tagline, change password, manage
        admin accounts.
      </p>
    </main>
  );
}
