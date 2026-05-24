// One-off: clear the admin's lockout counters.
// Useful if a failed-login smoke-test left state behind, or if Kiran
// locks himself out during testing.

import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

const before = await p.admin.findUnique({
  where: { email: "mike2548@gmail.com" },
  select: { failedAttempts: true, lockedUntil: true },
});
console.log("Before:", before);

const after = await p.admin.update({
  where: { email: "mike2548@gmail.com" },
  data: { failedAttempts: 0, lockedUntil: null },
  select: { failedAttempts: true, lockedUntil: true },
});
console.log("After: ", after);

await p.$disconnect();
