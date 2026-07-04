import { NextResponse } from "next/server"
import type { BillingProvider } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { getCurrentStore, noStoreResponse } from "@/lib/store"
import { requireRole } from "@/lib/role"
import { getRawPaymentProvider, PLAN_PRICING } from "@/lib/payment-providers"
import { validateOrError, billingRenewSchema } from "@/lib/api-validation"

export async function POST(request: Request) {
  try {
    const authResult = await requireRole("OWNER")
    if (authResult instanceof NextResponse) return authResult

    const store = await getCurrentStore()
    if (!store) return noStoreResponse()
    const body = await request.json()
    const validation = validateOrError(billingRenewSchema, body)
    if (!validation.success) return validation.response

    const { provider, customerPhone, customerEmail } = validation.data

    const subscription = await prisma.subscription.findUnique({
      where: { storeId: store.id },
    })

    if (!subscription) {
      return NextResponse.json({ error: "No subscription found" }, { status: 404 })
    }

    const pricing = PLAN_PRICING[subscription.plan]
    if (!pricing || pricing.monthly === 0) {
      return NextResponse.json({ error: "Free plan cannot be renewed" }, { status: 400 })
    }

    const payProvider = getRawPaymentProvider(provider)
    const amount = pricing.monthly
    const idempotencyKey = `${store.id}-renew-${Date.now()}`
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/billing/webhook`

    const paymentResult = await payProvider.initiatePayment({
      amount,
      currency: "USD",
      description: `RetailPOS ${pricing.label} renewal`,
      customerPhone,
      customerEmail,
      idempotencyKey,
      callbackUrl,
    })

    if (!paymentResult.success) {
      return NextResponse.json(
        { error: paymentResult.error || "Payment initiation failed" },
        { status: 400 }
      )
    }

    const now = new Date()
    const monthEnd = new Date(now.getTime() + 30 * 86400000)
    const isComplete = paymentResult.status === "COMPLETED"

    const updated = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: isComplete ? "ACTIVE" : subscription.status,
        endsAt: isComplete ? monthEnd : subscription.endsAt,
        renewalDate: isComplete ? monthEnd : subscription.renewalDate,
      },
    })

    const timeoutAt = new Date(Date.now() + 30 * 60 * 1000)

    const payment = await prisma.payment.create({
      data: {
        amount,
        currency: "USD",
        provider: provider as BillingProvider,
        providerRef: paymentResult.providerRef || paymentResult.transactionRef,
        status: isComplete ? "COMPLETED" : "PENDING",
        customerPhone,
        customerEmail,
        idempotencyKey,
        timeoutAt: isComplete ? null : timeoutAt,
        subscriptionId: subscription.id,
      },
    })

    console.error(`Subscription changed: store=${store.id}, plan=${subscription.plan}, status=${updated.status}`)
    console.error(`Payment processed: sub=${subscription.id}, amount=${amount}, provider=${provider}, status=${payment.status}`)

    return NextResponse.json({
      subscription: updated,
      payment: {
        id: payment.id,
        status: payment.status,
        providerRef: payment.providerRef,
        checkoutUrl: paymentResult.checkoutUrl,
        transactionRef: paymentResult.transactionRef,
      },
    })
  } catch (error) {
    console.error("POST /api/billing/renew error", error instanceof Error ? error : undefined)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
