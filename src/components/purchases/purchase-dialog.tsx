"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Purchase, PurchaseItem } from "./purchases-table"

interface LineItem {
  key: string
  productId: string
  productName: string
  productUnitId: string
  unitName: string
  unitConversionFactor: string
  quantity: string
  costPrice: string
}

interface ProductOption {
  id: string
  name: string
  barcode: string | null
  sku: string | null
}

interface UnitOption {
  id: string
  name: string
  conversionFactor: number
  isBaseUnit: boolean
}

interface PurchaseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  purchase?: Purchase | null
  onSuccess: () => void
}

export function PurchaseDialog({
  open,
  onOpenChange,
  purchase,
  onSuccess,
}: PurchaseDialogProps) {
  const t = useTranslations("purchases")
  const common = useTranslations("common")
  const isEdit = !!purchase

  const [invoiceNumber, setInvoiceNumber] = React.useState("")
  const [supplierId, setSupplierId] = React.useState("")
  const [supplierName, setSupplierName] = React.useState("")
  const [notes, setNotes] = React.useState("")
  const [status, setStatus] = React.useState("PENDING")
  const [lines, setLines] = React.useState<LineItem[]>([newLine()])
  const [products, setProducts] = React.useState<ProductOption[]>([])
  const [productUnits, setProductUnits] = React.useState<Record<string, UnitOption[]>>({})
  const [suppliers, setSuppliers] = React.useState<{ id: string; name: string }[]>([])
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState("")
  const [productSearch, setProductSearch] = React.useState("")

  function newLine(): LineItem {
    return {
      key: Math.random().toString(36).slice(2),
      productId: "",
      productName: "",
      productUnitId: "",
      unitName: "pcs",
      unitConversionFactor: "1",
      quantity: "1",
      costPrice: "0",
    }
  }

  React.useEffect(() => {
    if (open) {
      fetchSuppliers()
      fetchProducts()
      if (purchase) {
        setInvoiceNumber(purchase.invoiceNumber)
        setSupplierId(purchase.supplierId || "")
        setSupplierName(purchase.supplierName)
        setNotes(purchase.notes || "")
        setStatus(purchase.status)
        setLines(
          purchase.items.map((item: PurchaseItem) => ({
            key: Math.random().toString(36).slice(2),
            productId: item.productId,
            productName: item.productName,
            productUnitId: item.productUnitId || "",
            unitName: item.unitName,
            unitConversionFactor: String(item.unitConversionFactor),
            quantity: String(item.quantity),
            costPrice: String(item.costPrice),
          }))
        )
      } else {
        setInvoiceNumber("")
        setSupplierId("")
        setSupplierName("")
        setNotes("")
        setStatus("PENDING")
        setLines([newLine()])
      }
      setError("")
      setProductSearch("")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, purchase])

  async function fetchSuppliers() {
    try {
      const res = await fetch("/api/suppliers")
      if (res.ok) {
        const data = await res.json()
        setSuppliers(data)
      }
    } catch {
      console.error("Failed to fetch suppliers")
    }
  }

  async function fetchProducts() {
    try {
      const params = productSearch ? `?search=${encodeURIComponent(productSearch)}` : ""
      const res = await fetch(`/api/products${params}`)
      if (res.ok) {
        const data = await res.json()
        setProducts(data.products || data || [])
      }
    } catch {
      console.error("Failed to fetch products")
    }
  }

  async function fetchUnits(productId: string) {
    if (!productId || productUnits[productId]) return
    try {
      const res = await fetch(`/api/products/${productId}`)
      if (res.ok) {
        const product = await res.json()
        const units = product.units || []
        setProductUnits((prev) => ({ ...prev, [productId]: units }))
      }
    } catch {
      console.error("Failed to fetch product units")
    }
  }

  React.useEffect(() => {
    if (open) fetchProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productSearch, open])

  function addLine() {
    setLines((prev) => [...prev, newLine()])
  }

  function removeLine(key: string) {
    setLines((prev) => prev.filter((l) => l.key !== key))
  }

  function updateLine(key: string, field: keyof LineItem, value: string) {
    setLines((prev) =>
      prev.map((line) => {
        if (line.key !== key) return line
        const updated = { ...line, [field]: value }
        if (field === "productId" && value) {
          fetchUnits(value)
          const product = products.find((p) => p.id === value)
          if (product) updated.productName = product.name
        }
        if (field === "productUnitId" && value) {
          const units = productUnits[line.productId] || []
          const unit = units.find((u) => u.id === value)
          if (unit) {
            updated.unitName = unit.name
            updated.unitConversionFactor = String(unit.conversionFactor)
          }
        }
        return updated
      })
    )
  }

  const lineTotal = (line: LineItem) => {
    const qty = parseFloat(line.quantity) || 0
    const cost = parseFloat(line.costPrice) || 0
    return qty * cost
  }

  const grandTotal = lines.reduce((sum, line) => sum + lineTotal(line), 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!invoiceNumber.trim()) {
      setError(t("invoiceRequired"))
      return
    }

    if (!supplierName.trim()) {
      setError(t("supplierRequired"))
      return
    }

    const validLines = lines.filter((l) => l.productId && parseFloat(l.quantity) > 0)
    if (validLines.length === 0) {
      setError(t("itemsRequired"))
      return
    }

    setSaving(true)

    try {
      const url = isEdit ? `/api/purchases/${purchase.id}` : "/api/purchases"
      const method = isEdit ? "PATCH" : "POST"
      const body = JSON.stringify({
        invoiceNumber: invoiceNumber.trim(),
        supplierId: supplierId || null,
        supplierName: supplierName.trim(),
        notes: notes || null,
        status,
        items: validLines.map((line) => ({
          productId: line.productId,
          productName: line.productName,
          productUnitId: line.productUnitId || null,
          unitName: line.unitName,
          unitConversionFactor: parseFloat(line.unitConversionFactor) || 1,
          quantity: parseInt(line.quantity) || 1,
          costPrice: parseFloat(line.costPrice) || 0,
        })),
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

  const filteredProducts = products.filter(
    (p) =>
      !productSearch ||
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.barcode && p.barcode.includes(productSearch)) ||
      (p.sku && p.sku.toLowerCase().includes(productSearch.toLowerCase()))
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("edit") : t("add")}</DialogTitle>
          <DialogDescription>
            {isEdit ? t("editDescription") : t("addDescription")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="p-invoice">
                  {t("invoiceNumber")} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="p-invoice"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder={t("invoicePlaceholder")}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-status">{common("status")}</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">
                      <Badge variant="warning">{common("pending")}</Badge>
                    </SelectItem>
                    <SelectItem value="COMPLETED">
                      <Badge variant="success">{common("completed")}</Badge>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="p-supplier">
                  {t("supplier")} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="p-supplier"
                  value={supplierName}
                  onChange={(e) => {
                    setSupplierName(e.target.value)
                    if (e.target.value !== supplierName) setSupplierId("")
                  }}
                  placeholder={t("supplierPlaceholder")}
                  required
                  list="supplier-list"
                />
                <datalist id="supplier-list">
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.name} />
                  ))}
                </datalist>
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-notes">{t("notes")}</Label>
                <Textarea
                  id="p-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t("notesPlaceholder")}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>{t("items")}</Label>
                <Button type="button" variant="outline" size="sm" onClick={addLine}>
                  <Plus className="mr-1 h-3 w-3" />
                  {t("addItem")}
                </Button>
              </div>

              {lines.map((line, idx) => {
                const units = productUnits[line.productId] || []
                return (
                  <div key={line.key} className="rounded-md border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        {t("item")} {idx + 1}
                      </span>
                      {lines.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeLine(line.key)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-6 gap-2">
                      <div className="col-span-2 space-y-1">
                        <Label className="text-xs">{t("product")}</Label>
                        <Select
                          value={line.productId}
                          onValueChange={(v) => updateLine(line.key, "productId", v)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder={t("selectProduct")} />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredProducts.map((p) => (
                              <SelectItem key={p.id} value={p.id} className="text-xs">
                                {p.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">{t("unit")}</Label>
                        <Select
                          value={line.productUnitId}
                          onValueChange={(v) => updateLine(line.key, "productUnitId", v)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder={t("selectUnit")} />
                          </SelectTrigger>
                          <SelectContent>
                            {units.length === 0 && (
                              <SelectItem value="default" className="text-xs">
                                {t("defaultUnit")}
                              </SelectItem>
                            )}
                            {units.map((u) => (
                              <SelectItem key={u.id} value={u.id} className="text-xs">
                                {u.name} (×{u.conversionFactor})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">{t("qty")}</Label>
                        <Input
                          type="number"
                          min="1"
                          step="1"
                          value={line.quantity}
                          onChange={(e) => updateLine(line.key, "quantity", e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">{t("costPrice")}</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.costPrice}
                          onChange={(e) => updateLine(line.key, "costPrice", e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>

                      <div className="space-y-1 flex flex-col items-end justify-end">
                        <Label className="text-xs text-muted-foreground">
                          {t("lineTotal")}
                        </Label>
                        <span className="text-sm font-medium">
                          ${lineTotal(line).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex justify-end items-center gap-2 border-t pt-3">
              <span className="text-sm text-muted-foreground">{t("grandTotal")}:</span>
              <span className="text-lg font-bold">${grandTotal.toFixed(2)}</span>
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
