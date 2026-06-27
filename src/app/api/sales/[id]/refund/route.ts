import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentStore, noStoreResponse } from "@/lib/store"
import { logger } from "@/lib/logger"
import { requireRole } from "@/lib/role"
import { z } from "zod"

const refundItemSchema = z.object({
  itemId: z.string().min(1),
  quantity: z.number().int().positive(),
})

const refundSchema = z.object({
  items: z.array(refundItemSchema).min(1),
})

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole("OWNER", "MANAGER")
    if (auth instanceof NextResponse) return auth

    const store = await getCurrentStore()
    if (!store) return noStoreResponse()
    const { id } = await params

    const body = await _request.json()
    const validation = refundSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues.map((e) => e.message).join(", ") },
        { status: 400 }
      )
    }
    const { items: refundItems } = validation.data

    const sale = await prisma.sale.findFirst({
      where: { id, storeId: store.id },
      include: { items: true },
    })

    if (!sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 })
    }

    if (sale.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Only completed sales can be refunded" },
        { status: 400 }
      )
    }

    for (const refundItem of refundItems) {
      const saleItem = sale.items.find((i) => i.id === refundItem.itemId)
      if (!saleItem) {
        return NextResponse.json(
          { error: `Sale item ${refundItem.itemId} not found` },
          { status: 404 }
        )
      }
      const availableToRefund = saleItem.quantity - saleItem.returnedQuantity
      if (refundItem.quantity > availableToRefund) {
        return NextResponse.json(
          { error: `Cannot refund ${refundItem.quantity} of "${saleItem.productName}", only ${availableToRefund} available` },
          { status: 400 }
        )
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      for (const refundItem of refundItems) {
        const saleItem = sale.items.find((i) => i.id === refundItem.itemId)!

        await tx.saleItem.update({
          where: { id: refundItem.itemId },
          data: { returnedQuantity: { increment: refundItem.quantity } },
        })

        const product = await tx.product.findUnique({
          where: { id: saleItem.productId },
        })

        if (product) {
          const baseQuantity = Math.round(refundItem.quantity * saleItem.unitConversionFactor)
          const newStock = product.stockQuantity + baseQuantity

          await tx.product.update({
            where: { id: saleItem.productId },
            data: { stockQuantity: newStock },
          })

          await tx.inventoryTransaction.create({
            data: {
              transactionType: "IN",
              quantity: baseQuantity,
              previousStock: product.stockQuantity,
              newStock,
              reason: `Refund from sale #${sale.saleNumber}`,
              storeId: store.id,
              productId: saleItem.productId,
              createdBy: auth.userId,
            },
          })
        }
      }

      const allItems = await tx.saleItem.findMany({ where: { saleId: id } })
      const fullyReturned = allItems.every(
        (item) => item.returnedQuantity >= item.quantity
      )

      return tx.sale.update({
        where: { id },
        data: { status: fullyReturned ? "REFUNDED" : "COMPLETED" },
        include: {
          items: true,
          customer: { select: { id: true, firstName: true, lastName: true } },
          cashier: { select: { id: true, name: true } },
        },
      })
    })

    return NextResponse.json(updated)
  } catch (error) {
    logger.error("POST /api/sales/[id]/refund error", error instanceof Error ? error : undefined)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
