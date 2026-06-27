import { NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getCurrentStore, noStoreResponse } from "@/lib/store"
import { logger } from "@/lib/logger"
import { validateOrError, inventorySchema } from "@/lib/api-validation"
import { sendLowStockEmail } from "@/lib/email/service"

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const store = await getCurrentStore()
    if (!store) return noStoreResponse()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const type = searchParams.get("type") || ""
    const from = searchParams.get("from") || ""
    const to = searchParams.get("to") || ""
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
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
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const store = await getCurrentStore()
    if (!store) return noStoreResponse()
    const body = await request.json()
    const validation = validateOrError(inventorySchema, body)
    if (!validation.success) return validation.response

    const { transactionType, productId, quantity, reason, notes } = validation.data

    const product = await prisma.product.findFirst({
      where: { id: productId, storeId: store.id },
    })

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      )
    }

    const previousStock = product.stockQuantity

    if (transactionType === "OUT" && quantity > previousStock) {
      return NextResponse.json(
        { error: `Stock out cannot reduce stock below zero. Current stock: ${previousStock}` },
        { status: 400 }
      )
    }

    const newQuantity =
      transactionType === "ADJUSTMENT"
        ? quantity
        : transactionType === "IN"
          ? previousStock + quantity
          : previousStock - quantity

    if (newQuantity < 0) {
      return NextResponse.json(
        { error: "New stock value must be zero or greater" },
        { status: 400 }
      )
    }

    const [transaction] = await prisma.$transaction([
      prisma.inventoryTransaction.create({
        data: {
          transactionType,
          quantity: transactionType === "ADJUSTMENT" ? newQuantity : quantity,
          previousStock,
          newStock: newQuantity,
          reason: reason.trim(),
          reference: notes?.trim() || null,
          storeId: store.id,
          productId,
          createdBy: session.user.id,
        },
        include: {
          product: { select: { id: true, name: true, sku: true } },
          creator: { select: { id: true, name: true } },
        },
      }),
      prisma.product.update({
        where: { id: productId },
        data: { stockQuantity: newQuantity },
      }),
    ])

    logger.inventoryUpdated(productId, transactionType, quantity)

    if (newQuantity <= product.minimumStock && session.user.email) {
      sendLowStockEmail(session.user.email, session.user.name || "Store Owner", store.name || "Store", product.name, newQuantity, product.minimumStock).catch(() => {})
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
