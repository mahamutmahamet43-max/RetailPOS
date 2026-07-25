"use client"

import * as React from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useRouter, useParams, usePathname } from "next/navigation"
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
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

const mobileNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/products", label: "Products", icon: Package },
  { href: "/dashboard/categories", label: "Categories", icon: Tags },
  { href: "/dashboard/customers", label: "Customers", icon: Users },
  { href: "/dashboard/sales", label: "Sales", icon: ShoppingCart },
  { href: "/dashboard/purchases", label: "Purchases", icon: ShoppingBag },
  { href: "/dashboard/inventory", label: "Inventory", icon: Warehouse },
  { href: "/dashboard/reports", label: "Reports", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const pathname = usePathname()
  const locale = params.locale as string
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  React.useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/${locale}/login`)
    }
  }, [status, router, locale])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-6xl space-y-4">
          <Skeleton className="h-12 w-full" />
          <div className="flex gap-4">
            <Skeleton className="h-96 w-56 hidden lg:block" />
            <Skeleton className="h-96 flex-1" />
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen">
      <DashboardSidebar />

      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-56">
          <div className="flex flex-col h-full bg-card px-4 py-6">
            <Link
              href={`/${locale}/dashboard`}
              className="flex items-center gap-2 px-2 mb-6"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Store className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">RetailPOS</span>
            </Link>
            <nav className="flex flex-col gap-1">
              {mobileNavItems.map((item) => {
                const href = `/${locale}${item.href}`
                const isActive = pathname === href
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>
        </SheetContent>
      </Sheet>

      <div className="lg:pl-56">
        <DashboardHeader onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
