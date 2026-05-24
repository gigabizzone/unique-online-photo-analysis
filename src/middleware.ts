// Route protection for the admin app.
//
// PRD §4 + §5.3: every dashboard route requires login; /login is public;
// the public report page /report/[publicId] (Phase 10) is also public.
//
// We use NextAuth's getToken() (JWT mode) — no session lookup, no DB hit,
// just a signed-cookie check. Matches the session strategy in src/lib/auth.ts.

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    const url = req.nextUrl.clone();
    const callbackUrl = req.nextUrl.pathname + req.nextUrl.search;
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", callbackUrl);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Run middleware on every path EXCEPT:
//  - /api/auth/*        (NextAuth's own routes)
//  - /login             (the login page)
//  - /report/*          (public report pages, Phase 10)
//  - /_next/*           (Next.js internals: static, image optimization)
//  - /favicon.ico, etc. (static assets at the root)
export const config = {
  matcher: [
    "/((?!api/auth|login|report|_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|webp|svg|ico|gif)).*)",
  ],
};
