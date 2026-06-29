"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import {
  HardDrive,
  Download,
  Upload,
  Trash2,
  RotateCcw,
  Check,
  X,
  FileJson,
  AlertTriangle,
  ShoppingBag,
  Sparkles,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Backup {
  id: string
  filename: string
  size: string
  createdAt: string
  status: string
}

interface BackupData {
  backups: Backup[]
  totalBackups: number
}

export default function BackupPage() {
  const t = useTranslations("admin")
  const common = useTranslations("common")
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string

  const [backups, setBackups] = React.useState<BackupData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [creating, setCreating] = React.useState(false)
  const [restoring, setRestoring] = React.useState(false)
  const [deleting, setDeleting] = React.useState<string | null>(null)

  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null)

  const [seeding, setSeeding] = React.useState(false)
  const [showSeedConfirm, setShowSeedConfirm] = React.useState(false)

  const [restoreTarget, setRestoreTarget] = React.useState<Backup | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<Backup | null>(null)

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
    if (status !== "authenticated" || !isOwner) return
    loadBackups()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, isOwner])

  function showMessage(type: "success" | "error", text: string) {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  async function loadBackups() {
    try {
      const res = await fetch("/api/admin/backups")
      if (res.ok) setBackups(await res.json())
    } catch {
      showMessage("error", t("failedLoadBackups"))
    } finally {
      setLoading(false)
    }
  }

  async function createBackup() {
    setCreating(true)
    try {
      const res = await fetch("/api/admin/backups", { method: "POST" })
      if (res.ok) {
        const data = await res.json()
        setBackups((prev) =>
          prev
            ? { ...prev, backups: [data.backup, ...prev.backups], totalBackups: prev.totalBackups + 1 }
            : { backups: [data.backup], totalBackups: 1 }
        )
        showMessage("success", t("backupCreated"))
      } else {
        showMessage("error", t("failedCreateBackup"))
      }
    } catch {
      showMessage("error", t("failedCreateBackup"))
    } finally {
      setCreating(false)
    }
  }

  async function downloadBackup(backupId: string, filename: string) {
    try {
      const res = await fetch(`/api/admin/backups/${backupId}`)
      if (!res.ok) {
        showMessage("error", t("failedDownload"))
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      showMessage("error", t("failedDownload"))
    }
  }

  async function seedDemo() {
    setShowSeedConfirm(false)
    setSeeding(true)
    try {
      const res = await fetch("/api/admin/seed-demo", { method: "POST" })
      const data = await res.json()
      if (data.success) {
        showMessage("success", t("seedDemoSuccess"))
        await loadBackups()
      } else if (res.status === 409) {
        showMessage("error", t("seedDemoDataExists"))
      } else {
        showMessage("error", data.error || t("seedDemoFailed"))
      }
    } catch {
      showMessage("error", t("seedDemoFailed"))
    } finally {
      setSeeding(false)
    }
  }

  async function restoreBackup(backup: Backup) {
    setRestoreTarget(null)
    setRestoring(true)
    try {
      const res = await fetch(`/api/admin/backups/${backup.id}`)
      if (!res.ok) {
        showMessage("error", t("failedFetchBackupData"))
        return
      }
      const data = await res.json()
      const restoreRes = await fetch("/api/admin/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      })
      const result = await restoreRes.json()
      if (result.success) {
        showMessage("success", t("backupRestored"))
      } else {
        showMessage("error", result.error || t("restoreFailed"))
      }
    } catch {
      showMessage("error", t("restoreFailed"))
    } finally {
      setRestoring(false)
    }
  }

  async function deleteBackup(backup: Backup) {
    setDeleteTarget(null)
    setDeleting(backup.id)
    try {
      const res = await fetch(`/api/admin/backups/${backup.id}`, { method: "DELETE" })
      if (res.ok) {
        setBackups((prev) =>
          prev
            ? { ...prev, backups: prev.backups.filter((b) => b.id !== backup.id), totalBackups: prev.totalBackups - 1 }
            : null
        )
        showMessage("success", t("backupDeleted"))
      } else {
        showMessage("error", t("failedDeleteBackup"))
      }
    } catch {
      showMessage("error", t("failedDeleteBackup"))
    } finally {
      setDeleting(null)
    }
  }

  async function restoreFromFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setRestoring(true)
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      const res = await fetch("/api/admin/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      })
      const result = await res.json()
      if (result.success) {
        showMessage("success", t("backupRestoredFromFile"))
      } else {
        showMessage("error", result.error || t("restoreFailed"))
      }
    } catch {
      showMessage("error", t("invalidBackupFile"))
    } finally {
      setRestoring(false)
      event.target.value = ""
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString()
  }

  function formatSize(size: string) {
    return size
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-72" />
        <div className="flex gap-3">
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-44" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!isOwner) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("backupTitle")}</h1>
        <p className="text-muted-foreground mt-1">
          {t("backupDescription")}
        </p>
      </div>

      {message && (
        <div
          className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${
            message.type === "success"
              ? "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300"
              : "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300"
          }`}
        >
          {message.type === "success" ? <Check className="h-4 w-4 shrink-0" /> : <X className="h-4 w-4 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <ShoppingBag className="h-5 w-5 text-primary" />
              {t("seedDemo")}
            </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t("seedDemoDescription")}
          </p>
          <Button
            onClick={() => setShowSeedConfirm(true)}
            disabled={seeding}
            className="gap-2"
          >
            {seeding ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {seeding ? t("seedingDemo") : t("seedDemoButton")}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <HardDrive className="h-5 w-5" />
              {t("backups")}
            </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-3">
            <Button onClick={createBackup} disabled={creating} className="gap-2">
              <HardDrive className="h-4 w-4" />
              {creating ? t("creatingBackup") : t("createBackup")}
            </Button>
            <Button variant="outline" disabled={restoring} className="gap-2 relative">
              <Upload className="h-4 w-4" />
              {restoring ? t("restoringBackup") : t("restoreBackupUpload")}
              <input
                type="file"
                accept=".json"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={restoreFromFile}
                disabled={restoring}
              />
            </Button>
          </div>

          {backups && backups.backups.length > 0 ? (
            <div className="rounded-lg border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("backupName")}</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("fileSize")}</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("createdDateTime")}</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("status")}</th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">{common("actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backups.backups.map((backup) => (
                      <tr key={backup.id} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <FileJson className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="font-mono text-xs truncate max-w-[200px] lg:max-w-[300px]">
                              {backup.filename}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{formatSize(backup.size)}</td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatDate(backup.createdAt)}</td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={backup.status === "completed" ? "default" : "outline"}
                            className="capitalize"
                          >
                            {backup.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => downloadBackup(backup.id, backup.filename)}
                              title="Download"
                            >
                              <Download className="h-4 w-4" />
                              <span className="sr-only">{t("download")}</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setRestoreTarget(backup)}
                              disabled={restoring}
                              title="Restore"
                            >
                              <RotateCcw className="h-4 w-4" />
                              <span className="sr-only">{t("restore")}</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteTarget(backup)}
                              disabled={deleting === backup.id}
                              title="Delete"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              {deleting === backup.id ? (
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                              <span className="sr-only">{common("delete")}</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <HardDrive className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground font-medium">{t("noBackupsYet")}</p>
              <p className="text-sm text-muted-foreground/60 mt-1">
                {t("noBackupsDescription")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showSeedConfirm} onOpenChange={(open) => { if (!open) setShowSeedConfirm(false) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {t("seedDemoConfirmTitle")}
            </DialogTitle>
            <DialogDescription className="pt-2">
              {t("seedDemoConfirm")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowSeedConfirm(false)}>
              {common("cancel")}
            </Button>
            <Button
              variant="default"
              onClick={seedDemo}
              disabled={seeding}
              className="gap-2"
            >
              {seeding ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {seeding ? t("seedingDemo") : t("seedDemoButton")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!restoreTarget} onOpenChange={(open) => { if (!open) setRestoreTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              {t("restoreWarningTitle")}
            </DialogTitle>
            <DialogDescription className="pt-2">
              {t("restoreWarningDescription")}
              <strong className="block mt-2 text-foreground">{t("restoreWarningIrreversible")}</strong>
            </DialogDescription>
          </DialogHeader>
          {restoreTarget && (
            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
              <div className="flex items-center gap-2">
                <FileJson className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{restoreTarget.filename}</span>
              </div>
              <p className="text-muted-foreground mt-1">{t("created", { date: formatDate(restoreTarget.createdAt) })}</p>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRestoreTarget(null)}>
              {common("cancel")}
            </Button>
            <Button
              variant="default"
              onClick={() => restoreTarget && restoreBackup(restoreTarget)}
              disabled={restoring}
              className="gap-2"
            >
              {restoring ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {t("restoringBackup")}
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4" />
                  {t("confirmRestore")}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              {t("deleteBackupTitle")}
            </DialogTitle>
            <DialogDescription className="pt-2">
              {t("deleteWarningDescription")}
              <strong className="block mt-2 text-foreground">{t("restoreWarningIrreversible")}</strong>
            </DialogDescription>
          </DialogHeader>
          {deleteTarget && (
            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
              <div className="flex items-center gap-2">
                <FileJson className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{deleteTarget.filename}</span>
              </div>
              <p className="text-muted-foreground mt-1">{t("created", { date: formatDate(deleteTarget.createdAt) })}</p>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              {common("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && deleteBackup(deleteTarget)}
              disabled={deleting === deleteTarget?.id}
              className="gap-2"
            >
              {deleting === deleteTarget?.id ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {common("loading")}
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  {common("delete")}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
