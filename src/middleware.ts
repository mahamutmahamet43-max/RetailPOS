import createMiddleware from "next-intl/middleware"
import { NextRequest, NextResponse } from "next/server"
import { routing, defaultLocale, locales } from "@/i18n/routing"
import { jwtDecrypt, calculateJwkThumbprint, base64url } from "jose"
import { hkdf } from "@panva/hkdf"

const intlMiddleware = createMiddleware(routing)

function getValidLocale(pathname: string): string {
  const segment = pathname.split("/")[1]
  return segment && (locales as readonly string[]).includes(segment) ? segment : defaultLocale
}

async function decryptSessionToken(token: string, secret: string, salt: string) {
  const enc = "A256CBC-HS512"
  const length = 64
  const encryptionSecret = await hkdf(
    "sha256",
    new TextEncoder().encode(secret),
    salt,
    `Auth.js Generated Encryption Key (${salt})`,
    length
  )
  const { payload } = await jwtDecrypt(token, async ({ kid }) => {
    if (kid === undefined) return encryptionSecret
    const hashAlg = encryptionSecret.byteLength << 3 === 512 ? "sha512" : encryptionSecret.byteLength << 3 === 384 ? "sha384" : "sha256"
    const thumbprint = await calculateJwkThumbprint(
      { kty: "oct", k: base64url.encode(encryptionSecret) },
      hashAlg
    )
    if (kid === thumbprint) return encryptionSecret
    throw new Error("no matching decryption secret")
  }, {
    clockTolerance: 15,
    keyManagementAlgorithms: ["dir"],
    contentEncryptionAlgorithms: [enc, "A256GCM"],
  })
  return payload
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Rewrite root path to default locale instead of redirecting
  if (pathname === "/") {
    req.nextUrl.pathname = "/en"
    return NextResponse.rewrite(req.nextUrl)
  }

  const locale = getValidLocale(pathname)

  const pathnameWithoutLocale = pathname.replace(/^\/(en|so)/, "") || "/"

  const isAuthPage =
    pathnameWithoutLocale.startsWith("/login") ||
    pathnameWithoutLocale.startsWith("/register") ||
    pathnameWithoutLocale.startsWith("/forgot-password") ||
    pathnameWithoutLocale.startsWith("/reset-password") ||
    pathnameWithoutLocale.startsWith("/verify-email")
  const isDashboardPage = pathnameWithoutLocale.startsWith("/dashboard")
  const isBillingPage = pathnameWithoutLocale.startsWith("/dashboard/billing")

  if (isDashboardPage || isAuthPage) {
    const isProduction = process.env.NODE_ENV === "production"
    const cookieName = isProduction
      ? "__Secure-next-auth.session-token"
      : "next-auth.session-token"
    const cookie = req.cookies.get(cookieName)?.value

    let session: Record<string, unknown> | null = null
    const secret = process.env.AUTH_SECRET

    if (cookie && secret) {
      try {
        session = (await decryptSessionToken(cookie, secret, cookieName)) as Record<string, unknown>
      } catch {
        // Invalid token
      }
    }

    const isLoggedIn = !!session

    if (isDashboardPage && !isLoggedIn) {
      const loginUrl = new URL(`/${locale}/login`, req.url)
      loginUrl.searchParams.set("callbackUrl", pathname)
      return Response.redirect(loginUrl)
    }

    if (isAuthPage && isLoggedIn) {
      return Response.redirect(new URL(`/${locale}/dashboard`, req.url))
    }

    if (isDashboardPage && isLoggedIn && !isBillingPage && session) {
      const subscriptionStatus = session.subscriptionStatus as string | undefined
      const subscriptionEndsAt = session.subscriptionEndsAt as string | undefined

      if (subscriptionStatus === "EXPIRED" || subscriptionStatus === "SUSPENDED" || subscriptionStatus === "CANCELLED") {
        return Response.redirect(new URL(`/${locale}/dashboard/billing`, req.url))
      }

      if (subscriptionStatus === "TRIAL" && subscriptionEndsAt && new Date(subscriptionEndsAt) < new Date()) {
        return Response.redirect(new URL(`/${locale}/dashboard/billing`, req.url))
      }
    }
  }

  return intlMiddleware(req)
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
}