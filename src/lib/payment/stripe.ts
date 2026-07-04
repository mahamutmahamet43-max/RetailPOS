import type { PaymentProvider, InitiatePaymentParams, PaymentResult, VerifyPaymentResult } from "./types"
import type { ProviderName } from "./types"
import { getProviderConfig } from "./config"
import { createHmac, timingSafeEqual } from "crypto"

function generateRef(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export class StripeProvider implements PaymentProvider {
  readonly name: ProviderName = "STRIPE"

  async initiatePayment(params: InitiatePaymentParams): Promise<PaymentResult> {
    const config = getProviderConfig("STRIPE")
    const ref = generateRef("STRIPE")

    // Build Stripe Checkout Session via fetch
    try {
      const body = new URLSearchParams({
        "mode": "subscription",
        "line_items[0][price_data][currency]": params.currency.toLowerCase(),
        "line_items[0][price_data][product_data][name]": params.description,
        "line_items[0][price_data][unit_amount]": String(Math.round(params.amount * 100)),
        "line_items[0][price_data][recurring][interval]": "month",
        "line_items[0][quantity]": "1",
        "success_url": `${params.callbackUrl}?session_id={CHECKOUT_SESSION_ID}`,
        "cancel_url": `${params.callbackUrl}?canceled=true`,
        "client_reference_id": ref,
        "metadata[reference]": ref,
      })

      if (params.customerEmail) {
        body.append("customer_email", params.customerEmail)
      }

      const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
          "Idempotency-Key": params.idempotencyKey,
        },
        body: body.toString(),
        signal: AbortSignal.timeout(15000),
      })

      if (!response.ok) {
        const errBody = await response.text()
        return { success: false, transactionRef: ref, status: "FAILED", error: `Stripe API error: ${response.status} ${errBody}` }
      }

      const data = await response.json()
      return {
        success: true,
        transactionRef: ref,
        status: "PENDING",
        providerRef: data.id,
        checkoutUrl: data.url,
      }
    } catch (error) {
      return {
        success: false,
        transactionRef: ref,
        status: "FAILED",
        error: error instanceof Error ? error.message : "Stripe payment initiation failed",
      }
    }
  }

  async verifyPayment(transactionRef: string): Promise<VerifyPaymentResult> {
    const config = getProviderConfig("STRIPE")

    try {
      const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${transactionRef}`, {
        headers: { Authorization: `Bearer ${config.apiKey}` },
        signal: AbortSignal.timeout(10000),
      })

      if (!response.ok) {
        return { success: false, status: "FAILED", error: "Failed to verify payment" }
      }

      const data = await response.json()
      const status = data.payment_status === "paid" ? "COMPLETED" : "PENDING"
      return { success: true, status, providerRef: data.id }
    } catch (error) {
      return { success: false, status: "FAILED", error: error instanceof Error ? error.message : "Verification failed" }
    }
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    const config = getProviderConfig("STRIPE")
    if (!config.webhookSecret) return false
    try {
      const expected = createHmac("sha256", config.webhookSecret).update(payload).digest("hex")
      if (signature.startsWith("v1=")) {
        const sig = signature.slice(3)
        try {
          return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(sig, "hex"))
        } catch {
          return expected === sig
        }
      }
      return expected === signature
    } catch {
      return false
    }
  }
}
