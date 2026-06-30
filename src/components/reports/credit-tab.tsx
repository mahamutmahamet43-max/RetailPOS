"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { DollarSign, Users, ShoppingCart, Banknote } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface PaymentData {
  id: string
  amount: number
  paymentMethod: string
  reference: string | null
  notes: string | null
  createdAt: string
  customer: { id: string; firstName: string; lastName: string } | null
  cashier: { name: string } | null
}

interface DebtorData {
  id: string
  name: string
  phone: string
  balance: number
  creditLimit: number
  totalSales: number
  lastPaymentDate: string | null
}

interface CreditReportData {
  totalOutstanding: number
  customersWithDebt: number
  totalCustomers: number
  todayCreditSales: number
  todayCreditTransactions: number
  recentPayments: PaymentData[]
  topDebtors: DebtorData[]
  totalDebtors: number
}

export function CreditTab() {
  const t = useTranslations("reports")
  const common = useTranslations("common")

  const [data, setData] = React.useState<CreditReportData | null>(null)

  React.useEffect(() => {
    fetch("/api/reports/credit")
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => {})
  }, [])

  const paymentLabel = (method: string) => {
    const map: Record<string, string> = {
      CASH: "Cash",
      SAHAL: "Sahal",
      ZAAD: "ZAAD",
      EVC_PLUS: "EVC Plus",
      CARD: "Card",
    }
    return map[method] || method
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">{t("totalOutstanding")}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {data ? (
              <div className="text-2xl font-bold text-rose-600">${data.totalOutstanding.toFixed(2)}</div>
            ) : (
              <Skeleton className="h-8 w-24" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">{t("customersWithDebt")}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {data ? (
              <div className="text-2xl font-bold">{data.customersWithDebt} / {data.totalCustomers}</div>
            ) : (
              <Skeleton className="h-8 w-16" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">{t("todayCreditSales")}</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {data ? (
              <div className="text-2xl font-bold">${data.todayCreditSales.toFixed(2)}</div>
            ) : (
              <Skeleton className="h-8 w-24" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">{t("paymentsReceived")}</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {data ? (
              <div className="text-2xl font-bold text-green-600">{data.recentPayments.length}</div>
            ) : (
              <Skeleton className="h-8 w-16" />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t("topDebtors")}</CardTitle>
        </CardHeader>
        <CardContent>
          {data && data.topDebtors.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("customerName")}</TableHead>
                  <TableHead>{t("phone")}</TableHead>
                  <TableHead className="text-right">{t("balance")}</TableHead>
                  <TableHead className="text-right">{t("creditLimit")}</TableHead>
                  <TableHead className="text-right">{t("totalSales")}</TableHead>
                  <TableHead>{t("lastPayment")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topDebtors.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell>{d.phone}</TableCell>
                    <TableCell className="text-right font-mono text-rose-600">${d.balance.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-mono">
                      {d.creditLimit > 0 ? `$${d.creditLimit.toFixed(2)}` : "—"}
                    </TableCell>
                    <TableCell className="text-right">{d.totalSales}</TableCell>
                    <TableCell className="text-xs">
                      {d.lastPaymentDate ? new Date(d.lastPaymentDate).toLocaleDateString() : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              {t("noCreditData")}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t("paymentsReceived")}</CardTitle>
        </CardHeader>
        <CardContent>
          {data && data.recentPayments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{common("date")}</TableHead>
                  <TableHead>{t("customerName")}</TableHead>
                  <TableHead>{t("paymentMethod")}</TableHead>
                  <TableHead className="text-right">{t("total")}</TableHead>
                  <TableHead>{t("cashier")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentPayments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-xs whitespace-nowrap">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {p.customer
                        ? `${p.customer.firstName} ${p.customer.lastName || ""}`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{paymentLabel(p.paymentMethod)}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-green-600">
                      +${p.amount.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-xs">{p.cashier?.name || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              {t("noCreditData")}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}