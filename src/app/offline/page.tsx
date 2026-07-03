import Link from "next/link"

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="text-center space-y-6 max-w-md">
        <div className="text-6xl font-bold text-amber-500">!</div>
        <h1 className="text-2xl font-bold">Xiriirka Internet-ku Waa Go&apos;ay</h1>
        <p className="text-muted-foreground">
          Wali waxaad isticmaali kartaa RetailPOS. Iibka aad sameysid waa la kaydin doonaa oo wuu is-synci doonaa marka internet-ku soo laabto.
        </p>
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-sm text-left space-y-2">
          <p className="font-medium text-amber-800 dark:text-amber-200">✓ Waxaad weli karin kartaa:</p>
          <ul className="text-amber-700 dark:text-amber-300 space-y-1">
            <li>• Sawirista alaabta (barcode)</li>
            <li>• Iibinta (waxay kaydin doontaa oo is-synci doontaa)</li>
            <li>• Daabacadda rasiidka</li>
          </ul>
        </div>
        <div className="text-xs text-muted-foreground border-t pt-4">
          RetailPOS — Waxaa Loo Dhisay Ganacsiyada Soomaaliyeed
        </div>
        <Link
          href="/en/dashboard"
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
        >
          Isku Day
        </Link>
      </div>
    </div>
  )
}
