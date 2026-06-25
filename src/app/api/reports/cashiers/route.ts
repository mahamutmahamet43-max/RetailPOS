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

    const cashierStats = await prisma.sale.groupBy({
      by: ["cashierId"],
      where: { storeId: store.id, status: "COMPLETED" },
      _sum: { total: true, subtotal: true },
      _count: true,
    })

    const cashierIds = cashierStats.map((c) => c.cashierId)
    const cashiers = await prisma.user.findMany({
      where: { id: { in: cashierIds } },
      select: { id: true, name: true },
    })

    const cashierMap = new Map(cashiers.map((c) => [c.id, c.name || "Unknown"]))

    const result = await Promise.all(
      cashierStats.map(async (stat) => {
        const totalSales = stat._sum.total || 0
        const orders = stat._count
        const avgOrder = orders > 0 ? totalSales / orders : 0

        const items = await prisma.saleItem.aggregate({
          where: {
            sale: {
              storeId: store.id,
              status: "COMPLETED",
              cashierId: stat.cashierId,
            },
          },
          _sum: { costPrice: true },
        })
        const cost = items._sum.costPrice || 0
        const profit = Math.max(0, totalSales - cost)

        return {
          cashierId: stat.cashierId,
          cashierName: cashierMap.get(stat.cashierId) || "Unknown",
          orders,
          sales: totalSales,
          profit,
          averageOrderValue: avgOrder,
        }
      })
    )

    result.sort((a, b) => b.sales - a.sales)

    return NextResponse.json({ cashiers: result })
  } catch (error) {
    logger.error("GET /api/reports/cashiers error", error instanceof Error ? error : undefined)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
