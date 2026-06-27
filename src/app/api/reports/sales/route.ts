import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentStore, noStoreResponse } from "@/lib/store"
import { requireRole } from "@/lib/role"
import { logger } from "@/lib/logger"

function getDateRange(filter: string, from?: string, to?: string) {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (filter) {
    case "today":
      return { gte: todayStart, lt: new Date(todayStart.getTime() + 86400000) }
    case "yesterday": {
      const yesterday = new Date(todayStart.getTime() - 86400000)
      return { gte: yesterday, lt: todayStart }
    }
    case "this_week": {
      const weekStart = new Date(todayStart.getTime() - todayStart.getDay() * 86400000)
      return { gte: weekStart }
    }
    case "this_month": {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      return { gte: monthStart }
    }
    case "custom": {
      const dateFilter: Record<string, Date> = {}
      if (from) dateFilter.gte = new Date(from)
      if (to) dateFilter.lte = new Date(to + "T23:59:59.999Z")
      return dateFilter
    }
    default:
      return {}
  }
}

export async function GET(request: Request) {
  try {
    const auth = await requireRole("OWNER", "MANAGER")
    if (auth instanceof NextResponse) return auth

    const store = await getCurrentStore()
    if (!store) return noStoreResponse()
const { searchParams } = new URL(request.url)
    const filter = searchParams.get("filter") || "this_month"
    const from = searchParams.get("from") || ""
    const to = searchParams.get("to") || ""
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    const dateFilter = getDateRange(filter, from, to)
    const whereBase = { storeId: store.id, status: "COMPLETED" as const }
    const where = { ...whereBase, createdAt: dateFilter }

    const [grossSales, totalOrders, paymentBreakdown] = await Promise.all([
      prisma.sale.aggregate({
        where,
        _sum: { subtotal: true, discount: true, tax: true, total: true },
        _count: true,
      }),
      prisma.sale.count({ where }),
      prisma.sale.groupBy({
        by: ["paymentMethod"],
        where,
        _sum: { total: true, amountPaid: true },
        _count: true,
      }),
    ])

    const gross = grossSales._sum.subtotal || 0
    const totalDisc = grossSales._sum.discount || 0
    const totalTax = grossSales._sum.tax || 0
    const net = grossSales._sum.total || 0
    const orders = grossSales._count
    const avgOrder = orders > 0 ? net / orders : 0

    const items = await prisma.saleItem.aggregate({
      where: { sale: where },
      _sum: { costPrice: true },
    })
    const totalCost = items._sum.costPrice || 0
    const profit = Math.max(0, net - totalCost)

    const sales = await prisma.sale.findMany({
      where,
      include: {
        items: { select: { productName: true, quantity: true, unitPrice: true, total: true } },
        customer: { select: { firstName: true, lastName: true } },
        cashier: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    })

    const methods = paymentBreakdown.map((m) => ({
      method: m.paymentMethod,
      total: m._sum.total || 0,
      count: m._count,
    }))

    return NextResponse.json({
      grossSales: gross,
      netSales: net,
      totalOrders: orders,
      averageOrderValue: avgOrder,
      discounts: totalDisc,
      taxes: totalTax,
      profit,
      paymentMethods: methods,
      sales,
      page,
      limit,
      totalPages: Math.ceil(totalOrders / limit),
    })
  } catch (error) {
    if (error instanceof Error && (error.message === "No store found" || error.message === "Unauthorized")) {       return NextResponse.json({ error: error.message }, { status: error.message === "Unauthorized" ? 401 : 404 })     }     logger.error("GET /api/reports/sales error", error instanceof Error ? error : undefined)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
