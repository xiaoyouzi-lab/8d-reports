import { NextRequest, NextResponse } from "next/server"
import createIntlMiddleware from "next-intl/middleware"
import { routing } from "./i18n/routing"

const intlMiddleware = createIntlMiddleware(routing)

const protectedPaths = ["/dashboard", "/reports"]

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected = protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  )

  if (!isProtected) {
    return intlMiddleware(request)
  }

  const sessionCookie =
    request.cookies.get("__Secure-better-auth.session_token") ??
    request.cookies.get("better-auth.session_token")

  if (!sessionCookie?.value) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    const redirect = NextResponse.redirect(loginUrl)
    const intlResponse = intlMiddleware(request)
    const intlCookie = intlResponse.headers.get("set-cookie")
    if (intlCookie) redirect.headers.set("set-cookie", intlCookie)
    return redirect
  }

  return intlMiddleware(request)
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
