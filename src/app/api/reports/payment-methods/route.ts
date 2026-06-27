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
const breakdown = await prisma.sale.groupBy({
      by: ["paymentMethod"],
      where: { storeId: store.id, status: "COMPLETED" },
      _sum: { total: true },
      _count: true,
    })

    const methods = breakdown.map((m) => ({
      method: m.paymentMethod,
      total: m._sum.total || 0,
      count: m._count,
    }))

    return NextResponse.json({ methods })
  } catch (error) {
    if (error instanceof Error && (error.message === "No store found" || error.message === "Unauthorized")) {       return NextResponse.json({ error: error.message }, { status: error.message === "Unauthorized" ? 401 : 404 })     }     logger.error("GET /api/reports/payment-methods error", error instanceof Error ? error : undefined)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
