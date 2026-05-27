"use client";

// /settings — PRD §10.3.
// Three cards: Branding (slogans + tagline), Change Password, SMTP test.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Loader2,
  CheckCircle2,
  XCircle,
  Lock,
  Type,
} from "lucide-react";

import { Button } from "@/components/ui/button";

type RequestState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "saving" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

interface Branding {
  sloganEn: string;
  sloganHi: string;
  tagline: string;
}

export default function SettingsPage() {
  // ── Branding form ──
  const [branding, setBranding] = useState<Branding>({
    sloganEn: "",
    sloganHi: "",
    tagline: "",
  });
  const [brandingState, setBrandingState] = useState<RequestState>({
    status: "loading",
  });

  const loadBranding = useCallback(async () => {
    setBrandingState({ status: "loading" });
    try {
      const res = await fetch("/api/settings/branding");
      if (!res.ok) {
        setBrandingState({
          status: "error",
          message: `Load failed (${res.status})`,
        });
        return;
      }
      const body = (await res.json()) as Branding;
      setBranding(body);
      setBrandingState({ status: "idle" });
    } catch (e) {
      setBrandingState({
        status: "error",
        message: e instanceof Error ? e.message : "Network error",
      });
    }
  }, []);

  useEffect(() => {
    loadBranding();
  }, [loadBranding]);

  async function saveBranding(e: React.FormEvent) {
    e.preventDefault();
    setBrandingState({ status: "saving" });
    try {
      const res = await fetch("/api/settings/branding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(branding),
      });
      const body = await res.json();
      if (!res.ok) {
        setBrandingState({
          status: "error",
          message: body.error ?? `HTTP ${res.status}`,
        });
        return;
      }
      setBrandingState({
        status: "success",
        message: "Branding saved. Refresh other tabs to see the new strings.",
      });
    } catch (e) {
      setBrandingState({
        status: "error",
        message: e instanceof Error ? e.message : "Network error",
      });
    }
  }

  // ── Change password form ──
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [pwState, setPwState] = useState<RequestState>({ status: "idle" });

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pw.newPassword !== pw.confirm) {
      setPwState({
        status: "error",
        message: "New password and confirmation don't match.",
      });
      return;
    }
    setPwState({ status: "saving" });
    try {
      const res = await fetch("/api/settings/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: pw.currentPassword,
          newPassword: pw.newPassword,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setPwState({
          status: "error",
          message: body.error ?? `HTTP ${res.status}`,
        });
        return;
      }
      setPwState({
        status: "success",
        message: "Password changed. Your existing session stays signed in.",
      });
      setPw({ currentPassword: "", newPassword: "", confirm: "" });
    } catch (e) {
      setPwState({
        status: "error",
        message: e instanceof Error ? e.message : "Network error",
      });
    }
  }

  // ── SMTP test ──
  const [smtpState, setSmtpState] = useState<RequestState>({ status: "idle" });

  async function sendTestEmail() {
    setSmtpState({ status: "saving" });
    try {
      const res = await fetch("/api/settings/test-email", { method: "POST" });
      const body = await res.json();
      if (!res.ok) {
        setSmtpState({
          status: "error",
          message: body.error ?? `HTTP ${res.status}`,
        });
        return;
      }
      setSmtpState({
        status: "success",
        message: `Test email sent to ${body.to}. Check the inbox (and spam folder).`,
      });
    } catch (e) {
      setSmtpState({
        status: "error",
        message: e instanceof Error ? e.message : "Network error",
      });
    }
  }

  const INPUT_CLS =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-white">
            Settings
          </h1>
          <p className="mt-1 text-sm text-white/60">
            Edit branding, change your admin password, and verify SMTP delivery.
          </p>
        </div>
        <Link
          href="/"
          className="text-sm text-white/60 hover:text-white inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Link>
      </header>

      {/* Branding card */}
      <section className="rounded-xl bg-white text-foreground p-5 sm:p-6 shadow-sm">
        <div className="flex items-start gap-3 mb-4">
          <Type className="h-5 w-5 text-aps-gold shrink-0 mt-0.5" />
          <div className="flex-1">
            <h2 className="text-base font-semibold">Branding</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Slogans and tagline shown on the dashboard, the public report
              page, PDFs, emails, and WhatsApp messages. Changes apply
              everywhere the next time those views render.
            </p>
          </div>
        </div>

        {brandingState.status === "loading" ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        ) : (
          <form onSubmit={saveBranding} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                English slogan
              </label>
              <input
                type="text"
                value={branding.sloganEn}
                onChange={(e) =>
                  setBranding((b) => ({ ...b, sloganEn: e.target.value }))
                }
                maxLength={200}
                className={INPUT_CLS}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Hindi slogan
              </label>
              <input
                type="text"
                value={branding.sloganHi}
                onChange={(e) =>
                  setBranding((b) => ({ ...b, sloganHi: e.target.value }))
                }
                maxLength={200}
                className={INPUT_CLS}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Tagline</label>
              <input
                type="text"
                value={branding.tagline}
                onChange={(e) =>
                  setBranding((b) => ({ ...b, tagline: e.target.value }))
                }
                maxLength={200}
                className={INPUT_CLS}
              />
            </div>

            {brandingState.status === "success" && (
              <div className="rounded-md border border-emerald-400/40 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                {brandingState.message}
              </div>
            )}
            {brandingState.status === "error" && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive flex items-start gap-2">
                <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                {brandingState.message}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="submit"
                variant="gold"
                disabled={brandingState.status === "saving"}
              >
                {brandingState.status === "saving" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving…
                  </>
                ) : (
                  "Save branding"
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={loadBranding}
                disabled={brandingState.status === "saving"}
              >
                Reset to saved
              </Button>
            </div>
          </form>
        )}
      </section>

      {/* Change password card */}
      <section className="rounded-xl bg-white text-foreground p-5 sm:p-6 shadow-sm">
        <div className="flex items-start gap-3 mb-4">
          <Lock className="h-5 w-5 text-aps-gold shrink-0 mt-0.5" />
          <div className="flex-1">
            <h2 className="text-base font-semibold">Change admin password</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              You stay signed in after a successful change. Future logins use
              the new password.
            </p>
          </div>
        </div>

        <form onSubmit={savePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Current password
            </label>
            <input
              type="password"
              autoComplete="current-password"
              value={pw.currentPassword}
              onChange={(e) =>
                setPw((p) => ({ ...p, currentPassword: e.target.value }))
              }
              required
              className={INPUT_CLS}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              New password{" "}
              <span className="text-xs text-muted-foreground font-normal">
                (8+ characters)
              </span>
            </label>
            <input
              type="password"
              autoComplete="new-password"
              value={pw.newPassword}
              onChange={(e) =>
                setPw((p) => ({ ...p, newPassword: e.target.value }))
              }
              required
              minLength={8}
              maxLength={200}
              className={INPUT_CLS}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Confirm new password
            </label>
            <input
              type="password"
              autoComplete="new-password"
              value={pw.confirm}
              onChange={(e) =>
                setPw((p) => ({ ...p, confirm: e.target.value }))
              }
              required
              minLength={8}
              maxLength={200}
              className={INPUT_CLS}
            />
          </div>

          {pwState.status === "success" && (
            <div className="rounded-md border border-emerald-400/40 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
              {pwState.message}
            </div>
          )}
          {pwState.status === "error" && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive flex items-start gap-2">
              <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
              {pwState.message}
            </div>
          )}

          <Button
            type="submit"
            variant="gold"
            disabled={pwState.status === "saving"}
          >
            {pwState.status === "saving" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Changing…
              </>
            ) : (
              "Change password"
            )}
          </Button>
        </form>
      </section>

      {/* SMTP test card */}
      <section className="rounded-xl bg-white text-foreground p-5 sm:p-6 shadow-sm">
        <div className="flex items-start gap-3 mb-4">
          <Mail className="h-5 w-5 text-aps-gold shrink-0 mt-0.5" />
          <div className="flex-1">
            <h2 className="text-base font-semibold">SMTP — Email delivery</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Hostinger SMTP is configured via the SMTP_* env vars. Click below
              to send a transactional test email to the admin inbox.
            </p>
          </div>
        </div>

        <Button
          onClick={sendTestEmail}
          disabled={smtpState.status === "saving"}
          variant="outline"
        >
          {smtpState.status === "saving" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Sending…
            </>
          ) : (
            "Send test email"
          )}
        </Button>

        {smtpState.status === "success" && (
          <div className="mt-4 rounded-md border border-emerald-400/40 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
            {smtpState.message}
          </div>
        )}
        {smtpState.status === "error" && (
          <div className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive flex items-start gap-2">
            <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              <div className="font-medium">Send failed</div>
              <div className="mt-0.5 break-all">{smtpState.message}</div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
