import { NextResponse } from "next/server"
import crypto from "crypto"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendVerifyEmailEmail } from "@/lib/email/service"
import { checkRateLimit } from "@/lib/rate-limit"

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const rateCheck = checkRateLimit(`verify-email:${session.user.email}`, { interval: 60000, maxRequests: 2 })
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      )
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: "Email already verified" }, { status: 400 })
    }

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
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/${locale}/verify-email?token=${token}&email=${encodeURIComponent(user.email)}`

    sendVerifyEmailEmail(user.email, user.name || "User", verificationUrl).catch(() => {})

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 }
    )
  }
}
