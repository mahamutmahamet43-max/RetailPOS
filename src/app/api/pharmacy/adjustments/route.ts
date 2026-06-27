import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const store = await prisma.store.findFirst({
      where: { ownerId: session.user.id },
    })
    if (!store) {
      return NextResponse.json({ error: "No store found" }, { status: 404 })
    }

    const setting = await prisma.storeSetting.findUnique({
      where: { storeId: store.id },
    })
    if (!setting?.enablePharmacyModule) {
      return NextResponse.json({ error: "Pharmacy module not enabled" }, { status: 403 })
    }

    const body = await request.json()
    const { productId, quantity, reason, notes } = body

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 })
    }

    if (quantity == null || typeof quantity !== "number" || quantity === 0) {
      return NextResponse.json({ error: "Quantity must be a non-zero number" }, { status: 400 })
    }

    if (!reason || !["DAMAGED", "EXPIRED", "STOLEN", "LOST", "CORRECTION"].includes(reason)) {
      return NextResponse.json({ error: "Reason must be one of: DAMAGED, EXPIRED, STOLEN, LOST, CORRECTION" }, { status: 400 })
    }

    const product = await prisma.product.findFirst({
      where: { id: productId, storeId: store.id },
    })
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    if (quantity < 0 && product.stockQuantity < Math.abs(quantity)) {
      return NextResponse.json(
        { error: `Insufficient stock. Available: ${product.stockQuantity}, trying to remove: ${Math.abs(quantity)}` },
        { status: 400 }
      )
    }

    const adjustment = await prisma.$transaction(async (tx) => {
      const previousStock = product.stockQuantity
      const newStock = previousStock + quantity

      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: { stockQuantity: Math.max(0, newStock) },
      })

      const transaction = await tx.inventoryTransaction.create({
        data: {
          transactionType: "ADJUSTMENT",
          quantity: Math.abs(quantity),
          previousStock,
          newStock: Math.max(0, newStock),
          reason: `${reason}${notes ? `: ${notes}` : ""}`,
          adjustmentReason: reason as any,
          storeId: store.id,
          productId,
          createdBy: session.user.id,
        },
      })

      return { product: updatedProduct, transaction }
    })

    logger.inventoryUpdated(productId, "ADJUSTMENT", quantity)

    return NextResponse.json(adjustment, { status: 201 })
  } catch (error) {
    logger.error("POST /api/pharmacy/adjustments error", error instanceof Error ? error : undefined)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
