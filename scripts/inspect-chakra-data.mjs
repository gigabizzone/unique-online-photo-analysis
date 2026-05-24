// Quick DB inspection: dump the Customer + AnalysisEntry + Counter rows
// after the chakra smoke test.

import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

const customers = await p.customer.findMany({
  orderBy: { createdAt: "asc" },
});
const entries = await p.analysisEntry.findMany({
  orderBy: { createdAt: "asc" },
  select: {
    id: true,
    publicId: true,
    analysisType: true,
    summary: true,
    data: true,
    customer: { select: { email: true } },
    createdAt: true,
  },
});
const counters = await p.counter.findMany();

console.log("\n=== Customer table ===");
console.log(JSON.stringify(customers, null, 2));

console.log("\n=== AnalysisEntry table (data abbreviated) ===");
for (const e of entries) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = e.data;
  const firstRow = Array.isArray(data?.chakras) ? data.chakras[0] : null;
  console.log({
    publicId: e.publicId,
    type: e.analysisType,
    customer: e.customer.email,
    summary: e.summary.slice(0, 60) + "…",
    sampleRow: firstRow,
    rowCount: data?.chakras?.length ?? null,
  });
}

console.log("\n=== Counter table ===");
console.log(JSON.stringify(counters, null, 2));

await p.$disconnect();
