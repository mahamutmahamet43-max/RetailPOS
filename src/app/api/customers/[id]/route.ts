import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentStore, noStoreResponse } from "@/lib/store"
import { logger } from "@/lib/logger"
import { requireRole } from "@/lib/role"
import { validateOrError, customerUpdateSchema } from "@/lib/api-validation"

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

    const customer = await prisma.customer.findFirst({
      where: { id, storeId: store.id },
      include: {
        sales: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: { items: true, cashier: { select: { name: true } } },
        },
        _count: { select: { sales: true } },
      },
    })

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(customer)
  } catch (error) {
    logger.error("GET /api/customers/[id] error", error instanceof Error ? error : undefined)
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

    const existing = await prisma.customer.findFirst({
      where: { id, storeId: store.id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validation = validateOrError(customerUpdateSchema, body)
    if (!validation.success) return validation.response
    const data = validation.data

    if (data.phone !== undefined && data.phone.trim()) {
      const duplicate = await prisma.customer.findFirst({
        where: {
          phone: data.phone.trim(),
          storeId: store.id,
          id: { not: id },
        },
      })

      if (duplicate) {
        return NextResponse.json(
          { error: "A customer with this phone number already exists" },
          { status: 409 }
        )
      }
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        ...(data.firstName !== undefined && { firstName: data.firstName.trim() }),
        ...(data.lastName !== undefined && { lastName: data.lastName?.trim() || null }),
        ...(data.phone !== undefined && { phone: data.phone.trim() }),
        ...(data.email !== undefined && { email: data.email?.trim() || null }),
        ...(data.address !== undefined && { address: data.address?.trim() || null }),
        ...(data.notes !== undefined && { notes: data.notes?.trim() || null }),
        ...(data.creditLimit !== undefined && { creditLimit: data.creditLimit }),
      },
    })

    return NextResponse.json(customer)
  } catch (error) {
    logger.error("PATCH /api/customers/[id] error", error instanceof Error ? error : undefined)
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

    const existing = await prisma.customer.findFirst({
      where: { id, storeId: store.id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      )
    }

    // Soft-delete: mark inactive instead of removing
    await prisma.customer.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error("DELETE /api/customers/[id] error", error instanceof Error ? error : undefined)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
