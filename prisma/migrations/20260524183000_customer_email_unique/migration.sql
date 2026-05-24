-- Add a UNIQUE constraint on Customer.email so the analysis-form upsert
-- can use email as the conflict key. The Customer table is empty at the
-- point this migration runs (Phase 6, before any chakra entries), so the
-- constraint creation cannot fail on existing duplicates.
--
-- The non-unique index that previously covered email is automatically
-- replaced by the unique index Postgres creates here.

DROP INDEX IF EXISTS "Customer_email_idx";
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");
