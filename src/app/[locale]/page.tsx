import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { Store } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ModeToggle } from "@/components/mode-toggle"

export default function HomePage() {
  const t = useTranslations("app")
  const auth = useTranslations("auth")
  const locale = useLocale()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Store className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">{t("name")}</span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ModeToggle />
            <Button variant="ghost" asChild>
              <Link href={`/${locale}/login`}>{auth("login")}</Link>
            </Button>
            <Button asChild>
              <Link href={`/${locale}/register`}>{auth("register")}</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            {t("name")}
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("tagline")}
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href={`/${locale}/register`}>{auth("register")}</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href={`/${locale}/login`}>{auth("login")}</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  )
}
