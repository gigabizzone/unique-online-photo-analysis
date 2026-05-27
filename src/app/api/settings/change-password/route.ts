// POST /api/settings/change-password
// Body: { currentPassword: string, newPassword: string }
//
// Verifies the current password against the signed-in admin's bcrypt
// hash, then upserts the new hash. PRD §10.3.
//
// Also resets the lockout counters (failedAttempts, lockedUntil) so a
// successful self-service password change clears any in-progress lock.

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const BCRYPT_COST = 12;

const schema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .max(200, "Keep new password under 200 characters"),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }
  const { currentPassword, newPassword } = parsed.data;

  if (currentPassword === newPassword) {
    return NextResponse.json(
      { error: "New password must be different from current password" },
      { status: 400 }
    );
  }

  const admin = await prisma.admin.findUnique({
    where: { email: session.user.email },
  });
  if (!admin) {
    return NextResponse.json(
      { error: "Admin account not found" },
      { status: 404 }
    );
  }

  const ok = await bcrypt.compare(currentPassword, admin.passwordHash);
  if (!ok) {
    return NextResponse.json(
      { error: "Current password is incorrect" },
      { status: 400 }
    );
  }

  const newHash = await bcrypt.hash(newPassword, BCRYPT_COST);
  await prisma.admin.update({
    where: { id: admin.id },
    data: {
      passwordHash: newHash,
      failedAttempts: 0,
      lockedUntil: null,
    },
  });

  return NextResponse.json({ changed: true });
}
