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
import type { Customer } from "./customers-table"

interface CustomerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer?: Customer | null
  onSuccess: () => void
}

export function CustomerDialog({
  open,
  onOpenChange,
  customer,
  onSuccess,
}: CustomerDialogProps) {
  const t = useTranslations("customers")
  const common = useTranslations("common")
  const isEdit = !!customer

  const [firstName, setFirstName] = React.useState("")
  const [lastName, setLastName] = React.useState("")
  const [companyName, setCompanyName] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [address, setAddress] = React.useState("")
  const [city, setCity] = React.useState("")
  const [notes, setNotes] = React.useState("")
  const [creditLimit, setCreditLimit] = React.useState("0")
  const [isActive, setIsActive] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState("")

  React.useEffect(() => {
    if (open) {
      setFirstName(customer?.firstName || "")
      setLastName(customer?.lastName || "")
      setCompanyName(customer?.companyName || "")
      setPhone(customer?.phone || "")
      setEmail(customer?.email || "")
      setAddress(customer?.address || "")
      setCity(customer?.city || "")
      setNotes(customer?.notes || "")
      setCreditLimit(
        customer?.creditLimit !== undefined
          ? String(customer.creditLimit)
          : "0"
      )
      setIsActive(customer?.isActive ?? true)
      setError("")
    }
  }, [open, customer])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!firstName.trim()) {
      setError(t("firstNameRequired"))
      return
    }

    if (!phone.trim()) {
      setError(t("phoneRequired"))
      return
    }

    const creditLimitNum = parseFloat(creditLimit) || 0
    if (creditLimitNum < 0) {
      setError(t("creditLimitNegative"))
      return
    }

    setSaving(true)

    try {
      const url = isEdit
        ? `/api/customers/${customer.id}`
        : "/api/customers"
      const method = isEdit ? "PATCH" : "POST"
      const body = JSON.stringify({
        firstName: firstName.trim(),
        lastName: lastName.trim() || null,
        companyName: companyName.trim() || null,
        phone: phone.trim(),
        email: email.trim() || null,
        address: address.trim() || null,
        city: city.trim() || null,
        notes: notes.trim() || null,
        creditLimit: creditLimitNum,
        isActive,
      })

      const res = await fetch(url, {
        method,
        body,
        headers: { "Content-Type": "application/json" },
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
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("edit") : t("add")}</DialogTitle>
          <DialogDescription>
            {isEdit ? t("edit") : t("add")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="c-firstName">
                  {t("firstName")} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="c-firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder={t("firstNamePlaceholder")}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-lastName">{t("lastName")}</Label>
                <Input
                  id="c-lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder={t("lastNamePlaceholder")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="c-company">{t("company")}</Label>
              <Input
                id="c-company"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder={t("companyPlaceholder")}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="c-phone">
                  {t("phone")} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="c-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+252 61 234 5678"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-email">{t("email")}</Label>
                <Input
                  id="c-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="c-address">{t("address")}</Label>
              <Input
                id="c-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={t("addressPlaceholder")}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="c-city">{t("city")}</Label>
                <Input
                  id="c-city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={t("cityPlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-creditLimit">{t("creditLimit")}</Label>
                <Input
                  id="c-creditLimit"
                  type="number"
                  step="0.01"
                  min="0"
                  value={creditLimit}
                  onChange={(e) => setCreditLimit(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="c-notes">{t("notes")}</Label>
              <Textarea
                id="c-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("notesPlaceholder")}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="c-isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="c-isActive">{common("active")}</Label>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
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
