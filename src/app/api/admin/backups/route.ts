import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/role"
import { logger } from "@/lib/logger"
import { sendBackupCompleteEmail } from "@/lib/email/service"
import { getCurrentStore, noStoreResponse } from "@/lib/store"

export const dynamic = "force-dynamic"

export async function GET() {
  const auth = await requireRole("OWNER")
  if (auth instanceof NextResponse) return auth

  const store = await getCurrentStore()
  if (!store) return noStoreResponse()

  const backups = await prisma.backup.findMany({
    where: { storeId: store.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      filename: true,
      size: true,
      status: true,
      createdAt: true,
    },
  })

  return NextResponse.json({
    backups,
    totalBackups: backups.length,
  })
}

export async function POST() {
  const auth = await requireRole("OWNER")
  if (auth instanceof NextResponse) return auth

  const store = await getCurrentStore()
  if (!store) return noStoreResponse()

  try {
    const storeRecord = await prisma.store.findUnique({ where: { id: store.id } })
    const subscriptions = await prisma.subscription.findMany({ where: { storeId: store.id } })
    const payments = await prisma.payment.findMany({ where: { subscription: { storeId: store.id } } })
    const categories = await prisma.category.findMany({ where: { storeId: store.id } })
    const products = await prisma.product.findMany({ where: { storeId: store.id } })
    const customers = await prisma.customer.findMany({ where: { storeId: store.id } })
    const inventoryTransactions = await prisma.inventoryTransaction.findMany({ where: { storeId: store.id } })
    const sales = await prisma.sale.findMany({ where: { storeId: store.id } })
    const saleItems = await prisma.saleItem.findMany({ where: { sale: { storeId: store.id } } })

    const backupData: Record<string, unknown> = {
      Store: storeRecord ? [storeRecord] : [],
      Subscription: subscriptions,
      Payment: payments,
      Category: categories,
      Product: products,
      Customer: customers,
      InventoryTransaction: inventoryTransactions,
      Sale: sales,
      SaleItem: saleItems,
    }

    const dateStr = new Date().toISOString().replace(/[:.]/g, "-")
    const filename = `retailpos-backup-${dateStr}.json`
    const dataStr = JSON.stringify(backupData)
    const size = `${(dataStr.length / 1024).toFixed(2)} KB`

    const backup = await prisma.backup.create({
      data: {
        storeId: store.id,
        filename,
        data: dataStr,
        size,
        status: "completed",
      },
    })

    logger.info("Manual backup created", { filename, size })

    const owner = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { email: true, name: true },
    })
    if (owner?.email) {
      sendBackupCompleteEmail(owner.email, owner.name || "Owner", filename, size).catch(() => {})
    }

    return NextResponse.json({
      success: true,
      message: "Backup created successfully",
      backup: {
        id: backup.id,
        filename: backup.filename,
        size: backup.size,
        status: backup.status,
        createdAt: backup.createdAt,
      },
    })
  } catch (error) {
    logger.error("Backup failed", error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { success: false, error: "Backup failed" },
      { status: 500 }
    )
  }
}
