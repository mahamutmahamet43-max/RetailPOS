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
import type { Supplier } from "./suppliers-table"

interface DeleteSupplierDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  supplier?: Supplier | null
  onSuccess: () => void
}

export function DeleteSupplierDialog({
  open,
  onOpenChange,
  supplier,
  onSuccess,
}: DeleteSupplierDialogProps) {
  const t = useTranslations("suppliers")
  const common = useTranslations("common")
  const [deleting, setDeleting] = React.useState(false)
  const [error, setError] = React.useState("")

  if (!supplier) return null

  async function handleDelete() {
    if (!supplier) return
    setDeleting(true)
    setError("")

    try {
      const res = await fetch(`/api/suppliers/${supplier.id}`, {
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
      setDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("delete")}</DialogTitle>
          <DialogDescription>{t("deleteWarning")}</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="font-medium">{supplier.name}</p>
          {supplier.phone && (
            <p className="text-sm text-muted-foreground">
              {t("phone")}: {supplier.phone}
            </p>
          )}
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleting}
          >
            {common("cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? common("loading") : common("delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
