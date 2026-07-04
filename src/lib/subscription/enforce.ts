import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { getPlanConfig, type PlanLimits } from "./plans"
import { logger } from "@/lib/logger"

export interface SubscriptionInfo {
  plan: string
  status: string
  endsAt: Date | null
  trialEndsAt: Date | null
}

export async function getStoreSubscription(storeId: string): Promise<SubscriptionInfo | null> {
  const sub = await prisma.subscription.findUnique({
    where: { storeId },
    select: { plan: true, status: true, endsAt: true, trialEndsAt: true },
  })
  if (!sub) return null
  return sub
}

export function isSubscriptionActive(sub: SubscriptionInfo): boolean {
  if (sub.status === "ACTIVE" || sub.status === "TRIAL") {
    const now = new Date()
    if (sub.status === "TRIAL" && sub.trialEndsAt && sub.trialEndsAt < now) return false
    if (sub.endsAt && sub.endsAt < now) return false
    return true
  }
  return false
}

function getLimitValue(limits: PlanLimits, resource: keyof PlanLimits): number {
  const val = limits[resource]
  if (typeof val === "number") return val
  return 0
}

function formatLimit(val: number): string {
  if (val === -1) return "Unlimited"
  return String(val)
}

function getResourceLabel(resource: string): string {
  const labels: Record<string, string> = {
    products: "products",
    customers: "customers",
    users: "users",
    stores: "stores",
    monthlySales: "monthly sales",
    storage: "storage",
    backupRetentionDays: "backup retention",
  }
  return labels[resource] || resource
}

export interface LimitCheckResult {
  allowed: boolean
  error?: string
  limit?: number
  current?: number
  remaining?: number
}

export async function checkLimit(
  storeId: string,
  resource: keyof PlanLimits,
  currentCount: number
): Promise<LimitCheckResult> {
  const sub = await getStoreSubscription(storeId)
  if (!sub) {
    return { allowed: false, error: "No active subscription. Please subscribe to a plan." }
  }

  if (!isSubscriptionActive(sub)) {
    const reason = sub.status === "TRIAL"
      ? "Your trial has expired."
      : `Your subscription is ${sub.status.toLowerCase()}.`
    return { allowed: false, error: `${reason} Please renew your subscription to continue.` }
  }

  const config = getPlanConfig(sub.plan)
  const limit = getLimitValue(config.limits, resource)

  if (limit === -1) {
    return { allowed: true, limit: -1, current: currentCount }
  }

  if (currentCount >= limit) {
    const label = getResourceLabel(resource)
    return {
      allowed: false,
      error: `Your ${config.name} plan allows up to ${formatLimit(limit)} ${label}. You have reached this limit. Please upgrade to add more.`,
      limit,
      current: currentCount,
    }
  }

  return { allowed: true, limit, current: currentCount, remaining: limit - currentCount }
}

export async function enforceLimit(
  storeId: string,
  resource: keyof PlanLimits,
  currentCount: number
): Promise<NextResponse | null> {
  const result = await checkLimit(storeId, resource, currentCount)
  if (!result.allowed) {
    logger.warn(`Plan limit exceeded`, { storeId, resource, current: currentCount, limit: result.limit })
    return NextResponse.json(
      { error: result.error, limit: result.limit, current: result.current },
      { status: 403 }
    )
  }
  return null
}

export async function getResourceCounts(storeId: string) {
  const [productCount, customerCount, userCount, monthlySales] = await Promise.all([
    prisma.product.count({ where: { storeId, isActive: true } }),
    prisma.customer.count({ where: { storeId, isActive: true } }),
    prisma.user.count({
      where: { stores: { some: { id: storeId } } },
    }),
    prisma.sale.aggregate({
      where: {
        storeId,
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
      _sum: { total: true },
    }),
  ])

  const sub = await getStoreSubscription(storeId)
  const config = sub ? getPlanConfig(sub.plan) : null

  return {
    products: { current: productCount, limit: config ? getLimitValue(config.limits, "products") : 0 },
    customers: { current: customerCount, limit: config ? getLimitValue(config.limits, "customers") : 0 },
    users: { current: userCount, limit: config ? getLimitValue(config.limits, "users") : 0 },
    monthlySales: {
      current: monthlySales._sum.total || 0,
      limit: config ? getLimitValue(config.limits, "monthlySales") : 0,
    },
  }
}
