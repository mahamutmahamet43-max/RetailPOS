"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Printer,
  X,
  User,
  Scan,
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
import { Receipt } from "@/components/sales/receipt"
import { BarcodeScanner } from "@/components/products/barcode-scanner"
import { getCachedProducts, getCachedCustomers, getCachedProductByBarcode } from "@/lib/offline-service"
import { addPendingSale } from "@/lib/sync-engine"

interface CartItem {
  productId: string
  productName: string
  barcode: string | null
  quantity: number
  unitPrice: number
  stockQuantity: number
  discount: number
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
  sellingPrice: number
  stockQuantity: number
}

export function PosPage() {
  const t = useTranslations("sales")
  const common = useTranslations("common")

  const [barcode, setBarcode] = React.useState("")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [searchResults, setSearchResults] = React.useState<ProductResult[]>([])
  const [cart, setCart] = React.useState<CartItem[]>([])
  const [customers, setCustomers] = React.useState<Customer[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = React.useState("")
  const [paymentMethod, setPaymentMethod] = React.useState("CASH")
  const [amountPaid, setAmountPaid] = React.useState("")
  const [discount, setDiscount] = React.useState("0")
  const [tax, setTax] = React.useState("0")
  const [checkingOut, setCheckingOut] = React.useState(false)
  const [error, setError] = React.useState("")
  const [lastSale, setLastSale] = React.useState<any>(null)
  const [showReceipt, setShowReceipt] = React.useState(false)
  const [scannerOpen, setScannerOpen] = React.useState(false)
  const [paymentReference, setPaymentReference] = React.useState("")
  const barcodeRef = React.useRef<HTMLInputElement>(null)
  const searchRef = React.useRef<HTMLInputElement>(null)

  const [isOnline, setIsOnline] = React.useState(true)

  React.useEffect(() => {
    setIsOnline(navigator.onLine)
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const subtotal = cart.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  )
  const cartDiscount = cart.reduce((sum, item) => sum + item.discount, 0)
  const saleDiscount = parseFloat(discount) || 0
  const saleTax = parseFloat(tax) || 0
  const totalDiscount = cartDiscount + saleDiscount
  const grandTotal = Math.max(0, subtotal - totalDiscount + saleTax)
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
  const changeGiven = Math.max(0, (parseFloat(amountPaid) || 0) - grandTotal)

  React.useEffect(() => {
    if (barcodeRef.current) barcodeRef.current.focus()
  }, [])

  React.useEffect(() => {
    fetch("/api/customers?limit=1000")
      .then((r) => r.json())
      .then((data) => setCustomers(data.customers || []))
      .catch(async () => {
        try {
          const cached = await getCachedCustomers()
          setCustomers(cached.map(c => ({
            id: c.id, firstName: c.firstName, lastName: c.lastName,
            phone: c.phone, customerCode: (c as any).customerCode
          })))
        } catch {}
      })
  }, [])

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
        if (product && product.stockQuantity > 0) {
          addToCart(product)
        }
      }
    } catch {
      try {
        const cachedProduct = await getCachedProductByBarcode(barcode.trim())
        if (cachedProduct && cachedProduct.stockQuantity > 0) {
          addToCart({
            id: cachedProduct.id,
            name: cachedProduct.name,
            barcode: cachedProduct.barcode,
            sku: cachedProduct.sku,
            sellingPrice: cachedProduct.sellingPrice,
            stockQuantity: cachedProduct.stockQuantity,
          })
        }
      } catch {}
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
        .catch(async () => {
          try {
            const cached = await getCachedProducts(searchQuery)
            setSearchResults(cached.map(p => ({
              id: p.id, name: p.name, barcode: p.barcode, sku: p.sku,
              sellingPrice: p.sellingPrice, stockQuantity: p.stockQuantity
            })))
          } catch {}
        })
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  function addToCart(product: ProductResult) {
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
      if (product.stockQuantity <= 0) return prev
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          barcode: product.barcode,
          quantity: 1,
          unitPrice: product.sellingPrice,
          stockQuantity: product.stockQuantity,
          discount: 0,
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
      const maxDiscount = item.unitPrice * newQty
      return prev.map((i) =>
        i.productId === productId
          ? { ...i, quantity: newQty, discount: Math.min(i.discount, maxDiscount) }
          : i
      )
    })
  }

  function removeItem(productId: string) {
    setCart((prev) => prev.filter((i) => i.productId !== productId))
  }

  function clearCart() {
    setCart([])
    setDiscount("0")
    setTax("0")
    setAmountPaid("")
    setPaymentReference("")
    setError("")
    setSelectedCustomerId("")
    setPaymentMethod("CASH")
  }

  async function handleBarcodeScanned(scannedBarcode: string) {
    try {
      const res = await fetch(
        `/api/products?search=${encodeURIComponent(scannedBarcode)}&limit=1`
      )
      if (res.ok) {
        const data = await res.json()
        const product = data.products?.[0]
        if (product && product.stockQuantity > 0) {
          addToCart(product)
        }
      }
    } catch {
      try {
        const cachedProduct = await getCachedProductByBarcode(scannedBarcode)
        if (cachedProduct && cachedProduct.stockQuantity > 0) {
          addToCart({
            id: cachedProduct.id,
            name: cachedProduct.name,
            barcode: cachedProduct.barcode,
            sku: cachedProduct.sku,
            sellingPrice: cachedProduct.sellingPrice,
            stockQuantity: cachedProduct.stockQuantity,
          })
        }
      } catch {}
    }
  }

  async function handleCheckout() {
    if (cart.length === 0) {
      setError(t("emptyCart"))
      return
    }
    if (grandTotal < 0) {
      setError(t("invalidDiscount") || "Discount exceeds total")
      return
    }
    if (paymentMethod === "CASH" && (!amountPaid || parseFloat(amountPaid) < grandTotal)) {
      setError(t("insufficientPayment"))
      return
    }
    if (paymentMethod === "CREDIT" && !selectedCustomerId) {
      setError(t("customerRequired") || "Customer is required for credit sales")
      return
    }
    if (paymentMethod === "CREDIT") {
      const paid = parseFloat(amountPaid) || 0
      if (paid > grandTotal) {
        setError(t("overpayment") || "Payment cannot exceed total for credit sales")
        return
      }
    }
    if (paymentMethod !== "CASH" && paymentMethod !== "CREDIT" && !paymentReference.trim()) {
      setError(t("paymentReferenceRequired") || "Payment reference is required")
      return
    }
    setCheckingOut(true)
    setError("")

    const cartBackup = [...cart]
    const selectedCustomerBackup = selectedCustomerId
    const discountBackup = discount
    const taxBackup = tax
    const amountPaidBackup = amountPaid
    const paymentMethodBackup = paymentMethod
    const backupGrandTotal = grandTotal
    const saleLocalId = `pos-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    clearCart()

    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cartBackup.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            barcode: item.barcode,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
          })),
          customerId: selectedCustomerBackup || null,
          paymentMethod,
          amountPaid: paymentMethod === "CASH" ? parseFloat(amountPaidBackup) : (parseFloat(amountPaidBackup) || (paymentMethod === "CREDIT" ? 0 : backupGrandTotal)),
          discount: parseFloat(discountBackup) || 0,
          tax: parseFloat(taxBackup) || 0,
          localId: saleLocalId,
        }),
      })

      if (!res.ok) {
        setCart(cartBackup)
        setSelectedCustomerId(selectedCustomerBackup)
        setDiscount(discountBackup)
        setTax(taxBackup)
        setAmountPaid(amountPaidBackup)
        setPaymentMethod(paymentMethodBackup)
        const data = await res.json()
        setError(data.error || common("error"))
        return
      }

      const sale = await res.json()
      setLastSale(sale)
      setShowReceipt(true)
    } catch {
      if (!navigator.onLine) {
        const localId = `offline-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
        await addPendingSale(localId, {
          items: cartBackup.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            barcode: item.barcode,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
          })),
          customerId: selectedCustomerBackup || null,
          paymentMethod: paymentMethodBackup,
          amountPaid: paymentMethodBackup === "CASH" ? parseFloat(amountPaidBackup) : (parseFloat(amountPaidBackup) || (paymentMethodBackup === "CREDIT" ? 0 : backupGrandTotal)),
          discount: parseFloat(discountBackup) || 0,
          tax: parseFloat(taxBackup) || 0,
          localId: localId,
        })
        setError("")
        setLastSale({ saleNumber: "OFFLINE-" + localId.slice(-6), items: cartBackup, total: backupGrandTotal, offline: true })
        setShowReceipt(true)
        return
      }
      setCart(cartBackup)
      setSelectedCustomerId(selectedCustomerBackup)
      setDiscount(discountBackup)
      setTax(taxBackup)
      setAmountPaid(amountPaidBackup)
      setPaymentMethod(paymentMethodBackup)
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

  const storeInfo = {
    name: "RetailPOS",
    address: "",
    phone: "",
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
                className="pl-8 pr-10 h-11 lg:h-9"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-11 w-11 lg:h-9 lg:w-9"
                onClick={() => setScannerOpen(true)}
                title="Scan barcode with camera"
              >
                <Scan className="h-4 w-4" />
              </Button>
            </div>
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
                      <div>
                        <span className="font-medium">{product.name}</span>
                        {product.barcode && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            {product.barcode}
                          </span>
                        )}
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <div>${product.sellingPrice.toFixed(2)}</div>
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
                  <TableHead className="w-[40%]">{t("product")}</TableHead>
                  <TableHead className="text-right w-[15%]">{t("qty")}</TableHead>
                  <TableHead className="text-right w-[15%] hidden sm:table-cell">{t("price")}</TableHead>
                  <TableHead className="text-right w-[15%] hidden sm:table-cell">{t("discount")}</TableHead>
                  <TableHead className="text-right w-[15%]">{t("total")}</TableHead>
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
                      <TableCell className="font-medium truncate max-w-[200px]">
                        {item.productName}
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
                        ${item.unitPrice.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right hidden sm:table-cell">
                        <Input
                          type="number"
                          min="0"
                          value={item.discount}
                          onChange={(e) => {
                            const d = Math.max(0, Math.min(parseFloat(e.target.value) || 0, item.unitPrice * item.quantity))
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
                        $
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
                <span className="font-mono">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("discount")}</span>
                <span className="font-mono text-destructive">
                  -${totalDiscount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("tax")}</span>
                <span className="font-mono">${saleTax.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>{t("grandTotal")}</span>
                <span className="font-mono">${grandTotal.toFixed(2)}</span>
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
          </div>

          <div className="space-y-2">
            <Label>{t("discount")}</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={discount}
              onChange={(e) => {
                const val = Math.max(0, parseFloat(e.target.value) || 0)
                setDiscount(val.toString())
              }}
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
              onChange={(e) => { const val = Math.max(0, parseFloat(e.target.value) || 0); setTax(val.toString()) }}
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
                <SelectItem value="CREDIT">{t("credit") || "Credit / Deyn"}</SelectItem>
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
                  {t("change")}: ${changeGiven.toFixed(2)}
                </p>
              )}
            </div>
          )}

          {paymentMethod === "CREDIT" && (
            <div className="space-y-2">
              {!selectedCustomerId && (
                <p className="text-sm text-destructive">
                  {t("selectCustomerForCredit") || "Select a customer before processing credit sale"}
                </p>
              )}
              <Label>{t("amountPaid") || "Amount Paid Now"}</Label>
              <Input
                type="number"
                min="0"
                max={grandTotal}
                step="0.01"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                placeholder="0.00"
                className="h-11 lg:h-9"
              />
              {parseFloat(amountPaid) > 0 && parseFloat(amountPaid) < grandTotal && (
                <p className="text-sm text-muted-foreground">
                  {t("remainingBalance") || "Remaining"}: ${(grandTotal - parseFloat(amountPaid)).toFixed(2)}
                </p>
              )}
            </div>
          )}

          {paymentMethod !== "CASH" && paymentMethod !== "CREDIT" && (
            <div className="space-y-2">
              <Label>{t("paymentReference") || "Payment Reference"}</Label>
              <Input
                type="text"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder={t("paymentReferencePlaceholder") || "Transaction ID / Reference"}
                className="h-11 lg:h-9"
              />
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {!isOnline && (
            <p className="text-xs text-amber-600 text-center">
              Offline — sale will sync when connected
            </p>
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

      <BarcodeScanner
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onBarcodeScanned={handleBarcodeScanned}
      />
    </>
  )
}
