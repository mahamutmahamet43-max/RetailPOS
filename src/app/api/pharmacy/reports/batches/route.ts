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

    const batches = await prisma.medicineBatch.findMany({
      where: { product: { storeId: store.id } },
      select: {
        id: true,
        batchNumber: true,
        expiryDate: true,
        quantity: true,
        purchasePrice: true,
        sellingPrice: true,
        product: { select: { name: true } },
      },
      orderBy: [{ expiryDate: "asc" }, { createdAt: "desc" }],
    })

    return NextResponse.json({ batches })
  } catch (error) {
    logger.error("GET /api/pharmacy/reports/batches", error instanceof Error ? error : undefined)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
