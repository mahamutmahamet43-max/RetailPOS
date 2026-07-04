"use client"

import * as React from "react"
import { Scan, Camera, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface BarcodeScannerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onBarcodeScanned: (barcode: string) => void
}

export function BarcodeScanner({ open, onOpenChange, onBarcodeScanned }: BarcodeScannerProps) {
  const [manualBarcode, setManualBarcode] = React.useState("")
  const [mode, setMode] = React.useState<"camera" | "manual">("camera")
  const [cameraError, setCameraError] = React.useState("")

  const scannerRef = React.useRef<any>(null)
  const containerId = "product-barcode-scanner"

  React.useEffect(() => {
    if (!open) return
    setMode("camera")
    setManualBarcode("")
    setCameraError("")
  }, [open])

  React.useEffect(() => {
    if (!open || mode !== "camera") return

    let running = false

    import("html5-qrcode").then(({ Html5Qrcode }) => {
      const scanner = new Html5Qrcode(containerId)
      scannerRef.current = scanner
      scanner.start(
        { facingMode: "environment" },
        { fps: 24, qrbox: { width: 500, height: 350 } },
        (decodedText: string) => {
          running = false
          scanner.stop().catch(() => {})
          scannerRef.current = null
          onBarcodeScanned(decodedText)
          onOpenChange(false)
        },
        () => {}
      ).then(() => { running = true }).catch(() => {
        setCameraError("Camera not available. Try manual entry.")
        setMode("manual")
      })
    }).catch(() => {
      setCameraError("Scanner library failed to load")
      setMode("manual")
    })

    return () => {
      if (scannerRef.current && running) {
        scannerRef.current.stop().catch(() => {})
        scannerRef.current = null
      }
    }
  }, [open, mode, onBarcodeScanned, onOpenChange])

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!manualBarcode.trim()) return
    onBarcodeScanned(manualBarcode.trim())
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan Barcode</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-3">
          <Button
            type="button"
            variant={mode === "camera" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("camera")}
          >
            <Camera className="mr-1 h-4 w-4" />
            Camera
          </Button>
          <Button
            type="button"
            variant={mode === "manual" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("manual")}
          >
            <Search className="mr-1 h-4 w-4" />
            Type
          </Button>
        </div>

        {mode === "camera" && (
          <div className="space-y-2">
            <div id={containerId} className="w-full aspect-video bg-muted rounded-lg overflow-hidden" />
            {cameraError && (
              <p className="text-xs text-destructive">{cameraError}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Point your camera at a barcode
            </p>
          </div>
        )}

        {mode === "manual" && (
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <Input
              value={manualBarcode}
              onChange={(e) => setManualBarcode(e.target.value)}
              placeholder="Enter barcode number..."
              autoFocus
            />
            <Button type="submit" className="w-full">
              <Scan className="mr-2 h-4 w-4" />
              Look Up
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

export function BarcodeLookupButton({ onBarcodeScanned }: { onBarcodeScanned: (barcode: string) => void }) {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="shrink-0"
        onClick={() => setOpen(true)}
        title="Scan or enter barcode"
      >
        <Scan className="h-4 w-4" />
      </Button>
      <BarcodeScanner
        open={open}
        onOpenChange={setOpen}
        onBarcodeScanned={onBarcodeScanned}
      />
    </>
  )
}
