"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Category } from "./categories-table"

interface CategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: Category | null
  onSuccess: () => void
}

export function CategoryDialog({
  open,
  onOpenChange,
  category,
  onSuccess,
}: CategoryDialogProps) {
  const t = useTranslations("categories")
  const common = useTranslations("common")
  const isEdit = !!category

  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [color, setColor] = React.useState("")
  const [isActive, setIsActive] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState("")

  React.useEffect(() => {
    if (open) {
      setName(category?.name || "")
      setDescription(category?.description || "")
      setColor(category?.color || "")
      setIsActive(category?.isActive ?? true)
      setError("")
    }
  }, [open, category])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!name.trim()) {
      setError(t("nameRequired"))
      return
    }

    setSaving(true)

    try {
      const url = isEdit ? `/api/categories/${category.id}` : "/api/categories"
      const method = isEdit ? "PATCH" : "POST"
      const body = JSON.stringify({
        name: name.trim(),
        description: description || null,
        color: color || null,
        isActive,
      })

      const res = await fetch(url, { method, body, headers: { "Content-Type": "application/json" } })

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
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? t("edit") : t("add")}</DialogTitle>
          <DialogDescription>
            {isEdit ? t("edit") : t("add")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                {t("name")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("namePlaceholder")}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{t("description")}</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("descriptionPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">{t("color")}</Label>
              <div className="flex gap-2">
                <Input
                  id="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="#ff0000"
                />
                {color && (
                  <span
                    className="inline-block h-9 w-9 rounded-md border shrink-0"
                    style={{ backgroundColor: color }}
                  />
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isActive">{common("active")}</Label>
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {common("cancel")}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? common("loading") : common("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
