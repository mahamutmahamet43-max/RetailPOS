import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import { validateOrError, settingsPasswordSchema } from "@/lib/api-validation"

export async function PUT(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validation = validateOrError(settingsPasswordSchema, body)
    if (!validation.success) return validation.response

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    })

    if (!user?.passwordHash) {
      return NextResponse.json({ error: "Cannot change password for this account" }, { status: 400 })
    }

    const isValid = await bcrypt.compare(validation.data.currentPassword, user.passwordHash)
    if (!isValid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(validation.data.newPassword, 12)
    await prisma.user.update({
      where: { id: session.user.id },
      data: { passwordHash },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error("PUT /api/settings/password error", error instanceof Error ? error : undefined)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
