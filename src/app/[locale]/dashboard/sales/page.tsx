import { useTranslations } from "next-intl"
import Link from "next/link"
import { ShoppingCart, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SalesHistory } from "@/components/sales/sales-history"

export default function SalesPage() {
  const t = useTranslations("sales")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        <Link href="./sales/pos">
          <Button size="lg">
            <ShoppingCart className="mr-2 h-5 w-5" />
            {t("openPos")}
          </Button>
        </Link>
      </div>
      <SalesHistory />
    </div>
  )
}
