import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import createMiddleware from "next-intl/middleware"
import { routing, defaultLocale, locales } from "@/i18n/routing"

const intlMiddleware = createMiddleware(routing)

function getValidLocale(pathname: string): string {
  const segment = pathname.split("/")[1]
  return segment && (locales as readonly string[]).includes(segment) ? segment : defaultLocale
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const locale = getValidLocale(pathname)
  const pathnameWithoutLocale = pathname.replace(/^\/(en|so)/, "") || "/"

  const token = await getToken({
    req,
    cookieName: "next-auth.session-token",
    secret: process.env.AUTH_SECRET,
  })

  const isLoggedIn = !!token

  const isAuthPage =
    pathnameWithoutLocale.startsWith("/login") ||
    pathnameWithoutLocale.startsWith("/register") ||
    pathnameWithoutLocale.startsWith("/forgot-password") ||
    pathnameWithoutLocale.startsWith("/reset-password") ||
    pathnameWithoutLocale.startsWith("/verify-email")
  const isDashboardPage = pathnameWithoutLocale.startsWith("/dashboard")
  const isApiRoute = pathnameWithoutLocale.startsWith("/api")

  if (isDashboardPage && !isLoggedIn) {
    const loginUrl = new URL(`/${locale}/login`, req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, req.url))
  }

  return intlMiddleware(req)
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
}
