import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentStore, noStoreResponse } from "@/lib/store"
import { requireRole } from "@/lib/role"

export async function POST() {
  try {
    const authResult = await requireRole("OWNER")
    if (authResult instanceof NextResponse) return authResult

    const store = await getCurrentStore()
    if (!store) return noStoreResponse()
    const subscription = await prisma.subscription.findUnique({
      where: { storeId: store.id },
    })

    if (!subscription) {
      return NextResponse.json({ error: "No subscription found" }, { status: 404 })
    }

    if (subscription.status === "CANCELLED") {
      return NextResponse.json({ error: "Already cancelled" }, { status: 400 })
    }

    const updated = await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: "CANCELLED" },
    })

    console.error(`Subscription cancelled: store=${store.id}, plan=${updated.plan}`)

    return NextResponse.json({ subscription: updated })
  } catch (error) {
    console.error("POST /api/billing/cancel error", error instanceof Error ? error : undefined)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
