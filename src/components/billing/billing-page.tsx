"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Check, X, Loader2 } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"

interface Plan {
  id: string
  name: string
  monthlyPrice: number
  limits: { products: number; users: number; reports: string }
}

interface Payment {
  id: string
  amount: number
  currency: string
  provider: string
  providerRef: string | null
  status: string
  createdAt: string
}

interface SubscriptionData {
  id: string
  plan: string
  status: string
  startsAt: string
  endsAt: string | null
  trialEndsAt: string | null
  renewalDate: string | null
  billingCycle: string | null
  trialDaysRemaining: number
  isExpired: boolean
  payments: Payment[]
}

const FEATURES: Record<string, { label: string; free: boolean; basic: boolean; premium: boolean }[]> = {
  en: [
    { label: "Up to 100 products", free: true, basic: true, premium: true },
    { label: "Up to 2 users", free: true, basic: true, premium: true },
    { label: "Up to 2,000 products", free: false, basic: true, premium: true },
    { label: "Up to 5 users", free: false, basic: true, premium: true },
    { label: "Unlimited products", free: false, basic: false, premium: true },
    { label: "Unlimited users", free: false, basic: false, premium: true },
    { label: "Full POS", free: true, basic: true, premium: true },
    { label: "Inventory Management", free: true, basic: true, premium: true },
    { label: "Basic Reports", free: true, basic: true, premium: true },
    { label: "Advanced Reports", free: false, basic: false, premium: true },
    { label: "Priority Support", free: false, basic: false, premium: true },
  ],
}

