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
    if (!setting?.enablePharmacyModule) {
      return NextResponse.json({ error: "Pharmacy module not enabled" }, { status: 403 })
    }

    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1)

    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

    const [
      todaySalesAgg,
      totalMedicines,
      allStockedProducts,
      outOfStockMedicines,
      expiredBatches,
      expiringSoonBatches,
      todayPurchasesAgg,
      recentSales,
      recentExpiredItems,
    ] = await Promise.all([
      prisma.sale.aggregate({
        where: {
          storeId: store.id,
          createdAt: { gte: startOfDay, lte: endOfDay },
          status: "COMPLETED",
        },
        _count: { id: true },
        _sum: { total: true },
      }),
      prisma.product.count({
        where: { storeId: store.id, form: { not: null } },
      }),
      prisma.product.findMany({
        where: {
          storeId: store.id,
          stockQuantity: { gt: 0 },
          minimumStock: { gt: 0 },
        },
        select: { stockQuantity: true, minimumStock: true },
      }),
      prisma.product.count({
        where: { storeId: store.id, stockQuantity: { lte: 0 } },
      }),
      prisma.medicineBatch.count({
        where: {
          expiryDate: { lt: now },
          quantity: { gt: 0 },
          product: { storeId: store.id },
        },
      }),
      prisma.medicineBatch.count({
        where: {
          expiryDate: { gte: now, lte: thirtyDaysFromNow },
          quantity: { gt: 0 },
          product: { storeId: store.id },
        },
      }),
      prisma.purchase.aggregate({
        where: {
          storeId: store.id,
          createdAt: { gte: startOfDay, lte: endOfDay },
          status: "COMPLETED",
        },
        _count: { id: true },
        _sum: { totalAmount: true },
      }),
      prisma.sale.findMany({
        where: { storeId: store.id, status: "COMPLETED" },
        include: {
          items: {
            select: { id: true, productName: true, quantity: true, total: true },
          },
          customer: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.medicineBatch.findMany({
        where: {
          expiryDate: { lt: now },
          quantity: { gt: 0 },
          product: { storeId: store.id },
        },
        include: {
          product: {
            select: { id: true, name: true },
          },
        },
        orderBy: { expiryDate: "desc" },
        take: 5,
      }),
    ])

    const lowStockMedicines = allStockedProducts.filter(
      (p) => p.stockQuantity <= p.minimumStock
    ).length

    return NextResponse.json({
      todaySales: {
        count: todaySalesAgg._count.id,
        total: todaySalesAgg._sum.total ?? 0,
      },
      totalMedicines,
      lowStockMedicines,
      outOfStockMedicines,
      expiredBatches,
      expiringSoonBatches,
      todayPurchases: {
        count: todayPurchasesAgg._count.id,
        total: todayPurchasesAgg._sum.totalAmount ?? 0,
      },
      recentSales,
      recentExpiredItems,
    })
  } catch (error) {
    logger.error("GET /api/pharmacy/dashboard error", error instanceof Error ? error : undefined)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
