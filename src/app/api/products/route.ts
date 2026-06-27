import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getCurrentStore, noStoreResponse } from "@/lib/store"
import { logger } from "@/lib/logger"
import { validateOrError, productSchema } from "@/lib/api-validation"
import { enforceLimit } from "@/lib/subscription/enforce"

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
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    const where = {
      storeId: store.id,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { barcode: { contains: search, mode: "insensitive" as const } },
              { sku: { contains: search, mode: "insensitive" as const } },
              { brand: { contains: search, mode: "insensitive" as const } },
              { genericName: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ])

    return NextResponse.json({
      products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    logger.error("GET /api/products error", error instanceof Error ? error : undefined)
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
    const validation = validateOrError(productSchema, body)
    if (!validation.success) return validation.response

    const data = validation.data

    const productCount = await prisma.product.count({ where: { storeId: store.id, isActive: true } })
    const limitCheck = await enforceLimit(store.id, "products", productCount)
    if (limitCheck) return limitCheck

    const category = await prisma.category.findFirst({
      where: { id: data.categoryId, storeId: store.id },
    })

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      )
    }

    if (data.barcode) {
      const existingBarcode = await prisma.product.findFirst({
        where: { barcode: data.barcode, storeId: store.id },
      })

      if (existingBarcode) {
        return NextResponse.json(
          { error: "A product with this barcode already exists in your store" },
          { status: 409 }
        )
      }
    }

    const product = await prisma.product.create({
      data: {
        barcode: data.barcode || null,
        sku: data.sku || null,
        name: data.name.trim(),
        description: data.description || null,
        image: data.imageUrl || null,
        costPrice: data.costPrice,
        sellingPrice: data.sellingPrice,
        stockQuantity: data.stockQuantity,
        minimumStock: data.minimumStock,
        isActive: data.isActive,
        storeId: store.id,
        categoryId: data.categoryId,
        manufacturer: data.manufacturer || null,
        genericName: data.genericName || null,
        dosage: data.dosage || null,
        strength: data.strength || null,
        form: data.form || null,
        prescriptionRequired: data.prescriptionRequired ?? false,
        medicineCategory: data.medicineCategory || null,
      },
      include: { category: { select: { id: true, name: true } } },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    logger.error("POST /api/products error", error instanceof Error ? error : undefined)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
