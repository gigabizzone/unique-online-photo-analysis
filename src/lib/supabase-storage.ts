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
let _bucketEnsured = false;

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
 * Lazily ensure the "reports" bucket exists with the PRD §0.3 step-5 config
 * (public, 5MB limit, application/pdf only). Idempotent — runs once per
 * process. Lets us skip the manual pre-flight bucket creation step from the
 * PRD; if the bucket was already created by hand the createBucket call
 * returns an "already exists" error which we swallow.
 */
async function ensureBucket(supabase: SupabaseClient): Promise<void> {
  if (_bucketEnsured) return;
  const { error } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: MAX_PDF_BYTES,
    allowedMimeTypes: ["application/pdf"],
  });
  // Supabase returns a different message format depending on version, hence
  // the loose match on "exists".
  if (error && !/exist/i.test(error.message)) {
    throw new Error(`Failed to ensure 'reports' bucket: ${error.message}`);
  }
  _bucketEnsured = true;
}

/**
 * Upload (or overwrite) a PDF for a given report's publicId.
 * Returns the public URL once the upload succeeds.
 */
export async function uploadReportPdf(
  publicId: string,
  pdfBuffer: Buffer
): Promise<string> {
  const supabase = getSupabaseAdmin();
  await ensureBucket(supabase);
  const path = `${publicId}.pdf`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, pdfBuffer, {
    contentType: "application/pdf",
    upsert: true,
  });
  if (error) {
    throw new Error(`Supabase Storage upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Stream a previously uploaded PDF back as a Buffer. Returns null on 404.
 * Used by the proxy endpoint /api/report/[publicId]/pdf so we can revoke
 * later without changing public URLs (PRD §16 open question #6).
 */
export async function downloadReportPdf(
  publicId: string
): Promise<Buffer | null> {
  const supabase = getSupabaseAdmin();
  await ensureBucket(supabase);
  const path = `${publicId}.pdf`;
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error || !data) return null;
  const arrayBuf = await data.arrayBuffer();
  return Buffer.from(arrayBuf);
}
