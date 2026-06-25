import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentStore } from "@/lib/store"
import { requireRole } from "@/lib/role"
import { logger } from "@/lib/logger"

export async function GET() {
  try {
    const auth = await requireRole("OWNER", "MANAGER")
    if (auth instanceof NextResponse) return auth

    const store = await getCurrentStore()

    const items = await prisma.saleItem.groupBy({
      by: ["productId", "productName"],
      where: { sale: { storeId: store.id, status: "COMPLETED" } },
      _sum: { quantity: true, total: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 10,
    })

    const products = items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      quantitySold: item._sum.quantity || 0,
      revenue: item._sum.total || 0,
    }))

    return NextResponse.json({ products })
  } catch (error) {
    logger.error("GET /api/reports/best-selling error", error instanceof Error ? error : undefined)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
