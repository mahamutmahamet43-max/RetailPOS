"use client"

import * as React from "react"
import { useOnlineStatus } from "@/hooks/use-online-status"
import { processPendingSales } from "@/lib/sync-engine"
import { toast } from "sonner"
import { useTranslations } from "next-intl"

export function SyncManager() {
  const { isOnline, pendingCount, refreshPendingCount } = useOnlineStatus()
  const t = useTranslations("common")
  const syncingRef = React.useRef(false)

  React.useEffect(() => {
    if (!isOnline || pendingCount === 0 || syncingRef.current) return

    syncingRef.current = true
    const doSync = async () => {
      const result = await processPendingSales()
      if (result.synced > 0) {
        toast.success(`${result.synced} sale(s) synced successfully`)
      }
      if (result.conflicted > 0) {
        toast.error(`${result.conflicted} sale(s) have conflicts — check reports`)
      }
      await refreshPendingCount()
      syncingRef.current = false
    }
    doSync()
  }, [isOnline, pendingCount, refreshPendingCount, t])

  return null
}
