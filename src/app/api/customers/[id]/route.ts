import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getCurrentStore } from "@/lib/store"
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
    const { id } = await params

    const customer = await prisma.customer.findFirst({
      where: { id, storeId: store.id },
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
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const store = await getCurrentStore()
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

    const {
      firstName,
      lastName,
      companyName,
      phone,
      email,
      address,
      city,
      notes,
      creditLimit,
      isActive,
    } = body

    if (firstName !== undefined) {
      if (typeof firstName !== "string" || !firstName.trim()) {
        return NextResponse.json(
          { error: "First name is required" },
          { status: 400 }
        )
      }
    }

    if (creditLimit !== undefined && Number(creditLimit) < 0) {
      return NextResponse.json(
        { error: "Credit limit cannot be negative" },
        { status: 400 }
      )
    }

    if (phone !== undefined && phone.trim()) {
      const duplicate = await prisma.customer.findFirst({
        where: {
          phone: phone.trim(),
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
        ...(firstName !== undefined && { firstName: firstName.trim() }),
        ...(lastName !== undefined && { lastName: lastName?.trim() || null }),
        ...(companyName !== undefined && { companyName: companyName?.trim() || null }),
        ...(phone !== undefined && { phone: phone.trim() }),
        ...(email !== undefined && { email: email?.trim() || null }),
        ...(address !== undefined && { address: address?.trim() || null }),
        ...(city !== undefined && { city: city?.trim() || null }),
        ...(notes !== undefined && { notes: notes?.trim() || null }),
        ...(creditLimit !== undefined && { creditLimit: Number(creditLimit) }),
        ...(isActive !== undefined && { isActive }),
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
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const store = await getCurrentStore()
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
