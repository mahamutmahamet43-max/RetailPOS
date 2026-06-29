import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const token = body.token as string
    const email = typeof body.email === "string" ? body.email.toLowerCase().trim() : ""
    if (!token || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const record = await prisma.verificationToken.findFirst({
      where: {
        identifier: `verify:${email}`,
        token,
        expires: { gt: new Date() },
      },
    })

    if (!record) {
      return NextResponse.json(
        { error: "Invalid or expired verification link" },
        { status: 400 }
      )
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { email },
        data: { emailVerified: new Date() },
      }),
      prisma.verificationToken.deleteMany({
        where: { identifier: `verify:${email}` },
      }),
    ])

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 }
    )
  }
}
