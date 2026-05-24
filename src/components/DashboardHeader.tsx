"use client";

import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { AuraLogo } from "@/components/AuraLogo";

// Header bar shown on every authenticated dashboard route.
// PRD §5.2: left = small logo; right = admin email + logout.

export function DashboardHeader({ email }: { email: string }) {
  return (
    <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center">
          <AuraLogo size={72} />
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
