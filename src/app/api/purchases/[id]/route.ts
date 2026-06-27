import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentStore, noStoreResponse } from "@/lib/store"
import { logger } from "@/lib/logger"
import { validateOrError, purchaseSchema } from "@/lib/api-validation"
import { requireRole } from "@/lib/role"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireRole("OWNER", "MANAGER", "CASHIER")
    if (authResult instanceof NextResponse) return authResult

    const store = await getCurrentStore()
    if (!store) return noStoreResponse()
    const { id } = await params

    const purchase = await prisma.purchase.findFirst({
      where: { id, storeId: store.id },
      include: {
        items: true,
        supplier: { select: { id: true, name: true, phone: true } },
        transactions: {
          orderBy: { createdAt: "desc" },
        },
      },
    })

    if (!purchase) {
      return NextResponse.json(
        { error: "Purchase not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(purchase)
  } catch (error) {
    logger.error("GET /api/purchases/[id] error", error instanceof Error ? error : undefined)
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
    if (!store) return noStoreResponse()
    const { id } = await params

    const existing = await prisma.purchase.findFirst({
      where: { id, storeId: store.id },
      include: { items: true },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Purchase not found" },
        { status: 404 }
      )
    }

    if (existing.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Cannot edit a cancelled purchase" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validation = validateOrError(purchaseSchema, body)
    if (!validation.success) return validation.response

    const { invoiceNumber, supplierId, supplierName, notes, status, items } = validation.data

    const duplicateInvoice = await prisma.purchase.findFirst({
      where: { invoiceNumber, storeId: store.id, id: { not: id } },
    })

    if (duplicateInvoice) {
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

    const wasCompleted = existing.status === "COMPLETED"
    const isCompleted = status === "COMPLETED"

    const result = await prisma.$transaction(async (tx) => {
      if (wasCompleted) {
        for (const oldItem of existing.items) {
          const product = await tx.product.findUnique({ where: { id: oldItem.productId } })
          if (product) {
            const baseQty = Math.round(oldItem.quantity * oldItem.unitConversionFactor)
            await tx.product.update({
              where: { id: oldItem.productId },
              data: { stockQuantity: Math.max(0, product.stockQuantity - baseQty) },
            })
          }
        }

        await tx.inventoryTransaction.deleteMany({
          where: { purchaseId: id },
        })
      }

      await tx.purchaseItem.deleteMany({ where: { purchaseId: id } })

      const purchase = await tx.purchase.update({
        where: { id },
        data: {
          invoiceNumber,
          supplierId: supplierId || null,
          supplierName,
          notes: notes || null,
          total: items.reduce((sum, i) => sum + i.costPrice * i.quantity, 0),
          status,
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
          const current = await tx.product.findUnique({
            where: { id: item.productId },
            select: { stockQuantity: true },
          })
          const baseQuantity = Math.round(item.quantity * item.unitConversionFactor)
          const previousStock = current?.stockQuantity ?? 0
          const newStock = previousStock + baseQuantity

          await tx.product.update({
            where: { id: item.productId },
            data: { stockQuantity: newStock },
          })

          await tx.inventoryTransaction.create({
            data: {
              transactionType: "IN",
              quantity: baseQuantity,
              previousStock,
              newStock,
              reason: `Purchase #${invoiceNumber}`,
              storeId: store.id,
              productId: item.productId,
              createdBy: authResult.userId,
              purchaseId: purchase.id,
            },
          })
        }
      }

      return purchase
    })

    return NextResponse.json(result)
  } catch (error) {
    logger.error("PATCH /api/purchases/[id] error", error instanceof Error ? error : undefined)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireRole("OWNER")
    if (authResult instanceof NextResponse) return authResult

    const store = await getCurrentStore()
    if (!store) return noStoreResponse()
    const { id } = await params

    const existing = await prisma.purchase.findFirst({
      where: { id, storeId: store.id },
      include: { items: true },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Purchase not found" },
        { status: 404 }
      )
    }

    if (existing.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Purchase is already cancelled" },
        { status: 400 }
      )
    }

    await prisma.$transaction(async (tx) => {
      if (existing.status === "COMPLETED") {
        for (const item of existing.items) {
          const product = await tx.product.findUnique({ where: { id: item.productId } })
          if (product) {
            const baseQty = Math.round(item.quantity * item.unitConversionFactor)
            await tx.product.update({
              where: { id: item.productId },
              data: { stockQuantity: Math.max(0, product.stockQuantity - baseQty) },
            })
          }
        }
      }

      await tx.inventoryTransaction.deleteMany({ where: { purchaseId: id } })

      await tx.purchaseItem.deleteMany({ where: { purchaseId: id } })

      await tx.purchase.update({
        where: { id },
        data: { status: "CANCELLED", total: 0 },
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error("DELETE /api/purchases/[id] error", error instanceof Error ? error : undefined)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
