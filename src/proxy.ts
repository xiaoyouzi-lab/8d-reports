import { NextRequest, NextResponse } from "next/server"

const LANG_COOKIE = "NEXT_LOCALE"
const SUPPORTED = ["en", "zh-CN"]

function detectLocale(request: NextRequest): string {
  const cookieLocale = request.cookies.get(LANG_COOKIE)?.value
  if (cookieLocale && SUPPORTED.includes(cookieLocale)) return cookieLocale
  const accept = request.headers.get("accept-language") || ""
  if (accept.split(",")[0]?.trim()?.toLowerCase().startsWith("zh")) return "zh-CN"
  return "en"
}

const protectedPaths = ["/dashboard", "/reports"]

function setLocaleCookie(response: NextResponse, locale: string) {
  response.cookies.set(LANG_COOKIE, locale, {
    path: "/",
    maxAge: 31536000,
    sameSite: "lax",
  })
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const locale = detectLocale(request)

  const isProtected = protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  )

  if (!isProtected) {
    const response = NextResponse.next()
    setLocaleCookie(response, locale)
    return response
  }

  const sessionCookie =
    request.cookies.get("__Secure-better-auth.session_token") ??
    request.cookies.get("better-auth.session_token")

  if (!sessionCookie?.value) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    const response = NextResponse.redirect(loginUrl)
    setLocaleCookie(response, locale)
    return response
  }

  const response = NextResponse.next()
  setLocaleCookie(response, locale)
  return response
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
