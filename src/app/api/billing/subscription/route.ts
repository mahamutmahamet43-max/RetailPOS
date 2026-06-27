import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getCurrentStore, noStoreResponse } from "@/lib/store"
import { logger } from "@/lib/logger"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const store = await getCurrentStore()
    if (!store) return noStoreResponse()
    const subscription = await prisma.subscription.findUnique({
      where: { storeId: store.id },
      include: {
        payments: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    })

    if (!subscription) {
      return NextResponse.json({ subscription: null })
    }

    const now = new Date()
    let trialDaysRemaining = 0
    if (subscription.trialEndsAt) {
      trialDaysRemaining = Math.max(
        0,
        Math.ceil(
          (subscription.trialEndsAt.getTime() - now.getTime()) / 86400000
        )
      )
    }

    return NextResponse.json({
      subscription: {
        ...subscription,
        trialDaysRemaining,
        isExpired:
          subscription.status === "EXPIRED" ||
          subscription.status === "SUSPENDED" ||
          (subscription.endsAt && subscription.endsAt < now),
      },
      store: {
        id: store.id,
        name: store.name,
        slug: store.slug,
      },
    })
  } catch (error) {
    logger.error("GET /api/billing/subscription error", error instanceof Error ? error : undefined)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
