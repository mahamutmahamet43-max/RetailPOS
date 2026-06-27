import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentStore, noStoreResponse } from "@/lib/store"
import { requireRole } from "@/lib/role"
import { logger } from "@/lib/logger"

export async function GET() {
  try {
    const auth = await requireRole("OWNER", "MANAGER")
    if (auth instanceof NextResponse) return auth

    const store = await getCurrentStore()
    if (!store) return noStoreResponse()
const products = await prisma.product.findMany({
      where: { storeId: store.id },
      include: { category: { select: { name: true } } },
      orderBy: { name: "asc" },
    })

    let totalCost = 0
    let totalRetail = 0
    let lowStockCount = 0
    let outOfStockCount = 0

    const productRows = products.map((p) => {
      const costValue = (p.costPrice || 0) * p.stockQuantity
      const retailValue = p.sellingPrice * p.stockQuantity
      totalCost += costValue
      totalRetail += retailValue
      if (p.stockQuantity === 0) outOfStockCount++
      else if (p.minimumStock > 0 && p.stockQuantity <= p.minimumStock) lowStockCount++

      return {
        id: p.id,
        barcode: p.barcode,
        name: p.name,
        category: p.category.name,
        stock: p.stockQuantity,
        minimumStock: p.minimumStock,
        costPrice: p.costPrice || 0,
        sellingPrice: p.sellingPrice,
        inventoryValue: costValue,
      }
    })

    return NextResponse.json({
      inventoryCostValue: totalCost,
      retailValue: totalRetail,
      expectedProfit: totalRetail - totalCost,
      lowStockCount,
      outOfStockCount,
      products: productRows,
    })
  } catch (error) {
    if (error instanceof Error && (error.message === "No store found" || error.message === "Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: error.message === "Unauthorized" ? 401 : 404 })
    }
    logger.error("GET /api/reports/inventory error", error instanceof Error ? error : undefined)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
