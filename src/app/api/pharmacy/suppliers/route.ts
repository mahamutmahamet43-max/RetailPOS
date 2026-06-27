import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const store = await prisma.store.findFirst({
      where: { ownerId: session.user.id },
    })
    if (!store) {
      return NextResponse.json({ error: "No store found" }, { status: 404 })
    }

    const setting = await prisma.storeSetting.findUnique({
      where: { storeId: store.id },
    })
    if (!setting?.enablePharmacyModule) {
      return NextResponse.json({ error: "Pharmacy module not enabled" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""

    const where: Record<string, unknown> = {
      storeId: store.id,
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
      ]
    }

    const suppliers = await prisma.supplier.findMany({
      where: where as any,
      orderBy: { name: "asc" },
    })

    return NextResponse.json(suppliers)
  } catch (error) {
    logger.error("GET /api/pharmacy/suppliers error", error instanceof Error ? error : undefined)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userRole = (session.user as { role?: string }).role
    if (userRole !== "OWNER" && userRole !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden: insufficient permissions" }, { status: 403 })
    }

    const store = await prisma.store.findFirst({
      where: { ownerId: session.user.id },
    })
    if (!store) {
      return NextResponse.json({ error: "No store found" }, { status: 404 })
    }

    const setting = await prisma.storeSetting.findUnique({
      where: { storeId: store.id },
    })
    if (!setting?.enablePharmacyModule) {
      return NextResponse.json({ error: "Pharmacy module not enabled" }, { status: 403 })
    }

    const body = await request.json()
    const { name, phone, email, address, notes } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Supplier name is required" }, { status: 400 })
    }

    const supplier = await prisma.supplier.create({
      data: {
        name: name.trim(),
        phone: phone || null,
        email: email || null,
        address: address || null,
        notes: notes || null,
        storeId: store.id,
      },
    })

    return NextResponse.json(supplier, { status: 201 })
  } catch (error) {
    logger.error("POST /api/pharmacy/suppliers error", error instanceof Error ? error : undefined)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
