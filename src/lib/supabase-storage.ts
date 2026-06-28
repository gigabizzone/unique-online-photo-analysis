// PRD §8.5 — server-side PDF upload to the Supabase Storage "reports" bucket.
//
// Uses the SUPABASE_SECRET_KEY (modern equivalent of the old service_role JWT
// key) so we can bypass RLS and write to a bucket the public/anon key cannot.
// This module must NEVER be imported into a "use client" file — the secret
// key would leak into the browser bundle.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "reports";
const MAX_PDF_BYTES = 5 * 1024 * 1024; // PRD §0.3 step 5

let _client: SupabaseClient | null = null;

/** Transient/network failures worth retrying (vs. real 4xx/logic errors). */
function isTransient(err: unknown): boolean {
  const msg =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : (err as { message?: string } | null)?.message ?? "";
  return /fetch failed|network|timeout|ECONN|socket|EAI_AGAIN|ETIMEDOUT|503|429/i.test(
    msg
  );
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Run an async Storage op with exponential backoff on transient network
 * failures (e.g. "fetch failed" during a Supabase free-tier cold start).
 * Non-transient errors throw immediately; after `attempts` the last error is
 * rethrown so the caller's existing "retry from History" UX still applies.
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  { attempts = 3, baseDelayMs = 300 }: { attempts?: number; baseDelayMs?: number } = {}
): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i === attempts - 1 || !isTransient(err)) throw err;
      await sleep(baseDelayMs * 2 ** i); // 300 → 600 → 1200 ms
    }
  }
  throw lastErr;
}

function getSupabaseAdmin(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is not set (check .env.local and Hostinger env vars)"
    );
  }
  if (!secret) {
    throw new Error(
      "SUPABASE_SECRET_KEY is not set. Get it from Supabase → Project Settings → API → 'secret keys' section, then paste it into .env.local. Server-only — never expose to browser."
    );
  }
  _client = createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _client;
}

/**
 * Create the "reports" bucket with the PRD §0.3 step-5 config (public, 5MB
 * limit, application/pdf only). Called ONLY when an upload reports the bucket
 * missing (fresh environment) — not on every cold start. Swallows the
 * "already exists" race so concurrent callers are safe.
 */
async function createReportsBucket(supabase: SupabaseClient): Promise<void> {
  const { error } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: MAX_PDF_BYTES,
    allowedMimeTypes: ["application/pdf"],
  });
  if (error && !/exist/i.test(error.message)) {
    throw new Error(`Failed to create 'reports' bucket: ${error.message}`);
  }
}

/**
 * Upload (or overwrite) a PDF for a given report's publicId.
 * Returns the public URL once the upload succeeds.
 *
 * Resilience: the upload is retried on transient network failures
 * ("fetch failed" during a Supabase cold start). The bucket is created lazily
 * only if the upload says it's missing — we no longer run a fragile
 * createBucket pre-flight on the happy path. `upsert: true` makes retries
 * idempotent.
 */
export async function uploadReportPdf(
  publicId: string,
  pdfBuffer: Buffer
): Promise<string> {
  const supabase = getSupabaseAdmin();
  const path = `${publicId}.pdf`;

  // Run an upload, retrying transient network errors (whether the client
  // throws them or returns them as { error }).
  const runUpload = () =>
    withRetry(async () => {
      const res = await supabase.storage.from(BUCKET).upload(path, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });
      if (res.error && isTransient(res.error)) throw res.error;
      return res;
    });

  try {
    let { error } = await runUpload();

    // Fresh environment: the bucket doesn't exist yet → create it once, retry.
    if (error && /bucket.*not.*found|not.*found/i.test(error.message)) {
      await createReportsBucket(supabase);
      ({ error } = await runUpload());
    }

    if (error) throw new Error(error.message);
  } catch (err) {
    const msg =
      err instanceof Error
        ? err.message
        : (err as { message?: string } | null)?.message ?? String(err);
    throw new Error(`Supabase Storage upload failed: ${msg}`);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Stream a previously uploaded PDF back as a Buffer. Returns null on 404
 * (or if the storage is unreachable after retries). Used by the proxy
 * endpoint /api/report/[publicId]/pdf so we can revoke later without changing
 * public URLs (PRD §16 open question #6). Transient network errors are retried.
 */
export async function downloadReportPdf(
  publicId: string
): Promise<Buffer | null> {
  const supabase = getSupabaseAdmin();
  const path = `${publicId}.pdf`;
  try {
    const { data, error } = await withRetry(async () => {
      const res = await supabase.storage.from(BUCKET).download(path);
      if (res.error && isTransient(res.error)) throw res.error;
      return res;
    });
    if (error || !data) return null; // real not-found → null (not retried)
    const arrayBuf = await data.arrayBuffer();
    return Buffer.from(arrayBuf);
  } catch {
    // Transient retries exhausted — treat as unavailable; caller handles null.
    return null;
  }
}
