import { NextResponse } from "next/server"
import { listPlans } from "@/lib/subscription/plans"

export async function GET() {
  const plans = listPlans().map((p) => ({
    id: p.id,
    name: p.name,
    monthlyPrice: p.monthlyPrice,
    limits: {
      products: p.limits.products,
      customers: p.limits.customers,
      users: p.limits.users,
      stores: p.limits.stores,
      monthlySales: p.limits.monthlySales,
      storage: p.limits.storage,
      reports: p.limits.reports,
      backupRetentionDays: p.limits.backupRetentionDays,
      premiumFeatures: p.limits.premiumFeatures,
    },
  }))

  return NextResponse.json({ plans })
}
