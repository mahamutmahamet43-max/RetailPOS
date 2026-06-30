import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentStore, noStoreResponse } from "@/lib/store"
import { requireRole } from "@/lib/role"
import { logger } from "@/lib/logger"

const REQUIRED_TABLES = ["categories", "products", "customers", "suppliers", "purchases", "inventory", "sales", "storeSettings"]

function validateBackupStructure(data: unknown): { valid: boolean; error?: string } {
  if (!data || typeof data !== "object") {
    return { valid: false, error: "Backup data must be a JSON object" }
  }

  for (const table of REQUIRED_TABLES) {
    if (!(table in (data as Record<string, unknown>))) {
      return { valid: false, error: `Missing required table: ${table}` }
    }
    if (!Array.isArray((data as Record<string, unknown>)[table])) {
      return { valid: false, error: `${table} must be an array` }
    }
  }

  return { valid: true }
}

export async function POST(request: Request) {
  const auth = await requireRole("OWNER")
  if (auth instanceof NextResponse) return auth

  const store = await getCurrentStore()
  if (!store) return noStoreResponse()

  try {
    const body = await request.json()

    if (!body.data) {
      return NextResponse.json(
        { success: false, error: "Missing backup data" },
        { status: 400 }
      )
    }

    const validation = validateBackupStructure(body.data)
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: `Invalid backup: ${validation.error}` },
        { status: 400 }
      )
    }

    const storeId = store.id
    const data = body.data as Record<string, unknown>

    await prisma.$transaction(async (tx) => {
      await tx.saleItem.deleteMany({ where: { sale: { storeId } } })
      await tx.sale.deleteMany({ where: { storeId } })
      await tx.inventoryTransaction.deleteMany({ where: { storeId } })
      await tx.purchaseItem.deleteMany({ where: { purchase: { storeId } } })
      await tx.purchase.deleteMany({ where: { storeId } })
      await tx.customer.deleteMany({ where: { storeId } })
      await tx.productUnit.deleteMany({ where: { product: { storeId } } })
      await tx.product.deleteMany({ where: { storeId } })
      await tx.category.deleteMany({ where: { storeId } })
      await tx.supplier.deleteMany({ where: { storeId } })
      await tx.storeSetting.deleteMany({ where: { storeId } })

      const items = data.categories as Array<Record<string, unknown>>
      for (const record of items) {
        const { id, createdAt, updatedAt, storeId: _, ...rest } = record
        await tx.category.create({ data: { id: id as string, createdAt: createdAt as Date, updatedAt: updatedAt as Date, storeId, ...rest } as any })
      }

      const supplierItems = data.suppliers as Array<Record<string, unknown>>
      for (const record of supplierItems) {
        const { id, createdAt, updatedAt, storeId: _, ...rest } = record
        await tx.supplier.create({ data: { id: id as string, createdAt: createdAt as Date, updatedAt: updatedAt as Date, storeId, ...rest } as any })
      }

      const productItems = data.products as Array<Record<string, unknown>>
      for (const record of productItems) {
        const { id, createdAt, updatedAt, storeId: _, units, ...rest } = record
        await tx.product.create({ data: { id: id as string, createdAt: createdAt as Date, updatedAt: updatedAt as Date, storeId, ...rest } as any })
        if (Array.isArray(units)) {
          for (const unit of units) {
            const { storeId: _u, ...unitRest } = unit as Record<string, unknown>
            await tx.productUnit.create({ data: { productId: id as string, ...unitRest } as any })
          }
        }
      }

      const customerItems = data.customers as Array<Record<string, unknown>>
      for (const record of customerItems) {
        const { id, createdAt, updatedAt, storeId: _, ...rest } = record
        await tx.customer.create({ data: { id: id as string, createdAt: createdAt as Date, updatedAt: updatedAt as Date, storeId, ...rest } as any })
      }

      const purchaseItems = data.purchases as Array<Record<string, unknown>>
      for (const record of purchaseItems) {
        const { id, createdAt, updatedAt, storeId: _, ...rest } = record
        await tx.purchase.create({ data: { id: id as string, createdAt: createdAt as Date, updatedAt: updatedAt as Date, storeId, ...rest } as any })
      }

      const purchaseItemItems = data.purchaseItems as Array<Record<string, unknown>> | undefined
      if (purchaseItemItems) {
        for (const record of purchaseItemItems) {
          const { id, createdAt, updatedAt, storeId: _, ...rest } = record
          await tx.purchaseItem.create({ data: { id: id as string, createdAt: createdAt as Date, updatedAt: updatedAt as Date, ...rest } as any })
        }
      }

      const inventoryItems = data.inventory as Array<Record<string, unknown>>
      for (const record of inventoryItems) {
        const { id, createdAt, updatedAt, storeId: _, ...rest } = record
        await tx.inventoryTransaction.create({ data: { id: id as string, createdAt: createdAt as Date, updatedAt: updatedAt as Date, storeId, ...rest } as any })
      }

      const saleItems = data.sales as Array<Record<string, unknown>>
      for (const record of saleItems) {
        const { id, createdAt, updatedAt, storeId: _, items: saleItemData, ...rest } = record
        await tx.sale.create({ data: { id: id as string, createdAt: createdAt as Date, updatedAt: updatedAt as Date, storeId, ...rest } as any })
        if (Array.isArray(saleItemData)) {
          for (const si of saleItemData) {
            const { saleId, storeId: _s, ...siRest } = si as Record<string, unknown>
            await tx.saleItem.create({ data: { saleId: id as string, ...siRest } as any })
          }
        }
      }

      const settingsItems = data.storeSettings as Array<Record<string, unknown>>
      for (const record of settingsItems) {
        const { id, createdAt, updatedAt, storeId: _, ...rest } = record
        await tx.storeSetting.create({ data: { id: id as string, createdAt: createdAt as Date, updatedAt: updatedAt as Date, storeId, ...rest } as any })
      }
    })

    logger.info("Store data restored from backup", { storeId })

    return NextResponse.json({
      success: true,
      message: "Store data restored successfully",
    })
  } catch (error) {
    logger.error("Restore failed", error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { success: false, error: "Restore failed" },
      { status: 500 }
    )
  }
}
