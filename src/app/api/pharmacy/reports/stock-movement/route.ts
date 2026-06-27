import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const store = await prisma.store.findFirst({ where: { ownerId: session.user.id } })
    if (!store) return NextResponse.json({ error: "No store found" }, { status: 404 })

    const setting = await prisma.storeSetting.findUnique({ where: { storeId: store.id } })
    if (!setting?.enablePharmacyModule) return NextResponse.json({ error: "Pharmacy module not enabled" }, { status: 403 })

    const movements = await prisma.inventoryTransaction.findMany({
      where: {
        storeId: store.id,
        product: { form: { not: null } },
      },
      select: {
        id: true,
        quantity: true,
        transactionType: true,
        reason: true,
        createdAt: true,
        product: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    })

    const mapped = movements.map((m) => ({
      id: m.id,
      product: { name: m.product.name },
      quantity: m.transactionType === "OUT" ? -m.quantity : m.transactionType === "ADJUSTMENT" ? -m.quantity : m.quantity,
      type: m.transactionType,
      reference: m.reason,
      createdAt: m.createdAt.toISOString(),
    }))

    return NextResponse.json({ movements: mapped })
  } catch (error) {
    logger.error("GET /api/pharmacy/reports/stock-movement", error instanceof Error ? error : undefined)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
