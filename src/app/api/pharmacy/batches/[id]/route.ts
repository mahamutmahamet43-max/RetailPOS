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

    const batch = await prisma.medicineBatch.findFirst({
      where: { id, product: { storeId: store.id } },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            barcode: true,
            sku: true,
            sellingPrice: true,
            costPrice: true,
            stockQuantity: true,
            form: true,
            strength: true,
            dosage: true,
            manufacturer: true,
          },
        },
      },
    })

    if (!batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 })
    }

    return NextResponse.json(batch)
  } catch (error) {
    logger.error("GET /api/pharmacy/batches/[id] error", error instanceof Error ? error : undefined)
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

    const existing = await prisma.medicineBatch.findFirst({
      where: { id, product: { storeId: store.id } },
    })
    if (!existing) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 })
    }

    const body = await request.json()
    const { quantity, sellingPrice, purchasePrice, expiryDate } = body

    if (quantity !== undefined && (typeof quantity !== "number" || quantity < 0)) {
      return NextResponse.json({ error: "Quantity must be a non-negative number" }, { status: 400 })
    }

    const quantityDiff = quantity !== undefined ? quantity - existing.quantity : 0

    const batch = await prisma.$transaction(async (tx) => {
      const updated = await tx.medicineBatch.update({
        where: { id },
        data: {
          ...(quantity !== undefined && { quantity }),
          ...(sellingPrice !== undefined && { sellingPrice }),
          ...(purchasePrice !== undefined && { purchasePrice }),
          ...(expiryDate !== undefined && { expiryDate: new Date(expiryDate) }),
        },
      })

      if (quantityDiff !== 0) {
        await tx.product.update({
          where: { id: existing.productId },
          data: { stockQuantity: { increment: quantityDiff } },
        })
      }

      return updated
    })

    return NextResponse.json(batch)
  } catch (error) {
    logger.error("PUT /api/pharmacy/batches/[id] error", error instanceof Error ? error : undefined)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const existing = await prisma.medicineBatch.findFirst({
      where: { id, product: { storeId: store.id } },
    })
    if (!existing) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 })
    }

    await prisma.$transaction(async (tx) => {
      await tx.medicineBatch.delete({ where: { id } })

      await tx.product.update({
        where: { id: existing.productId },
        data: { stockQuantity: { decrement: existing.quantity } },
      })
    })

    return NextResponse.json({ message: "Batch deleted" })
  } catch (error) {
    logger.error("DELETE /api/pharmacy/batches/[id] error", error instanceof Error ? error : undefined)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
