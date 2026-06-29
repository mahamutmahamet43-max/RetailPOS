import { NextResponse } from "next/server"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"
import { sendPasswordResetEmail } from "@/lib/email/service"
import { checkRateLimit } from "@/lib/rate-limit"

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown"
    const rateCheck = checkRateLimit(`forgot-password:${ip}`, { interval: 60000, maxRequests: 3 })
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      )
    }

    const { email: rawEmail } = await request.json()
    const email = typeof rawEmail === "string" ? rawEmail.toLowerCase().trim() : ""
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ success: true })
    }

    const token = crypto.randomBytes(32).toString("hex")
    const expires = new Date(Date.now() + 3600000)

    await prisma.verificationToken.create({
      data: {
        identifier: `reset:${email}`,
        token,
        expires,
      },
    })

    const locale = "en"
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/${locale}/reset-password?token=${token}&email=${encodeURIComponent(email)}`

    sendPasswordResetEmail(email, user.name || "User", resetUrl).catch(() => {})

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: true })
  }
}
