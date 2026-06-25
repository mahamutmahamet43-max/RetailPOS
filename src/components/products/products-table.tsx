"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import {
  Pencil,
  Trash2,
  Plus,
  Search,
  Package,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
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
import { ProductDialog } from "./product-dialog"
import { DeleteProductDialog } from "./delete-product-dialog"

export interface CategoryInfo {
  id: string
  name: string
}

export interface Product {
  id: string
  barcode: string | null
  sku: string | null
  name: string
  description: string | null
  image: string | null
  costPrice: number | null
  sellingPrice: number
  stockQuantity: number
  minimumStock: number
  brand: string | null
  unit: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  storeId: string
  categoryId: string
  category: CategoryInfo
}

interface ProductsResponse {
  products: Product[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export function ProductsTable() {
  const t = useTranslations("products")
  const common = useTranslations("common")

  const [data, setData] = React.useState<ProductsResponse | null>(null)
  const [search, setSearch] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [loading, setLoading] = React.useState(true)
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null)
  const [editOpen, setEditOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [createOpen, setCreateOpen] = React.useState(false)

  const fetchProducts = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      params.set("page", String(page))
      params.set("limit", "10")

      const res = await fetch(`/api/products?${params}`)
      if (res.ok) {
        const data: ProductsResponse = await res.json()
        setData(data)
      }
    } catch {
      console.error("Failed to fetch products")
    } finally {
      setLoading(false)
    }
  }, [search, page])

  React.useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  React.useEffect(() => {
    setPage(1)
  }, [search])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t("add")}
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("name")}</TableHead>
              <TableHead>{t("barcode")}</TableHead>
              <TableHead>{t("sku")}</TableHead>
              <TableHead>{t("category")}</TableHead>
              <TableHead>{t("brand")}</TableHead>
              <TableHead>{t("unit")}</TableHead>
              <TableHead className="text-right">{t("costPrice")}</TableHead>
              <TableHead className="text-right">{t("sellingPrice")}</TableHead>
              <TableHead className="text-right">{t("stockQuantity")}</TableHead>
              <TableHead>{common("status")}</TableHead>
              <TableHead className="w-[100px]">{common("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                  {common("loading")}
                </TableCell>
              </TableRow>
            ) : !data || data.products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>{t("noProducts")}</p>
                  <Button variant="link" onClick={() => setCreateOpen(true)}>
                    {t("addFirst")}
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              data.products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium max-w-[150px] truncate">
                    <div className="flex items-center gap-2">
                      {product.image && (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-8 w-8 rounded object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none"
                          }}
                        />
                      )}
                      {product.name}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {product.barcode || "-"}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {product.sku || "-"}
                  </TableCell>
                  <TableCell>{product.category.name}</TableCell>
                  <TableCell>{product.brand || "-"}</TableCell>
                  <TableCell>{product.unit || "-"}</TableCell>
                  <TableCell className="text-right">
                    {product.costPrice !== null
                      ? `$${product.costPrice.toFixed(2)}`
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${product.sellingPrice.toFixed(2)}
                  </TableCell>
                  <TableCell
                    className={`text-right ${
                      product.minimumStock > 0 &&
                      product.stockQuantity <= product.minimumStock
                        ? "text-destructive font-medium"
                        : ""
                    }`}
                  >
                    {product.stockQuantity}
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.isActive ? "success" : "secondary"}>
                      {product.isActive
                        ? common("active")
                        : common("inactive")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
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
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedProduct(product)
                          setDeleteOpen(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
            {t("showing", {
              from: (data.page - 1) * data.limit + 1,
              to: Math.min(data.page * data.limit, data.total),
              total: data.total,
            })}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              {common("previous")}
            </Button>
            <span className="text-sm text-muted-foreground">
              {t("pagination", { page, totalPages: data.totalPages })}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
              disabled={page >= data.totalPages}
            >
              {common("next")}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <ProductDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={fetchProducts}
      />

      <ProductDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        product={selectedProduct}
        onSuccess={fetchProducts}
      />

      <DeleteProductDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        product={selectedProduct}
        onSuccess={fetchProducts}
      />
    </div>
  )
}
