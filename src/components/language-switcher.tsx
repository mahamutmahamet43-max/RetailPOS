"use client"

import * as React from "react"
import { Globe } from "lucide-react"
import { useTranslations } from "next-intl"
import { usePathname, useRouter } from "@/i18n/routing"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { locales, type Locale } from "@/i18n/routing"

export function LanguageSwitcher() {
  const t = useTranslations("language")
  const pathname = usePathname()
  const router = useRouter()
  const params = useParams()

  const currentLocale = params.locale as Locale

  function switchLocale(locale: Locale) {
    router.replace(pathname, { locale })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("switchTo")}>
          <Globe className="h-5 w-5" />
          <span className="sr-only">{t("switchTo")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => switchLocale(locale)}
            disabled={locale === currentLocale}
          >
            {t(locale)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
