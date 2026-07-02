"use client"

import { useOnlineStatus } from "@/hooks/use-online-status"
import { useTranslations } from "next-intl"

export function OfflineBanner() {
  const { isOnline, pendingCount } = useOnlineStatus()
  const t = useTranslations("common")

  if (isOnline && pendingCount === 0) return null

  return (
    <div
      className={`px-4 py-2 text-center text-sm font-medium ${
        isOnline
          ? "bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200"
          : "bg-yellow-100 text-yellow-900 dark:bg-yellow-950/40 dark:text-yellow-200"
      }`}
    >
      {isOnline
        ? `${pendingCount} sale(s) pending sync`
        : "You are offline — sales will sync when connected"}
    </div>
  )
}
