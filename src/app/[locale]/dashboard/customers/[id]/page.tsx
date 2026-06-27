import { getTranslations } from "next-intl/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface SaleItem {
  id: string
  productName: string
  quantity: number
  unitPrice: number
  total: number
}

interface CustomerSale {
  id: string
  saleNumber: string
  createdAt: string
  total: number
  paymentMethod: string
  status: string
  items: SaleItem[]
  cashier: { name: string } | null
}

interface Customer {
  id: string
  customerCode: string
  firstName: string
  lastName: string | null
  companyName: string | null
  phone: string
  email: string | null
  address: string | null
  city: string | null
  notes: string | null
  creditLimit: number
  currentBalance: number
  isActive: boolean
  createdAt: string
  storeId: string
  _count: { sales: number }
  sales: CustomerSale[]
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  const t = await getTranslations("customers")
  const common = await getTranslations("common")
  const salesT = await getTranslations("sales")

  const res = await fetch(`/api/customers/${id}`, { cache: "no-store" })

  if (!res.ok) {
    if (res.status === 404) notFound()
    throw new Error("Failed to fetch customer")
  }

  const customer: Customer = await res.json()

  const fullName = customer.lastName
    ? `${customer.firstName} ${customer.lastName}`
    : customer.firstName

  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild>
        <Link href={`/${locale}/dashboard/customers`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {common("back")}
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{t("customerInfo")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <div className="text-sm text-muted-foreground">{t("fullName")}</div>
            <div className="font-medium">{fullName}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">{t("customerCode")}</div>
            <div className="font-medium">{customer.customerCode}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">{t("phone")}</div>
            <div className="font-medium">{customer.phone}</div>
          </div>
          {customer.email && (
            <div>
              <div className="text-sm text-muted-foreground">{t("email")}</div>
              <div className="font-medium">{customer.email}</div>
            </div>
          )}
          {customer.address && (
            <div>
              <div className="text-sm text-muted-foreground">{t("address")}</div>
              <div className="font-medium">{customer.address}</div>
            </div>
          )}
          {customer.city && (
            <div>
              <div className="text-sm text-muted-foreground">{t("city")}</div>
              <div className="font-medium">{customer.city}</div>
            </div>
          )}
          {customer.companyName && (
            <div>
              <div className="text-sm text-muted-foreground">{t("company")}</div>
              <div className="font-medium">{customer.companyName}</div>
            </div>
          )}
          <div>
            <div className="text-sm text-muted-foreground">{t("balance")}</div>
            <div className="font-medium">${customer.currentBalance.toFixed(2)}</div>
          </div>
          {customer.creditLimit > 0 && (
            <div>
              <div className="text-sm text-muted-foreground">{t("creditLimit")}</div>
              <div className="font-medium">${customer.creditLimit.toFixed(2)}</div>
            </div>
          )}
          <div>
            <div className="text-sm text-muted-foreground">{common("status")}</div>
            <Badge variant={customer.isActive ? "success" : "secondary"}>
              {customer.isActive ? t("active") : t("inactive")}
            </Badge>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">{t("totalSales")}</div>
            <div className="font-medium">{customer._count.sales}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("salesHistory")}</CardTitle>
        </CardHeader>
        <CardContent>
          {customer.sales.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {t("noSales")}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("saleNumber")}</TableHead>
                  <TableHead>{salesT("date")}</TableHead>
                  <TableHead>{salesT("items")}</TableHead>
                  <TableHead>{t("cashier")}</TableHead>
                  <TableHead className="text-right">{salesT("total")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customer.sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">
                      {sale.saleNumber}
                    </TableCell>
                    <TableCell>
                      {new Date(sale.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>{sale.items.length}</TableCell>
                    <TableCell>{sale.cashier?.name || "—"}</TableCell>
                    <TableCell className="text-right font-mono">
                      ${sale.total.toFixed(2)}
                    </TableCell>
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
