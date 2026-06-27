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
    const productId = searchParams.get("productId")
    const expiringSoon = searchParams.get("expiringSoon")
    const expired = searchParams.get("expired")

    const where: Record<string, unknown> = {
      product: { storeId: store.id },
    }

    if (productId) {
      where.productId = productId
    }

    const now = new Date()
    if (expired === "true") {
      where.expiryDate = { lt: now }
      where.quantity = { gt: 0 }
    } else if (expiringSoon === "true") {
      const thirtyDays = new Date()
      thirtyDays.setDate(thirtyDays.getDate() + 30)
      where.expiryDate = { gte: now, lte: thirtyDays }
      where.quantity = { gt: 0 }
    }

    const batches = await prisma.medicineBatch.findMany({
      where: where as any,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            barcode: true,
            sku: true,
            sellingPrice: true,
            form: true,
            strength: true,
            manufacturer: true,
          },
        },
      },
      orderBy: { expiryDate: "asc" },
    })

    return NextResponse.json(batches)
  } catch (error) {
    logger.error("GET /api/pharmacy/batches error", error instanceof Error ? error : undefined)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userRole = (session.user as { role?: string }).role
    if (userRole !== "OWNER" && userRole !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden: insufficient permissions" }, { status: 403 })
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
    const { productId, batchNumber, expiryDate, purchasePrice, sellingPrice, quantity } = body

    if (!productId || !batchNumber || !expiryDate || quantity == null) {
      return NextResponse.json({ error: "Missing required fields: productId, batchNumber, expiryDate, quantity" }, { status: 400 })
    }

    if (typeof quantity !== "number" || quantity < 0) {
      return NextResponse.json({ error: "Quantity must be a non-negative number" }, { status: 400 })
    }

    const product = await prisma.product.findFirst({
      where: { id: productId, storeId: store.id },
    })
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    const existing = await prisma.medicineBatch.findUnique({
      where: { productId_batchNumber: { productId, batchNumber } },
    })
    if (existing) {
      return NextResponse.json({ error: "A batch with this number already exists for this product" }, { status: 409 })
    }

    const batch = await prisma.$transaction(async (tx) => {
      const created = await tx.medicineBatch.create({
        data: {
          productId,
          batchNumber,
          expiryDate: new Date(expiryDate),
          purchasePrice: purchasePrice ?? null,
          sellingPrice: sellingPrice ?? null,
          quantity,
        },
      })

      await tx.product.update({
        where: { id: productId },
        data: { stockQuantity: { increment: quantity } },
      })

      return created
    })

    return NextResponse.json(batch, { status: 201 })
  } catch (error) {
    logger.error("POST /api/pharmacy/batches error", error instanceof Error ? error : undefined)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
