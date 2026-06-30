import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentStore, noStoreResponse } from "@/lib/store"
import { logger } from "@/lib/logger"
import { requireRole } from "@/lib/role"
import { validateOrError, saleActionSchema } from "@/lib/api-validation"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole("OWNER", "MANAGER", "CASHIER")
    if (auth instanceof NextResponse) return auth

    const store = await getCurrentStore()
    if (!store) return noStoreResponse()
    const { id } = await params

    const sale = await prisma.sale.findFirst({
      where: { id, storeId: store.id },
      include: {
        items: true,
        customer: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
        cashier: { select: { id: true, name: true } },
      },
    })

    if (!sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 })
    }

    return NextResponse.json(sale)
  } catch (error) {
    logger.error("GET /api/sales/[id] error", error instanceof Error ? error : undefined)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole("OWNER", "MANAGER")
    if (auth instanceof NextResponse) return auth

    const store = await getCurrentStore()
    if (!store) return noStoreResponse()
    const { id } = await params
    const body = await request.json()

    const validation = validateOrError(saleActionSchema, body)
    if (!validation.success) return validation.response

    const sale = await prisma.sale.findFirst({
      where: { id, storeId: store.id },
      include: { items: true },
    })

    if (!sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 })
    }

    if (sale.status === "VOID" || sale.status === "REFUNDED") {
      return NextResponse.json(
        { error: "Sale cannot be voided" },
        { status: 400 }
      )
    }

    const voided = await prisma.$transaction(async (tx) => {
      const updated = await tx.sale.update({
        where: { id },
        data: { status: "VOID" },
        include: {
          items: true,
          customer: {
            select: { id: true, firstName: true, lastName: true },
          },
          cashier: { select: { id: true, name: true } },
        },
      })

      for (const item of sale.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        })

        if (product) {
          const newStock = product.stockQuantity + item.quantity

          await tx.product.update({
            where: { id: item.productId },
            data: { stockQuantity: newStock },
          })

          await tx.inventoryTransaction.create({
            data: {
              transactionType: "IN",
              quantity: item.quantity,
              previousStock: product.stockQuantity,
              newStock,
              reason: `Void sale #${sale.saleNumber}`,
              storeId: store.id,
              productId: item.productId,
              createdBy: auth.userId,
            },
          })
        }
      }

      if (sale.paymentMethod === "CREDIT" && sale.customerId && sale.remainingBalance && sale.remainingBalance > 0) {
        const cust = await tx.customer.findUnique({
          where: { id: sale.customerId },
          select: { currentBalance: true },
        })
        if (cust) {
          const newBalance = Math.max(0, cust.currentBalance - (sale.remainingBalance || 0))
          await tx.customer.update({
            where: { id: sale.customerId },
            data: { currentBalance: newBalance },
          })
        }
      }

      return updated
    })

    return NextResponse.json(voided)
  } catch (error) {
    logger.error("PATCH /api/sales/[id] error", error instanceof Error ? error : undefined)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
