"use server"

import { prisma } from "@/lib/prisma"

export async function isPharmacyEnabled(storeId: string): Promise<boolean> {
  const setting = await prisma.storeSetting.findUnique({
    where: { storeId },
    select: { enablePharmacyModule: true },
  })
  return setting?.enablePharmacyModule ?? false
}
