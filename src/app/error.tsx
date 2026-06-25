"use client"

import { useEffect } from "react"
import { logger } from "@/lib/logger"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    logger.criticalError(error, { digest: error.digest })
  }, [error])

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-4 p-8">
            <h1 className="text-6xl font-bold text-destructive">500</h1>
            <h2 className="text-2xl font-semibold">Something went wrong!</h2>
            <p className="text-muted-foreground max-w-md">
              An unexpected error occurred. Our team has been notified.
            </p>
            <button
              onClick={reset}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
