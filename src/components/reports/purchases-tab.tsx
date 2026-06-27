"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Download, Printer, Package, TrendingUp, DollarSign } from "lucide-react"
import { downloadCSV, downloadXLSX, printReport } from "./export-utils"

interface TopProduct {
  productId: string
  name: string
  quantity: number
  total: number
}

interface RecentPurchase {
  id: string
  invoiceNumber: string
  supplierName: string
  total: number
  status: "PENDING" | "COMPLETED" | "CANCELLED"
  createdAt: string
  itemCount: number
}

interface PurchasesReport {
  totalPurchases: number
  completedPurchases: number
  cancelledPurchases: number
  totalSpent: number
  topPurchasedProducts: TopProduct[]
  recentPurchases: RecentPurchase[]
}

function statusVariant(status: string) {
  switch (status) {
    case "COMPLETED": return "success" as const
    case "PENDING": return "warning" as const
    case "CANCELLED": return "destructive" as const
    default: return "secondary" as const
  }
}

export function PurchasesTab() {
  const t = useTranslations("reports")
  const common = useTranslations("common")
  const [data, setData] = React.useState<PurchasesReport | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    fetch("/api/reports/purchases")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function handleExportCSV() {
    if (!data) return
    const rows = data.recentPurchases.map((p) => ({
      [t("invoice")]: p.invoiceNumber,
      [t("supplier")]: p.supplierName,
      [t("items")]: p.itemCount,
      [t("status")]: common(p.status.toLowerCase()),
      [t("total")]: p.total,
      [t("date")]: new Date(p.createdAt).toLocaleDateString(),
    }))
    downloadCSV(rows, "purchases-report")
  }

  function handleExportXLSX() {
    if (!data) return
    const rows = data.recentPurchases.map((p) => ({
      [t("invoice")]: p.invoiceNumber,
      [t("supplier")]: p.supplierName,
      [t("items")]: p.itemCount,
      [t("status")]: common(p.status.toLowerCase()),
      [t("total")]: p.total,
      [t("date")]: new Date(p.createdAt).toLocaleDateString(),
    }))
    downloadXLSX(rows, "purchases-report")
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <Download className="mr-2 h-4 w-4" /> CSV
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportXLSX}>
          <Download className="mr-2 h-4 w-4" /> Excel
        </Button>
        <Button variant="outline" size="sm" onClick={() => printReport("purchases-report-print")}>
          <Printer className="mr-2 h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3" id="purchases-report-print">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              {t("totalPurchases")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data ? (
              <div className="text-lg font-bold">{data.totalPurchases}</div>
            ) : (
              <Skeleton className="h-6 w-12" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              {t("completedPurchases")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data ? (
              <div className="text-lg font-bold">{data.completedPurchases}</div>
            ) : (
              <Skeleton className="h-6 w-12" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              {t("totalSpent")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data ? (
              <div className="text-lg font-bold">${data.totalSpent.toFixed(2)}</div>
            ) : (
              <Skeleton className="h-6 w-20" />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t("topPurchasedProducts")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("product")}</TableHead>
                <TableHead className="text-right">{t("quantity")}</TableHead>
                <TableHead className="text-right">{t("total")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8">
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                </TableRow>
              ) : !data || data.topPurchasedProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                    {t("noData")}
                  </TableCell>
                </TableRow>
              ) : (
                data.topPurchasedProducts.map((p) => (
                  <TableRow key={p.productId}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-right font-mono">{p.quantity}</TableCell>
                    <TableCell className="text-right font-mono">${p.total.toFixed(2)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t("recentPurchases")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("invoice")}</TableHead>
                <TableHead>{t("supplier")}</TableHead>
                <TableHead className="text-right">{t("items")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead className="text-right">{t("total")}</TableHead>
                <TableHead>{t("date")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                </TableRow>
              ) : !data || data.recentPurchases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {t("noData")}
                  </TableCell>
                </TableRow>
              ) : (
                data.recentPurchases.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.invoiceNumber}</TableCell>
                    <TableCell>{p.supplierName || "—"}</TableCell>
                    <TableCell className="text-right font-mono">{p.itemCount}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(p.status)}>
                        {common(p.status.toLowerCase())}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">${p.total.toFixed(2)}</TableCell>
                    <TableCell className="text-xs">{new Date(p.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
