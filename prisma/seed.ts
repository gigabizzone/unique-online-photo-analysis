// Seed the initial admin user.
// PRD v3.0 §4.1 — email: mike2548@gmail.com, password: Victory@108!
//
// Idempotent: re-runs are safe (upsert by email).
// To run: `npm run seed`

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ADMIN_EMAIL = "mike2548@gmail.com";
const ADMIN_INITIAL_PASSWORD = "Victory@108!";
const BCRYPT_COST = 12;

async function main() {
  const passwordHash = await bcrypt.hash(ADMIN_INITIAL_PASSWORD, BCRYPT_COST);

  const admin = await prisma.admin.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      email: ADMIN_EMAIL,
      passwordHash,
    },
  });

  console.log(`✓ Admin seeded: ${admin.email} (id: ${admin.id})`);
  console.log(
    "  Initial password is from PRD §4.1. Change it via /settings after Phase 13 (go-live)."
  );
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
