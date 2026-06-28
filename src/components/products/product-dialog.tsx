"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Plus, Trash2 } from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Product, CategoryInfo, ProductUnitInfo } from "./products-table"

interface UnitRow {
  key: string
  id?: string
  name: string
  conversionFactor: string
  sellingPrice: string
  barcode: string
  isBaseUnit: boolean
  isDefaultSaleUnit: boolean
}

interface ProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: Product | null
  onSuccess: () => void
}

function emptyUnit(): UnitRow {
  return {
    key: Math.random().toString(36).slice(2),
    name: "",
    conversionFactor: "1",
    sellingPrice: "",
    barcode: "",
    isBaseUnit: false,
    isDefaultSaleUnit: false,
  }
}

export function ProductDialog({
  open,
  onOpenChange,
  product,
  onSuccess,
}: ProductDialogProps) {
  const t = useTranslations("products")
  const common = useTranslations("common")
  const isEdit = !!product

  const [categories, setCategories] = React.useState<CategoryInfo[]>([])
  const [name, setName] = React.useState("")
  const [barcode, setBarcode] = React.useState("")
  const [sku, setSku] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [image, setImage] = React.useState("")
  const [costPrice, setCostPrice] = React.useState("")
  const [sellingPrice, setSellingPrice] = React.useState("")
  const [stockQuantity, setStockQuantity] = React.useState("0")
  const [minimumStock, setMinimumStock] = React.useState("0")
  const [brand, setBrand] = React.useState("")
  const [unit, setUnit] = React.useState("")
  const [expiryDate, setExpiryDate] = React.useState("")
  const [categoryId, setCategoryId] = React.useState("")
  const [isActive, setIsActive] = React.useState(true)
  const [units, setUnits] = React.useState<UnitRow[]>([])
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState("")

  React.useEffect(() => {
    if (open) {
      fetchCategories()
      setName(product?.name || "")
      setBarcode(product?.barcode || "")
      setSku(product?.sku || "")
      setDescription(product?.description || "")
      setImage(product?.image || "")
      setCostPrice(product?.costPrice !== null && product?.costPrice !== undefined ? String(product.costPrice) : "")
      setSellingPrice(product?.sellingPrice !== undefined ? String(product.sellingPrice) : "")
      setStockQuantity(product?.stockQuantity !== undefined ? String(product.stockQuantity) : "0")
      setMinimumStock(product?.minimumStock !== undefined ? String(product.minimumStock) : "0")
      setBrand(product?.brand || "")
      setUnit(product?.unit || "")
      setExpiryDate(product?.expiryDate ? product.expiryDate.split("T")[0] : "")
      setCategoryId(product?.categoryId || "")
      setIsActive(product?.isActive ?? true)
      setUnits(
        product?.units && product.units.length > 0
          ? product.units.map((u: ProductUnitInfo) => ({
              key: u.id,
              id: u.id,
              name: u.name,
              conversionFactor: String(u.conversionFactor),
              sellingPrice: u.sellingPrice ? String(u.sellingPrice) : "",
              barcode: u.barcode || "",
              isBaseUnit: u.isBaseUnit,
              isDefaultSaleUnit: u.isDefaultSaleUnit,
            }))
          : []
      )
      setError("")
    }
  }, [open, product])

  async function fetchCategories() {
    try {
      const res = await fetch("/api/categories")
      if (res.ok) {
        const data: CategoryInfo[] = await res.json()
        setCategories(data.filter((c) => c.name))
      }
    } catch {
      console.error("Failed to fetch categories")
    }
  }

  function addUnit() {
    setUnits((prev) => [...prev, emptyUnit()])
  }

  function removeUnit(key: string) {
    setUnits((prev) => prev.filter((u) => u.key !== key))
  }

  function updateUnit(key: string, field: keyof UnitRow, value: string | boolean) {
    setUnits((prev) =>
      prev.map((u) => (u.key === key ? { ...u, [field]: value } : u))
    )
  }

  function updateSellingPriceFromUnits() {
    const base = units.find((u) => u.isBaseUnit)
    if (base && base.sellingPrice) {
      setSellingPrice(base.sellingPrice)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!name.trim()) {
      setError(t("nameRequired"))
      return
    }

    if (!categoryId) {
      setError(t("categoryRequired"))
      return
    }

    const sellingPriceNum = parseFloat(sellingPrice)
    if (isNaN(sellingPriceNum) || sellingPriceNum <= 0) {
      setError(t("priceMustBePositive"))
      return
    }

    const hasBaseUnit = units.length === 0 || units.some((u) => u.isBaseUnit)
    if (units.length > 0 && !hasBaseUnit) {
      setError("At least one unit must be marked as the base unit")
      return
    }

    setSaving(true)

    try {
      const url = isEdit ? `/api/products/${product.id}` : "/api/products"
      const method = isEdit ? "PATCH" : "POST"
      const body = JSON.stringify({
        name: name.trim(),
        barcode: barcode || null,
        sku: sku || null,
        description: description || null,
        image: image || null,
        costPrice: costPrice ? parseFloat(costPrice) : null,
        sellingPrice: sellingPriceNum,
        stockQuantity: parseInt(stockQuantity) || 0,
        minimumStock: parseInt(minimumStock) || 0,
        brand: brand || null,
        unit: unit || null,
        expiryDate: expiryDate || null,
        categoryId,
        isActive,
        units: units.map((u) => ({
          id: u.id || undefined,
          name: u.name,
          conversionFactor: parseFloat(u.conversionFactor) || 1,
          sellingPrice: u.sellingPrice ? parseFloat(u.sellingPrice) : undefined,
          barcode: u.barcode || null,
          isBaseUnit: u.isBaseUnit,
          isDefaultSaleUnit: u.isDefaultSaleUnit,
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
                <Label htmlFor="p-name">
                  {t("name")} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="p-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("namePlaceholder")}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-category">
                  {t("category")} <span className="text-destructive">*</span>
                </Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectCategory")} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="p-barcode">{t("barcode")}</Label>
                <Input
                  id="p-barcode"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder={t("barcodePlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-sku">{t("sku")}</Label>
                <Input
                  id="p-sku"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder={t("skuPlaceholder")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="p-description">{t("description")}</Label>
              <Textarea
                id="p-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("descriptionPlaceholder")}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="p-brand">{t("brand")}</Label>
                <Input
                  id="p-brand"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder={t("brandPlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-unit">{t("unit")}</Label>
                <Input
                  id="p-unit"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder={t("unitPlaceholder")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-expiry">Expiry Date</Label>
                <Input
                  id="p-expiry"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="p-cost-price">{t("costPrice")}</Label>
                <Input
                  id="p-cost-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-selling-price">
                  {t("sellingPrice")} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="p-selling-price"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="p-stock">{t("stockQuantity")}</Label>
                <Input
                  id="p-stock"
                  type="number"
                  min="0"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-min-stock">{t("minimumStock")}</Label>
                <Input
                  id="p-min-stock"
                  type="number"
                  min="0"
                  value={minimumStock}
                  onChange={(e) => setMinimumStock(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="p-image">{t("image")}</Label>
              <Input
                id="p-image"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder={t("imagePlaceholder")}
              />
              {image && (
                <img
                  src={image}
                  alt="Preview"
                  className="h-16 w-16 rounded object-cover mt-1"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none"
                  }}
                />
              )}
            </div>

            <div className="space-y-3 border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Units / Packaging</Label>
                <Button type="button" variant="outline" size="sm" onClick={addUnit}>
                  <Plus className="mr-1 h-3 w-3" />
                  Add Unit
                </Button>
              </div>
              {units.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No units defined. The product will use the default unit above.
                </p>
              )}
              {units.map((u, idx) => (
                <div key={u.key} className="rounded-md border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      Unit {idx + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeUnit(u.key)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Name</Label>
                      <Input
                        value={u.name}
                        onChange={(e) => updateUnit(u.key, "name", e.target.value)}
                        placeholder="e.g. Tablet"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Conversion Factor</Label>
                      <Input
                        type="number"
                        min="0.01"
                        step="any"
                        value={u.conversionFactor}
                        onChange={(e) => updateUnit(u.key, "conversionFactor", e.target.value)}
                        placeholder="1"
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Selling Price</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={u.sellingPrice}
                        onChange={(e) => updateUnit(u.key, "sellingPrice", e.target.value)}
                        placeholder="0.00"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Barcode</Label>
                      <Input
                        value={u.barcode}
                        onChange={(e) => updateUnit(u.key, "barcode", e.target.value)}
                        placeholder="Optional"
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-1 text-xs">
                      <input
                        type="checkbox"
                        checked={u.isBaseUnit}
                        onChange={(e) => {
                          const checked = e.target.checked
                          setUnits((prev) =>
                            prev.map((pu) =>
                              pu.key === u.key
                                ? { ...pu, isBaseUnit: checked, isDefaultSaleUnit: checked ? true : pu.isDefaultSaleUnit }
                                : checked ? { ...pu, isBaseUnit: false } : pu
                            )
                          )
                          if (checked && u.sellingPrice) {
                            setSellingPrice(u.sellingPrice)
                          }
                        }}
                        className="h-3 w-3"
                      />
                      Base Unit
                    </label>
                    <label className="flex items-center gap-1 text-xs">
                      <input
                        type="checkbox"
                        checked={u.isDefaultSaleUnit}
                        onChange={(e) => updateUnit(u.key, "isDefaultSaleUnit", e.target.checked)}
                        className="h-3 w-3"
                      />
                      Default Sale Unit
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="p-isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="p-isActive">{common("active")}</Label>
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
