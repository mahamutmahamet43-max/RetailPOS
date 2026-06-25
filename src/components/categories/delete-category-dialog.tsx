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
import type { Category } from "./categories-table"

interface DeleteCategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: Category | null
  onSuccess: () => void
}

export function DeleteCategoryDialog({
  open,
  onOpenChange,
  category,
  onSuccess,
}: DeleteCategoryDialogProps) {
  const t = useTranslations("categories")
  const common = useTranslations("common")
  const [deleting, setDeleting] = React.useState(false)
  const [error, setError] = React.useState("")

  if (!category) return null

  async function handleDelete() {
    if (!category) return
    setDeleting(true)
    setError("")

    try {
      const res = await fetch(`/api/categories/${category.id}`, {
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
          <DialogDescription>
            {t("deleteWarning")}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="font-medium">{category.name}</p>
          {error && (
            <p className="mt-2 text-sm text-destructive">{error}</p>
          )}
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
