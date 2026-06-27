import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const store = await prisma.store.findFirst({ where: { ownerId: session.user.id } })
    if (!store) return NextResponse.json({ error: "No store found" }, { status: 404 })

    const setting = await prisma.storeSetting.findUnique({ where: { storeId: store.id } })
    if (!setting?.enablePharmacyModule) return NextResponse.json({ error: "Pharmacy module not enabled" }, { status: 403 })

    const products = await prisma.product.findMany({
      where: {
        storeId: store.id,
        form: { not: null },
        isActive: true,
        minimumStock: { gt: 0 },
        stockQuantity: { lte: 0 },
      },
      select: {
        id: true,
        name: true,
        stockQuantity: true,
        minimumStock: true,
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json({ products })
  } catch (error) {
    logger.error("GET /api/pharmacy/reports/low-stock", error instanceof Error ? error : undefined)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
