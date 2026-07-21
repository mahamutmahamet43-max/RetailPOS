"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import {
  Activity,
  Database,
  Users,
  Store,
  HardDrive,
  Clock,
  Server,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"

interface HealthData {
  status: string
  version: string
  timestamp: string
  uptime: number
  database: {
    status: string
    latency: string | null
  }
  environment: string
}

interface BackupData {
  backups: Array<{
    id: string
    filename: string
    size: string
    createdAt: string
    status: string
  }>
  totalBackups: number
}

interface CountsData {
  users: number
  stores: number
  categories: number
  products: number
  customers: number
  sales: number
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const parts: string[] = []
  if (d > 0) parts.push(`${d}d`)
  if (h > 0) parts.push(`${h}h`)
  parts.push(`${m}m`)
  return parts.join(" ")
}

export default function AdminSystemPage() {
  const t = useTranslations("admin")
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string
  const [health, setHealth] = React.useState<HealthData | null>(null)
  const [backups, setBackups] = React.useState<BackupData | null>(null)
  const [counts, setCounts] = React.useState<CountsData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [creatingBackup, setCreatingBackup] = React.useState(false)

  const isOwner = session?.user?.role === "OWNER"

  React.useEffect(() => {
    if (status === "unauthenticated") {
      router.push(`/${locale}/login`)
      return
    }
    if (!isOwner && status === "authenticated") {
      router.push(`/${locale}/dashboard`)
      return
    }
  }, [status, isOwner, router, locale])

  React.useEffect(() => {
    async function fetchData() {
      try {
        const [healthRes, backupsRes, countsRes] = await Promise.all([
          fetch("/api/health"),
          fetch("/api/admin/backups"),
          fetch("/api/health/counts"),
        ])
        if (healthRes.ok) setHealth(await healthRes.json())
        if (backupsRes.ok) setBackups(await backupsRes.json())
        if (countsRes.ok) setCounts(await countsRes.json())
      } catch {
        // Health check failures are non-critical
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  async function createBackup() {
    setCreatingBackup(true)
    try {
      const res = await fetch("/api/admin/backups", { method: "POST" })
      if (res.ok) {
        const data = await res.json()
        setBackups((prev) =>
          prev
            ? { ...prev, backups: [...prev.backups, data.backup], totalBackups: prev.totalBackups + 1 }
            : { backups: [data.backup], totalBackups: 1 }
        )
      }
    } catch {
      // Ignore
    } finally {
      setCreatingBackup(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  if (!isOwner) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        <Badge variant={health?.status === "healthy" ? "default" : "destructive"}>
          {health?.status || "unknown"}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("applicationVersion")}</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{health?.version || "0.1.0"}</div>
            <p className="text-xs text-muted-foreground">{t("version")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("databaseStatus")}</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  health?.database?.status === "healthy" ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <span className="text-lg font-medium capitalize">{health?.database?.status || "unknown"}</span>
            </div>
            {health?.database?.latency && (
              <p className="text-xs text-muted-foreground">Latency: {health.database.latency}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("uptime")}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{health ? formatUptime(health.uptime) : "N/A"}</div>
            <p className="text-xs text-muted-foreground">{t("serverRunning")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("activeUsers")}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts?.users ?? "..."}</div>
            <p className="text-xs text-muted-foreground">{t("registeredUsers")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("storeCount")}</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts?.stores ?? "..."}</div>
            <p className="text-xs text-muted-foreground">{t("activeStores")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("totalProducts")}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts?.products ?? "..."}</div>
            <p className="text-xs text-muted-foreground">{t("productsInCatalog")}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            {t("backups")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={createBackup} disabled={creatingBackup}>
            {creatingBackup ? t("creatingBackup") : t("createBackup")}
          </Button>
          {backups && backups.backups.length > 0 ? (
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-2 text-left font-medium">{t("filename")}</th>
                    <th className="px-4 py-2 text-left font-medium">{t("size")}</th>
                    <th className="px-4 py-2 text-left font-medium">{t("date")}</th>
                    <th className="px-4 py-2 text-left font-medium">{t("status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {backups.backups.map((backup) => (
                    <tr key={backup.id} className="border-b">
                      <td className="px-4 py-2 font-mono text-xs">{backup.filename}</td>
                      <td className="px-4 py-2">{backup.size}</td>
                      <td className="px-4 py-2">{new Date(backup.createdAt).toLocaleString()}</td>
                      <td className="px-4 py-2">
                        <Badge variant="outline">{backup.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("noBackups")}</p>
          )}
        </CardContent>
      </Card>

    </div>
  )
}
