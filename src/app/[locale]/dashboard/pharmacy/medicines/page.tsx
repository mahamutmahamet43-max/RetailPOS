"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { Search, Plus, Pencil, Package, ChevronLeft, ChevronRight } from "lucide-react"
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
import { PharmacyLayout } from "@/components/pharmacy/pharmacy-layout"
import { MedicineForm } from "@/components/pharmacy/medicine-form"

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
  category: { id: string; name: string }
  manufacturer: string | null
  genericName: string | null
  dosage: string | null
  strength: string | null
  form: string | null
  prescriptionRequired: boolean
  medicineCategory: string | null
}

interface ResponseData {
  products: MedicineProduct[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function PharmacyMedicinesPage() {
  const params = useParams()
  const locale = params.locale as string

  const [data, setData] = React.useState<ResponseData | null>(null)
  const [search, setSearch] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [loading, setLoading] = React.useState(true)
  const [selectedProduct, setSelectedProduct] = React.useState<MedicineProduct | null>(null)
  const [editOpen, setEditOpen] = React.useState(false)
  const [createOpen, setCreateOpen] = React.useState(false)

  const fetchMedicines = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      params.set("page", String(page))
      params.set("limit", "10")

      const res = await fetch(`/api/products?${params}`)
      if (res.ok) {
        const d: ResponseData = await res.json()
        setData(d)
      }
    } catch {
      console.error("Failed to fetch medicines")
    } finally {
      setLoading(false)
    }
  }, [search, page])

  React.useEffect(() => {
    fetchMedicines()
  }, [fetchMedicines])

  React.useEffect(() => {
    setPage(1)
  }, [search])

  return (
    <PharmacyLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Medicines</h1>
          <p className="text-muted-foreground">Manage pharmacy medicine products</p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, generic name, or barcode..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Medicine
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Generic Name</TableHead>
                  <TableHead>Form</TableHead>
                  <TableHead>Strength</TableHead>
                  <TableHead className="text-right">Stock Qty</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : !data || data.products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No medicines found</p>
                      <Button variant="link" onClick={() => setCreateOpen(true)}>
                        Add your first medicine
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium max-w-[150px] truncate">
                        {product.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {product.genericName || "-"}
                      </TableCell>
                      <TableCell>{product.form || "-"}</TableCell>
                      <TableCell>{product.strength || "-"}</TableCell>
                      <TableCell className="text-right">{product.stockQuantity}</TableCell>
                      <TableCell className="text-right font-medium">
                        ${product.sellingPrice.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.isActive ? "success" : "secondary"}>
                          {product.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedProduct(product)
                            setEditOpen(true)
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
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

        <MedicineForm
          open={createOpen}
          onOpenChange={setCreateOpen}
          onSuccess={fetchMedicines}
        />

        <MedicineForm
          open={editOpen}
          onOpenChange={setEditOpen}
          product={selectedProduct}
          onSuccess={fetchMedicines}
        />
      </div>
    </PharmacyLayout>
  )
}
