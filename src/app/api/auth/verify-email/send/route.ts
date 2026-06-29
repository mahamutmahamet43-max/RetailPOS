import { NextResponse } from "next/server"
import crypto from "crypto"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendVerifyEmailEmail } from "@/lib/email/service"
import { logger } from "@/lib/logger"
import { checkRateLimit } from "@/lib/rate-limit"

export async function POST(request: Request) {
  try {
    let email: string | null = null
    let user: { id: string; email: string; name: string | null } | null = null

    const body = await request.json().catch(() => ({}))
    const rawEmail = body.email as string | undefined
    const bodyEmail = rawEmail ? rawEmail.toLowerCase().trim() : undefined

    const session = await auth()
    if (session?.user?.id) {
      user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, email: true, name: true },
      })
    } else if (bodyEmail) {
      user = await prisma.user.findUnique({
        where: { email: bodyEmail },
        select: { id: true, email: true, name: true },
      })
    }

    if (!user?.email) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    email = user.email

    const rateCheck = checkRateLimit(`verify-email:${email}`, { interval: 60000, maxRequests: 2 })
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      )
    }

    const dbUser = await prisma.user.findUnique({ where: { email } })
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (dbUser.emailVerified) {
      return NextResponse.json({ error: "Email already verified" }, { status: 400 })
    }

    await prisma.verificationToken.deleteMany({
      where: { identifier: `verify:${email}` },
    })

    const token = crypto.randomBytes(32).toString("hex")
    const expires = new Date(Date.now() + 86400000)

    await prisma.verificationToken.create({
      data: {
        identifier: `verify:${email}`,
        token,
        expires,
      },
    })

    const locale = "en"
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/${locale}/verify-email?token=${token}&email=${encodeURIComponent(email)}`

    const emailResult = await sendVerifyEmailEmail(email, user.name || "User", verificationUrl)

    if (!emailResult.success) {
      return NextResponse.json(
        { error: "We couldn't send the verification email. Please try again in a few minutes." },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error("Verify email send error", error instanceof Error ? error : undefined)
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 }
    )
  }
}
