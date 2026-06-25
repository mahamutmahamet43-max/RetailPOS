"use client"

import { useTranslations } from "next-intl"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  LineChart,
  Line,
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

const PAYMENT_COLORS: Record<string, string> = {
  CASH: "#22c55e",
  ZAAD: "#3b82f6",
  EVC_PLUS: "#a855f7",
  SAHAL: "#f97316",
  CARD: "#6b7280",
}

interface ChartData {
  sevenDays: { date: string; total: number }[]
  thirtyDays: { date: string; total: number }[]
}

interface PaymentMethods {
  methods: { method: string; total: number; count: number }[]
}

interface Props {
  chartData: ChartData | null
  paymentMethods: PaymentMethods | null
  paymentLabel: (method: string) => string
}

export function DashboardCharts({ chartData, paymentMethods, paymentLabel }: Props) {
  const r = useTranslations("reports")

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-sm">{r("salesLast7Days")}</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData ? (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData.sevenDays}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" fontSize={11} />
                    <YAxis fontSize={11} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                {r("loading")}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-sm">{r("paymentMethods")}</CardTitle>
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
                {r("noData")}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{r("salesLast30Days")}</CardTitle>
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
                {r("loading")}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
