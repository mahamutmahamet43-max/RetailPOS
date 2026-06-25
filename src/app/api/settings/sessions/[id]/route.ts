import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const dbSession = await prisma.session.findUnique({ where: { id } })
    if (!dbSession || dbSession.userId !== session.user.id) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    await prisma.session.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error("DELETE /api/settings/sessions/[id] error", error instanceof Error ? error : undefined)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
