"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
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

interface CashierReport {
  cashiers: {
    cashierId: string
    cashierName: string
    orders: number
    sales: number
    profit: number
    averageOrderValue: number
  }[]
}

export function CashiersTab() {
  const t = useTranslations("reports")
  const [data, setData] = React.useState<CashierReport | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    fetch("/api/reports/cashiers")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function handleExportCSV() {
    if (!data) return
    const rows = data.cashiers.map((c) => ({
      [t("cashierName")]: c.cashierName,
      [t("orders")]: c.orders,
      [t("sales")]: c.sales,
      [t("profit")]: c.profit,
      [t("averageOrderValue")]: c.averageOrderValue,
    }))
    downloadCSV(rows, "cashier-report")
  }

  function handleExportXLSX() {
    if (!data) return
    const rows = data.cashiers.map((c) => ({
      [t("cashierName")]: c.cashierName,
      [t("orders")]: c.orders,
      [t("sales")]: c.sales,
      [t("profit")]: c.profit,
      [t("averageOrderValue")]: c.averageOrderValue,
    }))
    downloadXLSX(rows, "cashier-report")
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
        <Button variant="outline" size="sm" onClick={() => printReport("cashier-report-print")}>
          <Printer className="mr-2 h-4 w-4" />
        </Button>
      </div>

      <div className="rounded-md border" id="cashier-report-print">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("cashierName")}</TableHead>
              <TableHead className="text-right">{t("orders")}</TableHead>
              <TableHead className="text-right">{t("sales")}</TableHead>
              <TableHead className="text-right">{t("profit")}</TableHead>
              <TableHead className="text-right">{t("averageOrderValue")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              </TableRow>
            ) : !data || data.cashiers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  {t("noData")}
                </TableCell>
              </TableRow>
            ) : (
              data.cashiers.map((c) => (
                <TableRow key={c.cashierId}>
                  <TableCell className="font-medium">{c.cashierName}</TableCell>
                  <TableCell className="text-right">{c.orders}</TableCell>
                  <TableCell className="text-right font-mono">${c.sales.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-mono text-green-600">${c.profit.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-mono">${c.averageOrderValue.toFixed(2)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
