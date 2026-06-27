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
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
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

    const { items, customerId, paymentMethod, amountPaid, discount, tax } = validation.data

    const paid = amountPaid || 0

    const saleSubtotal = items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    )
    const saleTotal = saleSubtotal - discount + tax

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
      if (product.stockQuantity < item.quantity) {
        return NextResponse.json(
          {
            error: `Insufficient stock for ${product.name}. Available: ${product.stockQuantity}, requested: ${item.quantity}`,
          },
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

    const changeGiven = Math.max(0, paid - saleTotal)

    const lastSale = await prisma.sale.findFirst({
      where: { storeId: store.id },
      orderBy: { createdAt: "desc" },
      select: { saleNumber: true },
    })

    let nextNumber = 1
    if (lastSale?.saleNumber) {
      const num = parseInt(lastSale.saleNumber.replace("SALE-", ""))
      if (!isNaN(num)) nextNumber = num + 1
    }
    const saleNumber = `SALE-${String(nextNumber).padStart(6, "0")}`

    let saleId = ""

    await prisma.$transaction(async (tx) => {
      const createdSale = await tx.sale.create({
        data: {
          saleNumber,
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
          items: {
            create: items.map((item) => {
              const product = productMap.get(item.productId)!
              const itemTotal = item.unitPrice * item.quantity - item.discount
              return {
                productId: item.productId,
                productName: item.productName,
                barcode: item.barcode || null,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                costPrice: product.costPrice,
                discount: item.discount,
                total: itemTotal,
              }
            }),
          },
        },
      })

      saleId = createdSale.id

      const storeSetting = await tx.storeSetting.findUnique({
        where: { storeId: store.id },
        select: { enablePharmacyModule: true },
      })
      const pharmacyEnabled = storeSetting?.enablePharmacyModule ?? false

      for (const item of items) {
        const product = productMap.get(item.productId)!
        let newStock = product.stockQuantity - item.quantity

        if (pharmacyEnabled && product.form) {
          const fefoBatches = await tx.medicineBatch.findMany({
            where: {
              productId: item.productId,
              quantity: { gt: 0 },
              expiryDate: { gt: new Date() },
            },
            orderBy: { expiryDate: "asc" },
          })
          let remaining = item.quantity
          for (const batch of fefoBatches) {
            if (remaining <= 0) break
            const take = Math.min(remaining, batch.quantity)
            await tx.medicineBatch.update({
              where: { id: batch.id },
              data: { quantity: batch.quantity - take },
            })
            remaining -= take
          }
          if (remaining > 0) {
            throw new Error(`Insufficient stock for ${product.name}. Available batches exhausted.`)
          }
        }

        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: newStock },
        })

        await tx.inventoryTransaction.create({
          data: {
            transactionType: "OUT",
            quantity: item.quantity,
            previousStock: product.stockQuantity,
            newStock,
            reason: `Sale #${saleNumber}`,
            storeId: store.id,
            productId: item.productId,
            createdBy: session.user.id,
          },
        })
      }
    })

    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        items: true,
        customer: { select: { id: true, firstName: true, lastName: true, email: true } },
        cashier: { select: { id: true, name: true } },
      },
    })

    if (sale?.customer?.email) {
      const items = sale.items.map((i) => ({
        name: i.productName,
        quantity: i.quantity,
        price: `$${i.unitPrice.toFixed(2)}`,
        total: `$${i.total.toFixed(2)}`,
      }))
      sendInvoiceEmail(sale.customer.email, sale.customer.firstName, sale.saleNumber, `$${sale.total.toFixed(2)}`, items, store.name || "Store").catch(() => {})
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
