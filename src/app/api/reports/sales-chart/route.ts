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
    const now = new Date()

    const thirtyDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29)
    const thirtyDaysStart = new Date(thirtyDaysAgo.getFullYear(), thirtyDaysAgo.getMonth(), thirtyDaysAgo.getDate())

    const sales = await prisma.sale.findMany({
      where: {
        storeId: store.id,
        status: "COMPLETED",
        createdAt: { gte: thirtyDaysStart },
      },
      select: { total: true, createdAt: true },
    })

    const dayTotals = new Map<string, number>()
    for (let i = 29; i >= 0; i--) {
      const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
      const key = day.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      dayTotals.set(key, 0)
    }

    for (const sale of sales) {
      const key = new Date(sale.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
      dayTotals.set(key, (dayTotals.get(key) || 0) + sale.total)
    }

    const entries = Array.from(dayTotals.entries())
    const sevenDays = entries.slice(-7).map(([date, total]) => ({ date, total }))
    const thirtyDays = entries.map(([date, total]) => ({ date, total }))

    return NextResponse.json({ sevenDays, thirtyDays })
  } catch (error) {
    logger.error("GET /api/reports/sales-chart error", error instanceof Error ? error : undefined)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
