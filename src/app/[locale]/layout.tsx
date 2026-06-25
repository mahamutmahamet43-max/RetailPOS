import { NextIntlClientProvider } from "next-intl"
import { getMessages, getLocale } from "next-intl/server"
import { Inter } from "next/font/google"
import { Providers } from "@/components/providers"
import type { Metadata } from "next"
import "../globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "RetailPOS",
    template: "%s | RetailPOS",
  },
  description: "Modern point of sale for your business",
}

export default async function LocaleLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
