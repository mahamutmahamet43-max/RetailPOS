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
    const storeId = store.id

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(todayStart.getTime() + 86400000)

    const weekAgo = new Date(todayStart.getTime() - 6 * 86400000)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const [todaySales, weeklySales, monthlySales, totalRevenue, totalCustomers, totalProducts, lowStock, outOfStock] =
      await Promise.all([
        prisma.sale.aggregate({
          where: {
            storeId,
            status: "COMPLETED",
            createdAt: { gte: todayStart, lt: todayEnd },
          },
          _sum: { total: true },
          _count: true,
        }),
        prisma.sale.aggregate({
          where: {
            storeId,
            status: "COMPLETED",
            createdAt: { gte: weekAgo },
          },
          _sum: { total: true },
          _count: true,
        }),
        prisma.sale.aggregate({
          where: {
            storeId,
            status: "COMPLETED",
            createdAt: { gte: monthStart },
          },
          _sum: { total: true },
        }),
        prisma.sale.aggregate({
          where: { storeId, status: "COMPLETED" },
          _sum: { amountPaid: true },
        }),
        prisma.customer.count({ where: { storeId } }),
        prisma.product.count({ where: { storeId } }),
        prisma.product.findMany({
          where: { storeId },
          select: { stockQuantity: true, minimumStock: true },
        }).then((products) => products.filter((p) => p.minimumStock > 0 && p.stockQuantity > 0 && p.stockQuantity <= p.minimumStock).length),
        prisma.product.count({ where: { storeId, stockQuantity: 0 } }),
      ])

    const todaySaleItems = await prisma.saleItem.findMany({
      where: { sale: { storeId, status: "COMPLETED", createdAt: { gte: todayStart, lt: todayEnd } } },
      select: { costPrice: true, quantity: true, returnedQuantity: true },
    })
    const dailyCOGS = todaySaleItems.reduce((sum, item) => sum + (item.costPrice || 0) * (item.quantity - (item.returnedQuantity || 0)), 0)

    const weeklySaleItems = await prisma.saleItem.findMany({
      where: { sale: { storeId, status: "COMPLETED", createdAt: { gte: weekAgo } } },
      select: { costPrice: true, quantity: true, returnedQuantity: true },
    })
    const weeklyCOGS = weeklySaleItems.reduce((sum, item) => sum + (item.costPrice || 0) * (item.quantity - (item.returnedQuantity || 0)), 0)

    const monthlySaleItems = await prisma.saleItem.findMany({
      where: { sale: { storeId, status: "COMPLETED", createdAt: { gte: monthStart } } },
      select: { costPrice: true, quantity: true, returnedQuantity: true },
    })
    const monthlyCOGS = monthlySaleItems.reduce((sum, item) => sum + (item.costPrice || 0) * (item.quantity - (item.returnedQuantity || 0)), 0)

    const todayRevenue = todaySales._sum.total || 0
    const todayOrders = todaySales._count

    return NextResponse.json({
      todaySales: todayRevenue,
      todayProfit: todayRevenue - dailyCOGS,
      todayOrders,
      weeklySales: weeklySales._sum.total || 0,
      weeklyProfit: (weeklySales._sum.total || 0) - weeklyCOGS,
      weeklyOrders: weeklySales._count,
      monthlySales: monthlySales._sum.total || 0,
      monthlyProfit: (monthlySales._sum.total || 0) - monthlyCOGS,
      totalRevenue: totalRevenue._sum.amountPaid || 0,
      totalCustomers,
      totalProducts,
      lowStockProducts: lowStock,
      outOfStockProducts: outOfStock,
    })
  } catch (error) {
    logger.error("GET /api/reports/dashboard error", error instanceof Error ? error : undefined)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
