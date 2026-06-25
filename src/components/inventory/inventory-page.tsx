"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import {
  Package,
  AlertTriangle,
  XCircle,
  DollarSign,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowDown,
  ArrowUp,
  RotateCcw,
  Eye,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"

interface TransactionProduct {
  id: string
  name: string
  sku: string | null
  barcode: string | null
  image: string | null
  stockQuantity: number
  minimumStock: number
  costPrice: number | null
  sellingPrice: number
  unit: string | null
}

interface TransactionCreator {
  id: string
  name: string | null
}

interface Transaction {
  id: string
  transactionType: "IN" | "OUT" | "ADJUSTMENT"
  quantity: number
  previousStock: number
  newStock: number
  reason: string
  reference: string | null
  createdAt: string
  product: TransactionProduct
  creator: TransactionCreator
}

interface FullProduct {
  id: string
  name: string
  sku: string | null
  barcode: string | null
  image: string | null
  stockQuantity: number
  minimumStock: number
  costPrice: number | null
  sellingPrice: number
  unit: string | null
}

interface TransactionsResponse {
  transactions: Transaction[]
  total: number
  page: number
  limit: number
  totalPages: number
}

interface SummaryData {
  totalProducts: number
  lowStockProducts: number
  outOfStockProducts: number
  totalInventoryValue: number
}

interface SimpleProduct {
  id: string
  name: string
  sku: string | null
  stockQuantity: number
}

