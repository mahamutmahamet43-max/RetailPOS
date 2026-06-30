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

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const [
      customersWithDebt,
      totalOutstanding,
      totalCustomers,
      todayCreditSales,
      recentPayments,
    ] = await Promise.all([
      prisma.customer.count({
        where: { storeId: store.id, currentBalance: { gt: 0 } },
      }),
      prisma.customer.aggregate({
        where: { storeId: store.id },
        _sum: { currentBalance: true },
      }),
      prisma.customer.count({ where: { storeId: store.id, isActive: true } }),
      prisma.sale.aggregate({
        where: {
          storeId: store.id,
          paymentMethod: "CREDIT",
          status: "COMPLETED",
          createdAt: { gte: todayStart },
        },
        _sum: { total: true },
        _count: true,
      }),
      prisma.customerPayment.findMany({
        where: { storeId: store.id },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          customer: { select: { id: true, firstName: true, lastName: true } },
          cashier: { select: { name: true } },
        },
      }),
    ])

    const overdueCustomers = await prisma.customer.findMany({
      where: {
        storeId: store.id,
        currentBalance: { gt: 0 },
        isActive: true,
      },
      orderBy: { currentBalance: "desc" },
      include: {
        _count: { select: { sales: true } },
      },
    })

    const topDebtors = overdueCustomers.slice(0, 10).map((c) => ({
      id: c.id,
      name: `${c.firstName} ${c.lastName || ""}`.trim(),
      phone: c.phone,
      balance: c.currentBalance,
      creditLimit: c.creditLimit,
      totalSales: c._count.sales,
      lastPaymentDate: c.lastPaymentDate,
    }))

    return NextResponse.json({
      totalOutstanding: totalOutstanding._sum.currentBalance || 0,
      customersWithDebt,
      totalCustomers,
      todayCreditSales: todayCreditSales._sum.total || 0,
      todayCreditTransactions: todayCreditSales._count,
      recentPayments: recentPayments.map((p) => ({
        id: p.id,
        amount: p.amount,
        paymentMethod: p.paymentMethod,
        reference: p.reference,
        notes: p.notes,
        createdAt: p.createdAt,
        customer: p.customer,
        cashier: p.cashier,
      })),
      topDebtors,
      totalDebtors: overdueCustomers.length,
    })
  } catch (error) {
    logger.error("GET /api/reports/credit error", error instanceof Error ? error : undefined)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}