"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import {
  DollarSign,
  Package,
  Users,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  Banknote,
  CreditCard,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Loader2 } from "lucide-react"

const DashboardCharts = React.lazy(() =>
  import("./dashboard-charts").then((m) => ({ default: m.DashboardCharts }))
)

interface DashboardData {
  todaySales: number
  todayProfit: number
  todayOrders: number
  weeklySales: number
  weeklyOrders: number
  monthlySales: number
  totalRevenue: number
  totalCustomers: number
  totalProducts: number
  lowStockProducts: number
  outOfStockProducts: number
  outstandingCredit: number
  customersWithDebt: number
  todayCreditSales: number
  recentPayments: { id: string; amount: number; paymentMethod: string; createdAt: string; customer: { firstName: string; lastName: string } | null }[]
}

interface ChartData {
  sevenDays: { date: string; total: number }[]
  thirtyDays: { date: string; total: number }[]
}

interface BestSelling {
  products: { productId: string; productName: string; quantitySold: number; revenue: number }[]
}

interface PaymentMethods {
  methods: { method: string; total: number; count: number }[]
}

export function DashboardPage() {
  const t = useTranslations("dashboard")
  const r = useTranslations("reports")

  const [data, setData] = React.useState<DashboardData | null>(null)
  const [chartData, setChartData] = React.useState<ChartData | null>(null)
  const [bestSelling, setBestSelling] = React.useState<BestSelling | null>(null)
  const [paymentMethods, setPaymentMethods] = React.useState<PaymentMethods | null>(null)
  React.useEffect(() => {
    fetch("/api/reports/dashboard")
      .then((r) => r.ok ? r.json() : null)
      .then(setData)
      .catch(() => {})
    fetch("/api/reports/sales-chart")
      .then((r) => r.ok ? r.json() : null)
      .then(setChartData)
      .catch(() => {})
    fetch("/api/reports/best-selling")
      .then((r) => r.ok ? r.json() : null)
      .then(setBestSelling)
      .catch(() => {})
    fetch("/api/reports/payment-methods")
      .then((r) => r.ok ? r.json() : null)
      .then(setPaymentMethods)
      .catch(() => {})
  }, [])

  const paymentLabel = (method: string) => {
    const map: Record<string, string> = {
      CASH: r("cash"),
      ZAAD: "ZAAD",
      EVC_PLUS: "EVC Plus",
      SAHAL: "Sahal",
      CARD: r("card"),
    }
    return map[method] || method
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">{r("todaySales")}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {data ? (
              <div className="text-xl font-bold">${data.todaySales.toFixed(2)}</div>
            ) : (
              <Skeleton className="h-7 w-20" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">{r("todayProfit")}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {data ? (
              <div className="text-xl font-bold text-green-600">${data.todayProfit.toFixed(2)}</div>
            ) : (
              <Skeleton className="h-7 w-20" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">{r("todayOrders")}</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {data ? (
              <div className="text-xl font-bold">{data.todayOrders}</div>
            ) : (
              <Skeleton className="h-7 w-12" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">{r("monthlySales")}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {data ? (
              <div className="text-xl font-bold">${data.monthlySales.toFixed(2)}</div>
            ) : (
              <Skeleton className="h-7 w-20" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">{r("totalCustomers")}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {data ? (
              <div className="text-xl font-bold">{data.totalCustomers}</div>
            ) : (
              <Skeleton className="h-7 w-12" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">{r("lowStockProducts")}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            {data ? (
              <div className="text-xl font-bold text-amber-500">{data.lowStockProducts}</div>
            ) : (
              <Skeleton className="h-7 w-12" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">{t("outstandingCredit")}</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {data ? (
              <div className="text-xl font-bold text-rose-600">${data.outstandingCredit.toFixed(2)}</div>
            ) : (
              <Skeleton className="h-7 w-20" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">{t("customersWithDebt")}</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {data ? (
              <div className="text-xl font-bold">{data.customersWithDebt}</div>
            ) : (
              <Skeleton className="h-7 w-12" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">{t("todayCreditSales")}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {data ? (
              <div className="text-xl font-bold">${data.todayCreditSales.toFixed(2)}</div>
            ) : (
              <Skeleton className="h-7 w-20" />
            )}
          </CardContent>
        </Card>
      </div>

      {data && data.recentPayments && data.recentPayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t("recentPayments")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.recentPayments.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <span>
                    {p.customer
                      ? `${p.customer.firstName} ${p.customer.lastName || ""}`
                      : "—"}
                  </span>
                  <span className="font-mono font-medium text-green-600">
                    +${p.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <React.Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <DashboardCharts
          chartData={chartData}
          paymentMethods={paymentMethods}
          paymentLabel={paymentLabel}
        />
      </React.Suspense>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{r("bestSellingProducts")}</CardTitle>
        </CardHeader>
          <CardContent>
            {bestSelling && bestSelling.products.length > 0 ? (
              <div className="space-y-3">
                {bestSelling.products.map((p, i) => (
                  <div key={p.productId || i} className="flex items-center gap-3">
                    <span className="text-xs font-medium text-muted-foreground w-5">
                      {i + 1}.
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.productName}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.quantitySold} {r("sold")} &middot; ${p.revenue.toFixed(2)}
                      </p>
                    </div>
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            (p.quantitySold /
                              Math.max(...bestSelling.products.map((x) => x.quantitySold))) *
                              100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                {r("noData")}
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  )
}
