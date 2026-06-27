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
  BarChart3,
  Settings,
  Store,
  Truck,
  ClipboardList,
} from "lucide-react"
import { cn } from "@/lib/utils"

const sidebarItems = [
  { href: "/dashboard", label: "dashboard", icon: LayoutDashboard },
  { href: "/dashboard/products", label: "products", icon: Package },
  { href: "/dashboard/categories", label: "categories", icon: Tags },
  { href: "/dashboard/suppliers", label: "suppliers", icon: Truck },
  { href: "/dashboard/purchases", label: "purchases", icon: ClipboardList },
  { href: "/dashboard/customers", label: "customers", icon: Users },
  { href: "/dashboard/sales", label: "sales", icon: ShoppingCart },
  { href: "/dashboard/reports", label: "reports", icon: BarChart3 },
  { href: "/dashboard/settings", label: "settings", icon: Settings },
] as const

export function DashboardSidebar({ className }: { className?: string }) {
  const pathname = usePathname()
  const t = useTranslations("nav")
  const locale = pathname.split("/")[1] || "en"
  const items = sidebarItems

  function NavLink({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
    const fullHref = `/${locale}${href}`
    const isActive = href === "/dashboard"
      ? pathname === fullHref
      : pathname === fullHref || pathname.startsWith(fullHref + "/")
    return (
      <Link
        href={fullHref}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <Icon className="h-4 w-4" />
        {label}
      </Link>
    )
  }

  return (
    <aside className={cn("hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-56 lg:flex-col", className)}>
      <div className="flex flex-col gap-2 border-r bg-card px-4 py-6 h-full overflow-y-auto">
        <Link
          href={`/${locale}/dashboard`}
          className="flex items-center gap-2 px-2 mb-6"
        >
          <Store className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">RetailPOS</span>
        </Link>

        <nav className="flex flex-col gap-1">
          {items.map((item) => (
            <NavLink key={item.href} href={item.href} icon={item.icon} label={t(item.label)} />
          ))}

        </nav>
      </div>
    </aside>
  )
}
