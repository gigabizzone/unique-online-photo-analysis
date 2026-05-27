"use client";

// /history — PRD §10.1. Table of all AnalysisEntry rows with filters
// (type, date range, customer search), per-row actions (View / Download
// PDF / Resend Email / Reopen WhatsApp / Delete), and CSV export.

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Eye,
  Mail,
  MessageCircle,
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileText,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ANALYSIS_TYPES } from "@/constants/branding";

interface HistoryEntry {
  id: string;
  publicId: string;
  analysisType: string;
  pdfStorageUrl: string | null;
  emailSentAt: string | null;
  whatsappOpenedAt: string | null;
  pdfDownloadedAt: string | null;
  createdAt: string;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    whatsapp: string;
    gender: string;
  };
}

interface HistoryResponse {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  entries: HistoryEntry[];
}

const TYPE_LABEL: Record<string, string> = Object.fromEntries(
  ANALYSIS_TYPES.map((t) => [t.dbValue, t.label])
);

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HistoryPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [type, setType] = useState<string>("");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [qInput, setQInput] = useState<string>("");
  const [q, setQ] = useState<string>("");
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rowBusy, setRowBusy] = useState<{ id: string; what: string } | null>(
    null
  );
  const [toast, setToast] = useState<string | null>(null);

  // Debounce the free-text search (300ms)
  useEffect(() => {
    const t = setTimeout(() => {
      setQ(qInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [qInput]);

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    if (type) p.set("type", type);
    if (from) p.set("from", from);
    if (to) p.set("to", `${to}T23:59:59.999Z`);
    if (q.length >= 2) p.set("q", q);
    p.set("page", String(page));
    p.set("pageSize", String(pageSize));
    return p.toString();
  }, [type, from, to, q, page, pageSize]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/history?${queryString}`);
      if (!res.ok) {
        setError(`Load failed (${res.status})`);
        return;
      }
      const body = (await res.json()) as HistoryResponse;
      setData(body);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => {
    load();
  }, [load]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }

  async function handleResendEmail(entry: HistoryEntry) {
    setRowBusy({ id: entry.id, what: "email" });
    try {
      const res = await fetch("/api/report/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryId: entry.id }),
      });
      const body = await res.json();
      if (!res.ok) {
        showToast(`Email failed: ${body.error ?? res.status}`);
      } else {
        showToast(`Email sent to ${body.customer} + ${body.admin}`);
        load();
      }
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Email network error");
    } finally {
      setRowBusy(null);
    }
  }

  async function handleReopenWhatsApp(entry: HistoryEntry) {
    setRowBusy({ id: entry.id, what: "wa" });
    try {
      const res = await fetch(`/api/analysis/${entry.id}/mark-wa-opened`, {
        method: "POST",
      });
      const body = await res.json();
      if (!res.ok || !body.waUrl) {
        showToast(`WhatsApp failed: ${body.error ?? res.status}`);
      } else {
        window.open(body.waUrl, "_blank", "noopener,noreferrer");
        showToast("WhatsApp opened.");
        load();
      }
    } catch (e) {
      showToast(e instanceof Error ? e.message : "WhatsApp network error");
    } finally {
      setRowBusy(null);
    }
  }

  async function handleDelete(entry: HistoryEntry) {
    if (
      !window.confirm(
        `Delete ${entry.publicId}? This also removes the PDF from Supabase Storage. Cannot be undone.`
      )
    ) {
      return;
    }
    setRowBusy({ id: entry.id, what: "delete" });
    try {
      const res = await fetch(`/api/analysis/${entry.id}`, {
        method: "DELETE",
      });
      const body = await res.json();
      if (!res.ok) {
        showToast(`Delete failed: ${body.error ?? res.status}`);
      } else {
        showToast(`Deleted ${body.deleted}`);
        load();
      }
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Delete network error");
    } finally {
      setRowBusy(null);
    }
  }

  function resetFilters() {
    setType("");
    setFrom("");
    setTo("");
    setQInput("");
    setPage(1);
  }

  const entries = data?.entries ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-white">
            History
          </h1>
          <p className="mt-1 text-sm text-white/60">
            All saved analysis entries. Filter, search, and re-fire actions.
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

      {/* Filter bar */}
      <section className="rounded-xl bg-white text-foreground p-4 sm:p-5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto_auto] gap-3 items-end">
          <div>
            <label className="block text-xs font-medium mb-1">
              Search (name / email / WhatsApp / report ID)
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={qInput}
                onChange={(e) => setQInput(e.target.value)}
                placeholder="Type 2+ characters…"
                className="w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Type</label>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPage(1);
              }}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All types</option>
              {ANALYSIS_TYPES.map((t) => (
                <option key={t.dbValue} value={t.dbValue}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setPage(1);
              }}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setPage(1);
              }}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex items-end gap-2">
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Reset
            </Button>
            <a href={`/api/history/export?${queryString}`}>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-1.5" />
                Export CSV
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Table */}
      <section className="rounded-xl bg-white text-foreground p-4 sm:p-5 shadow-sm overflow-x-auto">
        {error && (
          <div
            role="alert"
            className="mb-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </div>
        )}

        {loading && entries.length === 0 ? (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-12">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        ) : entries.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-12">
            No entries match your filters.
          </div>
        ) : (
          <table className="w-full text-sm min-w-[900px]">
            <thead className="text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
              <tr>
                <th className="text-left py-2 pr-3">Date</th>
                <th className="text-left py-2 pr-3">Customer</th>
                <th className="text-left py-2 pr-3">Type</th>
                <th className="text-left py-2 pr-3">Report ID</th>
                <th className="text-left py-2 pr-3">PDF</th>
                <th className="text-left py-2 pr-3">Email</th>
                <th className="text-left py-2 pr-3">WA</th>
                <th className="text-right py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => {
                const busyThis = rowBusy?.id === e.id;
                return (
                  <tr
                    key={e.id}
                    className="border-b border-border last:border-b-0 hover:bg-muted/40"
                  >
                    <td className="py-3 pr-3 whitespace-nowrap">
                      {formatDate(e.createdAt)}
                    </td>
                    <td className="py-3 pr-3">
                      <div className="font-medium">
                        {e.customer.firstName} {e.customer.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {e.customer.email}
                      </div>
                    </td>
                    <td className="py-3 pr-3 whitespace-nowrap">
                      {TYPE_LABEL[e.analysisType] ?? e.analysisType}
                    </td>
                    <td className="py-3 pr-3 font-mono text-xs">
                      {e.publicId}
                    </td>
                    <td className="py-3 pr-3">
                      {e.pdfStorageUrl ? (
                        <span className="text-emerald-700">✓</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3 pr-3">
                      {e.emailSentAt ? (
                        <span className="text-emerald-700">✓</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3 pr-3">
                      {e.whatsappOpenedAt ? (
                        <span className="text-emerald-700">✓</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <Link
                          href={`/report/${e.publicId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="View report"
                        >
                          <Button variant="ghost" size="icon" title="View report">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        {e.pdfStorageUrl ? (
                          <a
                            href={`/api/report/${e.publicId}/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Download PDF"
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Download PDF"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </a>
                        ) : null}
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Resend email"
                          disabled={busyThis || !e.pdfStorageUrl}
                          onClick={() => handleResendEmail(e)}
                        >
                          {busyThis && rowBusy?.what === "email" ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Mail className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Reopen WhatsApp"
                          disabled={busyThis}
                          onClick={() => handleReopenWhatsApp(e)}
                        >
                          {busyThis && rowBusy?.what === "wa" ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MessageCircle className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Delete entry"
                          disabled={busyThis}
                          onClick={() => handleDelete(e)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          {busyThis && rowBusy?.what === "delete" ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {total > 0 && (
          <div className="mt-4 flex items-center justify-between flex-wrap gap-2 text-sm text-muted-foreground">
            <div>
              {total} total · page {page} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </section>

      {toast && (
        <div
          role="status"
          className="fixed bottom-6 right-6 max-w-sm rounded-md border border-emerald-400/40 bg-emerald-50 px-4 py-2 text-sm text-emerald-900 shadow-lg"
        >
          {toast}
        </div>
      )}
    </main>
  );
}
