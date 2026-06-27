import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getCurrentStore, noStoreResponse } from "@/lib/store"
import { logger } from "@/lib/logger"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const store = await getCurrentStore()
    if (!store) return noStoreResponse()
    const { id } = await params

    const transaction = await prisma.inventoryTransaction.findFirst({
      where: { id, storeId: store.id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            barcode: true,
            image: true,
            stockQuantity: true,
            minimumStock: true,
            costPrice: true,
            sellingPrice: true,
            unit: true,
          },
        },
        creator: { select: { id: true, name: true } },
      },
    })

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(transaction)
  } catch (error) {
    logger.error("GET /api/inventory/[id] error", error instanceof Error ? error : undefined)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
