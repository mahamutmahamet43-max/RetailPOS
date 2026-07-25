import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getCurrentStore } from "@/lib/store"
import { logger } from "@/lib/logger"
import { requireRole } from "@/lib/role"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const store = await getCurrentStore()
    const { id } = await params

    const product = await prisma.product.findFirst({
      where: { id, storeId: store.id },
      include: { category: true, productUnits: true },
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
    const authResult = await requireRole("OWNER", "MANAGER")
    if (authResult instanceof NextResponse) return authResult

    const store = await getCurrentStore()
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
    const {
      barcode,
      sku,
      name,
      description,
      image,
      costPrice,
      sellingPrice,
      stockQuantity,
      minimumStock,
      brand,
      unit,
      isActive,
      categoryId,
      productUnits,
    } = body

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return NextResponse.json(
          { error: "Product name is required" },
          { status: 400 }
        )
      }
    }

    if (sellingPrice !== undefined && Number(sellingPrice) <= 0) {
      return NextResponse.json(
        { error: "Selling price must be greater than 0" },
        { status: 400 }
      )
    }

    if (categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: categoryId, storeId: store.id },
      })

      if (!category) {
        return NextResponse.json(
          { error: "Category not found" },
          { status: 404 }
        )
      }
    }

    if (barcode) {
      const duplicate = await prisma.product.findFirst({
        where: {
          barcode,
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

    if (Array.isArray(productUnits)) {
      const existingUnits = await prisma.productUnit.findMany({
        where: { productId: id },
      })
      const existingIds = existingUnits.map((u) => u.id)
      const incomingIds = productUnits.filter((u: { id?: string | null }) => u.id).map((u: { id: string }) => u.id)
      const toDelete = existingIds.filter((eid) => !incomingIds.includes(eid))

      if (toDelete.length > 0) {
        await prisma.productUnit.deleteMany({
          where: { id: { in: toDelete } },
        })
      }

      for (const pu of productUnits) {
        if (pu.name && String(pu.name).trim()) {
          if (pu.id) {
            await prisma.productUnit.update({
              where: { id: pu.id },
              data: {
                name: String(pu.name).trim(),
                conversionFactor: Number(pu.conversionFactor) || 1,
                sellingPrice: pu.sellingPrice != null ? Number(pu.sellingPrice) : null,
                barcode: pu.barcode || null,
                isDefaultSaleUnit: Boolean(pu.isDefaultSaleUnit),
              },
            })
          } else {
            await prisma.productUnit.create({
              data: {
                productId: id,
                name: String(pu.name).trim(),
                conversionFactor: Number(pu.conversionFactor) || 1,
                sellingPrice: pu.sellingPrice != null ? Number(pu.sellingPrice) : null,
                barcode: pu.barcode || null,
                isBaseUnit: false,
                isDefaultSaleUnit: Boolean(pu.isDefaultSaleUnit),
              },
            })
          }
        }
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(barcode !== undefined && { barcode: barcode || null }),
        ...(sku !== undefined && { sku: sku || null }),
        ...(description !== undefined && { description: description || null }),
        ...(image !== undefined && { image: image || null }),
        ...(costPrice !== undefined && { costPrice: costPrice !== null ? Number(costPrice) : null }),
        ...(sellingPrice !== undefined && { sellingPrice: Number(sellingPrice) }),
        ...(stockQuantity !== undefined && { stockQuantity: Number(stockQuantity) }),
        ...(minimumStock !== undefined && { minimumStock: Number(minimumStock) }),
        ...(brand !== undefined && { brand: brand || null }),
        ...(unit !== undefined && { unit: unit || null }),
        ...(isActive !== undefined && { isActive }),
        ...(categoryId !== undefined && { categoryId }),
      },
      include: { category: true, productUnits: true },
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
    const authResult = await requireRole("OWNER")
    if (authResult instanceof NextResponse) return authResult

    const store = await getCurrentStore()
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
