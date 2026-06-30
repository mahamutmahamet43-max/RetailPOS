import { NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { getCurrentStore, noStoreResponse } from "@/lib/store"
import { logger } from "@/lib/logger"
import { validateOrError, inventorySchema } from "@/lib/api-validation"
import { sendLowStockEmail } from "@/lib/email/service"
import { requireRole } from "@/lib/role"

export async function GET(request: Request) {
  try {
    const auth = await requireRole("OWNER", "MANAGER", "CASHIER")
    if (auth instanceof NextResponse) return auth

    const store = await getCurrentStore()
    if (!store) return noStoreResponse()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const type = searchParams.get("type") || ""
    const from = searchParams.get("from") || ""
    const to = searchParams.get("to") || ""
    const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1)
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "10") || 10))
    const skip = (page - 1) * limit

    const where: Prisma.InventoryTransactionWhereInput = {
      storeId: store.id,
    }

    if (type && ["IN", "OUT", "ADJUSTMENT"].includes(type)) {
      where.transactionType = type as Prisma.EnumTransactionTypeFilter["equals"]
    }

    if (from || to) {
      const dateFilter: Prisma.DateTimeFilter = {}
      if (from) dateFilter.gte = new Date(from)
      if (to) dateFilter.lte = new Date(to + "T23:59:59.999Z")
      where.createdAt = dateFilter
    }

    if (search) {
      const products = await prisma.product.findMany({
        where: {
          storeId: store.id,
          name: { contains: search, mode: "insensitive" },
        },
        select: { id: true },
      })
      where.productId = { in: products.map((p) => p.id) }
    }

    const [transactions, total] = await Promise.all([
      prisma.inventoryTransaction.findMany({
        where,
        include: {
          product: { select: { id: true, name: true, sku: true, image: true } },
          creator: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.inventoryTransaction.count({ where }),
    ])

    return NextResponse.json({
      transactions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    logger.error("GET /api/inventory error", error instanceof Error ? error : undefined)
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
    const validation = validateOrError(inventorySchema, body)
    if (!validation.success) return validation.response

    const { transactionType, productId, quantity, reason, notes } = validation.data

    const product = await prisma.product.findFirst({
      where: { id: productId, storeId: store.id },
      select: { id: true, name: true, stockQuantity: true, minimumStock: true },
    })

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      )
    }

    if (transactionType === "OUT" && quantity > product.stockQuantity) {
      return NextResponse.json(
        { error: `Stock out cannot reduce stock below zero. Current stock: ${product.stockQuantity}` },
        { status: 400 }
      )
    }

    let newQuantity = 0
    const transaction = await prisma.$transaction(async (tx) => {
      const current = await tx.product.findUnique({
        where: { id: productId },
        select: { stockQuantity: true },
      })
      const previousStock = current?.stockQuantity ?? 0

      newQuantity =
        transactionType === "ADJUSTMENT"
          ? quantity
          : transactionType === "IN"
            ? previousStock + quantity
            : previousStock - quantity

      if (newQuantity < 0) {
        throw new Error("Stock adjustment would result in negative inventory")
      }

      const created = await tx.inventoryTransaction.create({
        data: {
          transactionType,
          quantity: transactionType === "ADJUSTMENT" ? newQuantity : quantity,
          previousStock,
          newStock: newQuantity,
          reason: reason.trim(),
          reference: notes?.trim() || null,
          storeId: store.id,
          productId,
          createdBy: auth.userId,
        },
        include: {
          product: { select: { id: true, name: true, sku: true } },
          creator: { select: { id: true, name: true } },
        },
      })

      await tx.product.update({
        where: { id: productId },
        data: { stockQuantity: newQuantity },
      })

      return created
    })

    logger.inventoryUpdated(productId, transactionType, quantity)

    if (newQuantity <= product.minimumStock) {
      const user = await prisma.user.findUnique({ where: { id: auth.userId }, select: { email: true, name: true } })
      if (user?.email) {
        const lowStockResult = await sendLowStockEmail(user.email, user.name || "Store Owner", store.name || "Store", product.name, newQuantity, product.minimumStock)
        if (!lowStockResult.success) {
          logger.warn("Low stock email not sent", {
            product: product.name,
            email: user.email,
            error: lowStockResult.error,
          })
        }
      }
    }

    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    logger.error("POST /api/inventory error", error instanceof Error ? error : undefined)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
