"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { useSearchParams } from "next/navigation"
import { Check, Loader2, CreditCard } from "lucide-react"
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

const ALL_FEATURES = [
  "POS Sales & Checkout",
  "Inventory Management",
  "Product Management",
  "Customer Management",
  "Supplier Management",
  "Purchase Management",
  "Advanced Reports & Analytics",
  "Multi-User Access",
  "Barcode Scanning",
  "Sales History & Refunds",
  "Backup & Restore",
  "API Access",
  "Priority Support",
]

function getPlanPrice(plans: Plan[], planId: string): number {
  return plans.find((p) => p.id === planId)?.monthlyPrice ?? 20
}

export function BillingPage() {
  const t = useTranslations("billing")
  const common = useTranslations("common")
  const searchParams = useSearchParams()

  const [plans, setPlans] = React.useState<Plan[]>([])
  const [subData, setSubData] = React.useState<SubscriptionData | null>(null)
  const [storeName, setStoreName] = React.useState("")
  const [loading, setLoading] = React.useState(true)
  const [actionLoading, setActionLoading] = React.useState<string | null>(null)
  const [error, setError] = React.useState("")
  const [success, setSuccess] = React.useState("")

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

  React.useEffect(() => {
    const successParam = searchParams.get("success")
    const errorParam = searchParams.get("error")
    const sessionId = searchParams.get("session_id")
    if (sessionId || successParam === "payment_completed" || successParam === "already_active") {
      setSuccess(t("planUpdated"))
      fetchData()
    } else if (errorParam === "payment_failed" || searchParams.get("canceled") === "true") {
      setError(t("paymentFailed"))
    } else if (errorParam === "payment_pending") {
      setSuccess(t("paymentPending"))
    } else if (errorParam) {
      setError(t("paymentError"))
    }
  }, [searchParams, t, fetchData])

  const isActive = true // TEMPORARILY UNLOCKED - revert to: subData?.status === "ACTIVE"

  async function handleSubscribe() {
    setActionLoading("subscribe")
    setError("")
    setSuccess("")
    try {
      const res = await fetch("/api/billing/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: "PREMIUM",
          provider: "SAHAL",
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || common("error"))
        return
      }
      if (data.payment?.checkoutUrl) {
        window.location.href = data.payment.checkoutUrl
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
    <div className="max-w-2xl mx-auto space-y-8">
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

      {subData && subData.status !== "ACTIVE" && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="text-lg text-amber-800 dark:text-amber-200">
              {t("subscriptionRequired")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-amber-700 dark:text-amber-300 text-sm">
              {t("payToUnlock")}
            </p>
          </CardContent>
        </Card>
      )}

      {subData && isActive && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("currentPlan")}</CardTitle>
            <CardDescription>{storeName}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">{t("plan")}</p>
                <p className="text-lg font-semibold">
                  {t("premium")}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("status")}</p>
                <Badge className={`${statusBadge(subData.status)} border-0`}>
                  {t(subData.status.toLowerCase())}
                </Badge>
              </div>
              {subData.renewalDate && (
                <div>
                  <p className="text-sm text-muted-foreground">{t("renewalDate")}</p>
                  <p className="text-sm">
                    {new Date(subData.renewalDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button variant="destructive" size="sm" onClick={handleCancel} disabled={actionLoading === "cancel"}>
              {actionLoading === "cancel" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {t("cancelPlan")}
            </Button>
          </CardFooter>
        </Card>
      )}

      <Card className={isActive ? "border-primary ring-1 ring-primary" : ""}>
        <CardHeader>
          <CardTitle>
            {t("premium")}
          </CardTitle>
          <CardDescription>
            <span className="text-3xl font-bold text-foreground">
              $20
            </span>
            <span className="text-muted-foreground">
              /{t("month")}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {ALL_FEATURES.map((feat, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              {isActive ? (
                <Check className="h-4 w-4 text-green-500 shrink-0" />
              ) : (
                <span className="text-lg">🔒</span>
              )}
              <span className={isActive ? "" : "text-muted-foreground"}>
                {feat}
              </span>
            </div>
          ))}
        </CardContent>
        <CardFooter>
          {isActive ? (
            <Button className="w-full" variant="outline" disabled>
              {t("current")}
            </Button>
          ) : (
            <Button
              className="w-full"
              onClick={handleSubscribe}
              disabled={actionLoading === "subscribe"}
            >
              {actionLoading === "subscribe" ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CreditCard className="h-4 w-4 mr-2" />
              )}
              {t("subscribeCard")}
            </Button>
          )}
        </CardFooter>
      </Card>

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