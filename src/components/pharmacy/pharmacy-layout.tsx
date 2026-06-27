"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { useRouter, useParams } from "next/navigation"
import { Pill } from "lucide-react"

export function PharmacyLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string
  const [enabled, setEnabled] = React.useState<boolean | null>(null)

  React.useEffect(() => {
    async function check() {
      try {
        const res = await fetch("/api/pharmacy/settings")
        if (res.ok) {
          const data = await res.json()
          setEnabled(data.enabled === true)
        } else {
          setEnabled(false)
        }
      } catch {
        setEnabled(false)
      }
    }
    if (status === "authenticated") check()
  }, [status])

  if (status === "loading" || enabled === null) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!enabled) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Pill className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Pharmacy Module Disabled</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          The pharmacy module is not enabled for your store. Enable it in settings to manage medicines, batches, and prescriptions.
        </p>
        <Button onClick={() => router.push(`/${locale}/dashboard/settings`)}>
          Go to Settings
        </Button>
      </div>
    )
  }

  return <>{children}</>
}
