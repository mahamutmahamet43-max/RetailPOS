"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import {
  LayoutDashboard,
  Package,
  Tags,
  Users,
  ShoppingCart,
  ShoppingBag,
  Warehouse,
  BarChart3,
  Settings,
  Store,
} from "lucide-react"
import { cn } from "@/lib/utils"

const sidebarItems = [
  { href: "/dashboard", label: "dashboard", icon: LayoutDashboard },
  { href: "/dashboard/products", label: "products", icon: Package },
  { href: "/dashboard/categories", label: "categories", icon: Tags },
  { href: "/dashboard/customers", label: "customers", icon: Users },
  { href: "/dashboard/sales", label: "sales", icon: ShoppingCart },
  { href: "/dashboard/purchases", label: "purchases", icon: ShoppingBag },
  { href: "/dashboard/inventory", label: "inventory", icon: Warehouse },
  { href: "/dashboard/reports", label: "reports", icon: BarChart3 },
  { href: "/dashboard/settings", label: "settings", icon: Settings },
] as const

export function DashboardSidebar() {
  const pathname = usePathname()
  const t = useTranslations("nav")
  const locale = pathname.split("/")[1] || "en"

  const items = sidebarItems

  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-56 lg:flex-col">
      <div className="flex flex-col gap-2 border-r bg-card px-4 py-6 h-full">
        <Link
          href={`/${locale}/dashboard`}
          className="flex items-center gap-2 px-2 mb-6"
        >
          <Store className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">RetailPOS</span>
        </Link>

        <nav className="flex flex-col gap-1">
          {items.map((item) => {
            const href = `/${locale}${item.href}`
            const isActive = pathname === href
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {t(item.label)}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
