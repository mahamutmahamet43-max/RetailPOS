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
const storeId = store.id

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(todayStart.getTime() + 86400000)

    const weekAgo = new Date(todayStart.getTime() - 6 * 86400000)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const [todaySales, weeklySales, monthlySales, totalRevenue, totalCustomers, totalProducts, lowStock, outOfStock, outstandingCredit, customersWithDebt, todayCreditSales, recentPayments] =
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
          _sum: { total: true },
        }),
        prisma.customer.count({ where: { storeId } }),
        prisma.product.count({ where: { storeId } }),
        prisma.product.findMany({
          where: { storeId },
          select: { stockQuantity: true, minimumStock: true },
        }).then((products) => products.filter((p) => p.minimumStock > 0 && p.stockQuantity > 0 && p.stockQuantity <= p.minimumStock).length),
        prisma.product.count({ where: { storeId, stockQuantity: 0 } }),
        prisma.customer.aggregate({
          where: { storeId },
          _sum: { currentBalance: true },
        }),
        prisma.customer.count({
          where: { storeId, currentBalance: { gt: 0 } },
        }),
        prisma.sale.aggregate({
          where: {
            storeId,
            paymentMethod: "CREDIT",
            status: "COMPLETED",
            createdAt: { gte: todayStart, lt: todayEnd },
          },
          _sum: { total: true },
        }),
        prisma.customerPayment.findMany({
          where: { storeId },
          orderBy: { createdAt: "desc" },
          take: 5,
          include: {
            customer: { select: { firstName: true, lastName: true } },
          },
        }),
      ])

    const todaySalesItems = await prisma.saleItem.aggregate({
      where: {
        sale: { storeId, status: "COMPLETED", createdAt: { gte: todayStart, lt: todayEnd } },
      },
      _sum: { quantity: true, costPrice: true },
    })

    const todayCost = todaySalesItems._sum.costPrice || 0
    const todayRevenue = todaySales._sum.total || 0
    const todayOrders = todaySales._count
    const todayProfit = todayRevenue - todayCost

    return NextResponse.json({
      todaySales: todayRevenue,
      todayProfit: Math.max(0, todayProfit),
      todayOrders,
      weeklySales: weeklySales._sum.total || 0,
      weeklyOrders: weeklySales._count,
      monthlySales: monthlySales._sum.total || 0,
      totalRevenue: totalRevenue._sum.total || 0,
      totalCustomers,
      totalProducts,
      lowStockProducts: lowStock,
      outOfStockProducts: outOfStock,
      outstandingCredit: outstandingCredit._sum.currentBalance || 0,
      customersWithDebt,
      todayCreditSales: todayCreditSales._sum.total || 0,
      recentPayments: recentPayments.map((p) => ({
        id: p.id,
        amount: p.amount,
        paymentMethod: p.paymentMethod,
        createdAt: p.createdAt,
        customer: p.customer,
      })),
    })
  } catch (error) {
    if (error instanceof Error && (error.message === "No store found" || error.message === "Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: error.message === "Unauthorized" ? 401 : 404 })
    }
    logger.error("GET /api/reports/dashboard error", error instanceof Error ? error : undefined)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
