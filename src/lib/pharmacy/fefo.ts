import type { PrismaClient } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { isPharmacyEnabled } from "./store"

type TransactionClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>

export async function getFefoBatches(storeId: string, productId: string) {
  if (!(await isPharmacyEnabled(storeId))) return []

  return prisma.medicineBatch.findMany({
    where: {
      productId,
      quantity: { gt: 0 },
      expiryDate: { gt: new Date() },
    },
    orderBy: { expiryDate: "asc" },
  })
}

export async function deductFromBatches(
  storeId: string,
  productId: string,
  totalQuantity: number,
  tx?: TransactionClient
) {
  const enabled = await isPharmacyEnabled(storeId)
  if (!enabled) return []

  const client = tx ?? prisma
  const batches = await client.medicineBatch.findMany({
    where: {
      productId,
      quantity: { gt: 0 },
      expiryDate: { gt: new Date() },
    },
    orderBy: { expiryDate: "asc" },
  })

  let remaining = totalQuantity
  const deducted: { batchId: string; quantity: number }[] = []

  for (const batch of batches) {
    if (remaining <= 0) break
    const take = Math.min(remaining, batch.quantity)
    await client.medicineBatch.update({
      where: { id: batch.id },
      data: { quantity: batch.quantity - take },
    })
    deducted.push({ batchId: batch.id, quantity: take })
    remaining -= take
  }

  if (remaining > 0) {
    throw new Error(`Insufficient stock for product ${productId}. Short by ${remaining} units.`)
  }

  return deducted
}
