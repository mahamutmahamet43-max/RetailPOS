"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Purchase } from "./purchases-table"

interface CancelPurchaseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  purchase?: Purchase | null
  onSuccess: () => void
}

export function CancelPurchaseDialog({
  open,
  onOpenChange,
  purchase,
  onSuccess,
}: CancelPurchaseDialogProps) {
  const t = useTranslations("purchases")
  const common = useTranslations("common")
  const [cancelling, setCancelling] = React.useState(false)
  const [error, setError] = React.useState("")

  if (!purchase) return null

  async function handleCancel() {
    if (!purchase) return
    setCancelling(true)
    setError("")

    try {
      const res = await fetch(`/api/purchases/${purchase.id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || common("error"))
        return
      }

      onSuccess()
      onOpenChange(false)
    } catch {
      setError(common("error"))
    } finally {
      setCancelling(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("cancelTitle")}</DialogTitle>
          <DialogDescription>
            {purchase.status === "COMPLETED"
              ? t("cancelWarningCompleted")
              : t("cancelWarningPending")}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="font-medium">{purchase.invoiceNumber}</p>
          <p className="text-sm text-muted-foreground">
            {t("supplier")}: {purchase.supplierName}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("items")}: {purchase.items.length}
          </p>
          <p className="text-sm font-medium mt-1">
            {t("total")}: ${purchase.total.toFixed(2)}
          </p>
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={cancelling}
          >
            {common("cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={cancelling}
          >
            {cancelling ? common("loading") : t("confirmCancel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
