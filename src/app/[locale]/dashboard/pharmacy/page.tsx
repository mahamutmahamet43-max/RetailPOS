"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import { PharmacyLayout } from "@/components/pharmacy/pharmacy-layout"

export default function PharmacyPage() {
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string

  React.useEffect(() => {
    router.replace(`/${locale}/dashboard/pharmacy/medicines`)
  }, [router, locale])

  return (
    <PharmacyLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pharmacy</h1>
          <p className="text-muted-foreground">Pharmacy module dashboard</p>
        </div>
      </div>
    </PharmacyLayout>
  )
}
