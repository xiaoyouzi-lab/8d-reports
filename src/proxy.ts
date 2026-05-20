import { NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

const LANG_HEADER_PATTERN = /^\/api\//;

const protectedPaths = ["/dashboard", "/reports"];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const intlResponse = intlMiddleware(request);
  const needsIntlCookie = intlResponse.headers.get("set-cookie");

  if (LANG_HEADER_PATTERN.test(pathname)) {
    return intlResponse;
  }

  const isProtected = protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  if (!isProtected) {
    return intlResponse;
  }

  const sessionCookie =
    request.cookies.get("__Secure-better-auth.session_token") ??
    request.cookies.get("better-auth.session_token");

  if (!sessionCookie?.value) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    const redirect = NextResponse.redirect(loginUrl);
    if (needsIntlCookie) {
      redirect.headers.set("set-cookie", needsIntlCookie);
    }
    return redirect;
  }

  if (needsIntlCookie) {
    intlResponse.headers.set("set-cookie", needsIntlCookie);
  }
  return intlResponse;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
