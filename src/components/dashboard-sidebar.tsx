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
  Pill,
  FlaskConical,
  Truck,
  ClipboardList,
  AlertTriangle,
  Syringe,
} from "lucide-react"
import { cn } from "@/lib/utils"

const sidebarItems = [
  { href: "/dashboard", label: "dashboard", icon: LayoutDashboard },
  { href: "/dashboard/products", label: "products", icon: Package },
  { href: "/dashboard/categories", label: "categories", icon: Tags },
  { href: "/dashboard/customers", label: "customers", icon: Users },
  { href: "/dashboard/sales", label: "sales", icon: ShoppingCart },
  { href: "/dashboard/reports", label: "reports", icon: BarChart3 },
  { href: "/dashboard/settings", label: "settings", icon: Settings },
] as const

const pharmacyItems = [
  { href: "/dashboard/pharmacy/medicines", label: "Medicines", icon: Pill },
  { href: "/dashboard/pharmacy/batches", label: "Batches", icon: FlaskConical },
  { href: "/dashboard/pharmacy/suppliers", label: "Suppliers", icon: Truck },
  { href: "/dashboard/pharmacy/purchases", label: "Purchases", icon: ClipboardList },
  { href: "/dashboard/pharmacy/reports", label: "Pharmacy Reports", icon: BarChart3 },
  { href: "/dashboard/pharmacy/adjustments", label: "Adjustments", icon: AlertTriangle },
  { href: "/dashboard/pharmacy/prescriptions", label: "Prescriptions", icon: Syringe },
] as const

export function DashboardSidebar({ className }: { className?: string }) {
  const pathname = usePathname()
  const t = useTranslations("nav")
  const locale = pathname.split("/")[1] || "en"
  const [pharmacyEnabled, setPharmacyEnabled] = React.useState(false)

  React.useEffect(() => {
    fetch("/api/pharmacy/settings")
      .then((r) => r.json())
      .then((d) => setPharmacyEnabled(d.enabled))
      .catch(() => {})
  }, [])

  const items = sidebarItems

  function NavLink({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
    const fullHref = `/${locale}${href}`
    const isActive = pathname === fullHref || pathname.startsWith(fullHref + "/")
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

          {pharmacyEnabled && (
            <>
              <div className="mt-4 mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Pharmacy
              </div>
              {pharmacyItems.map((item) => (
                <NavLink key={item.href} href={item.href} icon={item.icon} label={item.label} />
              ))}
            </>
          )}
        </nav>
      </div>
    </aside>
  )
}
