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
      where: { customerId: id },
      orderBy: { createdAt: "desc" },
      include: {
        cashier: { select: { id: true, name: true } },
        sale: { select: { saleNumber: true } },
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

    const customer = await prisma.customer.findFirst({
      where: { id, storeId: store.id },
    })
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

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

    if (amount > customer.currentBalance) {
      return NextResponse.json(
        { error: `Payment amount ($${amount.toFixed(2)}) exceeds outstanding balance ($${customer.currentBalance.toFixed(2)})` },
        { status: 400 }
      )
    }

    let updatedSale: any = null

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.customerPayment.create({
        data: {
          amount,
          paymentMethod,
          reference: reference || null,
          notes: notes || null,
          customerId: id,
          cashierId: auth.userId,
          storeId: store.id,
          saleId: saleId || null,
        },
      })

      const updated = await tx.customer.update({
        where: { id },
        data: {
          currentBalance: { decrement: amount },
          totalPaid: { increment: amount },
          lastPaymentDate: new Date(),
        },
      })

      if (saleId) {
        const sale = await tx.sale.findUnique({
          where: { id: saleId },
          select: { remainingBalance: true, creditStatus: true, total: true, amountPaid: true },
        })
        if (sale && sale.remainingBalance != null) {
          const newRemainingBalance = Math.max(0, sale.remainingBalance - amount)
          const newCreditStatus = newRemainingBalance <= 0 ? "PAID" : "PARTIALLY_PAID"
          updatedSale = await tx.sale.update({
            where: { id: saleId },
            data: {
              remainingBalance: newRemainingBalance,
              creditStatus: newCreditStatus as any,
            },
          })
        }
      }

      return payment
    })

    return NextResponse.json({ payment: result, customer: updatedSale ? { ...customer, currentBalance: customer.currentBalance - amount, totalPaid: customer.totalPaid + amount } : undefined, updatedSale }, { status: 201 })
  } catch (error) {
    logger.error("POST /api/customers/[id]/payments error", error instanceof Error ? error : undefined)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}