export function InventoryPage() {
  const t = useTranslations("inventory")
  const common = useTranslations("common")

  const [summary, setSummary] = React.useState<SummaryData | null>(null)
  const [transactionsData, setTransactionsData] =
    React.useState<TransactionsResponse | null>(null)
  const [products, setProducts] = React.useState<SimpleProduct[]>([])
  const [loading, setLoading] = React.useState(true)

  const [search, setSearch] = React.useState("")
  const [typeFilter, setTypeFilter] = React.useState("")
  const [page, setPage] = React.useState(1)

  const [stockInOpen, setStockInOpen] = React.useState(false)
  const [stockOutOpen, setStockOutOpen] = React.useState(false)
  const [adjustmentOpen, setAdjustmentOpen] = React.useState(false)
  const [selectedProduct, setSelectedProduct] =
    React.useState<FullProduct | null>(null)
  const [productPanelOpen, setProductPanelOpen] = React.useState(false)
  const [productTransactions, setProductTransactions] = React.useState<
    Transaction[]
  >([])

  const fetchSummary = React.useCallback(async () => {
    try {
      const res = await fetch("/api/inventory/summary")
      if (res.ok) {
        const data: SummaryData = await res.json()
        setSummary(data)
      }
    } catch {
      console.error("Failed to fetch inventory summary")
    }
  }, [])

  const fetchTransactions = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (typeFilter) params.set("type", typeFilter)
      params.set("page", String(page))
      params.set("limit", "10")

      const res = await fetch(`/api/inventory?${params}`)
      if (res.ok) {
        const data: TransactionsResponse = await res.json()
        setTransactionsData(data)
      }
    } catch {
      console.error("Failed to fetch transactions")
    } finally {
      setLoading(false)
    }
  }, [search, typeFilter, page])

  const fetchProducts = React.useCallback(async () => {
    try {
      const res = await fetch("/api/products?limit=1000")
      if (res.ok) {
        const data = await res.json()
        setProducts(data.products || [])
      }
    } catch {
      console.error("Failed to fetch products")
    }
  }, [])

  React.useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  React.useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  React.useEffect(() => {
    setPage(1)
  }, [search, typeFilter])

  function refetchAll() {
    fetchSummary()
    fetchTransactions()
    fetchProducts()
  }

  React.useEffect(() => {
    if (stockInOpen || stockOutOpen || adjustmentOpen) {
      fetchProducts()
    }
  }, [stockInOpen, stockOutOpen, adjustmentOpen, fetchProducts])

  async function openProductPanel(productId: string) {
    try {
      const res = await fetch(`/api/products/${productId}`)
      if (res.ok) {
        const product = await res.json()
        const productInfo: FullProduct = {
          id: product.id,
          name: product.name,
          sku: product.sku,
          barcode: product.barcode,
          image: product.image,
          stockQuantity: product.stockQuantity,
          minimumStock: product.minimumStock,
          costPrice: product.costPrice,
          sellingPrice: product.sellingPrice,
          unit: product.unit,
        }
        setSelectedProduct(productInfo)

        const txRes = await fetch(
          `/api/inventory?search=${encodeURIComponent(product.name)}&limit=5`
        )
        if (txRes.ok) {
          const txData: TransactionsResponse = await txRes.json()
          setProductTransactions(txData.transactions)
        }
      }

      setProductPanelOpen(true)
    } catch {
      console.error("Failed to load product details")
    }
  }

  const typeBadge = (type: string) => {
    switch (type) {
      case "IN":
        return (
          <Badge
            variant="success"
            className="flex items-center gap-1 whitespace-nowrap"
          >
            <ArrowDown className="h-3 w-3" />
            {t("typeIn")}
          </Badge>
        )
      case "OUT":
        return (
          <Badge
            variant="warning"
            className="flex items-center gap-1 whitespace-nowrap"
          >
            <ArrowUp className="h-3 w-3" />
            {t("typeOut")}
          </Badge>
        )
      case "ADJUSTMENT":
        return (
          <Badge
            variant="secondary"
            className="flex items-center gap-1 whitespace-nowrap"
          >
            <RotateCcw className="h-3 w-3" />
            {t("typeAdjustment")}
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("totalProducts")}
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {summary !== null ? (
              <div className="text-2xl font-bold">
                {summary.totalProducts}
              </div>
            ) : (
              <Skeleton className="h-8 w-16" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("lowStock")}
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            {summary !== null ? (
              <div className="text-2xl font-bold text-amber-500">
                {summary.lowStockProducts}
              </div>
            ) : (
              <Skeleton className="h-8 w-16" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("outOfStock")}
            </CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {summary !== null ? (
              <div className="text-2xl font-bold text-destructive">
                {summary.outOfStockProducts}
              </div>
            ) : (
              <Skeleton className="h-8 w-16" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("inventoryValue")}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {summary !== null ? (
              <div className="text-2xl font-bold">
                ${summary.totalInventoryValue.toFixed(2)}
              </div>
            ) : (
              <Skeleton className="h-8 w-20" />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder={t("allTypes")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{t("allTypes")}</SelectItem>
            <SelectItem value="IN">{t("typeIn")}</SelectItem>
            <SelectItem value="OUT">{t("typeOut")}</SelectItem>
            <SelectItem value="ADJUSTMENT">{t("typeAdjustment")}</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setStockInOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t("stockIn")}
        </Button>
        <Button variant="outline" onClick={() => setStockOutOpen(true)}>
          <ArrowUp className="mr-2 h-4 w-4" />
          {t("stockOut")}
        </Button>
        <Button variant="secondary" onClick={() => setAdjustmentOpen(true)}>
          <RotateCcw className="mr-2 h-4 w-4" />
          {t("adjustment")}
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("date")}</TableHead>
              <TableHead>{t("product")}</TableHead>
              <TableHead>{t("type")}</TableHead>
              <TableHead className="text-right">{t("quantity")}</TableHead>
              <TableHead className="text-right">{t("previousStock")}</TableHead>
              <TableHead className="text-right">{t("newStock")}</TableHead>
              <TableHead>{t("user")}</TableHead>
              <TableHead>{t("reason")}</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center py-8 text-muted-foreground"
                >
                  {common("loading")}
                </TableCell>
              </TableRow>
            ) : !transactionsData ||
              transactionsData.transactions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center py-8 text-muted-foreground"
                >
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>{t("noTransactions")}</p>
                </TableCell>
              </TableRow>
            ) : (
              transactionsData.transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="text-xs whitespace-nowrap">
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="max-w-[150px] truncate font-medium">
                    {tx.product.name}
                  </TableCell>
                  <TableCell>{typeBadge(tx.transactionType)}</TableCell>
                  <TableCell className="text-right font-mono">
                    {tx.transactionType === "ADJUSTMENT"
                      ? "-"
                      : tx.quantity}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {tx.previousStock}
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    {tx.newStock}
                  </TableCell>
                  <TableCell className="max-w-[100px] truncate">
                    {tx.creator.name || "—"}
                  </TableCell>
                  <TableCell className="max-w-[150px] truncate text-muted-foreground">
                    {tx.reason}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openProductPanel(tx.product.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {transactionsData && transactionsData.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t("showing", {
              from: (transactionsData.page - 1) * transactionsData.limit + 1,
              to: Math.min(
                transactionsData.page * transactionsData.limit,
                transactionsData.total
              ),
              total: transactionsData.total,
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
              {t("pagination", {
                page,
                totalPages: transactionsData.totalPages,
              })}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setPage((p) =>
                  Math.min(transactionsData.totalPages, p + 1)
                )
              }
              disabled={page >= transactionsData.totalPages}
            >
              {common("next")}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <StockInDialog
        open={stockInOpen}
        onOpenChange={setStockInOpen}
        products={products}
        onSuccess={refetchAll}
      />

      <StockOutDialog
        open={stockOutOpen}
        onOpenChange={setStockOutOpen}
        products={products}
        onSuccess={refetchAll}
      />

      <AdjustmentDialog
        open={adjustmentOpen}
        onOpenChange={setAdjustmentOpen}
        products={products}
        onSuccess={refetchAll}
      />

      <Sheet open={productPanelOpen} onOpenChange={setProductPanelOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">{t("productDetails")}</h2>
          </div>
          {selectedProduct && (
            <div className="mt-6 space-y-6">
              <div>
                <h3 className="font-semibold text-lg">
                  {selectedProduct.name}
                </h3>
                {(selectedProduct.sku || selectedProduct.barcode) && (
                  <p className="text-sm text-muted-foreground">
                    {selectedProduct.sku && `SKU: ${selectedProduct.sku}`}
                    {selectedProduct.sku && selectedProduct.barcode && " | "}
                    {selectedProduct.barcode &&
                      `Barcode: ${selectedProduct.barcode}`}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    {t("currentStock")}
                  </p>
                  <p
                    className={`text-2xl font-bold ${
                      selectedProduct.stockQuantity === 0
                        ? "text-destructive"
                        : selectedProduct.minimumStock > 0 &&
                            selectedProduct.stockQuantity <=
                              selectedProduct.minimumStock
                          ? "text-amber-500"
                          : ""
                    }`}
                  >
                    {selectedProduct.stockQuantity}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    {t("minStock")}
                  </p>
                  <p className="text-2xl font-bold">
                    {selectedProduct.minimumStock}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    {t("inventoryValue")}
                  </p>
                  <p className="text-xl font-bold">
                    $
                    {(
                      (selectedProduct.costPrice || 0) *
                      selectedProduct.stockQuantity
                    ).toFixed(2)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    {t("sellingPrice")}
                  </p>
                  <p className="text-xl font-bold">
                    ${selectedProduct.sellingPrice.toFixed(2)}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">
                  {t("recentTransactions")}
                </h4>
                {productTransactions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {t("noTransactions")}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {productTransactions.slice(0, 5).map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between text-sm border-b pb-2"
                      >
                        <div className="flex items-center gap-2">
                          {typeBadge(tx.transactionType)}
                          <span className="text-xs text-muted-foreground">
                            {new Date(tx.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <span className="font-mono">
                          {tx.previousStock} → {tx.newStock}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function StockInDialog({
  open,
  onOpenChange,
  products,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  products: SimpleProduct[]
  onSuccess: () => void
}) {
  const t = useTranslations("inventory")
  const common = useTranslations("common")
  const [productId, setProductId] = React.useState("")
  const [quantity, setQuantity] = React.useState("1")
  const [reason, setReason] = React.useState("")
  const [reference, setReference] = React.useState("")
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState("")

  React.useEffect(() => {
    if (open) {
      setProductId("")
      setQuantity("1")
      setReason("")
      setReference("")
      setError("")
    }
  }, [open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!productId) {
      setError(t("productRequired"))
      return
    }
    const qty = parseInt(quantity)
    if (isNaN(qty) || qty <= 0) {
      setError(t("quantityPositive"))
      return
    }
    if (!reason.trim()) {
      setError(t("reasonRequired"))
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionType: "IN",
          productId,
          quantity: qty,
          reason: reason.trim(),
          reference: reference.trim() || null,
        }),
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("stockIn")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="si-product">
              {t("product")} <span className="text-destructive">*</span>
            </Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger>
                <SelectValue placeholder={t("selectProduct")} />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} ({p.stockQuantity})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="si-qty">
              {t("quantity")} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="si-qty"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="si-reason">
              {t("reason")} <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="si-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("reasonPlaceholder")}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="si-ref">{t("reference")}</Label>
            <Input
              id="si-ref"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder={t("referencePlaceholder")}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
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

function StockOutDialog({
  open,
  onOpenChange,
  products,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  products: SimpleProduct[]
  onSuccess: () => void
}) {
  const t = useTranslations("inventory")
  const common = useTranslations("common")
  const [productId, setProductId] = React.useState("")
  const [quantity, setQuantity] = React.useState("1")
  const [reason, setReason] = React.useState("")
  const [reference, setReference] = React.useState("")
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState("")

  const selectedProduct = products.find((p) => p.id === productId)

  React.useEffect(() => {
    if (open) {
      setProductId("")
      setQuantity("1")
      setReason("")
      setReference("")
      setError("")
    }
  }, [open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!productId) {
      setError(t("productRequired"))
      return
    }
    const qty = parseInt(quantity)
    if (isNaN(qty) || qty <= 0) {
      setError(t("quantityPositive"))
      return
    }
    if (selectedProduct && qty > selectedProduct.stockQuantity) {
      setError(t("insufficientStock"))
      return
    }
    if (!reason.trim()) {
      setError(t("reasonRequired"))
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionType: "OUT",
          productId,
          quantity: qty,
          reason: reason.trim(),
          reference: reference.trim() || null,
        }),
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("stockOut")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="so-product">
              {t("product")} <span className="text-destructive">*</span>
            </Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger>
                <SelectValue placeholder={t("selectProduct")} />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} ({p.stockQuantity})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedProduct && (
              <p className="text-xs text-muted-foreground">
                {t("currentStock")}: {selectedProduct.stockQuantity}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="so-qty">
              {t("quantity")} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="so-qty"
              type="number"
              min="1"
              max={selectedProduct?.stockQuantity || 1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="so-reason">
              {t("reason")} <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="so-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("reasonPlaceholder")}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="so-ref">{t("reference")}</Label>
            <Input
              id="so-ref"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder={t("referencePlaceholder")}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
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

function AdjustmentDialog({
  open,
  onOpenChange,
  products,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  products: SimpleProduct[]
  onSuccess: () => void
}) {
  const t = useTranslations("inventory")
  const common = useTranslations("common")
  const [productId, setProductId] = React.useState("")
  const [newStock, setNewStock] = React.useState("0")
  const [reason, setReason] = React.useState("")
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState("")

  const selectedProduct = products.find((p) => p.id === productId)

  React.useEffect(() => {
    if (open) {
      setProductId("")
      setNewStock("0")
      setReason("")
      setError("")
    }
  }, [open])

  React.useEffect(() => {
    if (selectedProduct) {
      setNewStock(String(selectedProduct.stockQuantity))
    }
  }, [selectedProduct])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!productId) {
      setError(t("productRequired"))
      return
    }
    const qty = parseInt(newStock)
    if (isNaN(qty) || qty < 0) {
      setError(t("newStockInvalid"))
      return
    }
    if (!reason.trim()) {
      setError(t("reasonRequired"))
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionType: "ADJUSTMENT",
          productId,
          quantity: qty,
          reason: reason.trim(),
        }),
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("adjustment")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ad-product">
              {t("product")} <span className="text-destructive">*</span>
            </Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger>
                <SelectValue placeholder={t("selectProduct")} />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} ({p.stockQuantity})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedProduct && (
              <p className="text-xs text-muted-foreground">
                {t("currentStock")}: {selectedProduct.stockQuantity}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="ad-newStock">
              {t("newStock")} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="ad-newStock"
              type="number"
              min="0"
              value={newStock}
              onChange={(e) => setNewStock(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ad-reason">
              {t("reason")} <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="ad-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("reasonPlaceholder")}
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
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
