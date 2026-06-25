import { useTranslations } from "next-intl"
import { ReportsPage } from "@/components/reports/reports-page"

export default function Reports() {
  const t = useTranslations("reports")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>
      <ReportsPage />
    </div>
  )
}
