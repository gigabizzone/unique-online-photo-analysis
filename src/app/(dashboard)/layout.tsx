// Layout for all authenticated admin routes (PRD §5.2 header bar).
// Middleware already redirects unauthed users to /login; here we just
// shape the chrome (top bar with logout) and pass the session down.

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { DashboardHeader } from "@/components/DashboardHeader";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Belt-and-braces: if middleware ever lets an unauthed request through
  // (e.g. a missed matcher rule), short-circuit here too.
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="aps-gradient-bg min-h-screen text-white">
      <DashboardHeader email={session.user.email} />
      {children}
    </div>
  );
}
