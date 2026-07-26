import { NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getCurrentStore } from "@/lib/store"
import { logger } from "@/lib/logger"
import { validateOrError, saleSchema } from "@/lib/api-validation"
import { sendInvoiceEmail } from "@/lib/email/service"
import { getStoreSubscription, isSubscriptionActive } from "@/lib/subscription/enforce"
import { getPlanConfig } from "@/lib/subscription/plans"

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const store = await getCurrentStore()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const from = searchParams.get("from") || ""
    const to = searchParams.get("to") || ""
    const payment = searchParams.get("payment") || ""
    const cashier = searchParams.get("cashier") || ""
    const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10") || 10))
    const skip = (page - 1) * limit

    const where: Prisma.SaleWhereInput = {
      storeId: store.id,
    }

    if (payment && ["CASH", "ZAAD", "EVC_PLUS", "SAHAL", "CARD"].includes(payment)) {
      where.paymentMethod = payment as Prisma.EnumPaymentMethodFilter["equals"]
    }

    if (cashier) {
      where.cashierId = cashier
    }

    if (from || to) {
      const dateFilter: Prisma.DateTimeFilter = {}
      if (from) dateFilter.gte = new Date(from)
      if (to) dateFilter.lte = new Date(to + "T23:59:59.999Z")
      where.createdAt = dateFilter
    }

    if (search) {
      where.OR = [
        { saleNumber: { contains: search, mode: "insensitive" } },
        { items: { some: { productName: { contains: search, mode: "insensitive" } } } },
      ]
    }

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        include: {
          items: true,
          customer: { select: { id: true, firstName: true, lastName: true } },
          cashier: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.sale.count({ where }),
    ])

    return NextResponse.json({
      sales,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    logger.error("GET /api/sales error", error instanceof Error ? error : undefined)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const store = await getCurrentStore()
    const body = await request.json()
    const validation = validateOrError(saleSchema, body)
    if (!validation.success) return validation.response

    const { items, customerId, paymentMethod, amountPaid, discount, tax, localId } = validation.data

    const paid = amountPaid || 0

    const itemDiscounts = items.reduce((sum, item) => sum + (item.discount || 0), 0)
    const saleSubtotal = items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    )
    const saleTotal = saleSubtotal - itemDiscounts - discount + tax

    if (saleTotal < 0) {
      return NextResponse.json(
        { error: "Sale total cannot be negative. Check discount and tax values." },
        { status: 400 }
      )
    }

    const subscription = await getStoreSubscription(store.id)
    if (!subscription || !isSubscriptionActive(subscription)) {
      const reason = !subscription
        ? "No active subscription."
        : subscription.status === "TRIAL"
          ? "Your trial has expired."
          : `Your subscription is ${subscription.status.toLowerCase()}.`
      return NextResponse.json(
        { error: `${reason} Please subscribe or renew to process sales.` },
        { status: 402 }
      )
    }

    const config = getPlanConfig(subscription.plan)
    if (config.limits.monthlySales !== -1) {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const monthlyTotal = await prisma.sale.aggregate({
        where: { storeId: store.id, createdAt: { gte: startOfMonth }, status: "COMPLETED" },
        _sum: { total: true },
      })
      const currentMonthly = monthlyTotal._sum.total || 0
      if (currentMonthly + saleTotal > config.limits.monthlySales) {
        return NextResponse.json(
          {
            error: `Your ${config.name} plan has a monthly sales cap of $${config.limits.monthlySales.toLocaleString()}. This sale would exceed it. Please upgrade to continue.`,
            limit: config.limits.monthlySales,
            current: currentMonthly,
          },
          { status: 403 }
        )
      }
    }

    const productIds = items.map((i) => i.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, storeId: store.id },
    })

    const productMap = new Map(products.map((p) => [p.id, p]))

    for (const item of items) {
      const product = productMap.get(item.productId)
      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${item.productId}` },
          { status: 404 }
        )
      }
    }

    for (const item of items) {
      const product = productMap.get(item.productId)!
      if (item.unitPrice !== product.sellingPrice) {
        return NextResponse.json(
          { error: `Price mismatch for "${product.name}". Expected $${product.sellingPrice.toFixed(2)}, got $${item.unitPrice.toFixed(2)}` },
          { status: 400 }
        )
      }
    }

    if (paymentMethod === "CASH" && paid < saleTotal) {
      return NextResponse.json(
        { error: `Payment amount (${paid}) is less than total (${saleTotal})` },
        { status: 400 }
      )
    }

    if (paymentMethod === "CREDIT" && !customerId) {
      return NextResponse.json(
        { error: "Customer is required for credit sales" },
        { status: 400 }
      )
    }

    if (paymentMethod === "CREDIT" && customerId) {
      if (paid > saleTotal) {
        return NextResponse.json(
          { error: `Payment amount (${paid}) cannot exceed total (${saleTotal}) for credit sales` },
          { status: 400 }
        )
      }
      const customer = await prisma.customer.findFirst({
        where: { id: customerId, storeId: store.id },
        select: { creditLimit: true, currentBalance: true, firstName: true, lastName: true },
      })
      if (!customer) {
        return NextResponse.json({ error: "Customer not found" }, { status: 404 })
      }
      const remaining = saleTotal - paid
      if (remaining > 0 && customer.creditLimit > 0) {
        const newBalance = customer.currentBalance + remaining
        if (newBalance > customer.creditLimit) {
          return NextResponse.json(
            {
              error: `Credit limit exceeded. Customer ${customer.firstName} ${customer.lastName} has a credit limit of $${customer.creditLimit.toFixed(2)} with $${customer.currentBalance.toFixed(2)} outstanding. This sale would add $${remaining.toFixed(2)} (total: $${newBalance.toFixed(2)}).`,
              creditLimit: customer.creditLimit,
              currentBalance: customer.currentBalance,
              requestedCredit: remaining,
            },
            { status: 400 }
          )
        }
      }
    }

    if (paymentMethod !== "CASH" && paymentMethod !== "CREDIT") {
      if (paid <= 0) {
        return NextResponse.json(
          { error: `Payment amount must be greater than zero for ${paymentMethod} payments` },
          { status: 400 }
        )
      }
      if (paid < saleTotal) {
        return NextResponse.json(
          { error: `Payment amount (${paid}) is less than total (${saleTotal}). ${paymentMethod} payments must be paid in full.` },
          { status: 400 }
        )
      }
    }

    const changeGiven = Math.max(0, paid - saleTotal)

    if (localId) {
      const existingSale = await prisma.sale.findFirst({
        where: { localId, storeId: store.id },
        include: {
          items: true,
          customer: { select: { id: true, firstName: true, lastName: true, email: true } },
          cashier: { select: { id: true, name: true } },
        },
      })
      if (existingSale) {
        return NextResponse.json(existingSale)
      }
    }

    let sale = null
    let retries = 3
    while (retries > 0) {
      try {
        sale = await prisma.$transaction(async (tx) => {
          const lastSale = await tx.sale.findFirst({
            where: { storeId: store.id },
            orderBy: { createdAt: "desc" },
            select: { saleNumber: true },
          })
          let nextNumber = 1
          if (lastSale?.saleNumber) {
            const match = lastSale.saleNumber.match(/(\d+)$/)
            if (match) nextNumber = parseInt(match[1], 10) + 1
          }
          const saleNumber = `SALE-${String(nextNumber).padStart(6, "0")}`

          const createdSale = await tx.sale.create({
            data: {
              saleNumber,
              localId: localId || null,
              subtotal: saleSubtotal,
              discount,
              tax,
              total: saleTotal,
              amountPaid: paid,
              changeGiven,
              paymentMethod,
              status: "COMPLETED",
              storeId: store.id,
              customerId: customerId || null,
              cashierId: session.user.id,
              remainingBalance: paymentMethod === "CREDIT" ? Math.max(0, saleTotal - paid) : null,
              creditStatus: paymentMethod === "CREDIT" ? (paid >= saleTotal ? "PAID" : "PARTIALLY_PAID") : null,
              items: {
                create: items.map((item) => {
                  const prod = productMap.get(item.productId)!
                  const itemTotal = item.unitPrice * item.quantity - item.discount
                  return {
                    productId: item.productId,
                    productName: item.productName,
                    barcode: item.barcode || null,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    costPrice: prod.costPrice,
                    discount: item.discount,
                    total: itemTotal,
                  }
                }),
              },
            },
          })

          for (const item of items) {
            const product = await tx.product.findUnique({
              where: { id: item.productId },
              select: { stockQuantity: true },
            })
            if (!product || product.stockQuantity < item.quantity) {
              throw new Error(`Insufficient stock for product ${item.productId}`)
            }
            const previousStock = product.stockQuantity
            await tx.product.update({
              where: { id: item.productId },
              data: { stockQuantity: { decrement: item.quantity } },
            })

            await tx.inventoryTransaction.create({
              data: {
                transactionType: "OUT",
                quantity: item.quantity,
                previousStock,
                newStock: previousStock - item.quantity,
                reason: `Sale #${saleNumber}`,
                storeId: store.id,
                productId: item.productId,
                createdBy: session.user.id,
              },
            })
          }

          if (paymentMethod === "CREDIT" && customerId) {
            const remaining = saleTotal - paid
            if (remaining > 0) {
              await tx.customer.update({
                where: { id: customerId },
                data: {
                  currentBalance: { increment: remaining },
                  totalCreditSales: { increment: remaining },
                },
              })
            }
          }

          return await tx.sale.findUnique({
            where: { id: createdSale.id },
            include: {
              items: true,
              customer: { select: { id: true, firstName: true, lastName: true, email: true } },
              cashier: { select: { id: true, name: true } },
            },
          })
        })
        break
      } catch (error) {
        retries--
        const isP2002 = error instanceof Error && error.message.includes("P2002")
        if (!isP2002 || retries <= 0) throw error
        await new Promise((r) => setTimeout(r, 50))
      }
    }

    if (sale?.customer?.email) {
      const emailItems = sale.items.map((i) => ({
        name: i.productName,
        quantity: i.quantity,
        price: `$${i.unitPrice.toFixed(2)}`,
        total: `$${i.total.toFixed(2)}`,
      }))
      sendInvoiceEmail(sale.customer.email, sale.customer.firstName, sale.saleNumber, `$${sale.total.toFixed(2)}`, emailItems, store.name || "Store").catch((err) => {
        logger.error("Failed to send invoice email", err instanceof Error ? err : undefined)
      })
    }

    return NextResponse.json(sale, { status: 201 })
  } catch (error) {
    logger.error("POST /api/sales error", error instanceof Error ? error : undefined)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
