import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentStore, noStoreResponse } from "@/lib/store"
import { requireRole } from "@/lib/role"
import { logger } from "@/lib/logger"
import { sendBackupCompleteEmail } from "@/lib/email/service"

export const dynamic = "force-dynamic"

export async function GET() {
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
}

export async function POST() {
  const auth = await requireRole("OWNER")
  if (auth instanceof NextResponse) return auth

  const store = await getCurrentStore()
  if (!store) return noStoreResponse()

  try {
    const tables = [
      "User", "Store", "Subscription", "Payment",
      "Category", "Product", "Customer", "InventoryTransaction",
      "Sale", "SaleItem", "Account", "Session", "VerificationToken",
    ] as const

    const backupData: Record<string, unknown> = {}

    for (const table of tables) {
      const model = (prisma as unknown as Record<string, unknown>)[table as string] as
        | { findMany: () => Promise<unknown[]> }
        | undefined
      if (model?.findMany) {
        backupData[table] = await model.findMany()
      }
    }

    const dataJson = JSON.stringify(backupData)
    const dateStr = new Date().toISOString().replace(/[:.]/g, "-")
    const filename = `retailpos-backup-${dateStr}.json`
    const size = `${(dataJson.length / 1024).toFixed(2)} KB`

    const backup = await prisma.backup.create({
      data: {
        storeId: store.id,
        filename,
        data: dataJson,
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
