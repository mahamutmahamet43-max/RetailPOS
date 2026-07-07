import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getPaymentProviderByName } from "@/lib/payment/registry"
import crypto from "crypto"

function isValidProvider(provider: string): boolean {
  return ["SAHAL", "STRIPE"].includes(provider.toUpperCase())
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider: rawProvider } = await params
    const provider = rawProvider.toUpperCase()

    if (!isValidProvider(provider)) {
      return NextResponse.json({ error: "Unknown payment provider" }, { status: 400 })
    }

    const body = await request.text()
    const signature = request.headers.get("x-signature") || request.headers.get("stripe-signature") || ""

    const payProvider = getPaymentProviderByName(provider)
    const isValid = payProvider.verifyWebhookSignature(body, signature)

    if (!isValid) {
      console.warn(`Webhook signature verification failed for ${provider}`, { signature: signature.slice(0, 20) })
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    let payload: Record<string, unknown>
    try {
      payload = JSON.parse(body)
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
    }

    const transactionRef = (payload.reference || payload.transaction_ref || payload.client_reference_id) as string | undefined
    const providerStatus = (payload.status || payload.payment_status) as string | undefined
    const providerRef = (payload.transaction_id || payload.id || payload.session_id) as string | undefined
    const errorMessage = payload.error || payload.failure_message || payload.failure_reason as string | undefined

    if (!transactionRef) {
      console.warn("Webhook received without transaction reference", { provider, payload })
      return NextResponse.json({ error: "Missing transaction reference" }, { status: 400 })
    }

    const payment = await prisma.payment.findFirst({
      where: { providerRef: transactionRef },
    })

    if (!payment) {
      console.warn("Webhook for unknown payment", { provider, transactionRef })
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    if (payment.status === "COMPLETED" || payment.status === "REFUNDED") {
      console.log("Duplicate webhook, payment already final", { paymentId: payment.id, status: payment.status })
      return NextResponse.json({ received: true, duplicate: true })
    }

    const paymentStatus = mapProviderStatus(providerStatus || "", provider)
    const isComplete = paymentStatus === "COMPLETED"

    const [updatedPayment] = await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: paymentStatus,
          providerRef: providerRef || payment.providerRef,
          errorMessage: errorMessage as string | null | undefined,
          timeoutAt: isComplete ? null : payment.timeoutAt,
        },
      }),
      ...(isComplete
        ? [
            prisma.subscription.update({
              where: { id: payment.subscriptionId },
              data: {
                status: "ACTIVE",
                endsAt: new Date(Date.now() + 30 * 86400000),
                renewalDate: new Date(Date.now() + 30 * 86400000),
              },
            }),
          ]
        : []),
    ])

    console.error(`Payment processed: sub=${payment.subscriptionId}, amount=${payment.amount}, provider=${provider}, status=${paymentStatus}`)

    return NextResponse.json({ received: true, status: paymentStatus })
  } catch (error) {
    console.error("Webhook processing error", error instanceof Error ? error : undefined)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function mapProviderStatus(providerStatus: string, provider: string): "PENDING" | "COMPLETED" | "FAILED" {
  const lower = providerStatus.toLowerCase()

  if (["completed", "succeeded", "paid", "successful"].includes(lower)) {
    return "COMPLETED"
  }

  if (["failed", "cancelled", "canceled", "expired", "rejected"].includes(lower)) {
    return "FAILED"
  }

  if (["pending", "processing", "initiated"].includes(lower)) {
    return "PENDING"
  }

  return "PENDING"
}
