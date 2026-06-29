import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import { checkRateLimit } from "@/lib/rate-limit"
import { sendVerifyEmailEmail } from "@/lib/email/service"

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
    const { name, password } = body
    const email = typeof body.email === "string" ? body.email.toLowerCase().trim() : ""

    if (!email) {
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

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        stores: {
          create: {
            name: `${name || email}'s Store`,
            slug: email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Date.now(),
          },
        },
      },
    })

    const token = crypto.randomBytes(32).toString("hex")
    const expires = new Date(Date.now() + 86400000)

    await prisma.verificationToken.create({
      data: {
        identifier: `verify:${user.email}`,
        token,
        expires,
      },
    })

    const locale = "en"
    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/${locale}/verify-email?token=${token}&email=${encodeURIComponent(user.email)}`

    const emailResult = await sendVerifyEmailEmail(user.email, user.name || "User", verifyUrl)

    logger.info("User registered", { userId: user.id, email: user.email, emailSent: emailResult.success })

    const message = emailResult.success
      ? "Registration successful. Please check your email to verify your account."
      : "Account created. We couldn't send the verification email. Please try again later."

    return NextResponse.json(
      {
        message,
        email: user.email,
        emailSent: emailResult.success,
      },
      { status: emailResult.success ? 201 : 201 }
    )
  } catch (error) {
    logger.error("Registration error", error instanceof Error ? error : undefined)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
