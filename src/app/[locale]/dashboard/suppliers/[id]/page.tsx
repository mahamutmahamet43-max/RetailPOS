import { getTranslations } from "next-intl/server"
import Link from "next/link"
import { ArrowLeft, Package, DollarSign, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface PurchaseItem {
  id: string
  productName: string
  quantity: number
  costPrice: number
  total: number
}

interface Purchase {
  id: string
  invoiceNumber: string
  createdAt: string
  total: number
  status: "PENDING" | "COMPLETED" | "CANCELLED"
  items: PurchaseItem[]
}

interface Supplier {
  id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  notes: string | null
  createdAt: string
  storeId: string
  _count: { purchases: number }
  purchases: Purchase[]
}

async function getSupplier(id: string): Promise<Supplier | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const res = await fetch(`${baseUrl}/api/suppliers/${id}`, {
      cache: "no-store",
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

function statusVariant(status: string) {
  switch (status) {
    case "COMPLETED":
      return "success" as const
    case "PENDING":
      return "warning" as const
    case "CANCELLED":
      return "destructive" as const
    default:
      return "secondary" as const
  }
}

export default async function SupplierDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { id } = await params
  const t = await getTranslations("suppliers")
  const common = await getTranslations("common")

  const supplier = await getSupplier(id)

  if (!supplier) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">{common("noResults")}</p>
      </div>
    )
  }

  const totalSpent = supplier.purchases.reduce(
    (sum, p) => sum + p.total,
    0
  )
  const lastPurchase = supplier.purchases.length > 0 ? supplier.purchases[0] : null

  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild>
        <Link href="/dashboard/suppliers">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {common("back")}
        </Link>
      </Button>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">{supplier.name}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("supplierInfo")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">{t("name")}</p>
            <p>{supplier.name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t("phone")}</p>
            <p>{supplier.phone || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t("email")}</p>
            <p>{supplier.email || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t("address")}</p>
            <p>{supplier.address || "-"}</p>
          </div>
          {supplier.notes && (
            <div className="sm:col-span-2">
              <p className="text-sm text-muted-foreground">{t("notes")}</p>
              <p className="whitespace-pre-wrap">{supplier.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t("purchases")}
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {supplier._count.purchases}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t("totalSpent")}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalSpent.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t("lastPurchase")}
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {lastPurchase
                ? new Date(lastPurchase.createdAt).toLocaleDateString()
                : "-"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("purchaseHistory")}</CardTitle>
        </CardHeader>
        <CardContent>
          {supplier.purchases.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Package className="mx-auto mb-2 h-8 w-8 opacity-50" />
              <p>{t("noPurchases")}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("invoice")}</TableHead>
                  <TableHead>{t("date")}</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>{common("status")}</TableHead>
                  <TableHead className="text-right">
                    {t("totalAmount")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supplier.purchases.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell className="font-mono text-xs font-medium">
                      {purchase.invoiceNumber}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(purchase.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{purchase.items.length}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(purchase.status)}>
                        {common(purchase.status.toLowerCase())}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${purchase.total.toFixed(2)}
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
