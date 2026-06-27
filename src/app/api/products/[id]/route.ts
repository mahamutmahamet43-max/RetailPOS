import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getCurrentStore, noStoreResponse } from "@/lib/store"
import { logger } from "@/lib/logger"

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
    if (!store) return noStoreResponse()
    const { id } = await params

    const product = await prisma.product.findFirst({
      where: { id, storeId: store.id },
      include: { category: true },
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
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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
      manufacturer,
      genericName,
      dosage,
      strength,
      form,
      prescriptionRequired,
      medicineCategory,
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
        ...(manufacturer !== undefined && { manufacturer: manufacturer || null }),
        ...(genericName !== undefined && { genericName: genericName || null }),
        ...(dosage !== undefined && { dosage: dosage || null }),
        ...(strength !== undefined && { strength: strength || null }),
        ...(form !== undefined && { form: form || null }),
        ...(prescriptionRequired !== undefined && { prescriptionRequired }),
        ...(medicineCategory !== undefined && { medicineCategory: medicineCategory || null }),
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
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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
