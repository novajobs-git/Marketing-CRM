import { NextResponse, type NextRequest } from "next/server";
import { clerkMiddleware } from "@clerk/nextjs/server";

const PUBLIC_PATHS = ["/login", "/intake", "/checklist", "/api/webhooks"];

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { pathname } = req.nextUrl;
  const { userId, orgRole } = await auth();

  const isPublicPath = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  if (isPublicPath) {
    if (pathname === "/login" && userId) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  if (!userId) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // FR-3.2 — editing candidate profiles is admin-only.
  const isAdminOnlyCandidateRoute = /^\/candidates\/[^/]+\/edit$/.test(pathname);

  if ((pathname.startsWith("/admin") || isAdminOnlyCandidateRoute) && orgRole !== "org:admin") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - Next internals (_next/static, _next/image)
     * - static files (images, fonts, favicon, etc.)
     */
    "/((?!_next/static|_next/image|.*\\.(?:ico|png|jpg|jpeg|gif|webp|svg|css|js|map|woff2?)$).*)",
  ],
};
