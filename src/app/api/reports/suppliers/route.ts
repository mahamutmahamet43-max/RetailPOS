import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentStore, noStoreResponse } from "@/lib/store"
import { logger } from "@/lib/logger"
import { requireRole } from "@/lib/role"

export async function GET() {
  try {
    const auth = await requireRole("OWNER", "MANAGER")
    if (auth instanceof NextResponse) return auth

    const store = await getCurrentStore()
    if (!store) return noStoreResponse()

    const suppliers = await prisma.supplier.findMany({
      where: { storeId: store.id },
      include: {
        _count: { select: { purchases: true } },
        purchases: {
          where: { status: "COMPLETED" },
          select: { total: true, createdAt: true },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { name: "asc" },
    })

    const topSuppliers = suppliers
      .map((s) => ({
        id: s.id,
        name: s.name,
        phone: s.phone,
        totalPurchases: s._count.purchases,
        totalSpent: s.purchases.reduce((sum, p) => sum + p.total, 0),
        lastPurchase: s.purchases.length > 0 ? s.purchases[0].createdAt : null,
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 20)

    const totalSuppliers = suppliers.length
    const totalSpentAll = topSuppliers.reduce((sum, s) => sum + s.totalSpent, 0)

    return NextResponse.json({
      totalSuppliers,
      totalSpentAll,
      topSuppliers,
    })
  } catch (error) {
    logger.error("GET /api/reports/suppliers error", error instanceof Error ? error : undefined)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
