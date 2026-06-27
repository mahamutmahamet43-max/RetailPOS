"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
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

const MEDICINE_FORMS = [
  "Tablet",
  "Capsule",
  "Syrup",
  "Injection",
  "Cream",
  "Ointment",
  "Drops",
  "Inhaler",
  "Spray",
  "Suspension",
  "Powder",
  "Suppository",
  "Patch",
  "Solution",
]

const MEDICINE_CATEGORIES = [
  "Antibiotic",
  "Analgesic",
  "Antihistamine",
  "Antiviral",
  "Antifungal",
  "Anti-inflammatory",
  "Antidepressant",
  "Antipsychotic",
  "Antidiabetic",
  "Antihypertensive",
  "Anticoagulant",
  "Bronchodilator",
  "Diuretic",
  "Sedative",
  "Vitamin",
  "Supplement",
  "Other",
]

interface CategoryInfo {
  id: string
  name: string
}

interface MedicineProduct {
  id: string
  name: string
  barcode: string | null
  sku: string | null
  description: string | null
  image: string | null
  costPrice: number | null
  sellingPrice: number
  stockQuantity: number
  minimumStock: number
  brand: string | null
  unit: string | null
  isActive: boolean
  categoryId: string
  category: CategoryInfo
  manufacturer: string | null
  genericName: string | null
  dosage: string | null
  strength: string | null
  form: string | null
  prescriptionRequired: boolean
  medicineCategory: string | null
}

interface MedicineFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: MedicineProduct | null
  onSuccess: () => void
}

export function MedicineForm({
  open,
  onOpenChange,
  product,
  onSuccess,
}: MedicineFormProps) {
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
  const [categoryId, setCategoryId] = React.useState("")
  const [isActive, setIsActive] = React.useState(true)
  const [manufacturer, setManufacturer] = React.useState("")
  const [genericName, setGenericName] = React.useState("")
  const [dosage, setDosage] = React.useState("")
  const [strength, setStrength] = React.useState("")
  const [form, setForm] = React.useState("")
  const [prescriptionRequired, setPrescriptionRequired] = React.useState(false)
  const [medicineCategory, setMedicineCategory] = React.useState("")
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
      setCostPrice(product?.costPrice != null ? String(product.costPrice) : "")
      setSellingPrice(product?.sellingPrice != null ? String(product.sellingPrice) : "")
      setStockQuantity(product?.stockQuantity != null ? String(product.stockQuantity) : "0")
      setMinimumStock(product?.minimumStock != null ? String(product.minimumStock) : "0")
      setBrand(product?.brand || "")
      setUnit(product?.unit || "")
      setCategoryId(product?.categoryId || "")
      setIsActive(product?.isActive ?? true)
      setManufacturer(product?.manufacturer || "")
      setGenericName(product?.genericName || "")
      setDosage(product?.dosage || "")
      setStrength(product?.strength || "")
      setForm(product?.form || "")
      setPrescriptionRequired(product?.prescriptionRequired ?? false)
      setMedicineCategory(product?.medicineCategory || "")
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!name.trim()) {
      setError("Product name is required")
      return
    }

    if (!categoryId) {
      setError("Category is required")
      return
    }

    const sellingPriceNum = parseFloat(sellingPrice)
    if (isNaN(sellingPriceNum) || sellingPriceNum <= 0) {
      setError("Selling price must be a positive number")
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
        categoryId,
        isActive,
        manufacturer: manufacturer || null,
        genericName: genericName || null,
        dosage: dosage || null,
        strength: strength || null,
        form: form || null,
        prescriptionRequired,
        medicineCategory: medicineCategory || null,
      })

      const res = await fetch(url, {
        method,
        body,
        headers: { "Content-Type": "application/json" },
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Something went wrong")
        return
      }

      onSuccess()
      onOpenChange(false)
    } catch {
      setError("Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Medicine" : "Add Medicine"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update medicine product details" : "Create a new medicine product"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="m-name">
                  Product Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="m-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Medicine name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="m-category">
                  Category <span className="text-destructive">*</span>
                </Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
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
                <Label htmlFor="m-generic">Generic Name</Label>
                <Input
                  id="m-generic"
                  value={genericName}
                  onChange={(e) => setGenericName(e.target.value)}
                  placeholder="Paracetamol"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="m-manufacturer">Manufacturer</Label>
                <Input
                  id="m-manufacturer"
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                  placeholder="Manufacturer name"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="m-strength">Strength</Label>
                <Input
                  id="m-strength"
                  value={strength}
                  onChange={(e) => setStrength(e.target.value)}
                  placeholder="500mg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="m-dosage">Dosage</Label>
                <Input
                  id="m-dosage"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  placeholder="1-0-1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="m-form">Form</Label>
                <Select value={form} onValueChange={setForm}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select form" />
                  </SelectTrigger>
                  <SelectContent>
                    {MEDICINE_FORMS.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="m-med-cat">Medicine Category</Label>
                <Select value={medicineCategory} onValueChange={setMedicineCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select medicine category" />
                  </SelectTrigger>
                  <SelectContent>
                    {MEDICINE_CATEGORIES.map((mc) => (
                      <SelectItem key={mc} value={mc}>
                        {mc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="m-unit">Unit</Label>
                <Select value={unit || ""} onValueChange={setUnit}>
                  <SelectTrigger id="m-unit">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {["Piece","Tablet","Capsule","Bottle","Strip","Box","Pack","Tube","Sachet","Vial","Ampoule"].map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="m-barcode">Barcode</Label>
                <Input
                  id="m-barcode"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="Barcode"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="m-sku">SKU</Label>
                <Input
                  id="m-sku"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="SKU"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="m-description">Description</Label>
              <Textarea
                id="m-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description"
              />
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="m-cost-price">Cost Price</Label>
                <Input
                  id="m-cost-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="m-selling-price">
                  Selling Price <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="m-selling-price"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="m-stock">Stock Qty</Label>
                <Input
                  id="m-stock"
                  type="number"
                  min="0"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="m-min-stock">Min Stock</Label>
                <Input
                  id="m-min-stock"
                  type="number"
                  min="0"
                  value={minimumStock}
                  onChange={(e) => setMinimumStock(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="m-brand">Brand</Label>
              <Input
                id="m-brand"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Brand name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="m-image">Image URL</Label>
              <Input
                id="m-image"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://example.com/image.jpg"
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

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="m-isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="m-isActive">Active</Label>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="m-prescription">Prescription Required</Label>
                <Switch
                  id="m-prescription"
                  checked={prescriptionRequired}
                  onCheckedChange={setPrescriptionRequired}
                />
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
