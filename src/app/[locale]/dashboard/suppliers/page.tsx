import { useTranslations } from "next-intl"
import { SuppliersTable } from "@/components/suppliers/suppliers-table"

export default function SuppliersPage() {
  const t = useTranslations("suppliers")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>
      <SuppliersTable />
    </div>
  )
}
