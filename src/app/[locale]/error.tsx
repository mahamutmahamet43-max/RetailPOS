"use client"

import { useEffect } from "react"
import { useTranslations } from "next-intl"
import { logger } from "@/lib/logger"

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations("errors")

  useEffect(() => {
    logger.criticalError(error, { digest: error.digest, page: "locale" })
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 p-8">
        <h1 className="text-6xl font-bold text-destructive">500</h1>
        <h2 className="text-2xl font-semibold">{t("errorTitle")}</h2>
        <p className="text-muted-foreground max-w-md">
          {t("errorDescription")}
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {t("tryAgain")}
        </button>
      </div>
    </div>
  )
}
