import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/role"
import { logger } from "@/lib/logger"
import { getCurrentStore, noStoreResponse } from "@/lib/store"

const ALLOWED_TABLES = [
  "Store", "Subscription", "Payment", "Category", "Product",
  "Customer", "InventoryTransaction", "Sale", "SaleItem",
] as const

export async function POST(request: Request) {
  const auth = await requireRole("OWNER")
  if (auth instanceof NextResponse) return auth

  const store = await getCurrentStore()
  if (!store) return noStoreResponse()

  try {
    const body = await request.json()

    if (!body.data || typeof body.data !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid backup data format" },
        { status: 400 }
      )
    }

    const data = body.data as Record<string, unknown[]>

    for (const key of Object.keys(data)) {
      if (!(ALLOWED_TABLES as readonly string[]).includes(key)) {
        return NextResponse.json(
          { success: false, error: `Invalid table in backup: ${key}` },
          { status: 400 }
        )
      }
      if (!Array.isArray(data[key])) {
        return NextResponse.json(
          { success: false, error: `Invalid data format for: ${key}` },
          { status: 400 }
        )
      }
    }

    const withStore = (record: Record<string, unknown>) => {
      const { createdAt, updatedAt, storeId: _sid, ...rest } = record
      return { ...rest, storeId: store.id }
    }

    const stripTimestamps = (record: Record<string, unknown>) => {
      const { createdAt, updatedAt, ...rest } = record
      return rest
    }

    await prisma.$transaction(async (tx) => {
      await tx.saleItem.deleteMany({ where: { sale: { storeId: store.id } } })
      await tx.payment.deleteMany({ where: { subscription: { storeId: store.id } } })
      await tx.inventoryTransaction.deleteMany({ where: { storeId: store.id } })
      await tx.sale.deleteMany({ where: { storeId: store.id } })
      await tx.customer.deleteMany({ where: { storeId: store.id } })
      await tx.product.deleteMany({ where: { storeId: store.id } })
      await tx.subscription.deleteMany({ where: { storeId: store.id } })
      await tx.category.deleteMany({ where: { storeId: store.id } })

      if (data.Store) {
        for (const record of data.Store) {
          const { createdAt, updatedAt, ...rest } = record as Record<string, unknown>
          await tx.store.update({
            where: { id: store.id },
            data: rest as never,
          })
        }
      }

      if (data.Category) {
        for (const record of data.Category) {
          await tx.category.create({ data: withStore(record as Record<string, unknown>) as never })
        }
      }

      if (data.Customer) {
        for (const record of data.Customer) {
          await tx.customer.create({ data: withStore(record as Record<string, unknown>) as never })
        }
      }

      if (data.Subscription) {
        for (const record of data.Subscription) {
          await tx.subscription.create({ data: withStore(record as Record<string, unknown>) as never })
        }
      }

      if (data.Product) {
        for (const record of data.Product) {
          await tx.product.create({ data: withStore(record as Record<string, unknown>) as never })
        }
      }

      if (data.Sale) {
        for (const record of data.Sale) {
          await tx.sale.create({ data: withStore(record as Record<string, unknown>) as never })
        }
      }

      if (data.SaleItem) {
        for (const record of data.SaleItem) {
          await tx.saleItem.create({ data: stripTimestamps(record as Record<string, unknown>) as never })
        }
      }

      if (data.InventoryTransaction) {
        for (const record of data.InventoryTransaction) {
          await tx.inventoryTransaction.create({ data: withStore(record as Record<string, unknown>) as never })
        }
      }

      if (data.Payment) {
        for (const record of data.Payment) {
          await tx.payment.create({ data: stripTimestamps(record as Record<string, unknown>) as never })
        }
      }
    })

    logger.info("Database restored from backup", { storeId: store.id })

    return NextResponse.json({
      success: true,
      message: "Database restored successfully",
    })
  } catch (error) {
    logger.error("Restore failed", error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { success: false, error: "Restore failed" },
      { status: 500 }
    )
  }
}
