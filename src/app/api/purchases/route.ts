import { NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { getCurrentStore, noStoreResponse } from "@/lib/store"
import { logger } from "@/lib/logger"
import { validateOrError, purchaseSchema } from "@/lib/api-validation"
import { requireRole } from "@/lib/role"

export async function GET(request: Request) {
  try {
    const auth = await requireRole("OWNER", "MANAGER", "CASHIER")
    if (auth instanceof NextResponse) return auth

    const store = await getCurrentStore()
    if (!store) return noStoreResponse()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    const where: Prisma.PurchaseWhereInput = { storeId: store.id }

    if (status === "PENDING" || status === "COMPLETED" || status === "CANCELLED") {
      where.status = status
    }

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: "insensitive" as const } },
        { supplierName: { contains: search, mode: "insensitive" as const } },
        { notes: { contains: search, mode: "insensitive" as const } },
      ]
    }

    const [purchases, total] = await Promise.all([
      prisma.purchase.findMany({
        where,
        include: {
          items: true,
          supplier: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.purchase.count({ where }),
    ])

    return NextResponse.json({
      purchases,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    logger.error("GET /api/purchases error", error instanceof Error ? error : undefined)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireRole("OWNER", "MANAGER")
    if (auth instanceof NextResponse) return auth

    const store = await getCurrentStore()
    if (!store) return noStoreResponse()
    const body = await request.json()
    const validation = validateOrError(purchaseSchema, body)
    if (!validation.success) return validation.response

    const { invoiceNumber, supplierId, supplierName, notes, status, items } = validation.data

    const existingInvoice = await prisma.purchase.findFirst({
      where: { invoiceNumber, storeId: store.id },
    })

    if (existingInvoice) {
      return NextResponse.json(
        { error: `Purchase with invoice number "${invoiceNumber}" already exists` },
        { status: 409 }
      )
    }

    const productIds = items.map((i) => i.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, storeId: store.id },
    })

    const productMap = new Map(products.map((p) => [p.id, p]))

    for (const item of items) {
      if (!productMap.has(item.productId)) {
        return NextResponse.json(
          { error: `Product not found: ${item.productName}` },
          { status: 404 }
        )
      }
    }

    const isCompleted = status === "COMPLETED"

    const result = await prisma.$transaction(async (tx) => {
      const purchase = await tx.purchase.create({
        data: {
          invoiceNumber,
          supplierId: supplierId || null,
          supplierName,
          notes: notes || null,
          total: items.reduce((sum, i) => sum + i.costPrice * i.quantity, 0),
          status,
          storeId: store.id,
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              productName: item.productName,
              productUnitId: item.productUnitId || null,
              unitName: item.unitName,
              unitConversionFactor: item.unitConversionFactor,
              quantity: item.quantity,
              costPrice: item.costPrice,
            })),
          },
        },
        include: { items: true, supplier: { select: { id: true, name: true } } },
      })

      if (isCompleted) {
        for (const item of items) {
          const product = productMap.get(item.productId)!
          const baseQuantity = Math.round(item.quantity * item.unitConversionFactor)
          const newStock = product.stockQuantity + baseQuantity

          await tx.product.update({
            where: { id: item.productId },
            data: { stockQuantity: newStock },
          })

          await tx.inventoryTransaction.create({
            data: {
              transactionType: "IN",
              quantity: baseQuantity,
              previousStock: product.stockQuantity,
              newStock,
              reason: `Purchase #${invoiceNumber}`,
              storeId: store.id,
              productId: item.productId,
              createdBy: auth.userId,
              purchaseId: purchase.id,
            },
          })
        }
      }

      return purchase
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    logger.error("POST /api/purchases error", error instanceof Error ? error : undefined)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
