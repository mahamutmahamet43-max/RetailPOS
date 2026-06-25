"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"

export default function LocaleNotFound() {
  const t = useTranslations("errors")
  const params = useParams()
  const locale = (params.locale as string) || "en"

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 p-8">
        <h1 className="text-6xl font-bold text-primary">404</h1>
        <h2 className="text-2xl font-semibold">{t("notFoundTitle")}</h2>
        <p className="text-muted-foreground max-w-md">
          {t("notFoundDescription")}
        </p>
        <Link
          href={`/${locale}/dashboard`}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {t("goHome")}
        </Link>
      </div>
    </div>
  )
}
