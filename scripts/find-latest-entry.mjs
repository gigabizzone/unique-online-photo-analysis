import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();
const e = await p.analysisEntry.findFirst({
  orderBy: { createdAt: "desc" },
  include: { customer: { select: { firstName: true, whatsapp: true, email: true } } },
});
if (e) {
  console.log("id=", e.id);
  console.log("publicId=", e.publicId);
  console.log("customer:", JSON.stringify(e.customer));
  console.log("whatsappOpenedAt (before):", e.whatsappOpenedAt);
} else {
  console.log("no entries");
}
await p.$disconnect();
