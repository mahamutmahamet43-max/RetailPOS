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

    const sale = await prisma.sale.findFirst({
      where: { id, storeId: store.id },
      include: {
        items: true,
        customer: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
        cashier: { select: { id: true, name: true } },
      },
    })

    if (!sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 })
    }

    return NextResponse.json(sale)
  } catch (error) {
    logger.error("GET /api/sales/[id] error", error instanceof Error ? error : undefined)
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
    const body = await request.json()

    if (body.action !== "void") {
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      )
    }

    const sale = await prisma.sale.findFirst({
      where: { id, storeId: store.id },
      include: { items: true },
    })

    if (!sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 })
    }

    if (sale.status === "VOID") {
      return NextResponse.json(
        { error: "Sale is already voided" },
        { status: 400 }
      )
    }

    const voided = await prisma.$transaction(async (tx) => {
      const updated = await tx.sale.update({
        where: { id },
        data: { status: "VOID" },
        include: {
          items: true,
          customer: {
            select: { id: true, firstName: true, lastName: true },
          },
          cashier: { select: { id: true, name: true } },
        },
      })

      for (const item of sale.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        })

        if (product) {
          const newStock = product.stockQuantity + item.quantity

          await tx.product.update({
            where: { id: item.productId },
            data: { stockQuantity: newStock },
          })

          await tx.inventoryTransaction.create({
            data: {
              transactionType: "IN",
              quantity: item.quantity,
              previousStock: product.stockQuantity,
              newStock,
              reason: `Void sale #${sale.saleNumber}`,
              storeId: store.id,
              productId: item.productId,
              createdBy: session.user.id,
            },
          })
        }
      }

      return updated
    })

    return NextResponse.json(voided)
  } catch (error) {
    logger.error("PATCH /api/sales/[id] error", error instanceof Error ? error : undefined)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
