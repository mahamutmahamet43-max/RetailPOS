import { NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { getCurrentStore, noStoreResponse } from "@/lib/store"
import { logger } from "@/lib/logger"
import { validateOrError, saleSchema } from "@/lib/api-validation"
import { sendInvoiceEmail } from "@/lib/email/service"
import { requireRole } from "@/lib/role"

export async function GET(request: Request) {
  try {
    const auth = await requireRole("OWNER", "MANAGER", "CASHIER")
    if (auth instanceof NextResponse) return auth

    const store = await getCurrentStore()
    if (!store) return noStoreResponse()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const from = searchParams.get("from") || ""
    const to = searchParams.get("to") || ""
    const payment = searchParams.get("payment") || ""
    const cashier = searchParams.get("cashier") || ""
    const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1)
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "10") || 10))
    const skip = (page - 1) * limit

    const where: Prisma.SaleWhereInput = {
      storeId: store.id,
    }

    if (payment && ["CASH", "ZAAD", "EVC_PLUS", "SAHAL", "CARD", "CREDIT"].includes(payment)) {
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
    const auth = await requireRole("OWNER", "MANAGER", "CASHIER")
    if (auth instanceof NextResponse) return auth

    const store = await getCurrentStore()
    if (!store) return noStoreResponse()
    const body = await request.json()
    const validation = validateOrError(saleSchema, body)
    if (!validation.success) return validation.response

    const { items, customerId, paymentMethod, amountPaid, discount, tax } = validation.data

    for (const item of items) {
      if (item.productUnitId) {
        const productUnit = await prisma.productUnit.findFirst({
          where: { id: item.productUnitId, productId: item.productId },
        })
        if (!productUnit) {
          return NextResponse.json(
            { error: `Unit not found for product: ${item.productName}` },
            { status: 404 }
          )
        }
      }
    }

    const paid = amountPaid || 0

    const saleSubtotal = items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    )
    const saleTotal = saleSubtotal - discount + tax

    const productIds = items.map((i) => i.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, storeId: store.id },
    })

    const productMap = new Map(products.map((p) => [p.id, p]))

    const stockMap = new Map(products.map((p) => [p.id, p.stockQuantity]))

    for (const item of items) {
      const product = productMap.get(item.productId)
      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${item.productId}` },
          { status: 404 }
        )
      }
      const baseRequested = Math.round(item.quantity * item.unitConversionFactor)
      const available = stockMap.get(item.productId) ?? product.stockQuantity
      if (available < baseRequested) {
        return NextResponse.json(
          {
            error: `Insufficient stock for ${product.name}. Available: ${available} ${product.unit || "pcs"}, requested: ${baseRequested}`,
          },
          { status: 400 }
        )
      }
      stockMap.set(item.productId, available - baseRequested)
    }

    if (paymentMethod === "CASH" && paid < saleTotal) {
      return NextResponse.json(
        { error: `Payment amount (${paid}) is less than total (${saleTotal})` },
        { status: 400 }
      )
    }

    if (paymentMethod === "CREDIT") {
      if (!customerId) {
        return NextResponse.json(
          { error: "Customer is required for credit sales" },
          { status: 400 }
        )
      }
      const customer = await prisma.customer.findFirst({
        where: { id: customerId, storeId: store.id },
      })
      if (!customer) {
        return NextResponse.json(
          { error: "Customer not found" },
          { status: 404 }
        )
      }
      if (customer.creditLimit > 0 && customer.currentBalance + saleTotal > customer.creditLimit) {
        return NextResponse.json(
          { error: `Credit limit exceeded. Balance: $${customer.currentBalance.toFixed(2)}, Limit: $${customer.creditLimit.toFixed(2)}` },
          { status: 400 }
        )
      }
    }

    const changeGiven = Math.max(0, paid - saleTotal)

    const lastSale = await prisma.sale.findFirst({
      where: { storeId: store.id },
      orderBy: { saleNumber: "desc" },
      select: { saleNumber: true },
    })

    let nextNumber = 1
    if (lastSale?.saleNumber) {
      const num = parseInt(lastSale.saleNumber.replace("SALE-", ""), 10)
      if (!isNaN(num)) nextNumber = num + 1
    }
    const saleNumber = `SALE-${String(nextNumber).padStart(6, "0")}`

    let saleId = ""

    const isCredit = paymentMethod === "CREDIT"
    const remainingBalance = isCredit ? saleTotal - paid : null
    const creditStatus = isCredit
      ? (remainingBalance! <= 0 ? "PAID" : paid > 0 ? "PARTIALLY_PAID" : "UNPAID")
      : null

    await prisma.$transaction(async (tx) => {
      const createdSale = await tx.sale.create({
        data: {
          saleNumber,
          subtotal: saleSubtotal,
          discount,
          tax,
          total: saleTotal,
          amountPaid: paid,
          changeGiven: isCredit ? 0 : changeGiven,
          paymentMethod,
          status: "COMPLETED",
          creditStatus: creditStatus as any,
          remainingBalance,
          storeId: store.id,
          customerId: customerId || null,
          cashierId: auth.userId,
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
                productUnitId: item.productUnitId || null,
                unitName: item.unitName,
                unitConversionFactor: item.unitConversionFactor,
              }
            }),
          },
        },
      })

      saleId = createdSale.id

      for (const item of items) {
        const current = await tx.product.findUnique({
          where: { id: item.productId },
          select: { stockQuantity: true },
        })
        const baseQuantity = Math.round(item.quantity * item.unitConversionFactor)
        const previousStock = current?.stockQuantity ?? 0
        const newStock = previousStock - baseQuantity

        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: newStock },
        })

        await tx.inventoryTransaction.create({
          data: {
            transactionType: "OUT",
            quantity: baseQuantity,
            previousStock,
            newStock,
            reason: `Sale #${saleNumber}`,
            storeId: store.id,
            productId: item.productId,
            createdBy: auth.userId,
          },
        })
      }
      if (isCredit && customerId) {
        const cust = await tx.customer.findUnique({
          where: { id: customerId },
          select: { currentBalance: true, totalCreditSales: true },
        })
        if (cust) {
          await tx.customer.update({
            where: { id: customerId },
            data: {
              currentBalance: cust.currentBalance + remainingBalance!,
              totalCreditSales: cust.totalCreditSales + saleTotal,
              lastPaymentDate: paid > 0 ? new Date() : undefined,
            },
          })
        }
      }
    })

    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
        include: {
          items: { include: { productUnit: { select: { id: true, name: true } } } },
          customer: { select: { id: true, firstName: true, lastName: true, email: true } },
          cashier: { select: { id: true, name: true } },
        },
    })

    if (sale?.customer?.email) {
      const items = sale.items.map((i) => ({
        name: i.productName,
        quantity: i.quantity,
        price: `${i.unitPrice.toFixed(2)}`,
        total: `${i.total.toFixed(2)}`,
      }))
      const emailResult = await sendInvoiceEmail(sale.customer.email, sale.customer.firstName, sale.saleNumber, `${sale.total.toFixed(2)}`, items, store.name || "Store")
      if (!emailResult.success) {
        logger.warn("Invoice email not sent", {
          saleNumber: sale.saleNumber,
          email: sale.customer.email,
          error: emailResult.error,
        })
      }
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
