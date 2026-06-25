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

interface InventoryProduct {
  id: string
  barcode: string | null
  name: string
  category: string
  stock: number
  minimumStock: number
  costPrice: number
  sellingPrice: number
  inventoryValue: number
}

interface InventoryReport {
  inventoryCostValue: number
  retailValue: number
  expectedProfit: number
  lowStockCount: number
  outOfStockCount: number
  products: InventoryProduct[]
}

export function InventoryTab() {
  const t = useTranslations("reports")
  const [data, setData] = React.useState<InventoryReport | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    fetch("/api/reports/inventory")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function handleExportCSV() {
    if (!data) return
    const rows = data.products.map((p) => ({
      [t("barcode")]: p.barcode || "",
      [t("product")]: p.name,
      [t("category")]: p.category,
      [t("stock")]: p.stock,
      [t("costPrice")]: p.costPrice,
      [t("sellingPrice")]: p.sellingPrice,
      [t("inventoryValue")]: p.inventoryValue,
    }))
    downloadCSV(rows, "inventory-report")
  }

  function handleExportXLSX() {
    if (!data) return
    const rows = data.products.map((p) => ({
      [t("barcode")]: p.barcode || "",
      [t("product")]: p.name,
      [t("category")]: p.category,
      [t("stock")]: p.stock,
      [t("costPrice")]: p.costPrice,
      [t("sellingPrice")]: p.sellingPrice,
      [t("inventoryValue")]: p.inventoryValue,
    }))
    downloadXLSX(rows, "inventory-report")
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
        <Button variant="outline" size="sm" onClick={() => printReport("inventory-report-print")}>
          <Printer className="mr-2 h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5" id="inventory-report-print">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium">{t("inventoryCostValue")}</CardTitle>
          </CardHeader>
          <CardContent>
            {data ? (
              <div className="text-lg font-bold">${data.inventoryCostValue.toFixed(2)}</div>
            ) : (
              <Skeleton className="h-6 w-20" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium">{t("retailValue")}</CardTitle>
          </CardHeader>
          <CardContent>
            {data ? (
              <div className="text-lg font-bold">${data.retailValue.toFixed(2)}</div>
            ) : (
              <Skeleton className="h-6 w-20" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium">{t("expectedProfit")}</CardTitle>
          </CardHeader>
          <CardContent>
            {data ? (
              <div className="text-lg font-bold text-green-600">${data.expectedProfit.toFixed(2)}</div>
            ) : (
              <Skeleton className="h-6 w-20" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium">{t("lowStockCount")}</CardTitle>
          </CardHeader>
          <CardContent>
            {data ? (
              <div className="text-lg font-bold text-amber-500">{data.lowStockCount}</div>
            ) : (
              <Skeleton className="h-6 w-12" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium">{t("outOfStockCount")}</CardTitle>
          </CardHeader>
          <CardContent>
            {data ? (
              <div className="text-lg font-bold text-destructive">{data.outOfStockCount}</div>
            ) : (
              <Skeleton className="h-6 w-12" />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("barcode")}</TableHead>
              <TableHead>{t("product")}</TableHead>
              <TableHead>{t("category")}</TableHead>
              <TableHead className="text-right">{t("stock")}</TableHead>
              <TableHead className="text-right">{t("costPrice")}</TableHead>
              <TableHead className="text-right">{t("sellingPrice")}</TableHead>
              <TableHead className="text-right">{t("inventoryValue")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              </TableRow>
            ) : !data || data.products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {t("noData")}
                </TableCell>
              </TableRow>
            ) : (
              data.products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.barcode || "—"}</TableCell>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.category}</TableCell>
                  <TableCell className="text-right font-mono">{p.stock}</TableCell>
                  <TableCell className="text-right font-mono">${p.costPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-mono">${p.sellingPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-mono">${p.inventoryValue.toFixed(2)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
