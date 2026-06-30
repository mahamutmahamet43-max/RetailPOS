import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentStore, noStoreResponse } from "@/lib/store"
import { requireRole } from "@/lib/role"
import { logger } from "@/lib/logger"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const auth = await requireRole("OWNER")
    if (auth instanceof NextResponse) return auth

    const store = await getCurrentStore()
    if (!store) return noStoreResponse()

    const backups = await prisma.backup.findMany({
      where: { storeId: store.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, filename: true, size: true, createdAt: true, status: true },
    })

    return NextResponse.json({
      backups,
      totalBackups: backups.length,
    })
  } catch (error) {
    logger.error("GET /api/admin/backups error", error instanceof Error ? error : undefined)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST() {
  try {
    const auth = await requireRole("OWNER")
    if (auth instanceof NextResponse) return auth

    const store = await getCurrentStore()
    if (!store) return noStoreResponse()

    const storeId = store.id

    const backupData: Record<string, unknown> = {
      store: await prisma.store.findUnique({ where: { id: storeId } }),
      user: await prisma.user.findUnique({ where: { id: auth.userId }, select: { id: true, name: true, email: true, role: true, createdAt: true } }),
      categories: await prisma.category.findMany({ where: { storeId } }),
      products: await prisma.product.findMany({ where: { storeId }, include: { units: true } }),
      customers: await prisma.customer.findMany({ where: { storeId } }),
      suppliers: await prisma.supplier.findMany({ where: { storeId } }),
      purchases: await prisma.purchase.findMany({ where: { storeId } }),
      purchaseItems: await prisma.purchaseItem.findMany({ where: { purchase: { storeId } } }),
      inventory: await prisma.inventoryTransaction.findMany({ where: { storeId } }),
      sales: await prisma.sale.findMany({ where: { storeId }, include: { items: true } }),
      storeSettings: await prisma.storeSetting.findMany({ where: { storeId } }),
    }

    const dataJson = JSON.stringify(backupData)
    const dateStr = new Date().toISOString().replace(/[:.]/g, "-")
    const filename = `retailpos-backup-${dateStr}.json`
    const size = `${(dataJson.length / 1024).toFixed(2)} KB`

    const backup = await prisma.backup.create({
      data: {
        storeId,
        filename,
        data: dataJson,
        size,
        status: "completed",
      },
    })

    logger.info("Manual backup created", { filename, size })

    return NextResponse.json({
      success: true,
      message: "Backup created successfully",
      backup: { id: backup.id, filename, size, createdAt: backup.createdAt.toISOString(), status: backup.status },
    })
  } catch (error) {
    logger.error("Backup failed", error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { success: false, error: "Backup failed" },
      { status: 500 }
    )
  }
}
