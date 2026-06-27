"use client"

import * as React from "react"
import { Plus, Pencil, Trash2 } from "lucide-react"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"

interface Batch {
  id: string
  batchNumber: string
  expiryDate: string
  quantity: number
  purchasePrice: number | null
  sellingPrice: number | null
  productId: string
  createdAt: string
}

function getExpiryStatus(expiryDate: string) {
  const now = new Date()
  const expiry = new Date(expiryDate)
  const diffMs = expiry.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return { label: "Expired", variant: "destructive" as const }
  if (diffDays <= 30) return { label: "Expiring Soon", variant: "warning" as const }
  return { label: "Valid", variant: "success" as const }
}

interface BatchManagerProps {
  productId: string
}

export function BatchManager({ productId }: BatchManagerProps) {
  const [batches, setBatches] = React.useState<Batch[]>([])
  const [loading, setLoading] = React.useState(true)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingBatch, setEditingBatch] = React.useState<Batch | null>(null)
  const [batchNumber, setBatchNumber] = React.useState("")
  const [expiryDate, setExpiryDate] = React.useState("")
  const [quantity, setQuantity] = React.useState("0")
  const [purchasePrice, setPurchasePrice] = React.useState("")
  const [sellingPrice, setSellingPrice] = React.useState("")
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState("")

  const fetchBatches = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/pharmacy/batches?productId=${productId}`)
      if (res.ok) {
        const data = await res.json()
        setBatches(data.batches || data || [])
      }
    } catch {
      console.error("Failed to fetch batches")
    } finally {
      setLoading(false)
    }
  }, [productId])

  React.useEffect(() => {
    fetchBatches()
  }, [fetchBatches])

  function resetForm() {
    setBatchNumber("")
    setExpiryDate("")
    setQuantity("0")
    setPurchasePrice("")
    setSellingPrice("")
    setError("")
    setEditingBatch(null)
  }

  function openCreate() {
    resetForm()
    setDialogOpen(true)
  }

  function openEdit(batch: Batch) {
    setEditingBatch(batch)
    setBatchNumber(batch.batchNumber)
    setExpiryDate(batch.expiryDate.split("T")[0])
    setQuantity(String(batch.quantity))
    setPurchasePrice(batch.purchasePrice != null ? String(batch.purchasePrice) : "")
    setSellingPrice(batch.sellingPrice != null ? String(batch.sellingPrice) : "")
    setError("")
    setDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!batchNumber.trim()) {
      setError("Batch number is required")
      return
    }
    if (!expiryDate) {
      setError("Expiry date is required")
      return
    }

    setSaving(true)
    try {
      const url = editingBatch
        ? `/api/pharmacy/batches/${editingBatch.id}`
        : "/api/pharmacy/batches"
      const method = editingBatch ? "PATCH" : "POST"
      const body = JSON.stringify({
        productId,
        batchNumber: batchNumber.trim(),
        expiryDate,
        quantity: parseInt(quantity) || 0,
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null,
        sellingPrice: sellingPrice ? parseFloat(sellingPrice) : null,
      })

      const res = await fetch(url, { method, body, headers: { "Content-Type": "application/json" } })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Something went wrong")
        return
      }

      fetchBatches()
      setDialogOpen(false)
    } catch {
      setError("Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(batchId: string) {
    if (!confirm("Are you sure you want to delete this batch?")) return
    try {
      const res = await fetch(`/api/pharmacy/batches/${batchId}`, { method: "DELETE" })
      if (res.ok) fetchBatches()
    } catch {
      console.error("Failed to delete batch")
    }
  }

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Batches</h3>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" />
          Add Batch
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Batch #</TableHead>
              <TableHead>Expiry Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Purchase Price</TableHead>
              <TableHead className="text-right">Selling Price</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {batches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                  No batches found
                </TableCell>
              </TableRow>
            ) : (
              batches.map((batch) => {
                const status = getExpiryStatus(batch.expiryDate)
                return (
                  <TableRow key={batch.id}>
                    <TableCell className="font-mono text-sm">{batch.batchNumber}</TableCell>
                    <TableCell>{new Date(batch.expiryDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{batch.quantity}</TableCell>
                    <TableCell className="text-right">
                      {batch.purchasePrice != null ? `$${batch.purchasePrice.toFixed(2)}` : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {batch.sellingPrice != null ? `$${batch.sellingPrice.toFixed(2)}` : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(batch)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(batch.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBatch ? "Edit Batch" : "Add Batch"}</DialogTitle>
            <DialogDescription>
              {editingBatch ? "Update batch details" : "Create a new batch"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="b-batch">
                  Batch Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="b-batch"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  placeholder="Batch #"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="b-expiry">
                  Expiry Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="b-expiry"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="b-qty">Quantity</Label>
                  <Input
                    id="b-qty"
                    type="number"
                    min="0"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="b-pp">Purchase Price</Label>
                  <Input
                    id="b-pp"
                    type="number"
                    step="0.01"
                    min="0"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="b-sp">Selling Price</Label>
                  <Input
                    id="b-sp"
                    type="number"
                    step="0.01"
                    min="0"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
