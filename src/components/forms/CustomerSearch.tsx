"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Loader2, X } from "lucide-react";

import { cn } from "@/lib/utils";

// Debounced autocomplete over the Customer table.
// Calls GET /api/customer/search?q=... and renders results in a dropdown.
// On select, fires `onSelect(customer)` so the parent can prefill its
// ProfileSection (PRD §5.3 "Find existing customer").

export interface CustomerHit {
  id: string;
  firstName: string;
  lastName: string;
  gender: string;
  email: string;
  whatsapp: string;
}

interface CustomerSearchProps {
  onSelect: (customer: CustomerHit) => void;
  placeholder?: string;
  className?: string;
}

const DEBOUNCE_MS = 250;

export function CustomerSearch({
  onSelect,
  placeholder = "Find existing customer by name, email, or WhatsApp…",
  className,
}: CustomerSearchProps) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<CustomerHit[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // Debounced fetch
  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const t = setTimeout(async () => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      try {
        const res = await fetch(
          `/api/customer/search?q=${encodeURIComponent(q.trim())}`,
          { signal: ac.signal }
        );
        if (!res.ok) {
          setResults([]);
          setError(`Search failed (${res.status})`);
        } else {
          const data = (await res.json()) as { results: CustomerHit[] };
          setResults(data.results);
        }
      } catch (e: unknown) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setError("Network error");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(t);
  }, [q]);

  // Click outside → close dropdown
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function handlePick(c: CustomerHit) {
    onSelect(c);
    setOpen(false);
    setQ("");
    setResults([]);
  }

  const showDropdown = open && q.trim().length >= 2;

  return (
    <div ref={wrapRef} className={cn("relative w-full", className)}>
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
          aria-hidden
        />
        <input
          type="text"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className={cn(
            "w-full rounded-md border border-input bg-background pl-9 pr-9 py-2 text-sm",
            "placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-ring"
          )}
        />
        {q && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              setResults([]);
              setOpen(false);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted text-muted-foreground"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute z-30 mt-1 w-full rounded-md border border-border bg-popover text-popover-foreground shadow-lg max-h-72 overflow-auto">
          {loading && (
            <div className="px-3 py-3 text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching…
            </div>
          )}
          {!loading && error && (
            <div className="px-3 py-3 text-sm text-destructive">{error}</div>
          )}
          {!loading && !error && results.length === 0 && (
            <div className="px-3 py-3 text-sm text-muted-foreground">
              No matches.
            </div>
          )}
          {!loading && results.length > 0 && (
            <ul role="listbox">
              {results.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => handlePick(c)}
                    className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <div className="text-sm font-medium">
                      {c.firstName} {c.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {c.email} · {c.whatsapp}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
