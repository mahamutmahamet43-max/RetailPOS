import { NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { getCurrentStore, noStoreResponse } from "@/lib/store"
import { logger } from "@/lib/logger"
import { validateOrError, customerSchema } from "@/lib/api-validation"
import { requireRole } from "@/lib/role"

export async function GET(request: Request) {
  try {
    const auth = await requireRole("OWNER", "MANAGER", "CASHIER")
    if (auth instanceof NextResponse) return auth

    const store = await getCurrentStore()
    if (!store) return noStoreResponse()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const status = searchParams.get("status") || "all"
    const skip = (page - 1) * limit

    const where: Prisma.CustomerWhereInput = {
      storeId: store.id,
    }

    if (status === "active") {
      where.isActive = true
    } else if (status === "inactive") {
      where.isActive = false
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { customerCode: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ]
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.customer.count({ where }),
    ])

    return NextResponse.json({
      customers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    logger.error("GET /api/customers error", error instanceof Error ? error : undefined)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireRole("OWNER", "MANAGER")
    if (auth instanceof NextResponse) return auth

    const store = await getCurrentStore()
    if (!store) return noStoreResponse()
    const body = await request.json()
    const validation = validateOrError(customerSchema, body)
    if (!validation.success) return validation.response

    const data = validation.data

    const existingPhone = await prisma.customer.findFirst({
      where: { phone: data.phone.trim(), storeId: store.id },
    })

    if (existingPhone) {
      return NextResponse.json(
        { error: "A customer with this phone number already exists" },
        { status: 409 }
      )
    }

    const lastCustomer = await prisma.customer.findFirst({
      where: { storeId: store.id },
      orderBy: { customerCode: "desc" },
    })

    let nextNumber = 1
    if (lastCustomer?.customerCode) {
      const num = parseInt(lastCustomer.customerCode.replace("CUST-", ""), 10)
      if (!isNaN(num)) nextNumber = num + 1
    }
    const customerCode = `CUST-${String(nextNumber).padStart(6, "0")}`

    const customer = await prisma.customer.create({
      data: {
        customerCode,
        firstName: data.firstName.trim(),
        lastName: data.lastName?.trim() || null,
        phone: data.phone.trim(),
        email: data.email?.trim() || null,
        address: data.address?.trim() || null,
        notes: data.notes?.trim() || null,
        creditLimit: data.creditLimit,
        storeId: store.id,
      },
    })

    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    logger.error("POST /api/customers error", error instanceof Error ? error : undefined)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
