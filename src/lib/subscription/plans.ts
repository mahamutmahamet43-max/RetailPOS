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
  FREE: {
    id: "FREE",
    name: "Free Trial",
    monthlyPrice: 0,
    limits: {
      products: 100,
      customers: 50,
      users: 2,
      stores: 1,
      monthlySales: 5000,
      storage: 100,
      reports: "Basic",
      backupRetentionDays: 0,
      apiAccess: true,
      premiumFeatures: [],
    },
  },
  BASIC: {
    id: "BASIC",
    name: "Basic",
    monthlyPrice: 15,
    limits: {
      products: 5000,
      customers: 1000,
      users: 10,
      stores: 2,
      monthlySales: 50000,
      storage: 2048,
      reports: "Full",
      backupRetentionDays: 14,
      apiAccess: true,
      premiumFeatures: ["export-csv", "basic-reports"],
    },
  },
  PRO: {
    id: "PRO",
    name: "Pro",
    monthlyPrice: 29,
    limits: {
      products: 10000,
      customers: 5000,
      users: 20,
      stores: 3,
      monthlySales: 100000,
      storage: 5120,
      reports: "Advanced",
      backupRetentionDays: 30,
      apiAccess: true,
      premiumFeatures: ["export-csv", "advanced-reports", "multiple-stores", "priority-support"],
    },
  },
  ENTERPRISE: {
    id: "ENTERPRISE",
    name: "Enterprise",
    monthlyPrice: 99,
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
  if (!plan) return PLAN_DEFINITIONS.FREE
  return plan
}

export function getDisplayPlanId(planId: string): string {
  return planId
}

export function listPlans(): PlanDefinition[] {
  return ["FREE", "BASIC", "PRO", "ENTERPRISE"].map((id) => PLAN_DEFINITIONS[id])
}
