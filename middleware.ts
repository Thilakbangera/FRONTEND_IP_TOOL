import { NextRequest, NextResponse } from "next/server";
import { createSupabaseMiddlewareClient } from "./lib/supabase-server";

/* ── Routes that should remain publicly accessible ── */
const PUBLIC_PATHS = ["/login", "/set-password"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip API routes and static assets
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Always allow public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Create a response we can mutate (to sync cookies)
  const response = NextResponse.next({ request });
  const supabase = createSupabaseMiddlewareClient(request, response);

  // Retrieve session from cookies
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Redirect unauthenticated visitors to login
    const loginUrl = new URL("https://lextriatech.netlify.app/login");
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated — continue normally
  return response;
}

/* ── Run on all routes except Next.js internals and static files ── */
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
