import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function getCurrentStore() {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const store = await prisma.store.findFirst({
    where: { ownerId: session.user.id },
  })

  if (!store) {
    throw new Error("No store found")
  }

  return store
}
