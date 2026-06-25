import { defineRouting } from "next-intl/routing"
import { createNavigation } from "next-intl/navigation"

export const locales = ["en", "so"] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = "en"

export const routing = defineRouting({
  locales,
  defaultLocale,
  localeDetection: true,
})

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing)
