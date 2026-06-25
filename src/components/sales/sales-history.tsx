"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import {
  Search,
  Eye,
  Printer,
  Ban,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Receipt } from "@/components/sales/receipt"

interface SaleItem {
  id: string
  productName: string
  barcode: string | null
  quantity: number
  unitPrice: number
  discount: number
  total: number
}

interface SaleCustomer {
  id: string
  firstName: string
  lastName: string | null
  phone?: string
}

interface SaleCashier {
  id: string
  name: string | null
}

interface Sale {
  id: string
  saleNumber: string
  subtotal: number
  discount: number
  tax: number
  total: number
  amountPaid: number
  changeGiven: number
  paymentMethod: string
  status: string
  createdAt: string
  customer: SaleCustomer | null
  cashier: SaleCashier
  items: SaleItem[]
}

interface SalesResponse {
  sales: Sale[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export function SalesHistory() {
  const t = useTranslations("sales")
  const common = useTranslations("common")

  const [data, setData] = React.useState<SalesResponse | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [paymentFilter, setPaymentFilter] = React.useState("")
  const [fromDate, setFromDate] = React.useState("")
  const [toDate, setToDate] = React.useState("")
  const [page, setPage] = React.useState(1)

  const [selectedSale, setSelectedSale] = React.useState<Sale | null>(null)
  const [detailOpen, setDetailOpen] = React.useState(false)
  const [voidDialogOpen, setVoidDialogOpen] = React.useState(false)
  const [voiding, setVoiding] = React.useState(false)
  const [voidError, setVoidError] = React.useState("")

  const fetchSales = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (paymentFilter) params.set("payment", paymentFilter)
      if (fromDate) params.set("from", fromDate)
      if (toDate) params.set("to", toDate)
      params.set("page", String(page))
      params.set("limit", "10")

      const res = await fetch(`/api/sales?${params}`)
      if (res.ok) {
        const result: SalesResponse = await res.json()
        setData(result)
      }
    } catch {
      console.error("Failed to fetch sales")
    } finally {
      setLoading(false)
    }
  }, [search, paymentFilter, fromDate, toDate, page])

  React.useEffect(() => {
    fetchSales()
  }, [fetchSales])

  React.useEffect(() => {
    setPage(1)
  }, [search, paymentFilter, fromDate, toDate])

  async function openDetail(sale: Sale) {
    try {
      const res = await fetch(`/api/sales/${sale.id}`)
      if (res.ok) {
        const detail: Sale = await res.json()
        setSelectedSale(detail)
        setDetailOpen(true)
      }
    } catch {
      console.error("Failed to fetch sale detail")
    }
  }

  async function handleVoid() {
    if (!selectedSale) return
    setVoiding(true)
    setVoidError("")
    try {
      const res = await fetch(`/api/sales/${selectedSale.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "void" }),
      })
      if (!res.ok) {
        const data = await res.json()
        setVoidError(data.error || common("error"))
        return
      }
      const updated: Sale = await res.json()
      setSelectedSale(updated)
      setVoidDialogOpen(false)
      fetchSales()
    } catch {
      setVoidError(common("error"))
    } finally {
      setVoiding(false)
    }
  }

  const paymentBadge = (method: string) => {
    const colors: Record<string, string> = {
      CASH: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
      ZAAD: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
      EVC_PLUS: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
      SAHAL: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
      CARD: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100",
    }
    return colors[method] || ""
  }

  const paymentLabel = (method: string) => {
    const map: Record<string, string> = {
      CASH: t("cash"),
      ZAAD: "ZAAD",
      EVC_PLUS: "EVC Plus",
      SAHAL: "Sahal",
      CARD: t("card"),
    }
    return map[method] || method
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("searchSales")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder={t("allPayments")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{t("allPayments")}</SelectItem>
            <SelectItem value="CASH">{t("cash")}</SelectItem>
            <SelectItem value="ZAAD">ZAAD</SelectItem>
            <SelectItem value="EVC_PLUS">EVC Plus</SelectItem>
            <SelectItem value="SAHAL">Sahal</SelectItem>
            <SelectItem value="CARD">{t("card")}</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="w-[160px]"
        />
        <Input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="w-[160px]"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("saleNumber")}</TableHead>
              <TableHead>{t("date")}</TableHead>
              <TableHead>{t("customer")}</TableHead>
              <TableHead>{t("paymentMethod")}</TableHead>
              <TableHead>{t("status")}</TableHead>
              <TableHead className="text-right">{t("total")}</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              </TableRow>
            ) : !data || data.sales.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-muted-foreground"
                >
                  <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>{t("noSales")}</p>
                </TableCell>
              </TableRow>
            ) : (
              data.sales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="font-mono text-xs">
                    {sale.saleNumber}
                  </TableCell>
                  <TableCell className="text-xs whitespace-nowrap">
                    {new Date(sale.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="max-w-[120px] truncate">
                    {sale.customer
                      ? `${sale.customer.firstName} ${sale.customer.lastName || ""}`
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`${paymentBadge(sale.paymentMethod)} border-0`}
                    >
                      {paymentLabel(sale.paymentMethod)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {sale.status === "VOID" ? (
                      <Badge variant="destructive">{t("voided")}</Badge>
                    ) : (
                      <Badge variant="success">{t("completed")}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    ${sale.total.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => openDetail(sale)}
                      >
                        <Eye className="h-3.5 w-3.5" />
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
              {t("pagination", {
                page,
                totalPages: data.totalPages,
              })}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setPage((p) => Math.min(data.totalPages, p + 1))
              }
              disabled={page >= data.totalPages}
            >
              {common("next")}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">
              {t("saleDetail")}
            </h2>
          </div>
          {selectedSale && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm">
                  {selectedSale.saleNumber}
                </span>
                {selectedSale.status === "VOID" ? (
                  <Badge variant="destructive">{t("voided")}</Badge>
                ) : (
                  <Badge variant="success">{t("completed")}</Badge>
                )}
              </div>

              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("date")}</span>
                  <span>
                    {new Date(selectedSale.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("cashierLabel")}
                  </span>
                  <span>{selectedSale.cashier.name || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("customer")}
                  </span>
                  <span>
                    {selectedSale.customer
                      ? `${selectedSale.customer.firstName} ${selectedSale.customer.lastName || ""}`
                      : t("walkIn")}
                  </span>
                </div>
              </div>

              <div className="border-t pt-2">
                <h3 className="font-medium mb-2 text-sm">{t("items")}</h3>
                <div className="space-y-1">
                  {selectedSale.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between text-sm"
                    >
                      <span className="max-w-[180px] truncate">
                        {item.productName}
                        <span className="text-muted-foreground">
                          {" "}
                          × {item.quantity}
                        </span>
                      </span>
                      <span className="font-mono">
                        ${item.total.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-2 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("subtotal")}
                  </span>
                  <span className="font-mono">
                    ${selectedSale.subtotal.toFixed(2)}
                  </span>
                </div>
                {selectedSale.discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t("discount")}
                    </span>
                    <span className="font-mono text-destructive">
                      -${selectedSale.discount.toFixed(2)}
                    </span>
                  </div>
                )}
                {selectedSale.tax > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("tax")}</span>
                    <span className="font-mono">
                      ${selectedSale.tax.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-bold border-t pt-1">
                  <span>{t("grandTotal")}</span>
                  <span className="font-mono">
                    ${selectedSale.total.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("paymentMethod")}
                  </span>
                  <span>{paymentLabel(selectedSale.paymentMethod)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("amountPaid")}
                  </span>
                  <span className="font-mono">
                    ${selectedSale.amountPaid.toFixed(2)}
                  </span>
                </div>
                {selectedSale.changeGiven > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t("change")}
                    </span>
                    <span className="font-mono">
                      ${selectedSale.changeGiven.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setDetailOpen(false)
                    setTimeout(() => {
                      const printWindow = window.open("", "_blank")
                      if (printWindow) {
                        printWindow.document.write(
                          `<html><head><title>Receipt</title></head><body>`
                        )
                        printWindow.document.write(
                          document.getElementById("receipt-content")
                            ?.innerHTML || ""
                        )
                        printWindow.document.write("</body></html>")
                        printWindow.document.close()
                        printWindow.print()
                      }
                    }, 100)
                  }}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  {t("printReceipt")}
                </Button>
                {selectedSale.status !== "VOID" && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                    onClick={() => setVoidDialogOpen(true)}
                  >
                    <Ban className="mr-2 h-4 w-4" />
                    {t("voidSale")}
                  </Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={voidDialogOpen} onOpenChange={setVoidDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("voidSale")}</DialogTitle>
            <DialogDescription>{t("voidWarning")}</DialogDescription>
          </DialogHeader>
          {voidError && (
            <p className="text-sm text-destructive">{voidError}</p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setVoidDialogOpen(false)}
            >
              {common("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleVoid}
              disabled={voiding}
            >
              {voiding ? common("loading") : t("confirmVoid")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div id="receipt-content" className="hidden">
        {selectedSale && (
          <Receipt
            sale={selectedSale}
            storeName="RetailPOS"
            storeAddress=""
            storePhone=""
            onPrint={() => {}}
          />
        )}
      </div>
    </div>
  )
}
