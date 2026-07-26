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
      include: {
        items: true,
        customer: { select: { id: true, firstName: true, lastName: true, currentBalance: true } },
      },
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

    const updated = await prisma.$transaction(async (tx) => {
      const currentSale = await tx.sale.findFirst({
        where: { id, storeId: store.id },
        select: { status: true },
      })
      if (!currentSale || currentSale.status !== "COMPLETED") {
        throw new Error("Sale is no longer available for refund")
      }

      const freshCustomer = sale.customerId ? await tx.customer.findUnique({
        where: { id: sale.customerId },
        select: { currentBalance: true },
      }) : null

      for (const refundItem of refundItems) {
        const saleItem = sale.items.find((i) => i.id === refundItem.itemId)
        if (!saleItem) {
          throw new Error(`Sale item ${refundItem.itemId} not found`)
        }

        const currentSaleItem = await tx.saleItem.findUnique({
          where: { id: refundItem.itemId },
        })
        if (!currentSaleItem) {
          throw new Error(`Sale item ${refundItem.itemId} not found`)
        }

        const availableToRefund = currentSaleItem.quantity - currentSaleItem.returnedQuantity
        if (refundItem.quantity > availableToRefund) {
          throw new Error(
            `Cannot refund ${refundItem.quantity} of "${saleItem.productName}", only ${availableToRefund} available`
          )
        }

        await tx.saleItem.update({
          where: { id: refundItem.itemId },
          data: { returnedQuantity: { increment: refundItem.quantity } },
        })

        const productBefore = await tx.product.findUnique({
          where: { id: saleItem.productId },
          select: { stockQuantity: true },
        })

        if (!productBefore) continue

        const baseQuantity = Math.round(refundItem.quantity * saleItem.unitConversionFactor)

        await tx.product.update({
          where: { id: saleItem.productId },
          data: { stockQuantity: { increment: baseQuantity } },
        })

        await tx.inventoryTransaction.create({
          data: {
            transactionType: "IN",
            quantity: baseQuantity,
            previousStock: productBefore.stockQuantity,
            newStock: productBefore.stockQuantity + baseQuantity,
            reason: `Sale ${sale.saleNumber} refund`,
            reference: sale.saleNumber,
            storeId: store.id,
            productId: saleItem.productId,
            createdBy: auth.userId,
          },
        })
      }

      if (sale.paymentMethod === "CREDIT" && sale.customerId) {
        const refundAmount = refundItems.reduce((sum, ri) => {
          const item = sale.items.find((si) => si.id === ri.itemId)
          return sum + (item ? item.unitPrice * ri.quantity : 0)
        }, 0)

        if (refundAmount > 0) {
          await tx.customer.update({
            where: { id: sale.customerId },
            data: {
              currentBalance: { decrement: Math.min(refundAmount, freshCustomer?.currentBalance || 0) },
              totalCreditSales: { decrement: refundAmount },
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
    if (error instanceof Error) {
      if (error.message === "Sale is no longer available for refund") {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      if (error.message.startsWith("Sale item") && error.message.endsWith("not found")) {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }
      if (error.message.startsWith("Cannot refund")) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
    }
    logger.error("POST /api/sales/[id]/refund error", error instanceof Error ? error : undefined)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
