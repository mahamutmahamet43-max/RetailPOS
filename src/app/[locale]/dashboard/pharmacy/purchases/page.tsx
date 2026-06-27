"use client"

import * as React from "react"
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PharmacyLayout } from "@/components/pharmacy/pharmacy-layout"

interface Purchase {
  id: string
  purchaseNumber: string
  supplierName: string
  supplierId: string | null
  purchaseDate: string
  totalAmount: number
  status: string
  items: { id: string; quantity: number; unitCost: number; productId: string; product: { name: string } }[]
}

interface PurchasesResponse {
  purchases: Purchase[]
  total: number
  page: number
  limit: number
  totalPages: number
}

interface LineItem {
  productId: string
  quantity: number
  unitCost: number
}

export default function PurchasesPage() {
  const [data, setData] = React.useState<PurchasesResponse | null>(null)
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [page, setPage] = React.useState(1)
  const [loading, setLoading] = React.useState(true)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState("")

  const [supplierName, setSupplierName] = React.useState("")
  const [products, setProducts] = React.useState<{ id: string; name: string }[]>([])
  const [lineItems, setLineItems] = React.useState<LineItem[]>([
    { productId: "", quantity: 1, unitCost: 0 },
  ])

  const totalAmount = lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitCost,
    0
  )

  const fetchPurchases = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.set("status", statusFilter)
      params.set("page", String(page))
      params.set("limit", "10")

      const res = await fetch(`/api/pharmacy/purchases?${params}`)
      if (res.ok) {
        const d: PurchasesResponse = await res.json()
        setData(d)
      }
    } catch {
      console.error("Failed to fetch purchases")
    } finally {
      setLoading(false)
    }
  }, [statusFilter, page])

  const fetchProducts = React.useCallback(async () => {
    try {
      const res = await fetch("/api/products?limit=200")
      if (res.ok) {
        const d = await res.json()
        setProducts(d.products || [])
      }
    } catch {}
  }, [])

  React.useEffect(() => {
    fetchPurchases()
  }, [fetchPurchases])

  React.useEffect(() => {
    setPage(1)
  }, [statusFilter])

  function resetForm() {
    setSupplierName("")
    setLineItems([{ productId: "", quantity: 1, unitCost: 0 }])
    setError("")
  }

  function addLineItem() {
    setLineItems([...lineItems, { productId: "", quantity: 1, unitCost: 0 }])
  }

  function updateLineItem(index: number, field: keyof LineItem, value: string | number) {
    const items = [...lineItems]
    items[index] = { ...items[index], [field]: value }
    setLineItems(items)
  }

  function removeLineItem(index: number) {
    if (lineItems.length <= 1) return
    setLineItems(lineItems.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!supplierName.trim()) {
      setError("Supplier name is required")
      return
    }

    const validItems = lineItems.filter((item) => item.productId)
    if (validItems.length === 0) {
      setError("At least one product line item is required")
      return
    }

    setSaving(true)
    try {
      const body = JSON.stringify({
        supplierName: supplierName.trim(),
        items: validItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitCost: item.unitCost,
        })),
      })

      const res = await fetch("/api/pharmacy/purchases", {
        method: "POST",
        body,
        headers: { "Content-Type": "application/json" },
      })

      if (!res.ok) {
        const d = await res.json()
        setError(d.error || "Something went wrong")
        return
      }

      fetchPurchases()
      setDialogOpen(false)
    } catch {
      setError("Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  const statusVariant = (status: string) => {
    switch (status) {
      case "completed": return "success" as const
      case "pending": return "warning" as const
      case "cancelled": return "destructive" as const
      default: return "secondary" as const
    }
  }

  return (
    <PharmacyLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purchase Orders</h1>
          <p className="text-muted-foreground">Manage pharmacy purchase orders</p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => { resetForm(); setDialogOpen(true) }}>
              <Plus className="mr-2 h-4 w-4" />
              New Purchase Order
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Purchase #</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : !data || data.purchases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No purchases found</p>
                      <Button variant="link" onClick={() => { resetForm(); setDialogOpen(true) }}>
                        Create your first purchase order
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.purchases.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell className="font-mono text-sm font-medium">
                        {purchase.purchaseNumber}
                      </TableCell>
                      <TableCell>{purchase.supplierName}</TableCell>
                      <TableCell>
                        {new Date(purchase.purchaseDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {purchase.items?.length || 0}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${purchase.totalAmount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(purchase.status)}>
                          {purchase.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(data.page - 1) * data.limit + 1} to{" "}
                {Math.min(data.page * data.limit, data.total)} of {data.total}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {data.page} of {data.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page >= data.totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New Purchase Order</DialogTitle>
              <DialogDescription>
                Create a purchase order with multiple line items
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="po-supplier">
                    Supplier Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="po-supplier"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    placeholder="Supplier name"
                    required
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Line Items</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Item
                    </Button>
                  </div>

                  {lineItems.map((item, index) => (
                    <div key={index} className="flex items-end gap-2 border rounded-md p-3">
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs">Product</Label>
                        <Select
                          value={item.productId}
                          onValueChange={(v) => updateLineItem(index, "productId", v)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-20 space-y-1">
                        <Label className="text-xs">Qty</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            updateLineItem(index, "quantity", parseInt(e.target.value) || 1)
                          }
                        />
                      </div>
                      <div className="w-24 space-y-1">
                        <Label className="text-xs">Unit Cost</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unitCost}
                          onChange={(e) =>
                            updateLineItem(index, "unitCost", parseFloat(e.target.value) || 0)
                          }
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLineItem(index)}
                        disabled={lineItems.length <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="text-right text-lg font-semibold">
                  Total: ${totalAmount.toFixed(2)}
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Creating..." : "Create Purchase Order"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </PharmacyLayout>
  )
}
