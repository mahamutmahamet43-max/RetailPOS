import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export function noStoreResponse() {
  return NextResponse.json(
    { error: "No store found" },
    { status: 404 }
  )
}

export async function getCurrentStore() {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  // Try direct store membership first (MANAGER/CASHIER have storeId set)
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { storeId: true },
  })

  if (user?.storeId) {
    const store = await prisma.store.findUnique({
      where: { id: user.storeId },
    })
    if (store) return store
  }

  // Fallback: OWNER users own a store via Store.ownerId
  const store = await prisma.store.findFirst({
    where: { ownerId: session.user.id },
  })

  if (!store) {
    throw new Error("No store found")
  }

  return store
}
