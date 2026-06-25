"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Download, Printer } from "lucide-react"
import { downloadCSV, downloadXLSX, printReport } from "./export-utils"

interface SalesReport {
  grossSales: number
  netSales: number
  totalOrders: number
  averageOrderValue: number
  discounts: number
  taxes: number
  profit: number
  paymentMethods: { method: string; total: number; count: number }[]
  sales: {
    id: string
    saleNumber: string
    total: number
    paymentMethod: string
    createdAt: string
    customer: { firstName: string; lastName: string | null } | null
    cashier: { name: string | null }
    items: { productName: string; quantity: number; total: number }[]
  }[]
  page: number
  limit: number
  totalPages: number
}

export function SalesTab() {
  const t = useTranslations("reports")
  const [data, setData] = React.useState<SalesReport | null>(null)
  const [filter, setFilter] = React.useState("this_month")
  const [from, setFrom] = React.useState("")
  const [to, setTo] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [loading, setLoading] = React.useState(true)

  const fetchData = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ filter, page: String(page), limit: "20" })
      if (filter === "custom") {
        if (from) params.set("from", from)
        if (to) params.set("to", to)
      }
      const res = await fetch(`/api/reports/sales?${params}`)
      if (res.ok) {
        setData(await res.json())
      }
    } catch {
      console.error("Failed to fetch sales report")
    } finally {
      setLoading(false)
    }
  }, [filter, from, to, page])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  React.useEffect(() => {
    setPage(1)
  }, [filter, from, to])

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

  function handleExportCSV() {
    if (!data) return
    const rows = data.sales.map((s) => ({
      [t("saleNumber")]: s.saleNumber,
      [t("date")]: new Date(s.createdAt).toLocaleDateString(),
      [t("customer")]: s.customer ? `${s.customer.firstName} ${s.customer.lastName || ""}` : "Walk-in",
      [t("cashier")]: s.cashier.name || "",
      [t("paymentMethod")]: paymentLabel(s.paymentMethod),
      [t("total")]: s.total,
    }))
    downloadCSV(rows, "sales-report")
  }

  function handleExportXLSX() {
    if (!data) return
    const rows = data.sales.map((s) => ({
      [t("saleNumber")]: s.saleNumber,
      [t("date")]: new Date(s.createdAt).toLocaleDateString(),
      [t("customer")]: s.customer ? `${s.customer.firstName} ${s.customer.lastName || ""}` : "Walk-in",
      [t("cashier")]: s.cashier.name || "",
      [t("paymentMethod")]: paymentLabel(s.paymentMethod),
      [t("total")]: s.total,
    }))
    downloadXLSX(rows, "sales-report")
    setData((prev) => prev ? { ...prev } : prev)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <Select value={filter} onValueChange={(v) => { setFilter(v); setPage(1) }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">{t("today")}</SelectItem>
            <SelectItem value="yesterday">{t("yesterday")}</SelectItem>
            <SelectItem value="this_week">{t("thisWeek")}</SelectItem>
            <SelectItem value="this_month">{t("thisMonth")}</SelectItem>
            <SelectItem value="custom">{t("customRange")}</SelectItem>
          </SelectContent>
        </Select>
        {filter === "custom" && (
          <>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-[160px]" />
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-[160px]" />
          </>
        )}
        <div className="flex gap-2 ml-auto">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportXLSX}>
            <Download className="mr-2 h-4 w-4" /> Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => printReport("sales-report-print")}>
            <Printer className="mr-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6" id="sales-report-print">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium">{t("grossSales")}</CardTitle>
          </CardHeader>
          <CardContent>
            {data ? (
              <div className="text-lg font-bold">${data.grossSales.toFixed(2)}</div>
            ) : (
              <Skeleton className="h-6 w-20" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium">{t("netSales")}</CardTitle>
          </CardHeader>
          <CardContent>
            {data ? (
              <div className="text-lg font-bold">${data.netSales.toFixed(2)}</div>
            ) : (
              <Skeleton className="h-6 w-20" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium">{t("totalOrders")}</CardTitle>
          </CardHeader>
          <CardContent>
            {data ? (
              <div className="text-lg font-bold">{data.totalOrders}</div>
            ) : (
              <Skeleton className="h-6 w-12" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium">{t("averageOrderValue")}</CardTitle>
          </CardHeader>
          <CardContent>
            {data ? (
              <div className="text-lg font-bold">${data.averageOrderValue.toFixed(2)}</div>
            ) : (
              <Skeleton className="h-6 w-20" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium">{t("discounts")}</CardTitle>
          </CardHeader>
          <CardContent>
            {data ? (
              <div className="text-lg font-bold text-destructive">-${data.discounts.toFixed(2)}</div>
            ) : (
              <Skeleton className="h-6 w-20" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium">{t("profit")}</CardTitle>
          </CardHeader>
          <CardContent>
            {data ? (
              <div className="text-lg font-bold text-green-600">${data.profit.toFixed(2)}</div>
            ) : (
              <Skeleton className="h-6 w-20" />
            )}
          </CardContent>
        </Card>
      </div>

      {data && data.paymentMethods.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t("paymentMethodBreakdown")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {data.paymentMethods.map((pm) => (
                <div key={pm.method} className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">{paymentLabel(pm.method)}</p>
                  <p className="text-lg font-bold">${pm.total.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">{pm.count} {t("orders").toLowerCase()}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("saleNumber")}</TableHead>
              <TableHead>{t("date")}</TableHead>
              <TableHead>{t("customer")}</TableHead>
              <TableHead>{t("cashier")}</TableHead>
              <TableHead>{t("paymentMethod")}</TableHead>
              <TableHead className="text-right">{t("total")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              </TableRow>
            ) : !data || data.sales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {t("noData")}
                </TableCell>
              </TableRow>
            ) : (
              data.sales.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs">{s.saleNumber}</TableCell>
                  <TableCell className="text-xs">{new Date(s.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>{s.customer ? `${s.customer.firstName} ${s.customer.lastName || ""}` : "—"}</TableCell>
                  <TableCell>{s.cashier.name || "—"}</TableCell>
                  <TableCell>{paymentLabel(s.paymentMethod)}</TableCell>
                  <TableCell className="text-right font-mono">${s.total.toFixed(2)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            {t("previous")}
          </Button>
          <span className="text-sm text-muted-foreground self-center">
            {page} / {data.totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>
            {t("next")}
          </Button>
        </div>
      )}
    </div>
  )
}
