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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Download, Printer, Building2, DollarSign } from "lucide-react"
import { downloadCSV, downloadXLSX, printReport } from "./export-utils"

interface TopSupplier {
  id: string
  name: string
  phone: string | null
  totalPurchases: number
  totalSpent: number
  lastPurchase: string | null
}

interface SupplierReport {
  totalSuppliers: number
  totalSpentAll: number
  topSuppliers: TopSupplier[]
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-"
  return new Date(dateStr).toLocaleDateString()
}

export function SuppliersTab() {
  const t = useTranslations("reports")
  const [data, setData] = React.useState<SupplierReport | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    fetch("/api/reports/suppliers")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function handleExportCSV() {
    if (!data) return
    const rows = data.topSuppliers.map((s) => ({
      [t("supplierName")]: s.name,
      [t("phone")]: s.phone ?? "",
      [t("totalPurchases")]: s.totalPurchases,
      [t("totalSpent")]: s.totalSpent,
      [t("lastPurchase")]: s.lastPurchase ?? "",
    }))
    downloadCSV(rows, "supplier-report")
  }

  function handleExportXLSX() {
    if (!data) return
    const rows = data.topSuppliers.map((s) => ({
      [t("supplierName")]: s.name,
      [t("phone")]: s.phone ?? "",
      [t("totalPurchases")]: s.totalPurchases,
      [t("totalSpent")]: s.totalSpent,
      [t("lastPurchase")]: s.lastPurchase ?? "",
    }))
    downloadXLSX(rows, "supplier-report")
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
        <Button variant="outline" size="sm" onClick={() => printReport("supplier-report-print")}>
          <Printer className="mr-2 h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2" id="supplier-report-print">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-xs font-medium">{t("totalSuppliers")}</CardTitle>
          </CardHeader>
          <CardContent>
            {data ? (
              <div className="text-lg font-bold">{data.totalSuppliers}</div>
            ) : (
              <Skeleton className="h-6 w-12" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-xs font-medium">{t("totalSpentAll")}</CardTitle>
          </CardHeader>
          <CardContent>
            {data ? (
              <div className="text-lg font-bold font-mono">${data.totalSpentAll.toFixed(2)}</div>
            ) : (
              <Skeleton className="h-6 w-20" />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t("topSuppliers")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("supplierName")}</TableHead>
                <TableHead>{t("phone")}</TableHead>
                <TableHead className="text-right">{t("totalPurchases")}</TableHead>
                <TableHead className="text-right">{t("totalSpent")}</TableHead>
                <TableHead>{t("lastPurchase")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                </TableRow>
              ) : !data || data.topSuppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {t("noData")}
                  </TableCell>
                </TableRow>
              ) : (
                data.topSuppliers.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.phone ?? "-"}</TableCell>
                    <TableCell className="text-right">{s.totalPurchases}</TableCell>
                    <TableCell className="text-right font-mono">${s.totalSpent.toFixed(2)}</TableCell>
                    <TableCell>{formatDate(s.lastPurchase)}</TableCell>
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
