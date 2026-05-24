// NextAuth v4 configuration — Credentials provider only.
// PRD v3.0 §4: bcrypt-hashed password in DB, JWT session 7-day expiry,
// 5 failed attempts → 15-minute lockout.

import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/db";

const SEVEN_DAYS_SECONDS = 7 * 24 * 60 * 60;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: SEVEN_DAYS_SECONDS,
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toLowerCase().trim();
        const password = credentials?.password;

        if (!email || !password) {
          throw new Error("Email and password are required.");
        }

        const admin = await prisma.admin.findUnique({ where: { email } });

        // To avoid leaking which emails exist, give the same error for
        // "no such admin" as for a wrong password. Run a dummy bcrypt
        // compare to equalize the timing on the "no such admin" branch.
        if (!admin) {
          await bcrypt.compare(password, "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvali");
          throw new Error("Invalid email or password.");
        }

        // Lockout gate
        if (admin.lockedUntil && admin.lockedUntil > new Date()) {
          const minutesLeft = Math.ceil(
            (admin.lockedUntil.getTime() - Date.now()) / 60_000
          );
          throw new Error(
            `Account locked. Try again in ${minutesLeft} minute${minutesLeft === 1 ? "" : "s"}.`
          );
        }

        const valid = await bcrypt.compare(password, admin.passwordHash);

        if (!valid) {
          const newCount = admin.failedAttempts + 1;
          if (newCount >= MAX_FAILED_ATTEMPTS) {
            await prisma.admin.update({
              where: { id: admin.id },
              data: {
                failedAttempts: 0,
                lockedUntil: new Date(Date.now() + LOCKOUT_MINUTES * 60_000),
              },
            });
            throw new Error(
              `Too many failed attempts. Account locked for ${LOCKOUT_MINUTES} minutes.`
            );
          }
          await prisma.admin.update({
            where: { id: admin.id },
            data: { failedAttempts: newCount },
          });
          throw new Error("Invalid email or password.");
        }

        // Success — reset failure state
        if (admin.failedAttempts > 0 || admin.lockedUntil) {
          await prisma.admin.update({
            where: { id: admin.id },
            data: { failedAttempts: 0, lockedUntil: null },
          });
        }

        return { id: admin.id, email: admin.email };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email!;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
};
