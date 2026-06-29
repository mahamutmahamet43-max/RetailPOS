"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Printer,
  X,
  User,
  Camera,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Receipt } from "@/components/sales/receipt"

interface ProductUnit {
  id: string
  name: string
  conversionFactor: number
  sellingPrice: number
  isDefaultSaleUnit: boolean
}

interface CartItem {
  productId: string
  productName: string
  barcode: string | null
  quantity: number
  unitPrice: number
  stockQuantity: number
  discount: number
  productUnitId: string | null
  unitName: string
  unitConversionFactor: number
  units: ProductUnit[]
}

interface Customer {
  id: string
  firstName: string
  lastName: string | null
  phone: string
}

interface ProductResult {
  id: string
  name: string
  sku: string | null
  barcode: string | null
  unit: string | null
  expiryDate: string | null
  sellingPrice: number
  stockQuantity: number
  minimumStock: number
  units: ProductUnit[]
}

const STORAGE_KEY = "retailpos-pos-cart"

function loadCart(): CartItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveCart(cart: CartItem[]) {
  if (typeof window === "undefined") return
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)) } catch {}
}

export function PosPage() {
  const t = useTranslations("sales")
  const common = useTranslations("common")

  const [barcode, setBarcode] = React.useState("")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [searchResults, setSearchResults] = React.useState<ProductResult[]>([])
  const [cart, setCart] = React.useState<CartItem[]>(loadCart)
  const [customers, setCustomers] = React.useState<Customer[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = React.useState("")
  const [paymentMethod, setPaymentMethod] = React.useState("CASH")
  const [amountPaid, setAmountPaid] = React.useState("")
  const [discount, setDiscount] = React.useState("0")
  const [tax, setTax] = React.useState("0")
  const [checkingOut, setCheckingOut] = React.useState(false)
  const [error, setError] = React.useState("")
  const [lastSale, setLastSale] = React.useState<any>(null)
  const [customerPurchases, setCustomerPurchases] = React.useState<any[]>([])
  const [showScanner, setShowScanner] = React.useState(false)
  const [showReceipt, setShowReceipt] = React.useState(false)
  const [storeInfo, setStoreInfo] = React.useState({ name: "", address: "", phone: "" })
  const barcodeRef = React.useRef<HTMLInputElement>(null)
  const searchRef = React.useRef<HTMLInputElement>(null)

  const subtotal = cart.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  )
  const cartDiscount = cart.reduce((sum, item) => sum + item.discount, 0)
  const saleDiscount = parseFloat(discount) || 0
  const saleTax = parseFloat(tax) || 0
  const totalDiscount = cartDiscount + saleDiscount
  const grandTotal = subtotal - saleDiscount + saleTax
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
  const changeGiven = Math.max(0, (parseFloat(amountPaid) || 0) - grandTotal)

  React.useEffect(() => {
    if (barcodeRef.current) barcodeRef.current.focus()
    fetch("/api/settings/store")
      .then((r) => r.json())
      .then((data) => {
        if (data.name) setStoreInfo({ name: data.name, address: data.settings?.address || "", phone: data.settings?.phone || "" })
      })
      .catch(() => {})
  }, [])

  React.useEffect(() => {
    saveCart(cart)
  }, [cart])

  React.useEffect(() => {
    fetch("/api/customers?limit=1000")
      .then((r) => r.json())
      .then((data) => setCustomers(data.customers || []))
      .catch(() => {})
  }, [])

  React.useEffect(() => {
    if (!selectedCustomerId) {
      setCustomerPurchases([])
      return
    }
    fetch(`/api/customers/${selectedCustomerId}`)
      .then((r) => r.json())
      .then((data) => setCustomerPurchases(data.sales || []))
      .catch(() => setCustomerPurchases([]))
  }, [selectedCustomerId])

  React.useEffect(() => {
    if (!showScanner) return
    let scanner: any = null
    let running = false
    import("html5-qrcode").then(({ Html5Qrcode }) => {
      scanner = new Html5Qrcode("barcode-scanner")
      scanner.start(
        { facingMode: "environment" },
        { fps: 24, qrbox: { width: 500, height: 350 } },
        (decodedText: string) => {
          setBarcode(decodedText)
          running = false
          scanner.stop().catch(() => {})
          setShowScanner(false)
          setTimeout(() => {
            const form = document.querySelector("form")
            if (form) form.requestSubmit()
          }, 100)
        },
        () => {}
      ).then(() => { running = true }).catch(() => {})
    })
    return () => {
      if (scanner && running) scanner.stop().catch(() => {})
    }
  }, [showScanner])

  async function handleBarcodeSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!barcode.trim()) return
    try {
      const res = await fetch(
        `/api/products?search=${encodeURIComponent(barcode.trim())}&limit=1`
      )
      if (res.ok) {
        const data = await res.json()
        const product = data.products?.[0]
        if (!product) {
          toast.error(`No product found with barcode "${barcode.trim()}"`)
        } else if (product.stockQuantity <= 0) {
          toast.error(`"${product.name}" is out of stock`)
        } else {
          addToCart(product)
        }
      } else {
        toast.error("Barcode lookup failed")
      }
    } catch {
      toast.error("Barcode lookup failed")
    }
    setBarcode("")
    if (barcodeRef.current) barcodeRef.current.focus()
  }

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (!searchQuery.trim()) {
        setSearchResults([])
        return
      }
      fetch(`/api/products?search=${encodeURIComponent(searchQuery)}&limit=10`)
        .then((r) => r.json())
        .then((data) => setSearchResults(data.products || []))
        .catch(() => {})
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  function getDefaultUnit(product: ProductResult): { productUnitId: string | null; unitName: string; unitConversionFactor: number; unitPrice: number } {
    if (!product.units || product.units.length === 0) {
      return { productUnitId: null, unitName: product.unit || "pcs", unitConversionFactor: 1, unitPrice: product.sellingPrice }
    }
    const defaultUnit = product.units.find((u) => u.isDefaultSaleUnit) || product.units[0]
    return {
      productUnitId: defaultUnit.id,
      unitName: defaultUnit.name,
      unitConversionFactor: defaultUnit.conversionFactor,
      unitPrice: Number(defaultUnit.sellingPrice) || product.sellingPrice,
    }
  }

  function addToCart(product: ProductResult) {
    if (product.expiryDate) {
      const expired = new Date(product.expiryDate) < new Date(new Date().toDateString())
      if (expired) {
        toast.error(`"${product.name}" expired on ${new Date(product.expiryDate).toLocaleDateString()}. Cannot add to cart.`)
        return
      }
    }
    if (product.minimumStock > 0 && product.stockQuantity <= product.minimumStock) {
      toast.warning(`"${product.name}" has only ${product.stockQuantity} in stock (min: ${product.minimumStock})`)
    }
    const unitInfo = getDefaultUnit(product)
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id)
      if (existing) {
        if (existing.quantity >= product.stockQuantity) return prev
        return prev.map((i) =>
          i.productId === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          barcode: product.barcode,
          quantity: 1,
          unitPrice: unitInfo.unitPrice,
          stockQuantity: product.stockQuantity,
          discount: 0,
          productUnitId: unitInfo.productUnitId,
          unitName: unitInfo.unitName,
          unitConversionFactor: unitInfo.unitConversionFactor,
          units: product.units || [],
        },
      ]
    })
    setSearchResults([])
    setSearchQuery("")
    if (barcodeRef.current) barcodeRef.current.focus()
  }

  function updateQuantity(productId: string, newQty: number) {
    setCart((prev) => {
      const item = prev.find((i) => i.productId === productId)
      if (!item) return prev
      if (newQty <= 0) return prev.filter((i) => i.productId !== productId)
      if (newQty > item.stockQuantity) newQty = item.stockQuantity
      return prev.map((i) =>
        i.productId === productId ? { ...i, quantity: newQty } : i
      )
    })
  }

  function changeUnit(productId: string, unitId: string) {
    setCart((prev) =>
      prev.map((item) => {
        if (item.productId !== productId) return item
        const unit = item.units.find((u) => u.id === unitId)
        if (!unit) return item
        return {
          ...item,
          productUnitId: unit.id,
          unitName: unit.name,
          unitConversionFactor: unit.conversionFactor,
          unitPrice: Number(unit.sellingPrice) || 0,
        }
      })
    )
  }

  function removeItem(productId: string) {
    setCart((prev) => prev.filter((i) => i.productId !== productId))
  }

  function clearCart() {
    setCart([])
    setDiscount("0")
    setTax("0")
    setAmountPaid("")
    setError("")
  }

  async function handleCheckout() {
    if (cart.length === 0) {
      setError(t("emptyCart"))
      return
    }
    if (paymentMethod === "CASH" && (!amountPaid || parseFloat(amountPaid) < grandTotal)) {
      setError(t("insufficientPayment"))
      return
    }
    setCheckingOut(true)
    setError("")

    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            barcode: item.barcode,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
            productUnitId: item.productUnitId,
            unitName: item.unitName,
            unitConversionFactor: item.unitConversionFactor,
          })),
          customerId: selectedCustomerId || null,
          paymentMethod,
          amountPaid: paymentMethod === "CASH" ? parseFloat(amountPaid) : grandTotal,
          discount: saleDiscount,
          tax: saleTax,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || common("error"))
        return
      }

      const sale = await res.json()
      setLastSale(sale)
      clearCart()
      setShowReceipt(true)
    } catch {
      setError(common("error"))
    } finally {
      setCheckingOut(false)
    }
  }

  function handlePrintReceipt() {
    setShowReceipt(false)
    setTimeout(() => {
      window.print()
    }, 100)
  }

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-4 min-h-[calc(100vh-12rem)] lg:h-[calc(100vh-12rem)]">
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={barcodeRef}
                placeholder={t("scanBarcode")}
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="pl-8 h-11 lg:h-9"
              />
            </div>
            <Button type="button" variant="outline" size="icon" className="shrink-0 h-11 lg:h-9 w-11 lg:w-9" onClick={() => setShowScanner(true)}>
              <Camera className="h-4 w-4" />
            </Button>
          </form>

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchRef}
              placeholder={t("searchProducts")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-11 lg:h-9"
            />
            {searchResults.length > 0 && (
              <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto shadow-lg">
                <CardContent className="p-1">
                  {searchResults.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => addToCart(product)}
                      className="w-full flex items-center justify-between px-3 py-3 lg:py-2 text-sm hover:bg-accent rounded-sm text-left min-h-11"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="font-medium">{product.name}</span>
                        {product.expiryDate && new Date(product.expiryDate) < new Date(new Date().toDateString()) && (
                          <span className="ml-2 text-xs text-destructive font-semibold">{t("expired")}</span>
                        )}
                        {product.minimumStock > 0 && product.stockQuantity <= product.minimumStock && (
                          <span className="ml-2 text-xs text-amber-600 font-semibold">{t("lowStock")}</span>
                        )}
                        {product.barcode && (
                          <span className="ml-2 text-xs text-muted-foreground font-mono">{product.barcode}</span>
                        )}
                      </div>
                      <div className="text-right text-xs text-muted-foreground shrink-0 ml-2">
                        <div>{t("currencySymbol")}{product.sellingPrice.toFixed(2)}</div>
                        <div>
                          {t("stock")}: {product.stockQuantity}
                        </div>
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="flex-1 rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30%]">{t("product")}</TableHead>
                  <TableHead className="w-[12%] hidden sm:table-cell">{t("unit")}</TableHead>
                  <TableHead className="text-right w-[13%]">{t("qty")}</TableHead>
                  <TableHead className="text-right w-[13%] hidden sm:table-cell">{t("price")}</TableHead>
                  <TableHead className="text-right w-[13%] hidden sm:table-cell">{t("discount")}</TableHead>
                  <TableHead className="text-right w-[13%]">{t("total")}</TableHead>
                  <TableHead className="w-[40px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cart.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-12 text-muted-foreground"
                    >
                      <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>{t("cartEmpty")}</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  cart.map((item) => (
                    <TableRow key={item.productId}>
                      <TableCell className="font-medium truncate max-w-[160px]">
                        {item.productName}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {item.units.length > 0 ? (
                          <select
                            value={item.productUnitId || ""}
                            onChange={(e) => changeUnit(item.productId, e.target.value)}
                            className="h-9 text-xs rounded-md border border-input bg-transparent px-2"
                          >
                            {item.units.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-xs text-muted-foreground">{item.unitName}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-11 w-11 lg:h-6 lg:w-6"
                            onClick={() =>
                              updateQuantity(item.productId, item.quantity - 1)
                            }
                          >
                            <Minus className="h-5 w-5 lg:h-3 lg:w-3" />
                          </Button>
                          <Input
                            type="number"
                            min="1"
                            max={item.stockQuantity}
                            value={item.quantity}
                            onChange={(e) =>
                              updateQuantity(
                                item.productId,
                                parseInt(e.target.value) || 1
                              )
                            }
                            className="h-11 w-16 lg:h-7 lg:w-14 text-center text-sm lg:text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-11 w-11 lg:h-6 lg:w-6"
                            onClick={() =>
                              updateQuantity(item.productId, item.quantity + 1)
                            }
                          >
                            <Plus className="h-5 w-5 lg:h-3 lg:w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono hidden sm:table-cell">
                        {t("currencySymbol")}{item.unitPrice.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right hidden sm:table-cell">
                        <Input
                          type="number"
                          min="0"
                          value={item.discount}
                          onChange={(e) => {
                            const d = parseFloat(e.target.value) || 0
                            setCart((prev) =>
                              prev.map((i) =>
                                i.productId === item.productId
                                  ? { ...i, discount: d }
                                  : i
                              )
                            )
                          }}
                          className="h-11 w-20 lg:h-7 lg:w-16 text-xs text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        {t("currencySymbol")}
                        {(
                          item.unitPrice * item.quantity -
                          item.discount
                        ).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-11 w-11 lg:h-6 lg:w-6"
                          onClick={() => removeItem(item.productId)}
                        >
                          <Trash2 className="h-5 w-5 lg:h-3 lg:w-3 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {cart.length > 0 && (
            <div className="flex justify-between">
              <Button variant="outline" size="sm" onClick={clearCart} className="h-11 lg:h-8">
                <X className="mr-2 h-4 w-4" />
                {t("clearCart")}
              </Button>
              <p className="text-xs text-muted-foreground self-center">
                {totalItems} {t("items")}
              </p>
            </div>
          )}
        </div>

        <div className="w-full lg:w-80 flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{t("summary")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("items")}</span>
                <span>{totalItems}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("subtotal")}</span>
                <span className="font-mono">{t("currencySymbol")}{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("discount")}</span>
                <span className="font-mono text-destructive">
                  -{t("currencySymbol")}{totalDiscount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("tax")}</span>
                <span className="font-mono">{t("currencySymbol")}{saleTax.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>{t("grandTotal")}</span>
                <span className="font-mono">{t("currencySymbol")}{grandTotal.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Label>{t("customer")}</Label>
            <Select
              value={selectedCustomerId}
              onValueChange={setSelectedCustomerId}
            >
              <SelectTrigger className="h-11 lg:h-9">
                <SelectValue placeholder={t("walkIn")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t("walkIn")}</SelectItem>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.firstName} {c.lastName || ""} - {c.phone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {customerPurchases.length > 0 && (
              <div className="mt-1 text-xs text-muted-foreground max-h-24 overflow-y-auto space-y-1 border rounded p-2">
                <p className="font-medium text-foreground">{t("recentPurchases")}</p>
                {customerPurchases.slice(0, 5).map((s: any) => (
                  <div key={s.id} className="flex justify-between">
                    <span>{s.saleNumber}</span>
                    <span>{t("currencySymbol")}{s.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t("discount")}</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className="h-11 lg:h-9"
            />
          </div>

          <div className="space-y-2">
            <Label>{t("tax")}</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={tax}
              onChange={(e) => setTax(e.target.value)}
              className="h-11 lg:h-9"
            />
          </div>

          <div className="space-y-2">
            <Label>{t("paymentMethod")}</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger className="h-11 lg:h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">{t("cash")}</SelectItem>
                <SelectItem value="ZAAD">ZAAD</SelectItem>
                <SelectItem value="EVC_PLUS">EVC Plus</SelectItem>
                <SelectItem value="SAHAL">Sahal</SelectItem>
                <SelectItem value="CARD">{t("card")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {paymentMethod === "CASH" && (
            <div className="space-y-2">
              <Label>{t("amountReceived")}</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                placeholder="0.00"
                className="h-11 lg:h-9"
              />
              {parseFloat(amountPaid) > 0 && (
                <p className="text-sm text-muted-foreground">
                  {t("change")}: {t("currencySymbol")}{changeGiven.toFixed(2)}
                </p>
              )}
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button
            className="w-full h-11 lg:h-10"
            size="lg"
            onClick={handleCheckout}
            disabled={checkingOut || cart.length === 0}
          >
            {checkingOut ? common("loading") : t("checkout")}
          </Button>
        </div>
      </div>

      {lastSale && showReceipt && (
        <div className="fixed inset-0 z-50 bg-background print:relative print:inset-auto print:z-auto">
          <div className="flex justify-end p-4 print:hidden">
            <Button variant="outline" onClick={() => setShowReceipt(false)}>
              {common("close")}
            </Button>
          </div>
          <Receipt
            sale={lastSale}
            storeName={storeInfo.name}
            storeAddress={storeInfo.address}
            storePhone={storeInfo.phone}
            onPrint={handlePrintReceipt}
          />
        </div>
      )}

      <Dialog open={showScanner} onOpenChange={setShowScanner}>
        <DialogContent className="sm:max-w-2xl w-full">
          <DialogHeader>
            <DialogTitle>{t("scanBarcodeTitle")}</DialogTitle>
          </DialogHeader>
          <div id="barcode-scanner" className="w-full h-[70dvh] min-h-[350px] max-h-[600px] bg-muted rounded-lg overflow-hidden" />
        </DialogContent>
      </Dialog>
    </>
  )
}
