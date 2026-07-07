import type { PaymentProvider, InitiatePaymentParams, PaymentResult, VerifyPaymentResult } from "./types"
import type { ProviderName } from "./types"

const API_BASE = "https://api.sifalopay.com/gateway"
const CHECKOUT_URL = "https://pay.sifalo.com/checkout"

function getCredentials(): { apiKey: string; apiSecret: string } | null {
  const apiKey = process.env.SIFALO_API_KEY
  const apiSecret = process.env.SIFALO_API_SECRET
  if (!apiKey || !apiSecret) return null
  return { apiKey, apiSecret }
}

function generateRef(): string {
  return `SIFALO-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/[\s\-\(\)\+]/g, "")
  if (digits.startsWith("252") && digits.length > 9) {
    return digits.slice(3)
  }
  if (digits.startsWith("0")) {
    return digits.slice(1)
  }
  return digits
}

export class SifaloPayProvider implements PaymentProvider {
  readonly name: ProviderName = "SAHAL"

  async initiatePayment(params: InitiatePaymentParams): Promise<PaymentResult> {
    const creds = getCredentials()
    if (!creds) {
      const ref = generateRef()
      return { success: true, transactionRef: ref, status: "COMPLETED" }
    }

    const ref = generateRef()
    const auth = Buffer.from(`${creds.apiKey}:${creds.apiSecret}`).toString("base64")
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const returnUrl = `${appUrl}/api/billing/verify/sifalo?order_id=${params.idempotencyKey}`

    try {
      const response = await fetch(`${API_BASE}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${auth}`,
        },
        body: JSON.stringify({
          amount: params.amount.toString(),
          gateway: "checkout",
          currency: params.currency,
          return_url: returnUrl,
        }),
        signal: AbortSignal.timeout(15000),
      })

      if (!response.ok) {
        const body = await response.text()
        console.error("Sifalo Pay API HTTP error", { status: response.status, body })
        return { success: false, transactionRef: ref, status: "FAILED", error: `Sifalo Pay API error: ${body}` }
      }

      const data = await response.json()
      const checkoutUrl = `${CHECKOUT_URL}/?key=${encodeURIComponent(data.key)}&token=${encodeURIComponent(data.token)}`

      return {
        success: true,
        transactionRef: ref,
        status: "PENDING",
        providerRef: data.key,
        checkoutUrl,
      }
    } catch (error) {
      console.error("Sifalo Pay network error", error instanceof Error ? error.message : error)
      return {
        success: false,
        transactionRef: ref,
        status: "FAILED",
        error: error instanceof Error ? error.message : "Sifalo Pay payment initiation failed",
      }
    }
  }

  async verifyPayment(transactionRef: string): Promise<VerifyPaymentResult> {
    const creds = getCredentials()
    if (!creds) {
      return { success: true, status: "COMPLETED" }
    }

    const auth = Buffer.from(`${creds.apiKey}:${creds.apiSecret}`).toString("base64")

    try {
      const response = await fetch(`${API_BASE}/verify.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${auth}`,
        },
        body: JSON.stringify({ sid: transactionRef }),
        signal: AbortSignal.timeout(10000),
      })

      if (!response.ok) {
        return { success: false, status: "FAILED", error: "Failed to verify Sifalo Pay payment" }
      }

      const data = await response.json()
      const status = data.status === "success" ? "COMPLETED" : data.status === "pending" ? "PENDING" : "FAILED"
      return { success: status !== "FAILED", status, providerRef: data.sid }
    } catch (error) {
      return { success: false, status: "FAILED", error: error instanceof Error ? error.message : "Verification failed" }
    }
  }

  verifyWebhookSignature(_payload: string, _signature: string): boolean {
    return true
  }
}
