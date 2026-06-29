import { prisma } from "@/lib/prisma"
import { getActiveEmailProvider } from "./registry"
import { logger } from "@/lib/logger"
import type { SendEmailParams } from "./types"

const MAX_RETRIES = 1
const BASE_DELAY = 500

export function getBackoffDelay(retryCount: number): number {
  return BASE_DELAY * Math.pow(2, retryCount)
}

export async function sendWithRetry(
  params: SendEmailParams,
  maxRetries = MAX_RETRIES
): Promise<{ success: boolean; error?: string }> {
  const provider = getActiveEmailProvider()
  const providerName = provider.name

  let dbLogId: string | null = null

  try {
    const log = await prisma.emailLog.create({
      data: {
        to: params.to,
        template: params.template,
        provider: providerName,
        status: "PENDING",
        subject: params.subject,
        maxRetries,
      },
    })
    dbLogId = log.id
  } catch (dbError) {
    logger.error("Failed to create email log entry", dbError instanceof Error ? dbError : undefined)
  }

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const result = await provider.send(params)

    if (result.success) {
      if (dbLogId) {
        try {
          await prisma.emailLog.update({
            where: { id: dbLogId },
            data: { status: "SENT", sentAt: new Date(), retryCount: attempt },
          })
        } catch { /* log best-effort */ }
      }

      logger.info("Email sent", {
        template: params.template,
        to: params.to,
        provider: providerName,
        attempts: attempt + 1,
      })

      return { success: true }
    }

    logger.warn(`Email send attempt ${attempt + 1}/${maxRetries + 1} failed`, {
      template: params.template,
      to: params.to,
      provider: providerName,
      error: result.error,
    })

    if (attempt < maxRetries) {
      const delay = getBackoffDelay(attempt)
      await new Promise((resolve) => setTimeout(resolve, delay))
    } else {
      if (dbLogId) {
        try {
          await prisma.emailLog.update({
            where: { id: dbLogId },
            data: {
              status: "FAILED",
              errorMessage: result.error,
              retryCount: attempt,
            },
          })
        } catch { /* log best-effort */ }
      }

      logger.error("Email send failed after all retries", undefined, {
        template: params.template,
        to: params.to,
        provider: providerName,
        error: result.error,
      })

      return { success: false, error: result.error }
    }
  }

  return { success: false, error: "Unexpected retry exit" }
}
