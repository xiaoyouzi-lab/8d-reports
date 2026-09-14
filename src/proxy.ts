import { NextRequest, NextResponse } from "next/server"

const LANG_COOKIE = "NEXT_LOCALE"
const PUBLIC_LOCALE = "en"
const SUPPORTED_LOCALES = new Set(["en", "zh-CN"])

const protectedPaths = ["/dashboard", "/reports"]

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const requestedLocale = request.cookies.get(LANG_COOKIE)?.value
  const locale =
    requestedLocale && SUPPORTED_LOCALES.has(requestedLocale)
      ? requestedLocale
      : PUBLIC_LOCALE

  const headers = new Headers(request.headers)
  headers.set("x-locale", locale)

  const isProtected = protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  )

  if (!isProtected) {
    const response = NextResponse.next({
      request: { headers },
    })
    if (!requestedLocale) {
      response.cookies.set(LANG_COOKIE, PUBLIC_LOCALE, {
        path: "/",
        maxAge: 31536000,
        sameSite: "lax",
      })
    }
    return response
  }

  const sessionCookie =
    request.cookies.get("__Secure-better-auth.session_token") ??
    request.cookies.get("better-auth.session_token")

  if (!sessionCookie?.value) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", `${pathname}${request.nextUrl.search}`)
    const response = NextResponse.redirect(loginUrl)
    if (!requestedLocale) {
      response.cookies.set(LANG_COOKIE, PUBLIC_LOCALE, {
        path: "/",
        maxAge: 31536000,
        sameSite: "lax",
      })
    }
    return response
  }

  const response = NextResponse.next({
    request: { headers },
  })
  if (!requestedLocale) {
    response.cookies.set(LANG_COOKIE, PUBLIC_LOCALE, {
      path: "/",
      maxAge: 31536000,
      sameSite: "lax",
    })
  }
  return response
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
