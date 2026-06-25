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

    const totalCustomers = await prisma.customer.count({
      where: { storeId: store.id },
    })

    const allCustomersWithSales = await prisma.customer.findMany({
      where: { storeId: store.id },
      include: {
        sales: {
          where: { status: "COMPLETED" },
          select: { total: true, id: true },
        },
      },
    })

    const customersWithOrders = allCustomersWithSales.filter(
      (c) => c.sales.length > 0
    )
    const newCustomers = allCustomersWithSales.length
    const returningCustomers = customersWithOrders.length

    const topCustomers = customersWithOrders
      .map((c) => ({
        id: c.id,
        name: `${c.firstName} ${c.lastName || ""}`.trim(),
        phone: c.phone,
        totalOrders: c.sales.length,
        totalSpent: c.sales.reduce((sum, s) => sum + s.total, 0),
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 20)

    return NextResponse.json({
      totalCustomers,
      newCustomers,
      returningCustomers,
      topCustomers,
    })
  } catch (error) {
    logger.error("GET /api/reports/customers error", error instanceof Error ? error : undefined)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
