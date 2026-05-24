"use client";

import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";

// Header bar shown on every authenticated dashboard route.
// PRD §5.2: left = small logo placeholder; right = admin email + logout.

export function DashboardHeader({ email }: { email: string }) {
  return (
    <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div
            className="h-9 w-9 rounded-full flex items-center justify-center text-lg font-bold text-white shadow"
            style={{
              background:
                "radial-gradient(circle, #E8B86A 0%, #D4A24C 60%, #8E44AD 100%)",
            }}
            aria-hidden
          >
            ॐ
          </div>
          <span className="text-sm font-medium text-white/90 hidden sm:inline">
            Aura Photo Science
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-sm text-white/70">
            {email}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
          >
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
