import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { REFRESH_COOKIE, SESSION_COOKIE } from "@/lib/cookie-names";

/** Gate /portal routes — requires refresh cookie or legacy session cookie. */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const traceId = request.headers.get("x-trace-id") ?? crypto.randomUUID();
  response.headers.set("x-trace-id", traceId);

  if (!request.nextUrl.pathname.startsWith("/portal")) {
    return response;
  }

  const hasRefresh = Boolean(request.cookies.get(REFRESH_COOKIE)?.value);
  const hasLegacy = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  if (hasRefresh || hasLegacy) {
    return response;
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/portal/:path*"],
};
