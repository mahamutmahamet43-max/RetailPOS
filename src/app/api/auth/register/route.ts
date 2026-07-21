import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import { checkRateLimit } from "@/lib/rate-limit"
import { sendWelcomeEmail } from "@/lib/email/service"

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const rateCheck = checkRateLimit(`register:${ip}`, { interval: 60_000, maxRequests: 5 })
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { name, email, password } = body

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json({ error: "Password is required" }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const now = new Date()
    const trialEnd = new Date(now.getTime() + 14 * 86400000)

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
        },
      })

      const store = await tx.store.create({
        data: {
          name: `${name || email}'s Store`,
          slug: email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Date.now(),
          ownerId: newUser.id,
          subscription: {
            create: {
              plan: "FREE",
              status: "TRIAL",
              startsAt: now,
              trialEndsAt: trialEnd,
              endsAt: trialEnd,
            },
          },
        },
      })

      // Link store back to user for multi-user store access
      await tx.user.update({
        where: { id: newUser.id },
        data: { storeId: store.id },
      })

      return { ...newUser, storeId: store.id }
    })

    logger.info("User registered", { userId: user.id, email: user.email })

    sendWelcomeEmail(user.email, name || "there", `${name || email}'s Store`).catch(() => {})

    return NextResponse.json(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    logger.error("Registration error", error instanceof Error ? error : undefined)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
