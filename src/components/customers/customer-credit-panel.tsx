"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Banknote, CreditCard, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"

interface Payment {
  id: string
  amount: number
  paymentMethod: string
  reference: string | null
  notes: string | null
  createdAt: string
  cashier: { id: string; name: string } | null
  sale: { saleNumber: string } | null
}

interface CustomerCreditPanelProps {
  customerId: string
  initialBalance: number
  initialTotalPaid: number
  initialTotalCreditSales: number
  initialLastPaymentDate: string | null
  initialPayments: Payment[]
}

export function CustomerCreditPanel({
  customerId,
  initialBalance,
  initialTotalPaid,
  initialTotalCreditSales,
  initialLastPaymentDate,
  initialPayments,
}: CustomerCreditPanelProps) {
  const t = useTranslations("customers")
  const common = useTranslations("common")
  const [balance, setBalance] = React.useState(initialBalance)
  const [totalPaid, setTotalPaid] = React.useState(initialTotalPaid)
  const [payments, setPayments] = React.useState<Payment[]>(initialPayments)
  const [amount, setAmount] = React.useState("")
  const [paymentMethod, setPaymentMethod] = React.useState("CASH")
  const [reference, setReference] = React.useState("")
  const [notes, setNotes] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)

  async function handlePayment(e: React.FormEvent) {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) {
      toast.error("Amount must be positive")
      return
    }
    if (amt > balance) {
      toast.error(`Payment amount ($${amt.toFixed(2)}) exceeds outstanding balance ($${balance.toFixed(2)})`)
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/customers/${customerId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amt,
          paymentMethod,
          reference: reference || null,
          notes: notes || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || common("error"))
        return
      }
      const data = await res.json()
      setBalance((prev) => prev - amt)
      setTotalPaid((prev) => prev + amt)
      setPayments((prev) => [data.payment, ...prev])
      setAmount("")
      setReference("")
      setNotes("")
      toast.success(t("paymentCreated"))
    } catch {
      toast.error(common("error"))
    } finally {
      setSubmitting(false)
    }
  }

  const paymentLabel = (method: string) => {
    const map: Record<string, string> = {
      CASH: common("cash") || "Cash",
      SAHAL: "Sahal",
      ZAAD: "ZAAD",
      EVC_PLUS: "EVC Plus",
      CARD: common("card") || "Card",
    }
    return map[method] || method
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("outstandingBalance")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">${balance.toFixed(2)}</div>
          <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
            <span>{t("totalPaid")}: ${totalPaid.toFixed(2)}</span>
            <span>{t("totalCreditSales")}: ${initialTotalCreditSales.toFixed(2)}</span>
            {initialLastPaymentDate && (
              <span>{t("lastPaymentDate")}: {new Date(initialLastPaymentDate).toLocaleDateString()}</span>
            )}
          </div>
        </CardContent>
      </Card>

      {balance > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("receivePayment")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePayment} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>{t("paymentAmount")}</Label>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    max={balance}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label>{t("paymentMethod")}</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">{common("cash")}</SelectItem>
                      <SelectItem value="SAHAL">Sahal</SelectItem>
                      <SelectItem value="ZAAD">ZAAD</SelectItem>
                      <SelectItem value="EVC_PLUS">EVC Plus</SelectItem>
                      <SelectItem value="CARD">{common("card")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>{t("paymentReference")}</Label>
                  <Input
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder={t("paymentReference")}
                  />
                </div>
                <div className="space-y-1">
                  <Label>{t("paymentNotes")}</Label>
                  <Input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t("paymentNotes")}
                  />
                </div>
              </div>
              <Button type="submit" disabled={submitting || !amount || parseFloat(amount) <= 0}>
                {submitting ? common("loading") : t("receivePayment")}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("paymentsReceived")}</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">{t("noPayments")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{common("date")}</TableHead>
                  <TableHead>{t("paymentMethod")}</TableHead>
                  <TableHead>{t("paymentAmount")}</TableHead>
                  <TableHead>{t("paymentReference")}</TableHead>
                  <TableHead>{t("paymentNotes")}</TableHead>
                  <TableHead>{t("cashier")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-xs whitespace-nowrap">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{paymentLabel(p.paymentMethod)}</Badge>
                    </TableCell>
                    <TableCell className="font-mono font-medium">${p.amount.toFixed(2)}</TableCell>
                    <TableCell className="text-xs">{p.reference || "—"}</TableCell>
                    <TableCell className="text-xs max-w-[120px] truncate">{p.notes || "—"}</TableCell>
                    <TableCell className="text-xs">{p.cashier?.name || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}