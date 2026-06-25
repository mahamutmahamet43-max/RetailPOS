import type { PaymentProvider, InitiatePaymentParams, PaymentResult, VerifyPaymentResult } from "./types"
import type { ProviderName } from "./types"
import { getProviderConfig, hasCredentials } from "./config"
import { createHmac } from "crypto"

function generateRef(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export class EvcPlusProvider implements PaymentProvider {
  readonly name: ProviderName = "EVC_PLUS"

  async initiatePayment(params: InitiatePaymentParams): Promise<PaymentResult> {
    if (!hasCredentials("EVC_PLUS")) {
      const ref = generateRef("EVC")
      return { success: true, transactionRef: ref, status: "COMPLETED" }
    }

    const config = getProviderConfig("EVC_PLUS")
    const ref = generateRef("EVC")

    try {
      const response = await fetch(`${config.baseUrl}/v1/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
          "X-Idempotency-Key": params.idempotencyKey,
        },
        body: JSON.stringify({
          amount: params.amount,
          currency: params.currency,
          reference: ref,
          description: params.description,
          msisdn: params.customerPhone,
          callback_url: params.callbackUrl,
        }),
        signal: AbortSignal.timeout(15000),
      })

      if (!response.ok) {
        const body = await response.text()
        return { success: false, transactionRef: ref, status: "FAILED", error: `EVC Plus API error: ${response.status} ${body}` }
      }

      const data = await response.json()
      return {
        success: true,
        transactionRef: ref,
        status: "PENDING",
        providerRef: data.transaction_id || data.reference,
      }
    } catch (error) {
      return {
        success: false,
        transactionRef: ref,
        status: "FAILED",
        error: error instanceof Error ? error.message : "EVC Plus payment initiation failed",
      }
    }
  }

  async verifyPayment(transactionRef: string): Promise<VerifyPaymentResult> {
    if (!hasCredentials("EVC_PLUS")) {
      return { success: true, status: "COMPLETED" }
    }

    const config = getProviderConfig("EVC_PLUS")

    try {
      const response = await fetch(`${config.baseUrl}/v1/transactions/${transactionRef}`, {
        headers: { Authorization: `Bearer ${config.apiKey}` },
        signal: AbortSignal.timeout(10000),
      })

      if (!response.ok) {
        return { success: false, status: "FAILED", error: "Failed to verify payment" }
      }

      const data = await response.json()
      return { success: true, status: data.status === "completed" ? "COMPLETED" : "PENDING", providerRef: data.reference }
    } catch (error) {
      return { success: false, status: "FAILED", error: error instanceof Error ? error.message : "Verification failed" }
    }
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    const config = getProviderConfig("EVC_PLUS")
    if (!config.webhookSecret) return false
    const expected = createHmac("sha256", config.webhookSecret).update(payload).digest("hex")
    return expected === signature
  }
}
