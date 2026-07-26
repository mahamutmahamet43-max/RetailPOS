import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentStore, noStoreResponse } from "@/lib/store"
import { logger } from "@/lib/logger"
import { requireRole } from "@/lib/role"
import { validateOrError, customerPaymentSchema } from "@/lib/api-validation"

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

    const customer = await prisma.customer.findFirst({
      where: { id, storeId: store.id },
    })
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    const payments = await prisma.customerPayment.findMany({
      where: { customerId: id, storeId: store.id },
      orderBy: { createdAt: "desc" },
      include: {
        cashier: { select: { id: true, name: true } },
        sale: { select: { id: true, saleNumber: true } },
      },
    })

    return NextResponse.json({ payments })
  } catch (error) {
    logger.error("GET /api/customers/[id]/payments error", error instanceof Error ? error : undefined)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(
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
    const validation = validateOrError(customerPaymentSchema, body)
    if (!validation.success) return validation.response
    const { amount, paymentMethod, reference, notes, saleId } = validation.data

    if (amount <= 0) {
      return NextResponse.json(
        { error: "Payment amount must be positive" },
        { status: 400 }
      )
    }

    const result = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findFirst({
        where: { id, storeId: store.id },
      })
      if (!customer) {
        throw new Error("Customer not found")
      }

      if (amount > customer.currentBalance) {
        throw new Error(
          `Payment amount ($${amount.toFixed(2)}) exceeds outstanding balance ($${customer.currentBalance.toFixed(2)})`
        )
      }

      let targetSale: any = null
      if (saleId) {
        targetSale = await tx.sale.findFirst({
          where: { id: saleId, storeId: store.id },
          select: { remainingBalance: true, creditStatus: true, total: true, amountPaid: true, customerId: true, status: true },
        })
        if (!targetSale) {
          throw new Error("Sale not found or does not belong to this store")
        }
        if (targetSale.customerId && targetSale.customerId !== id) {
          throw new Error("Sale does not belong to this customer")
        }
        if (targetSale.status !== "COMPLETED") {
          throw new Error(`Cannot record payment on a sale with status ${targetSale.status}`)
        }
        if (targetSale.creditStatus === "PAID") {
          throw new Error("This sale is already fully paid")
        }
      }

      const clampedPaymentAmount = targetSale?.remainingBalance != null
        ? Math.min(amount, targetSale.remainingBalance)
        : amount

      const payment = await tx.customerPayment.create({
        data: {
          amount: clampedPaymentAmount,
          paymentMethod,
          reference: reference || null,
          notes: notes || null,
          customerId: id,
          cashierId: auth.userId,
          storeId: store.id,
          saleId: saleId || null,
        },
      })

      await tx.customer.update({
        where: { id, storeId: store.id },
        data: {
          currentBalance: { decrement: clampedPaymentAmount },
          totalPaid: { increment: clampedPaymentAmount },
          lastPaymentDate: new Date(),
        },
      })

      let updatedSale: any = null

      if (targetSale && saleId && targetSale.remainingBalance != null) {
        const remaining = Math.max(0, targetSale.remainingBalance - clampedPaymentAmount)
        updatedSale = await tx.sale.update({
          where: { id: saleId },
          data: {
            amountPaid: { increment: clampedPaymentAmount },
            remainingBalance: remaining,
            creditStatus: remaining <= 0 ? "PAID" : "PARTIALLY_PAID",
          },
        })
      }

      const freshCustomer = await tx.customer.findUnique({
        where: { id },
        select: {
          id: true,
          currentBalance: true,
          totalPaid: true,
          totalCreditSales: true,
          lastPaymentDate: true,
        },
      })

      return { payment, customer: freshCustomer, updatedSale }
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error"
    if (message === "Customer not found") {
      return NextResponse.json({ error: message }, { status: 404 })
    }
    if (message.includes("exceeds outstanding balance") || message.includes("already fully paid") || message.includes("does not belong to this") || message.includes("Cannot record payment")) {
      return NextResponse.json({ error: message }, { status: 400 })
    }
    logger.error("POST /api/customers/[id]/payments error", error instanceof Error ? error : undefined)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
