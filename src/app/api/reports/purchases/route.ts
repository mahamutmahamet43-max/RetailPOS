import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentStore, noStoreResponse } from "@/lib/store"
import { logger } from "@/lib/logger"
import { requireRole } from "@/lib/role"

export async function GET(request: Request) {
  try {
    const auth = await requireRole("OWNER", "MANAGER")
    if (auth instanceof NextResponse) return auth

    const store = await getCurrentStore()
    if (!store) return noStoreResponse()
    const { searchParams } = new URL(request.url)
    const from = searchParams.get("from") || ""
    const to = searchParams.get("to") || ""

    const dateFilter: Record<string, Date> = {}
    if (from) dateFilter.gte = new Date(from)
    if (to) dateFilter.lte = new Date(to + "T23:59:59.999Z")

    const where = {
      storeId: store.id,
      ...(from || to ? { createdAt: dateFilter } : {}),
    }

    const [totalPurchases, completedPurchases, cancelledPurchases, totalSpent, recentPurchases] =
      await Promise.all([
        prisma.purchase.count({ where }),
        prisma.purchase.count({ where: { ...where, status: "COMPLETED" } }),
        prisma.purchase.count({ where: { ...where, status: "CANCELLED" } }),
        prisma.purchase.aggregate({
          where: { ...where, status: "COMPLETED" },
          _sum: { total: true },
        }),
        prisma.purchase.findMany({
          where: { ...where, status: "COMPLETED" },
          orderBy: { createdAt: "desc" },
          take: 50,
          include: { items: true, supplier: { select: { id: true, name: true } } },
        }),
      ])

    const topProducts: Record<string, { name: string; quantity: number; total: number }> = {}
    for (const purchase of recentPurchases) {
      for (const item of purchase.items) {
        const itemTotal = item.quantity * item.costPrice
        if (topProducts[item.productId]) {
          topProducts[item.productId].quantity += item.quantity
          topProducts[item.productId].total += itemTotal
        } else {
          topProducts[item.productId] = { name: item.productName, quantity: item.quantity, total: itemTotal }
        }
      }
    }
    const topPurchasedProducts = Object.entries(topProducts)
      .map(([productId, data]) => ({ productId, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)

    return NextResponse.json({
      totalPurchases,
      completedPurchases,
      cancelledPurchases,
      totalSpent: totalSpent._sum.total || 0,
      topPurchasedProducts,
      recentPurchases: recentPurchases.map((p) => ({
        id: p.id,
        invoiceNumber: p.invoiceNumber,
        supplierName: p.supplier?.name || p.supplierName,
        total: p.total,
        status: p.status,
        createdAt: p.createdAt,
        itemCount: p.items.length,
      })),
    })
  } catch (error) {
    logger.error("GET /api/reports/purchases error", error instanceof Error ? error : undefined)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
