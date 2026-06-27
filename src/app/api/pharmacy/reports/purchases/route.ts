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

    const purchases = await prisma.purchase.findMany({
      where: { storeId: store.id },
      select: {
        id: true,
        purchaseNumber: true,
        supplierName: true,
        totalAmount: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    })

    const mapped = purchases.map((p) => ({
      id: p.id,
      purchaseNumber: p.purchaseNumber,
      supplierName: p.supplierName,
      purchaseDate: p.createdAt.toISOString(),
      totalAmount: p.totalAmount,
      status: p.status.toLowerCase(),
    }))

    return NextResponse.json({ purchases: mapped })
  } catch (error) {
    logger.error("GET /api/pharmacy/reports/purchases", error instanceof Error ? error : undefined)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
