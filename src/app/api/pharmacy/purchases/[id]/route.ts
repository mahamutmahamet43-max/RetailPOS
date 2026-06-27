import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const store = await prisma.store.findFirst({
      where: { ownerId: session.user.id },
    })
    if (!store) {
      return NextResponse.json({ error: "No store found" }, { status: 404 })
    }

    const setting = await prisma.storeSetting.findUnique({
      where: { storeId: store.id },
    })
    if (!setting?.enablePharmacyModule) {
      return NextResponse.json({ error: "Pharmacy module not enabled" }, { status: 403 })
    }

    const { id } = await params

    const purchase = await prisma.purchase.findFirst({
      where: { id, storeId: store.id },
      include: {
        items: {
          include: { batch: true },
        },
        supplier: {
          select: { id: true, name: true, phone: true, email: true },
        },
      },
    })

    if (!purchase) {
      return NextResponse.json({ error: "Purchase not found" }, { status: 404 })
    }

    return NextResponse.json(purchase)
  } catch (error) {
    logger.error("GET /api/pharmacy/purchases/[id] error", error instanceof Error ? error : undefined)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const store = await prisma.store.findFirst({
      where: { ownerId: session.user.id },
    })
    if (!store) {
      return NextResponse.json({ error: "No store found" }, { status: 404 })
    }

    const setting = await prisma.storeSetting.findUnique({
      where: { storeId: store.id },
    })
    if (!setting?.enablePharmacyModule) {
      return NextResponse.json({ error: "Pharmacy module not enabled" }, { status: 403 })
    }

    const { id } = await params

    const existing = await prisma.purchase.findFirst({
      where: { id, storeId: store.id },
      include: { items: true },
    })
    if (!existing) {
      return NextResponse.json({ error: "Purchase not found" }, { status: 404 })
    }

    const body = await request.json()
    const { status } = body

    if (!status || !["COMPLETED", "CANCELLED"].includes(status)) {
      return NextResponse.json({ error: "Status must be COMPLETED or CANCELLED" }, { status: 400 })
    }

    if (existing.status === status) {
      return NextResponse.json({ error: `Purchase is already ${status}` }, { status: 400 })
    }

    if (existing.status === "CANCELLED") {
      return NextResponse.json({ error: "Cannot update a cancelled purchase" }, { status: 400 })
    }

    const purchase = await prisma.$transaction(async (tx) => {
      if (status === "CANCELLED") {
        for (const item of existing.items) {
          const product = await tx.product.findUnique({ where: { id: item.productId } })
          if (product) {
            const newStock = Math.max(0, product.stockQuantity - item.quantity)
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
                reason: `Purchase #${existing.purchaseNumber} cancelled`,
                storeId: store.id,
                productId: item.productId,
                createdBy: session.user.id,
                purchaseId: existing.id,
              },
            })
          }

          if (item.batchId) {
            await tx.medicineBatch.update({
              where: { id: item.batchId },
              data: { quantity: { decrement: item.quantity } },
            })
          }
        }
      }

      return tx.purchase.update({
        where: { id },
        data: { status: status as any },
        include: {
          items: {
            include: { batch: true },
          },
          supplier: { select: { id: true, name: true } },
        },
      })
    })

    return NextResponse.json(purchase)
  } catch (error) {
    logger.error("PUT /api/pharmacy/purchases/[id] error", error instanceof Error ? error : undefined)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
