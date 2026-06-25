import { getPaymentProviderByName } from "./payment/registry"
import type { PaymentProvider as NewProvider, ProviderName } from "./payment/types"
import { getPlanConfig, listPlans } from "./subscription/plans"

export interface PaymentResult {
  success: boolean
  transactionRef?: string
  error?: string
  status: "PENDING" | "COMPLETED" | "FAILED"
}

export interface PaymentProvider {
  name: string
  createPayment(amount: number, currency: string, description: string): Promise<PaymentResult>
  verifyPayment(transactionRef: string): Promise<PaymentResult>
}

const adapterCache = new Map<string, PaymentProvider>()

function adapt(newProvider: NewProvider): PaymentProvider {
  if (adapterCache.has(newProvider.name)) {
    return adapterCache.get(newProvider.name)!
  }

  const adapted: PaymentProvider = {
    get name() { return newProvider.name },
    createPayment: async (amount, currency, description) => {
      const result = await newProvider.initiatePayment({
        amount,
        currency,
        description,
        idempotencyKey: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
        callbackUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000/api/billing/webhook",
      })
      return {
        success: result.success,
        transactionRef: result.transactionRef,
        error: result.error,
        status: result.status as "PENDING" | "COMPLETED" | "FAILED",
      }
    },
    verifyPayment: async (transactionRef) => {
      const result = await newProvider.verifyPayment(transactionRef)
      return {
        success: result.success,
        transactionRef,
        error: result.error,
        status: result.status as "PENDING" | "COMPLETED" | "FAILED",
      }
    },
  }

  adapterCache.set(newProvider.name, adapted)
  return adapted
}

export function getPaymentProvider(provider: string): PaymentProvider {
  const newProvider = getPaymentProviderByName(provider)
  return adapt(newProvider)
}

export { getPaymentProviderByName as getRawPaymentProvider }

export const PLAN_PRICING: Record<string, { monthly: number; label: string }> = {
  FREE: { monthly: 0, label: "Free Trial" },
  STARTER: { monthly: 29, label: "Starter" },
  BASIC: { monthly: 29, label: "Basic" },
  PROFESSIONAL: { monthly: 99, label: "Professional" },
  PRO: { monthly: 99, label: "Premium" },
  ENTERPRISE: { monthly: 299, label: "Enterprise" },
}

export function getPlanLimits(planId: string) {
  const config = getPlanConfig(planId)
  return {
    products: config.limits.products,
    users: config.limits.users,
    reports: config.limits.reports,
    customers: config.limits.customers,
    monthlySales: config.limits.monthlySales,
    storage: config.limits.storage,
    backupRetentionDays: config.limits.backupRetentionDays,
  }
}

export const PLAN_LIMITS: Record<string, { products: number; users: number; reports: string }> = {
  FREE: { products: 100, users: 2, reports: "Basic" },
  STARTER: { products: 2000, users: 5, reports: "Full" },
  BASIC: { products: 2000, users: 5, reports: "Full" },
  PROFESSIONAL: { products: 10000, users: 20, reports: "Advanced" },
  PRO: { products: 10000, users: 20, reports: "Advanced" },
  ENTERPRISE: { products: -1, users: -1, reports: "Advanced" },
}
