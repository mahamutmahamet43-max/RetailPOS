"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"

interface ReceiptItem {
  productName: string
  quantity: number
  unitPrice: number
  discount: number
  total: number
}

interface ReceiptSale {
  id: string
  saleNumber: string
  subtotal: number
  discount: number
  tax: number
  total: number
  amountPaid: number
  changeGiven: number
  paymentMethod: string
  createdAt: string
  status: string
  cashier: { id: string; name: string | null }
  customer?: { firstName: string; lastName: string | null } | null
  items: ReceiptItem[]
}

interface ReceiptProps {
  sale: ReceiptSale
  storeName: string
  storeAddress: string
  storePhone: string
  onPrint?: () => void
}

export function Receipt({
  sale,
  storeName,
  storeAddress,
  storePhone,
  onPrint,
}: ReceiptProps) {
  const t = useTranslations("sales")

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

  const statusLabel = sale.status === "VOID" ? ` (${t("voided")})` : ""

  return (
    <div className="max-w-sm mx-auto p-8 print:p-0">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold">{storeName}</h2>
        {storeAddress && (
          <p className="text-sm text-muted-foreground">{storeAddress}</p>
        )}
        {storePhone && (
          <p className="text-sm text-muted-foreground">{storePhone}</p>
        )}
      </div>

      <div className="border-t border-b py-2 mb-4 text-sm space-y-1">
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t("saleNumber")}</span>
          <span className="font-mono">
            {sale.saleNumber}
            {statusLabel}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t("date")}</span>
          <span>{new Date(sale.createdAt).toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t("cashierLabel")}</span>
          <span>{sale.cashier.name || "—"}</span>
        </div>
        {sale.customer && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("customer")}</span>
            <span>
              {sale.customer.firstName} {sale.customer.lastName || ""}
            </span>
          </div>
        )}
      </div>

      <table className="w-full text-sm mb-4">
        <thead>
          <tr className="border-b text-muted-foreground">
            <th className="text-left pb-1 font-medium">{t("item")}</th>
            <th className="text-right pb-1 font-medium">{t("qty")}</th>
            <th className="text-right pb-1 font-medium">{t("price")}</th>
            <th className="text-right pb-1 font-medium">{t("discount")}</th>
            <th className="text-right pb-1 font-medium">{t("total")}</th>
          </tr>
        </thead>
        <tbody>
          {sale.items.map((item, idx) => (
            <tr key={idx} className="border-b last:border-0">
              <td className="py-1 max-w-[120px] truncate">
                {item.productName}
              </td>
              <td className="text-right py-1">{item.quantity}</td>
              <td className="text-right py-1 font-mono">
                ${item.unitPrice.toFixed(2)}
              </td>
              <td className="text-right py-1 font-mono">
                {item.discount > 0 ? `-$${item.discount.toFixed(2)}` : "—"}
              </td>
              <td className="text-right py-1 font-mono">
                ${item.total.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="space-y-1 text-sm border-t pt-2">
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t("subtotal")}</span>
          <span className="font-mono">${sale.subtotal.toFixed(2)}</span>
        </div>
        {sale.discount > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("discount")}</span>
            <span className="font-mono text-destructive">
              -${sale.discount.toFixed(2)}
            </span>
          </div>
        )}
        {sale.tax > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("tax")}</span>
            <span className="font-mono">${sale.tax.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-lg border-t pt-1">
          <span>{t("grandTotal")}</span>
          <span className="font-mono">${sale.total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t("paymentMethod")}</span>
          <span>{paymentLabel(sale.paymentMethod)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t("amountPaid")}</span>
          <span className="font-mono">${sale.amountPaid.toFixed(2)}</span>
        </div>
        {sale.changeGiven > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t("change")}</span>
            <span className="font-mono">${sale.changeGiven.toFixed(2)}</span>
          </div>
        )}
      </div>

      <div className="text-center mt-8 text-sm text-muted-foreground">
        <p>{t("thankYou")}</p>
      </div>

      <div className="mt-6 print:hidden">
        <Button className="w-full" onClick={onPrint}>
          <Printer className="mr-2 h-4 w-4" />
          {t("printReceipt")}
        </Button>
      </div>
    </div>
  )
}
