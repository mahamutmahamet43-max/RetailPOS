import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getCurrentStore } from "@/lib/store"
import { logger } from "@/lib/logger"
import { requireRole } from "@/lib/role"

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
    const authResult = await requireRole("OWNER", "MANAGER")
    if (authResult instanceof NextResponse) return authResult

    const store = await getCurrentStore()
    const { id } = await params
    const body = await request.json()

    if (body.action !== "void") {
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      )
    }

    const sale = await prisma.sale.findFirst({
      where: { id, storeId: store.id },
      include: { items: true },
    })

    if (!sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 })
    }

    if (sale.status !== "COMPLETED") {
      return NextResponse.json(
        { error: `Cannot void a sale with status ${sale.status}` },
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
        const returnable = item.quantity - ((item as any).returnedQuantity || 0)
        if (returnable <= 0) continue

        const productBefore = await tx.product.findUnique({
          where: { id: item.productId },
          select: { stockQuantity: true },
        })

        if (!productBefore) {
          throw new Error(`Product ${item.productId} not found — cannot restore stock for void`)
        }

        const unitConversionFactor = (item as any).unitConversionFactor || 1
        const baseQuantity = Math.round(returnable * unitConversionFactor)

        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { increment: baseQuantity } },
        })

        await tx.inventoryTransaction.create({
          data: {
            transactionType: "IN",
            quantity: baseQuantity,
            previousStock: productBefore.stockQuantity,
            newStock: productBefore.stockQuantity + baseQuantity,
            reason: `Sale ${sale.saleNumber} voided`,
            reference: sale.saleNumber,
            storeId: store.id,
            productId: item.productId,
            createdBy: authResult.userId,
          },
        })
      }

      if (sale.paymentMethod === "CREDIT" && sale.customerId) {
        const totalRefunded = sale.items.reduce((sum, item) => {
          const returned = (item as any).returnedQuantity || 0
          return sum + (item.unitPrice || 0) * returned
        }, 0)
        const netTotal = sale.total - totalRefunded
        const amountPaidOnSale = sale.amountPaid || 0

        const paymentsForSale = await tx.customerPayment.findMany({
          where: { saleId: sale.id, storeId: store.id },
        })
        const totalSubsequentPayments = paymentsForSale.reduce((sum, p) => sum + p.amount, 0)
        const initialPaid = amountPaidOnSale - totalSubsequentPayments
        const creditExtended = Math.max(0, netTotal - initialPaid)
        const remainingDebt = Math.max(0, netTotal - amountPaidOnSale)

        const customerUpdates: Record<string, any> = {}

        if (remainingDebt > 0) {
          customerUpdates.currentBalance = { decrement: remainingDebt }
        }
        if (creditExtended > 0) {
          customerUpdates.totalCreditSales = { decrement: creditExtended }
        }
        if (totalSubsequentPayments > 0) {
          customerUpdates.totalPaid = { decrement: totalSubsequentPayments }
        }

        if (Object.keys(customerUpdates).length > 0) {
          await tx.customer.update({
            where: { id: sale.customerId },
            data: customerUpdates,
          })
        }

        for (const payment of paymentsForSale) {
          await tx.customerPayment.delete({
            where: { id: payment.id },
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
