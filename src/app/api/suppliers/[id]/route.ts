import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentStore, noStoreResponse } from "@/lib/store"
import { logger } from "@/lib/logger"
import { requireRole } from "@/lib/role"
import { validateOrError, supplierUpdateSchema } from "@/lib/api-validation"

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

    const supplier = await prisma.supplier.findFirst({
      where: { id, storeId: store.id },
      include: {
        purchases: {
          orderBy: { createdAt: "desc" },
          take: 50,
          include: { items: true },
        },
        _count: { select: { purchases: true } },
      },
    })

    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(supplier)
  } catch (error) {
    logger.error("GET /api/suppliers/[id] error", error instanceof Error ? error : undefined)
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

    const existing = await prisma.supplier.findFirst({
      where: { id, storeId: store.id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validation = validateOrError(supplierUpdateSchema, body)
    if (!validation.success) return validation.response
    const data = validation.data

    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.phone !== undefined && { phone: data.phone || null }),
        ...(data.email !== undefined && { email: data.email || null }),
        ...(data.address !== undefined && { address: data.address || null }),
        ...(data.notes !== undefined && { notes: data.notes || null }),
      },
    })

    return NextResponse.json(supplier)
  } catch (error) {
    logger.error("PATCH /api/suppliers/[id] error", error instanceof Error ? error : undefined)
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

    const existing = await prisma.supplier.findFirst({
      where: { id, storeId: store.id },
      include: { purchases: { take: 1 } },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      )
    }

    if (existing.purchases.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete supplier with existing purchases. Deactivate instead." },
        { status: 409 }
      )
    }

    await prisma.supplier.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error("DELETE /api/suppliers/[id] error", error instanceof Error ? error : undefined)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
