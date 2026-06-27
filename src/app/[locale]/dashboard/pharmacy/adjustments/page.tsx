"use client"

import * as React from "react"
import { Plus, ChevronLeft, ChevronRight, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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

const ADJUSTMENT_REASONS = [
  "Damaged",
  "Expired",
  "Stolen",
  "Lost",
  "Correction",
  "Return to Supplier",
  "Other",
]

interface Adjustment {
  id: string
  productId: string
  product: { name: string }
  quantity: number
  reason: string
  notes: string | null
  createdAt: string
}

interface AdjustmentsResponse {
  adjustments: Adjustment[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function AdjustmentsPage() {
  const [data, setData] = React.useState<AdjustmentsResponse | null>(null)
  const [page, setPage] = React.useState(1)
  const [loading, setLoading] = React.useState(true)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState("")

  const [products, setProducts] = React.useState<{ id: string; name: string }[]>([])
  const [productId, setProductId] = React.useState("")
  const [quantity, setQuantity] = React.useState("0")
  const [reason, setReason] = React.useState("")
  const [notes, setNotes] = React.useState("")

  const fetchAdjustments = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", String(page))
      params.set("limit", "10")

      const res = await fetch(`/api/pharmacy/adjustments?${params}`)
      if (res.ok) {
        const d: AdjustmentsResponse = await res.json()
        setData(d)
      }
    } catch {
      console.error("Failed to fetch adjustments")
    } finally {
      setLoading(false)
    }
  }, [page])

  React.useEffect(() => {
    fetchAdjustments()
  }, [fetchAdjustments])

  React.useEffect(() => {
    setPage(1)
  }, [])

  React.useEffect(() => {
    fetch("/api/products?limit=200")
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []))
      .catch(() => {})
  }, [])

  function resetForm() {
    setProductId("")
    setQuantity("0")
    setReason("")
    setNotes("")
    setError("")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!productId) {
      setError("Please select a product")
      return
    }
    const qty = parseInt(quantity) || 0
    if (qty === 0) {
      setError("Quantity must be non-zero")
      return
    }
    if (!reason) {
      setError("Please select a reason")
      return
    }

    setSaving(true)
    try {
      const body = JSON.stringify({
        productId,
        quantity: qty,
        reason,
        notes: notes.trim() || null,
      })

      const res = await fetch("/api/pharmacy/adjustments", {
        method: "POST",
        body,
        headers: { "Content-Type": "application/json" },
      })

      if (!res.ok) {
        const d = await res.json()
        setError(d.error || "Something went wrong")
        return
      }

      fetchAdjustments()
      setDialogOpen(false)
    } catch {
      setError("Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  return (
    <PharmacyLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stock Adjustments</h1>
          <p className="text-muted-foreground">Manage inventory adjustments</p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div />
            <Button onClick={() => { resetForm(); setDialogOpen(true) }}>
              <Plus className="mr-2 h-4 w-4" />
              New Adjustment
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : !data || data.adjustments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No adjustments found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.adjustments.map((adj) => (
                    <TableRow key={adj.id}>
                      <TableCell className="font-medium">{adj.product.name}</TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          adj.quantity < 0 ? "text-destructive" : "text-emerald-600"
                        }`}
                      >
                        {adj.quantity > 0 ? `+${adj.quantity}` : adj.quantity}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{adj.reason}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-muted-foreground">
                        {adj.notes || "-"}
                      </TableCell>
                      <TableCell>
                        {new Date(adj.createdAt).toLocaleDateString()}
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
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>New Stock Adjustment</DialogTitle>
              <DialogDescription>Adjust inventory quantity for a product</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="adj-product">
                    Product <span className="text-destructive">*</span>
                  </Label>
                  <Select value={productId} onValueChange={setProductId}>
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="adj-qty">
                      Quantity <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="adj-qty"
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="Use positive or negative"
                    />
                    <p className="text-xs text-muted-foreground">
                      Positive to add stock, negative to reduce
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="adj-reason">
                      Reason <span className="text-destructive">*</span>
                    </Label>
                    <Select value={reason} onValueChange={setReason}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select reason" />
                      </SelectTrigger>
                      <SelectContent>
                        {ADJUSTMENT_REASONS.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adj-notes">Notes</Label>
                  <Textarea
                    id="adj-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Additional notes..."
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save Adjustment"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </PharmacyLayout>
  )
}
