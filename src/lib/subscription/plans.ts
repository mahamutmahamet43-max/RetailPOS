export interface PlanLimits {
  products: number
  customers: number
  users: number
  stores: number
  monthlySales: number
  storage: number
  reports: "Basic" | "Full" | "Advanced"
  backupRetentionDays: number
  apiAccess: boolean
  premiumFeatures: string[]
}

export interface PlanDefinition {
  id: string
  name: string
  monthlyPrice: number
  limits: PlanLimits
}

export const PLAN_DEFINITIONS: Record<string, PlanDefinition> = {
  PREMIUM: {
    id: "PREMIUM",
    name: "Premium",
    monthlyPrice: 20,
    limits: {
      products: -1,
      customers: -1,
      users: -1,
      stores: -1,
      monthlySales: -1,
      storage: -1,
      reports: "Advanced",
      backupRetentionDays: 90,
      apiAccess: true,
      premiumFeatures: ["*"],
    },
  },
}

export function getPlanConfig(planId: string): PlanDefinition {
  const plan = PLAN_DEFINITIONS[planId]
  if (!plan) return PLAN_DEFINITIONS.PREMIUM
  return plan
}

export function getDisplayPlanId(planId: string): string {
  return planId
}

export function listPlans(): PlanDefinition[] {
  return Object.values(PLAN_DEFINITIONS)
}
