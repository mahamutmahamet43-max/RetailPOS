import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },
  jwt: {
    maxAge: 24 * 60 * 60,
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" ? "__Secure-next-auth.session-token" : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60,
      },
    },
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const { default: bcrypt } = await import("bcryptjs")
        const { prisma } = await import("@/lib/prisma")

        const email = credentials.email as string
        const password = credentials.password as string

        const user = await prisma.user.findUnique({
          where: { email },
        })

        if (!user || !user.passwordHash) {
          return null
        }

        const isValid = await bcrypt.compare(password, user.passwordHash)

        if (!isValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id as string
      }

      // Only query DB on sign-in or explicit session update (runs in Node runtime).
      // Must skip during middleware calls (Edge Runtime) to avoid Prisma edge error.
      if ((user || trigger === "update") && token.id) {
        const { prisma } = await import("@/lib/prisma")

        const [dbUser, store] = await Promise.all([
          prisma.user.findUnique({
            where: { id: token.id as string },
            select: { role: true, storeId: true },
          }),
          (async () => {
            // Try user's direct store membership first (MANAGER/CASHIER)
            const u = await prisma.user.findUnique({
              where: { id: token.id as string },
              select: { storeId: true },
            })
            if (u?.storeId) {
              return prisma.store.findUnique({
                where: { id: u.storeId },
                select: { subscription: { select: { status: true, endsAt: true, trialEndsAt: true } } },
              })
            }
            // Fallback: OWNER users own a store via Store.ownerId
            return prisma.store.findFirst({
              where: { ownerId: token.id as string },
              select: { subscription: { select: { status: true, endsAt: true, trialEndsAt: true } } },
            })
          })(),
        ])

        if (dbUser) {
          token.role = dbUser.role
        }

        if (store?.subscription) {
          const sub = store.subscription
          token.subscriptionStatus = sub.status
          token.subscriptionEndsAt = sub.endsAt?.toISOString() || sub.trialEndsAt?.toISOString()
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        const user = session.user as unknown as Record<string, unknown>
        user.id = token.id as string
        user.role = token.role as string
        user.subscriptionStatus = token.subscriptionStatus as string | undefined
        user.subscriptionEndsAt = token.subscriptionEndsAt as string | undefined
      }
      return session
    },
  },
} satisfies NextAuthConfig
