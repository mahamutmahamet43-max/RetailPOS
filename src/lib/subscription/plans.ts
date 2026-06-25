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
  STARTER: {
    id: "STARTER",
    name: "Starter",
    monthlyPrice: 29,
    limits: {
      products: 2000,
      customers: 500,
      users: 5,
      stores: 1,
      monthlySales: 20000,
      storage: 1024,
      reports: "Full",
      backupRetentionDays: 7,
      apiAccess: true,
      premiumFeatures: ["export-csv"],
    },
  },
  BASIC: {
    id: "BASIC",
    name: "Basic",
    monthlyPrice: 29,
    limits: {
      products: 2000,
      customers: 500,
      users: 5,
      stores: 1,
      monthlySales: 20000,
      storage: 1024,
      reports: "Full",
      backupRetentionDays: 7,
      apiAccess: true,
      premiumFeatures: ["export-csv"],
    },
  },
  PROFESSIONAL: {
    id: "PROFESSIONAL",
    name: "Professional",
    monthlyPrice: 99,
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
  PRO: {
    id: "PRO",
    name: "Premium",
    monthlyPrice: 99,
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
    monthlyPrice: 299,
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
  if (planId === "BASIC") return "STARTER"
  if (planId === "PRO") return "PROFESSIONAL"
  return planId
}

export function listPlans(): PlanDefinition[] {
  return ["FREE", "STARTER", "PROFESSIONAL", "ENTERPRISE"].map((id) => PLAN_DEFINITIONS[id])
}
