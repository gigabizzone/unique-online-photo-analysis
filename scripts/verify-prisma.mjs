import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
const a = await p.admin.count();
const c = await p.customer.count();
const e = await p.analysisEntry.count();
console.log("Admin rows:   ", a, "(expect 1)");
console.log("Customer rows:", c, "(expect 0)");
console.log("Entry rows:   ", e, "(expect 0)");
await p.$disconnect();
