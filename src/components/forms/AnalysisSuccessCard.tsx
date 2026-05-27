"use client";

// Reusable success card shown after a form's "Generate Report" succeeds.
// Used by ScoreRowsAnalysisFlow (Chakra/Planets/Elements/Overall) and
// directly by the bespoke pages for Life Challenges + Wearables.

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Loader2,
  Download,
  Mail,
  MessageCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";

export interface SavedAnalysis {
  publicId: string;
  id: string;
  pdfStorageUrl?: string | null;
}

type EmailState =
  | { status: "idle" }
  | { status: "sending" }
  | { status: "sent"; customer: string; admin: string }
  | { status: "error"; message: string };

type WhatsAppState =
  | { status: "idle" }
  | { status: "opening" }
  | { status: "opened" }
  | { status: "error"; message: string };

export interface AnalysisSuccessCardProps {
  saved: SavedAnalysis;
  /** e.g. "Chakra entry saved" / "Life Challenges entry saved" */
  heading: string;
  /** e.g. "Enter another chakra report" / "Enter another planets report" */
  startAnotherLabel: string;
  /** Soft warning shown above the action buttons (e.g. PDF gen failed) */
  warning?: string | null;
  /** Called when user clicks "Enter another ... report" */
  onStartAnother: () => void;
}

export function AnalysisSuccessCard({
  saved,
  heading,
  startAnotherLabel,
  warning,
  onStartAnother,
}: AnalysisSuccessCardProps) {
  const [emailState, setEmailState] = useState<EmailState>({ status: "idle" });
  const [waState, setWaState] = useState<WhatsAppState>({ status: "idle" });

  async function handleSendEmail() {
    setEmailState({ status: "sending" });
    try {
      const res = await fetch("/api/report/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryId: saved.id }),
      });
      const body = await res.json();
      if (!res.ok) {
        setEmailState({
          status: "error",
          message: body.error ?? `HTTP ${res.status}`,
        });
        return;
      }
      setEmailState({
        status: "sent",
        customer: body.customer,
        admin: body.admin,
      });
    } catch (e) {
      setEmailState({
        status: "error",
        message: e instanceof Error ? e.message : "Network error",
      });
    }
  }

  async function handleSendWhatsApp() {
    setWaState({ status: "opening" });
    try {
      const res = await fetch(
        `/api/analysis/${saved.id}/mark-wa-opened`,
        { method: "POST" }
      );
      const body = await res.json();
      if (!res.ok || !body.waUrl) {
        setWaState({
          status: "error",
          message: body.error ?? `HTTP ${res.status}`,
        });
        return;
      }
      window.open(body.waUrl, "_blank", "noopener,noreferrer");
      setWaState({ status: "opened" });
    } catch (e) {
      setWaState({
        status: "error",
        message: e instanceof Error ? e.message : "Network error",
      });
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="rounded-xl bg-white text-foreground p-6 sm:p-8 shadow-lg">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-7 w-7 text-emerald-500 shrink-0" />
          <div>
            <h2 className="text-xl font-semibold">{heading}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Stored in Supabase under report ID{" "}
              <code className="font-mono text-foreground bg-muted px-1.5 py-0.5 rounded">
                {saved.publicId}
              </code>
              .
            </p>
          </div>
        </div>

        {warning && (
          <div
            role="alert"
            className="mt-4 rounded-md border border-amber-400/40 bg-amber-50 px-3 py-2 text-sm text-amber-900"
          >
            {warning}
          </div>
        )}

        <div className="mt-6 rounded-md border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          Download the PDF, email it to the customer + admin, or open
          WhatsApp Web with the pre-filled message + report link.
        </div>

        {emailState.status === "sent" && (
          <div
            role="status"
            className="mt-4 rounded-md border border-emerald-400/40 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
          >
            ✓ Email sent to <strong>{emailState.customer}</strong> and{" "}
            <strong>{emailState.admin}</strong>.
          </div>
        )}
        {emailState.status === "error" && (
          <div
            role="alert"
            className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive break-all"
          >
            Email failed: {emailState.message}
          </div>
        )}

        {waState.status === "opened" && (
          <div
            role="status"
            className="mt-4 rounded-md border border-emerald-400/40 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
          >
            ✓ WhatsApp opened in a new tab. Attach the PDF file inside
            WhatsApp and click <strong>Send</strong>.
          </div>
        )}
        {waState.status === "error" && (
          <div
            role="alert"
            className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive break-all"
          >
            WhatsApp failed: {waState.message}
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          {saved.pdfStorageUrl ? (
            <a
              href={`/api/report/${saved.publicId}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="gold">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </a>
          ) : null}
          {saved.pdfStorageUrl ? (
            <Button
              variant="outline"
              onClick={handleSendEmail}
              disabled={
                emailState.status === "sending" ||
                emailState.status === "sent"
              }
            >
              {emailState.status === "sending" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Sending email…
                </>
              ) : emailState.status === "sent" ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-500" />
                  Email sent
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>
          ) : null}
          <Button
            variant="outline"
            onClick={handleSendWhatsApp}
            disabled={waState.status === "opening"}
            className="border-emerald-500/40 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
          >
            {waState.status === "opening" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Opening WhatsApp…
              </>
            ) : waState.status === "opened" ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-500" />
                WhatsApp opened
              </>
            ) : (
              <>
                <MessageCircle className="h-4 w-4 mr-2" />
                Send via WhatsApp
              </>
            )}
          </Button>
          <Button onClick={onStartAnother} variant="ghost">
            {startAnotherLabel}
          </Button>
          <Link href="/">
            <Button variant="ghost">Back to dashboard</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
