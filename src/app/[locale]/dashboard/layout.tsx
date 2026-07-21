"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
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
          <DashboardSidebar />
        </SheetContent>
      </Sheet>

      <div className="lg:pl-56">
        <DashboardHeader onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
