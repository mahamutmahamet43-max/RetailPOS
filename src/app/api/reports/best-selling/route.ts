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
    if (error instanceof Error && (error.message === "No store found" || error.message === "Unauthorized")) {       return NextResponse.json({ error: error.message }, { status: error.message === "Unauthorized" ? 401 : 404 })     }     logger.error("GET /api/reports/best-selling error", error instanceof Error ? error : undefined)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
