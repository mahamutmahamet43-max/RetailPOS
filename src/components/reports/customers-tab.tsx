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
import { Download, Printer } from "lucide-react"
import { downloadCSV, downloadXLSX, printReport } from "./export-utils"

interface TopCustomer {
  id: string
  name: string
  phone: string
  totalOrders: number
  totalSpent: number
}

interface CustomerReport {
  totalCustomers: number
  newCustomers: number
  returningCustomers: number
  topCustomers: TopCustomer[]
}

export function CustomersTab() {
  const t = useTranslations("reports")
  const [data, setData] = React.useState<CustomerReport | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    fetch("/api/reports/customers")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function handleExportCSV() {
    if (!data) return
    const rows = data.topCustomers.map((c) => ({
      [t("customerName")]: c.name,
      [t("phone")]: c.phone,
      [t("totalOrders")]: c.totalOrders,
      [t("totalSpent")]: c.totalSpent,
    }))
    downloadCSV(rows, "customer-report")
  }

  function handleExportXLSX() {
    if (!data) return
    const rows = data.topCustomers.map((c) => ({
      [t("customerName")]: c.name,
      [t("phone")]: c.phone,
      [t("totalOrders")]: c.totalOrders,
      [t("totalSpent")]: c.totalSpent,
    }))
    downloadXLSX(rows, "customer-report")
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
        <Button variant="outline" size="sm" onClick={() => printReport("customer-report-print")}>
          <Printer className="mr-2 h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3" id="customer-report-print">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium">{t("totalCustomers")}</CardTitle>
          </CardHeader>
          <CardContent>
            {data ? (
              <div className="text-lg font-bold">{data.totalCustomers}</div>
            ) : (
              <Skeleton className="h-6 w-12" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium">{t("newCustomers")}</CardTitle>
          </CardHeader>
          <CardContent>
            {data ? (
              <div className="text-lg font-bold">{data.newCustomers}</div>
            ) : (
              <Skeleton className="h-6 w-12" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium">{t("returningCustomers")}</CardTitle>
          </CardHeader>
          <CardContent>
            {data ? (
              <div className="text-lg font-bold">{data.returningCustomers}</div>
            ) : (
              <Skeleton className="h-6 w-12" />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t("topCustomers")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("customerName")}</TableHead>
                <TableHead>{t("phone")}</TableHead>
                <TableHead className="text-right">{t("totalOrders")}</TableHead>
                <TableHead className="text-right">{t("totalSpent")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                </TableRow>
              ) : !data || data.topCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    {t("noData")}
                  </TableCell>
                </TableRow>
              ) : (
                data.topCustomers.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.phone}</TableCell>
                    <TableCell className="text-right">{c.totalOrders}</TableCell>
                    <TableCell className="text-right font-mono">${c.totalSpent.toFixed(2)}</TableCell>
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
