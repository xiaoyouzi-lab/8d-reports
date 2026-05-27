import { NextRequest, NextResponse } from "next/server"

const LANG_COOKIE = "NEXT_LOCALE"
const PUBLIC_LOCALE = "en"

const protectedPaths = ["/dashboard", "/reports"]

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const locale = PUBLIC_LOCALE

  const headers = new Headers(request.headers)
  headers.set("x-locale", locale)

  const isProtected = protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  )

  if (!isProtected) {
    const response = NextResponse.next({
      request: { headers },
    })
    response.cookies.set(LANG_COOKIE, PUBLIC_LOCALE, {
      path: "/",
      maxAge: 31536000,
      sameSite: "lax",
    })
    return response
  }

  const sessionCookie =
    request.cookies.get("__Secure-better-auth.session_token") ??
    request.cookies.get("better-auth.session_token")

  if (!sessionCookie?.value) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    const response = NextResponse.redirect(loginUrl)
    response.cookies.set(LANG_COOKIE, PUBLIC_LOCALE, {
      path: "/",
      maxAge: 31536000,
      sameSite: "lax",
    })
    return response
  }

  const response = NextResponse.next({
    request: { headers },
  })
  response.cookies.set(LANG_COOKIE, PUBLIC_LOCALE, {
    path: "/",
    maxAge: 31536000,
    sameSite: "lax",
  })
  return response
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
