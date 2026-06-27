import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { Store } from "@prisma/client"
import { NextResponse } from "next/server"

export async function getCurrentStore(): Promise<Store | null> {
  const session = await auth()
  if (!session?.user?.id) return null

  return prisma.store.findFirst({
    where: { ownerId: session.user.id },
  })
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}

export function noStoreResponse() {
  return NextResponse.json({ error: "No store found" }, { status: 404 })
}
