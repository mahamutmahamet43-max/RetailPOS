import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentStore, noStoreResponse } from "@/lib/store"
import { PLAN_PRICING, getRawPaymentProvider } from "@/lib/payment-providers"
import type { BillingProvider } from "@prisma/client"
import { requireRole } from "@/lib/role"
import { validateOrError, billingSubscribeSchema } from "@/lib/api-validation"

export async function POST(request: Request) {
  try {
    const authResult = await requireRole("OWNER")
    if (authResult instanceof NextResponse) return authResult

    const store = await getCurrentStore()
    if (!store) return noStoreResponse()
    const body = await request.json()
    const validation = validateOrError(billingSubscribeSchema, body)
    if (!validation.success) return validation.response

    const { plan, provider, customerPhone, customerEmail } = validation.data

    const pricing = PLAN_PRICING[plan]
    if (!pricing) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
    }

    const existing = await prisma.subscription.findUnique({
      where: { storeId: store.id },
    })

    if (existing && plan === "PREMIUM" && existing.status === "ACTIVE") {
      return NextResponse.json({ subscription: existing, message: "Already active" })
    }

    if (!provider) {
      return NextResponse.json({ error: "Payment provider is required for paid plans" }, { status: 400 })
    }

    const payProvider = getRawPaymentProvider(provider)
    const amount = pricing.monthly
    const idempotencyKey = `${store.id}-${plan}-${Date.now()}`
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/billing/webhook`

    const paymentResult = await payProvider.initiatePayment({
      amount,
      currency: "USD",
      description: `RetailPOS ${pricing.label} plan`,
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

    const subscription = existing
      ? await prisma.subscription.update({
          where: { id: existing.id },
          data: {
            plan: plan as any,
            status: isComplete ? "ACTIVE" : existing.status,
            startsAt: isComplete ? now : existing.startsAt,
            endsAt: isComplete ? monthEnd : existing.endsAt,
            renewalDate: isComplete ? monthEnd : existing.renewalDate,
            billingCycle: isComplete ? "MONTHLY" : existing.billingCycle,
            trialEndsAt: isComplete ? null : existing.trialEndsAt,
          },
        })
      : await prisma.subscription.create({
          data: {
            plan: plan as any,
            status: isComplete ? "ACTIVE" : "INACTIVE",
            startsAt: isComplete ? now : now,
            endsAt: isComplete ? monthEnd : null,
            renewalDate: isComplete ? monthEnd : null,
            billingCycle: isComplete ? "MONTHLY" : null,
            trialEndsAt: isComplete ? null : null,
            storeId: store.id,
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

    return NextResponse.json({
      subscription,
      payment: {
        id: payment.id,
        status: payment.status,
        providerRef: payment.providerRef,
        checkoutUrl: paymentResult.checkoutUrl,
        transactionRef: paymentResult.transactionRef,
      },
    })
  } catch (error) {
    console.error("POST /api/billing/subscribe error", error instanceof Error ? error : undefined)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
