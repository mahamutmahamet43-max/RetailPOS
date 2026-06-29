import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
export const dynamic = "force-dynamic"
export async function GET() {
  try {
    const verifyToken = await prisma.verificationToken.findFirst({
      where: { identifier: "verify:hamadyare55@gmail.com" },
      select: { token: true, expires: true },
    })
    const resetToken = await prisma.verificationToken.findFirst({
      where: { identifier: { contains: "reset:hamadyare55@gmail.com" } },
      select: { token: true, expires: true, identifier: true },
    })
    return NextResponse.json({ verifyToken, resetToken })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error" }, { status: 500 })
  }
}
