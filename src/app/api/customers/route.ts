import { NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getCurrentStore } from "@/lib/store"
import { logger } from "@/lib/logger"
import { validateOrError, customerSchema } from "@/lib/api-validation"
import { enforceLimit } from "@/lib/subscription/enforce"
import { requireRole } from "@/lib/role"

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const store = await getCurrentStore()
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
    const authResult = await requireRole("OWNER", "MANAGER")
    if (authResult instanceof NextResponse) return authResult

    const store = await getCurrentStore()
    const body = await request.json()
    const validation = validateOrError(customerSchema, body)
    if (!validation.success) return validation.response

    const data = validation.data

    const customerCount = await prisma.customer.count({ where: { storeId: store.id, isActive: true } })
    const limitCheck = await enforceLimit(store.id, "customers", customerCount)
    if (limitCheck) return limitCheck

    const existingPhone = await prisma.customer.findFirst({
      where: { phone: data.phone.trim(), storeId: store.id },
    })

    if (existingPhone) {
      return NextResponse.json(
        { error: "A customer with this phone number already exists" },
        { status: 409 }
      )
    }

    let customer = null
    let retries = 3
    while (retries > 0) {
      try {
        const lastCust = await prisma.customer.findFirst({
          where: { storeId: store.id },
          orderBy: { customerCode: "desc" },
          select: { customerCode: true },
        })
        let num = 1
        if (lastCust?.customerCode) {
          const parsed = parseInt(lastCust.customerCode.replace("CUST-", ""), 10)
          if (!isNaN(parsed)) num = parsed + 1
        }
        const code = `CUST-${String(num).padStart(6, "0")}`

        customer = await prisma.customer.create({
          data: {
            customerCode: code,
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
        break
      } catch (error) {
        retries--
        if (retries <= 0) throw error
        await new Promise((r) => setTimeout(r, 50))
      }
    }

    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    logger.error("POST /api/customers error", error instanceof Error ? error : undefined)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
