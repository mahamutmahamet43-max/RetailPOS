import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"
import { validateOrError, settingsProfileSchema } from "@/lib/api-validation"

export async function PUT(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validation = validateOrError(settingsProfileSchema, body)
    if (!validation.success) return validation.response

    const data: Record<string, string | null> = {}
    if (validation.data.name !== undefined) data.name = validation.data.name
    if (validation.data.email !== undefined) data.email = validation.data.email
    if (validation.data.image !== undefined) data.image = validation.data.image

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    if (validation.data.email && validation.data.email !== session.user.email) {
      const existing = await prisma.user.findUnique({ where: { email: validation.data.email } })
      if (existing) {
        return NextResponse.json({ error: "Email already in use" }, { status: 409 })
      }
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data,
      select: { id: true, name: true, email: true, image: true, role: true },
    })

    return NextResponse.json({ user })
  } catch (error) {
    logger.error("PUT /api/settings/profile error", error instanceof Error ? error : undefined)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
