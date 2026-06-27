"use client"

import * as React from "react"
import { BarChart3, Package, AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { PharmacyLayout } from "@/components/pharmacy/pharmacy-layout"

function getExpiryStatus(expiryDate: string) {
  const now = new Date()
  const expiry = new Date(expiryDate)
  const diffMs = expiry.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return { label: "Expired", variant: "destructive" as const }
  if (diffDays <= 30) return { label: "Expiring Soon", variant: "warning" as const }
  return { label: "Valid", variant: "success" as const }
}

export default function PharmacyReportsPage() {
  const [activeTab, setActiveTab] = React.useState("sales")

  return (
    <PharmacyLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pharmacy Reports</h1>
          <p className="text-muted-foreground">Pharmacy analytics and reports</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex-wrap">
            <TabsTrigger value="sales">Medicine Sales</TabsTrigger>
            <TabsTrigger value="expiry">Expiry Report</TabsTrigger>
            <TabsTrigger value="batches">Batch Report</TabsTrigger>
            <TabsTrigger value="purchases">Purchase Report</TabsTrigger>
            <TabsTrigger value="movement">Stock Movement</TabsTrigger>
            <TabsTrigger value="lowstock">Low Stock</TabsTrigger>
          </TabsList>

          <TabsContent value="sales">
            <SalesReport />
          </TabsContent>

          <TabsContent value="expiry">
            <ExpiryReport />
          </TabsContent>

          <TabsContent value="batches">
            <BatchReport />
          </TabsContent>

          <TabsContent value="purchases">
            <PurchaseReport />
          </TabsContent>

          <TabsContent value="movement">
            <StockMovementReport />
          </TabsContent>

          <TabsContent value="lowstock">
            <LowStockReport />
          </TabsContent>
        </Tabs>
      </div>
    </PharmacyLayout>
  )
}

interface SaleItem {
  id: string
  quantity: number
  unitPrice: number
  total: number
  product: { name: string }
  createdAt: string
}

function SalesReport() {
  const [data, setData] = React.useState<SaleItem[] | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    fetch("/api/pharmacy/reports/sales")
      .then((r) => r.json())
      .then((d) => setData(d.sales || d || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="space-y-2"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div>

  return (
    <Card>
      <CardHeader>
        <CardTitle>Medicine Sales</CardTitle>
        <CardDescription>Sales of medicine products</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Unit Price</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!data || data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                  No sales data
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.product.name}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">${item.unitPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-medium">${item.total.toFixed(2)}</TableCell>
                  <TableCell>{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

interface BatchReportItem {
  id: string
  batchNumber: string
  expiryDate: string
  quantity: number
  purchasePrice: number | null
  sellingPrice: number | null
  product: { name: string }
}

function ExpiryReport() {
  const [data, setData] = React.useState<BatchReportItem[] | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    fetch("/api/pharmacy/reports/expiry")
      .then((r) => r.json())
      .then((d) => setData(d.batches || d || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="space-y-2"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div>

  const expired = (data || []).filter((b) => getExpiryStatus(b.expiryDate).label === "Expired")
  const expiringSoon = (data || []).filter((b) => getExpiryStatus(b.expiryDate).label === "Expiring Soon")

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle>Expired Batches</CardTitle>
          </div>
          <CardDescription>{expired.length} expired batch(es)</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Batch #</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead className="text-right">Qty</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expired.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">None</TableCell></TableRow>
              ) : (
                expired.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>{b.product.name}</TableCell>
                    <TableCell className="font-mono text-sm">{b.batchNumber}</TableCell>
                    <TableCell>{new Date(b.expiryDate).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">{b.quantity}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <CardTitle>Expiring Soon (30 days)</CardTitle>
          </div>
          <CardDescription>{expiringSoon.length} batch(es) expiring soon</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Batch #</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead className="text-right">Qty</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expiringSoon.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">None</TableCell></TableRow>
              ) : (
                expiringSoon.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>{b.product.name}</TableCell>
                    <TableCell className="font-mono text-sm">{b.batchNumber}</TableCell>
                    <TableCell>{new Date(b.expiryDate).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">{b.quantity}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function BatchReport() {
  const [data, setData] = React.useState<BatchReportItem[] | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    fetch("/api/pharmacy/reports/batches")
      .then((r) => r.json())
      .then((d) => setData(d.batches || d || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="space-y-2"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div>

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Batches</CardTitle>
        <CardDescription>Complete batch inventory</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Batch #</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Cost</TableHead>
              <TableHead className="text-right">Selling</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!data || data.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">No batches</TableCell></TableRow>
            ) : (
              data.map((b) => {
                const status = getExpiryStatus(b.expiryDate)
                return (
                  <TableRow key={b.id}>
                    <TableCell>{b.product.name}</TableCell>
                    <TableCell className="font-mono text-sm">{b.batchNumber}</TableCell>
                    <TableCell>{new Date(b.expiryDate).toLocaleDateString()}</TableCell>
                    <TableCell><Badge variant={status.variant}>{status.label}</Badge></TableCell>
                    <TableCell className="text-right">{b.quantity}</TableCell>
                    <TableCell className="text-right">{b.purchasePrice != null ? `$${b.purchasePrice.toFixed(2)}` : "-"}</TableCell>
                    <TableCell className="text-right">{b.sellingPrice != null ? `$${b.sellingPrice.toFixed(2)}` : "-"}</TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

interface PurchaseReportItem {
  id: string
  purchaseNumber: string
  supplierName: string
  purchaseDate: string
  totalAmount: number
  status: string
}

function PurchaseReport() {
  const [data, setData] = React.useState<PurchaseReportItem[] | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    fetch("/api/pharmacy/reports/purchases")
      .then((r) => r.json())
      .then((d) => setData(d.purchases || d || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="space-y-2"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div>

  return (
    <Card>
      <CardHeader>
        <CardTitle>Purchase Report</CardTitle>
        <CardDescription>All purchase orders</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Purchase #</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!data || data.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No purchases</TableCell></TableRow>
            ) : (
              data.map((p) => {
                const sv = p.status === "completed" ? "success" : p.status === "pending" ? "warning" : "destructive"
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-sm font-medium">{p.purchaseNumber}</TableCell>
                    <TableCell>{p.supplierName}</TableCell>
                    <TableCell>{new Date(p.purchaseDate).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right font-medium">${p.totalAmount.toFixed(2)}</TableCell>
                    <TableCell><Badge variant={sv as any}>{p.status}</Badge></TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

interface MovementItem {
  id: string
  product: { name: string }
  quantity: number
  type: string
  reference: string | null
  createdAt: string
}

function StockMovementReport() {
  const [data, setData] = React.useState<MovementItem[] | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    fetch("/api/pharmacy/reports/stock-movement")
      .then((r) => r.json())
      .then((d) => setData(d.movements || d || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="space-y-2"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div>

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Movement</CardTitle>
        <CardDescription>Inventory movement history</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!data || data.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No movements</TableCell></TableRow>
            ) : (
              data.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.product.name}</TableCell>
                  <TableCell className={`text-right font-medium ${m.quantity < 0 ? "text-destructive" : "text-emerald-600"}`}>
                    {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{m.type}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{m.reference || "-"}</TableCell>
                  <TableCell>{new Date(m.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

interface LowStockItem {
  id: string
  name: string
  stockQuantity: number
  minimumStock: number
}

function LowStockReport() {
  const [data, setData] = React.useState<LowStockItem[] | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    fetch("/api/pharmacy/reports/low-stock")
      .then((r) => r.json())
      .then((d) => setData(d.products || d || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="space-y-2"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div>

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-amber-500" />
          <CardTitle>Low Stock Products</CardTitle>
        </div>
        <CardDescription>Products below minimum stock level</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Current Stock</TableHead>
              <TableHead className="text-right">Minimum</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!data || data.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">All products are well-stocked</TableCell></TableRow>
            ) : (
              data.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-right text-destructive font-medium">{p.stockQuantity}</TableCell>
                  <TableCell className="text-right">{p.minimumStock}</TableCell>
                  <TableCell><Badge variant="destructive">Low Stock</Badge></TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
