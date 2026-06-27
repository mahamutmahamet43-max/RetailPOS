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
    const customerId = searchParams.get("customerId") || ""

    const where: Record<string, unknown> = {
      customer: { storeId: store.id },
    }

    if (customerId) {
      where.customerId = customerId
    }

    const prescriptions = await prisma.prescription.findMany({
      where: where as any,
      include: {
        customer: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
        sale: {
          select: { id: true, saleNumber: true, createdAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(prescriptions)
  } catch (error) {
    logger.error("GET /api/pharmacy/prescriptions error", error instanceof Error ? error : undefined)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
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

    const body = await request.json()
    const { customerId, saleId, doctorName, prescriptionNumber, notes } = body

    if (!customerId) {
      return NextResponse.json({ error: "Customer ID is required" }, { status: 400 })
    }

    const customer = await prisma.customer.findFirst({
      where: { id: customerId, storeId: store.id },
    })
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    if (saleId) {
      const sale = await prisma.sale.findFirst({
        where: { id: saleId, storeId: store.id },
      })
      if (!sale) {
        return NextResponse.json({ error: "Sale not found" }, { status: 404 })
      }
    }

    const prescription = await prisma.prescription.create({
      data: {
        customerId,
        saleId: saleId || null,
        doctorName: doctorName || null,
        prescriptionNumber: prescriptionNumber || null,
        notes: notes || null,
      },
      include: {
        customer: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
        sale: {
          select: { id: true, saleNumber: true },
        },
      },
    })

    return NextResponse.json(prescription, { status: 201 })
  } catch (error) {
    logger.error("POST /api/pharmacy/prescriptions error", error instanceof Error ? error : undefined)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
