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

    const store = await prisma.store.findFirst({
      where: { ownerId: session.user.id },
      select: {
        name: true,
        description: true,
        settings: {
          select: {
            address: true,
            phone: true,
            email: true,
            currency: true,
            timezone: true,
            dateFormat: true,
            logoUrl: true,
            lowStockAlert: true,
            salesNotification: true,
            emailNotification: true,
            twoFactorEnabled: true,
            enablePharmacyModule: true,
          },
        },
      },
    })

    if (!store) {
      return NextResponse.json({ error: "No store found" }, { status: 404 })
    }

    return NextResponse.json({
      name: store.name,
      description: store.description,
      settings: store.settings || {},
    })
  } catch (error) {
    logger.error("GET /api/settings/store error", error instanceof Error ? error : undefined)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    const store = await prisma.store.findFirst({
      where: { ownerId: session.user.id },
    })

    if (!store) {
      return NextResponse.json({ error: "No store found" }, { status: 404 })
    }

    if (body.name) {
      await prisma.store.update({
        where: { id: store.id },
        data: { name: body.name },
      })
    }

    const stringFields = ["address", "phone", "email", "currency", "timezone", "dateFormat", "logoUrl"] as const
    const boolFields = ["lowStockAlert", "salesNotification", "emailNotification", "twoFactorEnabled", "enablePharmacyModule"] as const

    const settingsData: Record<string, unknown> = {}
    for (const field of stringFields) {
      if (body[field] !== undefined) settingsData[field] = String(body[field])
    }
    for (const field of boolFields) {
      if (body[field] !== undefined) settingsData[field] = Boolean(body[field])
    }

    if (Object.keys(settingsData).length > 0) {
      await prisma.storeSetting.upsert({
        where: { storeId: store.id },
        create: { storeId: store.id, ...settingsData } as any,
        update: settingsData,
      })
    }

    const updated = await prisma.store.findUnique({
      where: { id: store.id },
      select: {
        name: true,
        description: true,
        settings: {
          select: {
            address: true,
            phone: true,
            email: true,
            currency: true,
            timezone: true,
            dateFormat: true,
            logoUrl: true,
            lowStockAlert: true,
            salesNotification: true,
            emailNotification: true,
            twoFactorEnabled: true,
            enablePharmacyModule: true,
          },
        },
      },
    })

    return NextResponse.json({
      name: updated?.name,
      description: updated?.description,
      settings: updated?.settings || {},
    })
  } catch (error) {
    logger.error("PUT /api/settings/store error", error instanceof Error ? error : undefined)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
