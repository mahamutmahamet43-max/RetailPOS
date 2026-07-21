"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import {
  BarChart3,
  TrendingUp,
  Package,
  Users,
  UserCircle,
} from "lucide-react"
import { OverviewTab } from "./overview-tab"
import { SalesTab } from "./sales-tab"
import { InventoryTab } from "./inventory-tab"
import { CustomersTab } from "./customers-tab"
import { CashiersTab } from "./cashiers-tab"

const TABS = [
  { id: "overview", label: "overview", icon: BarChart3 },
  { id: "sales", label: "sales", icon: TrendingUp },
  { id: "inventory", label: "inventory", icon: Package },
  { id: "customers", label: "customers", icon: Users },
  { id: "cashiers", label: "cashiers", icon: UserCircle },
] as const

export function ReportsPage() {
  const t = useTranslations("reports")
  const [activeTab, setActiveTab] = React.useState("overview")

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

      {activeTab === "overview" && <OverviewTab />}
      {activeTab === "sales" && <SalesTab />}
      {activeTab === "inventory" && <InventoryTab />}
      {activeTab === "customers" && <CustomersTab />}
      {activeTab === "cashiers" && <CashiersTab />}
    </div>
  )
}
