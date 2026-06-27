import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentStore, noStoreResponse } from "@/lib/store"
import { requireRole } from "@/lib/role"
import { logger } from "@/lib/logger"

export async function GET() {
  try {
    const authResult = await requireRole("OWNER", "MANAGER")
    if (authResult instanceof NextResponse) return authResult

    const store = await getCurrentStore()
    if (!store) return noStoreResponse()
    const subscription = await prisma.subscription.findUnique({
      where: { storeId: store.id },
    })

    if (!subscription) {
      return NextResponse.json({ payments: [] })
    }

    const payments = await prisma.payment.findMany({
      where: { subscriptionId: subscription.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    })

    return NextResponse.json({ payments })
  } catch (error) {
    logger.error("GET /api/billing/payments error", error instanceof Error ? error : undefined)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
