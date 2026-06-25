import { useTranslations } from "next-intl"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PosPage } from "@/components/sales/pos-page"

export default function PosScreenPage() {
  const t = useTranslations("sales")

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Link href="../">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("posTitle")}</h1>
        </div>
      </div>
      <PosPage />
    </div>
  )
}
