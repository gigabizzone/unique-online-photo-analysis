-- Enable Row-Level Security on all app tables.
--
-- Defense-in-depth: blocks access via Supabase's auto-generated PostgREST API
-- (which would otherwise be reachable using the publishable/anon key).
--
-- Our Next.js server connects via DATABASE_URL as the `postgres` role, which has
-- BYPASSRLS — so all application functionality continues to work unchanged.
-- The `_prisma_migrations` table is managed by Supabase/Prisma and not user-facing.

ALTER TABLE "Admin" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Customer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AnalysisEntry" ENABLE ROW LEVEL SECURITY;

-- No policies created intentionally. With RLS enabled and zero policies, the
-- default is DENY for any role that does NOT have BYPASSRLS. The postgres
-- role (which Prisma uses) keeps full access.
