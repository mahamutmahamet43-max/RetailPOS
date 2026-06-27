"use client"

import * as React from "react"
import { Search, ChevronLeft, ChevronRight, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { PharmacyLayout } from "@/components/pharmacy/pharmacy-layout"

interface Batch {
  id: string
  batchNumber: string
  expiryDate: string
  quantity: number
  purchasePrice: number | null
  sellingPrice: number | null
  productId: string
  product: { name: string }
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

interface BatchResponse {
  batches: Batch[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function BatchesPage() {
  const [data, setData] = React.useState<BatchResponse | null>(null)
  const [products, setProducts] = React.useState<{ id: string; name: string }[]>([])
  const [search, setSearch] = React.useState("")
  const [productFilter, setProductFilter] = React.useState("all")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [page, setPage] = React.useState(1)
  const [loading, setLoading] = React.useState(true)

  const fetchBatches = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (productFilter !== "all") params.set("productId", productFilter)
      if (statusFilter !== "all") params.set("status", statusFilter)
      params.set("page", String(page))
      params.set("limit", "10")

      const res = await fetch(`/api/pharmacy/batches?${params}`)
      if (res.ok) {
        const d: BatchResponse = await res.json()
        setData(d)
      }
    } catch {
      console.error("Failed to fetch batches")
    } finally {
      setLoading(false)
    }
  }, [search, productFilter, statusFilter, page])

  React.useEffect(() => {
    fetchBatches()
  }, [fetchBatches])

  React.useEffect(() => {
    setPage(1)
  }, [search, productFilter, statusFilter])

  React.useEffect(() => {
    fetch("/api/products?limit=100")
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []))
      .catch(() => {})
  }, [])

  return (
    <PharmacyLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Batches</h1>
          <p className="text-muted-foreground">Manage medicine batches</p>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by batch # or product name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={productFilter} onValueChange={setProductFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Products" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="valid">Valid</SelectItem>
                <SelectItem value="expiring">Expiring Soon</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Batch #</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Price</TableHead>
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
                ) : !data || data.batches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No batches found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.batches.map((batch) => {
                    const status = getExpiryStatus(batch.expiryDate)
                    return (
                      <TableRow key={batch.id}>
                        <TableCell className="font-medium">
                          {batch.product?.name || "Unknown"}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{batch.batchNumber}</TableCell>
                        <TableCell>
                          {new Date(batch.expiryDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">{batch.quantity}</TableCell>
                        <TableCell className="text-right">
                          {batch.sellingPrice != null
                            ? `$${batch.sellingPrice.toFixed(2)}`
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })
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
      </div>
    </PharmacyLayout>
  )
}
