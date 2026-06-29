import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
export const dynamic = "force-dynamic"
export async function GET() {
  try {
    const token = await prisma.verificationToken.findFirst({
      where: { identifier: "verify:hamadyare55@gmail.com" },
      select: { token: true, expires: true },
    })
    return NextResponse.json({ token })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error" }, { status: 500 })
  }
}
