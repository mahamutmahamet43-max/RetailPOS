import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/role"
import { logger } from "@/lib/logger"

export async function POST(request: Request) {
  const auth = await requireRole("OWNER")
  if (auth instanceof NextResponse) return auth

  try {
    const body = await request.json()

    if (!body.data || typeof body.data !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid backup data format" },
        { status: 400 }
      )
    }

    const tables = [
      "SaleItem", "Sale", "InventoryTransaction",
      "Payment", "Subscription", "Customer", "Product",
      "Category", "Store", "User",
    ] as const

    for (const table of tables) {
      const model = (prisma as unknown as Record<string, unknown>)[table as string] as
        | { deleteMany: (args: object) => Promise<unknown> }
        | undefined
      if (model?.deleteMany && body.data[table]) {
        await model.deleteMany({})
      }
    }

    for (const table of tables) {
      const model = (prisma as unknown as Record<string, unknown>)[table as string] as
        | { create: (args: { data: Record<string, unknown> }) => Promise<unknown> }
        | undefined
      if (model?.create && Array.isArray(body.data[table])) {
        for (const record of body.data[table]) {
          const { id, createdAt, updatedAt, ...rest } = record as Record<string, unknown>
          await model.create({ data: { id, createdAt, updatedAt, ...rest } })
        }
      }
    }

    logger.info("Database restored from backup")

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
