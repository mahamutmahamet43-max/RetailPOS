import NextAuth from "next-auth"
import createMiddleware from "next-intl/middleware"
import { NextRequest } from "next/server"
import { authConfig } from "@/lib/auth.config"
import { routing, defaultLocale, locales } from "@/i18n/routing"

const intlMiddleware = createMiddleware(routing)

const auth = NextAuth(authConfig).auth

function getValidLocale(pathname: string): string {
  const segment = pathname.split("/")[1]
  return segment && (locales as readonly string[]).includes(segment) ? segment : defaultLocale
}

export default auth(async function middleware(
  req: NextRequest & { auth: unknown }
) {
  const { pathname } = req.nextUrl
  const locale = getValidLocale(pathname)

  const pathnameWithoutLocale = pathname.replace(/^\/(en|so)/, "") || "/"

  const isAuthPage =
    pathnameWithoutLocale.startsWith("/login") ||
    pathnameWithoutLocale.startsWith("/register")
  const isDashboardPage = pathnameWithoutLocale.startsWith("/dashboard")
  const isBillingPage = pathnameWithoutLocale.startsWith("/dashboard/billing")
  const isApiRoute = pathnameWithoutLocale.startsWith("/api")
  const isLoggedIn = !!req.auth

  if (isDashboardPage && !isLoggedIn) {
    const loginUrl = new URL(`/${locale}/login`, req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return Response.redirect(loginUrl)
  }

  if (isAuthPage && isLoggedIn) {
    return Response.redirect(new URL(`/${locale}/dashboard`, req.url))
  }

  if (isDashboardPage && isLoggedIn && !isBillingPage && !isApiRoute) {
    const authToken = (req as any).auth as {
      user?: { subscriptionStatus?: string; subscriptionEndsAt?: string }
    } | null

    if (authToken?.user?.subscriptionStatus) {
      const status = authToken.user.subscriptionStatus
      const endsAt = authToken.user.subscriptionEndsAt

      if (status === "EXPIRED" || status === "SUSPENDED" || status === "CANCELLED") {
        return Response.redirect(
          new URL(`/${locale}/dashboard/billing`, req.url)
        )
      }

      if (status === "TRIAL" && endsAt && new Date(endsAt) < new Date()) {
        return Response.redirect(
          new URL(`/${locale}/dashboard/billing`, req.url)
        )
      }
    }
  }

  return intlMiddleware(req)
})

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
}
