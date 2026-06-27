import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentStore, noStoreResponse } from "@/lib/store"
import { logger } from "@/lib/logger"
import { requireRole } from "@/lib/role"
import { validateOrError, productUpdateSchema } from "@/lib/api-validation"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole("OWNER", "MANAGER", "CASHIER")
    if (auth instanceof NextResponse) return auth

    const store = await getCurrentStore()
    if (!store) return noStoreResponse()
    const { id } = await params

    const product = await prisma.product.findFirst({
      where: { id, storeId: store.id },
      include: { category: true, units: true },
    })

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(product)
  } catch (error) {
    logger.error("GET /api/products/[id] error", error instanceof Error ? error : undefined)
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
    const auth = await requireRole("OWNER", "MANAGER")
    if (auth instanceof NextResponse) return auth

    const store = await getCurrentStore()
    if (!store) return noStoreResponse()
    const { id } = await params

    const existing = await prisma.product.findFirst({
      where: { id, storeId: store.id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validation = validateOrError(productUpdateSchema, body)
    if (!validation.success) return validation.response
    const data = validation.data

    if (data.categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: data.categoryId, storeId: store.id },
      })

      if (!category) {
        return NextResponse.json(
          { error: "Category not found" },
          { status: 404 }
        )
      }
    }

    if (data.barcode) {
      const duplicate = await prisma.product.findFirst({
        where: {
          barcode: data.barcode,
          storeId: store.id,
          id: { not: id },
        },
      })

      if (duplicate) {
        return NextResponse.json(
          { error: "A product with this barcode already exists in your store" },
          { status: 409 }
        )
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.barcode !== undefined && { barcode: data.barcode || null }),
        ...(data.sku !== undefined && { sku: data.sku || null }),
        ...(data.description !== undefined && { description: data.description || null }),
        ...(data.imageUrl !== undefined && { image: data.imageUrl || null }),
        ...(data.costPrice !== undefined && { costPrice: data.costPrice }),
        ...(data.sellingPrice !== undefined && { sellingPrice: data.sellingPrice }),
        ...(data.stockQuantity !== undefined && { stockQuantity: data.stockQuantity }),
        ...(data.minimumStock !== undefined && { minimumStock: data.minimumStock }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
        ...(data.isPharmacyItem !== undefined && { isPharmacyItem: data.isPharmacyItem }),
        ...(data.requiresPrescription !== undefined && { requiresPrescription: data.requiresPrescription }),
      },
      include: { category: true },
    })

    return NextResponse.json(product)
  } catch (error) {
    logger.error("PATCH /api/products/[id] error", error instanceof Error ? error : undefined)
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
    const auth = await requireRole("OWNER")
    if (auth instanceof NextResponse) return auth

    const store = await getCurrentStore()
    if (!store) return noStoreResponse()
    const { id } = await params

    const existing = await prisma.product.findFirst({
      where: { id, storeId: store.id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      )
    }

    await prisma.product.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error("DELETE /api/products/[id] error", error instanceof Error ? error : undefined)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
