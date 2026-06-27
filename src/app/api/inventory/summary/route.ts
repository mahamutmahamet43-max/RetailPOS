import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getCurrentStore, noStoreResponse } from "@/lib/store"
import { logger } from "@/lib/logger"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const store = await getCurrentStore()
    if (!store) return noStoreResponse()
    const products = await prisma.product.findMany({
      where: { storeId: store.id },
      select: {
        id: true,
        stockQuantity: true,
        minimumStock: true,
        costPrice: true,
      },
    })

    const totalProducts = products.length
    const lowStockProducts = products.filter(
      (p) => p.minimumStock > 0 && p.stockQuantity > 0 && p.stockQuantity <= p.minimumStock
    ).length
    const outOfStockProducts = products.filter(
      (p) => p.stockQuantity === 0
    ).length
    const totalInventoryValue = products.reduce(
      (sum, p) => sum + (p.costPrice || 0) * p.stockQuantity,
      0
    )

    return NextResponse.json({
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      totalInventoryValue,
    })
  } catch (error) {
    logger.error("GET /api/inventory/summary error", error instanceof Error ? error : undefined)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
