"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import {
  BarChart3,
  TrendingUp,
  Package,
  Users,
  UserCircle,
  ShoppingCart,
  Building2,
  Banknote,
} from "lucide-react"
import { Loader2 } from "lucide-react"

const OverviewTab = React.lazy(() =>
  import("./overview-tab").then((m) => ({ default: m.OverviewTab }))
)
const SalesTab = React.lazy(() =>
  import("./sales-tab").then((m) => ({ default: m.SalesTab }))
)
const InventoryTab = React.lazy(() =>
  import("./inventory-tab").then((m) => ({ default: m.InventoryTab }))
)
const CustomersTab = React.lazy(() =>
  import("./customers-tab").then((m) => ({ default: m.CustomersTab }))
)
const CashiersTab = React.lazy(() =>
  import("./cashiers-tab").then((m) => ({ default: m.CashiersTab }))
)
const PurchasesTab = React.lazy(() =>
  import("./purchases-tab").then((m) => ({ default: m.PurchasesTab }))
)
const SuppliersTab = React.lazy(() =>
  import("./suppliers-tab").then((m) => ({ default: m.SuppliersTab }))
)
const CreditTab = React.lazy(() =>
  import("./credit-tab").then((m) => ({ default: m.CreditTab }))
)

const TABS = [
  { id: "overview", label: "overview", icon: BarChart3, Component: OverviewTab },
  { id: "sales", label: "sales", icon: TrendingUp, Component: SalesTab },
  { id: "inventory", label: "inventory", icon: Package, Component: InventoryTab },
  { id: "purchases", label: "purchases", icon: ShoppingCart, Component: PurchasesTab },
  { id: "suppliers", label: "suppliers", icon: Building2, Component: SuppliersTab },
  { id: "customers", label: "customers", icon: Users, Component: CustomersTab },
  { id: "cashiers", label: "cashiers", icon: UserCircle, Component: CashiersTab },
  { id: "credit", label: "credit", icon: Banknote, Component: CreditTab },
] as const

export function ReportsPage() {
  const t = useTranslations("reports")
  const [activeTab, setActiveTab] = React.useState("overview")

  const ActiveComponent = TABS.find((tab) => tab.id === activeTab)?.Component

  return (
    <div className="space-y-6">
      <div className="flex gap-1 border-b">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t(tab.label)}
            </button>
          )
        })}
      </div>

      <React.Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        }
      >
        {ActiveComponent && <ActiveComponent />}
      </React.Suspense>
    </div>
  )
}
