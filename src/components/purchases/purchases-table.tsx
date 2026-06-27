"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Pencil, Trash2, Plus, Search, ClipboardList, ChevronLeft, ChevronRight } from "lucide-react"
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
import { PurchaseDialog } from "./purchase-dialog"
import { CancelPurchaseDialog } from "./cancel-purchase-dialog"

export interface PurchaseItem {
  id: string
  purchaseId: string
  productId: string
  productName: string
  productUnitId: string | null
  unitName: string
  unitConversionFactor: number
  quantity: number
  costPrice: number
}

export interface Purchase {
  id: string
  invoiceNumber: string
  supplierId: string | null
  supplierName: string
  notes: string | null
  total: number
  status: "PENDING" | "COMPLETED" | "CANCELLED"
  createdAt: string
  updatedAt: string
  storeId: string
  items: PurchaseItem[]
  supplier: { id: string; name: string } | null
}

interface PurchasesResponse {
  purchases: Purchase[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export function PurchasesTable() {
  const t = useTranslations("purchases")
  const common = useTranslations("common")

  const [data, setData] = React.useState<PurchasesResponse | null>(null)
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [loading, setLoading] = React.useState(true)
  const [selectedPurchase, setSelectedPurchase] = React.useState<Purchase | null>(null)
  const [editOpen, setEditOpen] = React.useState(false)
  const [cancelOpen, setCancelOpen] = React.useState(false)
  const [createOpen, setCreateOpen] = React.useState(false)

  const fetchPurchases = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (statusFilter) params.set("status", statusFilter)
      params.set("page", String(page))
      params.set("limit", "10")

      const res = await fetch(`/api/purchases?${params}`)
      if (res.ok) {
        const data: PurchasesResponse = await res.json()
        setData(data)
      }
    } catch {
      console.error("Failed to fetch purchases")
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, page])

  React.useEffect(() => {
    fetchPurchases()
  }, [fetchPurchases])

  React.useEffect(() => {
    setPage(1)
  }, [search, statusFilter])

  const statusVariant = (status: string) => {
    switch (status) {
      case "COMPLETED": return "success" as const
      case "PENDING": return "warning" as const
      case "CANCELLED": return "destructive" as const
      default: return "secondary" as const
    }
  }

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
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder={t("allStatuses")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{t("allStatuses")}</SelectItem>
            <SelectItem value="PENDING">{common("pending")}</SelectItem>
            <SelectItem value="COMPLETED">{common("completed")}</SelectItem>
            <SelectItem value="CANCELLED">{common("cancelled")}</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t("add")}
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("invoiceNumber")}</TableHead>
              <TableHead>{t("supplier")}</TableHead>
              <TableHead>{t("items")}</TableHead>
              <TableHead className="text-right">{t("total")}</TableHead>
              <TableHead>{common("status")}</TableHead>
              <TableHead>{t("date")}</TableHead>
              <TableHead className="w-[100px]">{common("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {common("loading")}
                </TableCell>
              </TableRow>
            ) : !data || data.purchases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>{t("noPurchases")}</p>
                  <Button variant="link" onClick={() => setCreateOpen(true)}>
                    {t("addFirst")}
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              data.purchases.map((purchase) => (
                <TableRow key={purchase.id}>
                  <TableCell className="font-mono text-xs font-medium">
                    {purchase.invoiceNumber}
                  </TableCell>
                  <TableCell>{purchase.supplierName}</TableCell>
                  <TableCell>{purchase.items.length}</TableCell>
                  <TableCell className="text-right font-medium">
                    ${purchase.total.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(purchase.status)}>
                      {common(purchase.status.toLowerCase())}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(purchase.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedPurchase(purchase)
                          setEditOpen(true)
                        }}
                        disabled={purchase.status === "CANCELLED"}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedPurchase(purchase)
                          setCancelOpen(true)
                        }}
                        disabled={purchase.status === "CANCELLED"}
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

      <PurchaseDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={fetchPurchases}
      />

      <PurchaseDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        purchase={selectedPurchase}
        onSuccess={fetchPurchases}
      />

      <CancelPurchaseDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        purchase={selectedPurchase}
        onSuccess={fetchPurchases}
      />
    </div>
  )
}
