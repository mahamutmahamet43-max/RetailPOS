import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getCurrentStore, noStoreResponse } from "@/lib/store"
import { logger } from "@/lib/logger"

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

    const existing = await prisma.category.findFirst({
      where: { id, storeId: store.id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { name, description, color, icon, isActive } = body

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return NextResponse.json(
          { error: "Name is required" },
          { status: 400 }
        )
      }

      const duplicate = await prisma.category.findFirst({
        where: {
          storeId: store.id,
          name: name.trim(),
          id: { not: id },
        },
      })

      if (duplicate) {
        return NextResponse.json(
          { error: "A category with this name already exists" },
          { status: 409 }
        )
      }
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description || null }),
        ...(color !== undefined && { color: color || null }),
        ...(icon !== undefined && { icon: icon || null }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    return NextResponse.json(category)
  } catch (error) {
    logger.error("PATCH /api/categories/[id] error", error instanceof Error ? error : undefined)
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

    const existing = await prisma.category.findFirst({
      where: { id, storeId: store.id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      )
    }

    const productCount = await prisma.product.count({
      where: { categoryId: id },
    })

    if (productCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete category with existing products" },
        { status: 409 }
      )
    }

    await prisma.category.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error("DELETE /api/categories/[id] error", error instanceof Error ? error : undefined)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