export function BillingPage() {
  const t = useTranslations("billing")
  const common = useTranslations("common")

  const [plans, setPlans] = React.useState<Plan[]>([])
  const [subData, setSubData] = React.useState<SubscriptionData | null>(null)
  const [storeName, setStoreName] = React.useState("")
  const [loading, setLoading] = React.useState(true)
  const [actionLoading, setActionLoading] = React.useState<string | null>(null)
  const [selectedProvider, setSelectedProvider] = React.useState("ZAAD")
  const [error, setError] = React.useState("")
  const [success, setSuccess] = React.useState("")

  const features = FEATURES.en

  const fetchData = React.useCallback(async () => {
    setLoading(true)
    try {
      const [plansRes, subRes] = await Promise.all([
        fetch("/api/billing/plans"),
        fetch("/api/billing/subscription"),
      ])
      if (plansRes.ok) {
        const pData = await plansRes.json()
        setPlans(pData.plans)
      }
      if (subRes.ok) {
        const sData = await subRes.json()
        setSubData(sData.subscription)
        setStoreName(sData.store?.name || "")
      }
    } catch {
      console.error("Failed to fetch billing data")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  async function handleSubscribe(planId: string) {
    setActionLoading(planId)
    setError("")
    setSuccess("")
    try {
      const res = await fetch("/api/billing/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: planId,
          provider: planId === "FREE" ? undefined : selectedProvider,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || common("error"))
        return
      }
      setSuccess(t("planUpdated"))
      fetchData()
    } catch {
      setError(common("error"))
    } finally {
      setActionLoading(null)
    }
  }

  async function handleCancel() {
    setActionLoading("cancel")
    setError("")
    setSuccess("")
    try {
      const res = await fetch("/api/billing/cancel", { method: "POST" })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || common("error"))
        return
      }
      setSuccess(t("planCancelled"))
      fetchData()
    } catch {
      setError(common("error"))
    } finally {
      setActionLoading(null)
    }
  }

  async function handleRenew() {
    setActionLoading("renew")
    setError("")
    setSuccess("")
    try {
      const res = await fetch("/api/billing/renew", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: selectedProvider }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || common("error"))
        return
      }
      setSuccess(t("planRenewed"))
      fetchData()
    } catch {
      setError(common("error"))
    } finally {
      setActionLoading(null)
    }
  }

  const providerLabel = (p: string) => {
    const map: Record<string, string> = {
      ZAAD: "ZAAD",
      EVC_PLUS: "EVC Plus",
      SAHAL: "Sahal",
      STRIPE: "Stripe",
    }
    return map[p] || p
  }

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      TRIAL: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
      ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
      CANCELLED: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
      EXPIRED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
      SUSPENDED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
      PENDING: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100",
      COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
      FAILED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
    }
    return colors[status] || ""
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg text-sm">
          {success}
        </div>
      )}

      {subData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("currentPlan")}</CardTitle>
            <CardDescription>{storeName}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">{t("plan")}</p>
                <p className="text-lg font-semibold">
                  {t(subData.plan.toLowerCase())}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("status")}</p>
                <Badge className={`${statusBadge(subData.status)} border-0`}>
                  {t(subData.status.toLowerCase())}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("renewalDate")}</p>
                <p className="text-sm">
                  {subData.renewalDate
                    ? new Date(subData.renewalDate).toLocaleDateString()
                    : "—"}
                </p>
              </div>
              {subData.status === "TRIAL" && (
                <div>
                  <p className="text-sm text-muted-foreground">{t("trialEnds")}</p>
                  <p className="text-sm font-medium">
                    {subData.trialDaysRemaining > 0
                      ? `${subData.trialDaysRemaining} ${t("daysLeft")}`
                      : t("expired")}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            {subData.status !== "CANCELLED" && subData.status !== "EXPIRED" && (
              <Button variant="destructive" size="sm" onClick={handleCancel} disabled={actionLoading === "cancel"}>
                {actionLoading === "cancel" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {t("cancelPlan")}
              </Button>
            )}
            {(subData.status === "EXPIRED" || subData.status === "CANCELLED") && (
              <Button size="sm" onClick={handleRenew} disabled={actionLoading === "renew"}>
                {actionLoading === "renew" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {t("renewPlan")}
              </Button>
            )}
          </CardFooter>
        </Card>
      )}

      <div>
        <h2 className="text-xl font-bold mb-4">{t("planComparison")}</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {plans
            .filter((p) => p.id !== "ENTERPRISE")
            .map((plan) => {
              const isCurrent = subData?.plan === plan.id
              const isFree = plan.id === "FREE"
              return (
                <Card
                  key={plan.id}
                  className={`relative ${isCurrent ? "border-primary ring-1 ring-primary" : ""}`}
                >
                  {isCurrent && (
                    <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                      {t("current")}
                    </Badge>
                  )}
                  <CardHeader>
                    <CardTitle>{t(plan.id.toLowerCase())}</CardTitle>
                    <CardDescription>
                      {isFree ? (
                        <span className="text-2xl font-bold text-foreground">
                          {t("free")}
                        </span>
                      ) : (
                        <span>
                          <span className="text-3xl font-bold text-foreground">
                            ${plan.monthlyPrice}
                          </span>
                          <span className="text-muted-foreground">
                            /{t("month")}
                          </span>
                        </span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {features.map((feat, i) => {
                      const included =
                        plan.id === "PRO"
                          ? feat.premium
                          : plan.id === "BASIC"
                            ? feat.basic
                            : feat.free
                      return (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          {included ? (
                            <Check className="h-4 w-4 text-green-500 shrink-0" />
                          ) : (
                            <X className="h-4 w-4 text-muted-foreground shrink-0" />
                          )}
                          <span
                            className={
                              included ? "" : "text-muted-foreground"
                            }
                          >
                            {feat.label}
                          </span>
                        </div>
                      )
                    })}
                  </CardContent>
                  <CardFooter>
                    {!isCurrent && (
                      <Button
                        className="w-full"
                        variant={isFree ? "outline" : "default"}
                        onClick={() => handleSubscribe(plan.id)}
                        disabled={actionLoading === plan.id}
                      >
                        {actionLoading === plan.id ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        {isFree ? t("downgradeToFree") : t("upgrade")}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              )
            })}
        </div>

        {subData && subData.plan !== "FREE" && (
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {t("payWith")}
            </span>
            <Select
              value={selectedProvider}
              onValueChange={setSelectedProvider}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ZAAD">ZAAD</SelectItem>
                <SelectItem value="EVC_PLUS">EVC Plus</SelectItem>
                <SelectItem value="SAHAL">Sahal</SelectItem>
                <SelectItem value="STRIPE">Stripe</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {subData && subData.payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("paymentHistory")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("date")}</TableHead>
                  <TableHead>{t("amount")}</TableHead>
                  <TableHead>{t("currency")}</TableHead>
                  <TableHead>{t("paymentMethod")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead>{t("reference")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subData.payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-xs">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-mono">
                      ${p.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>{p.currency}</TableCell>
                    <TableCell>{providerLabel(p.provider)}</TableCell>
                    <TableCell>
                      <Badge className={`${statusBadge(p.status)} border-0`}>
                        {t(p.status.toLowerCase())}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {p.providerRef || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
