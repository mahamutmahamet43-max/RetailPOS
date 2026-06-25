"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"

interface Overview {
  totalRevenue: number
  totalCustomers: number
  totalProducts: number
  lowStockProducts: number
  outOfStockProducts: number
  monthlySales: number
  weeklySales: number
}

interface ChartData {
  sevenDays: { date: string; total: number }[]
  thirtyDays: { date: string; total: number }[]
}

interface BestSelling {
  products: { productId: string; productName: string; quantitySold: number; revenue: number }[]
}

const PAYMENT_COLORS: Record<string, string> = {
  CASH: "#22c55e",
  ZAAD: "#3b82f6",
  EVC_PLUS: "#a855f7",
  SAHAL: "#f97316",
  CARD: "#6b7280",
}

export function OverviewTab() {
  const t = useTranslations("reports")
  const [data, setData] = React.useState<Overview | null>(null)
  const [chartData, setChartData] = React.useState<ChartData | null>(null)
  const [bestSelling, setBestSelling] = React.useState<BestSelling | null>(null)
  const [paymentMethods, setPaymentMethods] = React.useState<{
    methods: { method: string; total: number }[]
  } | null>(null)

  React.useEffect(() => {
    fetch("/api/reports/dashboard")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
    fetch("/api/reports/sales-chart")
      .then((r) => r.json())
      .then(setChartData)
      .catch(() => {})
    fetch("/api/reports/best-selling")
      .then((r) => r.json())
      .then(setBestSelling)
      .catch(() => {})
    fetch("/api/reports/payment-methods")
      .then((r) => r.json())
      .then(setPaymentMethods)
      .catch(() => {})
  }, [])

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
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium">{t("totalRevenue")}</CardTitle>
          </CardHeader>
          <CardContent>
            {data ? (
              <div className="text-xl font-bold">${data.totalRevenue.toFixed(2)}</div>
            ) : (
              <Skeleton className="h-7 w-20" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium">{t("monthlySales")}</CardTitle>
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
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium">{t("weeklySales")}</CardTitle>
          </CardHeader>
          <CardContent>
            {data ? (
              <div className="text-xl font-bold">${data.weeklySales.toFixed(2)}</div>
            ) : (
              <Skeleton className="h-7 w-20" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium">{t("totalCustomers")}</CardTitle>
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
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium">{t("totalProducts")}</CardTitle>
          </CardHeader>
          <CardContent>
            {data ? (
              <div className="text-xl font-bold">{data.totalProducts}</div>
            ) : (
              <Skeleton className="h-7 w-12" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium">{t("lowStockProducts")}</CardTitle>
          </CardHeader>
          <CardContent>
            {data ? (
              <div className="text-xl font-bold text-amber-500">{data.lowStockProducts}</div>
            ) : (
              <Skeleton className="h-7 w-12" />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-sm">{t("salesLast7Days")}</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData ? (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.sevenDays}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" fontSize={11} />
                    <YAxis fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="total" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                {t("loading")}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-sm">{t("paymentMethods")}</CardTitle>
          </CardHeader>
          <CardContent>
            {paymentMethods && paymentMethods.methods.length > 0 ? (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentMethods.methods.map((m) => ({
                        name: paymentLabel(m.method),
                        value: m.total,
                      }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {paymentMethods.methods.map((m) => (
                        <Cell
                          key={m.method}
                          fill={PAYMENT_COLORS[m.method] || "#6b7280"}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend fontSize={11} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                {t("noData")}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t("salesLast30Days")}</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData ? (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.thirtyDays}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" fontSize={10} interval={4} />
                    <YAxis fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="total" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                {t("loading")}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t("bestSellingProducts")}</CardTitle>
          </CardHeader>
          <CardContent>
            {bestSelling && bestSelling.products.length > 0 ? (
              <div className="space-y-3">
                {bestSelling.products.map((p, i) => (
                  <div key={p.productId || i} className="flex items-center gap-3">
                    <span className="text-xs font-medium text-muted-foreground w-5">{i + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.productName}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.quantitySold} {t("sold")} &middot; ${p.revenue.toFixed(2)}
                      </p>
                    </div>
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{
                          width: `${Math.min(100, (p.quantitySold / Math.max(...bestSelling.products.map((x) => x.quantitySold))) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                {t("noData")}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
