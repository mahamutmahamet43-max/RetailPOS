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

    const items = await prisma.saleItem.findMany({
      where: { sale: { storeId: store.id } },
      select: {
        id: true,
        productName: true,
        quantity: true,
        unitPrice: true,
        total: true,
        sale: { select: { createdAt: true } },
      },
      orderBy: { sale: { createdAt: "desc" } },
      take: 500,
    })

    const mapped = items.map((i) => ({
      id: i.id,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      total: i.total,
      product: { name: i.productName },
      createdAt: i.sale.createdAt.toISOString(),
    }))

    return NextResponse.json({ sales: mapped })
  } catch (error) {
    logger.error("GET /api/pharmacy/reports/sales", error instanceof Error ? error : undefined)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
