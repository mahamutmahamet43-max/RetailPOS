import { useTranslations } from "next-intl"
import { CategoriesTable } from "@/components/categories/categories-table"

export default function CategoriesPage() {
  const t = useTranslations("categories")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>
      <CategoriesTable />
    </div>
  )
}
