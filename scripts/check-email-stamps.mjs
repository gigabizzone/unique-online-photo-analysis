import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();
const entries = await p.analysisEntry.findMany({
  orderBy: { createdAt: "asc" },
  select: {
    publicId: true,
    pdfStorageUrl: true,
    emailSentAt: true,
    adminAckSentAt: true,
  },
});
for (const e of entries) {
  console.log({
    publicId: e.publicId,
    pdf: e.pdfStorageUrl ? "✓" : "✗",
    emailSentAt: e.emailSentAt?.toISOString() ?? "(never)",
    adminAckAt: e.adminAckSentAt?.toISOString() ?? "(never)",
  });
}
await p.$disconnect();
