import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/role"
import { logger } from "@/lib/logger"
import { sendBackupCompleteEmail } from "@/lib/email/service"

export const dynamic = "force-dynamic"

const BACKUPS: Array<{
  id: string
  filename: string
  size: string
  createdAt: string
  status: string
}> = []

export async function GET() {
  const auth = await requireRole("OWNER")
  if (auth instanceof NextResponse) return auth

  return NextResponse.json({
    backups: BACKUPS,
    totalBackups: BACKUPS.length,
  })
}

export async function POST() {
  const auth = await requireRole("OWNER")
  if (auth instanceof NextResponse) return auth

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

    const dateStr = new Date().toISOString().replace(/[:.]/g, "-")
    const filename = `retailpos-backup-${dateStr}.json`

    const backup = {
      id: `backup-${Date.now()}`,
      filename,
      size: `${(JSON.stringify(backupData).length / 1024).toFixed(2)} KB`,
      createdAt: new Date().toISOString(),
      status: "completed",
    }

    BACKUPS.push(backup)

    logger.info("Manual backup created", { filename, size: backup.size })

    const owner = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { email: true, name: true },
    })
    if (owner?.email) {
      sendBackupCompleteEmail(owner.email, owner.name || "Owner", filename, backup.size).catch(() => {})
    }

    return NextResponse.json({
      success: true,
      message: "Backup created successfully",
      backup,
      data: backupData,
    })
  } catch (error) {
    logger.error("Backup failed", error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { success: false, error: "Backup failed" },
      { status: 500 }
    )
  }
}
