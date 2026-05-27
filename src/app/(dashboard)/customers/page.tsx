"use client";

// /customers — PRD §10.2. Master list of unique customers with their
// entry count + last-entry date. Click "View entries" to drill into
// /history filtered to that customer.

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";

interface CustomerRow {
  id: string;
  firstName: string;
  lastName: string;
  gender: string;
  email: string;
  whatsapp: string;
  entryCount: number;
  lastEntryAt: string | null;
  createdAt: string;
}

interface CustomersResponse {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  customers: CustomerRow[];
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CustomersPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [qInput, setQInput] = useState<string>("");
  const [q, setQ] = useState<string>("");
  const [data, setData] = useState<CustomersResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce q
  useEffect(() => {
    const t = setTimeout(() => {
      setQ(qInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [qInput]);

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    if (q.length >= 2) p.set("q", q);
    p.set("page", String(page));
    p.set("pageSize", String(pageSize));
    return p.toString();
  }, [q, page, pageSize]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/customers?${queryString}`);
      if (!res.ok) {
        setError(`Load failed (${res.status})`);
        return;
      }
      const body = (await res.json()) as CustomersResponse;
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

  const customers = data?.customers ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-white">
            Customers
          </h1>
          <p className="mt-1 text-sm text-white/60">
            Every customer who has at least one analysis entry on file.
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

      <section className="rounded-xl bg-white text-foreground p-4 sm:p-5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
          <div>
            <label className="block text-xs font-medium mb-1">
              Search (name / email / WhatsApp)
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
          <div className="flex items-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setQInput("");
                setPage(1);
              }}
            >
              Reset
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-xl bg-white text-foreground p-4 sm:p-5 shadow-sm overflow-x-auto">
        {error && (
          <div
            role="alert"
            className="mb-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </div>
        )}

        {loading && customers.length === 0 ? (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-12">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        ) : customers.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-12">
            No customers match your filters.
          </div>
        ) : (
          <table className="w-full text-sm min-w-[700px]">
            <thead className="text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
              <tr>
                <th className="text-left py-2 pr-3">Name</th>
                <th className="text-left py-2 pr-3">Contact</th>
                <th className="text-left py-2 pr-3">Gender</th>
                <th className="text-right py-2 pr-3">Entries</th>
                <th className="text-left py-2 pr-3">Last entry</th>
                <th className="text-right py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-border last:border-b-0 hover:bg-muted/40"
                >
                  <td className="py-3 pr-3">
                    <div className="font-medium">
                      {c.firstName} {c.lastName}
                    </div>
                  </td>
                  <td className="py-3 pr-3">
                    <div>{c.email}</div>
                    <div className="text-xs text-muted-foreground">
                      {c.whatsapp}
                    </div>
                  </td>
                  <td className="py-3 pr-3">{c.gender}</td>
                  <td className="py-3 pr-3 text-right font-mono">
                    {c.entryCount}
                  </td>
                  <td className="py-3 pr-3 whitespace-nowrap">
                    {formatDate(c.lastEntryAt)}
                  </td>
                  <td className="py-3 text-right whitespace-nowrap">
                    <Link href={`/history?customer=${c.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1.5" />
                        View entries
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

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
    </main>
  );
}
