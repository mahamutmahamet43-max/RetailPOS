import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const dbSessions = await prisma.session.findMany({
      where: { userId: session.user.id },
      orderBy: { expires: "desc" },
    })

    return NextResponse.json({ sessions: dbSessions })
  } catch (error) {
    logger.error("GET /api/settings/sessions error", error instanceof Error ? error : undefined)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
