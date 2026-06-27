import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || ""

    const where: Record<string, unknown> = {
      storeId: store.id,
    }

    if (status && ["PENDING", "COMPLETED", "CANCELLED"].includes(status)) {
      where.status = status
    }

    const purchases = await prisma.purchase.findMany({
      where: where as any,
      include: {
        items: {
          include: {
            batch: true,
          },
        },
        supplier: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(purchases)
  } catch (error) {
    logger.error("GET /api/pharmacy/purchases error", error instanceof Error ? error : undefined)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
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

    const body = await request.json()
    const { supplierId, supplierName, notes, items } = body

    if (!supplierName || !supplierName.trim()) {
      return NextResponse.json({ error: "Supplier name is required" }, { status: 400 })
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "At least one purchase item is required" }, { status: 400 })
    }

    for (const item of items) {
      if (!item.productId || !item.productName || item.quantity == null || item.unitCost == null) {
        return NextResponse.json({ error: "Each item must have productId, productName, quantity, and unitCost" }, { status: 400 })
      }
      if (typeof item.quantity !== "number" || item.quantity <= 0) {
        return NextResponse.json({ error: "Item quantity must be a positive number" }, { status: 400 })
      }
    }

    const productIds = items.map((i: { productId: string }) => i.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, storeId: store.id },
    })
    if (products.length !== productIds.length) {
      return NextResponse.json({ error: "One or more products not found" }, { status: 404 })
    }
    const productMap = new Map(products.map((p) => [p.id, p]))

    const totalAmount = items.reduce(
      (sum: number, item: { quantity: number; unitCost: number }) => sum + item.quantity * item.unitCost,
      0
    )

    const lastPurchase = await prisma.purchase.findFirst({
      where: { storeId: store.id },
      orderBy: { createdAt: "desc" },
      select: { purchaseNumber: true },
    })

    let nextNumber = 1
    if (lastPurchase?.purchaseNumber) {
      const num = parseInt(lastPurchase.purchaseNumber.replace("PUR-", ""))
      if (!isNaN(num)) nextNumber = num + 1
    }
    const purchaseNumber = `PUR-${String(nextNumber).padStart(6, "0")}`

    const purchase = await prisma.$transaction(async (tx) => {
      const created = await tx.purchase.create({
        data: {
          purchaseNumber,
          supplierId: supplierId || null,
          supplierName: supplierName.trim(),
          notes: notes || null,
          totalAmount,
          status: "COMPLETED",
          storeId: store.id,
          items: {
            create: items.map((item: { productId: string; productName: string; quantity: number; unitCost: number; batchNumber?: string; expiryDate?: string; sellingPrice?: number }) => {
              const product = productMap.get(item.productId)!
              const totalCost = item.quantity * item.unitCost
              return {
                productId: item.productId,
                productName: item.productName,
                quantity: item.quantity,
                unitCost: item.unitCost,
                totalCost,
              }
            }),
          },
        },
        include: { items: true },
      })

      for (const item of created.items) {
        const product = productMap.get(item.productId)!
        const reqItem = items.find((i: { productId: string }) => i.productId === item.productId)!

        const batch = await tx.medicineBatch.create({
          data: {
            productId: item.productId,
            batchNumber: reqItem.batchNumber || `BATCH-${purchaseNumber}-${item.id.slice(0, 6)}`,
            expiryDate: reqItem.expiryDate ? new Date(reqItem.expiryDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            purchasePrice: item.unitCost,
            sellingPrice: reqItem.sellingPrice ?? product.sellingPrice,
            quantity: item.quantity,
          },
        })

        await tx.purchaseItem.update({
          where: { id: item.id },
          data: { batchId: batch.id },
        })

        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { increment: item.quantity } },
        })

        await tx.inventoryTransaction.create({
          data: {
            transactionType: "IN",
            quantity: item.quantity,
            previousStock: product.stockQuantity,
            newStock: product.stockQuantity + item.quantity,
            reason: `Purchase #${purchaseNumber}`,
            storeId: store.id,
            productId: item.productId,
            createdBy: session.user.id,
            purchaseId: created.id,
          },
        })
      }

      return tx.purchase.findUnique({
        where: { id: created.id },
        include: {
          items: {
            include: { batch: true },
          },
          supplier: { select: { id: true, name: true } },
        },
      })
    })

    return NextResponse.json(purchase, { status: 201 })
  } catch (error) {
    logger.error("POST /api/pharmacy/purchases error", error instanceof Error ? error : undefined)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
