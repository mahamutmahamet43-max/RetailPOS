"use server"

import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

export async function isPharmacyEnabled(storeId: string): Promise<boolean> {
  try {
    const setting = await prisma.storeSetting.findUnique({
      where: { storeId },
      select: { enablePharmacyModule: true },
    })
    return setting?.enablePharmacyModule ?? false
  } catch (error) {
    logger.warn("isPharmacyEnabled check failed, defaulting to disabled", { error: String(error) })
    return false
  }
}
