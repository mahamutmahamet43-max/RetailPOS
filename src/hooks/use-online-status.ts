"use client"

import { useState, useEffect, useCallback } from "react"
import { getPendingCount } from "@/lib/sync-engine"

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)

  const updatePendingCount = useCallback(async () => {
    try {
      const count = await getPendingCount()
      setPendingCount(count)
    } catch {}
  }, [])

  useEffect(() => {
    setIsOnline(navigator.onLine)

    function handleOnline() {
      setIsOnline(true)
      updatePendingCount()
    }

    function handleOffline() {
      setIsOnline(false)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    const interval = setInterval(updatePendingCount, 5000)

    updatePendingCount()

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      clearInterval(interval)
    }
  }, [updatePendingCount])

  return { isOnline, pendingCount, refreshPendingCount: updatePendingCount }
}
