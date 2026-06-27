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
    })
    if (!store) {
      return NextResponse.json({ error: "No store found" }, { status: 404 })
    }

    const setting = await prisma.storeSetting.findUnique({
      where: { storeId: store.id },
    })

    return NextResponse.json({ enabled: setting?.enablePharmacyModule ?? false })
  } catch (error) {
    logger.error("GET /api/pharmacy/settings error", error instanceof Error ? error : undefined)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userRole = (session.user as { role?: string }).role
    if (userRole !== "OWNER") {
      return NextResponse.json({ error: "Forbidden: only the store owner can update pharmacy settings" }, { status: 403 })
    }

    const store = await prisma.store.findFirst({
      where: { ownerId: session.user.id },
    })
    if (!store) {
      return NextResponse.json({ error: "No store found" }, { status: 404 })
    }

    const setting = await prisma.storeSetting.findUnique({
      where: { storeId: store.id },
    })

    const updated = await prisma.storeSetting.upsert({
      where: { storeId: store.id },
      create: {
        storeId: store.id,
        enablePharmacyModule: true,
      },
      update: {
        enablePharmacyModule: !(setting?.enablePharmacyModule ?? false),
      },
    })

    return NextResponse.json({ enabled: updated.enablePharmacyModule })
  } catch (error) {
    logger.error("PUT /api/pharmacy/settings error", error instanceof Error ? error : undefined)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
