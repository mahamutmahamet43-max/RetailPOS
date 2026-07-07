import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getRawPaymentProvider } from "@/lib/payment-providers"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sid = searchParams.get("sid")
    const orderId = searchParams.get("order_id")

    if (!sid || !orderId) {
      return NextResponse.redirect(
        new URL("/dashboard/billing?error=missing_params", request.url)
      )
    }

    const payProvider = getRawPaymentProvider("SAHAL")
    const verifyResult = await payProvider.verifyPayment(sid)

    if (!verifyResult.success || verifyResult.status !== "COMPLETED") {
      return NextResponse.redirect(
        new URL(`/dashboard/billing?error=payment_${verifyResult.status.toLowerCase()}`, request.url)
      )
    }

    const payment = await prisma.payment.findFirst({
      where: { idempotencyKey: orderId },
      include: { subscription: true },
    })

    if (!payment) {
      return NextResponse.redirect(
        new URL("/dashboard/billing?error=payment_not_found", request.url)
      )
    }

    if (payment.status === "COMPLETED") {
      return NextResponse.redirect(
        new URL("/dashboard/billing?success=already_active", request.url)
      )
    }

    const now = new Date()
    const monthEnd = new Date(now.getTime() + 30 * 86400000)

    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "COMPLETED",
          providerRef: verifyResult.providerRef || sid,
          timeoutAt: null,
        },
      }),
      prisma.subscription.update({
        where: { id: payment.subscriptionId },
        data: {
          status: "ACTIVE",
          endsAt: monthEnd,
          renewalDate: monthEnd,
          billingCycle: "MONTHLY",
          trialEndsAt: null,
        },
      }),
    ])

    return NextResponse.redirect(
      new URL("/dashboard/billing?success=payment_completed", request.url)
    )
  } catch (error) {
    console.error("Sifalo Pay verify error", error instanceof Error ? error : undefined)
    return NextResponse.redirect(
      new URL("/dashboard/billing?error=verification_failed", request.url)
    )
  }
}
